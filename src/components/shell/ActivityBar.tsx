"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Code2, Bot, FlaskConical, Settings, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/editor", icon: Code2, label: "Editor" },
  { href: "/agent", icon: Bot, label: "Agent" },
  { href: "/workbench", icon: FlaskConical, label: "Workbench" },
] as const;

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <div className="nav-tooltip" data-tooltip={label}>
      <Link
        href={href}
        title={label}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 42,
          height: 42,
          borderRadius: 10,
          color: isActive ? "var(--accent)" : "var(--text-muted)",
          background: isActive ? "var(--accent-glow)" : "transparent",
          border: isActive ? "1px solid rgba(124,106,246,0.25)" : "1px solid transparent",
          transition: "all 0.12s ease",
          textDecoration: "none",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >
        <Icon size={18} />
      </Link>
    </div>
  );
}

export function ActivityBar() {
  return (
    <nav
      className="flex flex-col items-center py-3 gap-1"
      style={{
        width: 52,
        background: "linear-gradient(180deg, #07091480 0%, #0a0d1a80 100%)",
        borderRight: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* Logo — Monet palette mark */}
      <div
        className="flex items-center justify-center mb-4 mt-1"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "linear-gradient(135deg, #7C6AF6 0%, #A78BFA 100%)",
          boxShadow: "0 0 16px rgba(124,106,246,0.35)",
          flexShrink: 0,
        }}
      >
        <Sparkles size={16} color="#fff" />
      </div>

      {/* Subtle divider */}
      <div style={{
        width: 28,
        height: 1,
        background: "var(--border)",
        marginBottom: 4,
        opacity: 0.6,
      }} />

      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}

      {/* Settings at bottom */}
      <div style={{ flex: 1 }} />
      <NavLink href="/settings" icon={Settings} label="Settings" />
    </nav>
  );
}
