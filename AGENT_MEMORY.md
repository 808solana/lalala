# Agent Memory

## User Preferences
- "Simple is sophistication." Not minimalist, not premium, not playful — just simple.
- User voices ideas conversationally (often dictated). Parse intent generously; don't be pedantic.
- User collaborates with a sandboxed Claude desktop instance as a teammate.
- User works on a GitHub branch per feature; deletes branch if things go sideways.
- Design references: Google Gemini query bar (structure/bones) + Claude bar (button style).

## Environment Facts
- OS: Windows 10 (PowerShell) — use `;` not `&&` for command chaining in PS
- Workspace: `c:\Users\jgran\lalala`
- Skills folder (project-level, UI/UX): `from-thinking-to-coding/skills/`
- Agent skills folder: `.cursor/skills/`
- Package manager: npm (confirmed — used in scaffolding)
- Next.js version: 16.2.9 (latest as of 2026-06-22)
- React version: 19.2.4
- Tailwind version: 4.x (with @tailwindcss/postcss, postcss.config.mjs)

## Architectural Decisions
- React + TypeScript + Tailwind CSS frontend
- Next.js API routes for backend (handles Love AI key server-side)
- Zustand for state management
- OpenRouter for all AI calls (chat completions, Fusion, models list)
- v1 persistence: localStorage (conversations + settings); server-side in v2
- Love AI OpenRouter key: server-side only, never in client bundle
- BYOK: key stored in localStorage, sent directly to OpenRouter (bypasses Love AI server)
- No user auth in v1

## Active Conventions
- Query bar: Gemini structure (centered, minimal, dark) + Claude-style buttons
- Three buttons in query bar: Model Picker | Fusion | Agent
- Model picker default: `openrouter/auto`
- Only one of Fusion / Agent active at a time
- MAS agent steps share the model selected in the model picker
- Agent chain (fixed default): Research → Analysis → Reasoning → Writer

## Streaming Notes
- OpenRouter SSE format: `data: {...}\n` lines, terminated by `data: [DONE]\n`
- OpenRouter sends `: OPENROUTER PROCESSING` keep-alive comment lines before first chunk — client SSE parser must tolerate non-`data:` lines
- `TransformStream<Uint8Array, Uint8Array>` in Next.js App Router route handlers correctly wraps upstream SSE for logging without buffering the entire response
- `crypto.randomUUID()` is available in both browser and Node 19+ — no need for nanoid

## Fusion API (confirmed 2026-06-22)
- Use `model: "openrouter/fusion"` + `plugins: [{ id: "fusion", analysis_models: ["a", "b"] }]`
- The judge model is set via `plugins[0].model` field (not through the outer `model` parameter)
- When `plugins[0].model` is omitted, OpenRouter defaults to Claude Opus as judge
- Max panel models: 8 per OpenRouter docs, limited to 4 in our UI for UX
- The old `route: "fusion"` field is WRONG — updated skill file
- Fusion can be slow (runs panel in parallel then judge writes final answer) — warn users about delay
- Fusion streaming works: same SSE format as regular chat

## API Notes
- OpenRouter models API returns `{ data: Model[] }` — access via `.data`, not the root response
- `openrouter/auto` is NOT in the OpenRouter models list — must be added as a synthetic entry
- OpenRouter model list as of 2026-06-22: ~339 models (340 total with openrouter/auto pinned)
- Next.js `fetch` with `next: { revalidate: 3600 }` handles 1hr caching idiomatically

## Lessons Learned
- `create-next-app` refuses to scaffold into a non-empty directory — scaffold into a temp subdirectory, then move files to root manually
- Next.js is now at version 16 (package is still `next`, `create-next-app@16.2.9`) — same patterns, new major version
- Tailwind v4 uses `@import "tailwindcss"` + `@theme inline {}` instead of the old `@tailwind` directives
- `npm run lint` uses `eslint` directly (no eslint script flags needed in Next.js 16)
- Moving `node_modules` directory via PowerShell requires Smart Mode approval — normal behavior
- PowerShell: `.env*` globbing covers `.env.local`, no need to add separately to `.gitignore`
- **Next.js API route changes require a server restart** to take effect — hot reload is unreliable for `src/app/api/**` route handlers. After changing any `/api/*` route, kill the dev server (`Get-Process node | Stop-Process -Force`) and re-run `npm run dev`. Killing node processes requires Smart Mode approval.
- **Fusion "Auto" judge = Claude Opus 4.8** by OpenRouter's default. Users may expect "Auto" to mean dynamic selection — clarify in the UI or default to a named model. We pin the synthesizer's identity via a system message so it doesn't echo prior chat context when asked "what model are you?"
- **MAS chain pattern**: server runs steps sequentially in a single SSE stream using typed events (`step_start` / `delta` / `step_end` / `done` / `error`). Each step's full output is carried forward as context for the next step's prompt. Client pre-initializes all step cards empty, then fills them in as events arrive — gives users a "chain working" feel without waiting for full completion.
- **Agent builder (Phase 7)**: two modes — fixed (default chain) and custom (user-defined chain). Custom chain is stored in `customChain: AgentStepDefinition[]` in Zustand. The API route accepts an optional `steps` array in the body. Per-step `modelOverride` field allows different models per step. AgentBuilder modal uses a `key` prop to force remount on each open instead of useEffect+setState (avoids react-hooks/set-state-in-effect lint violation).

## Brand Guidelines (from BRAND_ASSETS/typography.png)
- Background: white (#ffffff)
- Text: #0d0c12
- Button background: #675c56 (warm taupe)
- Font: Helvetica Neue Bold (system font, no Google Font needed — just remove Geist)
- Logo: BRAND_ASSETS/LUVVVVVlogo.png (daisy flower, dark) → copied to public/logo.png

## Curator
- Tasks completed since last skill review: 8
- Last skill review: never
