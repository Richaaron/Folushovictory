# Build IT — Multi-Platform School Results System

A multi-platform school result management system with a Node.js/Express backend and a Vue 3 frontend. The repository includes:

- `backend/` — Express API, Firebase Firestore integration, JWT auth, admin/teacher/parent routes.
- `frontend-vue/` — Vue 3 + Vite frontend with Electron and Capacitor configuration for desktop and mobile builds.

---

## Project Structure

```
Build IT/
├── backend/          # Node.js + Express API (JWT auth, Firebase)
│   ├── scripts/      # One-time bootstrapping scripts
│   └── src/          # Server source code
└── frontend-vue/     # Vue 3 + TypeScript frontend
    ├── src/          # UI, router, stores, services
    ├── android/      # Capacitor Android app files
    ├── electron/     # Electron desktop app files
    ├── public/       # Static assets
    └── dist/         # Built web output
```

## Prerequisites

| Tool | Minimum Version |
|------|-----------------|
| Node.js | 18+ |
| npm | latest compatible with Node 18+ |
| Firebase | Firestore enabled |

> Android SDK / Java JDK are only required if you build the mobile APK.

---

## Backend Setup

1. Open a terminal and navigate to `backend`:

```bash
cd backend
```

2. Copy the sample environment file:

```powershell
copy .env.example .env
```

3. Edit `backend/.env` and set your Firebase and application values.

Key variables:

```env
PORT=4000
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=12h
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=C:\absolute\path\to\serviceAccountKey.json
FRONTEND_ORIGIN=http://localhost:5173
```

4. Install backend dependencies:

```bash
npm install
```

5. Bootstrap the app once:

```bash
npm run create-admin
npm run seed-defaults
```

6. Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:4000`.

---

## Frontend Setup

1. Open a terminal and navigate to `frontend-vue`:

```bash
cd frontend-vue
```

2. Install dependencies:

```bash
npm install
```

3. Start the development frontend:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173` by default.

---

## Frontend API Configuration

The frontend resolves the API base URL using `VITE_API_URL` first, then falls back to:

- `http://localhost:4000` for local browser development
- `https://folushovictory-backend.onrender.com` for production deployments

If you need a custom endpoint, set `VITE_API_URL` in `frontend-vue/.env`.

---

## Power BI Reporting Integration

This project now includes a Power BI-friendly export endpoint in the backend API.

- Admins can fetch JSON-ready report data from `GET /api/admin/powerbi/export`
- Use the query string parameters `session` and `term` to scope data
- Power BI can consume this endpoint using the Web connector and generate dashboards from:
  - `classes`
  - `students`
  - `publishes`
  - `scores`
  - aggregated summaries like `studentsByClass` and `scoreStatsByClass`

To use Power BI against the local backend during development:

```bash
cd backend
npm run dev
```

Then point Power BI Desktop to:

```
http://localhost:4000/api/admin/powerbi/export
```

> Note: this endpoint is protected by admin JWT bearer authentication.
> You must provide an `Authorization: Bearer <token>` header, so use Power BI's advanced Web connector settings or a custom connector.

Example URL with filters:

```
http://localhost:4000/api/admin/powerbi/export?session=2025/2026&term=Third
```

If you are using the hosted backend, point Power BI to:

```
https://folushovictory-backend.onrender.com/api/admin/powerbi/export
```

---

## Running the App

1. Start the backend:

```bash
cd backend
npm run dev
```

2. Start the frontend:

```bash
cd frontend-vue
npm run dev
```

3. Open the browser at `http://localhost:5173`.

---

## Build Targets

### Web

```bash
cd frontend-vue
npm run build:web
```

### Android APK (Local build prerequisites)

To build locally you need:
- Java JDK 17+ installed
- `JAVA_HOME` set to the JDK install path
- `JAVA_HOME\bin` on your `PATH`
- Android SDK installed

The local build command is:

```bash
cd frontend-vue
npm run build:apk
```

If `npm run build:apk` fails with `JAVA_HOME is not set`:
1. Install a JDK
2. Set `JAVA_HOME` to the JDK folder
3. Add `%JAVA_HOME%\bin` to `PATH`
4. Re-open the terminal and rerun the build

### GitHub Actions APK Build

This repository includes `.github/workflows/android-apk.yml` to build a signed Android APK automatically.

Required GitHub secrets:
- `ANDROID_KEYSTORE_BASE64` — base64-encoded `android/app/build-keystore.jks`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Generate a keystore locally:

```bash
keytool -genkeypair -v -keystore android/app/build-keystore.jks -alias builditutor -keyalg RSA -keysize 2048 -validity 10000
base64 android/app/build-keystore.jks > keystore.b64
```

Then copy the contents of `keystore.b64` into the `ANDROID_KEYSTORE_BASE64` secret.

### Electron (Windows)

```bash
cd frontend-vue
npm run build:exe
```

### Android APK

```bash
cd frontend-vue
npm run build:apk
```

---

## Notes

- The repository uses `frontend-vue/`, not a Python Flask frontend.
- `backend/` is the active Express API implementation.
- Keep sensitive keys out of source control; do not commit `backend/.env` or `frontend-vue/.env`.
