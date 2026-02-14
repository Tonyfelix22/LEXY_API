# Railway Deployment Guide for LEXIE ERP

This project is a monorepo with both a Django backend and Next.js frontend. You need to deploy them as **two separate services** on Railway.

## Current Setup

- **Backend**: Django API (deployed from repo root)
- **Frontend**: Next.js app (located in `LEXIE_ERP/Frontend/`)

## Step 1: Backend Service (Already Configured ✅)

Your backend service is already set up and working. It uses:
- Root directory: `/` (repo root)
- Build: Detected via `requirements.txt`
- Start command: `python start_server.py` (from `Procfile`)

## Step 2: Create Frontend Service

### 2.1 Add New Service in Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** → **"GitHub Repo"**
3. Select the **same repository** (you're creating a second service from the same repo)
4. Railway will create a new service

### 2.2 Configure Frontend Service Settings

In the new service's **Settings** tab:

1. **Root Directory**: Set to `LEXIE_ERP/Frontend`
   - This tells Railway where to find the Next.js app
   - Railway will detect it's a Node.js/Next.js project from `package.json`

2. **Build Command**: Railway should auto-detect `npm run build`
   - If not, manually set: `npm install && npm run build`

3. **Start Command**: Railway should auto-detect `npm start`
   - If not, manually set: `npm start`

### 2.3 Set Environment Variables

In the frontend service's **Variables** tab, add:

```
NEXT_PUBLIC_BASE_API=https://your-backend-service-url.railway.app/api
```

**Important**: Replace `your-backend-service-url` with your actual backend service URL from Railway.

To find your backend URL:
1. Go to your backend service in Railway
2. Click on the service
3. Go to the **Settings** tab
4. Find the **Public Domain** or check the **Deployments** tab for the generated URL
5. The URL will look like: `https://your-backend-name-production.up.railway.app`

### 2.4 Deploy

1. Railway will automatically detect the changes and start building
2. Wait for the build to complete
3. Railway will generate a public URL for your frontend service

## Step 3: Verify Deployment

1. **Backend URL**: Should show Django API responses (or 404 for root `/`)
2. **Frontend URL**: Should show your Next.js application

## Troubleshooting

### Frontend can't connect to backend

- Check that `NEXT_PUBLIC_BASE_API` is set correctly in the frontend service
- Ensure the backend URL includes `/api` at the end
- Verify CORS is configured in Django settings to allow requests from your frontend domain

### Build fails

- Check that the Root Directory is set to `LEXIE_ERP/Frontend`
- Verify `package.json` exists in that directory
- Check build logs for specific errors

### Port conflicts

- Railway automatically assigns ports via the `PORT` environment variable
- Next.js should use `PORT` automatically (Next.js 15+ supports this)
- If issues persist, you may need to modify the start script

## Environment Variables Summary

### Backend Service
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` (from PostgreSQL service)
- `SECRET_KEY` (Django secret key)
- `PORT` (auto-set by Railway)

### Frontend Service
- `NEXT_PUBLIC_BASE_API` (backend API URL)
- `PORT` (auto-set by Railway)

## Notes

- Both services will be deployed from the same GitHub repository
- Each service can have different root directories and build commands
- Railway will automatically redeploy when you push to your main branch
- You can set up custom domains for each service in Railway settings
