# Vercel Deployment

Deploy this repo as two separate Vercel projects.

## Backend

Create a Vercel project with:

- Root Directory: `server`
- Framework Preset: `Other`
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: `npm install`

Add these Environment Variables in Vercel:

- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN=https://<your-frontend-domain>.vercel.app`

After deploy, test one of these backend URLs:

- https://sprach-pr-fung-server.vercel.app/api/health
- https://sprach-pr-fung-server-git-main-bader7771s-projects.vercel.app/api/health
- https://sprach-pr-fung-server-prlqbupym-bader7771s-projects.vercel.app/api/health

If you want the client to use the deployed backend, set `VITE_API_URL` to one of the above backend URLs.

## Frontend

Create a second Vercel project with:

- Root Directory: `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Add this Environment Variable in Vercel:

- `VITE_API_URL=https://<your-backend-project>.vercel.app`

Redeploy the frontend after the backend URL is added.

## Notes

- The backend currently stores uploaded files on local disk. On Vercel this is temporary storage, so uploaded files are not permanent.
- For production, move file uploads to Cloudinary, S3, or another persistent storage service.
