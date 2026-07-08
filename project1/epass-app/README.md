# E-PASS — College Leave Management System
### Bansal Group of Institutes (BGI) — Bhopal | Indore | Mandideep

A complete digital leave-approval and pass-management system for colleges, with **five roles**
(**Admin**, **Student**, **Faculty**, **HOD**, **Guard**), a two-step approval workflow, an
auto-generated QR-coded E-Pass once a leave is fully approved, and gate-side QR verification.

```
Student applies → Faculty reviews → (Approve → forward) → HOD final decision → E-Pass generated → Guard verifies at gate
```

Admin has full control: adds every HOD / Faculty / Student / Guard account (no public
self-registration), manages departments, and sees system-wide stats.

## What's in this package

| Folder | Contents |
|---|---|
| `backend/` | Node.js + Express REST API — **MongoDB** (Mongoose) + **Firebase** (Storage for photos/attachments/QR/PDF, Cloud Messaging for push) |
| `frontend-ionic/` | **HTML / CSS / JavaScript** hybrid app (Ionic Framework + Capacitor) — installable real Android/iOS app, no framework, no Dart |
| `frontend/` | Older **Flutter** build from an earlier MySQL-based iteration. **Not yet updated** for the new MongoDB API / Admin / Guard roles — kept for reference only. Use `frontend-ionic/` for now. |
| `docs/` | API reference, ER diagram, folder structure, deployment guide |
| `database/README.md` | MongoDB collection/field reference (no `.sql` file needed — Mongoose creates collections automatically) |

## Quick Start

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env       # fill in MONGODB_URI, JWT_SECRET, Firebase service account, etc.
npm run seed                # optional: creates 1 Admin, 1 HOD, 1 Faculty, 2 Students, 1 Guard for testing
npm run dev                 # http://localhost:5000
# (a default ADMIN account is also auto-created on first boot from DEFAULT_ADMIN_* in .env)

# 2. Frontend (Ionic — HTML/CSS/JS)
cd ../frontend-ionic
npm install
npm start                   # http://localhost:8100
# To package as a real Android app:
#   npx cap add android && npx cap sync android && npx cap open android
```

Full details: see `docs/DEPLOYMENT_GUIDE.md`, `docs/API_DOCUMENTATION.md`, `docs/ER_DIAGRAM.md`,
`docs/FOLDER_STRUCTURE.md`, and `database/README.md`.

## Tech Stack

- **Frontend**: Ionic Framework (Web Components) + Capacitor — plain HTML / CSS / JavaScript, no Angular/React/Vue, packaged as a real installable Android/iOS app
- **Backend**: Node.js + Express
- **Database**: **MongoDB** (Mongoose) — one `users` collection holds all 5 roles, with role-specific fields
- **File storage**: **Firebase Storage** — profile photos, leave attachments, generated QR codes, generated E-Pass PDFs
- **Push notifications**: Firebase Cloud Messaging
- **Auth**: JWT (role-based: STUDENT / FACULTY / HOD / GUARD / ADMIN). No public registration — Admin creates every account.
- **PDF / QR**: `pdfkit`, `qrcode` (backend) + `qrcodejs` (frontend display)

## Roles

| Role | What they do |
|---|---|
| **Admin** | Adds/edits/deactivates/deletes every HOD, Faculty, Student, and Guard account with full details; manages departments; sees system-wide stats and audit logs |
| **Student** | Applies for leave, tracks status, views E-Pass once approved |
| **Faculty** | Reviews their advisees' leave requests, approves (forwards to HOD) or rejects |
| **HOD** | Gives final approval/rejection for their department; approval auto-generates the E-Pass |
| **Guard** | Scans (or manually enters) a student's E-Pass QR code at the gate to verify it's currently valid |

## Brand

- Primary: `#0A4DAD` (BGI Blue)
- Secondary: Gold `#D4AF37`
- Clean white surfaces, Material Design–style components, rounded cards
- Official BGI logo: `frontend-ionic/www/assets/images/logo.png` (shown on Splash + Login screens automatically — see "Updating the logo" below)

## Updating the logo

The logo file lives at:
```
frontend-ionic/www/assets/images/logo.png
```
To replace it, just **overwrite this file** with a new image (PNG recommended, transparent
background works best) — the Splash and Login screens reference this exact path, so no code
changes are needed. If the file is ever missing, the app automatically falls back to a simple
shield icon so the layout never breaks.

## Default Logins (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@bgi.edu.in | Admin@123 |
| HOD | sunita.rao@bgi.edu.in | Hod@123 |
| Faculty | ramesh.kumar@bgi.edu.in | Faculty@123 |
| Student | john.doe@bgi.edu.in | Student@123 |
| Guard | guard.gate1@bgi.edu.in | Guard@123 |

**Change these passwords before going live.**

## Build Order (what's done, what's next)

This project is being built incrementally, one module at a time:

- [x] Backend (MongoDB + Firebase), fully wired — Auth, Admin (member management), Leave workflow, Faculty/HOD approvals, E-Pass (QR+PDF), Guard gate-scan, Notifications, Audit logs
- [x] Login screen (Student / Faculty / HOD / Guard tabs + Admin link), BGI logo
- [x] Admin Dashboard — Home (stats), Members (add/search/filter/view/deactivate/delete for all 4 roles), Profile
- [x] Guard Dashboard — manual pass-ID verification (camera QR scanning can be added next via a Capacitor barcode-scanner plugin)
- [ ] Student / Faculty / HOD dashboards — **carried over from the previous MySQL build; need updating to match the new MongoDB API field names before they'll work end-to-end.** Next on the list.

## Notes on "production-ready"

This package gives you a real, working, end-to-end architecture you can run locally today and
deploy with minimal changes — not placeholder stubs. Before going live: rotate all secrets and
seeded passwords, add automated tests, follow the post-deployment checklist in
`docs/DEPLOYMENT_GUIDE.md`, and finish updating the Student/Faculty/HOD dashboard screens noted above.
