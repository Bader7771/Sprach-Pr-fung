# Deployment

The app is an npm workspace monorepo with the frontend in `client` and the backend in `server`. Deploy them as separate Vercel projects. The frontend is a static Create React App deployment; the backend is an Express API served by `server/api/index.js`.

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
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "installCommand": "npm install --workspaces --include-workspace-root",
  "buildCommand": "GENERATE_SOURCEMAP=false npm run build --workspace=school-management-client",
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
  "$schema": "https://openapi.vercel.sh/vercel.json",
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

Add this environment variable in the frontend Vercel project. It must point to a public backend production alias, not an SSO-protected preview URL:

- `REACT_APP_API_URL=https://sprach-pr-fung-server.vercel.app/api`

The app has the same backend URL as a production fallback so React does not crash if the variable is missing, but the frontend Vercel environment variable should still be set explicitly. The backend deployment must be public; Vercel SSO-protected preview URLs will not work for browser API calls because browser preflight requests cannot follow the SSO redirect.

## Backend

Deploy the backend as a separate Vercel project with Root Directory set to `server`. The server folder contains its own `vercel.json`, so Vercel will install server dependencies and will not run the frontend `react-scripts` build command.

Use these settings:

- Root Directory: `server`
- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: leave empty / use `server/vercel.json`
- Output Directory: leave empty

The backend `server/vercel.json` should be:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    }
  ]
}
```

Add these Environment Variables in Vercel:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL=https://sprach-pr-fung-client.vercel.app`
- Optional for multiple frontend domains: `CLIENT_URLS=https://<production-domain>,https://<preview-domain>`

After deploy, test one of these backend URLs:

- https://sprach-pr-fung-server.vercel.app/api/health
- https://sprach-pr-fung-server-git-main-bader7771s-projects.vercel.app/api/health
- https://sprach-pr-fung-server-prlqbupym-bader7771s-projects.vercel.app/api/health

Redeploy the frontend after the backend URL is added as `REACT_APP_API_URL`.

## Notes

- The backend currently stores uploaded files on local disk. On Vercel this is temporary storage, so uploaded files are not permanent.
- For production, move file uploads to Cloudinary, S3, or another persistent storage service.
