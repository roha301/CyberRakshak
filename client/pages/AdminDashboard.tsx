import { motion } from "framer-motion";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const ADMIN_TOKEN_KEY = "cyber_admin_token";

type AdminReportStatus = "pending" | "approved" | "rejected" | "investigating";
type AdminAuthenticity = "unverified" | "verified" | "suspected-fake";
type ReportFilter = "all" | AdminReportStatus;

type AdminReport = {
  id: string;
  reporterName?: string;
  reporterEmail: string;
  reporterAge?: number;
  type: string;
  description: string;
  userId: string;
  screenshotBase64?: string;
  timestamp: string;
  incidentDate?: string;
  amount?: number;
  url?: string;
  email?: string;
  phoneNumber?: string;
  reportedTo?: string;
  moderationStatus: AdminReportStatus;
  authenticity: AdminAuthenticity;
  moderatorNote?: string;
  moderatedAt?: string;
};

type DashboardData = {
  metrics?: {
    totalScamReports?: number;
    pendingReports?: number;
    reviewedReports?: number;
    aiQueries?: number;
    activeAlerts?: number;
  };
  reportStatusCounts?: Record<string, number>;
  commonScamTypes?: Array<{ type: string; count: number }>;
  recentReports?: AdminReport[];
  approvedHistory?: Array<{
    id: number;
    reportId: string;
    action: string;
    authenticity: AdminAuthenticity;
    moderatorNote: string;
    timestamp: string;
    type: string;
    description: string;
    reporterEmail: string;
  }>;
};

export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!storedToken) return;
    setToken(storedToken);
    verifySession(storedToken);
  }, []);

  function authHeaders(sessionToken = token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    };
  }

  async function verifySession(sessionToken: string) {
    try {
      const response = await fetch("/api/admin/session", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await response.json();
      if (!response.ok || !data.authenticated) {
        throw new Error("Session expired. Please login again.");
      }
      setLoggedIn(true);
      setError(null);
      await loadAllData(sessionToken);
    } catch (err) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setToken("");
      setLoggedIn(false);
      setError(err instanceof Error ? err.message : "Unable to verify admin session");
    }
  }

  async function handleLogin() {
    setError(null);
    setAuthLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.message || data.error || "Login failed");
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setToken(data.token);
      setLoggedIn(true);
      await loadAllData(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (token) {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: authHeaders(),
      }).catch(() => undefined);
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setLoggedIn(false);
    setDashboard(null);
    setReports([]);
    setError(null);
  }

  async function loadAllData(sessionToken = token) {
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      const headers = authHeaders(sessionToken);
      const [dashboardRes, reportsRes] = await Promise.all([
        fetch("/api/admin/dashboard", { headers }),
        fetch("/api/admin/reports", { headers }),
      ]);

      if ([dashboardRes, reportsRes].some((response) => response.status === 401)) {
        throw new Error("Session expired. Please login again.");
      }

      const dashboardData = await dashboardRes.json();
      const reportsData = await reportsRes.json();

      if (!dashboardRes.ok) {
        throw new Error(dashboardData.error || "Failed to load dashboard");
      }
      if (!reportsRes.ok) {
        throw new Error(reportsData.error || "Failed to load reports");
      }

      setDashboard(dashboardData);
      setReports(reportsData.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load admin data";
      if (message.includes("Session expired")) {
        await handleLogout();
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function updateReport(reportId: string, payload: Partial<AdminReport>) {
    setActionId(reportId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update report");
      }
      await loadAllData();
      const nextStatus = payload.moderationStatus || "updated";
      toast.success(`Report ${reportId} marked as ${capitalize(nextStatus)}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update report";
      setError(message);
      toast.error(message);
    } finally {
      setActionId(null);
    }
  }

  const statusCounts = useMemo(() => {
    if (dashboard?.reportStatusCounts) {
      return dashboard.reportStatusCounts;
    }
    return reports.reduce<Record<string, number>>((acc, report) => {
      acc[report.moderationStatus] = (acc[report.moderationStatus] || 0) + 1;
      return acc;
    }, {});
  }, [dashboard, reports]);

  const commonScamTypes = useMemo(() => {
    if (dashboard?.commonScamTypes?.length) {
      return dashboard.commonScamTypes;
    }

    const counts = reports.reduce<Record<string, number>>((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((left, right) => right.count - left.count);
  }, [dashboard, reports]);

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesStatus =
        statusFilter === "all" ? true : report.moderationStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;

      return [
        report.id,
        report.type,
        report.description,
        report.reporterName,
        report.reporterEmail,
        report.email,
        report.phoneNumber,
        report.url,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [reports, searchQuery, statusFilter]);

  const approvedHistory = useMemo(() => {
    if (dashboard?.approvedHistory?.length) {
      return dashboard.approvedHistory;
    }
    return reports
      .filter((report) => report.moderationStatus === "approved")
      .sort(
        (left, right) =>
          new Date(right.moderatedAt || right.timestamp).getTime() -
          new Date(left.moderatedAt || left.timestamp).getTime(),
      )
      .slice(0, 8)
      .map((report, index) => ({
        id: index + 1,
        reportId: report.id,
        action: "approved",
        authenticity: report.authenticity,
        moderatorNote: report.moderatorNote || "",
        timestamp: report.moderatedAt || report.timestamp,
        type: report.type,
        description: report.description,
        reporterEmail: report.reporterEmail,
      }));
  }, [dashboard, reports]);

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-md mx-auto px-4">
          <div className="card-gradient p-6 rounded-xl border border-cyan-500/20">
            <div className="text-center mb-5">
              <Shield className="w-10 h-10 text-cyan-300 mx-auto mb-2" />
              <h1 className="text-2xl font-bold">Admin Login</h1>
              <p className="text-sm text-foreground/70">CyberRakshak report review console</p>
            </div>
            <div className="space-y-3">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                className="w-full rounded-lg bg-black/30 border border-cyan-500/20 p-3"
              />
              <div className="relative">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg bg-black/30 border border-cyan-500/20 p-3 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-foreground/70 hover:text-cyan-300 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-foreground/55">
                Sign in to review scam reports and update their moderation status.
              </p>
              <div className="rounded-lg border border-cyan-500/20 bg-black/20 px-3 py-3 text-xs text-foreground/70 space-y-1">
                <p>
                  Admin Username: <span className="text-cyan-300">CyberRakshak_21</span>
                </p>
                <p>
                  Admin Password: <span className="text-cyan-300">CyberRakshak@1234</span>
                </p>
              </div>
              {error && <p className="text-red-300 text-sm">{error}</p>}
              <button
                onClick={handleLogin}
                disabled={authLoading}
                className="w-full bg-cyan-500 text-black font-semibold rounded-lg py-3 hover:bg-cyan-400 transition disabled:opacity-60"
              >
                {authLoading ? "Signing in..." : "Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-gradient p-4 rounded-xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-foreground/70 text-sm">
              Review submitted scam reports and keep moderation up to date.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadAllData()}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-cyan-500/30 text-cyan-300 inline-flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg border border-red-500/30 text-red-300 inline-flex items-center gap-2"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </motion.div>

        {error && <p className="text-red-300 text-sm">{error}</p>}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Total Reports"
            value={String(dashboard?.metrics?.totalScamReports ?? reports.length)}
          />
          <MetricCard title="Pending" value={String(statusCounts.pending || 0)} />
          <MetricCard title="Investigating" value={String(statusCounts.investigating || 0)} />
          <MetricCard title="Approved" value={String(statusCounts.approved || 0)} />
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <section className="space-y-4">
            <div className="card-gradient p-4 rounded-xl border border-cyan-500/20 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Reported Scams</h2>
                  <p className="text-sm text-foreground/65">
                    {filteredReports.length} of {reports.length} report
                    {reports.length === 1 ? "" : "s"} shown
                  </p>
                </div>
                <div className="relative min-w-[240px]">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/45"
                  />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by ID, type, name or description"
                    className="w-full rounded-lg bg-black/30 border border-cyan-500/20 py-2 pl-9 pr-3"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["all", "pending", "investigating", "approved", "rejected"] as ReportFilter[]).map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-2 rounded-lg border text-sm transition ${
                        statusFilter === filter
                          ? "bg-cyan-500 text-black border-cyan-400"
                          : "border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                      }`}
                    >
                      {filter === "all"
                        ? "All"
                        : `${capitalize(filter)} (${statusCounts[filter] || 0})`}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-4">
              {filteredReports.length === 0 && (
                <div className="card-gradient p-6 rounded-xl border border-cyan-500/20 text-sm text-foreground/65">
                  No scam reports match the current filters.
                </div>
              )}

              {filteredReports.map((report) => (
                <article
                  key={report.id}
                  className="card-gradient p-5 rounded-xl border border-cyan-500/20 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-lg">{report.type}</p>
                        <StatusBadge status={report.moderationStatus} />
                        <AuthenticityBadge authenticity={report.authenticity} />
                      </div>
                      <p className="text-sm text-foreground/60">
                        {report.id} | Submitted {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        label={report.moderationStatus === "approved" ? "Approved" : "Approve"}
                        tone="success"
                        loading={actionId === report.id}
                        disabled={actionId === report.id || report.moderationStatus === "approved"}
                        onClick={() =>
                          updateReport(report.id, {
                            moderationStatus: "approved",
                            authenticity: "verified",
                          })
                        }
                      />
                      <ActionButton
                        label={
                          report.moderationStatus === "investigating"
                            ? "Investigating"
                            : "Investigate"
                        }
                        tone="warning"
                        loading={actionId === report.id}
                        disabled={
                          actionId === report.id || report.moderationStatus === "investigating"
                        }
                        onClick={() =>
                          updateReport(report.id, {
                            moderationStatus: "investigating",
                          })
                        }
                      />
                      <ActionButton
                        label={report.moderationStatus === "rejected" ? "Rejected" : "Reject"}
                        tone="danger"
                        loading={actionId === report.id}
                        disabled={actionId === report.id || report.moderationStatus === "rejected"}
                        onClick={() =>
                          updateReport(report.id, {
                            moderationStatus: "rejected",
                            authenticity: "suspected-fake",
                          })
                        }
                      />
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-foreground/90">{report.description}</p>

                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
                    <MetaItem label="Reporter" value={report.reporterName || "Anonymous"} />
                    <MetaItem label="Reporter Email" value={report.reporterEmail || "N/A"} />
                    <MetaItem label="Age" value={report.reporterAge ? String(report.reporterAge) : "N/A"} />
                    <MetaItem label="User ID" value={report.userId || "anonymous"} />
                    <MetaItem
                      label="Incident Date"
                      value={report.incidentDate ? new Date(report.incidentDate).toLocaleDateString() : "N/A"}
                    />
                    <MetaItem
                      label="Amount Lost"
                      value={
                        typeof report.amount === "number"
                          ? report.amount.toLocaleString()
                          : "N/A"
                      }
                    />
                    <MetaItem label="Reported To" value={report.reportedTo || "N/A"} />
                    <MetaItem label="Suspicious URL" value={report.url || "N/A"} />
                    <MetaItem label="Email" value={report.email || "N/A"} />
                    <MetaItem label="Phone" value={report.phoneNumber || "N/A"} />
                  </div>

                  {report.moderatedAt && (
                    <div className="rounded-lg border border-cyan-500/15 bg-black/20 px-3 py-2 text-sm text-foreground/75">
                      Last moderation update: {new Date(report.moderatedAt).toLocaleString()}
                    </div>
                  )}

                  {report.screenshotBase64 && (
                    <div>
                      <p className="text-xs font-semibold mb-2 text-cyan-300">Attached Screenshot</p>
                      <img
                        src={report.screenshotBase64}
                        alt={`Screenshot for ${report.id}`}
                        className="max-h-72 rounded-lg border border-cyan-500/20"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="card-gradient p-4 rounded-xl border border-cyan-500/20">
              <h2 className="text-lg font-bold mb-3">Most Reported Types</h2>
              <div className="space-y-2">
                {commonScamTypes.slice(0, 5).map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between rounded-lg border border-cyan-500/15 bg-black/20 px-3 py-2 text-sm"
                  >
                    <span>{item.type}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
                {commonScamTypes.length === 0 && (
                  <p className="text-sm text-foreground/60">No report trends available yet.</p>
                )}
              </div>
            </div>

            <div className="card-gradient p-4 rounded-xl border border-cyan-500/20">
              <h2 className="text-lg font-bold mb-3">Approved History</h2>
              <div className="space-y-3">
                {approvedHistory.map((item) => (
                  <div
                    key={`${item.reportId}-${item.id}`}
                    className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-green-200">{item.type}</p>
                      <span className="text-xs text-green-100/80">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-foreground/80 line-clamp-3">{item.description}</p>
                    <p className="mt-2 text-xs text-foreground/60">
                      {item.reportId} | {item.reporterEmail || "No reporter email"}
                    </p>
                  </div>
                ))}
                {approvedHistory.length === 0 && (
                  <p className="text-sm text-foreground/60">
                    Approved reports will appear here once moderation is completed.
                  </p>
                )}
              </div>
            </div>

            <div className="card-gradient p-4 rounded-xl border border-cyan-500/20">
              <h2 className="text-lg font-bold mb-3">Moderation Notes</h2>
              <div className="space-y-3 text-sm text-foreground/70">
                <p>Approve reports that look genuine and contain enough incident detail.</p>
                <p>Move uncertain cases to investigating instead of rejecting them immediately.</p>
                <p>Reject only when the report is clearly spam, empty, or obviously fake.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="card-gradient p-4 rounded-xl border border-cyan-500/20">
      <p className="text-sm text-foreground/70">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan-500/15 bg-black/20 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-foreground/45">{label}</p>
      <p className="mt-1 break-words text-foreground/90">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminReportStatus }) {
  const styles: Record<AdminReportStatus, string> = {
    pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
    investigating: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
    approved: "border-green-500/30 bg-green-500/10 text-green-200",
    rejected: "border-red-500/30 bg-red-500/10 text-red-200",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {capitalize(status)}
    </span>
  );
}

function AuthenticityBadge({ authenticity }: { authenticity: AdminAuthenticity }) {
  const config: Record<
    AdminAuthenticity,
    { icon: ReactNode; label: string; className: string }
  > = {
    unverified: {
      icon: <AlertTriangle size={14} />,
      label: "Unverified",
      className: "border-slate-500/30 bg-slate-500/10 text-slate-200",
    },
    verified: {
      icon: <ShieldCheck size={14} />,
      label: "Verified",
      className: "border-green-500/30 bg-green-500/10 text-green-200",
    },
    "suspected-fake": {
      icon: <XCircle size={14} />,
      label: "Suspected Fake",
      className: "border-red-500/30 bg-red-500/10 text-red-200",
    },
  };

  const item = config[authenticity];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${item.className}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
}

function ActionButton({
  label,
  tone,
  onClick,
  disabled,
  loading,
}: {
  label: string;
  tone: "success" | "warning" | "danger";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const classes = {
    success: "border-green-500/30 text-green-300 hover:bg-green-500/10",
    warning: "border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10",
    danger: "border-red-500/30 text-red-300 hover:bg-red-500/10",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg border text-sm transition disabled:opacity-50 ${classes[tone]}`}
    >
      {loading ? "Saving..." : label}
    </button>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
