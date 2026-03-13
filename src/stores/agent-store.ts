import { create } from "zustand";
import { nanoid } from "nanoid";
import type { AgentRun, AgentStep, AgentToolName } from "@/types/agent";
import type { ModelId } from "@/types/chat";

interface AgentState {
  currentRun: AgentRun | null;
  pastRuns: AgentRun[];
  activeModel: ModelId;

  // Actions
  startRun: (goal: string) => string;
  addStep: (runId: string, tool: AgentToolName, input: Record<string, unknown>) => string;
  updateStep: (runId: string, stepId: string, update: Partial<AgentStep>) => void;
  finishRun: (runId: string, finalMessage: string) => void;
  failRun: (runId: string, error: string) => void;
  clearCurrentRun: () => void;
  setActiveModel: (model: ModelId) => void;
}

export const useAgentStore = create<AgentState>()((set, get) => ({
  currentRun: null,
  pastRuns: [],
  activeModel: "claude-sonnet-4-6",

  startRun: (goal) => {
    const id = nanoid();
    const run: AgentRun = {
      id,
      goal,
      steps: [],
      status: "running",
      createdAt: Date.now(),
    };
    // Archive previous run if exists
    const { currentRun } = get();
    set({
      currentRun: run,
      pastRuns: currentRun
        ? [currentRun, ...get().pastRuns].slice(0, 20)
        : get().pastRuns,
    });
    return id;
  },

  addStep: (runId, tool, input) => {
    const stepId = nanoid();
    const step: AgentStep = {
      id: stepId,
      tool,
      input,
      status: "running",
      createdAt: Date.now(),
    };
    set((state) => {
      if (!state.currentRun || state.currentRun.id !== runId) return state;
      return {
        currentRun: {
          ...state.currentRun,
          steps: [...state.currentRun.steps, step],
        },
      };
    });
    return stepId;
  },

  updateStep: (runId, stepId, update) => {
    set((state) => {
      if (!state.currentRun || state.currentRun.id !== runId) return state;
      return {
        currentRun: {
          ...state.currentRun,
          steps: state.currentRun.steps.map((s) =>
            s.id === stepId ? { ...s, ...update } : s
          ),
        },
      };
    });
  },

  finishRun: (runId, finalMessage) => {
    set((state) => {
      if (!state.currentRun || state.currentRun.id !== runId) return state;
      return {
        currentRun: {
          ...state.currentRun,
          finalMessage,
          status: "done",
        },
      };
    });
  },

  failRun: (runId, error) => {
    set((state) => {
      if (!state.currentRun || state.currentRun.id !== runId) return state;
      return {
        currentRun: {
          ...state.currentRun,
          finalMessage: error,
          status: "error",
        },
      };
    });
  },

  clearCurrentRun: () => {
    const { currentRun } = get();
    set({
      currentRun: null,
      pastRuns: currentRun
        ? [currentRun, ...get().pastRuns].slice(0, 20)
        : get().pastRuns,
    });
  },

  setActiveModel: (model) => set({ activeModel: model }),
}));
