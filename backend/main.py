import os
import base64
import json
from typing import Optional, List
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from fastapi.responses import FileResponse

from .models import (
    ComplaintStatus,
    DefectSeverity,
    ComplaintCreate,
    ComplaintUpdateStatus,
    ComplaintAssign,
    ComplaintResolve,
    Complaint,
    DashboardStats,
    DetectionResult
)
from .ai_service import ai_service
from .database import (
    create_complaint_record,
    get_complaints,
    get_complaint_by_id,
    update_complaint_status,
    assign_complaint,
    resolve_complaint
)

app = FastAPI(
    title="AI Pothole & Road Defect Platform API",
    description="Clean API boundary wrapping PeterHdd/pothole-detection-yolo YOLOv8 engine and municipal complaint lifecycle.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "yolo_ready": ai_service.model is not None,
        "monolith_frontend_ready": os.path.exists(os.path.join(FRONTEND_DIST, "index.html"))
    }

@app.post("/api/detect", response_model=DetectionResult)
async def detect_potholes(file: UploadFile = File(...)):
    """
    Independent AI detection API boundary:
    Ingests an image and returns structured detections (bounding boxes, confidence, severity, and annotated overlay).
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")
    
    try:
        contents = await file.read()
        result = ai_service.detect(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Detection failed: {str(e)}")

@app.post("/api/complaints", response_model=Complaint)
def create_complaint(complaint_data: ComplaintCreate):
    try:
        complaint = create_complaint_record(
            image=complaint_data.image,
            annotated_image=complaint_data.annotated_image,
            detection_result=complaint_data.detection_result,
            confidence=complaint_data.confidence,
            severity=complaint_data.severity,
            latitude=complaint_data.latitude,
            longitude=complaint_data.longitude,
            address=complaint_data.address or "Verified Location",
            description=complaint_data.description,
            citizen_name=complaint_data.citizen_name or "Citizen User",
            citizen_email=complaint_data.citizen_email or "",
            citizen_phone=complaint_data.citizen_phone or ""
        )
        return complaint
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create complaint: {str(e)}")

@app.get("/api/complaints", response_model=List[Complaint])
def list_complaints(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    citizen_email: Optional[str] = Query(None),
    citizen_phone: Optional[str] = Query(None)
):
    return get_complaints(
        status=status,
        severity=severity,
        search=search,
        citizen_email=citizen_email,
        citizen_phone=citizen_phone
    )

@app.get("/api/complaints/{complaint_id}", response_model=Complaint)
def get_complaint(complaint_id: str):
    complaint = get_complaint_by_id(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@app.patch("/api/complaints/{complaint_id}/status", response_model=Complaint)
def update_status(complaint_id: str, body: ComplaintUpdateStatus):
    updated = update_complaint_status(
        complaint_id=complaint_id,
        new_status=body.status,
        note=body.note,
        actor=body.officer_name or "Authority Officer"
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return updated

@app.patch("/api/complaints/{complaint_id}/assign", response_model=Complaint)
def assign_officer(complaint_id: str, body: ComplaintAssign):
    updated = assign_complaint(
        complaint_id=complaint_id,
        department=body.assigned_department,
        officer=body.assigned_officer,
        note=body.note,
        actor="Admin Officer"
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return updated

@app.post("/api/complaints/{complaint_id}/resolve", response_model=Complaint)
def resolve_complaint_endpoint(complaint_id: str, body: ComplaintResolve):
    updated = resolve_complaint(
        complaint_id=complaint_id,
        resolution_note=body.resolution_note,
        resolution_images=body.resolution_images,
        actor=body.officer_name or "Field Inspector"
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return updated

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats():
    all_complaints = get_complaints()
    total = len(all_complaints)
    new_c = len([c for c in all_complaints if c.status == ComplaintStatus.NEW])
    under_rev = len([c for c in all_complaints if c.status == ComplaintStatus.UNDER_REVIEW])
    in_prog = len([c for c in all_complaints if c.status in (ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.VERIFIED)])
    resolved = len([c for c in all_complaints if c.status == ComplaintStatus.RESOLVED])
    high_sev = len([c for c in all_complaints if c.severity == DefectSeverity.HIGH and c.status != ComplaintStatus.RESOLVED])

    return DashboardStats(
        total_complaints=total,
        new_complaints=new_c,
        under_review=under_rev,
        in_progress=in_prog,
        resolved=resolved,
        high_severity=high_sev,
        recent_complaints=all_complaints[:6]
    )

@app.post("/api/admin/seed")
def seed_database_endpoint(force: bool = True):
    """
    Seeds rich demo complaints into the database.
    Useful after Render restart/spin-up or for testing.
    """
    from .database import seed_initial_data, get_complaints, db
    seed_initial_data(force=force)
    complaints = get_complaints()
    return {
        "status": "success",
        "message": f"Database successfully seeded with {len(complaints)} records.",
        "database_type": "PostgreSQL" if db.is_postgres else "SQLite",
        "count": len(complaints)
    }

@app.get("/api/admin/db-info")
def db_info_endpoint():
    from .database import get_complaints, db, DATABASE_URL
    complaints = get_complaints()
    return {
        "is_postgres": db.is_postgres,
        "database_type": "PostgreSQL (Cloud Persistent)" if db.is_postgres else "SQLite (Local/Ephemeral)",
        "has_database_url": bool(DATABASE_URL),
        "total_complaints": len(complaints),
        "note": "To enable permanent persistence on Render across restarts, attach a Render PostgreSQL database and set DATABASE_URL."
    }

@app.get("/{full_path:path}")
async def serve_spa_frontend(full_path: str):
    if full_path.startswith("api") or full_path.startswith("uploads") or full_path in ["docs", "redoc", "openapi.json", "health"]:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    # 1. Exact file match in dist
    target_file = os.path.join(FRONTEND_DIST, full_path)
    if os.path.isfile(target_file):
        headers = {}
        if full_path in ["sw.js", "manifest.json"]:
            headers = {"Cache-Control": "no-cache, no-store, must-revalidate"}
        return FileResponse(target_file, headers=headers)
    
    # 2. Check in assets/ if requested without prefix (e.g. /index-xxxx.js)
    asset_file = os.path.join(FRONTEND_DIST, "assets", full_path)
    if os.path.isfile(asset_file):
        return FileResponse(asset_file)
        
    # 3. Fallback for stale asset hash requests from cached service workers
    if full_path.endswith(".css") or full_path.endswith(".js"):
        assets_dir = os.path.join(FRONTEND_DIST, "assets")
        if os.path.exists(assets_dir):
            ext = ".css" if full_path.endswith(".css") else ".js"
            matching_files = [f for f in os.listdir(assets_dir) if f.endswith(ext)]
            if matching_files:
                return FileResponse(os.path.join(assets_dir, matching_files[0]))
    
    # 4. SPA HTML fallback
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
    
    return {
        "status": "online",
        "service": "AI Pothole Detection & Citizen Reporting Platform",
        "docs": "/docs",
        "note": "Frontend build not found in frontend/dist. Build frontend first."
    }
