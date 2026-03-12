"use client";

import { useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { useWorkbenchStore } from "@/stores/workbench-store";
import type { CompareVariant } from "@/types/workbench";

export function useWorkbench() {
  const store = useWorkbenchStore();

  // Rehydrate on mount
  useEffect(() => {
    useWorkbenchStore.persist.rehydrate();
  }, []);

  const runTemplate = useCallback(async () => {
    const template = store.getActiveTemplate();
    if (!template) return;

    store.setIsRunning(true);
    store.setLastRun(null);

    try {
      const res = await fetch("/api/prompt-workbench/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: template.systemPrompt,
          userMessage: template.userMessage,
          model: store.activeModel,
          variables: store.variables,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      store.setLastRun({
        id: nanoid(),
        templateId: template.id,
        variables: store.variables,
        model: store.activeModel,
        output: data.output,
        usage: data.usage,
        createdAt: Date.now(),
      });
    } catch (err) {
      store.setLastRun({
        id: nanoid(),
        templateId: template.id,
        variables: store.variables,
        model: store.activeModel,
        output: `Error: ${(err as Error).message}`,
        usage: { inputTokens: 0, outputTokens: 0 },
        createdAt: Date.now(),
      });
    } finally {
      store.setIsRunning(false);
    }
  }, [store]);

  const compareVariants = useCallback(
    async (variants: CompareVariant[]) => {
      if (variants.length < 2) return;

      store.setIsComparing(true);
      store.setCompareResults([]);

      try {
        const res = await fetch("/api/prompt-workbench/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variants,
            variables: store.variables,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        store.setCompareResults(data.results);
      } catch (err) {
        store.setCompareResults([
          {
            variantIndex: 0,
            output: "",
            usage: { inputTokens: 0, outputTokens: 0 },
            error: (err as Error).message,
          },
        ]);
      } finally {
        store.setIsComparing(false);
      }
    },
    [store]
  );

  return { ...store, runTemplate, compareVariants };
}
