export type AgentStepStatus = "pending" | "running" | "done" | "error";

export type AgentToolName =
  | "web_search"
  | "read_file"
  | "write_file"
  | "create_artifact"
  | "analyze_code";

export interface AgentStep {
  id: string;
  tool: AgentToolName;
  input: Record<string, unknown>;
  result?: string;
  status: AgentStepStatus;
  createdAt: number;
}

export interface AgentRun {
  id: string;
  goal: string;
  steps: AgentStep[];
  finalMessage?: string;
  status: "idle" | "running" | "done" | "error";
  createdAt: number;
}

export interface AgentStreamEvent {
  type: "step" | "step_result" | "final" | "error";
  stepId?: string;
  tool?: AgentToolName;
  input?: Record<string, unknown>;
  result?: string;
  message?: string;
  error?: string;
}
