import type Anthropic from "@anthropic-ai/sdk";
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

// ─── Tool Handlers (server-side execution) ────────────────────────────────────

type ToolInput = Record<string, unknown>;

interface VirtualFile {
  path: string;
  content: string;
}

// In-memory virtual filesystem scoped to a single agent run
const virtualFS = new Map<string, string>();

export function resetVirtualFS() {
  virtualFS.clear();
}

export async function executeToolCall(
  toolName: AgentToolName,
  input: ToolInput
): Promise<string> {
  switch (toolName) {
    case "web_search": {
      const query = input.query as string;
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
      const path = input.path as string;
      const content = virtualFS.get(path);
      if (content === undefined) {
        return `Error: File not found: ${path}`;
      }
      return content;
    }

    case "write_file": {
      const path = input.path as string;
      const content = input.content as string;
      virtualFS.set(path, content);
      return `Successfully wrote ${content.length} characters to ${path}`;
    }

    case "create_artifact": {
      const name = input.name as string;
      const content = input.content as string;
      const language = (input.language as string) ?? "plaintext";
      // Store as a virtual file under .artifacts/
      virtualFS.set(`.artifacts/${name}`, content);
      return `Artifact "${name}" (${language}) created with ${content.length} characters.`;
    }

    case "analyze_code": {
      // This tool just returns the inputs — the Claude API route will
      // re-invoke Claude for the actual analysis using a focused prompt.
      // For now return a formatted summary so the agent loop can continue.
      const code = input.code as string;
      const language = (input.language as string) ?? "unknown";
      const focus = (input.focus as string) ?? "all";
      return `Code analysis requested for ${language} code (${code.split("\n").length} lines), focus: ${focus}. Analysis will be returned by Claude in the next turn.`;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

export function getVirtualFiles(): VirtualFile[] {
  return Array.from(virtualFS.entries()).map(([path, content]) => ({
    path,
    content,
  }));
}
