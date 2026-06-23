# Love AI — Opportunity Assessment

> Living doc. We're winging it together, so this evolves. Keep it simple.

## Objective

Build **Love.ai** — a warm, dead-simple answer engine powered entirely by OpenRouter, offering smarter answers at **lower cost** than ChatGPT, DeepSeek, or Gemini's own answer engines.

Three pillars, **one app, one query bar**. The user never has to switch screens or leave their project to move between them:

1. **Simple UI** — prompt → answer, Perplexity/ChatGPT-style, with a **model chooser** right in the query bar. Defaults to **OpenRouter Auto** (picks the best model). Users can scroll and **search** across OpenRouter's models (GPT, Gemini, GLM, NVIDIA Nemotron, etc. — examples only, not a final list).
2. **Multi-Agent System (MAS)** — role-based agent chain that tackles complex questions through specialized stages (e.g. vision → research → comparison → reasoning → writer). *"Deeper accuracy through specialization."* One button to activate.
3. **Fusion** — OpenRouter's panel-of-models + judge approach, brought into a simple UI. Fuse two models (e.g. GPT-5.5 + Opus 4.8) into one *"crazily good model."* Per OpenRouter's own benchmark: Fable 5 + GPT-5.5 fused = 69.0%, beating every solo model; budget panels can beat frontier solos at ~50% the cost.

## What we're building (scope)

The **real thing** — full UX, **wired to real OpenRouter calls**. Not a mock. Built on a **GitHub branch** so we can delete it if it goes sideways.

## The query bar (heart of the product)

- **Structure/bones**: Google Gemini's entrance bar — centered, clean, just a query bar. (*"Simple."*)
- **Buttons**: styled after Claude's bar, dropped into the Gemini structure.
- **Three buttons** sit in/near the bar:
  1. **Change Model** — dropdown to scroll + search OpenRouter models. The Simple UI is automatic otherwise.
  2. **Fusion** — opens a sub-dropdown with **two model pickers side by side** (left + right). Each has its own **scroll + search**. Pick/search both → ready to fuse.
  3. **Agent** — single press activates the Multi-Agent System.
- **Shared model selection**: MAS uses whatever model the Simple UI has selected. Pick Auto → agents use Auto. Pick DeepSeek → agents use DeepSeek.

## Target customer

People who want frontier-quality answers without frontier prices — and who want power (multi-agent, fusion) without complexity. The magic is hiding sophistication behind simple buttons.

## Auth & cost model

- **Default**: everyone uses **Love AI's own OpenRouter key** — free / subscribed usage on us.
- **Bring Your Own Key (BYOK)**: a settings option to paste your own OpenRouter key. Same UI, same models, calls routed to the user's key.

## Persistence

- Chats **save** like ChatGPT/Claude (history sidebar).
- **Projects** group conversations with **isolated context**.

## Agents

- **Default fixed chain** — one click, just works.
- **Advanced mode** — power users can swap / add / remove agents to build their own pipeline.

## Tech

- **React**, declarative / JSX. Component-driven, priority/Z-index thinking — declare what you want, let it render.

## What I believe

- **Simple is sophistication.** Not minimalist, not premium, not playful — just *simple, simple, simple.*
- Warm, calm, effortless. The name "Love.ai" should feel like the product.
- Most of OpenRouter's power (fusion, model variety) is already there — Love AI's job is to make it **effortless**.

---

## Detailed Spec

### Architecture Overview

```
Browser (React/TypeScript/Tailwind)
│
├── UI Layer
│   ├── Landing / Chat Shell
│   ├── Query Bar (Gemini structure, Claude-style buttons)
│   ├── Chat History Sidebar
│   └── Projects View
│
├── State Layer (React context / Zustand)
│   ├── Active mode (simple | fusion | agent)
│   ├── Selected model(s)
│   ├── Conversation history
│   └── API key (Love AI key or BYOK)
│
└── API Layer (Node/Express or Next.js API routes)
    ├── /api/chat         → OpenRouter simple completion
    ├── /api/fusion       → OpenRouter Fusion (panel + judge)
    ├── /api/agent        → Sequential agent chain calls
    └── /api/models       → OpenRouter model list (cached)

OpenRouter API
├── Chat completions  (simple UI + agent steps)
├── Fusion endpoint   (panel models + judge)
└── Models list       (for the model chooser)
```

### Core Features (in scope)

#### 1. Query Bar
- **Structure**: Google Gemini-style — centered, minimal, dark.
- **Textarea**: multi-line, expands on input.
- **Three buttons** (Claude-style, bottom of bar):
  - **Model picker** (left): dropdown with scrollable + searchable OpenRouter model list. Default: `openrouter/auto`.
  - **Fusion** (middle): toggle. Expands to two side-by-side model pickers (left panel model, right panel model), each scrollable + searchable. Fires a Fusion API call on submit.
  - **Agent** (right): toggle. Activates MAS mode. Uses the currently selected model for all agent steps.
- Simple UI mode is always-on as the base; Fusion and Agent are activated by their buttons.
- Only one of Fusion or Agent active at a time.

#### 2. Simple UI (Answer Engine)
- Prompt → streamed OpenRouter response.
- Model follows the model picker selection (`openrouter/auto` by default).
- Perplexity-style output: clean, readable, no chrome.

#### 3. Fusion Mode
- Two model pickers: left (participant A) + right (participant B).
- On submit: calls OpenRouter Fusion with both as panel models + a sensible default judge model.
- Judge model configurable in settings (not in the query bar).
- Shows which models contributed in the response.

#### 4. Multi-Agent System (MAS)
- **Default fixed chain** (one click, runs automatically):
  1. Research Agent
  2. Analysis Agent
  3. Reasoning Agent
  4. Writer Agent
- **Advanced mode** (opt-in): drag/add/remove/reorder agent steps. Each step has: name, role prompt, model override (optional — falls back to selected model).
- Each agent step's output feeds the next as context.
- Progress shown inline: each agent step renders as it completes.

#### 5. Conversation History + Projects
- Sidebar: past conversations, newest first.
- **Projects**: named groups of conversations with isolated context (system prompt scoped to project).
- Conversations persist in browser localStorage for v1; migrate to server-side in v2.

#### 6. Model Chooser
- Fetches OpenRouter `/api/v1/models` on load (cached 1 hour).
- List grouped by provider. Scrollable. Searchable by name.
- Top pinned: `openrouter/auto`.
- Selection persists per conversation.

#### 7. API Key Management
- Default: Love AI's OpenRouter key (server-side, never exposed to client).
- BYOK: user pastes their OpenRouter key in Settings. Stored in localStorage, sent as `Authorization` header via the client only (never hits Love AI's server).
- BYOK badge shown in query bar when active.

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js / Next.js API routes (handles Love AI key server-side)
- **State**: Zustand (lightweight, composable)
- **Persistence (v1)**: localStorage for conversations + settings
- **API**: OpenRouter (chat completions, Fusion, models list)

### Security
- Love AI's OpenRouter key lives only on the server (env var, never in client bundle).
- BYOK key lives only in the user's localStorage; the client sends it directly to OpenRouter (bypasses Love AI's server entirely for BYOK users).
- No user auth required for v1 (anonymous sessions).
- Rate-limit Love AI key at the API route layer.

### Self-Sufficiency (Observability)
- Frontend `console.*` calls bridged to server log in dev mode (POST to `/api/log`).
- All OpenRouter calls log request/response summaries server-side.
- Each agent step emits a log entry with step name, model, token count, duration.
- `/api/health` endpoint for quick agent verification.

### Out of Scope (Parking Lot)
- User accounts / auth
- Server-side conversation persistence (v1 = localStorage)
- Voice input
- Image/file attachments
- Billing / subscription management UI
- Custom Fusion judge model picker in query bar
- More than 2 panel models in Fusion UI

---

## Open questions / to research

- Final curated model list for launch (the examples above are not final).
- Default fixed agent chain — exact roles/order.
- OpenRouter Fusion API specifics (panel + judge wiring).
- Subscription/billing model for the "free + subscribed" tier.

## Risks to validate (cheaply/quickly)

- **Latency**: MAS and Fusion are slower than a single call — does the UX make the wait feel worth it?
- **Cost control**: with Love AI footing the bill by default, how do we cap/meter usage?
- **OpenRouter Fusion API**: confirm it supports the two-model UI flow we want.

---

## Implementation Plan

> Open questions before executing:
> - Confirm OpenRouter Fusion API field names (`route`, `models`, judge model param) against current docs before Phase 5.
> - Confirm OpenRouter streaming SSE format before Phase 3.

---

### Tasks

#### Phase 0: Bootstrap
☐ Initialize Next.js (App Router) + TypeScript + Tailwind project  
☐ Set up folder structure (`src/app`, `src/components`, `src/store`, `src/lib`)  
☐ Configure environment variables (`.env.local`, `.env.example`)  
☐ Create `/api/health` endpoint  
☐ Verify dev server runs and health check returns 200  

#### Phase 1: Model List
☐ Create `/api/models` endpoint — fetches + caches OpenRouter model list (1hr)  
☐ Define `Model` type  
☐ Verify model list loads and `openrouter/auto` is present  

#### Phase 2: Query Bar Shell
☐ Create `QueryBar` component — Gemini-style, centered, dark background  
☐ Multi-line textarea that expands on input  
☐ Three placeholder buttons: Model Picker | Fusion | Agent  
☐ Landing page renders `QueryBar` centered on dark background  
☐ Basic responsive layout  

#### Phase 3: Simple UI (Answer Engine)
☐ Create Zustand store (`mode`, `selectedModel`, `inputValue`, `messages`)  
☐ Wire Model Picker button — dropdown, scrollable + searchable, `openrouter/auto` pinned  
☐ Create `/api/chat` endpoint — streaming OpenRouter completions  
☐ Wire submit → streamed response rendered in chat area  
☐ Basic chat message rendering (user + assistant bubbles)  

#### Phase 4: Conversation History + Projects
☐ Persist conversations to localStorage  
☐ Chat history sidebar — list past conversations, newest first  
☐ New conversation button  
☐ Projects — named groups with isolated context (system prompt scoped per project)  
☐ Project selector / creator in sidebar  

#### Phase 5: Fusion Mode
☐ Fusion button activates mode; mutually exclusive with Agent  
☐ Inline sub-panel below textarea: two side-by-side model pickers (each scrollable + searchable)  
☐ Create `/api/fusion` endpoint — OpenRouter Fusion (panel A + panel B + judge)  
☐ Wire fusion submit → streamed response  
☐ Response shows which models contributed  

#### Phase 6: Multi-Agent System (Fixed Chain)
☐ Agent button activates MAS mode; mutually exclusive with Fusion  
☐ Create `/api/agent` endpoint — sequential chain: Research → Analysis → Reasoning → Writer  
☐ Each step streams; progress renders inline (step name + output as it arrives)  
☐ Agent steps use the model selected in Model Picker  

#### Phase 7: Advanced Agent Builder
☐ "Advanced" toggle inside Agent mode  
☐ UI to add / remove / reorder agent steps  
☐ Each step: editable name, role prompt, optional model override  
☐ Custom chain fires same `/api/agent` endpoint with user-defined steps  

#### Phase 8: BYOK + Settings
☐ Settings panel (accessible from nav/sidebar)  
☐ Paste-your-own OpenRouter key field — stored in localStorage  
☐ BYOK badge visible near Model Picker when active  
☐ BYOK calls route directly from client to OpenRouter (bypass Love AI server)  

#### Phase 9: Observability
☐ Create `/api/log` endpoint — receives frontend console logs in dev mode  
☐ Frontend shim: bridge `console.*` to `/api/log` in dev  
☐ All OpenRouter API routes log request/response summaries (model, tokens, duration)  
☐ Each MAS step logs name, model, token count, duration  

---

### Phase 0: Bootstrap

**Affected Files:**
- `package.json` (new) — Next.js, React, TypeScript, Tailwind, Zustand dependencies
- `src/app/layout.tsx` (new) — root layout, dark background base
- `src/app/page.tsx` (new) — landing page shell
- `src/app/api/health/route.ts` (new) — returns `{ status: "ok" }`
- `.env.example` (new) — documents `OPENROUTER_API_KEY`
- `.env.local` (new, gitignored) — Love AI's OpenRouter key

**Goal:** Runnable Next.js app with a health check. Every subsequent phase builds on a confirmed working foundation.

**Done means:** `npm run dev` starts clean; `GET /api/health` returns `{ status: "ok" }`.

**Test it:**
1. Run `npm run dev`
2. Open browser → `http://localhost:3000` — page loads (blank or minimal shell is fine)
3. `GET http://localhost:3000/api/health` → `{ "status": "ok" }`

---

### Phase 1: Model List

**Affected Files:**
- `src/lib/openrouter.ts` (new) — shared OpenRouter client (base URL, auth header helper)
- `src/app/api/models/route.ts` (new) — fetches OpenRouter `/api/v1/models`, caches 1hr, returns sorted list with `openrouter/auto` first
- `src/types/models.ts` (new) — `Model` type

**Goal:** Single source of truth for the model list, used by every dropdown throughout the app.

**Done means:** `GET /api/models` returns a JSON array with `openrouter/auto` as the first item and at least 10 other models.

**Test it:**
1. `GET http://localhost:3000/api/models`
2. Confirm response is an array, first item is `openrouter/auto`
3. Confirm cache: call twice in quick succession, second call is faster (or returns same data)

---

### Phase 2: Query Bar Shell

**Affected Files:**
- `src/components/QueryBar/index.tsx` (new) — full query bar component
- `src/components/QueryBar/ModelPickerButton.tsx` (new) — placeholder button
- `src/components/QueryBar/FusionButton.tsx` (new) — placeholder button
- `src/components/QueryBar/AgentButton.tsx` (new) — placeholder button
- `src/app/page.tsx` — render `QueryBar` centered on dark background

**Goal:** The visual skeleton of the entire product. Get the layout right before wiring real behavior.

**Done means:** Landing page shows a dark background with a centered multi-line textarea, three buttons along the bottom (Model Picker | Fusion | Agent), and a send button. Textarea expands as you type.

**Test it:**
1. Open `http://localhost:3000`
2. Confirm dark background, centered bar, correct button order
3. Type multi-line text — confirm textarea grows
4. Confirm buttons are visible and clickable (no behavior yet)

---

### Phase 3: Simple UI (Answer Engine)

**Affected Files:**
- `src/store/chat.ts` (new) — Zustand store: `mode`, `selectedModel`, `inputValue`, `messages`, `conversations`
- `src/components/QueryBar/ModelPickerButton.tsx` — wire to model list, scrollable dropdown, search input, `openrouter/auto` pinned
- `src/app/api/chat/route.ts` (new) — proxies to OpenRouter chat completions, streams response, logs model/tokens/duration
- `src/components/ChatArea/index.tsx` (new) — renders user + assistant message bubbles, streams assistant text as it arrives
- `src/app/page.tsx` — compose `QueryBar` + `ChatArea`

**Goal:** First end-to-end working answer. User types a question, picks a model, gets a streamed response.

**Done means:** Submit a prompt → response streams in real time. Model picker shows the model list, search filters it, selection persists.

**Test it:**
1. Open `http://localhost:3000`
2. Select `openrouter/auto` from model picker (should be default)
3. Type "What is 2+2?" → submit
4. Confirm streamed response appears
5. Switch model to a different one → submit again → confirm it uses the new model (check server log)

---

### Phase 4: Conversation History + Projects

**Affected Files:**
- `src/lib/storage.ts` (new) — localStorage read/write helpers for conversations and projects
- `src/store/chat.ts` — add `conversations`, `activeConversationId`, `projects`, `activeProjectId`
- `src/components/Sidebar/index.tsx` (new) — conversation list (newest first), new conversation button, project list
- `src/components/Sidebar/ProjectItem.tsx` (new) — project name, create/select
- `src/app/page.tsx` — add sidebar layout

**Goal:** Conversations persist across page reloads. Projects group conversations with isolated context.

**Done means:** Start a conversation, reload page — conversation is still there. Create two projects — they maintain separate context (system prompt scoped to project).

**Test it:**
1. Ask a question, close and reopen browser tab → conversation still visible in sidebar
2. Create a project "Work", ask "Remember I'm a developer"
3. Create a project "Personal", ask "Who am I?" → should not reference developer context
4. Switch back to "Work" project → context is isolated

---

### Phase 5: Fusion Mode

**Affected Files:**
- `src/components/QueryBar/FusionButton.tsx` — activate/deactivate Fusion mode; mutually exclusive with Agent
- `src/components/QueryBar/FusionPanel.tsx` (new) — two side-by-side model pickers, each scrollable + searchable
- `src/store/chat.ts` — add `fusionModels: [string, string]`
- `src/app/api/fusion/route.ts` (new) — calls OpenRouter Fusion with panel A, panel B, default judge model; streams response
- `src/components/ChatArea/FusionMessage.tsx` (new) — renders response with contributing model attribution

**Goal:** User picks two models, fuses them, gets a response better than either alone.

**Done means:** Activate Fusion, pick two models, submit prompt → streamed response with model attribution. Activating Fusion deactivates Agent and vice versa.

**Test it:**
1. Click Fusion button — confirm FusionPanel opens below textarea
2. Pick `openrouter/auto` left, `openrouter/auto` right (or two different models)
3. Submit a complex question → confirm response streams
4. Check server log — confirm Fusion endpoint was called with both models
5. Confirm clicking Agent button deactivates Fusion

---

### Phase 6: Multi-Agent System (Fixed Chain)

**Affected Files:**
- `src/components/QueryBar/AgentButton.tsx` — activate/deactivate MAS mode; mutually exclusive with Fusion
- `src/app/api/agent/route.ts` (new) — runs fixed chain: Research → Analysis → Reasoning → Writer; each step streams; logs step name/model/tokens/duration
- `src/lib/agentChain.ts` (new) — defines default fixed chain (step name, role prompt, model fallback)
- `src/components/ChatArea/AgentMessage.tsx` (new) — renders each step's name + streamed output as it completes

**Goal:** One-click deep answer. User sees the chain working in real time, step by step.

**Done means:** Activate Agent, submit a complex question → four steps render sequentially with labels (Research, Analysis, Reasoning, Writer). Final writer output is the answer. Uses the selected model for all steps.

**Test it:**
1. Click Agent button → confirm it activates (Fusion deactivates if it was on)
2. Ask "Should I learn Rust or Go in 2026?" → confirm four labeled steps stream sequentially
3. Check server log — confirm each step logged with model/tokens/duration
4. Switch model to a specific one → run again → confirm logs show that model

---

### Phase 7: Advanced Agent Builder

**Affected Files:**
- `src/components/AgentBuilder/index.tsx` (new) — advanced mode UI: step list with add/remove/reorder
- `src/components/AgentBuilder/StepCard.tsx` (new) — editable step: name, role prompt, model override dropdown
- `src/store/chat.ts` — add `agentMode: 'fixed' | 'custom'`, `customChain: AgentStep[]`
- `src/app/api/agent/route.ts` — accept user-defined steps array alongside fixed chain

**Goal:** Power users build their own agent pipelines without touching code.

**Done means:** Toggle to Advanced mode → step list appears → add a custom step with a unique prompt → submit → custom step runs.

**Test it:**
1. Activate Agent → click "Advanced" toggle
2. Default fixed chain steps appear as editable cards
3. Delete one step → reorder another → add a new step "Critic" with a custom prompt
4. Submit → confirm custom chain runs in the defined order (check server log for step names)

---

### Phase 8: BYOK + Settings

**Affected Files:**
- `src/components/Settings/index.tsx` (new) — settings panel with OpenRouter key input field
- `src/lib/storage.ts` — add `getByokKey` / `setByokKey` helpers
- `src/store/settings.ts` (new) — Zustand settings store: `byokKey`, `judgeModel`
- `src/components/QueryBar/index.tsx` — show BYOK badge near Model Picker when key is active
- `src/lib/openrouter.ts` — export `getAuthHeader(byokKey?)` helper used by all client-side BYOK calls

**Goal:** Users bring their own OpenRouter key and use Love AI's full UI at no cost to Love AI.

**Done means:** Paste a valid OpenRouter key in Settings → BYOK badge appears → submitting a prompt routes the call directly from the client to OpenRouter (verify in browser network tab — no call to `/api/chat`).

**Test it:**
1. Open Settings → paste a valid OpenRouter key → save
2. Confirm BYOK badge appears in query bar
3. Submit a prompt → open browser DevTools Network tab → confirm call goes to `openrouter.ai` directly, not `/api/chat`
4. Clear the key → badge disappears → next call goes through `/api/chat` again

---

### Phase 9: Observability

**Affected Files:**
- `src/app/api/log/route.ts` (new) — accepts `{ level, message, data }`, writes to server stdout in dev
- `src/lib/logger.ts` (new) — dev-mode shim: overrides `console.*` to POST to `/api/log`; no-op in production
- `src/app/layout.tsx` — import logger shim in dev mode only
- `src/app/api/chat/route.ts`, `fusion/route.ts`, `agent/route.ts` — ensure all log model, tokens, duration per call

**Goal:** The agent can close its own feedback loops by reading server logs — no screenshots needed.

**Done means:** `console.log("test")` in the browser → message appears in the Next.js server terminal. Every OpenRouter call logs model + token count + duration.

**Test it:**
1. Add `console.log("frontend log test")` to any component → confirm it appears in server terminal
2. Submit a chat prompt → confirm server log shows `[chat] model=openrouter/auto tokens=X duration=Yms`
3. Run agent chain → confirm each step logs separately with step name
