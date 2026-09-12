# AGENT.md — Development Rules

## READ THIS FIRST

**Read `AGENT.md` at the start of EVERY task and before modifying the project.**

Also read `UI.md` before creating or modifying any UI.

These files are project-level source-of-truth instructions.

---

# 1. Product Context

We are building an AI-powered road-defect reporting platform.

The core flow is:

**Citizen captures image → YOLO detects pothole → location captured → citizen confirms → complaint submitted → authority CMS → assignment → repair → verification → resolved**

The existing open-source YOLO pothole project is the AI foundation. Our main engineering work is the product layer around it.

---

# 2. First Rule: Inspect Before Building

Before writing code:

1. Inspect the existing repository.
2. Understand its folder structure.
3. Identify the existing frontend.
4. Identify the backend/API.
5. Identify how YOLO inference currently works.
6. Identify existing dependencies.
7. Check the repository's license and preserve required attribution.
8. Reuse working components where practical.
9. Do not replace the entire project unnecessarily.

Do not assume the repository structure.

---

# 3. UI RULE — MANDATORY

**Use ONLY shadcn/ui components for UI components wherever a shadcn component exists.**

Read `UI.md` every time UI work is requested.

Use the same shadcn component implementation consistently across the entire application.

Do not create one-off button, card, dialog, input, badge, table, dropdown, or form implementations when a shadcn/ui component is available.

Do not mix multiple UI libraries.

Do not introduce another component library just because it is convenient.

If a required pattern does not exist in shadcn/ui, build the smallest reusable component needed while keeping it visually consistent with shadcn/ui.

---

# 4. Engineering Principles

- Prefer simple architecture.
- Keep the YOLO service isolated behind an API.
- Do not put model-specific logic into UI components.
- Keep business logic out of presentation components.
- Create reusable components instead of duplicated screens.
- Use typed interfaces/types for API data.
- Handle loading, empty, error, and success states.
- Validate user input.
- Validate file uploads.
- Never hard-code secrets.
- Use environment variables for configuration.
- Keep APIs versionable where appropriate.
- Write clear, maintainable code.

---

# 5. Product Priorities

Priority order:

1. Working end-to-end reporting flow.
2. Reliable YOLO integration.
3. Excellent citizen experience.
4. Useful authority CMS.
5. Correct complaint lifecycle.
6. Good visual consistency.
7. Analytics and advanced features.

Do not spend time polishing secondary features while the core flow is broken.

---

# 6. Citizen Experience

The citizen should be able to report a pothole quickly.

Preferred flow:

**Report → Capture → Detect → Confirm → Submit**

Avoid long forms.

Make description optional unless a specific requirement needs it.

Always show the user what the AI detected before submission.

Never silently submit an AI-generated report without user confirmation.

---

# 7. Authority CMS

The CMS should support:

- Dashboard
- Complaint list
- Filters
- Complaint detail
- Assignment
- Status updates
- Notes
- Resolution evidence
- Map/location
- Basic analytics

Use role-based access where authentication is implemented.

---

# 8. Status Logic

Valid workflow:

NEW
→ UNDER REVIEW
→ VERIFIED
→ ASSIGNED
→ IN PROGRESS
→ RESOLVED

Alternative:

NEW → REJECTED

Do not allow arbitrary status transitions without a reason.

---

# 9. API Contract

Keep AI inference separate.

Conceptual endpoint:

POST /detect

Return structured data:

```json
{
  "detected": true,
  "detections": [
    {
      "class": "pothole",
      "confidence": 0.91,
      "bbox": [x1, y1, x2, y2]
    }
  ]
}
```

Do not couple the frontend directly to the YOLO implementation.

---

# 10. Database

Use a clear complaint model.

Minimum complaint fields:

- id
- image
- processed_image
- detection_result
- confidence
- severity
- latitude
- longitude
- address/area
- description
- status
- assigned_department
- assigned_officer
- created_at
- updated_at
- resolution_note
- resolution_images

Use migrations when supported by the selected stack.

---

# 11. Error Handling

Every important operation must have:

- Loading state
- Success state
- Error state
- Empty state where relevant

Examples:

- AI service unavailable
- Image upload failed
- GPS permission denied
- Complaint submission failed
- CMS data unavailable

Errors should be understandable to normal users.

---

# 12. Do Not Overengineer

For MVP:

- Do not build microservices everywhere.
- Do not add unnecessary state-management libraries.
- Do not add unnecessary animations.
- Do not add features not required by the PRD.
- Do not rewrite working open-source AI code without a reason.

---

# 13. Testing

For meaningful features, verify:

- Happy path
- Invalid input
- API failure
- Empty states
- Mobile/responsive layout
- Permission-denied cases
- Authentication/authorization where applicable

Before declaring a feature complete, run the project's available lint/typecheck/test/build commands.

---

# 14. Definition of Done

A feature is done only when:

- It matches the PRD.
- It follows AGENT.md.
- UI follows UI.md.
- Existing functionality is not unnecessarily broken.
- Loading/error/empty states exist where appropriate.
- No secrets are committed.
- The project builds successfully.
- Relevant tests/checks pass.
- The implementation is reusable and maintainable.

---

# 15. Communication Style for the Coding Agent

Before major implementation:
- Briefly state what you found.
- State the implementation plan.
- Then execute.

Do not ask for confirmation for routine implementation decisions.

If a decision materially changes architecture, security, cost, or the product requirements, explain the trade-off before proceeding.

---

# 16. Open-Source Attribution

The AI detection layer is based on an existing open-source project.

Preserve its license and attribution requirements.

Do not claim the underlying model, repository, dataset, or pretrained weights as original work.

Clearly separate:
- Open-source AI foundation
- Our application code
- Our CMS/workflow
- Our integrations and product design
