# Deployment

The repository is deployed as two separate Vercel projects.

## Backend Project

- Root Directory: `server`
- Install Command: `npm install`
- Runtime: Node.js 20
- Vercel entry: `server/api/index.js`

Environment variables:

```env
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/school_management
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=https://sprach-pr-fung-client.vercel.app
ALLOWED_ORIGINS=https://sprach-pr-fung-client.vercel.app,http://localhost:3000,http://localhost:5173
NODE_ENV=production
JWT_EXPIRES_IN=7d
```

Deploy and verify:

- `https://sprach-pr-fung-server.vercel.app/`
- `https://sprach-pr-fung-server.vercel.app/api/health`

## Frontend Project

- Root Directory: `client`
- Install Command: `npm install`
- Build Command: `GENERATE_SOURCEMAP=false npm run build`
- Output Directory: `build`

Environment variables:

```env
REACT_APP_API_URL=https://sprach-pr-fung-server.vercel.app
```

Deploy again after adding or changing environment variables. Verify browser Network requests target:

```text
https://sprach-pr-fung-server.vercel.app/api/...
```

and not localhost.

## Admin Seed

Create or update the EGIM admin from a trusted local shell or controlled backend environment:

```bash
ADMIN_EMAIL=Bilaladmin@egim.ma ADMIN_PASSWORD='your_password_here' npm run seed:admin --prefix server
```

To update an existing account:

```bash
OVERWRITE_ADMIN=true ADMIN_EMAIL=Bilaladmin@egim.ma ADMIN_PASSWORD='your_password_here' npm run seed:admin --prefix server
```

Do not commit passwords or `.env` files.

## EGIM Migration

If production still has legacy group/fixed-exam data, back up MongoDB first, then run:

```bash
npm run migrate:egim --prefix server
```

This converts legacy exam values to notes and removes obsolete group fields. It does not run automatically.

## Debugging

- Vercel environment-variable changes require a new deployment.
- Use Vercel Function Logs for backend exceptions.
- Use the browser Network tab to inspect request URL, method, status, and response JSON.
- `GET /api/auth/login` returning 405 is expected; login is `POST /api/auth/login`.
