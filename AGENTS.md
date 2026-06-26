# AGENTS.md — Love AI

> This file is loaded every session. Keep it current. Every session should leave it smarter than it found it.

---

## What This Is

**Love.ai** — a warm, simple answer engine powered entirely by OpenRouter. Three modes in one query bar: Simple UI (prompt → streamed answer), Fusion (panel of models + judge), and Multi-Agent System (role-based agent chain). Lower cost than ChatGPT, DeepSeek, and Gemini's own engines.

Full spec and implementation plan: `opportunity assessment.md`

---

## Getting Started (New Agent)

Read in this order:
1. `README.md` — current status, what's built, what's next
2. This file — map, conventions, how to work here
3. `opportunity assessment.md` — full spec + phased plan
4. `AGENT_MEMORY.md` — persistent facts about this project
5. `PROJECT_CONTEXT.md` — current architecture state

Then:
1. Run `npm run dev` — verify it starts
2. `GET /api/health` — confirm `{ "status": "ok" }`
3. Continue the next incomplete phase from the plan

---

## Codebase Map

```
src/
  app/
    page.tsx              — landing page (QueryBar centered)
    layout.tsx            — root layout, dark base, logger shim (dev)
    api/
      health/route.ts     — health check
      chat/route.ts       — simple completions (streaming)
      fusion/route.ts     — OpenRouter Fusion (panel + judge)
      agent/route.ts      — MAS sequential chain (streaming)
      models/route.ts     — model list (cached 1hr)
      log/route.ts        — frontend log bridge (dev only)
  components/
    QueryBar/             — core input bar (Gemini structure, Claude buttons)
    ChatArea/             — message rendering (simple, fusion, agent variants)
    Sidebar/              — conversation history + projects
    AgentBuilder/         — advanced agent chain editor
    Settings/             — BYOK key, judge model config
  store/
    chat.ts               — Zustand: mode, model, messages, conversations
    settings.ts           — Zustand: byokKey, judgeModel
  lib/
    openrouter.ts         — shared OpenRouter client + auth header helper
    agentChain.ts         — default fixed MAS chain definition
    storage.ts            — localStorage helpers (conversations, projects, BYOK)
    logger.ts             — dev-mode console bridge to /api/log

AGENT_MEMORY.md           — persistent agent memory (read every session)
PROJECT_CONTEXT.md        — current architecture state
opportunity assessment.md — spec + plan (source of truth)
.cursor/rules/            — Hermes agent rule (always applied)
.cursor/skills/           — agent skill library
from-thinking-to-coding/skills/ — UI/UX skill library (check before any frontend work)
```

---

## Development Commands

```bash
npm run dev        # start dev server (localhost:3000)
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

Environment: copy `.env.example` → `.env.local`, set `OPENROUTER_API_KEY`.

**Windows/PowerShell:** use `;` not `&&` to chain commands.

---

## Critical Framework Patterns (Next.js App Router)

### Environment Variables
- `OPENROUTER_API_KEY` lives in `.env.local` — server-side only, never in client bundle
- BYOK key lives in localStorage, sent client-side directly to OpenRouter — never hits Love AI's server
- Never `NEXT_PUBLIC_` prefix the OpenRouter key

### Hot Reload
- `src/app/` and `src/components/` — hot reload works ✅
- `src/app/api/` route changes — may require server restart ⚠️
- `.env.local` changes — **always require full restart** (`Ctrl+C` → `npm run dev`)

### Streaming (SSE)
- All AI responses stream via `text/event-stream`
- API routes return `new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })`
- Confirm OpenRouter streaming format against current docs before Phase 3

### Route Handlers
- Use `export async function GET/POST` in `route.ts`, not pages with API methods
- Log every OpenRouter call: `[HH:MM:SS] [chat] model=X tokens=Y duration=Zms`

---

## Engineering Principles

From `from-thinking-to-coding/engineering-principles/`:
- **Simple over easy** — un-braid concerns; composable, independent pieces
- **YAGNI** — build the simplest thing that works; add complexity only when reality demands it
- **DRY** — don't repeat yourself; don't over-abstract prematurely

---

## Skills System (Hermes)

Before any task:
1. Scan `.cursor/skills/` for a relevant skill
2. Scan `from-thinking-to-coding/skills/` — contains `ui-ux-pro-max.md`, `interaction-design.md`, `interface-design.md`, `frontend-design.md`, `canvas-design.md`, `make-interfaces-feel-better.md`
3. If a skill exists, follow it. Deviate only with good reason — then update the skill.

After any complex task (5+ steps): write or update a skill in `.cursor/skills/<category>/`.

Read `AGENT_MEMORY.md` and `PROJECT_CONTEXT.md` before every task. Update them when you learn something a future session needs.

---

## Logging Standards

Format: `[HH:MM:SS] [PREFIX] message`

- `[chat]` — OpenRouter chat completions
- `[fusion]` — Fusion calls
- `[agent:StepName]` — each MAS step
- `[models]` — model list fetch/cache
- `[frontend]` — bridged browser logs (dev only)

Every OpenRouter call logs: model, token count, duration. Every MAS step logs: step name, model, tokens, duration.

Frontend `console.*` bridges to `/api/log` in dev mode — the agent can read all logs from the server terminal without screenshots.

---

## Mode Logic (Query Bar)

- **Simple UI** is always-on — the base layer
- **Fusion** and **Agent** are mutually exclusive toggles
- The Model Picker selection is shared between Simple UI and Agent (both use the same model)
- BYOK badge appears near Model Picker when a user key is active

---

## Security Conventions

- `OPENROUTER_API_KEY` — server-side env var only; never in client bundle, never logged
- BYOK key — localStorage only; client sends directly to OpenRouter, bypasses `/api/*`
- No user auth in v1 (anonymous sessions)
- Rate-limit Love AI's key at the API route layer (implement in Phase 3+)

---

## Version Control

- Branch strategy: `feature/description` or `fix/description` — never commit directly to main
- Propose commit message + wait for user confirmation before committing
- Commit format: `type: description` with bullet points of key changes
- Never commit: `.env.local`, API keys, `node_modules`, built artifacts
- Always commit: `.env.example`, `package.json`, all `AGENTS.md` / `README.md` updates

---

## Phase Wrap-Up Protocol

Before calling any phase complete, you MUST:

1. **Show verification output** (not claims):
   - `npm run lint` → show "0 errors"
   - `npm run typecheck` → show "0 errors"
   - `npm run build` → show "exit 0" (for major phases)
   - Test the "Done means" criteria from the plan

2. **Update documentation:**
   - `README.md` — current status, what works, what's next
   - `TESTING.md` — manual QA steps for new features
   - `opportunity assessment.md` — if implementation differed from plan, update the spec with decision + rationale
   - `AGENT_MEMORY.md` / `PROJECT_CONTEXT.md` — any new learnings or architecture changes

3. **Say explicitly:** "Let's wrap up Phase X."

4. **Walk through manual testing** — "Click X, you should see Y" — then wait for confirmation.

5. **Memory sweep:** "What did I learn this session that future sessions need to know?"

6. **Offer a commit message.**

CRITICAL: Do not proceed to the next phase until the user confirms manual testing passed.

**Never say:**
- "Should work now"
- "Tests passed" (without showing output)
- "Phase complete, moving to Phase X"

---

## Code Review (Major Phases)

For major phase completions (Phases 3, 5, 6, 8):

If sub-agents are available:
> "Dispatch two subagents to review [phase name]. Tell them they're competing — whomever finds more legitimate issues gets promoted. Focus on architecture and implementation."

Otherwise, tell the user to open two separate agent sessions with the competing-reviewer prompt from `from-thinking-to-coding/3-create-agent-instructions/code-review.md`.

---

## Collaboration Style

- Think step-by-step before writing code — explain your approach first
- Make the most reasonable assumption and state it explicitly rather than blocking on questions
- Flag assumptions: "Assuming X because Y"
- Explain the "why," not just the "what"
- Check in at natural breakpoints; don't barrel ahead

---

## Continuous Documentation

As you work, update docs immediately — don't wait for wrap-up:
- **AGENTS.md** — gotchas, patterns, architectural decisions
- **`opportunity assessment.md`** — when implementation differs from spec
- **README.md** — when status or capabilities change
- **AGENT_MEMORY.md** — user preferences, env facts, lessons learned

Ask yourself: *"What would confuse a future agent about this?"* If anything — write it down now.

---

## Cursor Cloud specific instructions

Durable, non-obvious notes for Cloud Agents. Standard commands live in `README.md` (Setup / Development Commands); don't duplicate them here.

- **The application only exists on the `Brain` branch.** The `main` branch holds only `BRAND_ASSETS/` and design-skill docs — no `package.json`, no app. Do environment setup and app work from a branch based on `Brain`. The startup update script guards on `package.json` existing, so it safely no-ops when a session starts on `main`.
- **Node 22 works** with Next.js 16 (Turbopack). Dependencies install via `npm install` (uses `package-lock.json`).
- **`OPENROUTER_API_KEY` (server-side env var) is required for the AI features.** Without it, `POST /api/chat`, `/api/fusion`, and `/api/agent` return `401`. Set it in `.env.local` (or as an environment secret) and **fully restart `npm run dev`** afterward — env changes are not hot-reloaded.
- **`GET /api/models` and `GET /api/health` work WITHOUT a key.** `/api/models` fetches OpenRouter's public model list (~340 models), so the model picker populates even with no key — but actual answers won't generate until a key is set.
- **No `.env.example` is committed** (`.gitignore` ignores `.env*`). Create `.env.local` yourself.
- **BYOK is not wired into the `/api/chat` route** (it uses the server key only), so to test chat you must set `OPENROUTER_API_KEY` server-side, not via the in-app BYOK field.
- **`from-thinking-to-coding/` is a git submodule** pointing to a commit not in this remote, so it stays empty. Run with `git config submodule.recurse false` to avoid checkout errors; it is not needed to run the app.
- Run the dev server under `tmux` so it survives across tool calls; it listens on `http://localhost:3000`.
