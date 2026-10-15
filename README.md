# ⚓ MarinerAI — Maritime & Seafarer Operations Assistant

A mobile-first AI chat app for mariners, seafarers, deck officers, captains, and marine
engineers — grounded strictly on the **MARITIME OPERATIONS AI KNOWLEDGE BASE
(MAR-KB-001, v1.0 · 14 October 2026)** with **26 sections** and a **51-term glossary**.

Every AI answer follows a fixed contract: **direct answer first**, then the applicability
boundary with official source citations (`[MAR-KB-001 §04]`, `[SOLAS Ch V]`, `[MARPOL Annex I]`,
`[STCW …]`), priority labels, and explicit safety boundaries. It never replaces the vessel's
approved SMS, manuals, Master's standing orders, or the responsible officer.

## ✨ Features

### 💬 Grounded AI chat
- ChatGPT-style minimalist chat with conversation history (last 6 turns sent as context).
- Powered by Gemini — primary **`gemini-3.8-flash`**, automatic fallback through
  `gemini-3.1-flash-lite` → `gemini-flash-latest` (see `src/config/aiModels.ts`).
- **Rank/role perspectives** (`MARITIME_ROLES`) — answers are focused for the selected role
  (e.g. Master, Deck Officer, Engineer) per Sections 02/22.
- **Multimodal input**: attach images (inspected for equipment, markings, documents),
  PDFs/text/JSON documents, or send **voice recordings** (transcribed + answered).
- **Quick prompts** and segmented prompt packs for nav / engine / safety topics.
- Markdown rendering with statutory priority tags (`[STATUTORY / REQUIRED]`,
  `[VESSEL-SPECIFIC]`, `[CONDITIONAL]`, `[RECOMMENDED]`, `[VERIFY]`) and clickable
  `[MAR-KB-001 §…]` citations.

### 🔊 Read-aloud (TTS)
- Any bot answer can be spoken via **Gemini TTS** (`gemini-3.8-flash-lite-tts` →
  fallback `gemini-3.8-flash-tts`, voice **`Fola`**).
- Graceful fallback to the browser's built-in speech synthesis when the TTS API is
  unavailable; maritime tags are cleaned up for natural speech.

### 📚 Knowledge Base browser
- `KnowledgeBaseModal` — searchable, categorized browser over all 26 MAR-KB-001 sections
  (nav / engine / cargo / safety / admin) with overview, requirements, and data-matrix views.
- "Ask about this section" sends a grounded question straight into chat.

### 🧭 Maritime tools
- `MaritimeToolsModal` with three tabs:
  - **UKC & squat calculator** (MAR-KB-001 §16) — charted depth, tide, static draft, speed,
    block coefficient, open/confined channel; vessel presets (Feeder, Panamax, Capesize,
    VLCC); critical (`< 1.0 m`) and dangerous (`≤ 0.3 m`) UKC warnings.
  - **Operational checklists** — bridge / engine / deck / safety / crew readiness checks.
  - **Glossary lookup** over the 51-term MAR-KB-001 glossary.
- Results can be sent into chat for an AI explanation.

### 🍽️ Food & catering planner (MLC 2006)
- `FoodPlannerModal` — voyage victualing planner for crew size × days with multinational
  menu rotations (Filipino / Halal / Western), per-diem rate, and total stores budget
  (MLC 2006 Standard A3.2, Regulation 3.2).
- Nationality presets, calorie info, provisioning cost breakdown.
- Export to **Excel/CSV**, **Print/PDF**, save to **Google Sheets**, persist plans to **Firestore**.

### 🗂️ Workspace (Google + ship's paperwork)
- `WorkspaceModal` — Google sign-in (Firebase Auth) with Gmail / Drive / Docs / Sheets /
  Calendar tabs: list & search Drive files, read Gmail, send email, create Docs/Sheets,
  manage calendar events, upload chat text to Drive.
- Ready-made maritime templates: **port-agent arrival letter**, **enclosed-space safety
  briefing log**, passage & watchkeeping directives document.
- Chat documents persist to **Firestore** (`workspace.ts` + `firebase.ts` services).

### 📱 Native-app feel (PWA)
- Installable PWA (`public/manifest.json`, `public/icon.svg`, `PWAInstallButton` +
  `usePWAInstall` hook), standalone display, theme-color, iOS/Android meta tags.
- Safe-area insets, bottom-sheet modals on mobile, press feedback, frosted-glass panels,
  dark/light themes.

### 🛟 Offline resilience
- If the AI service is unreachable or `GEMINI_API_KEY` is missing, the app answers from a
  built-in **local MAR-KB-001 retriever** (keyword + tag scoring over all 26 sections, with
  dedicated enclosed-space, MARPOL, MLC catering, and MARINA responses) instead of
  dead-ending — clearly labeled as an offline reference.

## 🏗️ How it works

```
Browser (React + Vite)
  ├─ POST /api/chat  →  Gemini (system instruction = MAR-KB-001 contract + sections)
  └─ POST /api/tts   →  Gemini TTS → audio/wav
```

- **Local dev** (`npm run dev` → `tsx server.ts`): Express on `:3000` serves the API routes
  and runs Vite in middleware mode.
- **Production (Vercel)**: the Express server does **not** run — `api/chat.ts` and
  `api/tts.ts` serverless functions serve `/api/*`, sharing logic via `api/_kb.ts`.
  `api/chat.ts` returns the offline KB answer (HTTP 200) when no API key is configured,
  so chat never hard-fails.
- **One model config**: `src/config/aiModels.ts` is the single source of truth for chat
  models, TTS models, and the voice, imported by `server.ts`, `api/*`, and the client.

## 🚀 Run locally

**Prerequisites:** Node.js (22+ recommended) and a Gemini API key
([AI Studio](https://aistudio.google.com)).

```bash
npm install
# create .env.local (git-ignored) with:
#   GEMINI_API_KEY="your-key-here"
npm run dev      # chat + API at http://localhost:3000
```

| Script          | What it does                              |
|-----------------|-------------------------------------------|
| `npm run dev`   | Express + Vite dev server (`tsx server.ts`) |
| `npm run build` | Production build (`vite build` → `dist/`)  |
| `npm run preview` | Preview the production build             |
| `npm run start` | Same as `dev` (production host entrypoint) |
| `npm run lint`  | Typecheck (`tsc --noEmit`)                  |
| `npm run clean` | Remove `dist/` and `server.js`              |

## ⚙️ Configuration

| Variable         | Where                                     | Purpose                                  |
|------------------|-------------------------------------------|------------------------------------------|
| `GEMINI_API_KEY` | `.env.local` (dev) / Vercel env (prod)    | Gemini chat + TTS. Without it, chat uses the offline MAR-KB-001 base and TTS uses browser speech. |
| `APP_URL`        | env                                       | Public URL of the deployment (links, callbacks). |

- Firebase/client config: `firebase-applet-config.json` (includes `firestoreDatabaseId`).
- Security rules: `firestore.rules`. Google OAuth scopes (Gmail/Drive/Docs/Sheets/Calendar)
  are declared in `src/services/firebase.ts` (`WORKSPACE_SCOPES`).
- Secrets (`.env*`) are git-ignored; only `.env.example` is committed.

## ☁️ Deploy (Vercel)

1. Push `main` — Vercel builds with `npm install` + `vite build`.
   (Requires `esbuild ^0.28` to satisfy Vite 8's peer range — already pinned in
   `package.json`.)
2. Set `GEMINI_API_KEY` in **Project Settings → Environment Variables**, then redeploy.
3. `/api/chat` and `/api/tts` deploy automatically from the `api/` directory
   (max duration 30 s per function).

## 📁 Project structure

```
├── api/                    # Vercel serverless functions (prod API)
│   ├── _kb.ts              # Shared KB context + offline retriever + error helpers
│   ├── chat.ts             # POST /api/chat
│   └── tts.ts              # POST /api/tts
├── server.ts               # Express server (local dev API + prod static/Vite host)
├── src/
│   ├── App.tsx             # Chat UI, fetch hardening, offline fallback
│   ├── main.tsx / index.css
│   ├── config/aiModels.ts  # THE Gemini model/voice config (single source of truth)
│   ├── data/maritimeKnowledge.ts   # MAR-KB-001: 26 sections, glossary, roles, prompts
│   ├── components/         # KnowledgeBase, MaritimeTools, FoodPlanner, Workspace,
│   │                       # PWAInstallButton modals
│   ├── hooks/usePWAInstall.ts
│   └── services/           # firebase.ts (auth + Firestore), workspace.ts (Google APIs)
├── public/                 # PWA manifest + icon
├── firebase-applet-config.json / firestore.rules
└── vite.config.ts / tsconfig.json
```

## 🧰 Tech stack

React 19 · Vite 8 · Tailwind CSS 4 · TypeScript · Express · `@google/genai` ·
Firebase 13 (Auth + Firestore) · Google Workspace REST APIs · `tsx` · `motion` · `lucide-react`

## 🧪 Verify your setup

- `npm run lint && npm run build` — typecheck + production build.
- With a key: ask *"What are the statutory atmosphere testing limits before enclosed
  space entry?"* → live Gemini answer citing `[MAR-KB-001 §09 / §17]`.
- Without a key: same question → labeled offline MAR-KB-001 reference.
- Speaker button on any answer → Gemini TTS (or browser speech if TTS is unavailable).

## 🛟 Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Unable to reach maritime AI service (…)` / offline-reference replies | `GEMINI_API_KEY` missing or request failing — set it in `.env.local` (dev) or Vercel env (prod). Details are shown in the reply note. |
| `npm install` ERESOLVE on `esbuild` | Keep `esbuild` at `^0.28` (Vite 8 peer requirement). |
| TTS silent / falls back to robotic voice | Gemini TTS needs the API key; otherwise browser speech synthesis is used. |
| Firebase/Google tabs ask for sign-in | Expected — Workspace features need Google OAuth via Firebase Auth. |

## ⚠️ Safety notice

MarinerAI is a **decision-support reference** grounded on MAR-KB-001. It does not replace
the vessel's approved Safety Management System, official manuals, flag-State rules, class
requirements, or the Master's overriding authority. Always verify safety-critical actions
with current official sources and the responsible officer.
