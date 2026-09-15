import sqlite3
import json
import os
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from .models import Complaint, ComplaintStatus, DefectSeverity, TimelineEvent

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

# Normalize Postgres connection string if needed (e.g. postgres:// to postgresql://)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

IS_POSTGRES = bool(DATABASE_URL)
DB_FILE = os.path.join(os.path.dirname(__file__), "complaints.db")

psycopg2 = None
if IS_POSTGRES:
    try:
        import psycopg2
        import psycopg2.extras
        print(f"[Database] Detected DATABASE_URL, attempting to use PostgreSQL...")
    except ImportError:
        print("[Database] Warning: psycopg2 not installed. Falling back to SQLite.")
        IS_POSTGRES = False


class DBWrapper:
    def __init__(self):
        self.is_postgres = IS_POSTGRES

    def get_connection(self):
        if self.is_postgres:
            try:
                conn = psycopg2.connect(DATABASE_URL)
                return conn
            except Exception as e:
                print(f"[Database] PostgreSQL connection failed ({e}), falling back to SQLite: {DB_FILE}")
                self.is_postgres = False
        
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        return conn

    def adapt_query(self, query: str) -> str:
        """Adapts SQL query placeholders between SQLite (?) and PostgreSQL (%s)"""
        if self.is_postgres:
            # Replace ? with %s
            return query.replace("?", "%s")
        else:
            # Replace %s with ?
            return query.replace("%s", "?")

db = DBWrapper()


def init_db():
    conn = db.get_connection()
    cursor = conn.cursor()
    
    if db.is_postgres:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id VARCHAR(64) PRIMARY KEY,
            created_at VARCHAR(64) NOT NULL,
            updated_at VARCHAR(64) NOT NULL,
            image TEXT NOT NULL,
            annotated_image TEXT,
            detection_result TEXT,
            confidence REAL NOT NULL,
            severity VARCHAR(32) NOT NULL,
            latitude REAL,
            longitude REAL,
            address TEXT NOT NULL,
            description TEXT,
            citizen_name VARCHAR(128),
            citizen_email VARCHAR(128),
            citizen_phone VARCHAR(64),
            status VARCHAR(32) NOT NULL,
            assigned_department VARCHAR(128),
            assigned_officer VARCHAR(128),
            internal_notes TEXT,
            timeline TEXT,
            resolution_note TEXT,
            resolution_images TEXT
        );
        """)
    else:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            image TEXT NOT NULL,
            annotated_image TEXT,
            detection_result TEXT,
            confidence REAL NOT NULL,
            severity TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            address TEXT NOT NULL,
            description TEXT,
            citizen_name TEXT,
            citizen_email TEXT,
            citizen_phone TEXT,
            status TEXT NOT NULL,
            assigned_department TEXT,
            assigned_officer TEXT,
            internal_notes TEXT,
            timeline TEXT,
            resolution_note TEXT,
            resolution_images TEXT
        )
        """)
    conn.commit()

    # Migration safety for columns if older schema exists
    if not db.is_postgres:
        cursor.execute("PRAGMA table_info(complaints)")
        columns = [row[1] for row in cursor.fetchall()]
        if "citizen_email" not in columns:
            try:
                cursor.execute("ALTER TABLE complaints ADD COLUMN citizen_email TEXT")
                conn.commit()
            except Exception:
                pass
        if "citizen_phone" not in columns:
            try:
                cursor.execute("ALTER TABLE complaints ADD COLUMN citizen_phone TEXT")
                conn.commit()
            except Exception:
                pass

    # Check if complaints table is empty or has old synthetic SVGs; re-seed with realistic photos
    cursor.execute("SELECT COUNT(*) FROM complaints")
    count = cursor.fetchone()[0]
    
    # Check if existing rows contain legacy synthetic SVG strings
    cursor.execute("SELECT COUNT(*) FROM complaints WHERE image LIKE 'data:image/svg%' OR annotated_image LIKE 'data:image/svg%'")
    has_legacy_svg = cursor.fetchone()[0] > 0
    conn.close()

    if count == 0 or has_legacy_svg:
        print("[Database] Seeding/Updating database with realistic road defect photos...")
        seed_initial_data(force=has_legacy_svg)


def row_to_dict(row, cursor=None) -> dict:
    if isinstance(row, sqlite3.Row):
        return dict(row)
    if cursor and cursor.description:
        col_names = [col[0] for col in cursor.description]
        return dict(zip(col_names, row))
    if isinstance(row, dict):
        return row
    return {}


def dict_to_complaint(d: dict) -> Complaint:
    timeline_raw = d.get("timeline")
    timeline_parsed = []
    if timeline_raw:
        try:
            timeline_items = json.loads(timeline_raw) if isinstance(timeline_raw, str) else timeline_raw
            timeline_parsed = [TimelineEvent(**item) for item in timeline_items]
        except Exception:
            pass

    notes_raw = d.get("internal_notes")
    notes_parsed = []
    if notes_raw:
        try:
            notes_parsed = json.loads(notes_raw) if isinstance(notes_raw, str) else notes_raw
        except Exception:
            pass

    res_images_raw = d.get("resolution_images")
    res_images_parsed = []
    if res_images_raw:
        try:
            res_images_parsed = json.loads(res_images_raw) if isinstance(res_images_raw, str) else res_images_raw
        except Exception:
            pass

    det_result_raw = d.get("detection_result")
    det_result_parsed = None
    if det_result_raw:
        try:
            det_result_parsed = json.loads(det_result_raw) if isinstance(det_result_raw, str) else det_result_raw
        except Exception:
            pass

    return Complaint(
        id=d.get("id", ""),
        created_at=d.get("created_at", ""),
        updated_at=d.get("updated_at", ""),
        image=d.get("image", ""),
        annotated_image=d.get("annotated_image"),
        detection_result=det_result_parsed,
        confidence=float(d.get("confidence", 0.90)),
        severity=DefectSeverity(d.get("severity", "MEDIUM")),
        latitude=d.get("latitude"),
        longitude=d.get("longitude"),
        address=d.get("address", "Municipal Road"),
        description=d.get("description") or "",
        citizen_name=d.get("citizen_name") or "Citizen User",
        citizen_email=d.get("citizen_email") or "",
        citizen_phone=d.get("citizen_phone") or "",
        status=ComplaintStatus(d.get("status", "NEW")),
        assigned_department=d.get("assigned_department") or "Unassigned",
        assigned_officer=d.get("assigned_officer") or "Unassigned",
        internal_notes=notes_parsed,
        timeline=timeline_parsed,
        resolution_note=d.get("resolution_note"),
        resolution_images=res_images_parsed
    )


def create_complaint_record(
    image: str,
    annotated_image: Optional[str],
    detection_result: Optional[Dict[str, Any]],
    confidence: float,
    severity: DefectSeverity,
    latitude: Optional[float],
    longitude: Optional[float],
    address: str,
    description: Optional[str] = "",
    citizen_name: Optional[str] = "Citizen User",
    citizen_email: Optional[str] = "",
    citizen_phone: Optional[str] = "",
    custom_id: Optional[str] = None
) -> Complaint:
    conn = db.get_connection()
    cursor = conn.cursor()
    
    if custom_id:
        complaint_id = custom_id
    else:
        cursor.execute("SELECT COUNT(*) FROM complaints")
        count = cursor.fetchone()[0] + 101
        complaint_id = f"CMP-2026-{count:04d}"
    
    now_iso = datetime.now(timezone.utc).isoformat()
    initial_timeline = [
        {
            "timestamp": now_iso,
            "status": ComplaintStatus.NEW.value,
            "description": "Complaint submitted via AI Citizen Reporting App.",
            "actor": citizen_name or "Citizen"
        }
    ]
    
    query = """
    INSERT INTO complaints (
        id, created_at, updated_at, image, annotated_image, detection_result,
        confidence, severity, latitude, longitude, address, description,
        citizen_name, citizen_email, citizen_phone, status, assigned_department, assigned_officer,
        internal_notes, timeline, resolution_note, resolution_images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = (
        complaint_id,
        now_iso,
        now_iso,
        image,
        annotated_image,
        json.dumps(detection_result) if detection_result else None,
        confidence,
        severity.value,
        latitude,
        longitude,
        address or "Verified Road Location",
        description or "",
        citizen_name or "Citizen User",
        citizen_email or "",
        citizen_phone or "",
        ComplaintStatus.NEW.value,
        "Public Works Department",
        "Unassigned",
        json.dumps([]),
        json.dumps(initial_timeline),
        None,
        json.dumps([])
    )
    
    cursor.execute(db.adapt_query(query), params)
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)


def get_complaints(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    citizen_email: Optional[str] = None,
    citizen_phone: Optional[str] = None
) -> List[Complaint]:
    conn = db.get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM complaints WHERE 1=1"
    params = []
    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status)
    if severity and severity != "ALL":
        query += " AND severity = ?"
        params.append(severity)
    if citizen_email:
        query += " AND citizen_email = ?"
        params.append(citizen_email)
    if citizen_phone:
        query += " AND citizen_phone = ?"
        params.append(citizen_phone)
    if search:
        query += " AND (id LIKE ? OR address LIKE ? OR description LIKE ? OR citizen_name LIKE ? OR citizen_phone LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term, term])
    query += " ORDER BY created_at DESC"
    
    cursor.execute(db.adapt_query(query), params)
    rows = cursor.fetchall()
    complaints = [dict_to_complaint(row_to_dict(r, cursor)) for r in rows]
    conn.close()
    return complaints


def get_complaint_by_id(complaint_id: str) -> Optional[Complaint]:
    conn = db.get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM complaints WHERE id = ?"
    cursor.execute(db.adapt_query(query), (complaint_id,))
    row = cursor.fetchone()
    if row:
        c = dict_to_complaint(row_to_dict(row, cursor))
        conn.close()
        return c
    conn.close()
    return None


def update_complaint_status(
    complaint_id: str,
    new_status: ComplaintStatus,
    note: Optional[str] = None,
    actor: str = "Authority Officer"
) -> Optional[Complaint]:
    complaint = get_complaint_by_id(complaint_id)
    if not complaint:
        return None
        
    now_iso = datetime.now(timezone.utc).isoformat()
    timeline = complaint.timeline
    timeline.append(TimelineEvent(
        timestamp=now_iso,
        status=new_status.value,
        description=note or f"Status transitioned to {new_status.value}.",
        actor=actor
    ))
    
    internal_notes = complaint.internal_notes
    if note:
        internal_notes.append(f"[{new_status.value}] {note} (by {actor} at {now_iso[:19]})")
        
    conn = db.get_connection()
    cursor = conn.cursor()
    query = """
    UPDATE complaints 
    SET status = ?, updated_at = ?, timeline = ?, internal_notes = ?
    WHERE id = ?
    """
    cursor.execute(db.adapt_query(query), (
        new_status.value,
        now_iso,
        json.dumps([t.model_dump() for t in timeline]),
        json.dumps(internal_notes),
        complaint_id
    ))
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)


def assign_complaint(
    complaint_id: str,
    department: str,
    officer: str,
    note: Optional[str] = None,
    actor: str = "Admin Officer"
) -> Optional[Complaint]:
    complaint = get_complaint_by_id(complaint_id)
    if not complaint:
        return None
        
    now_iso = datetime.now(timezone.utc).isoformat()
    timeline = complaint.timeline
    timeline.append(TimelineEvent(
        timestamp=now_iso,
        status=ComplaintStatus.ASSIGNED.value,
        description=f"Assigned to {officer} ({department}). {note or ''}".strip(),
        actor=actor
    ))
    
    conn = db.get_connection()
    cursor = conn.cursor()
    query = """
    UPDATE complaints
    SET assigned_department = ?, assigned_officer = ?, status = ?, updated_at = ?, timeline = ?
    WHERE id = ?
    """
    cursor.execute(db.adapt_query(query), (
        department,
        officer,
        ComplaintStatus.ASSIGNED.value,
        now_iso,
        json.dumps([t.model_dump() for t in timeline]),
        complaint_id
    ))
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)


def resolve_complaint(
    complaint_id: str,
    resolution_note: str,
    resolution_images: List[str],
    actor: str = "Field Inspector"
) -> Optional[Complaint]:
    complaint = get_complaint_by_id(complaint_id)
    if not complaint:
        return None
        
    now_iso = datetime.now(timezone.utc).isoformat()
    timeline = complaint.timeline
    timeline.append(TimelineEvent(
        timestamp=now_iso,
        status=ComplaintStatus.RESOLVED.value,
        description=f"Repair completed and verified. Note: {resolution_note}",
        actor=actor
    ))
    
    conn = db.get_connection()
    cursor = conn.cursor()
    query = """
    UPDATE complaints
    SET status = ?, resolution_note = ?, resolution_images = ?, updated_at = ?, timeline = ?
    WHERE id = ?
    """
    cursor.execute(db.adapt_query(query), (
        ComplaintStatus.RESOLVED.value,
        resolution_note,
        json.dumps(resolution_images),
        now_iso,
        json.dumps([t.model_dump() for t in timeline]),
        complaint_id
    ))
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)


# Realistic road defect photo paths
SAMPLE_POTHOLE_IMG = "/images/demo_pothole_1.jpg"
SAMPLE_ANNOTATED_IMG = "/images/demo_pothole_1.jpg"
SAMPLE_RESOLVED_IMG = "/images/demo_pothole_3.jpg"


def seed_initial_data(force: bool = False):
    """
    Seeds comprehensive initial realistic data so the app is always fully functional
    even if deployed on Render free tier with ephemeral storage.
    """
    conn = db.get_connection()
    cursor = conn.cursor()
    
    if force:
        cursor.execute("DELETE FROM complaints")
        conn.commit()

    now = datetime.now(timezone.utc)
    
    demo_records = [
        {
            "id": "CMP-2026-0101",
            "created_at": (now - timedelta(hours=2)).isoformat(),
            "updated_at": (now - timedelta(hours=1)).isoformat(),
            "image": "/images/demo_pothole_1.jpg",
            "annotated_image": "/images/demo_pothole_1.jpg",
            "detection_result": json.dumps({
                "detected": True,
                "pothole_count": 1,
                "confidence": 0.96,
                "severity": "HIGH",
                "detections": [{"class_name": "pothole", "confidence": 0.96, "bbox": [110, 170, 490, 390], "area_ratio": 0.28}]
            }),
            "confidence": 0.96,
            "severity": "HIGH",
            "latitude": 19.0596,
            "longitude": 72.8295,
            "address": "Linking Road near Khar Telephone Exchange, Bandra West, Mumbai",
            "description": "Deep asphalt crater on middle lane near signal causing severe traffic bottleneck.",
            "citizen_name": "Aarav Deshmukh",
            "citizen_email": "aarav.deshmukh@gmail.com",
            "citizen_phone": "+91 98201 45890",
            "status": "IN PROGRESS",
            "assigned_department": "H-West Ward Road Maintenance",
            "assigned_officer": "R. Deshmukh (Chief Engineer)",
            "internal_notes": json.dumps([
                "[ASSIGNED] Assigned to Quick Response Asphalt Crew Alpha (by Admin Officer)",
                "[IN PROGRESS] Cold mix asphalt patch truck dispatched on site (by R. Deshmukh)"
            ]),
            "timeline": json.dumps([
                {"timestamp": (now - timedelta(hours=2)).isoformat(), "status": "NEW", "description": "Complaint submitted via AI Citizen Reporting App.", "actor": "Aarav Deshmukh"},
                {"timestamp": (now - timedelta(hours=1, minutes=40)).isoformat(), "status": "UNDER REVIEW", "description": "AI verified with 96% confidence. Priority escalated to HIGH.", "actor": "AI Triage System"},
                {"timestamp": (now - timedelta(hours=1, minutes=20)).isoformat(), "status": "ASSIGNED", "description": "Assigned to R. Deshmukh (H-West Ward Road Maintenance).", "actor": "Admin Officer"},
                {"timestamp": (now - timedelta(hours=1)).isoformat(), "status": "IN PROGRESS", "description": "Asphalt patching crew dispatched to Linking Road.", "actor": "R. Deshmukh"}
            ]),
            "resolution_note": None,
            "resolution_images": json.dumps([])
        },
        {
            "id": "CMP-2026-0102",
            "created_at": (now - timedelta(hours=5)).isoformat(),
            "updated_at": (now - timedelta(hours=3)).isoformat(),
            "image": "/images/demo_pothole_2.jpg",
            "annotated_image": "/images/demo_pothole_2.jpg",
            "detection_result": json.dumps({
                "detected": True,
                "pothole_count": 2,
                "confidence": 0.89,
                "severity": "MEDIUM",
                "detections": [{"class_name": "pothole", "confidence": 0.89, "bbox": [140, 200, 420, 360], "area_ratio": 0.14}]
            }),
            "confidence": 0.89,
            "severity": "MEDIUM",
            "latitude": 19.1136,
            "longitude": 72.8697,
            "address": "Andheri-Kurla Road, Near Chakala Metro Pillar #84, Andheri East, Mumbai",
            "description": "Surface degradation and uneven depression causing two-wheeler skids.",
            "citizen_name": "Neha Kulkarni",
            "citizen_email": "neha.kulkarni@yahoo.co.in",
            "citizen_phone": "+91 98334 12789",
            "status": "ASSIGNED",
            "assigned_department": "K-East Ward Infrastructure",
            "assigned_officer": "S. Patil (Junior Road Inspector)",
            "internal_notes": json.dumps([
                "[ASSIGNED] Work order #K-E-4491 issued to road contractor (by Admin Officer)"
            ]),
            "timeline": json.dumps([
                {"timestamp": (now - timedelta(hours=5)).isoformat(), "status": "NEW", "description": "Complaint submitted via AI Citizen Reporting App.", "actor": "Neha Kulkarni"},
                {"timestamp": (now - timedelta(hours=4, minutes=30)).isoformat(), "status": "UNDER REVIEW", "description": "Geotag verified on metro corridor route.", "actor": "AI Triage System"},
                {"timestamp": (now - timedelta(hours=3)).isoformat(), "status": "ASSIGNED", "description": "Assigned to S. Patil (K-East Ward Infrastructure).", "actor": "Admin Officer"}
            ]),
            "resolution_note": None,
            "resolution_images": json.dumps([])
        },
        {
            "id": "CMP-2026-0103",
            "created_at": (now - timedelta(days=1)).isoformat(),
            "updated_at": (now - timedelta(hours=4)).isoformat(),
            "image": "/images/demo_pothole_3.jpg",
            "annotated_image": "/images/demo_pothole_3.jpg",
            "detection_result": json.dumps({
                "detected": True,
                "pothole_count": 1,
                "confidence": 0.94,
                "severity": "HIGH",
                "detections": [{"class_name": "pothole", "confidence": 0.94, "bbox": [100, 160, 500, 380], "area_ratio": 0.32}]
            }),
            "confidence": 0.94,
            "severity": "HIGH",
            "latitude": 19.0178,
            "longitude": 72.8478,
            "address": "Senapati Bapat Marg, Near Elphinstone Flyover, Dadar West, Mumbai",
            "description": "Large road cavity repaired using high-grade mastic asphalt compound.",
            "citizen_name": "Vikram Mehta",
            "citizen_email": "vikram.mehta@outlook.com",
            "citizen_phone": "+91 97690 88214",
            "status": "RESOLVED",
            "assigned_department": "G-North Ward Maintenance",
            "assigned_officer": "K. Shinde (Assistant Engineer)",
            "internal_notes": json.dumps([
                "[ASSIGNED] Priority road repair dispatch under 24-hr SLA guarantee.",
                "[RESOLVED] Asphalt leveling and bitumen sealing completed successfully."
            ]),
            "timeline": json.dumps([
                {"timestamp": (now - timedelta(days=1)).isoformat(), "status": "NEW", "description": "Complaint submitted via AI Citizen Reporting App.", "actor": "Vikram Mehta"},
                {"timestamp": (now - timedelta(hours=20)).isoformat(), "status": "ASSIGNED", "description": "Assigned to K. Shinde (G-North Ward Maintenance).", "actor": "Admin Officer"},
                {"timestamp": (now - timedelta(hours=12)).isoformat(), "status": "IN PROGRESS", "description": "Night-shift mastic asphalt crew deployed.", "actor": "K. Shinde"},
                {"timestamp": (now - timedelta(hours=4)).isoformat(), "status": "RESOLVED", "description": "Repair completed and verified. Leveling tests passed.", "actor": "K. Shinde"}
            ]),
            "resolution_note": "Pothole filled with heavy-duty mastic asphalt. Compaction test verified. Ready for full traffic.",
            "resolution_images": json.dumps(["/images/demo_pothole_3.jpg"])
        },
        {
            "id": "CMP-2026-0104",
            "created_at": (now - timedelta(minutes=25)).isoformat(),
            "updated_at": (now - timedelta(minutes=25)).isoformat(),
            "image": "/images/demo_pothole_1.jpg",
            "annotated_image": "/images/demo_pothole_1.jpg",
            "detection_result": json.dumps({
                "detected": True,
                "pothole_count": 1,
                "confidence": 0.91,
                "severity": "HIGH",
                "detections": [{"class_name": "pothole", "confidence": 0.91, "bbox": [150, 180, 480, 370], "area_ratio": 0.22}]
            }),
            "confidence": 0.91,
            "severity": "HIGH",
            "latitude": 18.9986,
            "longitude": 72.8174,
            "address": "Dr. Annie Besant Road, Near Nehru Science Centre, Worli, Mumbai",
            "description": "Fresh crater spotted during monsoon shower; potential risk to bikers.",
            "citizen_name": "Priya Sharma",
            "citizen_email": "priya.sharma@gmail.com",
            "citizen_phone": "+91 98112 33445",
            "status": "NEW",
            "assigned_department": "G-South Ward Maintenance",
            "assigned_officer": "Unassigned",
            "internal_notes": json.dumps([]),
            "timeline": json.dumps([
                {"timestamp": (now - timedelta(minutes=25)).isoformat(), "status": "NEW", "description": "Complaint submitted via AI Citizen Reporting App.", "actor": "Priya Sharma"}
            ]),
            "resolution_note": None,
            "resolution_images": json.dumps([])
        },
        {
            "id": "CMP-2026-0105",
            "created_at": (now - timedelta(hours=8)).isoformat(),
            "updated_at": (now - timedelta(hours=2)).isoformat(),
            "image": "/images/demo_pothole_2.jpg",
            "annotated_image": "/images/demo_pothole_2.jpg",
            "detection_result": json.dumps({
                "detected": True,
                "pothole_count": 1,
                "confidence": 0.93,
                "severity": "MEDIUM",
                "detections": [{"class_name": "pothole", "confidence": 0.93, "bbox": [120, 190, 460, 360], "area_ratio": 0.18}]
            }),
            "confidence": 0.93,
            "severity": "MEDIUM",
            "latitude": 19.0601,
            "longitude": 72.8335,
            "address": "SV Road, Bandra West, Mumbai",
            "description": "Deep asphalt trench causing heavy traffic congestion near junction.",
            "citizen_name": "Farhan Sayed",
            "citizen_email": "farhan.sayed@gmail.com",
            "citizen_phone": "+91 98205 66778",
            "status": "RESOLVED",
            "assigned_department": "H-West Ward Infrastructure",
            "assigned_officer": "M. Ansari (Ward Inspector)",
            "internal_notes": json.dumps([
                "[RESOLVED] Filled with cold asphalt mix, leveled and compacted."
            ]),
            "timeline": json.dumps([
                {"timestamp": (now - timedelta(hours=8)).isoformat(), "status": "NEW", "description": "Complaint registered via AI Citizen App.", "actor": "Farhan Sayed"},
                {"timestamp": (now - timedelta(hours=6)).isoformat(), "status": "ASSIGNED", "description": "Assigned to M. Ansari.", "actor": "Admin Officer"},
                {"timestamp": (now - timedelta(hours=2)).isoformat(), "status": "RESOLVED", "description": "Pothole filled and sealed.", "actor": "M. Ansari"}
            ]),
            "resolution_note": "Pothole filled with cold asphalt mix, leveled and compacted. Normal traffic resumed.",
            "resolution_images": json.dumps(["/images/demo_pothole_4.jpg"])
        },
        {
            "id": "CMP-2026-0106",
            "created_at": (now - timedelta(hours=10)).isoformat(),
            "updated_at": (now - timedelta(hours=1)).isoformat(),
            "image": "/images/demo_pothole_3.jpg",
            "annotated_image": "/images/demo_pothole_3.jpg",
            "detection_result": json.dumps({
                "detected": True,
                "pothole_count": 1,
                "confidence": 0.95,
                "severity": "HIGH",
                "detections": [{"class_name": "pothole", "confidence": 0.95, "bbox": [100, 160, 520, 390], "area_ratio": 0.29}]
            }),
            "confidence": 0.95,
            "severity": "HIGH",
            "latitude": 19.1663,
            "longitude": 72.8526,
            "address": "Western Express Highway, Near Hub Mall Flyover, Goregaon East, Mumbai",
            "description": "Hazardous road crater on highway fast lane.",
            "citizen_name": "Rohan Nair",
            "citizen_email": "rohan.nair@rediffmail.com",
            "citizen_phone": "+91 97022 11440",
            "status": "RESOLVED",
            "assigned_department": "P-South Ward Road Works",
            "assigned_officer": "R. K. Verma (Senior Engineer)",
            "internal_notes": json.dumps([
                "[RESOLVED] Highway emergency road repair completed with bitumen mastic."
            ]),
            "timeline": json.dumps([
                {"timestamp": (now - timedelta(hours=10)).isoformat(), "status": "NEW", "description": "Complaint registered by citizen.", "actor": "Rohan Nair"},
                {"timestamp": (now - timedelta(hours=7)).isoformat(), "status": "ASSIGNED", "description": "Assigned to R. K. Verma.", "actor": "Admin Officer"},
                {"timestamp": (now - timedelta(hours=1)).isoformat(), "status": "RESOLVED", "description": "Bitumen patch completed and smoothed.", "actor": "R. K. Verma"}
            ]),
            "resolution_note": "Fast-lane crater repaired using hot-mix bitumen. Surface level restored.",
            "resolution_images": json.dumps(["/images/demo_pothole_3.jpg"])
        }
    ]

    insert_query = """
    INSERT INTO complaints (
        id, created_at, updated_at, image, annotated_image, detection_result,
        confidence, severity, latitude, longitude, address, description,
        citizen_name, citizen_email, citizen_phone, status, assigned_department, assigned_officer,
        internal_notes, timeline, resolution_note, resolution_images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    for r in demo_records:
        try:
            cursor.execute(db.adapt_query(insert_query), (
                r["id"], r["created_at"], r["updated_at"], r["image"], r["annotated_image"],
                r["detection_result"], r["confidence"], r["severity"], r["latitude"], r["longitude"],
                r["address"], r["description"], r["citizen_name"], r["citizen_email"], r["citizen_phone"],
                r["status"], r["assigned_department"], r["assigned_officer"], r["internal_notes"],
                r["timeline"], r["resolution_note"], r["resolution_images"]
            ))
        except Exception as e:
            print(f"[Database] Error seeding record {r['id']}: {e}")
            
    conn.commit()
    conn.close()
    print(f"[Database] Successfully seeded {len(demo_records)} demo complaints.")


# Initialize table and seed on import
init_db()
