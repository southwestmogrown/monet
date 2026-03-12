"use client";

import { Plus, Trash2, MessageSquare } from "lucide-react";
import type { Conversation } from "@/types/chat";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationSidebarProps) {
  return (
    <div
      style={{
        width: 220,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
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
          Conversations
        </span>
        <button
          onClick={onCreate}
          title="New conversation"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
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
        {conversations.length === 0 ? (
          <div
            style={{
              padding: "20px 16px",
              color: "var(--text-muted)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            No conversations yet.
            <br />
            Click + to start one.
          </div>
        ) : (
          conversations.map((conv) => (
            <ConvItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onSelect={() => onSelect(conv.id)}
              onDelete={() => onDelete(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ConvItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        cursor: "pointer",
        background: isActive ? "var(--bg-selected)" : "transparent",
        borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
        color: isActive ? "var(--text-active)" : "var(--text-secondary)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
        (e.currentTarget.querySelector(".del-btn") as HTMLElement | null)?.style &&
          ((e.currentTarget.querySelector(".del-btn") as HTMLElement).style.opacity = "1");
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget.querySelector(".del-btn") as HTMLElement | null)?.style &&
          ((e.currentTarget.querySelector(".del-btn") as HTMLElement).style.opacity = "0");
      }}
    >
      <MessageSquare size={13} style={{ flexShrink: 0 }} />
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: 12,
        }}
      >
        {conversation.title}
      </span>
      <button
        className="del-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          padding: 2,
          borderRadius: 3,
          opacity: 0,
          transition: "opacity 0.1s",
          flexShrink: 0,
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
