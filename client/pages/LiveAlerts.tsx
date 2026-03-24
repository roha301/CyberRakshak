import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { AlertTriangle, Shield, Clock } from "lucide-react";
import { ScamAlert } from "@shared/api";
import { INITIAL_LIVE_ALERTS } from "@/lib/initial-data";

export default function LiveAlerts() {
  const [alerts, setAlerts] = useState<ScamAlert[]>(INITIAL_LIVE_ALERTS);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/live-alerts");
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error("Error fetching alerts, using fallback:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 border-red-500/30";
      case "high":
        return "bg-orange-500/20 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500/30";
      default:
        return "bg-blue-500/20 border-blue-500/30";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-300 border-red-500/40 bg-red-500/15";
      case "high":
        return "text-orange-300 border-orange-500/40 bg-orange-500/15";
      case "medium":
        return "text-yellow-300 border-yellow-500/40 bg-yellow-500/15";
      default:
        return "text-blue-300 border-blue-500/40 bg-blue-500/15";
    }
  };

  const uniqueTypes = [...new Set(alerts.map((a) => a.type))];
  const filteredAlerts = selectedType
    ? alerts.filter((a) => a.type === selectedType)
    : alerts;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-cyan-500/10 rounded-lg animate-pulse">
              <AlertTriangle className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-glow">Live Scam Alerts</span>
          </h1>
          <p className="text-xl text-foreground/70">
            Emerging scams presented in focused alert cards.
          </p>
        </motion.div>

        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-center"
          >
            <p className="text-foreground">
              <span className="text-cyan-400 font-bold">{alerts.length}</span> active
              scam alerts reported today
            </p>
          </motion.div>
        )}

        {!loading && uniqueTypes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 flex flex-wrap gap-2"
          >
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                selectedType === null
                  ? "bg-cyan-500 text-background"
                  : "border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              }`}
            >
              All Types
            </button>
            {uniqueTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  selectedType === type
                    ? "bg-cyan-500 text-background"
                    : "border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                }`}
              >
                {type}
              </button>
            ))}
          </motion.div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
        )}

        {!loading && filteredAlerts.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {filteredAlerts.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className={`${getSeverityColor(
                  alert.severity
                )} border rounded-xl p-5 backdrop-blur-sm`}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="px-3 py-1 bg-black/20 rounded-full text-sm text-foreground/90">
                      {alert.type}
                    </span>
                    <span className="px-3 py-1 bg-black/20 rounded-full text-sm text-foreground/90">
                      {alert.targetAudience}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground">{alert.title}</h3>
                  <p className="text-foreground/90 leading-relaxed">{alert.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="px-3 py-1 bg-black/20 rounded-lg font-semibold text-foreground/90">
                      {alert.reportedCases.toLocaleString()} reports
                    </span>
                    <span className="px-3 py-1 bg-black/20 rounded-lg text-foreground/80 flex items-center gap-2">
                      <Clock size={15} />
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-lg bg-black/20 border border-cyan-500/20 p-4">
                  <h4 className="font-semibold text-foreground mb-3">Recommended Actions</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {alert.preventionTips.map((tip, i) => (
                      <li key={i} className="text-sm text-foreground/90 leading-relaxed">
                        - {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredAlerts.length === 0 && (
          <div className="text-center py-12 card-gradient rounded-xl p-8">
            <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
            <p className="text-foreground/60 text-lg">No alerts found for the selected type</p>
          </div>
        )}
      </div>
    </div>
  );
}
