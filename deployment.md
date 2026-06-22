# Deployment

The frontend is an npm workspace in `client`. Deploy it from the repository root so Vercel uses the root workspace lockfile and writes the static output to `client/dist`.

## Frontend on Vercel

Use these settings:

- Root Directory: leave empty / project root
- Framework Preset: `Vite`
- Install Command: `npm install --include=optional`
- Build Command: `npm run build --workspace=school-management-client`
- Output Directory: `client/dist`

The root `vercel.json` contains the same frontend settings:

```json
{
  "installCommand": "npm install --include=optional",
  "buildCommand": "npm run build --workspace=school-management-client",
  "outputDirectory": "client/dist"
}
```

Add this environment variable in Vercel:

- `VITE_API_URL=https://<your-backend-project>.vercel.app`

## Backend

The backend in `server/src/server.js` is a normal Express app that calls `app.listen()`. Do not deploy it as the same Vercel frontend project, and do not use the client build command for it.

Recommended production options:

- Deploy the backend on Render, Railway, Fly.io, or another Node server host.
- Or convert the Express routes to Vercel serverless API functions before deploying the backend on Vercel.

If you still create a separate Vercel project for the current server folder, use these settings:

- Root Directory: `server`
- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: leave empty
- Output Directory: leave empty

Add these Environment Variables in Vercel:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL=https://<your-frontend-domain>.vercel.app`

After deploy, test one of these backend URLs:

- https://sprach-pr-fung-server.vercel.app/api/health
- https://sprach-pr-fung-server-git-main-bader7771s-projects.vercel.app/api/health
- https://sprach-pr-fung-server-prlqbupym-bader7771s-projects.vercel.app/api/health

Redeploy the frontend after the backend URL is added as `VITE_API_URL`.

## Notes

- The backend currently stores uploaded files on local disk. On Vercel this is temporary storage, so uploaded files are not permanent.
- For production, move file uploads to Cloudinary, S3, or another persistent storage service.
