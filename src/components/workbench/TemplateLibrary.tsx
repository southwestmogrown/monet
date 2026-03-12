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
        width: 200,
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
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
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
            color: "var(--text-secondary)",
            display: "flex",
            padding: 2,
            borderRadius: 3,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")
          }
        >
          <Plus size={16} />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {templates.length === 0 ? (
          <div
            style={{
              padding: "20px 12px",
              color: "var(--text-muted)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            No templates yet.
            <br />
            Click + to create one.
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
                padding: "7px 12px",
                cursor: "pointer",
                background:
                  t.id === activeId ? "var(--bg-selected)" : "transparent",
                borderLeft:
                  t.id === activeId
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                color:
                  t.id === activeId
                    ? "var(--text-active)"
                    : "var(--text-secondary)",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (t.id !== activeId)
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--bg-hover)";
                const del = e.currentTarget.querySelector(
                  ".del-btn"
                ) as HTMLElement | null;
                if (del) del.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                if (t.id !== activeId)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                const del = e.currentTarget.querySelector(
                  ".del-btn"
                ) as HTMLElement | null;
                if (del) del.style.opacity = "0";
              }}
            >
              <FlaskConical size={12} style={{ flexShrink: 0 }} />
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
                  padding: 2,
                  borderRadius: 3,
                  opacity: 0,
                  transition: "opacity 0.1s",
                  flexShrink: 0,
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
