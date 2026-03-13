import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { fillTemplate } from "@/lib/prompt-templates";

const RequestSchema = z.object({
  systemPrompt: z.string(),
  userMessage: z.string().min(1),
  model: z.string().default("claude-sonnet-4-6"),
  variables: z.record(z.string(), z.string()).optional().default({}),
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

  const { systemPrompt, userMessage, model, variables } = parsed.data;

  const filledSystem = fillTemplate(systemPrompt, variables);
  const filledUser = fillTemplate(userMessage, variables);

  const customKey = req.headers.get("X-Anthropic-Key") ?? undefined;
  const client = getAnthropicClient(customKey);

  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: filledSystem || "You are a helpful assistant.",
    messages: [{ role: "user", content: filledUser }],
  });

  const output =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({
    output,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  });
}
