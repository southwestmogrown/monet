# CLAUDE.md — Monet (Claude IDE)

## Project Overview

Monet is a web-based IDE specialized for Claude AI. It provides four tightly-integrated Claude-powered features in a VS Code-inspired interface. Built with simplicity first — no plugin ecosystem, no configuration hell, one API key required.

## Architecture

- **Framework**: Next.js 15, App Router, React 19
- **Styling**: Tailwind CSS v4, dark VS Code-inspired theme (see `globals.css` CSS variables)
- **State**: Zustand stores (one per feature domain), persisted to localStorage via `persist` middleware
- **Claude API**: All calls go through Next.js API routes (server-side only). The Anthropic API key is NEVER exposed to the browser.
- **Editor**: `@monaco-editor/react` wrapping Monaco Editor
- **Streaming**: API routes return `ReadableStream`; clients consume via `response.body.getReader()`
- **Panels**: `react-resizable-panels` for drag-resizable sidebar

## Four Feature Areas

| Route | Feature | Description |
|---|---|---|
| `/chat` | Chat | Streaming multi-turn chat with persistent conversation history |
| `/editor` | Code Editor | Monaco editor + Claude explain/refactor/complete |
| `/agent` | Agent | Tool-use agentic task runner with live step timeline |
| `/workbench` | Prompt Workbench | System prompt / template design, testing, and model comparison |

## Key Files

| File | Purpose |
|---|---|
| `src/lib/anthropic.ts` | Singleton Anthropic client (server-side only) |
| `src/lib/agent-tools.ts` | Agent tool schemas and server-side handlers |
| `src/lib/streaming.ts` | Shared streaming response utilities |
| `src/lib/prompt-templates.ts` | `{{variable}}` template parser and filler |
| `src/stores/` | Zustand stores for each feature domain |
| `src/app/api/` | All Claude API route handlers |
| `src/components/shell/` | IDE chrome: ActivityBar, Sidebar, StatusBar, IDEShell |

## Environment Variables

```
ANTHROPIC_API_KEY=        # Required — get from console.anthropic.com
BRAVE_SEARCH_API_KEY=     # Optional — enables web_search tool in Agent
```

## Coding Conventions

- API routes validate input with **Zod** before calling Claude
- All Claude calls set an explicit `max_tokens` budget
- Agent loops are capped at **15 iterations** to prevent runaway agents
- Template variables use `{{double_braces}}` syntax (regex: `/\{\{(\w+)\}\}/g`)
- **No inline styles** — use Tailwind utility classes only
- Feature components live in `src/components/<feature>/`; primitives in `src/components/ui/`
- Stores use `skipHydration: true` and call `rehydrate()` in a top-level `useEffect` to prevent SSR mismatch

## Models

| Use case | Model |
|---|---|
| Fast ops (explain, complete) | `claude-haiku-4-5-20251001` |
| Default (chat, agent, workbench) | `claude-sonnet-4-6` |
| Per-run configurable | User selects via model dropdown |

## Running Locally

```bash
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm install
npm run dev
# Open http://localhost:3000
```

## Streaming Patterns

**Chat/code (text stream):**
```
Client fetch → response.body.getReader() → decode chunks → setState(accumulated)
→ on complete: flush to Zustand as final message
```

**Agent (NDJSON stream):**
```
Server: while (stop_reason === "tool_use") { execute → stream step event → loop }
Client: parse each JSON line → update AgentStep state
```

## Design Philosophy

- Simplicity first — favor ease of use over feature density
- No extension ecosystem — no security supply-chain risk
- Pay-per-token pricing — no surprise credit systems
- Explicit context management — each feature owns its context window
