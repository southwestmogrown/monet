"use client";

import { useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { useAgentStore } from "@/stores/agent-store";
import type { AgentStreamEvent, AgentToolName } from "@/types/agent";

export function useAgentRun() {
  const store = useAgentStore();
  const abortRef = useRef<AbortController | null>(null);

  const runAgent = useCallback(
    async (goal: string, context?: string) => {
      if (store.currentRun?.status === "running") return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const runId = store.startRun(goal);

      // Map from API step IDs (tool_use block IDs) to store step IDs
      const stepIdMap = new Map<string, string>();

      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, context }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          store.failRun(runId, `HTTP ${res.status}: ${text}`);
          return;
        }

        if (!res.body) {
          store.failRun(runId, "No response body");
          return;
        }

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
              const event: AgentStreamEvent = JSON.parse(line);
              handleEvent(event, runId, stepIdMap, store);
            } catch {
              // ignore malformed lines
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            const event: AgentStreamEvent = JSON.parse(buffer);
            handleEvent(event, runId, stepIdMap, store);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          store.failRun(runId, (err as Error).message);
        }
      }
    },
    [store]
  );

  const cancelAgent = useCallback(() => {
    abortRef.current?.abort();
    if (store.currentRun?.status === "running") {
      store.failRun(store.currentRun.id, "Cancelled by user.");
    }
  }, [store]);

  return {
    currentRun: store.currentRun,
    pastRuns: store.pastRuns,
    runAgent,
    cancelAgent,
    clearRun: store.clearCurrentRun,
  };
}

function handleEvent(
  event: AgentStreamEvent,
  runId: string,
  stepIdMap: Map<string, string>,
  store: ReturnType<typeof useAgentStore.getState>
) {
  if (event.type === "step" && event.stepId && event.tool) {
    const localId = store.addStep(
      runId,
      event.tool as AgentToolName,
      event.input ?? {}
    );
    stepIdMap.set(event.stepId, localId);
  } else if (event.type === "step_result" && event.stepId) {
    const localId = stepIdMap.get(event.stepId);
    if (localId) {
      store.updateStep(runId, localId, {
        result: event.result,
        status: "done",
      });
    }
  } else if (event.type === "final") {
    store.finishRun(runId, event.message ?? "Done.");
  } else if (event.type === "error") {
    store.failRun(runId, event.error ?? "Unknown error");
  }
}
