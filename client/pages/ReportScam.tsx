import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { FileText, Send, Search, PhoneCall, AlertCircle, CheckCircle2 } from "lucide-react";
import { ScamReportInput, ScamReportResponse } from "@shared/api";

interface RecommendationsResponse {
  type: string;
  recommendations: string[];
  contactNumbers: Record<string, string>;
}

interface ReportStatsResponse {
  total: number;
  byType: Record<string, number>;
}

interface ReportStatusResponse {
  reportId: string;
  status: string;
  submittedDate: string;
  description: string;
  type: string;
}

const scamTypes = [
  "Phishing",
  "UPI Fraud",
  "Identity Theft",
  "Job Scam",
  "SMS Fraud",
  "Account Compromise",
];

const defaultForm: ScamReportInput = {
  type: "",
  description: "",
  incidentDate: "",
  amount: undefined,
  url: "",
  email: "",
  phoneNumber: "",
  reportedTo: "",
};

export default function ReportScam() {
  const [form, setForm] = useState<ScamReportInput>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<ScamReportResponse | null>(null);

  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [stats, setStats] = useState<ReportStatsResponse | null>(null);

  const [statusQuery, setStatusQuery] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<ReportStatusResponse | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!submitSuccess || !form.type) return;
    fetchRecommendations(form.type);
  }, [submitSuccess, form.type]);

  const topTypes = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [stats]);

  async function fetchStats() {
    try {
      const response = await fetch("/api/scam-report-stats");
      if (!response.ok) return;
      const data = await response.json();
      setStats(data);
    } catch {
      setStats(null);
    }
  }

  async function fetchRecommendations(type: string) {
    try {
      const response = await fetch(`/api/scam-recommendations?type=${encodeURIComponent(type)}`);
      if (!response.ok) return;
      const data = await response.json();
      setRecommendations(data);
    } catch {
      setRecommendations(null);
    }
  }

  function updateField<K extends keyof ScamReportInput>(key: K, value: ScamReportInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.type) return "Please select scam type.";
    if (!form.description.trim()) return "Please describe what happened.";
    if (!form.incidentDate) return "Please provide the incident date.";
    if (form.amount !== undefined && form.amount < 0) return "Amount cannot be negative.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      const payload: ScamReportInput = {
        ...form,
        amount:
          form.amount === undefined || Number.isNaN(form.amount)
            ? undefined
            : Number(form.amount),
        url: form.url?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phoneNumber: form.phoneNumber?.trim() || undefined,
        reportedTo: form.reportedTo?.trim() || undefined,
      };

      const response = await fetch("/api/scam-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit report");
      }

      setSubmitSuccess(data);
      fetchStats();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  async function checkStatus() {
    if (!statusQuery.trim()) return;
    setStatusLoading(true);
    setStatusError(null);
    setStatusResult(null);
    try {
      const response = await fetch(`/api/scam-report/${encodeURIComponent(statusQuery.trim())}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Report not found");
      }
      setStatusResult(data);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Unable to fetch report status");
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-5">
            <div className="p-4 bg-cyan-500/10 rounded-lg">
              <FileText className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-glow">Report a Scam</span>
          </h1>
          <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
            Submit details securely, get immediate next-step recommendations, and track your report status.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.form
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="lg:col-span-2 card-gradient p-6 rounded-xl space-y-4"
          >
            <h2 className="text-xl font-bold">Incident Details</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Scam Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3"
                >
                  <option value="">Select type</option>
                  {scamTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Incident Date *</label>
                <input
                  type="date"
                  value={form.incidentDate}
                  onChange={(e) => updateField("incidentDate", e.target.value)}
                  className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">What happened? *</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe what happened, timeline, and what information/payment was requested."
                className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Amount Lost (optional)</label>
                <input
                  type="number"
                  min={0}
                  value={form.amount ?? ""}
                  onChange={(e) =>
                    updateField(
                      "amount",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="e.g. 500"
                  className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3"
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Suspicious URL (optional)</label>
                <input
                  type="url"
                  value={form.url || ""}
                  onChange={(e) => updateField("url", e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Scammer Email (optional)</label>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3"
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Scammer Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phoneNumber || ""}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  placeholder="+1..."
                  className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Already Reported To (optional)</label>
              <input
                type="text"
                value={form.reportedTo || ""}
                onChange={(e) => updateField("reportedTo", e.target.value)}
                placeholder="Bank, local police, FTC, platform support"
                className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3"
              />
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {submitError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Send size={16} />
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
              {submitSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(defaultForm);
                    setSubmitError(null);
                    setSubmitSuccess(null);
                    setRecommendations(null);
                  }}
                  className="px-6 py-3 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition"
                >
                  New Report
                </button>
              )}
            </div>

            {submitSuccess && (
              <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10 text-green-100">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CheckCircle2 size={18} />
                  Report Submitted
                </div>
                <p className="text-sm mb-1">{submitSuccess.message}</p>
                <p className="text-sm">
                  Tracking ID: <span className="font-bold">{submitSuccess.reportId}</span>
                </p>
              </div>
            )}
          </motion.form>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card-gradient p-5 rounded-xl"
            >
              <h3 className="text-lg font-bold mb-3">Track Report Status</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  placeholder="REPORT-..."
                  className="flex-1 bg-black/30 border border-cyan-500/20 rounded-lg p-2"
                />
                <button
                  onClick={checkStatus}
                  disabled={statusLoading}
                  className="px-3 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-60"
                >
                  <Search size={16} />
                </button>
              </div>

              {statusError && <p className="text-sm text-red-300 mt-3">{statusError}</p>}

              {statusResult && (
                <div className="mt-3 p-3 bg-black/20 rounded-lg border border-cyan-500/20 text-sm space-y-1">
                  <p><span className="text-foreground/70">Status:</span> {statusResult.status}</p>
                  <p><span className="text-foreground/70">Type:</span> {statusResult.type}</p>
                  <p><span className="text-foreground/70">Submitted:</span> {new Date(statusResult.submittedDate).toLocaleString()}</p>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="card-gradient p-5 rounded-xl"
            >
              <h3 className="text-lg font-bold mb-3">Current Trends</h3>
              <p className="text-sm text-foreground/70 mb-3">
                Community submissions help identify active scam patterns.
              </p>
              <p className="text-sm mb-2">
                Total reports: <span className="font-bold text-cyan-300">{stats?.total ?? 0}</span>
              </p>
              <div className="space-y-2 text-sm">
                {topTypes.length === 0 && <p className="text-foreground/60">No trend data yet.</p>}
                {topTypes.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between bg-black/20 rounded-lg p-2">
                    <span>{type}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {recommendations && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 card-gradient p-6 rounded-xl"
          >
            <h3 className="text-xl font-bold mb-2">
              Recommended Actions for {recommendations.type}
            </h3>
            <ul className="space-y-2 mb-4">
              {recommendations.recommendations.map((item) => (
                <li key={item} className="flex items-start gap-2 text-foreground/90">
                  <span className="text-cyan-300 mt-1">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-black/20 border border-cyan-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 inline-flex items-center gap-2">
                <PhoneCall size={16} />
                Helplines
              </h4>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                {Object.entries(recommendations.contactNumbers).map(([key, value]) => (
                  <div key={key} className="bg-black/20 rounded-lg p-3">
                    <p className="text-foreground/60 capitalize">{key}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
