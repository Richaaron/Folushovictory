# Folusho Victory Schools — Result Computing System

A full-stack school result management system with three role-based portals (Admin, Teacher, Parent), built with **Node.js/Express** (backend), **Python/Flask** (frontend), and **Firebase Firestore** (database).

---

## Project Structure

```
Build IT/
├── backend/          # Node.js + Express API (JWT auth, Firebase)
│   ├── scripts/
│   │   ├── createAdmin.js    # One-time: create the admin user
│   │   └── seedDefaults.js   # Seed subjects & default grading scale
│   └── src/
│       ├── routes/           # auth, admin, teacher, parent, results
│       ├── repos/            # Firestore data-access layer
│       ├── compute.js        # Grade/position/broadsheet computation
│       └── index.js          # Express entry point
│
└── frontend/         # Python Flask (server-side rendered, Tailwind CSS)
    ├── app.py                # All Flask routes
    ├── templates/
    │   ├── base.html         # Shared layout
    │   ├── landing.html      # Portal selection page
    │   ├── login.html        # Shared login form
    │   ├── admin/            # Admin portal templates
    │   ├── teacher/          # Teacher portal templates
    │   └── parent/           # Parent portal + printable report card
    └── static/
        └── logo.svg
```

---

## Prerequisites

| Tool | Min Version |
|------|------------|
| Node.js | 18+ |
| Python | 3.10+ |
| Firebase project | Firestore enabled |

---

## 1 — Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a project.
2. Enable **Firestore** (Native mode).
3. Go to **Project Settings → Service Accounts → Generate New Private Key**.
4. Save the JSON file somewhere safe (e.g., `backend/serviceAccountKey.json`).

---

## 2 — Backend Setup

```bash
cd backend
copy .env.example .env
```

Edit `.env`:

```env
PORT=4000
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=12h
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=C:\absolute\path\to\serviceAccountKey.json
FRONTEND_ORIGIN=http://localhost:5000
```

Install dependencies and bootstrap:

```bash
npm install

# 1. Create the admin user (first time only)
npm run create-admin
#   → prints: username: admin | password: <generated>

# 2. Seed default subjects + grading scale
npm run seed-defaults

# 3. Start the dev server
npm run dev
```

Backend runs on **http://localhost:4000**

---

## 3 — Frontend Setup

```bash
cd frontend
copy .env.example .env
```

Edit `.env`:

```env
FLASK_SECRET_KEY=any_random_string
BACKEND_URL=http://localhost:4000
PORT=5000
```

Install Python dependencies and run:

```bash
pip install -r requirements.txt
python app.py
```

Frontend runs on **http://localhost:5000**

---

## 4 — First Login

Open **http://localhost:5000** and choose **Admin Portal**.

- **Username:** `admin`
- **Password:** (printed by `npm run create-admin`)

---

## 5 — Admin Workflow

| Step | Where |
|------|-------|
| Create teachers | Admin → Teachers (username + temp password shown once) |
| Create classes | Admin → Classes & Subjects |
| Assign subjects to classes | Admin → Classes & Subjects → Save Subjects |
| Enrol students | Admin → Students (parent credentials auto-generated) |
| Assign teacher ↔ class ↔ subject | Admin → Assignments |
| Configure grading scale | Admin → Grading Scale |
| Set term & resumption date | Admin → Term Settings |
| View broadsheet | Admin → Broadsheet |
| Publish results | Admin → Broadsheet → Publish Results |
| Add principal's remark | Admin → Term Settings → Principal's Remark |

---

## 6 — Teacher Workflow

Login at **http://localhost:5000/teacher/login**

- View assigned classes and subjects on the dashboard
- Click **Enter Scores** → select session & term → fill CA + Exam columns
- Scores are automatically locked once admin publishes results
- Click **Remarks** to add written remarks per student

---

## 7 — Parent Workflow

Login at **http://localhost:5000/parent/login** using credentials given by admin.

- See child's info on the dashboard
- Select session + term → view **Report Card**
- Click **Print / Save PDF** to export

---

## 8 — Assessment Types

| Level | Type | Entry |
|-------|------|-------|
| Pre-Nursery, Nursery | Trait | Excellent / Good / Fair / Poor |
| Primary 1–6 | Numeric | CA (0–40) + Exam (0–60) = Total (0–100) |
| JSS 1–3 | Numeric | CA (0–40) + Exam (0–60) = Total (0–100) |
| SS 1–3 (Science / Art / Commercial) | Numeric | CA (0–40) + Exam (0–60) = Total (0–100) |

Assessment type is automatically derived from the class **level** field:
- If `level` contains `nursery` → `TRAIT`
- Everything else → `NUMERIC`

---

## 9 — Default Grading Scale

| Grade | Range | Remark |
|-------|-------|--------|
| A | 70–100 | Excellent |
| B | 60–69 | Very Good |
| C | 50–59 | Good |
| D | 45–49 | Pass |
| F | 0–44 | Fail |

Configurable by admin at any time without re-seeding.

---

## School Colors

| Color | Hex |
|-------|-----|
| School Green | `#0B6E4F` |
| School Gold | `#D4AF37` |

---

## API Summary (Backend)

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/auth/login` | Public |
| GET | `/api/admin/dashboard` | Admin |
| POST | `/api/admin/teachers` | Admin |
| POST | `/api/admin/students` | Admin |
| POST | `/api/admin/classes` | Admin |
| PUT | `/api/admin/classes/:id/subjects` | Admin |
| POST | `/api/admin/assignments` | Admin |
| GET/POST | `/api/admin/grading-scale` | Admin |
| POST | `/api/admin/term-meta` | Admin |
| POST | `/api/admin/publish-results` | Admin |
| POST | `/api/admin/remarks/principal` | Admin |
| GET | `/api/teacher/assignments` | Teacher |
| GET | `/api/teacher/classes/:id/students` | Teacher |
| POST | `/api/teacher/scores` | Teacher |
| POST | `/api/teacher/traits` | Teacher |
| POST | `/api/teacher/remarks` | Teacher |
| GET | `/api/parent/student` | Parent |
| GET | `/api/results/class/:id/broadsheet` | Admin |
| GET | `/api/results/student/:id/report` | Admin/Teacher/Parent |
