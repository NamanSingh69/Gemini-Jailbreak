# Gemini Jailbreak Demo (Backend + Frontend)

A local demo app that calls the Gemini API, supports a server-side system instruction “jailbreak” toggle, model switching, multimodal inputs, Markdown rendering, and in-memory chat history.

## Features
- Public Gemini API via Google GenAI SDK on the Python backend (API key in .env on server only).  
- Optional server-side system instruction: toggle in UI; the actual text is stored in backend code and never exposed to the browser.  
- Models: gemini-2.5-pro, gemini-flash-latest, gemini-flash-lite-latest, selectable in the UI.  
- Parameters: temperature 0.1 (others default), non‑streamed responses.  
- Safety settings: configured to BLOCK_NONE per request for demo purposes.  
- Multimodal inputs: attach images/video/audio alongside text.  
- In‑memory chat history per session; new session generates a fresh session id.  
- Modern dark UI with clear User/Model roles and Markdown rendering (react-markdown + GFM).

## Directory
```

.
├─ backend/
│  ├─ app.py
│  ├─ requirements.txt
│  └─ README.md
└─ frontend/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
└─ src/
├─ main.tsx
├─ App.tsx
├─ api.ts
└─ types.ts

```

## Prerequisites
- Python 3.10+ and pip.  
- Node.js LTS and npm.  
- A Gemini API key 

## Backend setup
```

pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8000

```
- Health endpoints: GET / and GET /healthz.  
- The backend keeps chat history in memory keyed by session_id and resends it each turn.  
- The server-side system instruction is returned by a function in backend/app.py; enable it in the UI with the checkbox to activate.

## Frontend setup
```

cd frontend
npm install
npm run dev

```
- Open the printed localhost URL (default 5173) and begin chatting.  
- The UI clearly labels User vs Model, supports file attachments, and renders Markdown with GFM.

## Model switching
- Use the “Model” selector in the header to switch between gemini-2.5-pro, gemini-flash-latest, and gemini-flash-lite-latest.  
- If a model is temporarily overloaded, the backend returns a friendly error bubble; try again or briefly switch models.

## Jailbreak toggle
- Toggle “Enable server system instruction” in the header to activate the backend’s private system prompt for this session.  
- The system instruction never leaves the server and is not visible in frontend requests.

## Environment and keys
- Get your API key here: https://aistudio.google.com/api-keys
- The API key is sent directly to Google's servers and is never stored by this application

## Troubleshooting
- 503 UNAVAILABLE (“The model is overloaded”): retry, or switch models and try again; the UI will show a readable error bubble.  
- CORS: backend allows http://localhost:5173 by default; update CORS if you change ports or hosts.  
- Empty renders: ensure the backend returns text; the UI will display a fallback message if an error key is present.

## License
- MIT Licence 
