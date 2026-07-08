# E-PASS — Ionic + Capacitor Frontend (HTML / CSS / JavaScript)

This is the **hybrid app** version of E-PASS, built with plain HTML, CSS, and JavaScript using
the **Ionic Framework** (web components) for UI, wrapped with **Capacitor** to produce a real,
installable Android/iOS app — not just a website.

No Angular/React/Vue here on purpose — every page is plain JS (`www/js/pages/*.js`) using
Ionic's web components (`<ion-button>`, `<ion-card>`, `<ion-input>`, etc.) directly in HTML strings.

## How it's structured

```
frontend-ionic/
├── capacitor.config.json     # App ID, name, splash screen config
├── package.json
└── www/                       # Everything here IS the app (served as-is, or packaged by Capacitor)
    ├── index.html             # Single entry point — loads Ionic, then all app scripts
    ├── css/
    │   ├── theme.css           # BGI brand colors mapped onto Ionic's CSS variables
    │   └── app.css             # Custom component styles (cards, badges, tabs, etc.)
    └── js/
        ├── config.js           # API base URL + app constants
        ├── storage.js          # localStorage wrapper (session/token)
        ├── api.js              # fetch() wrapper for the backend REST API
        ├── auth.js              # login / logout / current user helpers
        ├── ui.js                # toast, confirm dialogs, leave-card HTML builder
        ├── router.js            # tiny SPA router (no framework)
        ├── app.js               # bootstraps the router on page load
        └── pages/
            ├── splash.js
            ├── login.js
            ├── student-dashboard.js   # Home / Requests / History / Profile tabs
            ├── apply-leave.js
            ├── notifications.js
            ├── epass.js               # QR code + download/share
            ├── faculty-dashboard.js   # Home / Requests tabs
            └── hod-dashboard.js       # Home / Requests tabs + SVG donut chart
```

This is a **Single Page App**: `index.html` never changes — `router.js` swaps the contents of
`<div id="app-root">` between pages, and each page module knows how to render itself and wire up
its own event listeners and API calls.

## Run it as a website first (fastest way to test)

```bash
cd frontend-ionic
npm install
npm start
# opens http://localhost:8100 — point your browser there
```

Make sure the backend is running first (`cd ../backend && npm run dev`) and that
`www/js/config.js` → `baseUrl` points at it.

## Package it as a real Android app (Capacitor)

```bash
npm install
npx cap add android        # generates the android/ folder (native Android project)
npx cap sync android       # copies www/ into the native project + installs plugins
npx cap open android       # opens Android Studio — click Run ▶ on a device/emulator
```

To build a release APK: in Android Studio, **Build → Generate Signed Bundle / APK**.

## Package it as a real iOS app (macOS + Xcode required)

```bash
npx cap add ios
npx cap sync ios
npx cap open ios           # opens Xcode — click Run ▶
```

## Notes

- **QR code**: rendered client-side with the `qrcodejs` library (CDN), encoding the pass ID
  returned by `/api/v1/epass/:leaveRequestId`.
- **Push notifications**: the `@capacitor/push-notifications` plugin is listed in `package.json`;
  wire it up in `app.js` once you've set up Firebase for the native app (see backend's
  `docs/DEPLOYMENT_GUIDE.md` for the FCM service-account setup — the backend side is unchanged).
- **File upload (attachment)**: uses a native `<input type="file">` — works in both the browser
  and inside the Capacitor WebView.
- **Sharing the E-Pass**: uses Capacitor's `Share` plugin when running as a native app, falling
  back to the Web Share API (or clipboard copy) when running as a plain website.

The **backend stays exactly the same** (`backend/`, Node.js + Express + MySQL) — only the frontend
changed from Flutter/Dart to Ionic/HTML/CSS/JS. Both frontends can talk to the same API.
