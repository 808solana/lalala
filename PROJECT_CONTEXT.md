# Project Context

## What This Is

Love AI (love.ai) — a warm, simple answer engine powered by OpenRouter. Lower cost than ChatGPT, DeepSeek, or Gemini's own engines. Three modes live inside one unified query bar: a simple prompt→answer UI, a Fusion mode (panel of models + judge), and a Multi-Agent System (role-based agent chain).

## Current Architecture

```
Browser (React/TypeScript/Tailwind)
│
├── UI Layer
│   ├── Landing / Chat Shell
│   ├── Query Bar (Gemini structure, Claude-style buttons)
│   ├── Chat History Sidebar
│   └── Projects View
│
├── State Layer (Zustand)
│   ├── Active mode (simple | fusion | agent)
│   ├── Selected model(s)
│   ├── Conversation history
│   └── API key (Love AI key or BYOK)
│
└── API Layer (Next.js API routes)
    ├── /api/chat       → OpenRouter simple completion
    ├── /api/fusion     → OpenRouter Fusion (panel + judge)
    ├── /api/agent      → Sequential agent chain calls
    ├── /api/models     → OpenRouter model list (cached 1hr)
    ├── /api/health     → health check
    └── /api/log        → dev-mode frontend log bridge

OpenRouter API
├── Chat completions
├── Fusion endpoint
└── Models list
```

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Framework**: Next.js (App Router)
- **State**: Zustand
- **API**: OpenRouter
- **Persistence (v1)**: localStorage

## Key Files
- `opportunity assessment.md` — product brief + detailed spec
- `AGENT_MEMORY.md` — persistent agent memory
- `PROJECT_CONTEXT.md` — this file
- `.cursor/rules/hermes-agent.mdc` — Hermes agent behavior rules
- `.cursor/skills/` — agent skill library
- `from-thinking-to-coding/skills/` — UI/UX skill library (check here before any frontend work)

## Open Questions / Known Issues
- Final curated model list for launch (examples in spec are not final)
- OpenRouter Fusion API: confirm panel + judge wiring matches spec
- Default judge model for Fusion
- Rate-limiting strategy for Love AI's shared OpenRouter key
- Subscription/billing model for free vs. paid tiers

## Recent Significant Changes
- 2026-06-22: Project initialized. Opportunity assessment + detailed spec written. Hermes agent mode set up.
