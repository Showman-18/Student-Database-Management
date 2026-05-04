# Student Management System

A desktop-first student management app built with Electron, React, Express, and SQLite.

## Features

- First-run admin setup (no hardcoded default login required)
- Secure JWT authentication and protected routes
- Student CRUD, search, sorting, and detailed modal view
- Excel import/export for student records
- Local SQLite database (offline runtime)
- Backup center with create, import, download, restore, and delete
- Database quick check and integrity check
- Recovery mode write-lock when database health is not safe
- Electron desktop mode with local backend auto-start

## Tech Stack

### Frontend

- React 19 + Vite
- React Router
- Tailwind CSS
- Axios
- Lucide React

### Backend

- Node.js + Express
- SQLite3
- bcryptjs
- JWT
- multer (backup file upload)
- xlsx

### Desktop

- Electron

## Running The App

From project root:

1. Install all required dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

2. Start desktop app for development (backend + frontend + electron):

```bash
npm run desktop:dev
```

3. Start desktop app in production-style mode:

```bash
npm run desktop
```

4. Seed sample data (optional):

```bash
npm run seed
```

## Script Reference

### Root scripts (package.json)

- `npm run dev:backend` → runs backend watch mode
- `npm run dev:frontend` → runs Vite dev server
- `npm run dev:electron` → waits for ports then starts Electron in dev mode
- `npm run desktop:dev` → runs backend + frontend + Electron together
- `npm run build:frontend` → builds frontend only
- `npm run desktop` → builds frontend, then starts Electron
- `npm run seed` → runs backend seed script

### Backend scripts (backend/package.json)

- `npm run start` → run backend once
- `npm run dev` → run backend with watch mode
- `npm run seed` → seed SQLite database

### Frontend scripts (frontend/package.json)

- `npm run dev` → start Vite dev server
- `npm run build` → build frontend assets
- `npm run lint` → run ESLint
- `npm run preview` → preview built frontend

## Environment Variables

Use backend/.env (copy from backend/.env.example):

```bash
JWT_SECRET=your_jwt_secret_key_change_this_in_production
PORT=3000

# Optional safety settings
# SQLITE_DB_PATH=./data/student_management.db
# SQLITE_BACKUP_DIR=./data/backups
# BACKUP_RETENTION_COUNT=30
# BACKUP_INTERVAL_MINUTES=1440
# DB_HEALTHCHECK_INTERVAL_MINUTES=360
# FORCE_RECOVERY_MODE=false
```

Notes:

- In Electron mode, DB and backups are redirected to Electron userData path.
- `FORCE_RECOVERY_MODE=true` is only for testing write-lock behavior.

## First-Run Authentication Flow

1. On first launch (no admin user in DB), Login page switches to setup mode.
2. User creates admin username/password.
3. That account is used for all future logins.
4. Username/password can be changed later from Dashboard → Account Security.

## API Endpoints

### Auth

- `GET /api/auth/status` → check if setup is required
- `POST /api/auth/setup` → create first admin account
- `POST /api/auth/login` → login
- `POST /api/auth/update-credentials` → change username/password (protected)

### Students (protected)

- `GET /api/students`
- `GET /api/students/:id`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `PUT /api/students/:id/fees/:year/:term`
- `POST /api/students/:id/fees/year`
- `GET /api/students/export/excel`
- `POST /api/students/import/excel`

### System Safety (protected)

- `GET /api/system/db/status`
- `GET /api/system/backups`
- `POST /api/system/backups`
- `GET /api/system/backups/download/:fileName`
- `POST /api/system/backups/import` (multipart field: `backupFile`)
- `DELETE /api/system/backups/:fileName`
- `POST /api/system/backups/restore`

## Backup & Recovery

- SQLite runs with durability pragmas (WAL, synchronous, busy timeout, etc.)
- Automated backup scheduling supported
- Manual backup/restore/import/download/delete from Dashboard
- Backup filename format:

```text
student_management_backup_Day_Date_Month_Year_HH-MM-SS_AMPM.db
```

- If DB health is not OK, app enters recovery mode:
    - Write APIs are blocked for safety
    - Backup/recovery routes remain allowed
    - Dashboard/Students show a red warning banner

## Project Structure (Current)

```text
Student Database Management/
├── backend/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── dbSafety.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── students.js
│   │   └── system.js
│   ├── services/
│   │   └── backupService.js
│   ├── data/
│   │   ├── student_management.db
│   │   └── backups/
│   ├── .env
│   ├── .env.example
│   ├── db.js
│   ├── Index.js
│   ├── seed.js
│   └── package.json
├── electron/
│   └── main.cjs
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── package.json
```

## Offline Behavior

- Runtime usage is offline-capable (local backend + local DB).
- Internet is needed for dependency installation, updates, and installer downloads.

## License

ISC
# EduManager
