import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EditorLanguage, AIResult } from "@/types/editor";

interface EditorState {
  content: string;
  language: EditorLanguage;
  fileName: string;
  aiResult: AIResult | null;
  isLoadingAI: boolean;

  // Virtual FS
  virtualFiles: Record<string, string>;

  // Actions
  setContent: (content: string) => void;
  setLanguage: (language: EditorLanguage) => void;
  setFileName: (name: string) => void;
  setAIResult: (result: AIResult | null) => void;
  setIsLoadingAI: (loading: boolean) => void;
  writeVirtualFile: (path: string, content: string) => void;
  readVirtualFile: (path: string) => string | null;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      content: "// Start coding here\n",
      language: "typescript",
      fileName: "untitled.ts",
      aiResult: null,
      isLoadingAI: false,
      virtualFiles: {},

      setContent: (content) => set({ content }),
      setLanguage: (language) => set({ language }),
      setFileName: (name) => set({ fileName: name }),
      setAIResult: (result) => set({ aiResult: result }),
      setIsLoadingAI: (loading) => set({ isLoadingAI: loading }),
      writeVirtualFile: (path, content) =>
        set((state) => ({
          virtualFiles: { ...state.virtualFiles, [path]: content },
        })),
      readVirtualFile: (path) => get().virtualFiles[path] ?? null,
    }),
    {
      name: "monet-editor",
      skipHydration: true,
    }
  )
);
