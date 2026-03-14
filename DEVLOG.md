# Monet — Work Log

## [Phase 1] Scaffold — 2026-03-12

### Steps Completed
- Initialized Next.js 16 app with TypeScript, Tailwind CSS v4, App Router, `src/` dir, `@/*` alias
- Installed all production dependencies: `@anthropic-ai/sdk`, `@monaco-editor/react`, `zustand`, `react-markdown`, `remark-gfm`, `rehype-highlight`, `highlight.js`, `lucide-react`, Radix UI primitives, `react-resizable-panels`, `nanoid`, `zod`
- Configured `next.config.ts`: `transpilePackages` for Monaco, `reactStrictMode: false`
- Replaced default `globals.css` with dark VS Code-inspired theme (CSS custom properties: `--bg-editor`, `--bg-sidebar`, `--accent`, etc.)
- Created all source directories: `types/`, `lib/`, `stores/`, `hooks/`, `components/{shell,chat,editor,agent,workbench,ui}`
- Created type definitions: `types/chat.ts`, `types/editor.ts`, `types/agent.ts`, `types/workbench.ts`
- Created `lib/anthropic.ts` — singleton Anthropic client
- Created `lib/streaming.ts` — `createTextStream` and `createNdjsonStream` utilities
- Created `lib/prompt-templates.ts` — `extractVariables` and `fillTemplate`
- Created `lib/agent-tools.ts` — tool schemas (5 tools) and server-side handlers with virtual FS
- Created `CLAUDE.md` at repo root
- Created `worklog.md` at repo root (this file)
- Created `.env.local.example`

### Decisions Made
- `reactStrictMode: false` — Monaco Editor double-mounts in React Strict Mode dev causing flickering
- Virtual FS in agent tools uses an in-memory `Map` scoped to the route module; resets per run via `resetVirtualFS()`
- `web_search` degrades gracefully when `BRAVE_SEARCH_API_KEY` is not set (returns informative message)
- Tailwind CSS v4 is used (new `@import "tailwindcss"` syntax, not `@tailwind base/components/utilities`)

### Bugs / Problems
- None

---

## [Phase 2] IDE Shell — 2026-03-12

### Steps Completed
- Built `ActivityBar` with Lucide icons, active route highlighting, hover effects
- Built `StatusBar` with route label, token count, language, model display
- Built `IDEShell` composing the two above with a flex layout
- Created `(ide)` route group with shared layout wrapping `IDEShell`
- Wired up four page stubs: `/chat`, `/editor`, `/agent`, `/workbench`
- Root `page.tsx` redirects to `/chat`
- Root `layout.tsx` updated with project title and description

### Bugs / Problems
- None

---

## [Phase 3] Chat — 2026-03-12

### Steps Completed
- Built `chat-store.ts` (Zustand + persist): conversations, messages, model selection, auto-title from first message
- Built `useStreamingResponse` hook: generic SSE/streaming fetch with abort controller
- Built `useChat` hook: wires streaming into store, ensures conversation on send
- Built `/api/chat/route.ts`: streaming endpoint using `anthropic.messages.stream()`
- Built `MessageBubble`: user = right-aligned bubble, assistant = react-markdown with GFM + syntax highlighting
- Built `MessageList`: auto-scroll to latest, empty state
- Built `ChatInput`: auto-resize textarea, Enter sends, Shift+Enter newlines, model selector, stop button
- Built `ConversationSidebar`: create/delete conversations with delete button on hover
- Built `ChatPanel`: composes all chat components

### Decisions Made
- `useStreamingResponse` uses a single instance in `useChat` with `onChunk` callback writing to store
- `useChat` uses a `ref` to track the active conversation ID during streaming (avoids stale closure)
- Messages include an empty assistant placeholder while streaming; filled via `updateLastAssistantMessage`

### Bugs / Problems
- **Bug**: Initial `useChat` had two `useStreamingResponse` instances (one for streaming, one for callback); caused state mismatch
  **Fix**: Merged into a single instance with `onChunk` callback
  **Status**: Resolved

---

## [Phase 4] Code Editor — 2026-03-12

### Steps Completed
- Built `editor-store.ts` (Zustand + persist): content, language, fileName, aiResult, virtual FS
- Built `useMonaco` hook: `runAIAction` fetches from code API routes and writes to store
- Built `/api/code/explain`, `/api/code/refactor`, `/api/code/complete` — non-streaming JSON routes using Haiku
- Built `MonacoEditor`: registers claude-dark theme, adds right-click context menu actions (Explain/Refactor/Complete), `Ctrl+Shift+L` shortcut for complete
- Built `EditorToolbar`: language selector, AI action buttons, loading state
- Built `AIOutputDrawer`: slide-up panel with Apply button for refactor/complete
- Built `EditorPanel`: composes all editor components

### Decisions Made
- No real-time ghost-text completions in v1 (explicit trigger only) to keep complexity low
- All three code operations use Haiku (fast, cheap) with temperature 0 for determinism
- `AIOutputDrawer` slides up from bottom of editor rather than a modal

### Bugs / Problems
- None

---

## [Phase 5] Agent — 2026-03-12

### Steps Completed
- Built `agent-store.ts` (Zustand, no persist): currentRun, pastRuns, step lifecycle
- Built `useAgentRun` hook: parses NDJSON stream, maps API step IDs to local step IDs
- Built `/api/agent/run/route.ts`: agentic loop with 15-iteration cap, NDJSON streaming
- Built `AgentToolBadge`: color-coded chip per tool type
- Built `AgentStepCard`: expandable card showing tool, input, result; status icons
- Built `AgentStepList`: scrolling timeline with final answer/error box
- Built `AgentTaskInput`: textarea + run/stop/clear controls
- Built `AgentPanel`: composes all agent components

### Decisions Made
- Agent store is not persisted (agent runs are ephemeral; past 20 stored in memory only)
- `resetVirtualFS()` is called at the start of each agent run (fresh FS per run)
- Web search gracefully degrades when `BRAVE_SEARCH_API_KEY` is absent

### Bugs / Problems
- None

---

## [Phase 6] Workbench — 2026-03-12

### Steps Completed
- Built `workbench-store.ts` (Zustand + persist): templates, variables, run results
- Built `useWorkbench` hook: `runTemplate` and `compareVariants`
- Built `/api/prompt-workbench/run` and `/api/prompt-workbench/compare` routes
- Built `TemplateLibrary`: sidebar with create/delete, same UX pattern as ConversationSidebar
- Built `VariableInputs`: auto-parses `{{variable}}` from templates, renders form fields
- Built `TemplateEditor`: name + system prompt + user message textareas
- Built `RunOutputPane`: renders markdown output with token usage display
- Built `CompareGrid`: 2–4 variant model selector + side-by-side `RunOutputPane` grid
- Built `WorkbenchPanel`: composes all workbench components with run/compare mode toggle

### Decisions Made
- Compare mode uses non-streaming `Promise.all` (final outputs easier to compare than streaming)
- Templates persist to localStorage; variables and run results reset on template switch

### Bugs / Problems
- **Bug**: `z.record(z.string())` caused TypeScript errors (Zod v4 requires 2 args for `record`)
  **Fix**: Changed to `z.record(z.string(), z.string())`
  **Status**: Resolved

---

## [Phase 7] Polish — 2026-03-12

### Steps Completed
- Added `@keyframes blink` for assistant streaming cursor
- Added `.markdown-body` styles for links and tables
- Added `!.env*.example` exception to `.gitignore` so the example file is tracked
- Removed Google Fonts (Geist) from `layout.tsx` — network unavailable in build environment; system fonts used instead
- Build verified: `npm run build` passes with 0 errors

### Bugs / Problems
- **Bug**: `npm run build` failed — Google Fonts (Geist) unreachable (TLS/network issue in build environment)
  **Fix**: Removed `next/font/google` imports from `layout.tsx`, switched to system font stack in `globals.css`
  **Status**: Resolved

---

## [Phase 8] Code Review — 2026-03-13

### Review Summary
Full codebase security and quality review conducted post-CI green. Six issues identified, none critical to current functionality but several are important before any production hardening.

### Findings

**Security**
- `X-Anthropic-Key` header override is active in production; should be gated to `NODE_ENV === "development"` only.
- `anthropicKeyOverride` persisted to `localStorage` — exposes the key to XSS. Warn users more prominently or use sessionStorage.

**Correctness / Edge Cases**
- `/api/code/complete` accepts an empty code string (`z.string()` with no `.min(1)`); all other code routes enforce `.min(1)`.
- Agent tool inputs are cast to `Record<string, unknown>` and accessed with `as string` type assertions rather than being validated against a Zod schema.
- Virtual filesystem (`virtualFS` Map in `agent-tools.ts`) is module-level global state; concurrent agent runs would corrupt each other's files.

**Reliability**
- `client.messages.stream()` is called with no timeout or abort signal; a stalled Anthropic API call will hang the server connection indefinitely.

**Test Coverage**
- Only 2 of 7 API routes have tests (`/api/chat`, `/api/agent/run`). Code, workbench, and virtual-FS concurrency are untested.

### Decisions Made
- Issues logged as Group H in `issues.md` for batch implementation.
- Virtual FS concurrency fix (H-4) is the highest-risk item; scoped to `agent-tools.ts` only.

### Bugs / Problems
- None discovered in existing feature functionality.
