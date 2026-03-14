import { describe, it, expect } from "vitest";
import { executeToolCall, createVirtualFS } from "@/lib/agent-tools";
import type { AgentToolName } from "@/types/agent";

describe("executeToolCall – Zod input validation", () => {
  const vfs = createVirtualFS();

  it("read_file: missing path returns validation error string", async () => {
    const result = await executeToolCall(
      "read_file" as AgentToolName,
      {} as Record<string, unknown>,
      vfs
    );
    expect(result).toMatch(/^Tool input validation failed:/);
  });

  it("write_file: missing content returns validation error string", async () => {
    const result = await executeToolCall(
      "write_file" as AgentToolName,
      { path: "test.txt" } as Record<string, unknown>,
      vfs
    );
    expect(result).toMatch(/^Tool input validation failed:/);
  });

  it("write_file: missing path returns validation error string", async () => {
    const result = await executeToolCall(
      "write_file" as AgentToolName,
      { content: "hello" } as Record<string, unknown>,
      vfs
    );
    expect(result).toMatch(/^Tool input validation failed:/);
  });

  it("create_artifact: missing name returns validation error string", async () => {
    const result = await executeToolCall(
      "create_artifact" as AgentToolName,
      { content: "some content" } as Record<string, unknown>,
      vfs
    );
    expect(result).toMatch(/^Tool input validation failed:/);
  });

  it("analyze_code: missing code returns validation error string", async () => {
    const result = await executeToolCall(
      "analyze_code" as AgentToolName,
      { language: "typescript" } as Record<string, unknown>,
      vfs
    );
    expect(result).toMatch(/^Tool input validation failed:/);
  });

  it("web_search: missing query returns validation error string", async () => {
    const result = await executeToolCall(
      "web_search" as AgentToolName,
      {} as Record<string, unknown>,
      vfs
    );
    expect(result).toMatch(/^Tool input validation failed:/);
  });

  it("read_file: valid input reads file from vfs", async () => {
    const localVfs = createVirtualFS();
    localVfs.write("hello.txt", "Hello, world!");
    const result = await executeToolCall(
      "read_file" as AgentToolName,
      { path: "hello.txt" },
      localVfs
    );
    expect(result).toBe("Hello, world!");
  });

  it("write_file: valid input writes file to vfs", async () => {
    const localVfs = createVirtualFS();
    const result = await executeToolCall(
      "write_file" as AgentToolName,
      { path: "out.txt", content: "data" },
      localVfs
    );
    expect(result).toContain("Successfully wrote");
    expect(localVfs.read("out.txt")).toBe("data");
  });

  it("create_artifact: valid input stores artifact", async () => {
    const localVfs = createVirtualFS();
    const result = await executeToolCall(
      "create_artifact" as AgentToolName,
      { name: "snippet", content: "console.log('hi')", language: "typescript" },
      localVfs
    );
    expect(result).toContain("snippet");
    expect(localVfs.read(".artifacts/snippet")).toBe("console.log('hi')");
  });

  it("analyze_code: valid input returns summary string", async () => {
    const result = await executeToolCall(
      "analyze_code" as AgentToolName,
      { code: "const x = 1;\n", language: "typescript" },
      vfs
    );
    expect(result).toContain("typescript");
  });

  it("analyze_code: optional focus field is reflected in result", async () => {
    const result = await executeToolCall(
      "analyze_code" as AgentToolName,
      { code: "const x = 1;\n", language: "typescript", focus: "performance" },
      vfs
    );
    expect(result).toContain("performance");
  });
});
