# Vercel Deployment Guide — Gemini Jailbreak Frontend

## Pre-Deployment Checklist

| Item | Status |
|------|--------|
| `vercel.json` configured | ✅ Generated |
| Build command | `npm run build` |
| Output directory | `dist` |
| Framework preset | `vite` |
| Node.js version | ≥ 18 |

## Vercel Dashboard Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| — | — | No environment variables needed. The API key is provided by the user at runtime via the frontend UI and sent as a header (`x-api-key`) to the backend. |

> **Note:** The frontend connects to a backend API at `http://localhost:8000`. For production, you must update the API base URL in the frontend code to point to your deployed Render backend URL (see backend `DEPLOY.md`).

## Deployment Steps

### Option 1: Vercel CLI
```bash
cd "Gemini Jailbreak/frontend"
npm install
npx vercel --prod
```

### Option 2: Git Integration
```bash
# Push to GitHub, then import on Vercel Dashboard
# Set "Root Directory" to: frontend
```

## `vercel.json` Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## Free Tier Limits

| Resource | Vercel Free Tier | This Project |
|----------|-----------------|--------------|
| Bandwidth | 100 GB/month | ~500 KB/visit — well within limits |
| Bundle Size | 50 MB | ~2 MB (React + markdown) |
| Build Time | 6,000 min/month | ~10 seconds per build |

## Architecture Note

This is a **split deployment**:
- **Frontend** (this project) → Vercel (static SPA)
- **Backend** (`../backend/`) → Render (Python FastAPI)

Ensure CORS is updated in the backend to allow your Vercel deployment URL.
