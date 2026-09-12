# UI.md — UI Design System

## MANDATORY

**Use ONLY shadcn/ui components wherever a matching component exists.**

Use the same shadcn components consistently across the entire project.

**AGENT.md must be read every time before UI work, and AGENT.md explicitly requires reading this file.**

Do not mix shadcn/ui with Material UI, Chakra UI, Ant Design, Bootstrap, Mantine, or another UI component library.

---

# 1. Design Direction

The product is a civic-tech platform.

Visual character:
- Clean
- Trustworthy
- Modern
- Professional
- Government/enterprise appropriate
- Easy to understand
- Information-dense on CMS screens
- Simple and friendly for citizens

Avoid:
- Excessive gradients
- Excessive glassmorphism
- Decorative animations
- Gaming-style visuals
- Random component styles
- Different visual styles on different pages

---

# 2. Component Rule

Prefer shadcn/ui components such as:

- Button
- Card
- Badge
- Alert
- Alert Dialog
- Dialog
- Sheet
- Drawer
- Input
- Textarea
- Label
- Select
- Checkbox
- Radio Group
- Switch
- Tabs
- Table
- Dropdown Menu
- Command
- Popover
- Calendar
- Form
- Skeleton
- Progress
- Tooltip
- Breadcrumb
- Pagination
- Separator
- Avatar
- Sidebar
- Navigation Menu

Only create custom components when the required UI pattern is not reasonably covered by shadcn/ui.

---

# 3. Reuse Components

Create shared components for repeated patterns.

Examples:

- StatusBadge
- SeverityBadge
- ComplaintCard
- ComplaintTable
- DetectionResult
- LocationCard
- EmptyState
- ErrorState
- PageHeader
- ConfirmDialog
- LoadingSkeleton

Do not implement the same pattern differently on different screens.

---

# 4. Buttons

Use shadcn Button.

Maintain a consistent hierarchy:

### Primary
Main action:
- Report Road Issue
- Submit Complaint
- Assign Complaint
- Mark Resolved

### Secondary
Supporting actions:
- Cancel
- Edit
- View Details

### Destructive
Actions such as:
- Reject
- Delete

Do not create custom button CSS for individual pages.

---

# 5. Status

Use shadcn Badge consistently.

Statuses:

- NEW
- UNDER REVIEW
- VERIFIED
- ASSIGNED
- IN PROGRESS
- RESOLVED
- REJECTED

Status should be understandable from text, not color alone.

---

# 6. Severity

Use a consistent severity component:

- LOW
- MEDIUM
- HIGH

The visual treatment must remain consistent everywhere severity appears.

---

# 7. Citizen Report Screen

Primary goal: minimum friction.

Recommended structure:

```text
Page Header
   Report a Road Issue

Capture / Upload Card
   [Take Photo]
   [Upload Image]

Detection Card
   Image
   Detection overlay
   Confidence
   Severity

Location Card
   Current location
   Area/address
   Map preview

Description
   Optional textarea

[Submit Complaint]
```

Do not show unnecessary technical information to citizens.

The raw YOLO implementation details should be hidden behind understandable labels.

---

# 8. Detection Result

Citizen-facing wording should be simple.

Instead of:

`YOLOv8 confidence = 0.913`

Prefer:

**Pothole detected**
**Detection confidence: 91%**

If appropriate, allow an expandable technical detail section.

---

# 9. CMS Layout

Use a consistent application shell:

```text
Sidebar
   Dashboard
   Complaints
   Map
   Analytics
   Settings

Main Content
   Page Header
   Filters / Actions
   Content
```

Use shadcn Sidebar for the navigation if available in the project version.

---

# 10. Dashboard

Recommended cards:

- Total Complaints
- New
- In Progress
- Resolved
- High Severity

Then:

- Recent complaints table
- Area/road issue overview
- Map/heatmap section if implemented

Keep dashboard cards consistent using shadcn Card.

---

# 11. Complaint Table

Use shadcn Table.

Recommended columns:

- Complaint
- Image
- Location
- Severity
- Status
- Assigned To
- Created
- Action

Use Dropdown Menu for row actions where useful.

Use filters through shadcn Select/Popover/Command components.

---

# 12. Complaint Detail

Recommended hierarchy:

1. Complaint identity/status
2. Detection image
3. Location
4. Citizen information relevant to the workflow
5. Description
6. AI result
7. Assignment
8. Timeline
9. Internal notes
10. Resolution evidence
11. Actions

The primary action should always be visually clear.

---

# 13. Forms

Use shadcn Form patterns.

Every field needs:
- Label
- Input
- Validation
- Error message where relevant

Avoid giant forms.

Use sections/cards for long authority forms.

---

# 14. Loading / Empty / Error States

Every data-driven screen must have clear states.

### Loading
Use Skeleton.

### Empty
Use a concise empty state:

**No complaints found**
Try changing the filters or create a new complaint.

### Error
Use Alert.

Explain what happened and provide a retry action where possible.

---

# 15. Responsive Design

Citizen experience should be mobile-first.

CMS should work well on:
- Desktop
- Laptop
- Tablet

Avoid horizontal scrolling wherever possible.

Tables may use responsive alternatives when necessary.

---

# 16. Maps

A map library may be used for geographic visualization because maps are not a replacement for a UI component library.

However:
- Surround map controls with the project's shadcn styling.
- Keep map cards/layout consistent.
- Do not introduce a second general-purpose UI component library.

---

# 17. Icons

Use one icon system consistently, preferably the icon set already used by shadcn/ui in the project.

Do not mix multiple unrelated icon packs.

---

# 18. Accessibility

- Use semantic HTML.
- Use shadcn components correctly.
- Provide labels.
- Support keyboard navigation.
- Maintain visible focus.
- Do not rely solely on color.
- Ensure dialogs and menus are accessible.

---

# 19. Visual Consistency Rule

If a component already exists in the project, reuse it.

Before creating a new UI pattern ask:

**"Can this be implemented using an existing shadcn component or shared project component?"**

If yes, reuse it.

The goal is for the entire product to feel like **one system**, not a collection of separately generated pages.
