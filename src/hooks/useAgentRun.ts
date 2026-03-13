"use client";

import { useCallback, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { useAgentStore } from "@/stores/agent-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { AgentStreamEvent, AgentToolName } from "@/types/agent";

export function useAgentRun() {
  const store = useAgentStore();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    useAgentStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();

    // Fix any runs that were interrupted by a page reload (still marked as "running")
    const { pastRuns } = useAgentStore.getState();
    const hasInterrupted = pastRuns.some((r) => r.status === "running");
    if (hasInterrupted) {
      useAgentStore.setState({
        pastRuns: pastRuns.map((r) =>
          r.status === "running"
            ? {
                ...r,
                status: "error",
                finalMessage: "Run was interrupted (page reloaded).",
              }
            : r
        ),
      });
    }

    // Seed activeModel from settings default if still at the hardcoded fallback
    const { activeModel, setActiveModel } = useAgentStore.getState();
    const { defaultModels } = useSettingsStore.getState();
    if (activeModel === "claude-sonnet-4-6") {
      setActiveModel(defaultModels.agent);
    }
  }, []);

  const runAgent = useCallback(
    async (goal: string, context?: string, enabledTools?: string[]) => {
      if (store.currentRun?.status === "running") return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const runId = store.startRun(goal);

      const { anthropicKeyOverride, agentToolDefaults } =
        useSettingsStore.getState();
      const effectiveTools = enabledTools ?? agentToolDefaults;
      const { activeModel } = useAgentStore.getState();
      const extraHeaders: Record<string, string> = {};
      if (anthropicKeyOverride) {
        extraHeaders["X-Anthropic-Key"] = anthropicKeyOverride;
      }

      // Map from API step IDs (tool_use block IDs) to store step IDs
      const stepIdMap = new Map<string, string>();

      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...extraHeaders },
          body: JSON.stringify({ goal, context, enabledTools: effectiveTools, model: activeModel }),
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
