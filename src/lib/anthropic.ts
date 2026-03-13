import Anthropic from "@anthropic-ai/sdk";

let defaultClient: Anthropic | null = null;

export function getAnthropicClient(apiKey?: string): Anthropic {
  if (apiKey) {
    return new Anthropic({ apiKey });
  }
  if (!defaultClient) {
    defaultClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return defaultClient;
}
