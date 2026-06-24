# Deployment

The frontend is an npm workspace in `client`. Deploy it from the repository root so Vercel uses the root workspace lockfile and writes the static output to `client/build`.

## Frontend on Vercel

Use these settings:

- Root Directory: leave empty / project root
- Framework Preset: `Create React App`
- Install Command: `npm install`
- Build Command: `npm run build --workspace=school-management-client`
- Output Directory: `client/build`

The root `vercel.json` contains the same frontend settings:

```json
{
  "version": 2,
  "installCommand": "npm install",
  "buildCommand": "npm run build --workspace=school-management-client",
  "outputDirectory": "client/build",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

If you set Vercel's Root Directory to `client`, Vercel will use `client/vercel.json` instead:

```json
{
  "version": 2,
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Add this environment variable in Vercel:

- `REACT_APP_API_URL=https://<your-backend-project>.vercel.app`

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

Redeploy the frontend after the backend URL is added as `REACT_APP_API_URL`.

## Notes

- The backend currently stores uploaded files on local disk. On Vercel this is temporary storage, so uploaded files are not permanent.
- For production, move file uploads to Cloudinary, S3, or another persistent storage service.
