import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@anthropic-ai/sdk");
vi.mock("@/lib/anthropic", () => ({
  getAnthropicClient: vi.fn(),
}));

import { POST as explainPOST } from "@/app/api/code/explain/route";
import { POST as refactorPOST } from "@/app/api/code/refactor/route";
import { POST as completePOST } from "@/app/api/code/complete/route";
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

describe("POST /api/code/explain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with result on valid input", async () => {
    mockClientWithText("This function adds two numbers.");

    const req = makeRequest("http://localhost/api/code/explain", {
      code: "function add(a, b) { return a + b; }",
      language: "javascript",
    });

    const response = await explainPOST(req);

    expect(response.status).toBe(200);
    const json = (await response.json()) as { result: string };
    expect(json.result).toBe("This function adds two numbers.");
  });

  it("returns 400 when code is an empty string (H-1 regression)", async () => {
    const req = makeRequest("http://localhost/api/code/explain", {
      code: "",
      language: "javascript",
    });

    const response = await explainPOST(req);

    expect(response.status).toBe(400);
    const json = (await response.json()) as { error: string };
    expect(typeof json.error).toBe("string");
    expect(json.error.length).toBeGreaterThan(0);
  });

  it("returns 400 when code field is missing", async () => {
    const req = makeRequest("http://localhost/api/code/explain", {
      language: "javascript",
    });

    const response = await explainPOST(req);

    expect(response.status).toBe(400);
  });
});

describe("POST /api/code/refactor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with result on valid input", async () => {
    mockClientWithText("const add = (a: number, b: number) => a + b;");

    const req = makeRequest("http://localhost/api/code/refactor", {
      code: "function add(a, b) { return a + b; }",
      language: "typescript",
    });

    const response = await refactorPOST(req);

    expect(response.status).toBe(200);
    const json = (await response.json()) as { result: string };
    expect(typeof json.result).toBe("string");
  });

  it("returns 200 with optional instruction", async () => {
    mockClientWithText("const add = (a: number, b: number): number => a + b;");

    const req = makeRequest("http://localhost/api/code/refactor", {
      code: "function add(a, b) { return a + b; }",
      language: "typescript",
      instruction: "Add TypeScript types",
    });

    const response = await refactorPOST(req);

    expect(response.status).toBe(200);
  });

  it("returns 400 when code is an empty string (H-1 regression)", async () => {
    const req = makeRequest("http://localhost/api/code/refactor", {
      code: "",
      language: "typescript",
    });

    const response = await refactorPOST(req);

    expect(response.status).toBe(400);
    const json = (await response.json()) as { error: string };
    expect(typeof json.error).toBe("string");
    expect(json.error.length).toBeGreaterThan(0);
  });

  it("returns 400 when code field is missing", async () => {
    const req = makeRequest("http://localhost/api/code/refactor", {
      language: "typescript",
    });

    const response = await refactorPOST(req);

    expect(response.status).toBe(400);
  });
});

describe("POST /api/code/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with result on valid input", async () => {
    mockClientWithText(" + b;\n}");

    const req = makeRequest("http://localhost/api/code/complete", {
      code: "function add(a, b) { return a",
      language: "javascript",
    });

    const response = await completePOST(req);

    expect(response.status).toBe(200);
    const json = (await response.json()) as { result: string };
    expect(typeof json.result).toBe("string");
  });

  it("returns 400 when code is an empty string (H-1 regression)", async () => {
    const req = makeRequest("http://localhost/api/code/complete", {
      code: "",
      language: "javascript",
    });

    const response = await completePOST(req);

    expect(response.status).toBe(400);
    const json = (await response.json()) as { error: string };
    expect(typeof json.error).toBe("string");
    expect(json.error.length).toBeGreaterThan(0);
  });

  it("returns 400 when code field is missing", async () => {
    const req = makeRequest("http://localhost/api/code/complete", {
      language: "javascript",
    });

    const response = await completePOST(req);

    expect(response.status).toBe(400);
  });
});
