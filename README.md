# Sprach Prufung / EGIM School Management

Full-stack admin application for EGIM class management. The app uses React, Express, MongoDB, Mongoose, and JWT authentication.

## Current Workflow

- Admin login
- Create, edit, and delete classes
- Add, edit, delete, search, and sort students inside a class
- Add, edit, and delete student notes by subject
- Automatic average calculation per student
- Dashboard cards for total classes, total students, average grade, and recent students

There are no groups, demo records, public result pages, certificate generation, or Excel import/export features in the current workflow.

## Project Structure

```text
client/  React frontend
server/  Express API and MongoDB models
```

## Environment

Backend `server/.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/school_management
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://sprach-pr-fung-client.vercel.app
NODE_ENV=development
PORT=5000
JWT_EXPIRES_IN=7d
```

Frontend `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

For production, set `REACT_APP_API_URL=https://sprach-pr-fung-server.vercel.app`.

## Local Development

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:5000`.

## Admin Account

Create or update the EGIM admin manually:

```bash
ADMIN_EMAIL=Bilaladmin@egim.ma ADMIN_PASSWORD='your_password_here' npm run seed:admin --prefix server
```

To update an existing admin password/profile, add:

```bash
OVERWRITE_ADMIN=true
```

The seed scripts hash passwords with bcryptjs and never run automatically during deployment.

## API Routes

All routes except auth and health require `Authorization: Bearer <token>`.

- `GET /`
- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/classes`
- `POST /api/classes`
- `PUT /api/classes/:id`
- `DELETE /api/classes/:id`
- `GET /api/students`
- `POST /api/students`
- `GET /api/students/:id`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `POST /api/students/:id/notes`
- `PUT /api/students/:id/notes/:noteId`
- `DELETE /api/students/:id/notes/:noteId`
- `GET /api/analytics`

## Legacy Data Migration

If the database contains older class/group or fixed-exam records, run the migration manually after backing up MongoDB:

```bash
npm run migrate:egim --prefix server
```

The migration:

- splits legacy `fullName` into first and last name where needed
- converts legacy `exam1` to `exam4` values into note records if the student has no notes
- removes obsolete `groupNumber` fields from class and student documents
- removes obsolete certificate counters from student documents

It does not delete students, classes, admins, or production data.

## MongoDB Atlas Notes

The production URI must select the `school_management` database before query parameters:

```text
mongodb+srv://username:password@cluster.example.mongodb.net/school_management?retryWrites=true&w=majority
```

Atlas Network Access must allow Vercel to connect. `0.0.0.0/0` is common for Vercel serverless deployments, but it allows connections from any IP, so keep strong database credentials and least-privilege permissions. URL-encode special characters in the password.

## Deployment

Deploy as two separate Vercel projects:

- Frontend root directory: `client`
- Backend root directory: `server`

See `deployment.md` for the exact Vercel settings.
