import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { AgentToolName } from "@/types/agent";

// ─── Tool Definitions (sent to Claude) ───────────────────────────────────────

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the web for up-to-date information. Use when you need current facts, documentation, or context you don't have.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "read_file",
    description:
      "Read the contents of a file from the virtual workspace. Returns the file content as a string.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "File path relative to the workspace root",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Write or overwrite a file in the virtual workspace. Creates the file if it does not exist.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "File path relative to workspace root",
        },
        content: {
          type: "string",
          description: "The full file content to write",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "create_artifact",
    description:
      "Save a named artifact (code snippet, document, or data) as output of this agent run.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "A short descriptive name for the artifact",
        },
        content: {
          type: "string",
          description: "The artifact content",
        },
        language: {
          type: "string",
          description:
            "Optional programming language or content type (e.g. 'typescript', 'markdown')",
        },
      },
      required: ["name", "content"],
    },
  },
  {
    name: "analyze_code",
    description:
      "Analyze a code snippet for bugs, security issues, performance problems, or style violations.",
    input_schema: {
      type: "object" as const,
      properties: {
        code: {
          type: "string",
          description: "The code to analyze",
        },
        language: {
          type: "string",
          description: "Programming language of the code",
        },
        focus: {
          type: "string",
          description:
            "Optional focus area: 'bugs', 'security', 'performance', 'style', or 'all'",
        },
      },
      required: ["code", "language"],
    },
  },
];

// ─── Tool Input Schemas (Zod) ─────────────────────────────────────────────────

const WebSearchInput = z.object({
  query: z.string(),
});

const ReadFileInput = z.object({
  path: z.string(),
});

const WriteFileInput = z.object({
  path: z.string(),
  content: z.string(),
});

const CreateArtifactInput = z.object({
  name: z.string(),
  content: z.string(),
  language: z.string().optional(),
});

const AnalyzeCodeInput = z.object({
  code: z.string(),
  language: z.string(),
  focus: z.string().optional(),
});

// ─── Tool Handlers (server-side execution) ────────────────────────────────────

type ToolInput = Record<string, unknown>;

export interface VirtualFile {
  path: string;
  content: string;
}

export interface VirtualFS {
  read(path: string): string | undefined;
  write(path: string, content: string): void;
  list(): VirtualFile[];
}

/** Create an isolated in-memory virtual filesystem for a single agent run. */
export function createVirtualFS(): VirtualFS {
  const store = new Map<string, string>();
  return {
    read: (path) => store.get(path),
    write: (path, content) => {
      store.set(path, content);
    },
    list: () =>
      Array.from(store.entries()).map(([path, content]) => ({
        path,
        content,
      })),
  };
}

export async function executeToolCall(
  toolName: AgentToolName,
  input: ToolInput,
  vfs: VirtualFS
): Promise<string> {
  switch (toolName) {
    case "web_search": {
      const parsed = WebSearchInput.safeParse(input);
      if (!parsed.success) {
        return `Tool input validation failed: ${parsed.error.message}`;
      }
      const { query } = parsed.data;
      // Use Brave Search API if available, otherwise return a stub
      const apiKey = process.env.BRAVE_SEARCH_API_KEY;
      if (!apiKey) {
        return `[web_search] No BRAVE_SEARCH_API_KEY configured. Query was: "${query}". To enable web search, add BRAVE_SEARCH_API_KEY to your .env.local file.`;
      }
      try {
        const res = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
          {
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip",
              "X-Subscription-Token": apiKey,
            },
          }
        );
        const data = await res.json();
        const results = (data.web?.results ?? [])
          .slice(0, 5)
          .map(
            (r: { title: string; url: string; description: string }) =>
              `**${r.title}**\n${r.url}\n${r.description}`
          )
          .join("\n\n");
        return results || "No results found.";
      } catch {
        return `Search failed for query: "${query}"`;
      }
    }

    case "read_file": {
      const parsed = ReadFileInput.safeParse(input);
      if (!parsed.success) {
        return `Tool input validation failed: ${parsed.error.message}`;
      }
      const { path } = parsed.data;
      const content = vfs.read(path);
      if (content === undefined) {
        return `Error: File not found: ${path}`;
      }
      return content;
    }

    case "write_file": {
      const parsed = WriteFileInput.safeParse(input);
      if (!parsed.success) {
        return `Tool input validation failed: ${parsed.error.message}`;
      }
      const { path, content } = parsed.data;
      vfs.write(path, content);
      return `Successfully wrote ${content.length} characters to ${path}`;
    }

    case "create_artifact": {
      const parsed = CreateArtifactInput.safeParse(input);
      if (!parsed.success) {
        return `Tool input validation failed: ${parsed.error.message}`;
      }
      const { name, content, language = "plaintext" } = parsed.data;
      // Store as a virtual file under .artifacts/
      vfs.write(`.artifacts/${name}`, content);
      return `Artifact "${name}" (${language}) created with ${content.length} characters.`;
    }

    case "analyze_code": {
      // This tool just returns the inputs — the Claude API route will
      // re-invoke Claude for the actual analysis using a focused prompt.
      // For now return a formatted summary so the agent loop can continue.
      const parsed = AnalyzeCodeInput.safeParse(input);
      if (!parsed.success) {
        return `Tool input validation failed: ${parsed.error.message}`;
      }
      const { code, language, focus = "all" } = parsed.data;
      return `Code analysis requested for ${language} code (${code.split("\n").length} lines), focus: ${focus}. Analysis will be returned by Claude in the next turn.`;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}
