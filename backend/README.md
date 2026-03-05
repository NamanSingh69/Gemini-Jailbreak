# Render Deployment Guide — Gemini Jailbreak Backend

## ⚠️ Cold Start Disclaimer

> **Render Free Tier services spin down after 15 minutes of inactivity.** The first request after idle will take **30–60 seconds** as the container restarts. This is expected behavior and cannot be avoided on the free tier.

---

## 🔑 Getting Your Free Gemini API Key

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **"Create API Key"** → Select any Google Cloud project (or create one)
4. Copy the generated key — it's **free** with generous rate limits (15 RPM for flash models, 2 RPM for pro)

> **Tip:** The free tier includes access to `gemini-2.5-pro`, `gemini-flash-latest`, and `gemini-flash-lite-latest`. No credit card required.

## 🔄 Model Fallback Routing

This backend already implements **autonomous model fallback**. The allowed models are tried in this priority:

| Priority | Model | Speed | Quality | Free Tier RPM |
|----------|-------|-------|---------|---------------|
| 1 | `gemini-2.5-pro` | Slow | Highest | 2 RPM |
| 2 | `gemini-flash-latest` | Fast | High | 15 RPM |
| 3 | `gemini-flash-lite-latest` | Fastest | Good | 30 RPM |

The user selects a model in the frontend. If an API call fails (e.g., 429 quota exceeded), the frontend can retry with a lower-tier model.

---

## Environment Variables (Render Dashboard)

| Variable | Required | Value |
|----------|----------|-------|
| — | — | No server-side env vars needed. Users provide their API key via the `x-api-key` header from the frontend. |

---

## Deployment Steps

### 1. Create a Render Web Service
1. Go to [render.com/new](https://dashboard.render.com/new)
2. Connect your GitHub repository
3. Set **Root Directory** to `backend`
4. Set **Environment** to `Docker`
5. Set **Instance Type** to `Free`

### 2. Render Auto-Detects the Dockerfile
The `Dockerfile` and `start.sh` are already configured:
```
Dockerfile → python:3.10-slim → installs requirements → runs start.sh
start.sh   → uvicorn app:app --host 0.0.0.0 --port $PORT
```

### 3. Update Frontend CORS
After deployment, update the CORS `allow_origins` in `app.py` to include your Vercel URL:
```python
allow_origins=["http://localhost:5173", "https://your-app.vercel.app"],
```

---

## Resource Limits

| Resource | Render Free Tier | This Project |
|----------|-----------------|--------------|
| RAM | 512 MB | ~80 MB (FastAPI + dependencies) |
| CPU | Shared | Sufficient for API proxy |
| Bandwidth | 100 GB/month | Lightweight JSON payloads |
| Storage | 1 GB | No local storage needed |