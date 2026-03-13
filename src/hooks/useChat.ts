"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useStreamingResponse } from "./useStreamingResponse";

export interface ImageAttachment {
  dataUrl: string;
  mediaType: string;
}

export function useChat() {
  const store = useChatStore();
  const activeConversationIdRef = useRef<string | null>(null);
  const [isThinkingStreaming, setIsThinkingStreaming] = useState(false);
  const thinkingAbortRef = useRef<AbortController | null>(null);

  // Rehydrate stores on mount (prevents SSR mismatch)
  useEffect(() => {
    useChatStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();
    // Seed activeModel from settings default if still at the hardcoded fallback
    const { activeModel, setActiveModel } = useChatStore.getState();
    const { defaultModels } = useSettingsStore.getState();
    if (activeModel === "claude-sonnet-4-6") {
      setActiveModel(defaultModels.chat);
    }
  }, []);

  const { stream, isStreaming, cancel: cancelBaseStream } = useStreamingResponse({
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
    async (content: string, imageAttachment?: ImageAttachment) => {
      if (!content.trim() || isStreaming || isThinkingStreaming) return;

      const conversationId = ensureConversation();
      activeConversationIdRef.current = conversationId;

      const { addMessage, activeModel, thinkingEnabled } = useChatStore.getState();
      const { anthropicKeyOverride } = useSettingsStore.getState();

      // Add user message
      addMessage(conversationId, {
        role: "user",
        content,
        imageUrl: imageAttachment?.dataUrl,
      });

      // Add empty assistant placeholder
      addMessage(conversationId, { role: "assistant", content: "" });

      // Get updated conversation for message history
      const conversation = useChatStore
        .getState()
        .conversations.find((c) => c.id === conversationId);

      if (!conversation) return;

      // Build messages for API — only the last user message gets the image
      const messages = conversation.messages.slice(0, -1).map((m, i, arr) => {
        const isLast = i === arr.length - 1;
        if (isLast && m.role === "user" && imageAttachment) {
          return { role: m.role, content: m.content, imageDataUrl: imageAttachment.dataUrl };
        }
        return { role: m.role, content: m.content };
      });

      const extraHeaders: Record<string, string> = {};
      if (anthropicKeyOverride) {
        extraHeaders["X-Anthropic-Key"] = anthropicKeyOverride;
      }

      if (thinkingEnabled) {
        await streamWithThinking({
          conversationId,
          messages,
          model: activeModel,
          extraHeaders,
          setIsStreaming: setIsThinkingStreaming,
          abortRef: thinkingAbortRef,
        });
      } else {
        await stream("/api/chat", { messages, model: activeModel }, extraHeaders);
      }
    },
    [isStreaming, isThinkingStreaming, ensureConversation, stream]
  );

  const cancel = useCallback(() => {
    cancelBaseStream();
    thinkingAbortRef.current?.abort();
    setIsThinkingStreaming(false);
  }, [cancelBaseStream]);

  return {
    ...store,
    isStreaming: isStreaming || isThinkingStreaming,
    sendMessage,
    cancelStream: cancel,
  };
}

async function streamWithThinking(opts: {
  conversationId: string;
  messages: { role: string; content: string; imageDataUrl?: string }[];
  model: string;
  extraHeaders: Record<string, string>;
  setIsStreaming: (v: boolean) => void;
  abortRef: MutableRefObject<AbortController | null>;
}) {
  const { conversationId, messages, model, extraHeaders, setIsStreaming, abortRef } = opts;

  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;
  setIsStreaming(true);

  let thinkingAccumulated = "";
  let textAccumulated = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ messages, model, thinking: true }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line) as { t: string; d: string };
          if (event.t === "k") thinkingAccumulated += event.d;
          else if (event.t === "x") textAccumulated += event.d;
          useChatStore
            .getState()
            .updateLastAssistantMessage(conversationId, textAccumulated, thinkingAccumulated);
        } catch {
          // ignore malformed lines
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer) as { t: string; d: string };
        if (event.t === "k") thinkingAccumulated += event.d;
        else if (event.t === "x") textAccumulated += event.d;
        useChatStore
          .getState()
          .updateLastAssistantMessage(conversationId, textAccumulated, thinkingAccumulated);
      } catch {
        // ignore
      }
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
  } finally {
    setIsStreaming(false);
  }
}
