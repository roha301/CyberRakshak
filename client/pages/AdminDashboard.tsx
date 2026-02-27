import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  AlertTriangle,
  Shield,
  TrendingUp,
  CalendarDays,
  Activity,
  ListChecks,
} from "lucide-react";
import { ScamAlert } from "@shared/api";

interface ReportStatsResponse {
  total: number;
  byType: Record<string, number>;
  byMonth: Record<string, number>;
  averagePerMonth: number;
}

interface RecentReportsResponse {
  totalReports: number;
  commonTypes: { type: string; count: number }[];
  recentTrends: string;
  lastUpdated: string;
}

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [stats, setStats] = useState<ReportStatsResponse | null>(null);
  const [recent, setRecent] = useState<RecentReportsResponse | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [refreshAt, setRefreshAt] = useState<string>(new Date().toISOString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [alertsRes, statsRes, recentRes] = await Promise.all([
        fetch("/api/live-alerts"),
        fetch("/api/scam-report-stats"),
        fetch("/api/recent-reports"),
      ]);

      const alertsPayload = alertsRes.ok ? await alertsRes.json() : { data: [] };
      const statsPayload = statsRes.ok ? await statsRes.json() : null;
      const recentPayload = recentRes.ok ? await recentRes.json() : null;

      setAlerts(Array.isArray(alertsPayload.data) ? alertsPayload.data : []);
      setStats(statsPayload);
      setRecent(recentPayload);
      setRefreshAt(new Date().toISOString());
    } catch {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  const filteredAlerts = useMemo(() => {
    if (severityFilter === "all") return alerts;
    return alerts.filter((alert) => alert.severity === severityFilter);
  }, [alerts, severityFilter]);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const topScamType =
    stats && Object.keys(stats.byType).length > 0
      ? Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0][0]
      : "N/A";

  return (
    <div
      className="min-h-screen pt-24 pb-12 bg-background bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(rgba(5, 12, 24, 0.9), rgba(5, 12, 24, 0.92)), url('/admin-dashboard-bg.jpg')",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <LayoutDashboard className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-foreground/70">
                Monitor alerts, scam trends, and reporting activity in real time.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              Last refresh: {new Date(refreshAt).toLocaleTimeString()}
            </span>
            <button
              onClick={() => void loadDashboardData()}
              className="px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition"
            >
              Refresh Data
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<AlertTriangle size={18} />}
            label="Active Alerts"
            value={loading ? "..." : String(alerts.length)}
            tone="red"
          />
          <StatCard
            icon={<Shield size={18} />}
            label="Critical + High"
            value={loading ? "..." : String(criticalCount + highCount)}
            tone="orange"
          />
          <StatCard
            icon={<Activity size={18} />}
            label="Total Reports"
            value={loading ? "..." : String(stats?.total ?? 0)}
            tone="cyan"
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Top Scam Type"
            value={loading ? "..." : topScamType}
            tone="blue"
          />
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-2 card-gradient border border-cyan-500/20 p-5 rounded-xl"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ListChecks size={18} className="text-cyan-300" />
                Live Alert Queue
              </h2>
              <div className="flex items-center gap-2">
                {(["all", "critical", "high", "medium", "low"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSeverityFilter(level)}
                    className={`px-2.5 py-1 rounded-md text-xs border transition ${
                      severityFilter === level
                        ? "bg-cyan-500 text-black border-cyan-400"
                        : "border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                    }`}
                  >
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {!loading && filteredAlerts.length === 0 && (
                <p className="text-foreground/60 text-sm">No alerts match the current filter.</p>
              )}
              {loading && <p className="text-foreground/60 text-sm">Loading alerts...</p>}
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg bg-black/30 border border-cyan-500/15 hover:border-cyan-500/35 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{alert.title}</h3>
                      <p className="text-sm text-foreground/70 mt-1">{alert.description}</p>
                    </div>
                    <span
                      className={`text-xs uppercase px-2 py-1 rounded ${
                        alert.severity === "critical"
                          ? "bg-red-500/20 text-red-300"
                          : alert.severity === "high"
                            ? "bg-orange-500/20 text-orange-300"
                            : alert.severity === "medium"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/70">
                    <span className="px-2 py-1 rounded bg-white/5">{alert.type}</span>
                    <span className="px-2 py-1 rounded bg-white/5">{alert.targetAudience}</span>
                    <span className="px-2 py-1 rounded bg-white/5">
                      {alert.reportedCases.toLocaleString()} reports
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-6"
          >
            <section className="card-gradient border border-cyan-500/20 p-5 rounded-xl">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CalendarDays size={17} className="text-cyan-300" />
                Monthly Reports
              </h2>
              <div className="space-y-2">
                {!loading &&
                  stats &&
                  Object.entries(stats.byMonth)
                    .sort(([a], [b]) => (a > b ? -1 : 1))
                    .slice(0, 5)
                    .map(([month, count]) => (
                      <div key={month} className="flex items-center justify-between text-sm">
                        <span className="text-foreground/70">{month}</span>
                        <span className="font-semibold text-cyan-300">{count}</span>
                      </div>
                    ))}
                {loading && <p className="text-sm text-foreground/60">Loading monthly metrics...</p>}
              </div>
            </section>

            <section className="card-gradient border border-cyan-500/20 p-5 rounded-xl">
              <h2 className="text-lg font-bold mb-3">Common Scam Types</h2>
              <div className="space-y-2">
                {!loading &&
                  recent?.commonTypes?.slice(0, 5).map((item) => (
                    <div key={item.type} className="flex items-center justify-between text-sm">
                      <span className="text-foreground/70">{item.type}</span>
                      <span className="font-semibold text-cyan-300">{item.count}</span>
                    </div>
                  ))}
                {loading && <p className="text-sm text-foreground/60">Loading trend data...</p>}
              </div>
            </section>

            <section className="card-gradient border border-cyan-500/20 p-5 rounded-xl">
              <h2 className="text-lg font-bold mb-2">Trend Note</h2>
              <p className="text-sm text-foreground/75">{recent?.recentTrends ?? "No trend summary available yet."}</p>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "red" | "orange" | "cyan" | "blue";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-500/25 bg-red-500/10 text-red-300"
      : tone === "orange"
        ? "border-orange-500/25 bg-orange-500/10 text-orange-300"
        : tone === "blue"
          ? "border-blue-500/25 bg-blue-500/10 text-blue-300"
          : "border-cyan-500/25 bg-cyan-500/10 text-cyan-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 border ${toneClass}`}
    >
      <div className="flex items-center gap-2 text-sm mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground break-words">{value}</p>
    </motion.div>
  );
}
