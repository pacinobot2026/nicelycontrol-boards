import { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";

const s = {
  page: { display: "flex", height: "100vh", background: "#080b14", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", overflow: "hidden" },
  main: { flex: 1, overflowY: "auto", padding: "24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  title: { fontSize: "22px", fontWeight: "700", color: "#e2e8f0", margin: 0 },
  subtitle: { fontSize: "12px", color: "#64748b", marginTop: "2px" },
  clock: { textAlign: "right" },
  clockTime: { fontSize: "18px", fontWeight: "700", color: "#e2e8f0", fontVariantNumeric: "tabular-nums" },
  clockDate: { fontSize: "11px", color: "#64748b", marginTop: "2px" },
  ccBtn: { marginTop: "8px", padding: "4px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", color: "#94a3b8", fontSize: "11px", cursor: "pointer" },
  cronBanner: { background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  cronLabel: { fontSize: "10px", color: "#818cf8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" },
  cronName: { fontSize: "18px", fontWeight: "700", color: "#fff" },
  cronSched: { fontSize: "12px", color: "#a5b4fc", marginTop: "2px" },
  cronRuns: { textAlign: "right" },
  cronRunsLabel: { fontSize: "10px", color: "#818cf8", textTransform: "uppercase", letterSpacing: "1px" },
  cronRunsVal: { fontSize: "32px", fontWeight: "800", color: "#fff" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "20px" },
  statCard: { background: "#0f1623", border: "1px solid #1e293b", borderRadius: "10px", padding: "14px 16px" },
  statIcon: { fontSize: "20px", marginBottom: "6px" },
  statVal: { fontSize: "22px", fontWeight: "700", color: "#e2e8f0" },
  statLabel: { fontSize: "11px", color: "#64748b", marginTop: "2px" },
  cols: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  card: { background: "#0f1623", border: "1px solid #1e293b", borderRadius: "10px", padding: "16px", marginBottom: "14px" },
  cardTitle: { fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#0a0f1a", borderRadius: "7px", marginBottom: "6px" },
  rowName: { fontSize: "13px", fontWeight: "500", color: "#e2e8f0" },
  rowSub: { fontSize: "11px", color: "#64748b", marginTop: "1px" },
  badge: (color) => ({ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", background: color === "green" ? "#052e16" : color === "blue" ? "#1e3a5f" : "#1a1a1a", color: color === "green" ? "#4ade80" : color === "blue" ? "#60a5fa" : "#fbbf24", border: `1px solid ${color === "green" ? "#166534" : color === "blue" ? "#1d4ed8" : "#78350f"}` }),
  dot: (color) => ({ width: "7px", height: "7px", borderRadius: "50%", background: color === "green" ? "#4ade80" : color === "yellow" ? "#fbbf24" : "#64748b", flexShrink: 0 }),
  progressBar: { height: "4px", background: "#1e293b", borderRadius: "2px", marginTop: "6px", overflow: "hidden" },
  priorityBadge: (p) => ({ fontSize: "10px", padding: "1px 6px", borderRadius: "3px", fontWeight: "600", background: p === "high" ? "#450a0a" : "#1c1917", color: p === "high" ? "#f87171" : "#d97706", border: `1px solid ${p === "high" ? "#991b1b" : "#92400e"}`, marginLeft: "6px" }),
  tag: { padding: "4px 10px", background: "#1e293b", border: "1px solid #334155", borderRadius: "20px", fontSize: "11px", color: "#94a3b8", display: "inline-block", margin: "3px" },
  empty: { fontSize: "12px", color: "#475569", fontStyle: "italic", padding: "6px 0" },
};

function CommandCenter() {
  const { session } = useAuth();
  const [time, setTime] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  async function fetchData() {
    try {
      const res = await fetch("/api/control", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (d) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDate = (d) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const apiKeys = data?.apiKeys || [];
  const models = data?.models || [];
  const cronJobs = data?.cronJobs || [];
  const tasks = data?.tasks || [];
  const channels = data?.channels || [];
  const integrations = data?.integrations || [];
  const features = data?.features || [];

  const inProgress = tasks.filter((t) => t.task_status === "in_progress");
  const backlog = tasks.filter((t) => t.task_status === "backlog");
  const done = tasks.filter((t) => t.task_status === "done");

  const totalSpent = apiKeys.reduce((a, b) => a + (b.spent || 0), 0);
  const totalBudget = apiKeys.reduce((a, b) => a + (b.budget || 0), 0);

  const nextCron = cronJobs.find((j) => j.status === "active") || cronJobs[0];

  const stats = [
    { label: "AI Models", value: models.length, icon: "🧠" },
    { label: "Integrations", value: integrations.length, icon: "🔗" },
    { label: "Cron Jobs", value: cronJobs.length, icon: "⏰" },
    { label: "Channels", value: channels.length, icon: "📡" },
    { label: "Session Life", value: "365d", icon: "♾️" },
  ];

  return (
    <>
      <Head><title>Command Center — OpenClaw</title></Head>
      <div style={s.page}>
        <NavigationSidebar />
        <div style={s.main}>
          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>OpenClaw — Personal AI Agent</h1>
              <div style={s.subtitle}>Full Configuration Overview</div>
            </div>
            <div style={s.clock}>
              <div style={s.clockTime}>{fmt(time)}</div>
              <div style={s.clockDate}>{fmtDate(time)}</div>
              <button style={s.ccBtn}>⚡ Command Center →</button>
            </div>
          </div>

          {/* Next Cron Banner */}
          <div style={s.cronBanner}>
            <div>
              <div style={s.cronLabel}>Next Cron Job</div>
              <div style={s.cronName}>{nextCron?.name || "—"}</div>
              <div style={s.cronSched}>{nextCron?.schedule || ""}</div>
            </div>
            <div style={s.cronRuns}>
              <div style={s.cronRunsLabel}>Status</div>
              <div style={{ ...s.cronRunsVal, fontSize: "20px", marginTop: "4px" }}>
                {nextCron?.status || "—"}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div style={s.statsRow}>
            {stats.map((st) => (
              <div key={st.label} style={s.statCard}>
                <div style={s.statIcon}>{st.icon}</div>
                <div style={s.statVal}>{loading ? "—" : st.value}</div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* Two Columns */}
          <div style={s.cols}>
            {/* LEFT */}
            <div>
              {/* AI API Keys */}
              <div style={s.card}>
                <div style={s.cardTitle}>🔑 AI API Keys</div>
                {apiKeys.length === 0 && <div style={s.empty}>No API keys configured.</div>}
                {apiKeys.map((k) => (
                  <div key={k.id} style={s.row}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={s.dot(k.status === "connected" ? "green" : "yellow")} />
                        <div style={s.rowName}>{k.name}</div>
                      </div>
                      <div style={{ ...s.rowSub, marginLeft: "15px" }}>{k.key_masked}</div>
                    </div>
                    <span style={s.badge(k.status === "connected" ? "green" : "yellow")}>{k.status}</span>
                  </div>
                ))}
              </div>

              {/* API Spend */}
              <div style={s.card}>
                <div style={s.cardTitle}>💰 API Spend (This Month)</div>
                {apiKeys.length === 0 && <div style={s.empty}>No spend data.</div>}
                {apiKeys.map((a) => (
                  <div key={a.id} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "500", color: "#e2e8f0" }}>
                      <span>{a.name}</span>
                      <span style={{ color: "#38bdf8" }}>${Number(a.spent).toFixed(2)} / ${a.budget}</span>
                    </div>
                    <div style={s.progressBar}>
                      <div style={{ width: `${a.budget > 0 ? Math.min((a.spent / a.budget) * 100, 100) : 0}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #38bdf8)", borderRadius: "2px" }} />
                    </div>
                  </div>
                ))}
                {apiKeys.length > 0 && (
                  <div style={{ textAlign: "right", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                    Total: <span style={{ color: "#38bdf8", fontWeight: "600" }}>${totalSpent.toFixed(2)} / ${totalBudget}</span>
                  </div>
                )}
              </div>

              {/* AI Model Stack */}
              <div style={s.card}>
                <div style={s.cardTitle}>🧠 AI Model Stack</div>
                {models.length === 0 && <div style={s.empty}>No models configured.</div>}
                {models.map((m) => (
                  <div key={m.id} style={s.row}>
                    <div>
                      <div style={s.rowName}>{m.name}</div>
                      <div style={s.rowSub}>{m.provider}</div>
                    </div>
                    <span style={s.badge(m.status === "active" ? "green" : "blue")}>{m.status}</span>
                  </div>
                ))}
              </div>

              {/* Cron Jobs */}
              <div style={s.card}>
                <div style={s.cardTitle}>🤖 Automated Cron Jobs</div>
                {cronJobs.length === 0 && <div style={s.empty}>No cron jobs configured.</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {cronJobs.map((j) => (
                    <div key={j.id} style={{ ...s.row, marginBottom: 0 }}>
                      <div>
                        <div style={s.rowName}>{j.name}</div>
                        <div style={s.rowSub}>{j.schedule}</div>
                      </div>
                      <div style={s.dot(j.status === "active" ? "green" : "yellow")} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div>
              {/* Tasks */}
              <div style={s.card}>
                <div style={s.cardTitle}>📋 Tasks</div>
                <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "600", marginBottom: "6px" }}>
                  ● In Progress ({inProgress.length})
                </div>
                {inProgress.length === 0 && <div style={s.empty}>None.</div>}
                {inProgress.map((t) => (
                  <div key={t.id} style={{ padding: "6px 0", fontSize: "13px", color: "#e2e8f0", display: "flex", alignItems: "center" }}>
                    {t.title}
                    {t.priority && <span style={s.priorityBadge(t.priority)}>{t.priority}</span>}
                  </div>
                ))}
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", margin: "10px 0 6px" }}>
                  ● Backlog ({backlog.length})
                </div>
                {backlog.length === 0 && <div style={s.empty}>None.</div>}
                {backlog.map((t) => (
                  <div key={t.id} style={{ padding: "6px 0", fontSize: "13px", color: "#e2e8f0", display: "flex", alignItems: "center" }}>
                    {t.title}
                    {t.priority && <span style={s.priorityBadge(t.priority)}>{t.priority}</span>}
                  </div>
                ))}
                <div style={{ fontSize: "11px", color: "#22c55e", fontWeight: "600", margin: "10px 0 6px" }}>
                  ● Done ({done.length})
                </div>
                {done.length === 0 && <div style={s.empty}>None.</div>}
                {done.map((t) => (
                  <div key={t.id} style={{ padding: "6px 0", fontSize: "13px", color: "#475569", textDecoration: "line-through" }}>
                    {t.title}
                  </div>
                ))}
              </div>

              {/* Connected Channels */}
              <div style={s.card}>
                <div style={s.cardTitle}>📡 Connected Channels</div>
                {channels.length === 0 && <div style={s.empty}>No channels connected.</div>}
                {channels.map((c) => (
                  <div key={c.id} style={s.row}>
                    <div>
                      <div style={s.rowName}>{c.name}</div>
                      <div style={s.rowSub}>{c.subtitle}</div>
                    </div>
                    <span style={s.badge(c.status === "connected" ? "green" : "yellow")}>{c.status}</span>
                  </div>
                ))}
              </div>

              {/* 3rd Party Integrations */}
              <div style={s.card}>
                <div style={s.cardTitle}>🔌 3rd Party Integrations</div>
                {integrations.length === 0 && <div style={s.empty}>No integrations configured.</div>}
                {integrations.map((i) => (
                  <div key={i.id} style={s.row}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={s.dot("green")} />
                      <div>
                        <div style={s.rowName}>{i.name}</div>
                        <div style={s.rowSub}>{i.key_masked}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Features */}
              <div style={s.card}>
                <div style={s.cardTitle}>⚡ Key Features</div>
                {features.length === 0 && <div style={s.empty}>No features listed.</div>}
                <div>
                  {features.map((f) => (
                    <span key={f.id} style={s.tag}>{f.name}</span>
                  ))}
                </div>
              </div>

              {/* Logo */}
              <div style={{ ...s.card, textAlign: "center", padding: "24px" }}>
                <div style={{ fontSize: "48px", marginBottom: "8px" }}>🦞</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#e2e8f0" }}>OpenClaw</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Personal AI Agent</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAuth(CommandCenter);
