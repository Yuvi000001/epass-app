# E-PASS — Deployment Guide (MongoDB + Firebase edition)

## 1. Prerequisites

- Node.js 18+ and npm
- MongoDB 6+ (local `mongod`, or a free MongoDB Atlas cluster)
- A Firebase project (for Storage — photos/attachments/QR/PDF — and Cloud Messaging push)
- Ionic + Capacitor CLI (for the HTML/CSS/JS frontend) or Flutter SDK (for the Dart frontend)

---

## 2. Firebase Project Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → Create project.
2. **Storage**: Enable Firebase Storage (Build → Storage → Get Started). Note the bucket name
   (looks like `your-project-id.appspot.com`).
3. **Service account**: Project Settings → Service Accounts → "Generate new private key" →
   downloads a JSON file. Save it as `backend/firebase-service-account.json`.
4. **Cloud Messaging** (optional, for push notifications): Project Settings → Cloud Messaging —
   no extra key needed, the same service account covers it.

---

## 3. Database Setup (MongoDB)

**Option A — Local**
```bash
mongod --dbpath ./data
```

**Option B — MongoDB Atlas (recommended, free tier available)**
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Add a database user + allow your IP (or `0.0.0.0/0` for quick testing).
3. Copy the connection string into `backend/.env` → `MONGODB_URI`.

No schema file to import — Mongoose creates collections and indexes automatically the first
time the server runs (see `database/README.md` for the full data model).

---

## 4. Backend Setup (Local Development)

```bash
cd backend
npm install
cp .env.example .env
# edit .env: MONGODB_URI, JWT_SECRET, FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_STORAGE_BUCKET
npm run seed       # creates Admin + sample HOD/Faculty/Student/Guard accounts
npm run dev        # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/v1/health`

### Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `PORT` | API port, default `5000` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Auth token signing |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Path to the downloaded service-account JSON |
| `FIREBASE_STORAGE_BUCKET` | Your Firebase Storage bucket name |
| `CLIENT_BASE_URL` | Used to build the QR verification URL |
| `DEFAULT_ADMIN_NAME/EMAIL/PASSWORD` | Auto-created on first boot if no Admin exists |

---

## 5. Backend Production Deployment

**Option A — Railway / Render**
1. Push `backend/` to GitHub, create a Web Service pointing at it.
2. Set env vars above (use an Atlas `MONGODB_URI`, not a local one).
3. Start command: `node server.js`. Build command: `npm install`.

**Option B — AWS EC2 + MongoDB Atlas**
1. Use Atlas for the database (skip self-hosting MongoDB).
2. Launch an EC2 instance (Ubuntu 22.04), install Node 18.
3. `npm install --production`, configure `.env`, run with `pm2 start server.js --name epass-api`.
4. Put Nginx in front, terminate TLS with `certbot`.

---

## 6. Frontend Setup

### Ionic (HTML/CSS/JS) — `frontend-ionic/`
```bash
cd frontend-ionic
npm install
npm start                       # http://localhost:8100 (test in browser first)
# update www/js/config.js -> baseUrl to point at your deployed backend
npx cap add android && npx cap sync android && npx cap open android   # real APK
```

### Flutter (Dart) — `frontend/`
```bash
cd frontend
flutter pub get
# update lib/core/constants/app_constants.dart -> baseUrl
flutter run
```

### Adding the BGI logo
Drop your logo file at:
- Ionic: `frontend-ionic/www/assets/images/logo.png`
- Flutter: `frontend/assets/images/logo.png` (already declared in `pubspec.yaml` assets)

The splash and login screens already reference this path with a graceful icon fallback if the
file is missing — see each frontend's README for the exact `<img>` / `Image.asset` tag to swap in.

---

## 7. Post-Deployment Checklist

- [ ] Change the seeded Admin password immediately after first login.
- [ ] Rotate `JWT_SECRET`.
- [ ] Enable HTTPS on the API domain.
- [ ] Set MongoDB Atlas automated backups.
- [ ] Restrict Firebase Storage security rules (public-read is fine for QR/PDF, but lock down writes
      to authenticated server requests only — the Admin SDK already bypasses client-side rules).
- [ ] Verify FCM push notifications reach a real device end-to-end.
- [ ] Confirm audit logs are being written for every add-member/approve/reject/login/gate-scan action.
