# PRD — AI-Powered Road Defect Reporting & Authority CMS

## 1. Product Overview

Build a citizen-first platform that lets users photograph a pothole/road defect, automatically detect it using an existing open-source YOLO model, capture location, create a complaint, and track its resolution.

The authority side provides a CMS to review, verify, assign, update, and close complaints.

### Core principle

**Capture → Detect → Confirm → Report → Assign → Repair → Verify → Resolve**

The project should reuse the selected open-source pothole detection project as the AI foundation. Do not reinvent the detection model unless required. The product contribution is the end-to-end reporting and authority workflow.

---

## 2. Goals

### Citizen
- Capture or upload a road image.
- Detect potholes automatically.
- Show detection confidence and detected area.
- Capture GPS location where permission is available.
- Let the citizen confirm/edit the report before submission.
- Submit a complaint.
- Receive a unique complaint ID.
- Track complaint status.

### Authority
- View all complaints in a CMS.
- Filter by status, severity, date, area, and assignment.
- View complaint details, image, location, and AI result.
- Assign complaints to an officer/team.
- Change status.
- Add internal notes.
- Upload repair/proof images.
- Mark complaints as resolved after verification.
- View dashboard statistics and geographic distribution.

---

## 3. Non-Goals for MVP

Do not build these initially:
- Training a new pothole model from scratch.
- Automatic government-system integration without an available API.
- Complex route optimization.
- Payment functionality.
- Fully autonomous repair verification.
- Native apps for every platform.

---

## 4. Users

### Citizen
Wants to quickly report a pothole without filling a long form.

### Authority Officer
Reviews incoming complaints, verifies them, and assigns work.

### Field Worker / Department
Receives assigned work, updates progress, and uploads completion evidence.

### Admin
Manages users, departments, categories, and system settings.

---

## 5. MVP User Flow

1. Citizen opens the app.
2. Citizen taps **Report Road Issue**.
3. Citizen takes or uploads an image.
4. Image is sent to the YOLO inference service.
5. System displays:
   - Pothole detected/not detected
   - Bounding box
   - Confidence
   - Severity estimate if supported
6. GPS location is captured with permission.
7. Citizen confirms the report.
8. Optional description is added.
9. Complaint is submitted.
10. System generates complaint ID.
11. Citizen sees confirmation and tracking status.
12. Authority CMS receives the complaint.
13. Officer reviews and verifies it.
14. Complaint is assigned.
15. Status moves through the workflow.
16. Field team uploads repair evidence.
17. Authority verifies completion.
18. Complaint becomes **Resolved**.

---

## 6. Complaint Statuses

Use a controlled status flow:

**NEW → UNDER REVIEW → VERIFIED → ASSIGNED → IN PROGRESS → RESOLVED**

Additional terminal state:

**REJECTED**

A complaint should not jump directly to RESOLVED from NEW.

---

## 7. Complaint Data Model

Each complaint should support:

- Complaint ID
- Created timestamp
- Citizen/user ID where authentication is enabled
- Original image
- Processed image with detection overlay
- Detection result
- Confidence score
- Severity
- Latitude
- Longitude
- Human-readable address/area if available
- Citizen description
- Status
- Assigned department
- Assigned officer
- Internal authority notes
- Resolution image(s)
- Resolution note
- Updated timestamp

---

## 8. AI Integration

Treat the existing YOLO pothole project as an independent inference service.

### Required API concept

`POST /detect`

Input:
- Image

Output:
- detected: boolean
- detections[]
- class
- confidence
- bounding box
- severity if available

The frontend should never contain model-specific logic.

The backend should own communication with the YOLO service.

---

## 9. Architecture

```text
Citizen Web/Mobile UI
        |
        v
Application API
        |
   +----+----------------+
   |                     |
   v                     v
Database             YOLO Service
   |                     |
   v                     v
Complaint CMS        Detection Result
   |
   v
Authority Dashboard
```

Keep the AI service replaceable. The application should not depend on a specific YOLO implementation beyond a stable API contract.

---

## 10. CMS Requirements

### Dashboard
Show:
- Total complaints
- New
- Under review
- In progress
- Resolved
- High-severity complaints
- Recent complaints

### Complaint table
Columns:
- Complaint ID
- Image thumbnail
- Location
- Severity
- Status
- Assigned officer
- Created date
- Actions

### Complaint detail
Show:
- Large image
- AI detection overlay
- Confidence
- Location/map
- Description
- Timeline
- Assignment
- Internal notes
- Resolution evidence

### Filters
- Status
- Severity
- Date
- Area
- Department
- Officer

---

## 11. Citizen UI Requirements

Keep reporting extremely short.

Primary action:

**Report a Road Issue**

Then:
1. Capture/upload
2. Detect
3. Confirm location
4. Add optional description
5. Submit

Avoid unnecessary forms.

---

## 12. Security & Privacy

- Validate uploaded files.
- Restrict file size and file types.
- Do not expose internal CMS APIs publicly without authorization.
- Use role-based access for authority users.
- Store secrets in environment variables.
- Do not hard-code API keys.
- Ask for location permission clearly.
- Do not collect unnecessary personal information.
- Keep citizen and authority permissions separate.

---

## 13. Accessibility

- Keyboard accessible controls.
- Clear labels.
- Good contrast.
- Visible focus states.
- Do not rely only on color for status.
- Responsive layouts.
- Clear error messages.

---

## 14. Success Metrics

MVP should demonstrate:

- Successful pothole detection from an uploaded/captured image.
- Complaint creation in under a few steps.
- Automatic location capture when permission is granted.
- Complaint visible in CMS immediately/near-real-time.
- Authority can assign and update complaints.
- Resolution evidence can be uploaded.
- Citizen can track status.

---

## 15. Future Features

- Duplicate complaint detection.
- Heatmap of road damage.
- AI severity classification.
- Multiple road defect classes.
- SMS/WhatsApp/email notifications.
- Government complaint-system integration.
- SLA monitoring.
- Officer performance analytics.
- Citizen reputation/trust scoring.
- Automatic prioritization based on traffic and severity.
