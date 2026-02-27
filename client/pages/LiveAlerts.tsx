import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { AlertTriangle, Shield, Clock } from "lucide-react";
import { ScamAlert } from "@shared/api";

export default function LiveAlerts() {
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/live-alerts");
      const data = await response.json();
      setAlerts(data.data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 border-red-500/30 text-red-400";
      case "high":
        return "bg-orange-500/20 border-orange-500/30 text-orange-400";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      default:
        return "bg-blue-500/20 border-blue-500/30 text-blue-400";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "⚡";
      default:
        return "ℹ️";
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
        {/* Header */}
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
            Real-time alerts about emerging scams and security threats
          </p>
        </motion.div>

        {/* Alert Count */}
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

        {/* Type Filter */}
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
        )}

        {/* Alerts List */}
        {!loading && filteredAlerts.length > 0 && (
          <div className="space-y-6">
            {filteredAlerts.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                className={`${getSeverityColor(
                  alert.severity
                )} border rounded-xl p-6 backdrop-blur-sm`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">
                      {getSeverityIcon(alert.severity)}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {alert.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm mb-3">
                        <span className="px-3 py-1 bg-black/20 rounded-full">
                          {alert.type}
                        </span>
                        <span className="px-3 py-1 bg-black/20 rounded-full">
                          {alert.targetAudience}
                        </span>
                        <span className="px-3 py-1 bg-black/20 rounded-full font-semibold">
                          {alert.reportedCases.toLocaleString()} reports
                        </span>
                      </div>
                      <p className="text-foreground/90 mb-4">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-foreground/70 flex items-center gap-2 whitespace-nowrap">
                    <Clock size={16} />
                    {formatTime(alert.timestamp)}
                  </div>
                </div>

                {/* Prevention Tips */}
                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span>✓</span> What To Do
                  </h4>
                  <ul className="space-y-2">
                    {alert.preventionTips.map((tip, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-foreground/90"
                      >
                        <span className="text-green-400 mt-1">•</span>
                        <span>{tip}</span>
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
            <p className="text-foreground/60 text-lg">
              No alerts found for the selected type
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
