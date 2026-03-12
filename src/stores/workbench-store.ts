import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { PromptTemplate, WorkbenchRun, CompareResult, CompareVariant } from "@/types/workbench";
import type { ModelId } from "@/types/chat";

interface WorkbenchState {
  templates: PromptTemplate[];
  activeTemplateId: string | null;
  variables: Record<string, string>;
  activeModel: ModelId;
  lastRun: WorkbenchRun | null;
  compareResults: CompareResult[];
  isRunning: boolean;
  isComparing: boolean;

  // Actions
  createTemplate: () => string;
  updateTemplate: (id: string, update: Partial<Omit<PromptTemplate, "id" | "createdAt">>) => void;
  deleteTemplate: (id: string) => void;
  setActiveTemplate: (id: string | null) => void;
  setVariable: (key: string, value: string) => void;
  setVariables: (vars: Record<string, string>) => void;
  setActiveModel: (model: ModelId) => void;
  setLastRun: (run: WorkbenchRun | null) => void;
  setCompareResults: (results: CompareResult[]) => void;
  setIsRunning: (v: boolean) => void;
  setIsComparing: (v: boolean) => void;
  getActiveTemplate: () => PromptTemplate | null;
}

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      templates: [],
      activeTemplateId: null,
      variables: {},
      activeModel: "claude-sonnet-4-6",
      lastRun: null,
      compareResults: [],
      isRunning: false,
      isComparing: false,

      createTemplate: () => {
        const id = nanoid();
        const template: PromptTemplate = {
          id,
          name: "New template",
          systemPrompt: "You are a helpful assistant.",
          userMessage: "{{input}}",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          templates: [template, ...state.templates],
          activeTemplateId: id,
        }));
        return id;
      },

      updateTemplate: (id, update) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...update, updatedAt: Date.now() } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => {
          const remaining = state.templates.filter((t) => t.id !== id);
          return {
            templates: remaining,
            activeTemplateId:
              state.activeTemplateId === id
                ? (remaining[0]?.id ?? null)
                : state.activeTemplateId,
          };
        });
      },

      setActiveTemplate: (id) => {
        set({ activeTemplateId: id, variables: {}, lastRun: null, compareResults: [] });
      },

      setVariable: (key, value) => {
        set((state) => ({
          variables: { ...state.variables, [key]: value },
        }));
      },

      setVariables: (vars) => set({ variables: vars }),

      setActiveModel: (model) => set({ activeModel: model }),
      setLastRun: (run) => set({ lastRun: run }),
      setCompareResults: (results) => set({ compareResults: results }),
      setIsRunning: (v) => set({ isRunning: v }),
      setIsComparing: (v) => set({ isComparing: v }),

      getActiveTemplate: () => {
        const { templates, activeTemplateId } = get();
        return templates.find((t) => t.id === activeTemplateId) ?? null;
      },
    }),
    {
      name: "monet-workbench",
      skipHydration: true,
      partialize: (state) => ({
        templates: state.templates,
        activeTemplateId: state.activeTemplateId,
        activeModel: state.activeModel,
      }),
    }
  )
);

// Re-export CompareVariant for convenience
export type { CompareVariant };
