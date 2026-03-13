import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { createTextStream, createNdjsonStream } from "@/lib/streaming";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  imageDataUrl: z.string().optional(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema),
  model: z.string().default("claude-sonnet-4-6"),
  system: z.string().optional(),
  thinking: z.boolean().optional(),
});

function buildMessageContent(
  msg: { role: string; content: string; imageDataUrl?: string }
) {
  if (msg.role === "user" && msg.imageDataUrl) {
    const commaIdx = msg.imageDataUrl.indexOf(",");
    const header = msg.imageDataUrl.slice(0, commaIdx);
    const data = msg.imageDataUrl.slice(commaIdx + 1);
    const mediaType = header.split(":")[1]?.split(";")[0] ?? "image/jpeg";
    return [
      {
        type: "image" as const,
        source: { type: "base64" as const, media_type: mediaType as "image/jpeg", data },
      },
      { type: "text" as const, text: msg.content },
    ];
  }
  return msg.content;
}

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

  const { messages, model, system, thinking } = parsed.data;
  const customKey = req.headers.get("X-Anthropic-Key") ?? undefined;
  const client = getAnthropicClient(customKey);

  // Thinking requires Sonnet or Opus — upgrade Haiku automatically
  const effectiveModel =
    thinking && model === "claude-haiku-4-5-20251001" ? "claude-sonnet-4-6" : model;

  // Build Anthropic message format (handles image attachments)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anthropicMessages: any[] = messages.map((m) => ({
    role: m.role,
    content: buildMessageContent(m),
  }));

  if (thinking) {
    // Stream as NDJSON with separate thinking/text events
    const ndjsonStream = createNdjsonStream(async (emit) => {
      const stream = client.messages.stream({
        model: effectiveModel,
        max_tokens: 16000,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thinking: { type: "enabled", budget_tokens: 8000 } as any,
        system: system ?? "You are Claude, a helpful AI assistant.",
        messages: anthropicMessages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const delta = event.delta as any;
          if (delta.type === "thinking_delta") {
            emit({ t: "k", d: delta.thinking ?? "" });
          } else if (delta.type === "text_delta") {
            emit({ t: "x", d: delta.text ?? "" });
          }
        }
      }
    });

    return new Response(ndjsonStream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "X-Thinking-Mode": "1",
      },
    });
  }

  // Standard text stream
  async function* streamTokens(): AsyncIterable<string> {
    const stream = client.messages.stream({
      model: effectiveModel,
      max_tokens: 8096,
      system: system ?? "You are Claude, a helpful AI assistant.",
      messages: anthropicMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  return new Response(createTextStream(streamTokens()), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
