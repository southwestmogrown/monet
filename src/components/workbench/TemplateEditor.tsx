"use client";

interface TemplateEditorProps {
  name: string;
  systemPrompt: string;
  userMessage: string;
  onNameChange: (name: string) => void;
  onSystemChange: (system: string) => void;
  onUserChange: (user: string) => void;
}

export function TemplateEditor({
  name,
  systemPrompt,
  userMessage,
  onNameChange,
  onSystemChange,
  onUserChange,
}: TemplateEditorProps) {
  const textareaStyle = {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: 5,
    color: "var(--text-primary)",
    fontSize: 12,
    padding: "8px 10px",
    resize: "vertical" as const,
    outline: "none",
    fontFamily: "var(--font-mono), 'Cascadia Code', Consolas, monospace",
    lineHeight: 1.5,
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600 as const,
    color: "var(--text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 5,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Template name */}
      <div>
        <label style={labelStyle}>Template Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          style={{
            ...textareaStyle,
            resize: undefined,
            fontFamily: "inherit",
          }}
          placeholder="My template"
        />
      </div>

      {/* System prompt */}
      <div>
        <label style={labelStyle}>System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => onSystemChange(e.target.value)}
          rows={4}
          placeholder="You are a helpful assistant. Use {{variable}} for dynamic values."
          style={textareaStyle}
        />
      </div>

      {/* User message */}
      <div>
        <label style={labelStyle}>User Message</label>
        <textarea
          value={userMessage}
          onChange={(e) => onUserChange(e.target.value)}
          rows={5}
          placeholder="{{input}}"
          style={textareaStyle}
        />
        <div
          style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}
        >
          Use {`{{variable_name}}`} for template variables.
        </div>
      </div>
    </div>
  );
}
