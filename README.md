# Aura Security Lab — Gemini Jailbreak Demo

> LLM Adversarial Testing Interface for exploring Gemini model guardrails.

**🌐 Live:** [https://gemini-jailbreak-gamma.vercel.app](https://gemini-jailbreak-gamma.vercel.app)

## Overview

Aura Security Lab is a cybersecurity research tool that demonstrates adversarial prompt injection techniques against Google Gemini models. It features a toggle-based "Server Override" mode that applies a jailbreak system instruction to test model safety boundaries.

## Features

- **Zero-Config Access** — Works immediately with a public fallback API key
- **Dynamic Model Selection** — Searchable dropdown with live model discovery from Google API
- **Jailbreak Toggle** — Server Override switch applies adversarial system instructions
- **Multi-Turn Conversations** — Full conversation history maintained client-side
- **File Attachments** — Upload files for multimodal analysis
- **Markdown Rendering** — Model responses rendered with full markdown + GFM support
- **Default Engine:** Gemini 3.1 Pro Preview (configurable)

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite 5
- **Styling:** TailwindCSS v4 + Framer Motion animations
- **AI:** Client-side Gemini REST API (no backend required)
- **Markdown:** react-markdown + remark-gfm
- **Testing:** Vitest + Playwright E2E
- **Deployment:** Vercel (static SPA)

## Development

```bash
cd frontend
npm install
npm run dev      # Vite dev server on :5173
npm run build    # Production build
```

## Architecture

```
Gemini Jailbreak/
├── frontend/           # Deployable Vite SPA
│   ├── src/
│   │   ├── api.ts      # Client-side Gemini REST calls
│   │   ├── App.tsx     # Main UI with settings panel
│   │   ├── hooks/      # useChat (conversation state)
│   │   └── components/ # MessageBubble, LoadingBubble
│   └── vercel.json
└── backend/            # Reference FastAPI server (not deployed)
    ├── app.py
    └── gemini_model_resolver.py
```

## Security Note

The jailbreak system prompt is embedded client-side for demonstration purposes. This is an educational/research tool — the adversarial techniques shown here are for understanding model safety, not circumventing it maliciously.

## License

Private — Naman Singh
