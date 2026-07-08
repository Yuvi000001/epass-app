# E-PASS — MongoDB Data Model

No `.sql` file needed anymore — MongoDB collections are created automatically by Mongoose
the first time each model is used. This file documents the **collections**, their **fields**,
and the **indexes** Mongoose creates from `backend/models/*.js`.

## Collections

### `users` (all 5 roles in one collection: STUDENT, FACULTY, HOD, GUARD, ADMIN)

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercase |
| password | String | bcrypt hash, never returned in API responses |
| role | String enum | STUDENT \| FACULTY \| HOD \| GUARD \| ADMIN |
| department | String | CSE, ECE, ME, Civil, etc. |
| phone | String | |
| profileImageUrl | String | Firebase Storage public URL |
| fcmToken | String | for push notifications |
| isActive | Boolean | default true — Admin can deactivate instead of deleting |
| addedBy | ObjectId → users | which Admin/HOD created this account |
| rollNumber | String | **STUDENT only**, unique, sparse |
| branch | String | **STUDENT only** |
| semester | Number | **STUDENT only** |
| facultyAdvisorId | ObjectId → users | **STUDENT only** — links to their Faculty advisor |
| designation | String | **FACULTY only** |
| assignedGate | String | **GUARD only** — e.g. "Main Gate" |
| createdAt / updatedAt | Date | automatic (timestamps: true) |

Indexes: `{ email: 1 }` (unique), `{ rollNumber: 1 }` (unique, sparse), `{ role: 1, department: 1 }`.

### `leaverequests`

| Field | Type |
|---|---|
| student | ObjectId → users |
| leaveType | String enum (Medical, Personal, Family Function, Emergency, Other) |
| fromDate / toDate | Date |
| reason | String |
| attachmentUrl | String (Firebase Storage) |
| emergencyContact | String |
| faculty / hod | ObjectId → users |
| facultyStatus / hodStatus / overallStatus | String enum (Pending, Approved, Rejected) |
| facultyRemark / hodRemark | String |
| appliedOn / facultyReviewedAt / hodReviewedAt | Date |

Indexes: `{ student: 1, overallStatus: 1 }`, `{ faculty: 1, facultyStatus: 1 }`, `{ hod: 1, hodStatus: 1 }`.

### `epasses`

| Field | Type |
|---|---|
| leaveRequest | ObjectId → leaverequests (unique) |
| passId | String (unique) — e.g. `EPASS-BGI-2026-A1B2C3D4` |
| qrCodeUrl / pdfUrl | String (Firebase Storage) |
| issuedAt / validFrom / validTo | Date |

### `notifications`

| Field | Type |
|---|---|
| user | ObjectId → users |
| leaveRequest | ObjectId → leaverequests (optional) |
| title / message | String |
| type | String enum |
| isRead | Boolean |

### `auditlogs`

| Field | Type |
|---|---|
| user | ObjectId → users |
| action | String — e.g. `MEMBER_ADDED`, `FACULTY_APPROVED`, `GATE_SCAN` |
| entityType / entityId | String / ObjectId |
| details | Mixed (free-form JSON) |
| ipAddress | String |

## Relationships (document references, not SQL joins)

```
users (STUDENT) --facultyAdvisorId--> users (FACULTY)
users (FACULTY) --1:N--> leaverequests (via .faculty)
users (HOD)     --1:N--> leaverequests (via .hod)
leaverequests   --1:1--> epasses (via .leaveRequest)
users           --1:N--> notifications (via .user)
users           --1:N--> auditlogs (via .user)
```

Mongoose `.populate()` is used wherever a controller needs the related document's fields
(e.g. `LeaveRequest.findById(id).populate('student', 'name rollNumber department')`).

## Setting up locally

```bash
# Local MongoDB
mongod --dbpath ./data        # or run as a service / use MongoDB Compass

# OR use MongoDB Atlas (free cluster) — just set MONGODB_URI in backend/.env
```

Then seed sample data:
```bash
cd backend
npm install
npm run seed     # creates 1 Admin, 1 HOD, 1 Faculty, 2 Students, 1 Guard
```
