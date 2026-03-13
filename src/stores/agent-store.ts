import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { AgentRun, AgentStep, AgentToolName } from "@/types/agent";
import type { ModelId } from "@/types/chat";

const MAX_PAST_RUNS = 10;

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

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
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
        const { currentRun, pastRuns } = get();
        // Archive previous run if not already in pastRuns, then add new run
        const prevAlreadyArchived = currentRun
          ? pastRuns.some((r) => r.id === currentRun.id)
          : true;
        const updatedPastRuns = prevAlreadyArchived
          ? [run, ...pastRuns].slice(0, MAX_PAST_RUNS)
          : [run, currentRun!, ...pastRuns].slice(0, MAX_PAST_RUNS);
        set({ currentRun: run, pastRuns: updatedPastRuns });
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
          const updatedRun = {
            ...state.currentRun,
            steps: [...state.currentRun.steps, step],
          };
          return {
            currentRun: updatedRun,
            pastRuns: state.pastRuns.map((r) =>
              r.id === runId ? updatedRun : r
            ),
          };
        });
        return stepId;
      },

      updateStep: (runId, stepId, update) => {
        set((state) => {
          if (!state.currentRun || state.currentRun.id !== runId) return state;
          const updatedRun = {
            ...state.currentRun,
            steps: state.currentRun.steps.map((s) =>
              s.id === stepId ? { ...s, ...update } : s
            ),
          };
          return {
            currentRun: updatedRun,
            pastRuns: state.pastRuns.map((r) =>
              r.id === runId ? updatedRun : r
            ),
          };
        });
      },

      finishRun: (runId, finalMessage) => {
        set((state) => {
          if (!state.currentRun || state.currentRun.id !== runId) return state;
          const finishedRun: AgentRun = {
            ...state.currentRun,
            finalMessage,
            status: "done",
          };
          return {
            currentRun: finishedRun,
            pastRuns: state.pastRuns
              .map((r) => (r.id === runId ? finishedRun : r))
              .slice(0, MAX_PAST_RUNS),
          };
        });
      },

      failRun: (runId, error) => {
        set((state) => {
          if (!state.currentRun || state.currentRun.id !== runId) return state;
          const failedRun: AgentRun = {
            ...state.currentRun,
            finalMessage: error,
            status: "error",
          };
          return {
            currentRun: failedRun,
            pastRuns: state.pastRuns
              .map((r) => (r.id === runId ? failedRun : r))
              .slice(0, MAX_PAST_RUNS),
          };
        });
      },

      clearCurrentRun: () => {
        // Run is already in pastRuns (added on startRun); just clear the active view
        set({ currentRun: null });
      },

      setActiveModel: (model) => set({ activeModel: model }),
    }),
    {
      name: "monet-agent",
      skipHydration: true,
      partialize: (state) => ({
        pastRuns: state.pastRuns,
      }),
    }
  )
);
