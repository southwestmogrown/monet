import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/anthropic";
import {
  AGENT_TOOLS,
  executeToolCall,
  resetVirtualFS,
} from "@/lib/agent-tools";
import { createNdjsonStream } from "@/lib/streaming";
import type { AgentToolName } from "@/types/agent";

const MAX_ITERATIONS = 15;

const RequestSchema = z.object({
  goal: z.string().min(1),
  context: z.string().optional(),
  enabledTools: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { goal, context, enabledTools } = parsed.data;
  const customKey = req.headers.get("X-Anthropic-Key") ?? undefined;
  const client = getAnthropicClient(customKey);
  resetVirtualFS();

  const activeTools = enabledTools
    ? AGENT_TOOLS.filter((t) => enabledTools.includes(t.name))
    : AGENT_TOOLS;

  const stream = createNdjsonStream(async (emit) => {
    const messages: { role: "user" | "assistant"; content: unknown }[] = [
      {
        role: "user",
        content: context ? `Context: ${context}\n\nGoal: ${goal}` : goal,
      },
    ];

    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system:
          "You are an autonomous AI agent. Use the tools available to you to complete the user's goal. Be thorough but efficient. When you have completed the goal, provide a clear final summary.",
        tools: activeTools.length > 0 ? activeTools : AGENT_TOOLS,
        tool_choice: { type: "auto" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
      });

      // Append assistant message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages.push({ role: "assistant", content: response.content as any });

      if (response.stop_reason === "end_turn") {
        // Extract final text
        const finalText = response.content
          .filter((b) => b.type === "text")
          .map((b) => (b as { type: "text"; text: string }).text)
          .join("\n");

        emit({ type: "final", message: finalText });
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolBlocks = response.content.filter(
          (b) => b.type === "tool_use"
        ) as {
          type: "tool_use";
          id: string;
          name: string;
          input: Record<string, unknown>;
        }[];

        const toolResults: {
          type: "tool_result";
          tool_use_id: string;
          content: string;
        }[] = [];

        for (const toolBlock of toolBlocks) {
          const stepId = toolBlock.id;
          const toolName = toolBlock.name as AgentToolName;
          const input = toolBlock.input;

          emit({
            type: "step",
            stepId,
            tool: toolName,
            input,
          });

          const result = await executeToolCall(toolName, input);

          emit({
            type: "step_result",
            stepId,
            result,
          });

          toolResults.push({
            type: "tool_result",
            tool_use_id: stepId,
            content: result,
          });
        }

        messages.push({ role: "user", content: toolResults });
        continue;
      }

      // Unexpected stop reason
      emit({
        type: "error",
        error: `Unexpected stop reason: ${response.stop_reason}`,
      });
      break;
    }

    if (iterations >= MAX_ITERATIONS) {
      emit({
        type: "error",
        error: `Agent reached the maximum iteration limit (${MAX_ITERATIONS}).`,
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
