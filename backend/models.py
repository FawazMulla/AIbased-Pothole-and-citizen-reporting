from enum import Enum
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class ComplaintStatus(str, Enum):
    NEW = "NEW"
    UNDER_REVIEW = "UNDER REVIEW"
    VERIFIED = "VERIFIED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class DefectSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class BoundingBox(BaseModel):
    class_name: str = "pothole"
    confidence: float
    bbox: List[int]
    area_ratio: Optional[float] = None

class DetectionResult(BaseModel):
    detected: bool
    pothole_count: int
    confidence: float
    severity: DefectSeverity
    detections: List[BoundingBox]
    summary: str
    annotated_image: str
    original_image: str
    duration_ms: Optional[float] = None
    model_provenance: Optional[str] = None

class ComplaintCreate(BaseModel):
    image: str
    annotated_image: Optional[str] = None
    detection_result: Optional[Dict[str, Any]] = None
    confidence: float = 0.90
    severity: DefectSeverity = DefectSeverity.MEDIUM
    latitude: Optional[float] = 28.6139
    longitude: Optional[float] = 77.2090
    address: Optional[str] = "Civil Lines, Main Avenue"
    description: Optional[str] = ""
    citizen_name: Optional[str] = "Anonymous Citizen"
    citizen_phone: Optional[str] = ""

class ComplaintUpdateStatus(BaseModel):
    status: ComplaintStatus
    note: Optional[str] = None
    officer_name: Optional[str] = "Admin Officer"

class ComplaintAssign(BaseModel):
    assigned_department: str
    assigned_officer: str
    note: Optional[str] = None

class ComplaintResolve(BaseModel):
    resolution_note: str
    resolution_images: List[str] = []
    officer_name: Optional[str] = "Field Inspector"

class TimelineEvent(BaseModel):
    timestamp: str
    status: str
    description: str
    actor: str

class Complaint(BaseModel):
    id: str
    created_at: str
    updated_at: str
    image: str
    annotated_image: Optional[str] = None
    detection_result: Optional[Dict[str, Any]] = None
    confidence: float
    severity: DefectSeverity
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: str
    description: Optional[str] = ""
    citizen_name: Optional[str] = "Anonymous Citizen"
    status: ComplaintStatus
    assigned_department: Optional[str] = "Unassigned"
    assigned_officer: Optional[str] = "Unassigned"
    internal_notes: List[str] = []
    timeline: List[TimelineEvent] = []
    resolution_note: Optional[str] = None
    resolution_images: List[str] = []

class DashboardStats(BaseModel):
    total_complaints: int
    new_complaints: int
    under_review: int
    in_progress: int
    resolved: int
    high_severity: int
    recent_complaints: List[Complaint]
