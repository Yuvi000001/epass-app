# E-PASS — Data Model Diagram (MongoDB)

MongoDB is document-based (no foreign-key joins), so this is a reference diagram of
collections and the ObjectId references between them. See `database/README.md` for full field
details.

```mermaid
erDiagram
    USERS ||--o{ LEAVEREQUESTS : "submits (student)"
    USERS ||--o{ LEAVEREQUESTS : "reviews (faculty)"
    USERS ||--o{ LEAVEREQUESTS : "approves (hod)"
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDITLOGS : performs
    USERS ||--o| USERS : "facultyAdvisorId (student -> faculty)"
    LEAVEREQUESTS ||--o| EPASSES : generates
    LEAVEREQUESTS ||--o{ NOTIFICATIONS : triggers

    USERS {
        ObjectId _id PK
        string name
        string email "UNIQUE"
        string password
        string role "STUDENT|FACULTY|HOD|GUARD|ADMIN"
        string department
        string phone
        string profileImageUrl
        boolean isActive
        ObjectId addedBy FK
        string rollNumber "STUDENT only, UNIQUE"
        string branch "STUDENT only"
        number semester "STUDENT only"
        ObjectId facultyAdvisorId "STUDENT only"
        string designation "FACULTY only"
        string assignedGate "GUARD only"
    }

    LEAVEREQUESTS {
        ObjectId _id PK
        ObjectId student FK
        string leaveType
        date fromDate
        date toDate
        string reason
        string attachmentUrl
        string emergencyContact
        ObjectId faculty FK
        ObjectId hod FK
        string facultyStatus
        string hodStatus
        string overallStatus
        string facultyRemark
        string hodRemark
    }

    EPASSES {
        ObjectId _id PK
        ObjectId leaveRequest FK "UNIQUE"
        string passId "UNIQUE"
        string qrCodeUrl
        string pdfUrl
        date validFrom
        date validTo
    }

    NOTIFICATIONS {
        ObjectId _id PK
        ObjectId user FK
        ObjectId leaveRequest FK
        string title
        string message
        string type
        boolean isRead
    }

    AUDITLOGS {
        ObjectId _id PK
        ObjectId user FK
        string action
        string entityType
        ObjectId entityId
        object details
        string ipAddress
    }
```

## Roles (5 total)

| Role | Who creates this account | Purpose |
|---|---|---|
| STUDENT | Admin (or HOD, depending on your policy) | Applies for leave, views status, downloads E-Pass |
| FACULTY | Admin | First-level approval / rejection, forwards to HOD |
| HOD | **Admin only** | Final approval / rejection, department stats, triggers E-Pass |
| GUARD | Admin | Scans/verifies E-Pass QR codes at the gate |
| ADMIN | Bootstrapped automatically on first server start (see `.env` `DEFAULT_ADMIN_*`) | Full control — add/manage all members, see all stats |

## Workflow State Machine

```
Student applies  →  facultyStatus = Pending, hodStatus = Pending, overallStatus = Pending
Faculty approves →  facultyStatus = Approved        → forwarded to HOD
Faculty rejects  →  facultyStatus = Rejected, overallStatus = Rejected (terminal)
HOD approves     →  hodStatus = Approved, overallStatus = Approved → E-Pass generated
HOD rejects      →  hodStatus = Rejected, overallStatus = Rejected (terminal)
Guard scans QR   →  verifies pass validity at the gate (read-only, logged to auditlogs)
```
