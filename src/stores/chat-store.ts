import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Conversation, Message, ModelId } from "@/types/chat";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeModel: ModelId;

  // Actions
  createConversation: () => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, "id" | "createdAt">) => void;
  updateLastAssistantMessage: (conversationId: string, content: string) => void;
  setActiveModel: (model: ModelId) => void;
  getActiveConversation: () => Conversation | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      activeModel: "claude-sonnet-4-6",

      createConversation: () => {
        const id = nanoid();
        const conversation: Conversation = {
          id,
          title: "New conversation",
          messages: [],
          model: get().activeModel,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      deleteConversation: (id) => {
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id);
          const newActive =
            state.activeConversationId === id
              ? (remaining[0]?.id ?? null)
              : state.activeConversationId;
          return { conversations: remaining, activeConversationId: newActive };
        });
      },

      addMessage: (conversationId, message) => {
        const newMessage: Message = {
          ...message,
          id: nanoid(),
          createdAt: Date.now(),
        };
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const updated = { ...c, messages: [...c.messages, newMessage], updatedAt: Date.now() };
            // Auto-title from first user message
            if (updated.title === "New conversation" && newMessage.role === "user") {
              updated.title = newMessage.content.slice(0, 50) + (newMessage.content.length > 50 ? "…" : "");
            }
            return updated;
          }),
        }));
      },

      updateLastAssistantMessage: (conversationId, content) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const messages = [...c.messages];
            const lastIdx = messages.length - 1;
            if (lastIdx >= 0 && messages[lastIdx].role === "assistant") {
              messages[lastIdx] = { ...messages[lastIdx], content };
            }
            return { ...c, messages, updatedAt: Date.now() };
          }),
        }));
      },

      setActiveModel: (model) => {
        set({ activeModel: model });
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) ?? null;
      },
    }),
    {
      name: "monet-chat",
      skipHydration: true,
    }
  )
);
