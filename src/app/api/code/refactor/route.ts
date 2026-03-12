import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/anthropic";

const RequestSchema = z.object({
  code: z.string().min(1),
  language: z.string().default("plaintext"),
  instruction: z.string().optional(),
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

  const { code, language, instruction } = parsed.data;
  const client = getAnthropicClient();

  const userMessage = instruction
    ? `Refactor the following ${language} code. Instruction: ${instruction}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``
    : `Refactor the following ${language} code to improve readability, performance, and best practices:\n\n\`\`\`${language}\n${code}\n\`\`\``;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system:
      "You are a code refactoring assistant. Output ONLY the refactored code without any explanation, markdown fences, or commentary. Preserve the original functionality.",
    messages: [{ role: "user", content: userMessage }],
  });

  const result =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ result });
}
