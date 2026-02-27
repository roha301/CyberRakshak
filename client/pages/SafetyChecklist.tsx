import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Shield } from "lucide-react";
import { ChecklistItem } from "@shared/api";

export default function SafetyChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/safety-checklist");
      const data = await response.json();
      setItems(data.data);
    } catch (error) {
      console.error("Error fetching checklist:", error);
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

  const uniqueCategories = [...new Set(items.map((item) => item.category))];
  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const completionPercentage =
    filteredItems.length > 0
      ? Math.round(
          (Array.from(completedItems).filter((id) =>
            filteredItems.find((item) => item.id === id)
          ).length /
            filteredItems.length) *
            100
        )
      : 0;

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

        {/* Progress */}
        {!loading && filteredItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8 card-gradient p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">
                Your Progress
              </h3>
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
              {completedItems.size} of {items.length} tasks completed
            </p>
          </motion.div>
        )}

        {/* Category Filter */}
        {!loading && uniqueCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 flex flex-wrap gap-2"
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                selectedCategory === null
                  ? "bg-cyan-500 text-background"
                  : "border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              }`}
            >
              All Categories
            </button>
            {uniqueCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-cyan-500 text-background"
                    : "border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                }`}
              >
                {category}
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

        {/* Checklist Items */}
        {!loading && filteredItems.length > 0 && (
          <div className="space-y-4">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                className={`${getPriorityBgColor(
                  item.priority
                )} border rounded-xl p-6 transition-all duration-300 ${
                  completedItems.has(item.id) ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-4">
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
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3
                          className={`text-lg font-bold transition-all duration-300 ${
                            completedItems.has(item.id)
                              ? "line-through text-foreground/50"
                              : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p className="text-sm text-foreground/70 mt-1">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <span
                          className={`text-xs font-semibold uppercase ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                        <div className="flex items-center gap-1 text-foreground/60 text-sm">
                          <Clock size={14} />
                          {item.estimatedTime}
                        </div>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="mt-4 ml-0 space-y-2">
                      {item.steps.map((step, stepIdx) => (
                        <div
                          key={stepIdx}
                          className="flex items-start gap-3 text-sm text-foreground/80 bg-black/20 p-3 rounded-lg"
                        >
                          <span className="font-semibold text-cyan-400 flex-shrink-0">
                            {stepIdx + 1}.
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-12 card-gradient rounded-xl p-8">
            <CheckCircle2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
            <p className="text-foreground/60 text-lg">
              No checklist items found for the selected category
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
