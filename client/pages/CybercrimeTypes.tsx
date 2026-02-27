import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { CrimeType } from "@shared/api";

export default function CybercrimeTypes() {
  const [crimeTypes, setCrimeTypes] = useState<CrimeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCrimeTypes();
  }, []);

  const fetchCrimeTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cybercrime-types");
      const data = await response.json();
      setCrimeTypes(data.data);
    } catch (error) {
      console.error("Error fetching crime types:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-cyan-500/10 rounded-lg">
              <AlertTriangle className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-glow">Types of Cybercrime</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Learn about different types of cyber threats and how to protect yourself from them
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
        )}

        {/* Crime Types */}
        {!loading && crimeTypes.length > 0 && (
          <div className="space-y-6">
            {crimeTypes.map((crime, idx) => (
              <motion.div
                key={crime.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="card-gradient rounded-xl overflow-hidden hover:border-cyan-500/40 transition-all duration-300"
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === crime.id ? null : crime.id)
                  }
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-cyan-500/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{crime.emoji}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground hover:text-cyan-400 transition-colors">
                        {crime.name}
                      </h3>
                      <p className="text-foreground/60 text-sm mt-1">
                        {crime.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-cyan-400">
                    {expandedId === crime.id ? (
                      <ChevronUp size={24} />
                    ) : (
                      <ChevronDown size={24} />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedId === crime.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-cyan-500/20 p-6 space-y-6"
                  >
                    {/* Examples */}
                    <div>
                      <h4 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                        <span>📋</span> Examples
                      </h4>
                      <ul className="space-y-2">
                        {crime.examples.map((example, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-foreground/80"
                          >
                            <span className="text-cyan-400 mt-1">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Warning Signs */}
                    <div>
                      <h4 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
                        <span>⚠️</span> Warning Signs
                      </h4>
                      <ul className="space-y-2">
                        {crime.signs.map((sign, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-foreground/80"
                          >
                            <span className="text-orange-400 mt-1">•</span>
                            <span>{sign}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prevention Tips */}
                    <div>
                      <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                        <span>✓</span> Prevention Tips
                      </h4>
                      <ul className="space-y-2">
                        {crime.prevention.map((tip, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-foreground/80"
                          >
                            <span className="text-green-400 mt-1">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Expert Tips */}
                    {crime.tips && crime.tips.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                          <span>💡</span> Expert Tips
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {crime.tips.map((tip) => (
                            <div
                              key={tip.id}
                              className="glassmorphism p-4 rounded-lg"
                            >
                              <div className="text-2xl mb-2">{tip.emoji}</div>
                              <h5 className="font-semibold text-foreground mb-2">
                                {tip.title}
                              </h5>
                              <p className="text-sm text-foreground/70">
                                {tip.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {!loading && crimeTypes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground/60">
              No crime types available at the moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
