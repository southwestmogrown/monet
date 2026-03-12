"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Code2, Bot, FlaskConical } from "lucide-react";

const NAV_ITEMS = [
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/editor", icon: Code2, label: "Editor" },
  { href: "/agent", icon: Bot, label: "Agent" },
  { href: "/workbench", icon: FlaskConical, label: "Workbench" },
] as const;

export function ActivityBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-col items-center py-2 gap-1"
      style={{
        width: 48,
        background: "var(--bg-activity-bar)",
        borderRight: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center mb-3 mt-1"
        style={{ width: 32, height: 32 }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "-1px",
            fontFamily: "monospace",
          }}
        >
          M
        </span>
      </div>

      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            title={label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 6,
              color: isActive ? "var(--text-active)" : "var(--text-secondary)",
              background: isActive ? "var(--bg-active)" : "transparent",
              borderLeft: isActive
                ? "2px solid var(--accent)"
                : "2px solid transparent",
              transition: "all 0.1s",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--text-primary)";
                (e.currentTarget as HTMLElement).style.background =
                  "var(--bg-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }
            }}
          >
            <Icon size={20} />
          </Link>
        );
      })}
    </nav>
  );
}
