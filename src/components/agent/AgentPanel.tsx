"use client";

import { useAgentRun } from "@/hooks/useAgentRun";
import { AgentTaskInput } from "./AgentTaskInput";
import { AgentStepList } from "./AgentStepList";

export function AgentPanel() {
  const { currentRun, runAgent, cancelAgent, clearRun } = useAgentRun();

  const isRunning = currentRun?.status === "running";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        background: "var(--bg-editor)",
      }}
    >
      <AgentTaskInput
        onRun={(goal, enabledTools) => runAgent(goal, undefined, enabledTools)}
        onCancel={cancelAgent}
        onClear={clearRun}
        isRunning={isRunning}
      />

      <AgentStepList
        steps={currentRun?.steps ?? []}
        finalMessage={currentRun?.finalMessage}
        status={currentRun?.status ?? "idle"}
      />
    </div>
  );
}
