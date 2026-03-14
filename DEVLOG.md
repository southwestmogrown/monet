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

---

## [H-4] Isolate virtual filesystem by run ID — 2026-03-14

### Problem
`agent-tools.ts` originally used a module-level `Map` for the virtual filesystem shared across all concurrent requests to `/api/agent/run`. Two simultaneous agent runs would corrupt each other's file state.

### Changes Made
- **`src/lib/agent-tools.ts`**: Removed module-level `virtualFS` Map and `resetVirtualFS()` export. Added `createVirtualFS()` factory function that returns a fresh `VirtualFS` instance (with `read`, `write`, `list` methods) backed by a new `Map` each call. Updated `executeToolCall` to accept a `vfs: VirtualFS` parameter instead of accessing module-level state.
- **`src/app/api/agent/run/route.ts`**: Calls `createVirtualFS()` once at the top of the POST handler and passes the instance to every `executeToolCall` invocation. Each HTTP request now gets its own isolated filesystem.
- **`tests/api/agent-concurrency.test.ts`**: Added 6 isolation tests verifying that two `createVirtualFS()` instances never share state, including a concurrent-write scenario.

### Acceptance Criteria Met
- Two simultaneous agent runs each see their own isolated filesystem
- `resetVirtualFS()` is no longer exported
- `npm run build` passes (verified ✓)
- All 43 tests pass (verified ✓)

---

## [H-5] Add streaming request timeout / abort signal — 2026-03-14

### Problem
`client.messages.stream()` was called with no timeout or abort signal (and `client.messages.create()` in the agent route similarly). A stalled or very slow Anthropic API response would hold the server connection open indefinitely, consuming a Node.js worker.

### Changes Made
- **`src/app/api/chat/route.ts`**: Added `catch` blocks for `AbortError` in both the text-stream path (yields `"\n\n[Request timed out after 60 seconds.]"` so the client sees a readable error) and the thinking/NDJSON path (emits `{ t: "e", d: "Request timed out after 60 seconds." }` event). The `AbortController`, `setTimeout`, `signal` passing, and `clearTimeout` in `finally` were already in place.
- **`tests/api/chat.test.ts`**: Added 3 new tests using `vi.useFakeTimers()`: text stream abort emits error text, thinking stream abort emits NDJSON `{t:"e"}` event, normal requests complete without timeout.
- **`tests/api/agent.test.ts`**: Added 2 new tests: hanging agent create() triggers error NDJSON event, normal requests complete without timeout.

### Acceptance Criteria Met
- A mocked Anthropic call that never resolves causes the route to close the stream after ~60s (verified ✓)
- Normal requests complete before the timeout and do not trigger the abort (verified ✓)
- `npm run build` passes (verified ✓)
- All 48 tests pass (verified ✓)

---

## [UI/UX Upgrade] AI-native design overhaul — 2026-03-14

### Problem
The original UI was a near-identical clone of VS Code's dark theme — same gray backgrounds (`#1e1e1e`, `#252526`), same exact accent blue (`#007acc`), same generic "M" monogram logo and bright blue status bar. The app lacked any distinct identity despite being a purpose-built Claude IDE.

### Design Decisions
Following the `SKILL_ui-ux-designer.md` guidelines for an IDE category tool:

- **Palette shift**: Moved from VS Code grays to a deep navy palette (`#0B0F1C` base, `#0E1422` sidebar). This is perceptually calmer over long sessions while being visually distinct.
- **Accent**: Changed from VS Code blue `#007acc` → violet `#7C6AF6` / `#9580FF`. Violet is strongly associated with AI tooling and avoids any confusion with VS Code.
- **Logo**: Replaced plain "M" monogram with a `Sparkles` icon in a rounded-square badge with gradient fill and ambient glow. The Sparkles icon communicates "AI-native" at a glance.
- **Status bar**: Removed the VS Code-style solid blue bar. Replaced with a near-black bar with a subtle violet gradient accent stripe and a breadcrumb (`Monet › Chat`).
- **Typography**: Body font updated from `13px system-ui` to `14px Inter/system` for better legibility in long sessions. Monospace font applied consistently to code elements.
- **Empty states**: All four feature empty states now have icons with specific CTAs instead of plain text (following the skill's rule: "Empty states are onboarding opportunities").
- **Buttons**: Primary actions use a violet gradient instead of flat accent color. Destructive actions (stop/delete) use soft red with muted background rather than harsh solid red.
- **Borders**: Changed from opaque VS Code gray borders to dark blue `#1E2947`, giving more depth.
- **Scrollbars**: Thinned to 6px with navy thumb color for a less intrusive feel.
- **Code blocks**: Added consistent header bar with language label + copy button; always shown, not conditional.
- **Agent step cards**: Replaced Spinner with Loader2 (spin CSS animation), updated status icons to use semantic colors from the palette, improved expand/collapse styling.

### Files Changed
- `src/app/globals.css` — Complete palette overhaul, new CSS variables, spin keyframe, improved scrollbars/selection
- `src/components/shell/ActivityBar.tsx` — Sparkles logo, violet nav active states, gradient background
- `src/components/shell/StatusBar.tsx` — Dark background, violet accent stripe, breadcrumb nav
- `src/components/chat/MessageList.tsx` — Sparkles empty state with ambient glow
- `src/components/chat/MessageBubble.tsx` — Better bubbles, Sparkles Claude avatar, improved inline code, heading renderers
- `src/components/chat/ChatInput.tsx` — Rounded input, gradient send button, focus border ring
- `src/components/chat/ConversationSidebar.tsx` — "Start one →" CTA, violet active state, red delete hover
- `src/components/ui/CodeBlock.tsx` — Always-visible header, improved copy button style
- `src/components/agent/AgentStepCard.tsx` — Better card hover, semantic status icons, improved result styling
- `src/components/agent/AgentStepList.tsx` — Bot icon empty state, better final answer box
- `src/components/agent/AgentTaskInput.tsx` — Gradient Run button, better typography, red stop button
- `src/components/editor/EditorToolbar.tsx` — Violet Complete button, better button hover states
- `src/components/workbench/TemplateLibrary.tsx` — "Create one →" CTA, consistent sidebar pattern
- `src/components/workbench/WorkbenchPanel.tsx` — Gradient run button, mode tab improvements
- `src/components/settings/SettingsPanel.tsx` — Icon-box section headers, bigger title

### Acceptance Criteria Met
- Zero functionality changes — all 48 tests pass (verified ✓)
- Visually distinct from VS Code: deep navy palette + violet accent
- Empty states all have primary CTAs
- Transitions capped at 120ms (per skill guidelines)
- Color used semantically: violet = primary, red = destructive, green = success
