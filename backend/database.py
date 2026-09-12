import sqlite3
import json
import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from .models import Complaint, ComplaintStatus, DefectSeverity, TimelineEvent

DB_FILE = os.path.join(os.path.dirname(__file__), "complaints.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
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
    conn.close()

def row_to_complaint(row: sqlite3.Row) -> Complaint:
    return Complaint(
        id=row["id"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        image=row["image"],
        annotated_image=row["annotated_image"],
        detection_result=json.loads(row["detection_result"]) if row["detection_result"] else None,
        confidence=float(row["confidence"]),
        severity=DefectSeverity(row["severity"]),
        latitude=row["latitude"],
        longitude=row["longitude"],
        address=row["address"],
        description=row["description"] or "",
        citizen_name=row["citizen_name"] or "Anonymous Citizen",
        status=ComplaintStatus(row["status"]),
        assigned_department=row["assigned_department"] or "Unassigned",
        assigned_officer=row["assigned_officer"] or "Unassigned",
        internal_notes=json.loads(row["internal_notes"]) if row["internal_notes"] else [],
        timeline=[TimelineEvent(**item) for item in json.loads(row["timeline"])] if row["timeline"] else [],
        resolution_note=row["resolution_note"],
        resolution_images=json.loads(row["resolution_images"]) if row["resolution_images"] else []
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
    citizen_name: Optional[str] = "Anonymous Citizen"
) -> Complaint:
    conn = get_db_connection()
    cursor = conn.cursor()
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
    
    cursor.execute("""
    INSERT INTO complaints (
        id, created_at, updated_at, image, annotated_image, detection_result,
        confidence, severity, latitude, longitude, address, description,
        citizen_name, status, assigned_department, assigned_officer,
        internal_notes, timeline, resolution_note, resolution_images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
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
        citizen_name or "Anonymous Citizen",
        ComplaintStatus.NEW.value,
        "Public Works Department",
        "Unassigned",
        json.dumps([]),
        json.dumps(initial_timeline),
        None,
        json.dumps([])
    ))
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)

def get_complaints(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None
) -> List[Complaint]:
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM complaints WHERE 1=1"
    params = []
    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status)
    if severity and severity != "ALL":
        query += " AND severity = ?"
        params.append(severity)
    if search:
        query += " AND (id LIKE ? OR address LIKE ? OR description LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    complaints = [row_to_complaint(r) for r in rows]
    conn.close()
    return complaints

def get_complaint_by_id(complaint_id: str) -> Optional[Complaint]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row_to_complaint(row)
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
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE complaints 
    SET status = ?, updated_at = ?, timeline = ?, internal_notes = ?
    WHERE id = ?
    """, (
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
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE complaints
    SET assigned_department = ?, assigned_officer = ?, status = ?, updated_at = ?, timeline = ?
    WHERE id = ?
    """, (
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
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE complaints
    SET status = ?, resolution_note = ?, resolution_images = ?, updated_at = ?, timeline = ?
    WHERE id = ?
    """, (
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

init_db()
