import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/anthropic";

const RequestSchema = z.object({
  code: z.string().min(1),
  language: z.string().default("plaintext"),
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

  const { code, language } = parsed.data;
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system:
      "You are a code completion assistant. Complete the code that the user has started. Output ONLY the completion text (what comes after the cursor), no explanation, no markdown fences.",
    messages: [
      {
        role: "user",
        content: `Complete the following ${language} code:\n\n${code}`,
      },
    ],
  });

  const result =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ result });
}
