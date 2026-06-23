# Love AI

A warm, simple answer engine powered by OpenRouter. Three modes in one query bar — Simple UI, Fusion, and Multi-Agent System — at lower cost than ChatGPT, DeepSeek, or Gemini's own engines.

---

## Current Status

**Phase 6 complete. ✅**

**What works right now:**
- `GET /api/health` → `{ "status": "ok" }`
- `GET /api/models` → 340 OpenRouter models, `openrouter/auto` pinned first, cached 1hr
- `POST /api/chat` → streams OpenRouter completions via SSE (logs model + duration to server)
- Query bar with model picker, Fusion/Agent toggles — all wired to Zustand
- Sidebar — conversation list, new chat, project management
- Conversations persist to localStorage — survive page reload
- Projects with isolated system prompts — scoped context per project
- Brand: white background, `#0d0c12` text, `#675c56` brand buttons, Helvetica Neue Bold, daisy logo

- **Fusion Mode** — dynamic panel model pickers (up to 4) + dedicated "Fuse with" synthesizer picker; `POST /api/fusion` → OpenRouter Fusion via `plugins` API; identity-pinning system message so the synthesizer always knows which model it is; responses show "Fusion · [panels] · judge: [model]" attribution badge
- **Agent Mode (MAS)** — fixed chain Research → Analysis → Reasoning → Writer; `POST /api/agent` runs each step sequentially, streaming each step's output to a labeled card in real time; per-step server logging (model/chars/duration); uses the shared Model Picker selection for all steps
- Fusion and Agent are mutually exclusive toggles

- **Agent Builder (Phase 7)** — "Customize" button in Agent mode opens a modal with Fixed/Custom tabs; in Custom mode: add/remove/reorder steps, edit step name and system prompt, per-step model override dropdown; custom chain sent to `/api/agent` which respects per-step model overrides

**Next:** Phase 8 — BYOK + Settings (bring your own OpenRouter key)

---

## Setup

```bash
cp .env.example .env.local
# Add your OPENROUTER_API_KEY to .env.local
npm install
npm run dev
```

Open `http://localhost:3000` — verify the app loads (dark background).
`GET http://localhost:3000/api/health` — should return `{ "status": "ok" }`.

---

## Development Commands

```bash
npm run dev        # start dev server (localhost:3000)
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

---

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **API**: OpenRouter

---

## Spec & Plan

Full product spec and phased implementation plan: `opportunity assessment.md`
