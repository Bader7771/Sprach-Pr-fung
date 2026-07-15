# School Management System

Full-stack school management app built with React, React Router, Axios, React Hook Form, Tailwind-enabled native CSS, Node.js, Express, MongoDB, Mongoose, JWT, PDFKit, and ExcelJS.

## Features

- Admin JWT login, protected dashboard, logout
- Class/group CRUD
- Student CRUD with four exam notes and automatic final-note average
- Public student result portal with class, group, and name filters
- Dashboard analytics: classes, groups, students, average score, best student, certificates generated
- Professional A4 PDF certificate download per student
- Excel export, Excel import, bulk upload
- Pagination, global search, toast notifications, confirmation modal
- Dark/light mode and responsive dashboard UI
- Role-ready admin model and audit logs

## Folder Structure

```text
client/
  src/api/http.js
  src/components/
  src/context/AuthContext.jsx
  src/pages/
  src/styles/app.css
server/
  api/index.js
  vercel.json
  src/config/db.js
  src/controllers/
  src/middleware/
  src/models/
  src/routes/
  src/seed/seed.js
  src/services/
```

## MongoDB Collections

- `admins`: admin users with hashed passwords and roles
- `classrooms`: class name and group number records
- `students`: student profile, class/group snapshot, exam notes, final note, certificate count
- `results`: normalized result document per student
- `auditlogs`: create/update/delete/import/certificate events

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Start MongoDB locally or set `MONGO_URI` in `server/.env`. The URI must include a database name after the host.

4. Seed sample data. Set `SEED_ADMIN_PASSWORD` in `server/.env` first if the sample admin does not already exist:

```bash
npm run seed
```

Sample admin email:

```text
email: admin@school.com
```

5. Run both apps:

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: set with `REACT_APP_API_URL`

## REST API

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Classes

- `GET /api/classes`
- `POST /api/classes`
- `PUT /api/classes/:id`
- `DELETE /api/classes/:id`

### Students and Results

- `GET /api/students`
- `GET /api/students/public`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `GET /api/students/:id/certificate`
- `GET /api/students/export/excel`
- `POST /api/students/import/excel`

### Analytics

- `GET /api/analytics`

## Excel Import Format

Use the first worksheet with this header order:

```text
Full Name | Class Name | Group Number | Exam 1 | Exam 2 | Exam 3 | Exam 4
```

The importer creates missing class/group records automatically.

## Environment Variables

Backend `server/.env`:

```text
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/sprach_prufung
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=https://sprach-pr-fung-client.vercel.app
ALLOWED_ORIGINS=https://sprach-pr-fung-client.vercel.app,http://localhost:3000,http://localhost:5173
NODE_ENV=development
PORT=5001
SEED_ADMIN_EMAIL=admin@school.com
SEED_ADMIN_PASSWORD=replace_with_a_temporary_local_seed_password
```

Frontend `client/.env`:

```text
REACT_APP_API_URL=https://sprach-pr-fung-server.vercel.app
```

This is a Create React App frontend, so production builds use `REACT_APP_API_URL`. The value should be the backend origin only; the Axios client appends `/api`.

## Health Checks

- `GET /`
- `GET /api/health`

The backend returns JSON for unknown routes, including unknown `/api/*` routes.

## Deployment

Deploy the same repository as two Vercel projects:

- Frontend Root Directory: `client`
- Backend Root Directory: `server`

See [deployment.md](./deployment.md) for exact Vercel settings, MongoDB Atlas notes, and troubleshooting steps.

## Safe Seeding

`npm run seed` is non-destructive by default. It creates the sample admin and sample data only when missing. To create a missing admin, set `SEED_ADMIN_PASSWORD` in `server/.env` or in your shell for that one seed run.

For local development only, use `RESET_SEED_DATA=true npm run seed` to reset sample data. The seed script blocks this reset in production.
