# School ERP System — API Specifications (v1)

All endpoints reside under the namespace `/api/v1`. Communication is performed using standard JSON payloads.

## Standard API Response Envelope

Every request returns a consistent response body.

### Success Payload (HTTP 200/201)
```json
{
  "success": true,
  "data": {
    // response payload object or array
  },
  "message": "Operation completed successfully"
}
```

### Error Payload (HTTP 4xx/5xx)
```json
{
  "success": false,
  "error": "Error identification message",
  "details": [
    // optional array of validation fields or stack trace guidelines (dev mode only)
  ]
}
```

---

## Route Map

### 1. General & System
- `GET /health` - Baseline application, uptime, and database connection status checks.

### 2. Authentication & Session
- `POST /api/v1/auth/login` - User credentials verification, returns access token and sets refresh token cookie.
- `POST /api/v1/auth/logout` - Revokes session tokens.
- `POST /api/v1/auth/refresh` - Silent refresh endpoint to rotate short-lived access tokens.
- `POST /api/v1/auth/change-password` - Mandatory first-time password reset.

### 3. Admin Module
- `GET /api/v1/admin/dashboard` - Metrics overview (student count, attendance, fees).
- `POST /api/v1/admin/students` - Add new student profiles.
- `GET /api/v1/admin/students` - Query and list student profiles (paginated).
- `POST /api/v1/admin/teachers` - Add new teacher profiles.
- `POST /api/v1/admin/classes` - Manage classes and structures.
- `POST /api/v1/admin/sections` - Manage sections within classes.
- `POST /api/v1/admin/subjects` - Manage active courses.
- `GET /api/v1/admin/audit-logs` - Inspect system logs (restricted to Admin).

### 4. Teacher Module
- `GET /api/v1/teacher/dashboard` - Assigned classes list and upcoming schedules.
- `POST /api/v1/teacher/attendance` - Record daily attendance records.
- `POST /api/v1/teacher/homework` - Create homework assignments.
- `PUT /api/v1/teacher/homework/:id` - Edit homework (triggers audit logging).
- `POST /api/v1/teacher/classwork` - Log class activities.
- `POST /api/v1/teacher/marks` - Input grades for assessments.

### 5. Student Module
- `GET /api/v1/student/dashboard` - Aggregated calendar, notices, and pending homework.
- `GET /api/v1/student/attendance` - Personal attendance metrics.
- `GET /api/v1/student/homework` - Pending and past assignments.
- `GET /api/v1/student/results` - Access published examination grades.
- `GET /api/v1/student/fees` - Fee dues details.
- `POST /api/v1/student/fees/pay` - Process payments.
- `GET /api/v1/student/admit-card` - Retrievable if academic and fee clearances are active.
