# 03 – Backend Walkthrough

## Files
| File | Role |
|---|---|
| `backend/main.py` | FastAPI app: routes, CORS, static files, SPA fallback |
| `backend/models.py` | Pydantic schemas = API contract (validation + OpenAPI docs) |
| `backend/ai_service.py` | Orchestrates ML stages, returns one `DetectionResult` dict |
| `backend/ml/*.py` | One module per ML stage (see doc 02) |
| `backend/database.py` | SQLite/PostgreSQL access, schema init, seed data |
| `backend/test_api.py` | API tests (pytest) |

## `main.py` – request handling
- `app = FastAPI(...)` creates the app; `CORSMiddleware` lets the browser call the API from another origin.
- `/uploads` and `/assets` are mounted as static folders; the last route `/{full_path:path}` returns the React `index.html` so client-side routing works (SPA fallback).
- **`POST /api/detect`**: checks `content_type` starts with `image/`, reads bytes, calls `ai_service.detect()`; errors → HTTP 400/500.
- **`POST /api/complaints`**: validates body with `ComplaintCreate`, calls `create_complaint_record()`.
- **`GET /api/complaints`**: filters `status, severity, search, citizen_email, citizen_phone`.
- **`PATCH /…/status`**, **`PATCH /…/assign`**, **`POST /…/resolve`**: lifecycle changes; each appends a timeline event.
- **`GET /api/dashboard/stats`**: counters (total/new/under review/in progress/resolved/high-severity) + 6 most recent.
- **`/api/admin/seed`, `/api/admin/db-info`**: demo data & DB diagnostics.
- **`/health`**: reports whether the detector is loaded.

## `models.py`
- `Enum`s: `ComplaintStatus`, `DefectSeverity`.
- `DetectionResult` / `BoundingBox`: response of `/api/detect`. New optional ML fields: `severity_score`, `depth_score`, `gradcam_image`, `road_check` – old clients keep working.
- `ComplaintCreate` (input), `Complaint` (output), `TimelineEvent`, `DashboardStats`.

## `ai_service.py` – `PotholeDetectionService`
```
__init__  : choose device, load classifier / segmenter / depth estimator once (singleton `ai_service`)
detect()  : decode bytes -> RGB/BGR arrays
            1 classifier gate (+ Grad-CAM)
            2 segmenter.predict()
            3 depth score per detection
            4 compute_severity()
            5 annotate masks + boxes, encode images as base64 data-URIs
```
Design choices: images are returned as **base64 data-URIs** so the frontend can show them directly and store them with the complaint; each stage is wrapped in `try/except` so a failure in an optional stage never breaks the request.

## `database.py`
- Reads `DATABASE_URL`; if set uses PostgreSQL (`psycopg2`), else SQLite file `complaints.db`.
- `DBWrapper.adapt_query` converts `?` ↔ `%s` placeholders so one set of SQL works for both DBs.
- `init_db()` creates the `complaints` table (lists such as `timeline` stored as JSON text), migrates old columns, seeds demo data.
- CRUD helpers: `create_complaint_record`, `get_complaints`, `get_complaint_by_id`, `update_complaint_status`, `assign_complaint`, `resolve_complaint`.

## Run / test
```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload     # http://localhost:8000/docs
pytest backend/test_api.py
```
