# School ERP System — Project Roadmap

This document outlines the long-term version roadmap, system modules, deployment/release targets, and milestones for the School ERP System.

## 1. Version Roadmap

- **v0.1.0 — Milestone 1 & 1.5**: Project Initialization, Scaffold, and Engineering Foundation Hardening. (Done)
- **v0.2.0 — Milestone 2**: Core Authentication and Role-Based Access Control (RBAC). (Done)
- **v0.3.0 — Milestone 3**: Academic Structures and User/Profile Management. (Next)
- **v0.4.0 — Milestone 4**: Operations, Portals (Attendance, Homework, Noticeboard). (Planned)
- **v0.5.0 — Milestone 5**: Fees Management, Marks Sheets/Results, and Audit Trails. (Planned)
- **v1.0.0 — Production Release**: Full system integration, comprehensive verification, staging/production deployments.

## 2. Major Modules

1. **Authentication & Identity**: JWT-based session security, token rotation, HttpOnly cookie storage, password resets, profile management.
2. **Academic Configuration**: Terms/academic sessions, Class/Section configs, Classrooms, Subjects, Teacher-Class schedules.
3. **User Management**: Administrative creation/updating of profile entities (Admins, Teachers, Students, Parents). Registration is permanently disabled; only admins can create accounts.
4. **School Operations**: Daily attendance tracking, announcement boards (Notices), homework publishing, teacher schedules.
5. **Billing & Fees**: Category fee structures, invoice generation, payment processing, transactional receipts (PDF downloads).
6. **Grades & Results**: Custom grading schemes, examination management, report card compilation, admit card printouts with fee-clearance filters.
7. **Compliance & Auditing**: System-wide immutable administrative audit trails recording creation/modification of grades, billing records, and access permissions.

## 3. Future Reserved Modules (Post v1.0)
- **Library Management**: Cataloguing, check-outs, overdue fees.
- **Transport Management**: Bus routes, driver allocation, GPS integration.
- **Hostel Management**: Room allocation, mess configurations.
- **Notification Services**: SMS and push notifications to parents.

## 4. Release & Deployment Goals

- **Staging Target**: Deploy automatically to staging on `main` branch merges. Validate environment secrets using external KMS.
- **Production Target**: Multi-region Docker Compose configuration on secure private VPS. Automated daily DB backups. SSL enforcement.
