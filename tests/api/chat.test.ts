import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Must be declared before vi.mock so the hoisted factory can close over them.
const mockStream = vi.fn();

vi.mock("@anthropic-ai/sdk");
vi.mock("@/lib/anthropic", () => ({
  getAnthropicClient: vi.fn(),
}));

import { POST } from "@/app/api/chat/route";
import { getAnthropicClient } from "@/lib/anthropic";

const mockGetAnthropicClient = vi.mocked(getAnthropicClient);

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function makeMockAsyncIterable(events: unknown[]) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const event of events) {
        yield event;
      }
    },
  };
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with text/plain body for a standard chat message", async () => {
    const mockIterable = makeMockAsyncIterable([
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "Hello, world!" },
      },
    ]);
    mockStream.mockReturnValue(mockIterable);
    mockGetAnthropicClient.mockReturnValue({
      messages: { stream: mockStream },
    } as ReturnType<typeof getAnthropicClient>);

    const req = makeRequest({
      messages: [{ role: "user", content: "Hi" }],
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");

    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);
  });

  it("returns NDJSON with {t,d} lines when thinking is true", async () => {
    const mockIterable = makeMockAsyncIterable([
      {
        type: "content_block_delta",
        delta: { type: "thinking_delta", thinking: "Let me think…" },
      },
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "42" },
      },
    ]);
    mockStream.mockReturnValue(mockIterable);
    mockGetAnthropicClient.mockReturnValue({
      messages: { stream: mockStream },
    } as ReturnType<typeof getAnthropicClient>);

    const req = makeRequest({
      messages: [{ role: "user", content: "Think about this" }],
      thinking: true,
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain(
      "application/x-ndjson"
    );

    const body = await response.text();
    const lines = body.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThan(0);

    for (const line of lines) {
      const parsed = JSON.parse(line) as { t: string; d: string };
      // "k" = thinking block, "x" = text block (see chat route emit calls)
      expect(["k", "x"]).toContain(parsed.t);
      expect(typeof parsed.d).toBe("string");
    }
  });

  it("returns 5xx with JSON error body when the API key is missing", async () => {
    mockGetAnthropicClient.mockImplementation(() => {
      throw new Error("No API key provided");
    });

    const req = makeRequest({
      messages: [{ role: "user", content: "Hi" }],
    });

    const response = await POST(req);

    expect(response.status).toBeGreaterThanOrEqual(400);
    const json = (await response.json()) as { error: string };
    expect(typeof json.error).toBe("string");
    expect(json.error.length).toBeGreaterThan(0);
  });

  it("passes X-Anthropic-Key to getAnthropicClient in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const mockIterable = makeMockAsyncIterable([
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "Hello" },
      },
    ]);
    mockStream.mockReturnValue(mockIterable);
    mockGetAnthropicClient.mockReturnValue({
      messages: { stream: mockStream },
    } as ReturnType<typeof getAnthropicClient>);

    const req = makeRequest(
      { messages: [{ role: "user", content: "Hi" }] },
      { "X-Anthropic-Key": "dev-key-123" }
    );

    await POST(req);

    expect(mockGetAnthropicClient).toHaveBeenCalledWith("dev-key-123");

    vi.unstubAllEnvs();
  });

  it("ignores X-Anthropic-Key header in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const mockIterable = makeMockAsyncIterable([
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "Hello" },
      },
    ]);
    mockStream.mockReturnValue(mockIterable);
    mockGetAnthropicClient.mockReturnValue({
      messages: { stream: mockStream },
    } as ReturnType<typeof getAnthropicClient>);

    const req = makeRequest(
      { messages: [{ role: "user", content: "Hi" }] },
      { "X-Anthropic-Key": "prod-key-should-be-ignored" }
    );

    await POST(req);

    expect(mockGetAnthropicClient).toHaveBeenCalledWith(undefined);

    vi.unstubAllEnvs();
  });
});
