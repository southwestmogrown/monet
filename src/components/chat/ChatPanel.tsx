"use client";

import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ConversationSidebar } from "./ConversationSidebar";

export function ChatPanel() {
  const {
    conversations,
    activeConversationId,
    activeModel,
    isStreaming,
    createConversation,
    setActiveConversation,
    deleteConversation,
    setActiveModel,
    sendMessage,
    cancelStream,
    getActiveConversation,
    imageError,
  } = useChat();

  const activeConversation = getActiveConversation();

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversation}
        onCreate={createConversation}
        onDelete={deleteConversation}
      />

      {/* Main chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--bg-editor)",
        }}
      >
        <MessageList
          messages={activeConversation?.messages ?? []}
          isStreaming={isStreaming}
        />
        <ChatInput
          onSend={sendMessage}
          onCancel={cancelStream}
          isStreaming={isStreaming}
          model={activeModel}
          onModelChange={setActiveModel}
          sendError={imageError}
        />
      </div>
    </div>
  );
}
