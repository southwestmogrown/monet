import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { fillTemplate } from "@/lib/prompt-templates";

const VariantSchema = z.object({
  systemPrompt: z.string(),
  userMessage: z.string(),
  model: z.string().default("claude-sonnet-4-6"),
  label: z.string().optional(),
});

const RequestSchema = z.object({
  variants: z.array(VariantSchema).min(2).max(4),
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

  const { variants, variables } = parsed.data;
  const customKey = req.headers.get("X-Anthropic-Key") ?? undefined;
  const client = getAnthropicClient(customKey);

  const results = await Promise.allSettled(
    variants.map(async (variant, index) => {
      const filledSystem = fillTemplate(variant.systemPrompt, variables);
      const filledUser = fillTemplate(variant.userMessage, variables);

      const message = await client.messages.create({
        model: variant.model,
        max_tokens: 4096,
        system: filledSystem || "You are a helpful assistant.",
        messages: [{ role: "user", content: filledUser }],
      });

      const output =
        message.content[0].type === "text" ? message.content[0].text : "";

      return {
        variantIndex: index,
        output,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    })
  );

  const processed = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        variantIndex: index,
        output: "",
        usage: { inputTokens: 0, outputTokens: 0 },
        error: result.reason?.message ?? "Unknown error",
      };
    }
  });

  return NextResponse.json({ results: processed });
}
