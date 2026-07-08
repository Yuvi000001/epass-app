# E-PASS REST API Documentation (MongoDB + Firebase edition)

Base URL (local): `http://localhost:5000/api/v1`
Auth: Bearer JWT in `Authorization: Bearer <token>` header on every protected route.
IDs are MongoDB ObjectIds (24-char hex strings), not integers.

All responses follow:
```json
{ "success": true, "data": { }, "message": "..." }
```

---

## 1. Authentication

There is **no public self-registration** — Admin (or HOD, for students/faculty if you choose to
allow it) creates every account via `/admin/members`. This keeps full control with Admin as requested.

### POST `/auth/login`
```json
{ "email": "admin@bgi.edu.in", "password": "Admin@123", "role": "ADMIN" }
```
`role` is optional but recommended (matches the role tab the user picked on the login screen).
Response: `{ token, user: { id, name, email, role, department, profileImageUrl } }`

### GET `/auth/me` — full profile of the logged-in user (any role)
### PUT `/auth/fcm-token` — `{ fcmToken }`
### PUT `/auth/profile-photo` — multipart, field `photo` → uploads to Firebase Storage
### PUT `/auth/change-password` — `{ currentPassword, newPassword }`
### POST `/auth/forgot-password` — `{ email }` (stub, wire to a real email provider)

---

## 2. Admin Routes (`role: ADMIN`) — full control panel

### POST `/admin/members` — Add a new member (HOD / Faculty / Student / Guard)
```json
{
  "name": "Dr. Sunita Rao", "email": "sunita.rao@bgi.edu.in", "password": "Hod@123",
  "role": "HOD", "department": "CSE", "phone": "9876543213"
}
```
For STUDENT, also send `rollNumber` (required), `branch`, `semester`, `facultyAdvisorId`.
For FACULTY, also send `designation`. For GUARD, also send `assignedGate`.

### GET `/admin/students?department=&search=&page=&limit=`
### GET `/admin/faculty?department=&search=&page=&limit=`
### GET `/admin/hod?department=&search=&page=&limit=`
### GET `/admin/guards?department=&search=&page=&limit=`
All four return `{ data: [...members], meta: { total, page, limit } }`, full member details included.

### GET `/admin/members/:id` — single member, full detail
### PUT `/admin/members/:id` — update any editable field (name, department, phone, role-specific fields, isActive)
### PUT `/admin/members/:id/toggle-active` — activate/deactivate (soft-disable login without deleting)
### DELETE `/admin/members/:id` — permanently remove a member

### GET `/admin/departments` — distinct department list, for dropdowns
### GET `/admin/stats` — `{ totalStudents, totalFaculty, totalHod, totalGuards, totalRequests, pending, approved, rejected }`
### GET `/admin/charts/department-wise` — leave counts grouped by student department
### GET `/admin/charts/monthly-trend` — leave counts grouped by month
### GET `/admin/audit-logs?userId=&entityType=&page=` — full audit trail, paginated

---

## 3. Student Routes (`role: STUDENT`)

### POST `/leave/apply` — multipart/form-data
| field | required |
|---|---|
| leaveType, fromDate, toDate, reason, emergencyContact | yes |
| attachment (pdf/jpg/png, max 5MB) | no |

### GET `/leave/my-requests?status=Pending|Approved|Rejected|All`
### GET `/leave/history`
### GET `/leave/:id`

---

## 4. Faculty Routes (`role: FACULTY`)

### GET `/faculty/requests?status=Pending`
### GET `/faculty/requests/:id`
### PUT `/faculty/requests/:id/approve` — `{ remark }` → forwards to the student's department HOD
### PUT `/faculty/requests/:id/reject` — `{ remark }`
### PUT `/faculty/requests/:id/forward` — explicit "Forward to HOD" UI action (same as approve)

---

## 5. HOD Routes (`role: HOD`)

### GET `/hod/requests?status=Pending`
### GET `/hod/requests/:id`
### PUT `/hod/requests/:id/approve` — `{ remark }` → generates the E-Pass (QR + PDF via Firebase Storage)
### PUT `/hod/requests/:id/reject` — `{ remark }`
### GET `/hod/stats`
### GET `/hod/reports`

---

## 6. Guard Routes (`role: GUARD`)

### POST `/guard/scan` — `{ passId }` — verifies a scanned QR code at the gate
Response: `{ passId, isCurrentlyValid, studentName, rollNumber, branch, studentPhoto, leaveType, validFrom, validTo }`

### GET `/guard/scans/recent` — this guard's last 50 scans (from the audit log)

---

## 7. E-Pass Routes

### GET `/epass/verify/:passId` — **public**, no auth — used by the QR code itself
### GET `/epass/:leaveRequestId` — full e-pass metadata (auth required)
### GET `/epass/:leaveRequestId/download` — redirects to the Firebase-hosted PDF

---

## 8. Notifications

### GET `/notifications?unreadOnly=true`
### PUT `/notifications/:id/read`
### GET `/notifications/unread-count`

---

## 9. Common Status Codes

| Code | Meaning |
|---|---|
| 200 / 201 | Success / Created |
| 400 | Validation error |
| 401 | Missing/invalid JWT or wrong credentials |
| 403 | Role not permitted, or account inactive |
| 404 | Resource not found |
| 409 | Duplicate (email / rollNumber / passId already exists) |
| 500 | Server error |

## 10. Security Notes

- Passwords hashed with `bcryptjs` via a Mongoose `pre('save')` hook — never stored in plaintext, never
  returned in any API response (`toJSON` transform strips `password`).
- JWT expires per `JWT_EXPIRES_IN` (default 7 days).
- Every Admin action (add/update/deactivate/delete member) and every approve/reject/login/gate-scan
  writes an `auditlogs` document.
- File uploads (photos, attachments) go straight to Firebase Storage as public URLs — no files are
  kept on the API server's disk.
