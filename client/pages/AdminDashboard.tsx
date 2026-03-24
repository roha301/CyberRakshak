import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Shield, AlertTriangle, BarChart3, LogOut, Eye, EyeOff } from "lucide-react";

type AdminTab =
  | "dashboard"
  | "reports"
  | "alerts"
  | "analytics";

const ADMIN_TOKEN_KEY = "cyber_admin_token";

type AdminReport = {
  id: string;
  reporterName?: string;
  reporterAge?: number;
  type: string;
  description: string;
  userId: string;
  screenshotBase64?: string;
  timestamp: string;
  moderationStatus: "pending" | "approved" | "rejected" | "investigating";
  authenticity: "unverified" | "verified" | "suspected-fake";
  moderatorNote?: string;
};

type AdminAlert = {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  targetAudience: string;
  timestamp: string;
};

type AdminUser = {
  id: string;
  reportCount: number;
  quizAttempts: number;
  aiQueries: number;
  lastActivity: string;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [newAlert, setNewAlert] = useState({
    title: "",
    description: "",
    severity: "medium",
    type: "",
    targetAudience: "",
  });

  useEffect(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }, []);

  async function verifySession(sessionToken: string) {
    try {
      const response = await fetch("/api/admin/session", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await response.json();
      if (data.active) {
        setLoggedIn(true);
        await loadAllData(sessionToken);
      }
    } catch {
      // session invalid
    }
  }

  function authHeaders(sessionToken = token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    };
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
      if (!response.ok) throw new Error(data.error || "Login failed");
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
    setToken("");
    setLoggedIn(false);
  }

  async function loadAllData(sessionToken = token) {
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      const headers = authHeaders(sessionToken);
      const [dRes, uRes, rRes, aRes, anRes] = await Promise.all([
        fetch("/api/admin/dashboard", { headers }),
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/reports", { headers }),
        fetch("/api/admin/alerts", { headers }),
        fetch("/api/admin/analytics", { headers }),
      ]);

      if ([dRes, uRes, rRes, aRes].some((res) => res.status === 401)) {
        throw new Error("Session expired. Please login again.");
      }

      setDashboard(await dRes.json());
      setUsers((await uRes.json()).data || []);
      setReports((await rRes.json()).data || []);
      setAlerts((await aRes.json()).data || []);
      setAnalytics(await anRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function updateReport(reportId: string, payload: Partial<AdminReport>) {
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    await loadAllData();
  }

  async function createAlert() {
    await fetch("/api/admin/alerts", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newAlert),
    });
    setNewAlert({ title: "", description: "", severity: "medium", type: "", targetAudience: "" });
    await loadAllData();
  }

  async function deleteAlert(id: string) {
    await fetch(`/api/admin/alerts/${id}`, { method: "DELETE", headers: authHeaders() });
    await loadAllData();
  }

  async function editAlert(alert: AdminAlert) {
    const title = window.prompt("Edit alert title", alert.title);
    if (!title) return;
    const description = window.prompt("Edit alert description", alert.description);
    if (!description) return;
    await fetch(`/api/admin/alerts/${alert.id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ title, description }),
    });
    await loadAllData();
  }

  const reportStatusCounts = useMemo(
    () =>
      reports.reduce<Record<string, number>>((acc, report) => {
        acc[report.moderationStatus] = (acc[report.moderationStatus] || 0) + 1;
        return acc;
      }, {}),
    [reports]
  );

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-md mx-auto px-4">
          <div className="card-gradient p-6 rounded-xl border border-cyan-500/20">
            <div className="text-center mb-5">
              <Shield className="w-10 h-10 text-cyan-300 mx-auto mb-2" />
              <h1 className="text-2xl font-bold">Admin Login</h1>
              <p className="text-sm text-foreground/70">CyberRakshak control panel</p>
            </div>
            <div className="space-y-3">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full rounded-lg bg-black/30 border border-cyan-500/20 p-3"
              />
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <p className="text-xs text-foreground/50 mt-1">
                Please type your admin username and password.
              </p>
              <div className="bg-black/20 border border-cyan-500/10 rounded-lg px-3 py-2 text-xs text-foreground/60 space-y-1">
                <p>🔑 <span className="text-cyan-300/80">Username:</span> CyberRakshak_21</p>
                <p>🔒 <span className="text-cyan-300/80">Password:</span> CyberRakshak@1234</p>
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-gradient p-4 rounded-xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-foreground/70 text-sm">Complete platform control center</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadAllData()} className="px-3 py-2 rounded-lg border border-cyan-500/30 text-cyan-300">
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
        {loading && <p className="text-foreground/70 text-sm">Loading admin data...</p>}

        <div className="flex flex-wrap gap-2">
          {[
            { key: "dashboard", label: "Dashboard", icon: BarChart3 },
            { key: "reports", label: "Reports", icon: AlertTriangle },
            { key: "alerts", label: "Threat Alerts", icon: AlertTriangle },
            { key: "analytics", label: "Analytics", icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key as AdminTab)}
                className={`px-3 py-2 rounded-lg border text-sm inline-flex items-center gap-2 ${
                  tab === item.key
                    ? "bg-cyan-500 text-black border-cyan-400"
                    : "border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                }`}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "dashboard" && (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard title="Total Scam Reports" value={String(dashboard?.metrics?.totalScamReports || 0)} />
            <MetricCard title="Active Users" value={String(dashboard?.metrics?.activeUsers || 0)} />
            <MetricCard title="Quiz Participation %" value={String(dashboard?.metrics?.quizParticipationRate || 0)} />
            <MetricCard title="API Errors" value={String(dashboard?.metrics?.apiErrors || 0)} />
          </div>
        )}

        {tab === "reports" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-4 gap-3">
              <MetricCard title="Pending" value={String(reportStatusCounts.pending || 0)} />
              <MetricCard title="Approved" value={String(reportStatusCounts.approved || 0)} />
              <MetricCard title="Rejected" value={String(reportStatusCounts.rejected || 0)} />
              <MetricCard title="Investigating" value={String(reportStatusCounts.investigating || 0)} />
            </div>
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="card-gradient p-4 rounded-xl border border-cyan-500/20">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 mr-4">
                      <p className="font-semibold">{report.type}</p>
                      <p className="text-sm text-foreground/70">{report.description}</p>
                      <div className="text-xs text-foreground/50 mt-2 space-y-1">
                        <p>{report.id} | {new Date(report.timestamp).toLocaleString()}</p>
                        {(report.reporterName || report.reporterAge) && (
                          <p>
                            Reporter Details: {report.reporterName || "N/A"} {report.reporterAge ? `(${report.reporterAge} yrs)` : ""}
                          </p>
                        )}
                        <p>User ID: {report.userId}</p>
                      </div>
                      
                      {report.screenshotBase64 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold mb-1 text-cyan-300">Screenshot:</p>
                          <img src={report.screenshotBase64} alt="Scam Screenshot" className="max-w-xs rounded border border-cyan-500/20 shadow" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                       <button className="px-2 py-1 rounded border border-green-500/30 text-green-300 hover:bg-green-500/10 transition" onClick={() => updateReport(report.id, { moderationStatus: "approved", authenticity: "verified" })}>Approve</button>
                       <button className="px-2 py-1 rounded border border-red-500/30 text-red-300 hover:bg-red-500/10 transition" onClick={() => updateReport(report.id, { moderationStatus: "rejected", authenticity: "suspected-fake" })}>Reject</button>
                       <button className="px-2 py-1 rounded border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 transition" onClick={() => updateReport(report.id, { moderationStatus: "investigating" })}>Investigate</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="card-gradient p-4 rounded-xl border border-cyan-500/20 space-y-2">
              <h2 className="font-bold">Create Threat Alert</h2>
              <input className="w-full rounded-lg bg-black/30 border border-cyan-500/20 p-2" placeholder="Title" value={newAlert.title} onChange={(e) => setNewAlert((p) => ({ ...p, title: e.target.value }))} />
              <textarea className="w-full rounded-lg bg-black/30 border border-cyan-500/20 p-2" placeholder="Description" value={newAlert.description} onChange={(e) => setNewAlert((p) => ({ ...p, description: e.target.value }))} />
              <input className="w-full rounded-lg bg-black/30 border border-cyan-500/20 p-2" placeholder="Type" value={newAlert.type} onChange={(e) => setNewAlert((p) => ({ ...p, type: e.target.value }))} />
              <input className="w-full rounded-lg bg-black/30 border border-cyan-500/20 p-2" placeholder="Target Audience" value={newAlert.targetAudience} onChange={(e) => setNewAlert((p) => ({ ...p, targetAudience: e.target.value }))} />
              <select className="w-full rounded-lg bg-black/30 border border-cyan-500/20 p-2" value={newAlert.severity} onChange={(e) => setNewAlert((p) => ({ ...p, severity: e.target.value as "low" | "medium" | "high" | "critical" }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <button onClick={createAlert} className="px-3 py-2 rounded-lg bg-cyan-500 text-black font-semibold">Publish Alert</button>
            </div>
            <div className="lg:col-span-2 space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="card-gradient p-4 rounded-xl border border-cyan-500/20 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-sm text-foreground/70">{alert.description}</p>
                    <p className="text-xs text-foreground/50 mt-1">{alert.type} | {alert.targetAudience}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => editAlert(alert)} className="px-2 py-1 rounded border border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-500/10 transition">Edit</button>
                    <button onClick={() => deleteAlert(alert.id)} className="px-2 py-1 rounded border border-red-500/30 text-red-300 text-xs hover:bg-red-500/10 transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div className="card-gradient p-5 rounded-xl border border-cyan-500/20">
            <h2 className="text-xl font-bold mb-3">Analytics & Monitoring</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
              <MetricCard title="Total Scam Reports" value={String(analytics?.totalScamReports || 0)} />
              <MetricCard title="Active Users" value={String(analytics?.activeUsers || 0)} />
              <MetricCard title="Quiz Participation %" value={String(analytics?.quizParticipationRate || 0)} />
              <MetricCard title="AI Queries" value={String(analytics?.aiQueries || 0)} />
            </div>
            <div className="space-y-2">
              {(analytics?.commonScamTypes || []).map((item: any) => (
                <div key={item.type} className="flex justify-between p-2 border border-cyan-500/20 rounded">
                  <span>{item.type}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
