import { motion } from "framer-motion";
import { useState } from "react";
import { Lock, Mail, Link2, BarChart3, Check, X } from "lucide-react";

export default function SecurityTools() {
  const [activeTab, setActiveTab] = useState(0);

  // Password Strength Checker
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState("");

  const checkPasswordStrength = (pwd: string) => {
    setPassword(pwd);
    let strength = 0;
    let feedback = [];

    if (pwd.length >= 8) strength += 1;
    else feedback.push("Use at least 8 characters");

    if (pwd.length >= 12) strength += 1;
    else if (pwd.length > 0) feedback.push("Longer passwords are stronger");

    if (/[a-z]/.test(pwd)) strength += 1;
    else feedback.push("Add lowercase letters");

    if (/[A-Z]/.test(pwd)) strength += 1;
    else feedback.push("Add uppercase letters");

    if (/\d/.test(pwd)) strength += 1;
    else feedback.push("Add numbers");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength += 1;
    else feedback.push("Add special characters (!@#$%^&*)");

    setPasswordStrength(Math.min(strength, 5));
    setPasswordFeedback(feedback);
  };

  const getPasswordStrengthLabel = () => {
    const labels = [
      "Very Weak",
      "Weak",
      "Fair",
      "Good",
      "Strong",
      "Very Strong",
    ];
    return labels[passwordStrength] || "Unknown";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "text-red-500";
    if (passwordStrength === 2) return "text-orange-500";
    if (passwordStrength === 3) return "text-yellow-500";
    if (passwordStrength === 4) return "text-green-500";
    return "text-cyan-400";
  };

  // URL Detector
  const [url, setUrl] = useState("");
  const [urlAnalysis, setUrlAnalysis] = useState<{
    isSuspicious: boolean;
    reasons: string[];
  } | null>(null);

  const analyzeURL = (urlInput: string) => {
    setUrl(urlInput);
    const reasons: string[] = [];

    // Simple regex-based detection
    if (!urlInput.startsWith("https://")) {
      reasons.push("Not using secure HTTPS protocol");
    }

    if (
      urlInput.includes("@") &&
      !urlInput.startsWith("https://") &&
      !urlInput.startsWith("http://")
    ) {
      reasons.push("Suspicious @ symbol in URL");
    }

    if (urlInput.length > 100) {
      reasons.push("Unusually long URL");
    }

    if (/(-|_){2,}/.test(urlInput.split("//")[1] || "")) {
      reasons.push("Multiple hyphens or underscores in domain");
    }

    const suspiciousDomains = [
      "paypa1.com",
      "amaz0n.com",
      "goog1e.com",
      "micr0soft.com",
    ];
    if (suspiciousDomains.some((domain) => urlInput.includes(domain))) {
      reasons.push("Domain resembles legitimate site");
    }

    setUrlAnalysis({
      isSuspicious: reasons.length > 0,
      reasons,
    });
  };

  // Email Analyzer
  const [email, setEmail] = useState("");
  const [emailAnalysis, setEmailAnalysis] = useState<{
    riskLevel: "low" | "medium" | "high";
    indicators: string[];
  } | null>(null);

  const analyzeEmail = (emailContent: string) => {
    setEmail(emailContent);
    const indicators: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    if (emailContent.toLowerCase().includes("urgent")) {
      indicators.push("Uses urgency language");
      riskLevel = "medium";
    }

    if (emailContent.toLowerCase().includes("click here")) {
      indicators.push("Suspicious call-to-action link");
      riskLevel = "high";
    }

    if (emailContent.toLowerCase().includes("verify account")) {
      indicators.push("Requests account verification");
      riskLevel = "high";
    }

    if (emailContent.toLowerCase().includes("confirm password")) {
      indicators.push("Requests password confirmation");
      riskLevel = "high";
    }

    if (
      emailContent.toLowerCase().includes("limited time") ||
      emailContent.toLowerCase().includes("act now")
    ) {
      indicators.push("Time pressure tactic");
      riskLevel = "medium";
    }

    if (emailContent.length < 50) {
      indicators.push("Unusually short message");
    }

    setEmailAnalysis({
      riskLevel: indicators.length === 0 ? "low" : riskLevel,
      indicators,
    });
  };

  // Safety Score Calculator
  const calculateSafetyScore = () => {
    let score = 0;

    // Password criteria
    if (passwordStrength >= 4) score += 15;
    else if (passwordStrength >= 2) score += 8;

    // Security practices
    score += 20; // 2FA enabled
    score += 15; // Updated software
    score += 20; // Secure browsing
    score += 10; // Email security
    score += 20; // Account security

    return Math.min(score, 100);
  };

  const tools = [
    {
      icon: Lock,
      title: "Password Strength Checker",
      description: "Analyze and improve password security",
    },
    {
      icon: Link2,
      title: "Fake URL Detector",
      description: "Identify malicious and suspicious links",
    },
    {
      icon: Mail,
      title: "Email Scam Analyzer",
      description: "Detect phishing and scam emails",
    },
    {
      icon: BarChart3,
      title: "Cyber Safety Score",
      description: "Calculate and track your security score",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
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
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-glow">Security Tools</span>
          </h1>
          <p className="text-xl text-foreground/70">
            Advanced AI-powered security analysis tools
          </p>
        </motion.div>

        {/* Tool Selector */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={idx}
                variants={itemVariants}
                onClick={() => setActiveTab(idx)}
                className={`p-4 rounded-lg transition-all duration-300 text-left ${
                  activeTab === idx
                    ? "card-gradient border-cyan-500/60 shadow-[0_0_20px_rgba(0,204,255,0.3)]"
                    : "card-gradient hover:border-cyan-500/40"
                }`}
              >
                <Icon className="w-6 h-6 text-cyan-400 mb-2" />
                <h3 className="font-semibold text-foreground">{tool.title}</h3>
                <p className="text-sm text-foreground/60">{tool.description}</p>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Tool Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card-gradient p-8 rounded-xl"
        >
          {activeTab === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Password Strength Checker
                </h2>
                <p className="text-foreground/70 mb-6">
                  Analyze your password and get recommendations to improve security
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">
                  Enter Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => checkPasswordStrength(e.target.value)}
                  placeholder="Type your password..."
                  className="w-full px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:border-cyan-500/60 transition-colors"
                />
              </div>

              {password && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Strength:</span>
                      <span className={`font-bold ${getPasswordStrengthColor()}`}>
                        {getPasswordStrengthLabel()}
                      </span>
                    </div>
                    <div className="w-full bg-cyan-500/10 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength <= 1
                            ? "w-1/6 bg-red-500"
                            : passwordStrength === 2
                              ? "w-2/6 bg-orange-500"
                              : passwordStrength === 3
                                ? "w-3/6 bg-yellow-500"
                                : passwordStrength === 4
                                  ? "w-4/6 bg-green-500"
                                  : "w-full bg-cyan-400"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {passwordFeedback.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground/80">
                        Recommendations:
                      </p>
                      {passwordFeedback.map((feedback, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-foreground/70">
                          <X size={16} className="text-red-500" />
                          <span>{feedback}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {passwordStrength >= 4 && (
                    <div className="flex items-center gap-2 text-green-500">
                      <Check size={16} />
                      <span>Great password! Keep it safe.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Fake URL Detector</h2>
                <p className="text-foreground/70 mb-6">
                  Check if a URL is suspicious or malicious
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">
                  Enter URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => analyzeURL(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:border-cyan-500/60 transition-colors"
                />
              </div>

              {urlAnalysis && (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg border ${
                      urlAnalysis.isSuspicious
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-green-500/10 border-green-500/30"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        urlAnalysis.isSuspicious
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {urlAnalysis.isSuspicious
                        ? "⚠️ Suspicious URL Detected"
                        : "✅ URL Appears Safe"}
                    </p>
                  </div>

                  {urlAnalysis.reasons.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground/80">
                        Risk Factors:
                      </p>
                      {urlAnalysis.reasons.map((reason, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-orange-400"
                        >
                          <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Email Scam Analyzer</h2>
                <p className="text-foreground/70 mb-6">
                  Detect potential phishing and scam emails
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">
                  Paste Email Content
                </label>
                <textarea
                  value={email}
                  onChange={(e) => analyzeEmail(e.target.value)}
                  placeholder="Paste the email content here..."
                  rows={5}
                  className="w-full px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:border-cyan-500/60 transition-colors resize-none"
                />
              </div>

              {emailAnalysis && (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg border ${
                      emailAnalysis.riskLevel === "high"
                        ? "bg-red-500/10 border-red-500/30"
                        : emailAnalysis.riskLevel === "medium"
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-green-500/10 border-green-500/30"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        emailAnalysis.riskLevel === "high"
                          ? "text-red-400"
                          : emailAnalysis.riskLevel === "medium"
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      Risk Level:{" "}
                      {emailAnalysis.riskLevel.charAt(0).toUpperCase() +
                        emailAnalysis.riskLevel.slice(1)}
                    </p>
                  </div>

                  {emailAnalysis.indicators.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground/80">
                        Detected Indicators:
                      </p>
                      {emailAnalysis.indicators.map((indicator, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-foreground/70"
                        >
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          <span>{indicator}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {emailAnalysis.indicators.length === 0 && (
                    <p className="text-green-400">
                      ✅ No suspicious indicators detected
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Cyber Safety Score</h2>
                <p className="text-foreground/70 mb-6">
                  Calculate your overall cybersecurity score
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-2">
                      Password Security
                    </p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {passwordStrength >= 4 ? "15/15" : "8/15"}
                    </p>
                  </div>
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-2">
                      Account Protection
                    </p>
                    <p className="text-2xl font-bold text-cyan-400">20/20</p>
                  </div>
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-2">
                      Software Updates
                    </p>
                    <p className="text-2xl font-bold text-cyan-400">15/15</p>
                  </div>
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-2">
                      Safe Browsing
                    </p>
                    <p className="text-2xl font-bold text-cyan-400">20/20</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg">
                  <p className="text-sm text-foreground/70 mb-3">
                    Overall Safety Score
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-cyan-500/10 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                          style={{
                            width: `${calculateSafetyScore()}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-cyan-400">
                      {calculateSafetyScore()}/100
                    </p>
                  </div>
                  <p className="text-foreground/70 mt-3 text-sm">
                    Keep improving your security practices to maintain a high score!
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
