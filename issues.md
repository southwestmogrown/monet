# Monet — Engineering Issues

> **Status snapshot (as of last commit):** Settings Panel (store, page, component, ActivityBar),
> Extended Thinking API route and streaming hook, Vision API groundwork, and custom API-key
> passthrough are **complete**. What follows covers everything remaining.

---

## How to read this document

Each issue has:
- **Files touched** — exact paths that will be modified or created
- **Acceptance criteria** — machine-verifiable definition of done
- **Group** — which parallel batch it belongs to

### Parallel groups (no intra-group merge conflicts)

| Group | Theme | Can run in parallel with |
|---|---|---|
| **A** | Chat UI completion | B, C, D |
| **B** | Agent / Workbench hook wiring | A, C, D |
| **C** | Build health & TypeScript | A, B, D |
| **D** | Code quality & polish | A, B, C |
| **E** | Settings integration (reads from A+B) | — (runs after A+B merge) |
| **F** | Persistence & storage hardening | E |
| **G** | Tests & CI | F |

### Orchestration notes

1. **A + B + C + D** can be dispatched in four simultaneous agents with zero conflict risk.
2. **E** is a single-agent pass that touches a superset of files from A and B — it must wait for
   those branches to merge.
3. **F** only touches stores and the API layer — no UI files — so it can be a single focused agent.
4. **G** is a dedicated test/CI agent that runs last.
5. Each issue references the exact files it changes; use this list to confirm no overlap before
   dispatching agents in the same batch.

---

## Group A — Chat UI Completion

*Files: ChatInput.tsx, MessageBubble.tsx only. Zero overlap with other groups.*

---

### A-1 · Chat: Extended Thinking toggle in ChatInput

**Priority:** High
**Files touched:**
- `src/components/chat/ChatInput.tsx`

**Context:**
`thinkingEnabled` and `setThinkingEnabled` are already wired in `useChatStore`. The API route
already streams thinking blocks as NDJSON. The only missing piece is the UI toggle.

**Requirements:**
- Add a lightbulb icon button (`Lightbulb` from `lucide-react`) to the bottom toolbar of
  `ChatInput`, positioned to the left of the model selector.
- The button reads `thinkingEnabled` from `useChatStore` and calls `setThinkingEnabled` on click.
- When `thinkingEnabled === true`: button background is `var(--accent)`, icon is white, `title`
  reads "Thinking ON — Claude will show its reasoning".
- When `thinkingEnabled === false`: button is borderless/transparent, icon is `var(--text-muted)`,
  `title` reads "Enable extended thinking".
- When `thinkingEnabled === true` and `model === "claude-haiku-4-5-20251001"`, show a small inline
  warning badge "Haiku → Sonnet" next to the toggle (the API route already upgrades automatically;
  this just informs the user).
- `ChatInput` currently receives `model` and `onModelChange` as props — no signature change needed
  beyond reading the store directly for `thinkingEnabled`.

**Acceptance criteria:**
- [ ] Lightbulb button renders in the toolbar
- [ ] Clicking toggles `thinkingEnabled` in the store (verified by refreshing page and checking
  persistence via localStorage key `monet-chat`)
- [ ] Active state is visually distinct (accent background)
- [ ] Haiku warning badge appears when both Haiku model and thinking are selected
- [ ] `npm run build` passes with no type errors in this file

---

### A-2 · Chat: Thinking block display in MessageBubble

**Priority:** High
**Files touched:**
- `src/components/chat/MessageBubble.tsx`

**Context:**
`Message.thinking?: string` is set by `updateLastAssistantMessage` when the streaming hook receives
thinking deltas. The bubble needs to render it.

**Requirements:**
- When `message.thinking` is non-empty, render a collapsible `ThinkingBlock` **above** the main
  markdown content, within the assistant bubble column.
- `ThinkingBlock` UI spec:
  - Header row: `Brain` icon (lucide) + label "Reasoning" + chevron (`ChevronDown`/`ChevronUp`)
  - Background: `rgba(0,0,0,0.2)`, border: `1px solid var(--border)`, border-radius: 6px
  - Font: monospace, `font-size: 11px`, `color: var(--text-secondary)`
  - Collapsed by default (`useState(false)`)
  - When expanded, show `message.thinking` as pre-wrapped monospace text in a scrollable div
    (max-height 300px, overflow-y: auto)
  - Add a smooth CSS transition for height (`max-height` transition, 200ms ease)
- The thinking block must not appear for user messages or when `message.thinking` is undefined/empty.

**Acceptance criteria:**
- [ ] Assistant messages with thinking render a collapsed "Reasoning" header
- [ ] Clicking the header expands/collapses the thinking text
- [ ] Thinking text is monospace, visually distinct from the main response
- [ ] Messages without thinking are visually unchanged
- [ ] `npm run build` passes with no type errors in this file

---

### A-3 · Chat: Image attachment UI in ChatInput

**Priority:** High
**Files touched:**
- `src/components/chat/ChatInput.tsx`

**Context:**
`sendMessage(content, imageAttachment?)` in `useChat` already accepts an `ImageAttachment` object
`{ dataUrl, mediaType }`. The API route already converts it to Anthropic image content blocks.
The only missing piece is the UI for attaching images.

**Requirements:**
- Add a hidden `<input type="file" accept="image/jpeg,image/png,image/gif,image/webp">` with a ref.
- Add a `Paperclip` icon button (lucide) in the textarea row (left side, before the textarea) that
  triggers the file input's click.
- On file select: read as data URL via `FileReader`, store in local component state
  `imageAttachment: { dataUrl: string; mediaType: string } | null`.
- On paste (`onPaste` on the textarea): check `e.clipboardData.items` for `image/*` items, read
  as data URL, set same state.
- When `imageAttachment` is set, render a thumbnail preview **above** the textarea row:
  - 56×56px `<img>` with `object-fit: cover`, `border-radius: 6px`, `border: 1px solid var(--border)`
  - An ✕ button (absolute top-right of the thumbnail) to clear `imageAttachment`
- On send: pass `imageAttachment` to `onSend`. Clear `imageAttachment` state after send.
- Update the `onSend` prop signature: `onSend: (content: string, image?: ImageAttachment) => void`
  (import `ImageAttachment` from `@/hooks/useChat`).
- Enforce a 4 MB file size limit: if `file.size > 4 * 1024 * 1024`, show a one-line error message
  below the toolbar "Image too large (max 4 MB)" and do not set `imageAttachment`.

**Acceptance criteria:**
- [ ] Paperclip icon renders; clicking opens native file picker filtered to images
- [ ] Pasting an image from clipboard attaches it
- [ ] Thumbnail preview visible with ✕ dismiss
- [ ] On send, image data flows to `useChat.sendMessage`; store clears after send
- [ ] 4 MB size limit enforced with inline error
- [ ] `npm run build` passes

---

### A-4 · Chat: Image thumbnail in user MessageBubble

**Priority:** Medium
**Files touched:**
- `src/components/chat/MessageBubble.tsx`

**Context:**
`Message.imageUrl?: string` is persisted to the store when a user sends a message with an
attachment. The bubble needs to display it.

**Requirements:**
- In the user bubble (right-aligned), when `message.imageUrl` is present, render an `<img>` tag
  **above** the text content.
- Image style: `max-width: 280px`, `max-height: 200px`, `object-fit: contain`, `border-radius: 6px`,
  `display: block`, `margin-bottom: 6px`.
- No alt text needed beyond `alt="attached image"`.
- Image must not overflow the bubble's `max-width: 80%` constraint.

**Acceptance criteria:**
- [ ] User messages with image show the thumbnail above the text
- [ ] User messages without image are unchanged
- [ ] Image does not overflow the bubble container
- [ ] `npm run build` passes

---

## Group B — Agent / Workbench Hook Wiring

*Files: useAgentRun.ts, AgentTaskInput.tsx, useWorkbench.ts. Zero overlap with Group A.*

---

### B-1 · Agent: Pass API key override and enabled tools from settings

**Priority:** High
**Files touched:**
- `src/hooks/useAgentRun.ts`

**Context:**
The agent API route already accepts `X-Anthropic-Key` header and `enabledTools: string[]` body
param. The hook currently hardcodes neither. The settings store has `anthropicKeyOverride` and
`agentToolDefaults`.

**Requirements:**
- At the top of `runAgent`, read `anthropicKeyOverride` from `useSettingsStore.getState()`.
- Build `extraHeaders: Record<string, string> = {}`. If `anthropicKeyOverride` is non-empty, set
  `extraHeaders["X-Anthropic-Key"] = anthropicKeyOverride`.
- The `runAgent` function signature currently accepts `(goal: string, context?: string)`. Add a
  third optional param `enabledTools?: string[]`. Default to `useSettingsStore.getState().agentToolDefaults` when not provided.
- Pass `enabledTools` in the request body and `extraHeaders` to the fetch call.
- `useSettingsStore.persist.rehydrate()` must be called once in a `useEffect` inside `useAgentRun`
  (or confirmed it is called in the parent — check `AgentPanel.tsx` and add if missing).

**Acceptance criteria:**
- [ ] When `anthropicKeyOverride` is set in settings, the fetch to `/api/agent/run` includes
  `X-Anthropic-Key` header (verifiable in browser DevTools Network tab)
- [ ] When a tool is unchecked in Settings → Agent Tool Permissions, it is excluded from the
  agent run's `enabledTools` array
- [ ] `npm run build` passes

---

### B-2 · Agent: Tool permission checkboxes in AgentTaskInput (per-run override)

**Priority:** Medium
**Files touched:**
- `src/components/agent/AgentTaskInput.tsx`

**Context:**
The global defaults are set in Settings. The `AgentTaskInput` should also surface per-run tool
toggles, initialised from the settings defaults, so users can change them without leaving the Agent view.

**Requirements:**
- Add local state `enabledTools: AgentToolName[]`, initialized from
  `useSettingsStore.getState().agentToolDefaults` on mount (use `useState` with lazy init).
- Below the textarea, render a horizontal row of small checkbox+label pairs for each of the 5
  tools. Style: `font-size: 11px`, `color: var(--text-muted)`, `gap: 12px`, `flexWrap: wrap`.
- Label each with the tool name (no description needed here — full description is in Settings).
- Update the `onRun` prop signature to `onRun: (goal: string, enabledTools: AgentToolName[]) => void`
  and pass `enabledTools` on run.
- Update `AgentPanel.tsx` to pass the new signature through to `useAgentRun.runAgent`.
- Import `useSettingsStore` and `AgentToolName` from their respective modules.
- `useSettingsStore.persist.rehydrate()` should be called in an effect if not already present.

**Files also touched (minimal change):**
- `src/components/agent/AgentPanel.tsx` — update `onRun` handler to pass `enabledTools`

**Acceptance criteria:**
- [ ] Tool checkboxes appear under the goal textarea in AgentTaskInput
- [ ] Initial checked state matches the defaults from the Settings panel
- [ ] Unchecking a tool here excludes it from the current run only (not persisted globally)
- [ ] `npm run build` passes

---

### B-3 · Workbench: Pass API key override in useWorkbench

**Priority:** Medium
**Files touched:**
- `src/hooks/useWorkbench.ts`

**Context:**
The workbench makes fetch calls to `/api/prompt-workbench/run` and `/api/prompt-workbench/compare`.
Like the chat and agent hooks, it should forward `X-Anthropic-Key` when set.

**Requirements:**
- Read `anthropicKeyOverride` from `useSettingsStore.getState()` inside `runTemplate` and
  `compareVariants`.
- Add `useSettingsStore.persist.rehydrate()` to the existing `useEffect` in the hook.
- Pass `"X-Anthropic-Key": anthropicKeyOverride` header on both fetch calls when the value is
  non-empty.
- Also check: do `/api/prompt-workbench/run` and `/api/prompt-workbench/compare` call
  `getAnthropicClient()`? If so, update them to read the `X-Anthropic-Key` header and pass it
  as the `apiKey` arg (same pattern as `/api/chat/route.ts`).

**Files also touched (if needed):**
- `src/app/api/prompt-workbench/run/route.ts`
- `src/app/api/prompt-workbench/compare/route.ts`

**Acceptance criteria:**
- [ ] With a custom key set in Settings, workbench runs succeed using that key
- [ ] `npm run build` passes

---

## Group C — Build Health & TypeScript

*Files: API routes and lib only. Safe to run alongside A and B.*

---

### C-1 · TypeScript: Eliminate `as any` casts in API routes

**Priority:** High
**Files touched:**
- `src/app/api/agent/run/route.ts`
- `src/app/api/chat/route.ts`

**Context:**
Both routes use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and `as any` casts
because the Anthropic SDK's TypeScript definitions don't fully cover the `thinking` content block
type or the mixed-type messages array. These should be resolved properly.

**Requirements:**
- In `chat/route.ts`: define a local `ThinkingConfig` type `{ type: "enabled"; budget_tokens: number }`
  and cast the `thinking` param through it instead of `as any`.
- In `chat/route.ts`: define a `AnthropicMessage` union type for user messages that can have
  `string` or `Array<ImageBlock | TextBlock>` content, eliminating the `as any` on `anthropicMessages`.
- In `agent/run/route.ts`: type the `messages` array properly using the SDK's
  `Anthropic.MessageParam` type (imported from `@anthropic-ai/sdk`). Replace the `as any` cast on
  the messages array.
- In `agent/run/route.ts`: type `response.content` as `Anthropic.ContentBlock[]` and narrow properly
  instead of using `as { type: "text"; text: string }`.
- Target: zero `// eslint-disable` comments related to `any` in these two files.

**Acceptance criteria:**
- [ ] `npm run type-check` (`tsc --noEmit`) exits with code 0
- [ ] `npm run lint` exits with code 0
- [ ] `npm run build` exits with code 0

---

### C-2 · Build: Verify full production build passes

**Priority:** High
**Files touched:** None (verification only, fix whatever breaks)

**Context:**
The last committed state adds new features and changes hook signatures. The build has not been
verified since these changes.

**Requirements:**
- Run `npm run build`. Fix every TypeScript or lint error that surfaces — do not suppress with
  `as any` or `eslint-disable` (use proper types or justified local casts with comments).
- Common expected failures to look for:
  - `ChatInput.tsx` `onSend` prop signature mismatch (A-3 changes it)
  - `AgentPanel.tsx` `onRun` prop mismatch (B-2 changes it)
  - `MessageBubble.tsx` unknown props after A-2/A-4 changes
  - Any missing imports for `useSettingsStore`
- After all errors are resolved, confirm `npm run build` exits 0 and `npm run lint` exits 0.

**Acceptance criteria:**
- [ ] `npm run build` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run type-check` exits 0
- [ ] No runtime console errors on page load for /chat, /editor, /agent, /workbench, /settings

---

## Group D — Code Quality & UX Polish

*Files: individual components. Safe to run alongside A, B, C.*

---

### D-1 · Settings: Rehydrate on mount and reflect live changes

**Priority:** Medium
**Files touched:**
- `src/components/settings/SettingsPanel.tsx`

**Context:**
`SettingsPanel` already calls `useSettingsStore.persist.rehydrate()` on mount. However, the
`keyDraft` state is synced from `store.anthropicKeyOverride` in a `useEffect` — verify this
correctly handles the hydration timing (the effect runs after rehydration).

**Requirements:**
- Ensure `keyDraft` is always in sync with `store.anthropicKeyOverride` after hydration. If there
  is a race (keyDraft initializes to "" before hydration completes), fix by moving the sync effect
  to depend on `store.anthropicKeyOverride`.
- Add a "Clear key" button next to "Save" that sets `anthropicKeyOverride` to `""` and clears
  `keyDraft`. Style: same height as Save, `background: none`, `border: 1px solid var(--border)`.
- Add a read-only masked display of the active key when set: show only the last 4 characters,
  e.g. `••••••••••••abcd`.

**Acceptance criteria:**
- [ ] Page refresh → /settings shows the previously saved key (masked)
- [ ] Clear button resets to "Using server environment variable" state
- [ ] `npm run build` passes

---

### D-2 · ActivityBar: Tooltip labels on hover

**Priority:** Low
**Files touched:**
- `src/components/shell/ActivityBar.tsx`

**Context:**
The refactored `NavLink` component passes `title` to the `<Link>`. Native browser tooltips are
fine but appear after a delay and look inconsistent. Add simple CSS-only tooltips.

**Requirements:**
- Use a CSS approach (no JS): wrap each `NavLink` in a `<div style={{position:"relative"}}>` and
  add a `::after` pseudo-element tooltip via a global CSS class in `globals.css`.
- Alternative (simpler): rely entirely on the existing `title` attribute — the native tooltip is
  acceptable. If going this route, mark this issue as "won't do" and close it.
- If implementing custom tooltips: they must appear after 500ms hover, show the label text,
  position to the right of the icon, and use the same font/colors as the status bar.

**Acceptance criteria:**
- [ ] Each icon shows its label on hover (native title OR custom tooltip)
- [ ] Settings icon shows "Settings" label
- [ ] `npm run build` passes

---

### D-3 · UX: Empty state for Settings → no API key

**Priority:** Low
**Files touched:**
- `src/components/settings/SettingsPanel.tsx`

**Context:**
When neither `ANTHROPIC_API_KEY` (server env) nor the browser override is set, API calls will
fail with 401. Users need guidance.

**Requirements:**
- Add a yellow/amber info banner at the top of `SettingsPanel` when `anthropicKeyOverride` is empty.
  Text: "No in-browser API key set. The app will use the server's ANTHROPIC_API_KEY environment
  variable. Set a key here if you're running without a server .env file."
- Banner style: `background: rgba(255,200,0,0.1)`, `border: 1px solid rgba(255,200,0,0.3)`,
  `border-radius: 6px`, `padding: 10px 14px`, `font-size: 12px`, `color: var(--text-secondary)`.

**Acceptance criteria:**
- [ ] Banner visible when `anthropicKeyOverride` is empty
- [ ] Banner hidden when key is set
- [ ] `npm run build` passes

---

## Group E — Settings Integration (run after A + B merge)

*Touches store initialisation across features. Must run after Group A and B are merged.*

---

### E-1 · Apply default models from Settings on feature load

**Priority:** Medium
**Files touched:**
- `src/stores/chat-store.ts`
- `src/hooks/useChat.ts`
- `src/hooks/useWorkbench.ts`
- `src/components/agent/AgentPanel.tsx` (or wherever agent model is set)

**Context:**
`useSettingsStore.defaultModels` holds per-feature model preferences. Currently, each feature
hardcodes its initial model in its own store. The settings default should seed the feature store
on first load.

**Requirements:**
- In `useChat.ts` `useEffect` (which already calls `rehydrate()`): after both stores are hydrated,
  if `chatStore.activeModel` is still the hardcoded default (`"claude-sonnet-4-6"`), set it to
  `settingsStore.defaultModels.chat`. This prevents overriding a user's per-conversation choice.
- Apply the same pattern to the workbench and agent features.
- Do not overwrite a model that the user has explicitly changed in the current session.

**Acceptance criteria:**
- [ ] Change Settings → Default Models → Chat to Opus, navigate to /chat, confirm model selector
  shows Opus
- [ ] The change only affects new conversations, not existing ones with a recorded model
- [ ] `npm run build` passes

---

### E-2 · Thinking budget as a configurable setting

**Priority:** Low
**Files touched:**
- `src/stores/settings-store.ts`
- `src/components/settings/SettingsPanel.tsx`
- `src/app/api/chat/route.ts`
- `src/hooks/useChat.ts`

**Context:**
The `budget_tokens` for extended thinking is hardcoded to `8000` in the API route. Power users may
want to increase or decrease this.

**Requirements:**
- Add `thinkingBudget: number` (default `8000`) to `SettingsState`.
- Add a number input (range: 1024–32000, step: 1024) in the Settings panel under a new
  "Extended Thinking" section, below the model section.
- Pass `thinkingBudget` from the settings store through `useChat.ts` → request body → API route.
- API route reads `thinkingBudget` from the request body and uses it in the `thinking` config.
- Ensure `max_tokens` in the API call is always at least `thinkingBudget + 1000`.

**Acceptance criteria:**
- [ ] Slider/input in Settings changes the thinking budget
- [ ] Budget is reflected in Claude's actual reasoning depth (observable from the Anthropic
  console usage tab or by sending a reasoning-heavy prompt)
- [ ] `npm run build` passes

---

## Group F — Persistence & Storage Hardening

*Run after Group E. Touches stores and API layer only.*

---

### F-1 · Image data URL storage concern — compress before persisting

**Priority:** Medium
**Files touched:**
- `src/stores/chat-store.ts`
- `src/hooks/useChat.ts`

**Context:**
`message.imageUrl` stores the full base64 data URL in localStorage. A 4 MB image becomes a ~5.5 MB
base64 string. With multiple images across conversations, localStorage will hit its ~5–10 MB limit.

**Requirements:**
- In `useChat.ts`, before calling `addMessage` with `imageUrl`, compress the image client-side
  using an `<canvas>` element: draw the image, export as JPEG at 0.7 quality, max 800×800px.
- Replace the original `imageAttachment.dataUrl` with the compressed version for both the store
  (display thumbnail) and the API request.
- Add a utility function `src/lib/compress-image.ts` that accepts a data URL and returns a
  compressed data URL via a `Promise`.
- Enforce: if after compression the data URL is still > 2 MB, reject and show an error.

**Acceptance criteria:**
- [ ] A 3 MB JPEG is compressed to < 500 KB before being stored
- [ ] The compressed image is still readable in the message bubble
- [ ] LocalStorage does not grow unboundedly across multiple image-containing messages
- [ ] `npm run build` passes

---

### F-2 · Agent run history persistence

**Priority:** Low
**Files touched:**
- `src/stores/agent-store.ts`

**Context:**
`agent-store` intentionally has no `persist` middleware (noted in the original design). Past runs
are lost on page reload. This is acceptable for v1 but users frequently want to reference previous runs.

**Requirements:**
- Add `persist` middleware to `useAgentStore` with key `"monet-agent"`.
- Persist only `pastRuns` (not `currentRun` — an in-progress run cannot be resumed after reload).
- On mount, if `currentRun` is in "running" state (from a previous interrupted session), transition
  it to `"error"` with message "Run was interrupted (page reloaded)." and move it to `pastRuns`.
- Cap `pastRuns` storage at 10 entries (most recent). Trim on every `finishRun`/`failRun`.

**Acceptance criteria:**
- [ ] Run history survives a page reload
- [ ] Past run timeline can be viewed after reload
- [ ] localStorage key `monet-agent` exists and contains a serialized run list
- [ ] `npm run build` passes

---

## Group G — Tests & CI

*Run last, after all other groups merge.*

---

### G-1 · API route smoke tests

**Priority:** Medium
**Files touched:**
- `tests/api/chat.test.ts` (new)
- `tests/api/agent.test.ts` (new)
- `package.json` (add test script)

**Requirements:**
- Add `vitest` as a dev dependency (compatible with Next.js App Router without extra config).
- Write smoke tests for:
  - `POST /api/chat` with a mock `ANTHROPIC_API_KEY` env var and a mocked Anthropic SDK response.
    Assert: returns 200, content-type is `text/plain`, body is a non-empty string.
  - `POST /api/chat` with `thinking: true`. Assert: content-type is `application/x-ndjson`,
    body lines parse as `{ t: "k"|"x", d: string }`.
  - `POST /api/agent/run` with mocked tool execution. Assert: NDJSON stream contains a `final`
    event.
  - `POST /api/chat` with missing API key. Assert: returns 4xx or 5xx with JSON error body.
- Use `vi.mock("@anthropic-ai/sdk")` to mock the SDK in tests.
- Add `"test": "vitest run"` to `package.json` scripts.

**Acceptance criteria:**
- [ ] `npm test` exits 0
- [ ] All four test cases pass
- [ ] Tests run in < 10 seconds (mocked SDK, no real network calls)

---

### G-2 · GitHub Actions CI workflow

**Priority:** Low
**Files touched:**
- `.github/workflows/ci.yml` (new)

**Requirements:**
- Trigger on: `push` to any `claude/*` branch, `pull_request` targeting `main`.
- Jobs (run in parallel):
  - `type-check`: `npm run type-check`
  - `lint`: `npm run lint`
  - `build`: `npm run build`
  - `test`: `npm test`
- Node version: 20. Cache: `~/.npm`.
- Do **not** include deployment steps.

**Acceptance criteria:**
- [ ] All four jobs appear in the Actions tab on next push
- [ ] No job fails on the current codebase state (assumes G-1 is done)

---

## Orchestration Summary

```
┌──────────────────────────────────────────────────────────────────┐
│  BATCH 1 (all parallel, no conflicts)                            │
│  Agent-A: Issues A-1, A-2, A-3, A-4  (Chat UI)                 │
│  Agent-B: Issues B-1, B-2, B-3       (Agent + Workbench hooks)  │
│  Agent-C: Issues C-1, C-2            (Build health)             │
│  Agent-D: Issues D-1, D-2, D-3       (Polish)                   │
└──────────────┬───────────────────────────────────────────────────┘
               │  merge all four branches
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  BATCH 2 (sequential or parallel — no conflict between E1/E2)    │
│  Agent-E: Issues E-1, E-2            (Settings integration)     │
└──────────────┬───────────────────────────────────────────────────┘
               │  merge
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  BATCH 3                                                         │
│  Agent-F: Issues F-1, F-2            (Storage hardening)        │
└──────────────┬───────────────────────────────────────────────────┘
               │  merge
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  BATCH 4                                                         │
│  Agent-G: Issues G-1, G-2            (Tests & CI)               │
└──────────────────────────────────────────────────────────────────┘
```

### Cost optimization tips

- **Batch 1 is where most of the token spend is.** Dispatch four small agents each with a narrow
  file scope rather than one large agent touching everything.
- **C-2 (build verification) is the cheapest signal** — run it as a final check after each batch
  rather than making it a separate agent; it can be folded into the Agent-C prompt.
- **E-1 and E-2 can be merged into a single agent** since they touch overlapping stores. One agent
  doing both is cheaper than the orchestration overhead of two.
- **G-1 and G-2 can be a single agent** — the CI workflow is trivial once tests exist.
- **Recommended agent sizes**: A = ~3K output tokens, B = ~2K, C = ~1.5K, D = ~1K, E = ~2K,
  F = ~2K, G = ~3K.

---

## Group H — Security & Hardening

*Run after Group G. Addresses findings from the Phase 8 code review. No intra-group file conflicts.*

---

### H-1 · Code completion accepts empty string

**Priority:** Medium
**Files touched:**
- `src/app/api/code/complete/route.ts`

**Context:**
`/api/code/complete` validates `code` with `z.string()` and no `.min(1)` constraint. Every other
code route (`/api/code/explain`, `/api/code/refactor`) uses `z.string().min(1)`. An empty string
will reach the Claude API and waste tokens or produce nonsensical output.

**Requirements:**
- Change the `code` field in the Zod schema from `z.string()` to `z.string().min(1)`.
- Confirm the 400 response path is already handled by the existing Zod parse error handler (it
  should be — no additional error handling needed).

**Acceptance criteria:**
- [ ] `POST /api/code/complete` with `{ code: "" }` returns 400
- [ ] `POST /api/code/complete` with `{ code: "const x = 1" }` still returns 200
- [ ] `npm run build` passes

---

### H-2 · Restrict API key header override to development

**Priority:** High
**Files touched:**
- `src/app/api/chat/route.ts`
- `src/app/api/agent/run/route.ts`
- `src/app/api/prompt-workbench/run/route.ts`
- `src/app/api/prompt-workbench/compare/route.ts`
- `src/lib/anthropic.ts`

**Context:**
All API routes read the `X-Anthropic-Key` request header and use it to override the server-side
API key. In production, this allows any caller to supply an arbitrary Anthropic API key, which is
a security risk (key enumeration, billing abuse). The override should only be accepted when
`NODE_ENV === "development"`.

**Requirements:**
- In `src/lib/anthropic.ts` (or wherever `getAnthropicClient` is defined), gate the key override:
  ```ts
  const overrideKey = process.env.NODE_ENV === "development"
    ? request.headers.get("X-Anthropic-Key")
    : null;
  ```
- Apply the same gate in every route that reads `X-Anthropic-Key` directly (if not already
  centralised in `getAnthropicClient`).
- In production, if `X-Anthropic-Key` is present but `NODE_ENV !== "development"`, silently ignore
  it (do not return an error — just use the server env key).

**Acceptance criteria:**
- [ ] With `NODE_ENV=production`, the `X-Anthropic-Key` header is ignored
- [ ] With `NODE_ENV=development`, the override still works (existing tests pass)
- [ ] `npm run build` passes

---

### H-3 · Validate agent tool inputs with Zod

**Priority:** Medium
**Files touched:**
- `src/lib/agent-tools.ts`

**Context:**
Tool input blocks from the Anthropic API are cast to `Record<string, unknown>` and then accessed
via `as string` type assertions (e.g. `(input as Record<string, unknown>).path as string`). If the
model produces malformed inputs, these casts will produce `undefined` values that bubble up as
runtime errors with unhelpful messages.

**Requirements:**
- For each tool handler in `agent-tools.ts`, define a Zod schema matching the tool's `input_schema`
  and parse the raw input block through it before use.
- On parse failure, return a structured error string as the tool result (e.g.
  `"Tool input validation failed: <ZodError.message>"`) rather than throwing.
- Remove all `as string` casts that are replaced by Zod-validated types.

**Acceptance criteria:**
- [ ] Passing a tool block with a missing required field (e.g. no `path` for `read_file`) returns a
  validation error string as the tool result instead of crashing
- [ ] `npm run type-check` exits 0 with no `as string` casts on tool inputs
- [ ] `npm run build` passes

---

### H-4 · Isolate virtual filesystem by run ID

**Priority:** High
**Files touched:**
- `src/lib/agent-tools.ts`
- `src/app/api/agent/run/route.ts`

**Context:**
`virtualFS` is a module-level `Map` shared across all concurrent requests to `/api/agent/run`.
If two agent runs execute simultaneously, their file writes will collide. This is the highest-risk
finding from the code review.

**Requirements:**
- Remove the module-level `virtualFS` Map and `resetVirtualFS()` export.
- Add a `createVirtualFS()` factory that returns a fresh `Map` and all tool handlers bound to it.
- Update `executeTool` (or equivalent) to accept the per-run FS instance as a parameter.
- In `/api/agent/run/route.ts`, call `createVirtualFS()` once at the top of the request handler
  and pass the instance through to all `executeTool` calls.

**Acceptance criteria:**
- [ ] Two simultaneous agent runs each see their own isolated filesystem (verifiable by writing
  `file-a` in run 1 and confirming run 2's `list_files` does not show it)
- [ ] `resetVirtualFS()` is no longer exported (removing it is a breaking change guard)
- [ ] `npm run build` passes

---

### H-5 · Add streaming request timeout / abort signal

**Priority:** Medium
**Files touched:**
- `src/app/api/chat/route.ts`
- `src/app/api/agent/run/route.ts`

**Context:**
`client.messages.stream()` is called with no timeout or abort signal. A stalled or very slow
Anthropic API response will hold the server connection open indefinitely, consuming a Node.js
worker and potentially causing the server to become unresponsive under load.

**Requirements:**
- Create an `AbortController` with a 60-second timeout (`setTimeout(() => controller.abort(), 60_000)`)
  at the top of each streaming request handler.
- Pass `signal: controller.signal` to the `client.messages.stream()` call.
- On abort, write a final NDJSON error event (for the agent route) or close the stream with an
  error message (for the chat route).
- Clear the timeout in the stream's `finally` / completion handler so it does not fire after a
  successful response.

**Acceptance criteria:**
- [ ] A mocked Anthropic call that never resolves causes the route to close the stream after ~60s
- [ ] Normal requests complete before the timeout and do not trigger the abort
- [ ] `npm run build` passes

---

### H-6 · Expand test coverage to all API routes

**Priority:** Medium
**Files touched:**
- `tests/api/code.test.ts` (new)
- `tests/api/workbench.test.ts` (new)
- `tests/api/agent-concurrency.test.ts` (new)

**Context:**
Only `/api/chat` and `/api/agent/run` have smoke tests (G-1). The code routes, workbench routes,
and the virtual-FS concurrency fix (H-4) have no test coverage.

**Requirements:**
- `tests/api/code.test.ts`: smoke tests for `/api/code/explain`, `/api/code/refactor`,
  `/api/code/complete` with mocked SDK. Assert 200 on valid input; 400 on empty `code` string
  (validates H-1).
- `tests/api/workbench.test.ts`: smoke tests for `/api/prompt-workbench/run` and
  `/api/prompt-workbench/compare`. Assert 200 with mocked SDK response.
- `tests/api/agent-concurrency.test.ts`: simulate two concurrent calls to `createVirtualFS()`
  (from H-4), write a file in each, and assert the file lists do not cross-contaminate.
- All tests must use `vi.mock("@anthropic-ai/sdk")` — no real network calls.

**Acceptance criteria:**
- [ ] `npm test` exits 0 with all new tests passing
- [ ] H-1 regression is caught by the empty-string test in `code.test.ts`
- [ ] H-4 isolation is verified by the concurrency test
- [ ] Total test suite runs in < 20 seconds
