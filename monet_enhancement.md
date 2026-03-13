# Context
The Monet IDE is fully built with four working features. The question is: what additions would **best demonstrate Claude's unique strengths** over other LLMs, without bloating the core experience?
Three features stand out because they are impossible or inferior in competing models, require minimal new UI real-estate, and each showcases a distinct Claude capability:

1. Extended Thinking — Claude can show its reasoning before answering. No other frontier model exposes this the same way. Making it visible in the IDE turns the "black box" into a glass box.
2. Vision / Image Upload — Drag-and-drop images into Chat. Claude's multimodal understanding is strong; a screenshot of an error or a diagram says more than paragraphs.
3. Settings Panel — A proper /settings page behind the existing gear icon. Gives users control over agent tool permissions, default models, and an optional in-browser API key override. Satisfies the "easy permissions" ask.


## Feature 1: Extended Thinking Mode
###What it does
A toggle (lightbulb icon) in `ChatInput enables` Claude's `thinking` content blocks. When active, Claude emits a `<thinking>` scratchpad before its final answer. This is rendered as a collapsible "Reasoning" section in the message bubble — distinct visual style, muted color, chevron to expand/collapse.
## API change (`src/app/api/chat/route.ts`)

- Accept optional thinking: boolean in request body (Zod schema)
- When thinking === true, pass thinking: { type: "enabled", budget_tokens: 10000 } to anthropic.messages.stream()
- Requires model claude-sonnet-4-6 or Opus (Haiku doesn't support thinking) — auto-upgrade model if user tries Haiku + thinking
- Stream events: thinking content blocks arrive as content_block_start with type: "thinking" — parse and emit them separately in the stream so the client can distinguish thinking from text

## Store change (`src/stores/chat-store.ts`)

- Add thinkingEnabled: boolean field (default false)
- Add setThinkingEnabled(v: boolean) action
- Each Message gets an optional thinking?: string field to persist the thinking text

Component changes

src/components/chat/ChatInput.tsx: Add a lightbulb toggle button next to the model selector; reads/writes thinkingEnabled from store
src/components/chat/MessageBubble.tsx: When message.thinking is present, render a <ThinkingBlock> above the main content — a collapsible panel with Brain icon, muted background, monospace text, collapsed by default
src/lib/streaming.ts: Update createTextStream to emit thinking blocks as a separate SSE prefix (e.g. prefix line __THINKING__: before thinking text)
src/hooks/useChat.ts: Parse thinking prefix from stream, store in message's thinking field

Files to modify

src/app/api/chat/route.ts
src/stores/chat-store.ts
src/components/chat/ChatInput.tsx
src/components/chat/MessageBubble.tsx
src/hooks/useChat.ts
src/lib/streaming.ts


Feature 2: Vision — Image Upload in Chat
What it does
Users can attach images to a chat message by clicking a paperclip icon or pasting from clipboard. The image appears as a thumbnail in the input area; on send, it's included as an image content block alongside the user's text. Claude's response references what it sees.
API change (src/app/api/chat/route.ts)

Update Zod schema: messages array items can now include an optional image?: { data: string; mediaType: string } field
When present, rewrite the user's message content from a plain string to an array: [{ type: "image", source: { type: "base64", ... } }, { type: "text", text: userText }]

Store change (src/stores/chat-store.ts)

Message gets an optional imageUrl?: string field (data URL, stored for display in conversation history)

Component changes

src/components/chat/ChatInput.tsx:

Add imageAttachment: { dataUrl: string; mediaType: string } | null local state
Paperclip button opens <input type="file" accept="image/*">
onPaste handler checks for image items in ClipboardEvent.clipboardData.items
Thumbnail preview with ✕ dismiss button above the textarea
On send: include image data in the fetch body


src/components/chat/MessageBubble.tsx:

When message.imageUrl is present (user bubble), render <img> thumbnail above the text



Files to modify

src/app/api/chat/route.ts
src/stores/chat-store.ts
src/types/chat.ts
src/components/chat/ChatInput.tsx
src/components/chat/MessageBubble.tsx


Feature 3: Settings Panel (Permissions + Defaults)
What it does
The gear icon already exists in ActivityBar.tsx but links nowhere. This adds a proper /settings page with three sections:

API Key — Optional in-browser override. Stored in a new settings-store (localStorage). API routes check for a custom key passed via an X-Anthropic-Key header and use it instead of process.env.ANTHROPIC_API_KEY when present. Makes the app distributable without server env config.
Default Models — Per-feature model selectors (Chat, Agent, Workbench). Stored in settings store; each feature reads its default on mount if no conversation-specific model is set.
Agent Tool Permissions — Checkboxes for each of the 5 tools (web_search, read_file, write_file, create_artifact, analyze_code). Settings stored as enabledTools: string[]. The AgentTaskInput reads these as defaults (user can still override per-run).

New store (src/stores/settings-store.ts)
typescriptinterface SettingsState {
  anthropicKeyOverride: string;          // empty = use server env
  defaultModels: { chat: ModelId; agent: ModelId; workbench: ModelId };
  agentToolDefaults: AgentToolName[];    // enabled by default
  setAnthropicKeyOverride(key: string): void;
  setDefaultModel(feature: string, model: ModelId): void;
  setAgentToolDefaults(tools: AgentToolName[]): void;
}
Persisted to localStorage with key "monet-settings".
New route (src/app/(ide)/settings/page.tsx)
Simple page that renders <SettingsPanel />.
New component (src/components/settings/SettingsPanel.tsx)
Three sections rendered as labeled card blocks:

API Key: password input + "Save" button + green "✓ Active" / grey "Using server key" badge
Default Models: three <ModelSelector> dropdowns
Agent Tools: checkbox list with descriptions for each tool

Existing file changes

src/components/shell/ActivityBar.tsx: Update gear icon href from # to /settings; add /settings to the active-route detection
src/app/api/chat/route.ts and src/app/api/agent/run/route.ts: Check request.headers.get('X-Anthropic-Key'), use it to construct a per-request Anthropic client if present
src/components/agent/AgentTaskInput.tsx: Read agentToolDefaults from settings store as initial checkbox state

Files to create

src/stores/settings-store.ts
src/app/(ide)/settings/page.tsx
src/components/settings/SettingsPanel.tsx

Files to modify

src/components/shell/ActivityBar.tsx
src/app/api/chat/route.ts
src/app/api/agent/run/route.ts
src/components/agent/AgentTaskInput.tsx


Implementation Order

Settings Panel first — it's self-contained, adds no risk to existing features, and gives us the store pattern for defaults that the other features read
Extended Thinking second — modifies the chat flow but is gated behind a toggle, zero impact when off
Vision/Image Upload third — touches the most UI state but is similarly gated (no image = identical behavior to today)


Verification

Settings: Navigate to /settings, enter an API key, check DevTools → Network headers on the next /api/chat call for X-Anthropic-Key. Change a default model, open Chat, confirm the model selector shows the new default.
Extended Thinking: Toggle the lightbulb on, send a complex reasoning question ("what is 17 × 23 step by step"), verify a collapsible "Reasoning" block appears above the answer. Toggle off and confirm it disappears.
Vision: Paste a screenshot into the chat input, confirm thumbnail appears, send, verify Claude's reply references the image content.
Regression: All four existing features (Chat without thinking, Editor AI, Agent, Workbench) behave identically when the new toggles are off.
