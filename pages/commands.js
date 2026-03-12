import { useState, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";

const COMMANDS = [];

const GROUPS = ["All", "Resources", "External Software"];

function CommandCenter() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");

  const filtered = useMemo(() => {
    let list = COMMANDS;
    if (activeGroup !== "All") list = list.filter((c) => c.group === activeGroup);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.command.toLowerCase().includes(s) ||
          c.description.toLowerCase().includes(s) ||
          c.badge.toLowerCase().includes(s)
      );
    }
    return list;
  }, [search, activeGroup]);

  const groupStats = {
    Resources: COMMANDS.filter((c) => c.group === "Resources").length,
    "External Software": COMMANDS.filter((c) => c.group === "External Software").length,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0D1423" }}>
      <Head>
        <title>Command Center</title>
      </Head>
      <NavigationSidebar />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                <span>🎬</span>
                <span style={{ background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Command Center
                </span>
              </h1>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: "6px 0 0 0" }}>
                Quick reference for all Pacino shortcodes and workflows
              </p>
            </div>
            <button
              onClick={() => router.push("/videocue")}
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                color: "#d1d5db",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Resources", icon: "🗂️", count: groupStats.Resources },
              { label: "External Software", icon: "🖥️", count: groupStats["External Software"] },
              { label: "Total Commands", icon: null, count: COMMANDS.length, highlight: true },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  border: s.highlight ? "1px solid #1d4ed8" : "1px solid rgba(255,255,255,0.08)",
                  background: s.highlight ? "rgba(29,78,216,0.2)" : "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: "28px", fontWeight: "800", color: s.highlight ? "#60a5fa" : "#fff", marginBottom: "4px" }}>
                  {s.count}
                </div>
                <div style={{ fontSize: "13px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "6px" }}>
                  {s.icon && <span>{s.icon}</span>}
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search commands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "10px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {GROUPS.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: activeGroup === g ? "#7c3aed" : "rgba(255,255,255,0.1)",
                    background: activeGroup === g ? "#7c3aed" : "rgba(255,255,255,0.04)",
                    color: activeGroup === g ? "#fff" : "#9ca3af",
                    fontSize: "13px",
                    fontWeight: activeGroup === g ? "600" : "400",
                    cursor: "pointer",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "64px", color: "#6b7280", fontSize: "14px" }}>
                {search ? `No commands match "${search}"` : "No commands yet. Commands will appear here when added by the bot."}
              </div>
            )}
            {filtered.map((cmd) => (
              <CommandCard key={cmd.id} cmd={cmd} />
            ))}
          </div>

          <div style={{ marginTop: "16px", textAlign: "right", color: "#6b7280", fontSize: "13px" }}>
            {filtered.length} {filtered.length === 1 ? "command" : "commands"}
          </div>
        </div>
      </main>
    </div>
  );
}

function CommandCard({ cmd }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "20px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: "700", color: "#60a5fa" }}>
          {cmd.command}
        </span>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: "6px",
            background: cmd.badgeColor + "33",
            border: `1px solid ${cmd.badgeColor}66`,
            color: "#c4b5fd",
            fontSize: "11px",
            fontWeight: "600",
            whiteSpace: "nowrap",
          }}
        >
          {cmd.badge}
        </span>
      </div>

      <p style={{ color: "#d1d5db", fontSize: "13px", lineHeight: "1.5", margin: "0 0 8px 0" }}>
        {cmd.description}
      </p>

      {cmd.hint && (
        <p style={{ color: "#f59e0b", fontSize: "12px", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "4px" }}>
          <span>💡</span> {cmd.hint}
        </p>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        style={{ background: "none", border: "none", color: "#6b7280", fontSize: "12px", cursor: "pointer", padding: "0", marginTop: "4px" }}
      >
        {expanded ? "Click to collapse ↑" : "Click to expand ↓"}
      </button>

      {expanded && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
          {cmd.expanded}
        </div>
      )}
    </div>
  );
}

export default withAuth(CommandCenter);
