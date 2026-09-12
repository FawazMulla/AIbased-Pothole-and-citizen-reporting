# CivicPothole AI — Road Defect Detection & Authority CMS Platform

CivicPothole AI is an end-to-end civic defect reporting and municipal management platform powered by a fine-tuned YOLOv8 computer vision model (`PeterHdd/pothole-detection-yolo`). It enables citizens to report road hazards with real-time AI severity assessment, geotagging, duplicate detection, and municipal agency dispatch tracking.

---

## 🏗 System Architecture

```
                                  +------------------------+
                                  |   Citizen Web App /    |
                                  |   Authority Dashboard  |
                                  |   (React 19 + Vite)    |
                                  +-----------+------------+
                                              |
                                              | REST API
                                              v
+---------------------------------------------+---------------------------------------------+
|                               FastAPI Backend Service                                     |
|                                                                                           |
|  +--------------------+   +-----------------------+   +--------------------------------+  |
|  | Citizen Reporting  |   | YOLOv8 AI Service     |   | Municipal Dispatch Lifecycle   |  |
|  | - Image Upload     |-->| - Pothole Detection   |-->| - Auto Priority Assessment     |  |
|  | - Geolocation / GPS|   | - Bounding Boxes      |   | - Ward Assignment              |  |
|  | - Duplicate Check  |   | - Severity Scoring    |   | - Resolution Proof & Audit     |  |
|  +--------------------+   +-----------------------+   +--------------------------------+  |
|                                     |                                                     |
|                                     v                                                     |
|                           SQLite Database Store                                           |
+-------------------------------------------------------------------------------------------+
```

---

## 🚀 Key Features

1. **AI-Powered Pothole Detection & Severity Scoring**:
   - Integrated YOLOv8 model trained specifically on pothole datasets.
   - Computes defect surface area, confidence scores, and automatically assigns severity levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - Annotated visual bounding boxes generated dynamically on image submission.

2. **Citizen Reporting Portal**:
   - Image upload with instant AI preview & inference diagnostics.
   - Interactive GPS coordinates capture & location reverse naming.
   - Real-time complaint tracking by reference ID.

3. **Municipal Authority Command Center**:
   - Executive statistics: Active vs. resolved defects, critical alerts, ward distribution.
   - Status workflow management: `REPORTED` ➔ `ACKNOWLEDGED` ➔ `IN_PROGRESS` ➔ `RESOLVED` ➔ `REJECTED`.
   - Contractor & Ward assignment with resolution before/after photo verification.

---

## 🛠 Local Development Setup

### 1. Backend (Python / FastAPI)

```bash
# Navigate to backend folder
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn backend.main:app --reload --port 8000
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### 2. Frontend (React 19 + TypeScript + Vite)

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Access the application at `http://localhost:5173`.

---

## 🌐 Cloud Deployment (Render)

This repository includes a native [`render.yaml`](render.yaml) Blueprint for zero-friction cloud deployment of both the backend and frontend.

### One-Click Deploy via Render Blueprint:
1. Push this repository to your GitHub account.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** ➔ **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and provision:
   - **`civicpothole-backend`**: FastAPI Python Web Service running on port `8000` / dynamic `$PORT`.
   - **`civicpothole-frontend`**: Vite Static Site automatically wired to the backend URL.
6. Click **Apply** to trigger build and deployment.

---

## 🔌 Render Model Context Protocol (MCP) Setup

To connect and manage Render services using Render's Model Context Protocol (MCP) in your IDE or AI assistant:

### 1. Obtain Render API Key
1. Go to [Render Account Settings](https://dashboard.render.com/u/settings).
2. Scroll to **API Keys** and generate a new API token.

### 2. Configure MCP Server in `mcp_config.json`
Add the Render MCP server entry to your MCP configuration file:

```json
{
  "mcpServers": {
    "render": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-render"
      ],
      "env": {
        "RENDER_API_KEY": "rnd_YOUR_RENDER_API_KEY_HERE"
      }
    }
  }
}
```

Once connected, you can list services, trigger deployments, inspect build logs, and manage environment variables directly through MCP tools.

---

## 📜 License & Credits

- YOLOv8 weights adapted from open-source pothole benchmark datasets ([PeterHdd/pothole-detection-yolo](https://github.com/PeterHdd/pothole-detection-yolo)).
