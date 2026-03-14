import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@anthropic-ai/sdk");
vi.mock("@/lib/anthropic", () => ({
  getAnthropicClient: vi.fn(),
}));

import { POST as runPOST } from "@/app/api/prompt-workbench/run/route";
import { POST as comparePOST } from "@/app/api/prompt-workbench/compare/route";
import { getAnthropicClient } from "@/lib/anthropic";

const mockGetAnthropicClient = vi.mocked(getAnthropicClient);

function makeRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockClientWithText(text: string) {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: "text", text }],
    usage: { input_tokens: 10, output_tokens: 20 },
  });
  mockGetAnthropicClient.mockReturnValue({
    messages: { create: mockCreate },
  } as ReturnType<typeof getAnthropicClient>);
  return mockCreate;
}

describe("POST /api/prompt-workbench/run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with output and usage on valid input", async () => {
    mockClientWithText("Hello, world!");

    const req = makeRequest("http://localhost/api/prompt-workbench/run", {
      systemPrompt: "You are a helpful assistant.",
      userMessage: "Say hello.",
      model: "claude-sonnet-4-6",
    });

    const response = await runPOST(req);

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      output: string;
      usage: { inputTokens: number; outputTokens: number };
    };
    expect(json.output).toBe("Hello, world!");
    expect(typeof json.usage.inputTokens).toBe("number");
    expect(typeof json.usage.outputTokens).toBe("number");
  });

  it("fills template variables before sending to Claude", async () => {
    const mockCreate = mockClientWithText("Hello, Alice!");

    const req = makeRequest("http://localhost/api/prompt-workbench/run", {
      systemPrompt: "You are a greeting bot.",
      userMessage: "Say hello to {{name}}.",
      model: "claude-sonnet-4-6",
      variables: { name: "Alice" },
    });

    const response = await runPOST(req);

    expect(response.status).toBe(200);
    // Verify the filled message was passed to the API
    const callArgs = mockCreate.mock.calls[0][0] as {
      messages: { role: string; content: string }[];
    };
    expect(callArgs.messages[0].content).toBe("Say hello to Alice.");
  });

  it("returns 400 when userMessage is missing", async () => {
    const req = makeRequest("http://localhost/api/prompt-workbench/run", {
      systemPrompt: "You are a helpful assistant.",
    });

    const response = await runPOST(req);

    expect(response.status).toBe(400);
  });

  it("returns 400 when userMessage is empty", async () => {
    const req = makeRequest("http://localhost/api/prompt-workbench/run", {
      systemPrompt: "You are a helpful assistant.",
      userMessage: "",
    });

    const response = await runPOST(req);

    expect(response.status).toBe(400);
  });
});

describe("POST /api/prompt-workbench/compare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with results array for two variants", async () => {
    mockClientWithText("Variant response");

    const req = makeRequest("http://localhost/api/prompt-workbench/compare", {
      variants: [
        {
          systemPrompt: "You are assistant A.",
          userMessage: "Hello",
          model: "claude-sonnet-4-6",
          label: "A",
        },
        {
          systemPrompt: "You are assistant B.",
          userMessage: "Hello",
          model: "claude-sonnet-4-6",
          label: "B",
        },
      ],
    });

    const response = await comparePOST(req);

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      results: { variantIndex: number; output: string }[];
    };
    expect(Array.isArray(json.results)).toBe(true);
    expect(json.results).toHaveLength(2);
    expect(json.results[0].variantIndex).toBe(0);
    expect(json.results[1].variantIndex).toBe(1);
  });

  it("fills template variables in all variants", async () => {
    const mockCreate = mockClientWithText("Response with variable");

    const req = makeRequest("http://localhost/api/prompt-workbench/compare", {
      variants: [
        {
          systemPrompt: "System {{lang}}",
          userMessage: "User {{lang}}",
          model: "claude-sonnet-4-6",
        },
        {
          systemPrompt: "System {{lang}}",
          userMessage: "User {{lang}}",
          model: "claude-sonnet-4-6",
        },
      ],
      variables: { lang: "TypeScript" },
    });

    const response = await comparePOST(req);

    expect(response.status).toBe(200);
    const firstCall = mockCreate.mock.calls[0][0] as {
      system: string;
      messages: { role: string; content: string }[];
    };
    expect(firstCall.system).toBe("System TypeScript");
    expect(firstCall.messages[0].content).toBe("User TypeScript");
  });

  it("returns 400 when fewer than 2 variants provided", async () => {
    const req = makeRequest("http://localhost/api/prompt-workbench/compare", {
      variants: [
        {
          systemPrompt: "You are an assistant.",
          userMessage: "Hello",
          model: "claude-sonnet-4-6",
        },
      ],
    });

    const response = await comparePOST(req);

    expect(response.status).toBe(400);
  });

  it("returns 400 when variants field is missing", async () => {
    const req = makeRequest("http://localhost/api/prompt-workbench/compare", {
      variables: {},
    });

    const response = await comparePOST(req);

    expect(response.status).toBe(400);
  });
});
