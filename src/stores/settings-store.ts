import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelId } from "@/types/chat";
import type { AgentToolName } from "@/types/agent";

export const ALL_AGENT_TOOLS: AgentToolName[] = [
  "web_search",
  "read_file",
  "write_file",
  "create_artifact",
  "analyze_code",
];

export const AGENT_TOOL_DESCRIPTIONS: Record<AgentToolName, string> = {
  web_search: "Search the web for up-to-date information",
  read_file: "Read files from the virtual filesystem",
  write_file: "Write files to the virtual filesystem",
  create_artifact: "Save structured artifacts (code, data, docs)",
  analyze_code: "Analyze code structure and provide insights",
};

interface SettingsState {
  anthropicKeyOverride: string;
  defaultModels: { chat: ModelId; agent: ModelId; workbench: ModelId };
  agentToolDefaults: AgentToolName[];
  thinkingBudget: number;

  setAnthropicKeyOverride: (key: string) => void;
  setDefaultModel: (feature: "chat" | "agent" | "workbench", model: ModelId) => void;
  setAgentToolDefaults: (tools: AgentToolName[]) => void;
  setThinkingBudget: (budget: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      anthropicKeyOverride: "",
      defaultModels: {
        chat: "claude-sonnet-4-6",
        agent: "claude-sonnet-4-6",
        workbench: "claude-sonnet-4-6",
      },
      agentToolDefaults: [...ALL_AGENT_TOOLS],
      thinkingBudget: 8000,

      setAnthropicKeyOverride: (key) => set({ anthropicKeyOverride: key }),

      setDefaultModel: (feature, model) =>
        set((state) => ({
          defaultModels: { ...state.defaultModels, [feature]: model },
        })),

      setAgentToolDefaults: (tools) => set({ agentToolDefaults: tools }),

      setThinkingBudget: (budget) => set({ thinkingBudget: budget }),
    }),
    { name: "monet-settings", skipHydration: true }
  )
);
