"use client";

import { useEffect, useCallback, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useStreamingResponse } from "./useStreamingResponse";

export function useChat() {
  const store = useChatStore();
  const activeConversationIdRef = useRef<string | null>(null);

  // Rehydrate store on mount (prevents SSR mismatch)
  useEffect(() => {
    useChatStore.persist.rehydrate();
  }, []);

  const { stream, isStreaming, cancel } = useStreamingResponse({
    onChunk: (_chunk, accumulated) => {
      const convId = activeConversationIdRef.current;
      if (convId) {
        useChatStore.getState().updateLastAssistantMessage(convId, accumulated);
      }
    },
  });

  const ensureConversation = useCallback(() => {
    const { activeConversationId, createConversation } = useChatStore.getState();
    if (!activeConversationId) {
      return createConversation();
    }
    return activeConversationId;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const conversationId = ensureConversation();
      activeConversationIdRef.current = conversationId;

      const { addMessage, activeModel } = useChatStore.getState();

      // Add user message
      addMessage(conversationId, { role: "user", content });

      // Add empty assistant placeholder
      addMessage(conversationId, { role: "assistant", content: "" });

      // Get updated conversation for message history
      const conversation = useChatStore
        .getState()
        .conversations.find((c) => c.id === conversationId);

      if (!conversation) return;

      // Build messages for API (all except the empty placeholder at the end)
      const messages = conversation.messages
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      await stream("/api/chat", {
        messages,
        model: activeModel,
      });
    },
    [isStreaming, ensureConversation, stream]
  );

  return {
    ...store,
    isStreaming,
    sendMessage,
    cancelStream: cancel,
  };
}
