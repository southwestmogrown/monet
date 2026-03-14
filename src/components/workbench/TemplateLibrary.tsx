"use client";

import { Plus, Trash2, FlaskConical } from "lucide-react";
import type { PromptTemplate } from "@/types/workbench";

interface TemplateLibraryProps {
  templates: PromptTemplate[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function TemplateLibrary({
  templates,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: TemplateLibraryProps) {
  return (
    <div
      style={{
        width: 210,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Templates
        </span>
        <button
          onClick={onCreate}
          title="New template"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            padding: "3px 3px",
            borderRadius: 5,
            transition: "color 0.1s, background 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
            (e.currentTarget as HTMLElement).style.background = "var(--accent-glow)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {templates.length === 0 ? (
          <div
            style={{
              padding: "24px 14px",
              color: "var(--text-muted)",
              fontSize: 12,
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            No templates yet.
            <br />
            <span
              style={{ color: "var(--accent)", cursor: "pointer" }}
              onClick={onCreate}
            >
              Create one →
            </span>
          </div>
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                cursor: "pointer",
                background: t.id === activeId ? "var(--accent-glow)" : "transparent",
                borderLeft: t.id === activeId ? "2px solid var(--accent)" : "2px solid transparent",
                color: t.id === activeId ? "var(--text-active)" : "var(--text-secondary)",
                position: "relative",
                transition: "background 0.1s",
                fontWeight: t.id === activeId ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (t.id !== activeId)
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                const del = e.currentTarget.querySelector(".del-btn") as HTMLElement | null;
                if (del) del.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                if (t.id !== activeId)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                const del = e.currentTarget.querySelector(".del-btn") as HTMLElement | null;
                if (del) del.style.opacity = "0";
              }}
            >
              <FlaskConical size={12} style={{ flexShrink: 0, opacity: t.id === activeId ? 1 : 0.6 }} />
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 12,
                }}
              >
                {t.name}
              </span>
              <button
                className="del-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(t.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  padding: "2px 2px",
                  borderRadius: 4,
                  opacity: 0,
                  transition: "opacity 0.1s, color 0.1s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--color-error, #F87171)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
