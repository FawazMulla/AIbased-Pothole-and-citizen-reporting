# 04 – Frontend Walkthrough

React + TypeScript (Vite). Source in `frontend/src/`.

## Structure
| Path | Purpose |
|---|---|
| `main.tsx` | Mounts `<App/>` |
| `App.tsx` | **View router** using `useState` (`landing / auth / report / track / cms`), session restore from `localStorage`, top nav bar, PWA install prompt |
| `services/api.ts` | All HTTP calls + TypeScript types mirroring backend schemas |
| `components/landing/LandingPage.tsx` | Marketing page, live recent complaints, entry buttons |
| `components/auth/WelcomeAuth.tsx` | Choose Citizen / Authority / Guest |
| `components/citizen/CitizenSignIn.tsx` | Citizen profile (name/email/phone) |
| `components/citizen/CitizenReport.tsx` | Upload photo → `detectPotholes()` → show result → submit complaint with GPS |
| `components/citizen/CitizenTrack.tsx` | Look up complaints by ID/email/phone, show timeline |
| `components/cms/AuthorityLogin.tsx` | Officer login |
| `components/cms/AuthorityCMS.tsx` | Dashboard: stats, filters, complaint list |
| `components/cms/ComplaintDetailModal.tsx` | Detail view, assign, change status, resolve with proof |
| `components/shared/*` | `SeverityBadge`, `StatusBadge`, empty/error states |
| `components/ui/*` | Reusable primitives (button, badge, dialog …) |

## Data flow in `CitizenReport`
1. User picks image → stored in component state.
2. `detectPotholes(file)` sends `multipart/form-data` to `/api/detect`.
3. Result (`DetectionResult`) is rendered: annotated image, severity badge, confidence, summary. New optional fields `gradcam_image`, `depth_score`, `road_check` are available for display.
4. Geolocation API gets latitude/longitude.
5. `createComplaint(payload)` posts to `/api/complaints`; returned complaint ID is shown for tracking.

## State & session
- No Redux: local `useState` per screen; officer and citizen profile persisted in `localStorage` (`civicpothole_auth_officer`, `civicpothole_citizen_profile`).
- `API_BASE_URL` comes from `VITE_API_BASE_URL`; empty ⇒ same origin (backend serves the built app).

## Run
```bash
cd frontend && npm install && npm run dev      # dev server
npm run build                                  # output to frontend/dist (served by FastAPI)
```
