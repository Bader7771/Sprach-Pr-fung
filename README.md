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

3. Start MongoDB locally or set `MONGODB_URI` in `server/.env`.

4. Seed sample data:

```bash
npm run seed
```

Sample admin:

```text
email: admin@school.com
password: Admin12345
```

5. Run both apps:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
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
