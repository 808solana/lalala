# Love AI — Manual QA Steps

> Run these after each phase to confirm the build is solid before moving on.

---

## Phase 0: Bootstrap ✅

### Prerequisites
- `.env.local` exists with `OPENROUTER_API_KEY` set (can be blank for Phase 0)
- `npm install` has been run

### Steps

1. **Start dev server**
   ```bash
   npm run dev
   ```
   Expected: server starts cleanly, no errors, listening on `localhost:3000`

2. **Open the app**
   - Navigate to `http://localhost:3000`
   - Expected: dark background (`#0d0d0d`), "Love AI — coming soon" text in zinc-500

3. **Health check**
   - `GET http://localhost:3000/api/health`
   - Expected: `{ "status": "ok" }`

4. **Lint + typecheck**
   ```bash
   npm run lint       # should output 0 errors
   npm run typecheck  # should output 0 errors
   ```

---

## Phase 1: Model List ✅

### Steps

1. **Hit the models endpoint**
   - `GET http://localhost:3000/api/models`
   - Expected: JSON array with 300+ models
   - First item: `{ "id": "openrouter/auto", "name": "Auto (OpenRouter picks best model)" }`

2. **Cache test**
   - Call `/api/models` twice in quick succession
   - Second call should be faster (Next.js `fetch` revalidation cache)

### Notes
- Requires `OPENROUTER_API_KEY` set in `.env.local` to return real data
- Without a key, endpoint returns a 502 error from OpenRouter

---

## Phase 2: Query Bar Shell ✅

### Steps

1. **Open the app** — `http://localhost:3000`
   - Expected: dark background, "love.ai" wordmark centered, query bar below it

2. **Verify query bar structure**
   - Dark card (`#1c1c1c`) with rounded corners and subtle border
   - Three buttons in bottom-left: `Auto` (with sparkles icon + chevron), `Fusion` (zap icon), `Agent` (bot icon)
   - Send button (arrow-up) in bottom-right — grey when empty

3. **Textarea behavior**
   - Click the textarea and start typing
   - Textarea should expand vertically as you add lines
   - Send button turns white when text is present
   - Press Enter → submits (logs to console), clears input
   - Press Shift+Enter → newline (no submit)

4. **Button states** (visual only at this phase)
   - Hover Model Picker → lighter background, brighter text
   - Hover Fusion → lighter background
   - Hover Agent → lighter background

---

## Phase 3: Simple UI (Answer Engine) ✅

### Prerequisites
- `OPENROUTER_API_KEY` set in `.env.local`
- `npm run dev` running

### Steps

1. **Landing state** — open `http://localhost:3000`
   - Dark background, "love.ai" wordmark, query bar centered

2. **Model picker**
   - Click "Auto" button → dropdown opens above the bar
   - Search for "claude" → list filters in real time
   - Select a model → button label updates
   - Press Escape or click outside → closes
   - Re-open → still shows the selected model with a checkmark

3. **First message**
   - Type "What is 2+2?" → press Enter (or click send arrow)
   - Layout shifts: chat area + sticky bar at bottom
   - User bubble appears (right-aligned, zinc-800)
   - Assistant response streams in — animated cursor visible while streaming
   - Cursor disappears when done

4. **Multi-turn conversation**
   - Ask a follow-up: "Why?" → confirm assistant references the prior answer

5. **Server log check** (in your terminal running `npm run dev`)
   - Confirm log line like: `[HH:MM:SS] [chat] model=openrouter/auto chars≈NNN duration=NNNms`

6. **Model switch**
   - Pick a different model from the picker
   - Ask another question → server log shows the new model name

---

## Phase 4: Conversation History + Projects ✅

### Steps

1. **Brand check** — `http://localhost:3000`
   - White background, daisy logo centered, Helvetica Neue Bold font
   - Sidebar on the left: "love.ai" logo + name, "New chat" button, Projects section

2. **Persistence test**
   - Ask "What is the capital of France?"
   - Conversation appears in the sidebar with an auto-generated title
   - **Reload the page** → conversation is still in the sidebar, messages still visible

3. **Multiple conversations**
   - Click "New chat" → empty state reappears, new conversation in sidebar
   - Ask something different
   - Click the first conversation in the sidebar → messages switch back

4. **Delete conversation**
   - Hover a conversation in the sidebar → trash icon appears
   - Click it → conversation removed from sidebar

5. **Projects — context isolation**
   - In the Projects section, click "+" → enter name "Work", add system prompt "You are a coding assistant"
   - Click Create → new project appears, a new empty conversation starts inside it
   - Ask "What am I?" → should respond as a coding assistant
   - Click "All chats" → previous conversations visible, no project context
   - Click "Work" project again → only Work conversations shown

---

## Phase 5: Fusion Mode ✅

### Steps

1. **Activate Fusion**
   - Click the **Fusion** button in the query bar
   - Expected: button turns solid `#675c56`; a Fusion panel appears inline below the textarea
   - The panel shows dynamic **Panel** model pickers (add up to 4) and a separate **Fuse with** (synthesizer) picker
   - The first panel model is auto-seeded

2. **Mutual exclusion**
   - With Fusion active, click **Agent** → Fusion should deactivate, Agent activates
   - Click **Fusion** again → Agent deactivates, Fusion reactivates

3. **Run a fusion query**
   - Pick 2 panel models (e.g. GPT-4o + Gemini) and a **Fuse with** model (e.g. DeepSeek)
   - Ask "What model are you?"
   - Expected: a single fused answer streams in
   - Above the answer, a `Fusion · gpt-4o + gemini · judge: deepseek` badge renders

4. **Verify the synthesizer identity**
   - Server log should show `[fusion] panel=[...] fuseWith=deepseek/... starting`
   - In your OpenRouter logs, the synthesizer call should use DeepSeek, not Claude Opus
   - **Note:** If "Fuse with" is set to **Auto**, OpenRouter uses Claude Opus 4.8 as the default judge — that's expected

5. **Switch synthesizer mid-conversation**
   - In the same chat, change "Fuse with" to a different model
   - Ask "what model are you?" again
   - Expected: the synthesizer correctly identifies itself as the new model (not the previous one), because a system message pins its identity per request

---

## Phase 6: Multi-Agent System (Fixed Chain) ✅

### Steps

1. **Activate Agent mode**
   - Click the **Agent** button in the query bar
   - Expected: button turns solid `#675c56`
   - If Fusion was on, it should turn off (mutually exclusive)
   - No sub-panel appears — Agent mode uses the shared Model Picker selection

2. **Run a complex query**
   - With a model selected (Auto is fine), ask: "Should I learn Rust or Go in 2026?"
   - Expected: four labeled step cards render sequentially, top-to-bottom:
     1. **Research** — streams first
     2. **Analysis** — streams after Research completes
     3. **Reasoning** — streams after Analysis completes
     4. **Writer** — streams last, delivers the final answer
   - Each card shows a step number, name, and a pulsing cursor while streaming
   - Cards fill in one at a time (not all at once)

3. **Server log check**
   - In the terminal running `npm run dev`, confirm four log lines:
     ```
     [HH:MM:SS] [agent:Research]    model=... chars≈NNN duration=NNNms
     [HH:MM:SS] [agent:Analysis]    model=... chars≈NNN duration=NNNms
     [HH:MM:SS] [agent:Reasoning]   model=... chars≈NNN duration=NNNms
     [HH:MM:SS] [agent:Writer]      model=... chars≈NNN duration=NNNms
     [HH:MM:SS] [agent] chain complete model=... steps=4 duration=NNNms
     ```

4. **Model switch**
   - Pick a specific model from the Model Picker (e.g. DeepSeek)
   - Run another agent query
   - Expected: all four steps log the new model name

5. **Persistence**
   - Reload the page while on an agent conversation
   - Expected: prior agent step cards are still visible (steps are persisted on the message)

