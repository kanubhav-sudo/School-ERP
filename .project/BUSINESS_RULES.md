# Business Rules

These operational rules govern every module of the School ERP.

## Ownership Matrix

- **Student Role**:
  - Owns profile, attendance view, results, homework, classwork, fee records, admit card, and notifications.
  - Can never modify academic records.
- **Teacher Role**:
  - Owns homework posting/updating, classwork logging, attendance, and marks entry.
  - Can only perform actions for classes and sections assigned to them.
- **Admin Role**:
  - Owns all user profiles, academic sessions, configuration settings, noticeboard announcements, calendars, audit logs, and fee categories.
  - Holds full system override capabilities.

## Operations
- **Audit Logs**: Read-only and immutable tracking of key edits (homework changes, grading, result releases, fee setups).
- **Attendance**: Standard options: `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `MEDICAL_LEAVE`, `APPROVED_LEAVE`. Marked daily. Back-edits (>24 hours) require Admin override.
- **Fees**: Automated receipt generation upon payment confirmation. Admit card access requires fee-clearance validation.
