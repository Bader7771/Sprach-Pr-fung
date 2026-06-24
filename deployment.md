# Deployment

The app is an npm workspace monorepo with the frontend in `client` and the backend in `server`. Deploying from the repository root builds the frontend to `client/build` and serves `/api/*` through the root Vercel serverless function in `api/[...path].js`.

## Frontend on Vercel

Use these settings:

- Root Directory: leave empty / project root
- Framework Preset: `Create React App`
- Install Command: `npm install --workspaces --include-workspace-root`
- Build Command: `GENERATE_SOURCEMAP=false npm run build --workspace=school-management-client`
- Output Directory: `client/build`

The root `vercel.json` contains the same frontend settings:

```json
{
  "version": 2,
  "installCommand": "npm install --workspaces --include-workspace-root",
  "buildCommand": "GENERATE_SOURCEMAP=false npm run build --workspace=school-management-client",
  "outputDirectory": "client/build",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
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
  "buildCommand": "GENERATE_SOURCEMAP=false npm run build",
  "outputDirectory": "build",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Add this environment variable in the frontend Vercel project:

- `REACT_APP_API_URL=https://sprach-pr-fung-server-bader7771s-projects.vercel.app/api`

The app has the same backend URL as a fallback so React does not crash if the variable is missing, but the frontend Vercel environment variable should still be set explicitly. The backend deployment must be public; Vercel SSO-protected preview URLs will not work for browser API calls.

## Backend

Deploy the backend as a separate Vercel project with Root Directory set to `server`. The server folder contains its own `vercel.json`, so Vercel will install server dependencies and will not run the frontend `react-scripts` build command.

Use these settings:

- Root Directory: `server`
- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: leave empty / use `server/vercel.json`
- Output Directory: leave empty

Add these Environment Variables in Vercel:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL=https://<your-frontend-domain>.vercel.app`
- Optional for multiple frontend domains: `CLIENT_URLS=https://<production-domain>,https://<preview-domain>`

After deploy, test one of these backend URLs:

- https://sprach-pr-fung-server.vercel.app/api/health
- https://sprach-pr-fung-server-git-main-bader7771s-projects.vercel.app/api/health
- https://sprach-pr-fung-server-prlqbupym-bader7771s-projects.vercel.app/api/health

Redeploy the frontend after the backend URL is added as `REACT_APP_API_URL`.

## Notes

- The backend currently stores uploaded files on local disk. On Vercel this is temporary storage, so uploaded files are not permanent.
- For production, move file uploads to Cloudinary, S3, or another persistent storage service.
