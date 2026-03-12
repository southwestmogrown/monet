import type { ModelId } from "./chat";

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  userMessage: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorkbenchRun {
  id: string;
  templateId: string;
  variables: Record<string, string>;
  model: ModelId;
  output: string;
  usage: { inputTokens: number; outputTokens: number };
  createdAt: number;
}

export interface CompareVariant {
  systemPrompt: string;
  userMessage: string;
  model: ModelId;
  label: string;
}

export interface CompareResult {
  variantIndex: number;
  output: string;
  usage: { inputTokens: number; outputTokens: number };
  error?: string;
}
