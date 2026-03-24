import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, CheckCircle2, Clock, Shield } from "lucide-react";
import { ChecklistItem } from "@shared/api";
import { INITIAL_CHECKLIST_ITEMS } from "@/lib/initial-data";

export default function SafetyChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST_ITEMS);
  const [loading, setLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/safety-checklist");
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setItems(data.data);
      }
    } catch (error) {
      console.error("Error fetching checklist, using fallback:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      default:
        return "text-green-400";
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 border-yellow-500/20";
      default:
        return "bg-green-500/10 border-green-500/20";
    }
  };

  const getPriorityLabel = (priority: ChecklistItem["priority"]) => {
    switch (priority) {
      case "high":
        return "High";
      case "medium":
        return "Medium";
      default:
        return "Normal";
    }
  };

  const priorityRank: Record<ChecklistItem["priority"], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const sortedItems = [...items].sort(
    (a, b) => priorityRank[a.priority] - priorityRank[b.priority]
  );

  const highItems = sortedItems.filter((item) => item.priority === "high").slice(0, 2);
  const mediumItems = sortedItems
    .filter((item) => item.priority === "medium")
    .slice(0, 2);
  const normalItems = sortedItems.filter((item) => item.priority === "low").slice(0, 2);

  const selectedItems: ChecklistItem[] = [];
  const selectedIds = new Set<string>();
  [...highItems, ...mediumItems, ...normalItems].forEach((item) => {
    if (!selectedIds.has(item.id)) {
      selectedItems.push(item);
      selectedIds.add(item.id);
    }
  });

  if (selectedItems.length < 6) {
    for (const item of sortedItems) {
      if (selectedItems.length >= 6) break;
      if (!selectedIds.has(item.id)) {
        selectedItems.push(item);
        selectedIds.add(item.id);
      }
    }
  }

  const completionCount = Array.from(completedItems).filter((id) =>
    selectedItems.find((item) => item.id === id)
  ).length;

  const completionPercentage =
    selectedItems.length > 0
      ? Math.round((completionCount / selectedItems.length) * 100)
      : 0;

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
            <div className="p-4 bg-cyan-500/10 rounded-lg">
              <CheckCircle2 className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-glow">Cyber Safety Checklist</span>
          </h1>
          <p className="text-xl text-foreground/70">
            Complete these tasks to secure your digital life
          </p>
        </motion.div>

        {!loading && selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8 card-gradient p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Your Progress</h3>
              <span className="text-2xl font-bold text-cyan-400">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-cyan-500/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-foreground/70 mt-3">
              {completionCount} of {selectedItems.length} tasks completed
            </p>
          </motion.div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
        )}

        {!loading && selectedItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
            {selectedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                className={`${getPriorityBgColor(
                  item.priority
                )} border rounded-xl p-5 transition-all duration-300 h-full ${
                  completedItems.has(item.id) ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-4 h-full">
                  <button
                    onClick={() => toggleCompletion(item.id)}
                    className="flex-shrink-0 mt-1"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        completedItems.has(item.id)
                          ? "bg-green-500 border-green-500"
                          : "border-foreground/40 hover:border-foreground"
                      }`}
                    >
                      {completedItems.has(item.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                  </button>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="min-w-0">
                        <h3
                          className={`text-lg font-bold transition-all duration-300 ${
                            completedItems.has(item.id)
                              ? "line-through text-foreground/50"
                              : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p className="text-sm text-foreground/70 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-2 flex-shrink-0">
                        <span
                          className={`text-xs font-semibold uppercase ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {getPriorityLabel(item.priority)}
                        </span>
                        <div className="flex items-center gap-1 text-foreground/60 text-sm">
                          <Clock size={14} />
                          {item.estimatedTime}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-2 rounded-lg border border-cyan-500/20 bg-black/20 p-3 flex-1">
                      <p className="text-sm font-semibold text-cyan-300 mb-1">
                        Checklist Steps
                      </p>
                      {item.steps.slice(0, 3).map((step, stepIdx) => (
                        <div
                          key={stepIdx}
                          className="flex items-start gap-3 text-sm text-foreground/80 bg-black/30 p-3 rounded-lg border border-cyan-500/10"
                        >
                          <span className="font-semibold text-cyan-400 flex-shrink-0">
                            {stepIdx + 1}.
                          </span>
                          <span className="line-clamp-2">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && selectedItems.length === 0 && (
          <div className="text-center py-12 card-gradient rounded-xl p-8">
            <CheckCircle2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
            <p className="text-foreground/60 text-lg">
              No checklist items available right now
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
