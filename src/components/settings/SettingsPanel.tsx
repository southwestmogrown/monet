"use client";

import { useEffect, useState } from "react";
import { Check, Key, Cpu, Wrench } from "lucide-react";
import { useSettingsStore, ALL_AGENT_TOOLS, AGENT_TOOL_DESCRIPTIONS } from "@/stores/settings-store";
import { MODELS, type ModelId } from "@/types/chat";
import type { AgentToolName } from "@/types/agent";

export function SettingsPanel() {
  const store = useSettingsStore();
  const [keySaved, setKeySaved] = useState(false);
  // undefined = user hasn't typed yet; falls back to store value after rehydration
  const [keyDraft, setKeyDraft] = useState<string | undefined>(undefined);
  const displayKey = keyDraft ?? store.anthropicKeyOverride ?? "";

  useEffect(() => {
    useSettingsStore.persist.rehydrate();
  }, []);

  const saveKey = () => {
    store.setAnthropicKeyOverride(displayKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const clearKey = () => {
    store.setAnthropicKeyOverride("");
    setKeyDraft("");
  };

  const maskedKey = store.anthropicKeyOverride
    ? "••••••••••••" + store.anthropicKeyOverride.slice(-4)
    : null;

  const toggleTool = (tool: AgentToolName) => {
    const current = store.agentToolDefaults;
    if (current.includes(tool)) {
      store.setAgentToolDefaults(current.filter((t) => t !== tool));
    } else {
      store.setAgentToolDefaults([...current, tool]);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 40px",
        maxWidth: 640,
        color: "var(--text-primary)",
        fontSize: 13,
      }}
    >
      <h1
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 32,
          color: "var(--text-primary)",
        }}
      >
        Settings
      </h1>

      {!store.anthropicKeyOverride && (
        <div
          style={{
            background: "rgba(255,200,0,0.1)",
            border: "1px solid rgba(255,200,0,0.3)",
            borderRadius: 6,
            padding: "10px 14px",
            fontSize: 12,
            color: "var(--text-secondary)",
            marginBottom: 24,
          }}
        >
          No in-browser API key set. The app will use the server&apos;s ANTHROPIC_API_KEY environment
          variable. Set a key here if you&apos;re running without a server .env file.
        </div>
      )}

      {/* API Key */}
      <section style={{ marginBottom: 36 }}>
        <SectionHeader icon={<Key size={14} />} title="API Key" />
        <p style={{ color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
          Optional in-browser override. When set, this key is sent directly to the API routes
          instead of the server&apos;s environment variable.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="password"
            value={displayKey}
            onChange={(e) => setKeyDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveKey()}
            placeholder="sk-ant-…"
            style={{
              flex: 1,
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: 13,
              padding: "7px 12px",
              outline: "none",
              fontFamily: "monospace",
            }}
          />
          <button
            onClick={saveKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              background: keySaved ? "#27ae60" : "var(--accent)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
              transition: "background 0.2s",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            {keySaved ? <Check size={12} /> : null}
            {keySaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={clearKey}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "7px 14px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            Clear key
          </button>
        </div>
        {maskedKey && (
          <div style={{ marginTop: 8, fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>
            Active key: {maskedKey}
          </div>
        )}
        <div style={{ marginTop: maskedKey ? 4 : 8, fontSize: 11, color: "var(--text-muted)" }}>
          {store.anthropicKeyOverride
            ? "✓ Custom key active — using your in-browser key"
            : "Using server environment variable (ANTHROPIC_API_KEY)"}
        </div>
      </section>

      {/* Default Models */}
      <section style={{ marginBottom: 36 }}>
        <SectionHeader icon={<Cpu size={14} />} title="Default Models" />
        <p style={{ color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
          Default model selected when opening each feature. Can still be changed per-session.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(["chat", "agent", "workbench"] as const).map((feature) => (
            <div
              key={feature}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>
                {feature}
              </span>
              <select
                value={store.defaultModels[feature]}
                onChange={(e) => store.setDefaultModel(feature, e.target.value as ModelId)}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  color: "var(--text-primary)",
                  fontSize: 12,
                  padding: "4px 8px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id} style={{ background: "#333" }}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Agent Tool Permissions */}
      <section style={{ marginBottom: 36 }}>
        <SectionHeader icon={<Wrench size={14} />} title="Agent Tool Permissions" />
        <p style={{ color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
          Choose which tools are enabled by default when running the agent. Can be overridden per-run.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ALL_AGENT_TOOLS.map((tool) => {
            const enabled = store.agentToolDefaults.includes(tool);
            return (
              <label
                key={tool}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  cursor: "pointer",
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: enabled ? "var(--bg-active)" : "transparent",
                  border: `1px solid ${enabled ? "var(--accent)" : "var(--border)"}`,
                  transition: "all 0.1s",
                }}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleTool(tool)}
                  style={{ marginTop: 1, accentColor: "var(--accent)", flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-primary)" }}>
                    {tool}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {AGENT_TOOL_DESCRIPTIONS[tool]}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        paddingBottom: 8,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{title}</span>
    </div>
  );
}
