# Deployment

This repository is deployed as two separate Vercel projects from the same GitHub repository:

- Frontend project Root Directory: `client`
- Backend project Root Directory: `server`

There is intentionally no root-level `vercel.json`. The `client/vercel.json` and `server/vercel.json` files are the deployment sources of truth.

## Backend Project

Import the GitHub repository into Vercel and use these settings:

- Root Directory: `server`
- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: leave empty
- Output Directory: leave empty

Add these Vercel environment variables:

```text
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/school_management
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=https://sprach-pr-fung-client.vercel.app
ALLOWED_ORIGINS=https://sprach-pr-fung-client.vercel.app,http://localhost:3000,http://localhost:5173
NODE_ENV=production
```

Deploy, then verify:

- `https://sprach-pr-fung-server.vercel.app/`
- `https://sprach-pr-fung-server.vercel.app/api/health`

The backend Vercel rewrite sends `/`, `/api/health`, and all `/api/*` requests to `server/api/index.js`, which exports the Express app without calling `app.listen()`.

## Frontend Project

Import the same GitHub repository into Vercel and use these settings:

- Root Directory: `client`
- Framework Preset: `Create React App`
- Install Command: `npm install`
- Build Command: `GENERATE_SOURCEMAP=false npm run build`
- Output Directory: `build`

This frontend is Create React App, so the API variable must be:

```text
REACT_APP_API_URL=https://sprach-pr-fung-server.vercel.app
```

Do not include `/api` in the Vercel value. The shared Axios client appends `/api` exactly once. Redeploy the frontend after adding or changing environment variables because CRA reads them at build time.

After deployment, open the browser Network tab and confirm API requests target `https://sprach-pr-fung-server.vercel.app/api/...`, not `localhost`.

## MongoDB Atlas

Use MongoDB Atlas with the existing `MONGO_URI` variable.

- The URI must include the production database name: `/school_management`.
- `MONGO_URI` is the required production variable. `MONGODB_URI` is accepted only as a compatibility fallback for older deployments.
- Special characters in the database password must be URL encoded.
- The database user must have read/write permissions for the target database.
- Atlas Network Access must allow Vercel serverless functions to connect. The common quick option is `0.0.0.0/0`, which allows connections from any IP address; use it only with strong database credentials and least-privilege users, or replace it with a tighter access strategy if your hosting/network setup supports one.

## Admin Seeding

`npm run seed --prefix server` is non-destructive by default. It creates the sample admin only if it does not already exist and upserts sample records without deleting production data.

To create a missing admin, set these only for the seed run or in a local `.env` file:

```text
SEED_ADMIN_EMAIL=admin@school.com
SEED_ADMIN_PASSWORD=replace_with_a_temporary_local_seed_password
```

To create only an admin without sample classes/students, run this manually from a trusted shell:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=replace_with_a_strong_password npm run seed:admin --prefix server
```

Set `OVERWRITE_ADMIN=true` only when you intentionally want to replace an existing admin password.

For local development only, `RESET_SEED_DATA=true npm run seed --prefix server` clears and recreates sample data. The script refuses this reset when `NODE_ENV=production`.

## Troubleshooting

- Environment-variable changes require a new Vercel deployment.
- Use Vercel Function Logs on the backend project to inspect startup, MongoDB, CORS, and route errors.
- Use the browser Network tab to inspect request URLs, status codes, CORS preflights, and JSON error messages.
- `Cannot GET /` previously appeared because the backend root path was not routed to a JSON health response. The backend now responds at `/` with a safe API-running message and at `/api/health` with service and database status.
