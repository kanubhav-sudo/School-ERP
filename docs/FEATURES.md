# School ERP System — Feature Scope (v1.0)

This document details the functional specifications for features within the scope of version 1.0.

## Functional Scope Matrix

### 1. Authentication & RBAC
- **No Self-Registration**: Only administrators can provision accounts.
- **First Login Reset**: Users must reset their temporary credentials upon logging in for the first time.
- **Role-Based Guards**: Navigation panels and layouts adapt dynamically to roles (`ADMIN`, `TEACHER`, `STUDENT`).

### 2. Administrator Module
- **Dashboard Overview**: Access school-wide stats cards (total students, fee collections, daily attendance).
- **User Management**: Create, edit, and deactivate Student and Teacher accounts.
- **Academic Structure**: Define sessions, classes, and sections.
- **Subject Scheduling**: Assign subjects to teachers and link them to classes/sections.
- **Fee Management**: Create structures, track student fee assignments, enter payments, and view logs.
- **System Audit Logs**: View system logs tracking academic, result, and settings edits.

### 3. Teacher Module
- **Dashboard Overview**: View daily class schedules and assigned sections.
- **Attendance Registry**: Mark students as Present, Absent, Late, Half Day, Medical Leave, or Approved Leave.
- **Assessments (Homework & Classwork)**: Post resources and assignments. Tracks details of edits in edit logs.
- **Grade Sheet**: Enter marks for examinations. Entries remain `DRAFT` until reviewed by an admin.

### 4. Student Module
- **Dashboard Overview**: Consolidated calendar views, notifications, and notices.
- **Attendance View**: Read-only history of personal attendance.
- **Assessments View**: Retrieve homework details and class logs.
- **Admit Card & Results**: Download Admit Cards (subject to fee clearance check) and view published report cards.
- **Fee Ledger**: View fees ledger, submit payments online, and download receipts.
