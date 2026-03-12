import { Search, FileText, FilePlus, Package, Code2 } from "lucide-react";
import type { AgentToolName } from "@/types/agent";

const TOOL_CONFIG: Record<
  AgentToolName,
  { icon: React.ComponentType<{ size?: number }>; color: string; label: string }
> = {
  web_search: { icon: Search, color: "#4fc3f7", label: "web_search" },
  read_file: { icon: FileText, color: "#aed581", label: "read_file" },
  write_file: { icon: FilePlus, color: "#ffb74d", label: "write_file" },
  create_artifact: { icon: Package, color: "#ce93d8", label: "create_artifact" },
  analyze_code: { icon: Code2, color: "#80cbc4", label: "analyze_code" },
};

interface AgentToolBadgeProps {
  tool: AgentToolName;
}

export function AgentToolBadge({ tool }: AgentToolBadgeProps) {
  const config = TOOL_CONFIG[tool] ?? {
    icon: Code2,
    color: "#999",
    label: tool,
  };
  const Icon = config.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 4,
        background: config.color + "22",
        border: `1px solid ${config.color}44`,
        color: config.color,
        fontSize: 11,
        fontFamily: "monospace",
        fontWeight: 500,
      }}
    >
      <Icon size={11} />
      {config.label}
    </span>
  );
}
