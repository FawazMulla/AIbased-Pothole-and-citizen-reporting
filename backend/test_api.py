import io
import cv2
import numpy as np
import pytest
import httpx
from backend.main import app
from backend.models import ComplaintStatus, DefectSeverity

def create_sample_road_image_bytes():
    import os
    sample_file = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images", "demo_pothole_1.jpg")
    if os.path.exists(sample_file):
        with open(sample_file, "rb") as f:
            return f.read()
            
    img = np.full((480, 640, 3), 110, dtype=np.uint8)
    noise = np.random.randint(-15, 15, (480, 640, 3), dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    _, buffer = cv2.imencode(".jpg", img)
    return buffer.tobytes()

@pytest.mark.asyncio
async def test_health_check():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        health_res = await client.get("/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "ok"
        assert "yolo_ready" in health_res.json()

@pytest.mark.asyncio
async def test_detect_endpoint():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        img_bytes = create_sample_road_image_bytes()
        response = await client.post(
            "/api/detect",
            files={"file": ("pothole.jpg", io.BytesIO(img_bytes), "image/jpeg")}
        )
        assert response.status_code == 200
        data = response.json()
        assert "detected" in data
        assert "pothole_count" in data
        assert "confidence" in data
        assert "annotated_image" in data
        assert "summary" in data
        assert data["severity"] in ["LOW", "MEDIUM", "HIGH"]

@pytest.mark.asyncio
async def test_full_complaint_workflow():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        img_bytes = create_sample_road_image_bytes()
        det = (await client.post(
            "/api/detect",
            files={"file": ("pothole.jpg", io.BytesIO(img_bytes), "image/jpeg")}
        )).json()

        payload = {
            "image": det["original_image"],
            "annotated_image": det["annotated_image"],
            "detection_result": det,
            "confidence": det["confidence"],
            "severity": det["severity"],
            "latitude": 19.0760,
            "longitude": 72.8777,
            "address": "SV Road, Bandra West, Mumbai",
            "description": "Deep pothole hazardous to two-wheelers.",
            "citizen_name": "Aarav Mehta"
        }
        
        created = (await client.post("/api/complaints", json=payload)).json()
        cid = created["id"]
        assert created["status"] == ComplaintStatus.NEW.value

        # Review
        reviewed = (await client.patch(f"/api/complaints/{cid}/status", json={
            "status": ComplaintStatus.UNDER_REVIEW.value,
            "note": "Initial inspection queue"
        })).json()
        assert reviewed["status"] == ComplaintStatus.UNDER_REVIEW.value

        # Assign
        assigned = (await client.patch(f"/api/complaints/{cid}/assign", json={
            "assigned_department": "Municipal Road Works",
            "assigned_officer": "Insp. Kulkarni",
            "note": "Assigned high priority team"
        })).json()
        assert assigned["status"] == ComplaintStatus.ASSIGNED.value
        assert assigned["assigned_officer"] == "Insp. Kulkarni"

        # Resolve
        resolved = (await client.post(f"/api/complaints/{cid}/resolve", json={
            "resolution_note": "Pothole filled with cold asphalt mix & compacted.",
            "resolution_images": [det["original_image"]],
            "officer_name": "Insp. Kulkarni"
        })).json()
        assert resolved["status"] == ComplaintStatus.RESOLVED.value
