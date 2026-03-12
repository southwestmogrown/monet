"use client";

import { extractVariables } from "@/lib/prompt-templates";

interface VariableInputsProps {
  systemPrompt: string;
  userMessage: string;
  variables: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function VariableInputs({
  systemPrompt,
  userMessage,
  variables,
  onChange,
}: VariableInputsProps) {
  const vars = [
    ...extractVariables(systemPrompt),
    ...extractVariables(userMessage),
  ].filter((v, i, arr) => arr.indexOf(v) === i); // unique

  if (vars.length === 0) {
    return (
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          padding: "4px 0",
          fontStyle: "italic",
        }}
      >
        No variables detected. Use {`{{variable_name}}`} syntax in your templates.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {vars.map((varName) => (
        <div key={varName}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              color: "var(--text-secondary)",
              marginBottom: 3,
              fontFamily: "monospace",
            }}
          >
            {`{{${varName}}}`}
          </label>
          <input
            type="text"
            value={variables[varName] ?? ""}
            onChange={(e) => onChange(varName, e.target.value)}
            placeholder={`Value for ${varName}`}
            style={{
              width: "100%",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              color: "var(--text-primary)",
              fontSize: 12,
              padding: "5px 8px",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
      ))}
    </div>
  );
}
