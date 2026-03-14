import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@anthropic-ai/sdk");
vi.mock("@/lib/anthropic", () => ({
  getAnthropicClient: vi.fn(),
}));

import { POST } from "@/app/api/agent/run/route";
import { getAnthropicClient } from "@/lib/anthropic";

const mockGetAnthropicClient = vi.mocked(getAnthropicClient);

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agent/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("NDJSON stream contains a final event", async () => {
    const mockCreate = vi
      .fn()
      // First iteration: tool_use so the agent executes a tool
      .mockResolvedValueOnce({
        stop_reason: "tool_use",
        content: [
          {
            type: "tool_use",
            id: "tool_call_1",
            name: "write_file",
            input: { path: "hello.txt", content: "Hello, world!" },
          },
        ],
      })
      // Second iteration: end_turn with the final text
      .mockResolvedValueOnce({
        stop_reason: "end_turn",
        content: [{ type: "text", text: "Task completed successfully." }],
      });

    mockGetAnthropicClient.mockReturnValue({
      messages: { create: mockCreate },
    } as ReturnType<typeof getAnthropicClient>);

    const req = makeRequest({ goal: "Write a hello world file" });

    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain(
      "application/x-ndjson"
    );

    const body = await response.text();
    const lines = body.trim().split("\n").filter(Boolean);
    const events = lines.map((l) => JSON.parse(l) as { type: string });

    const finalEvent = events.find((e) => e.type === "final");
    expect(finalEvent).toBeDefined();
  });

  it("passes X-Anthropic-Key to getAnthropicClient in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const mockCreate = vi.fn().mockResolvedValueOnce({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "Done." }],
    });
    mockGetAnthropicClient.mockReturnValue({
      messages: { create: mockCreate },
    } as ReturnType<typeof getAnthropicClient>);

    const req = new NextRequest("http://localhost/api/agent/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Anthropic-Key": "dev-key-123",
      },
      body: JSON.stringify({ goal: "Test" }),
    });

    await POST(req);

    expect(mockGetAnthropicClient).toHaveBeenCalledWith("dev-key-123");

    vi.unstubAllEnvs();
  });

  it("ignores X-Anthropic-Key header in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const mockCreate = vi.fn().mockResolvedValueOnce({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "Done." }],
    });
    mockGetAnthropicClient.mockReturnValue({
      messages: { create: mockCreate },
    } as ReturnType<typeof getAnthropicClient>);

    const req = new NextRequest("http://localhost/api/agent/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Anthropic-Key": "prod-key-should-be-ignored",
      },
      body: JSON.stringify({ goal: "Test" }),
    });

    await POST(req);

    expect(mockGetAnthropicClient).toHaveBeenCalledWith(undefined);

    vi.unstubAllEnvs();
  });
});
