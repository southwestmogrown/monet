import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("emits an NDJSON error event when the agent request times out", async () => {
    // Simulate a hanging API call that only resolves when aborted
    const mockCreate = vi.fn().mockImplementation(
      (_params: unknown, options: { signal?: AbortSignal }) => {
        return new Promise<never>((_, reject) => {
          options?.signal?.addEventListener("abort", () => {
            const err = new Error("AbortError");
            err.name = "AbortError";
            reject(err);
          });
        });
      }
    );
    mockGetAnthropicClient.mockReturnValue({
      messages: { create: mockCreate },
    } as ReturnType<typeof getAnthropicClient>);

    const req = makeRequest({ goal: "A task that never finishes" });
    const responsePromise = POST(req);

    // Advance fake timers past the 60-second threshold
    await vi.advanceTimersByTimeAsync(61_000);

    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/x-ndjson");

    const body = await response.text();
    const lines = body.trim().split("\n").filter(Boolean);
    const events = lines.map((l) => JSON.parse(l) as { type: string; error?: string });

    const errorEvent = events.find((e) => e.type === "error");
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.error).toContain("timed out");
  });

  it("normal agent requests complete without triggering the timeout", async () => {
    const mockCreate = vi.fn().mockResolvedValueOnce({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "Done quickly." }],
    });
    mockGetAnthropicClient.mockReturnValue({
      messages: { create: mockCreate },
    } as ReturnType<typeof getAnthropicClient>);

    const req = makeRequest({ goal: "Quick task" });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const body = await response.text();
    const lines = body.trim().split("\n").filter(Boolean);
    const events = lines.map((l) => JSON.parse(l) as { type: string });

    expect(events.find((e) => e.type === "final")).toBeDefined();
    expect(events.find((e) => e.type === "error")).toBeUndefined();
  });
});
