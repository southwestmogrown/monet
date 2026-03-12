"use client";

import { useEffect, useCallback } from "react";
import { useEditorStore } from "@/stores/editor-store";
import type { AIAction } from "@/types/editor";

export function useMonaco() {
  const store = useEditorStore();

  // Rehydrate on mount
  useEffect(() => {
    useEditorStore.persist.rehydrate();
  }, []);

  const runAIAction = useCallback(
    async (action: AIAction, selectedCode?: string) => {
      const code = selectedCode ?? store.content;
      if (!code.trim()) return;

      store.setIsLoadingAI(true);
      store.setAIResult(null);

      try {
        const endpoint =
          action === "explain"
            ? "/api/code/explain"
            : action === "refactor"
              ? "/api/code/refactor"
              : "/api/code/complete";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language: store.language }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        store.setAIResult({ action, input: code, output: data.result });
      } catch (err) {
        store.setAIResult({
          action,
          input: code,
          output: `Error: ${(err as Error).message}`,
        });
      } finally {
        store.setIsLoadingAI(false);
      }
    },
    [store]
  );

  const applyResult = useCallback(() => {
    if (!store.aiResult) return;
    if (store.aiResult.action === "refactor" || store.aiResult.action === "complete") {
      store.setContent(store.aiResult.output);
    }
    store.setAIResult(null);
  }, [store]);

  return {
    ...store,
    runAIAction,
    applyResult,
  };
}
