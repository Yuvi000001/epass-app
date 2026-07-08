# E-PASS — Project Folder Structure

```
epass-app/
├── database/
│   └── README.md                  # MongoDB collections, fields, indexes (no .sql file needed)
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── ER_DIAGRAM.md
│   ├── FOLDER_STRUCTURE.md
│   └── DEPLOYMENT_GUIDE.md
│
├── backend/                        # Node.js + Express + MongoDB (Mongoose) + Firebase
│   ├── server.js                   # connects DB, inits Firebase, bootstraps default Admin, starts API
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   ├── db.js                   # Mongoose connection
│   │   └── firebase.js             # Firebase Admin SDK (Storage + Cloud Messaging)
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification
│   │   ├── roleCheck.js            # allowRoles('ADMIN', 'HOD', ...)
│   │   ├── upload.js               # multer memory-storage (feeds Firebase Storage)
│   │   ├── validate.js
│   │   └── errorHandler.js
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js                 # all 5 roles in one collection (STUDENT/FACULTY/HOD/GUARD/ADMIN)
│   │   ├── LeaveRequest.js
│   │   ├── Epass.js
│   │   ├── Notification.js
│   │   └── AuditLog.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js      # add member, list students/faculty/hod/guards, stats, audit logs
│   │   ├── leaveController.js
│   │   ├── facultyController.js
│   │   ├── hodController.js
│   │   ├── guardController.js      # gate QR scan/verify
│   │   ├── epassController.js
│   │   └── notificationController.js
│   ├── routes/                     # one file per controller above
│   ├── services/
│   │   ├── firebaseStorageService.js  # generic buffer -> Firebase Storage upload
│   │   ├── qrService.js
│   │   ├── pdfService.js
│   │   ├── notificationService.js
│   │   └── auditService.js
│   └── utils/
│       ├── asyncHandler.js
│       ├── generateToken.js
│       ├── generatePassId.js
│       ├── createDefaultAdmin.js   # auto-creates an Admin on first boot
│       └── seed.js                 # `npm run seed` — sample HOD/Faculty/Student/Guard
│
├── frontend-ionic/                  # HTML / CSS / JavaScript hybrid app (Ionic + Capacitor)
│   └── www/
│       ├── index.html
│       ├── css/ (theme.css, app.css)
│       └── js/
│           ├── config.js, storage.js, api.js, auth.js, ui.js, router.js, app.js
│           └── pages/ (splash, login, student-dashboard, apply-leave, notifications, epass,
│                       faculty-dashboard, hod-dashboard, admin-dashboard, add-member, ...)
│
└── frontend/                        # Flutter mobile app (Dart) — alternative frontend
    └── lib/ (core, models, services, widgets, screens/{auth,student,faculty,hod})
```

## Design Decisions

- **One `users` collection, not five** — MongoDB is document-oriented, so instead of separate
  SQL tables + joins, every role lives in one collection with role-specific optional fields.
  This is exactly what the Admin dashboard needs: one `GET /admin/students` query, no joins.
- **Admin has exclusive control over account creation** — there is no public self-registration
  endpoint. Every Student/Faculty/HOD/Guard account is created via `POST /admin/members`,
  matching the "full control" requirement for the Admin role.
- **Firebase Storage replaces Cloudinary** for all binary uploads (profile photos, leave
  attachments, generated QR codes, generated E-Pass PDFs) — one Firebase project covers both
  storage and push notifications (Cloud Messaging).
- **Guard role** added for gate security — logs in, scans a student's E-Pass QR, and the backend
  verifies validity and records the scan to `auditlogs`.
