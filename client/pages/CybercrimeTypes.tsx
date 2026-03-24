import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Image as ImageIcon,
} from "lucide-react";
import { CrimeType } from "@shared/api";
import { INITIAL_CRIME_TYPES } from "@/lib/initial-data";

export default function CybercrimeTypes() {
  const [crimeTypes, setCrimeTypes] = useState<CrimeType[]>(INITIAL_CRIME_TYPES);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCrimeTypes();
  }, []);

  const fetchCrimeTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cybercrime-types");
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setCrimeTypes(data.data);
      }
    } catch (error) {
      console.error("Error fetching crime types, using fallback:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCrimeImagePath = (crime: CrimeType) => {
    if (crime.id === "phishing") return "/phishing.jpg";
    if (crime.id === "identity-theft") return "/identity.jpg";
    if (crime.id === "ransomware") return "/ransome.jpg";
    if (crime.id === "upi-fraud") return "/upi.jpg";
    if (crime.id === "deepfake") return "/deep fake (1).jpg";
    return null;
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Learn common cyber threats in a clear card format, with room for visual examples.
          </p>
        </motion.div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
        )}

        {!loading && crimeTypes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {crimeTypes.map((crime, idx) => (
              <motion.div
                key={crime.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="card-gradient rounded-xl overflow-hidden border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 self-start"
              >
                <div className="p-4 border-b border-cyan-500/20">
                  {getCrimeImagePath(crime) ? (
                    <img
                      src={getCrimeImagePath(crime) || ""}
                      alt={crime.name}
                      className="aspect-[16/9] w-full rounded-lg object-cover border border-cyan-500/30"
                    />
                  ) : (
                    <div className="aspect-[16/9] rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 flex flex-col items-center justify-center text-center px-3">
                      <ImageIcon className="w-7 h-7 text-cyan-400 mb-2" />
                      <p className="text-sm text-cyan-300 font-medium">Image Space</p>
                      <p className="text-xs text-foreground/50 mt-1">
                        Add a representative image or infographic here
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setExpandedId(expandedId === crime.id ? null : crime.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-3 hover:bg-cyan-500/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl leading-none">{crime.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-foreground hover:text-cyan-400 transition-colors">
                        {crime.name}
                      </h3>
                      <p className="text-foreground/70 text-sm mt-2 line-clamp-2">
                        {crime.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-cyan-400 mt-1 shrink-0">
                    {expandedId === crime.id ? (
                      <ChevronUp size={22} />
                    ) : (
                      <ChevronDown size={22} />
                    )}
                  </div>
                </button>

                {expandedId === crime.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-cyan-500/20 p-5 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                        <h4 className="text-sm font-semibold text-cyan-300 mb-2">Examples</h4>
                        <ul className="space-y-2">
                          {crime.examples.slice(0, 3).map((example, i) => (
                            <li key={i} className="text-sm text-foreground/80 leading-relaxed">
                              - {example}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                        <h4 className="text-sm font-semibold text-orange-300 mb-2">Warning Signs</h4>
                        <ul className="space-y-2">
                          {crime.signs.slice(0, 3).map((sign, i) => (
                            <li key={i} className="text-sm text-foreground/80 leading-relaxed">
                              - {sign}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                        <h4 className="text-sm font-semibold text-green-300 mb-2">Prevention</h4>
                        <ul className="space-y-2">
                          {crime.prevention.slice(0, 3).map((tip, i) => (
                            <li key={i} className="text-sm text-foreground/80 leading-relaxed">
                              - {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {crime.tips && crime.tips.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-cyan-400 mb-3">Expert Tips</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {crime.tips.map((tip) => (
                            <div
                              key={tip.id}
                              className="glassmorphism p-4 rounded-lg border border-cyan-500/20"
                            >
                              <div className="text-2xl mb-2">{tip.emoji}</div>
                              <h5 className="font-semibold text-foreground mb-2">{tip.title}</h5>
                              <p className="text-sm text-foreground/70">{tip.description}</p>
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
            <p className="text-foreground/60">No crime types available at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
