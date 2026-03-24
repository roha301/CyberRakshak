import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { analyzeUrlRisk } from "@/lib/urlRisk";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Brain,
  Lock,
  Eye,
  Zap,
  Radar,
  Activity,
  ShieldAlert,
  Link2,
  Mail,
} from "lucide-react";

export default function Home() {
  const [passwordInput, setPasswordInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const passwordScore = (() => {
    const pwd = passwordInput;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;
    return score;
  })();

  const passwordLabel =
    passwordScore <= 1
      ? "Weak"
      : passwordScore <= 3
        ? "Moderate"
        : passwordScore <= 5
          ? "Strong"
          : "Very Strong";
  const urlAnalysis = analyzeUrlRisk(urlInput);

  const emailIndicators = (() => {
    const indicators: string[] = [];
    const text = emailInput.toLowerCase();
    if (!text) return indicators;
    if (text.includes("urgent")) indicators.push("Urgency language");
    if (text.includes("click here")) indicators.push("Suspicious call-to-action");
    if (text.includes("verify account")) indicators.push("Account verification trap");
    if (text.includes("confirm password")) indicators.push("Password request");
    if (text.includes("act now") || text.includes("limited time")) {
      indicators.push("Pressure tactic");
    }
    return indicators;
  })();
  const features = [
    {
      icon: AlertTriangle,
      title: "Cybercrime Types",
      description: "Learn about phishing, ransomware, and identity theft",
      path: "/cybercrime-types",
    },
    {
      icon: Zap,
      title: "Live Alerts",
      description: "Get real-time scam alerts and threat updates",
      path: "/live-alerts",
    },
    {
      icon: CheckCircle,
      title: "Safety Checklist",
      description: "Follow step-by-step cyber safety guidelines",
      path: "/safety-checklist",
    },
    {
      icon: Brain,
      title: "AI Assistant",
      description: "Ask AI powered voice assistant for security advice",
      path: "/ai-assistant",
    },
    {
      icon: Lock,
      title: "Security Tools",
      description: "Password checker, URL detector, and more",
      path: "/security-tools",
    },
    {
      icon: Eye,
      title: "Report Scam",
      description: "Report suspicious activity and scams",
      path: "/report-scam",
    },
  ];

  const stats = [
    { number: "2.4B", label: "Cyber Attacks Per Year" },
    { number: "64%", label: "Businesses Affected" },
    { number: "4.29M", label: "Data Records Stolen" },
    { number: "24/7", label: "Threat Coverage" },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const floatingThreats = [
    { label: "Phishing Wave", severity: "HIGH", icon: ShieldAlert },
    { label: "Suspicious URLs", severity: "MEDIUM", icon: Radar },
    { label: "Credential Stuffing", severity: "CRITICAL", icon: Activity },
  ];

  return (
    <div
      className="min-h-screen pt-24 pb-12 bg-background bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(rgba(5, 12, 24, 0.82), rgba(5, 12, 24, 0.9)), url('/home-bg.jpg')",
        backgroundSize: "92%",
        backgroundPosition: "center 20%",
      }}
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 grid-pattern"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Scan overlays */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-cyan-500/15 to-transparent"
          animate={{ y: ["-20%", "120%"] }}
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
        />
        <motion.div
          className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-blue-500/10 to-transparent"
          animate={{ y: ["-50%", "130%"] }}
          transition={{
            repeat: Infinity,
            duration: 9,
            ease: "linear",
            delay: 2,
          }}
        />

        {/* Floating cyber text */}
        <div className="absolute inset-0 opacity-35 pointer-events-none">
          {["01010110", "THREAT", "A1B9", "SOC ALERT", "XSS", "MFA ON"].map(
            (item, idx) => (
              <motion.div
                key={item + idx}
                className="absolute text-cyan-300/70 text-xs font-mono tracking-wider"
                style={{
                  left: `${8 + (idx % 3) * 30}%`,
                  top: `${10 + idx * 12}%`,
                }}
                animate={{ opacity: [0.15, 0.85, 0.15], y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.8 + idx * 0.35 }}
              >
                {item}
              </motion.div>
            )
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-5 gap-10 items-center"
          >
            <div className="lg:col-span-3 text-center lg:text-left space-y-8">
              {/* Logo Animation */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center lg:justify-start mb-2"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse-glow"></div>
                  <Shield className="w-20 h-20 text-cyan-400 relative" />
                </div>
              </motion.div>

              {/* Main Headline */}
              <motion.div variants={itemVariants} className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                  <span className="text-glow block">CyberRakshak</span>
                  <span className="text-foreground/80 text-3xl md:text-5xl mt-4 block font-light">
                    Your Defense Against Digital Threats
                  </span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className="text-xl text-foreground/70 max-w-2xl mx-auto lg:mx-0"
              >
                Empowering individuals and businesses with AI-powered cybersecurity awareness, real-time threat detection, and intelligent voice-assisted security guidance.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2"
              >
                <Link
                  to="/ai-assistant"
                  className="button-glow px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-background font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(0,204,255,0.6)] transition-all duration-300 inline-block"
                >
                  Try AI Assistant
                </Link>
                <Link
                  to="/safety-checklist"
                  className="button-glow px-8 py-4 border border-cyan-500/50 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-500/10 transition-all duration-300 inline-block"
                >
                  Start Safety Checklist
                </Link>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="lg:col-span-2 w-full">
              <div className="glassmorphism border border-cyan-500/25 rounded-2xl p-5 space-y-4 bg-black/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-cyan-300 font-semibold tracking-wide">
                    LIVE THREAT INTELLIGENCE
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">
                    Online
                  </span>
                </div>

                <div className="space-y-3">
                  {floatingThreats.map((threat, idx) => {
                    const Icon = threat.icon;
                    return (
                      <motion.div
                        key={threat.label}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.2 + idx * 0.15,
                        }}
                        className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} className="text-cyan-300" />
                          <span className="text-sm text-foreground/90">
                            {threat.label}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            threat.severity === "CRITICAL"
                              ? "text-red-300"
                              : threat.severity === "HIGH"
                              ? "text-orange-300"
                              : "text-yellow-300"
                          }`}
                        >
                          {threat.severity}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="h-20 rounded-xl bg-black/30 border border-cyan-500/15 p-3 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent"
                    animate={{ x: ["-30%", "420%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.8,
                      ease: "linear",
                    }}
                  />
                  <div className="text-xs font-mono text-cyan-300/80 leading-5">
                    SIGNAL: anomaly detected on suspicious domain cluster...
                    mitigation advisory synced to response layer.
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative py-20 bg-gradient-to-b from-background/55 via-background/35 to-transparent"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="card-gradient p-6 rounded-xl text-center hover:shadow-[0_0_20px_rgba(0,204,255,0.3)] transition-all duration-300"
              >
                <h3 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
                  {stat.number}
                </h3>
                <p className="text-foreground/70">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="relative py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-glow">Core Features</span>
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Comprehensive tools and resources to enhance your cybersecurity awareness
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <Link to={feature.path} className="block group h-full">
                    <div className="card-gradient p-8 rounded-xl h-full hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(0,204,255,0.2)] transition-all duration-300">
                      <div className="mb-4 inline-block p-3 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-foreground/70">{feature.description}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

            {/* All Security Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative py-20 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border-t border-cyan-500/20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-glow">All Security Features</span>
            </h2>
            <p className="text-lg text-foreground/70">
              Use real security tools directly from Home
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glassmorphism p-6 rounded-xl border border-cyan-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-cyan-300" />
                <h3 className="text-xl font-bold">Password Strength Analyzer</h3>
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-cyan-500/20 text-foreground mb-3"
              />
              <div className="w-full h-2 rounded-full bg-cyan-500/10 overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordScore <= 1
                      ? "bg-red-400"
                      : passwordScore <= 3
                        ? "bg-yellow-400"
                        : "bg-green-400"
                  }`}
                  style={{ width: `${(passwordScore / 6) * 100}%` }}
                />
              </div>
              <p className="text-sm text-foreground/70">
                Strength:{" "}
                <span className="font-semibold text-cyan-300">
                  {passwordInput ? passwordLabel : "N/A"}
                </span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="glassmorphism p-6 rounded-xl border border-cyan-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-5 h-5 text-cyan-300" />
                <h3 className="text-xl font-bold">Fake URL Detector</h3>
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-cyan-500/20 text-foreground mb-3"
              />
              <div className="text-sm text-foreground/80 space-y-1">
                {urlAnalysis.status === "empty" ? (
                  <p>Enter a URL to analyze.</p>
                ) : urlAnalysis.status === "safe" ? (
                  <p className="text-green-300 font-semibold">Likely Original / Safe URL</p>
                ) : (
                  <>
                    <p className="text-red-300 font-semibold">Likely Fake / Suspicious URL</p>
                    {urlAnalysis.reasons.map((reason) => <p key={reason}>- {reason}</p>)}
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="glassmorphism p-6 rounded-xl border border-cyan-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-cyan-300" />
                <h3 className="text-xl font-bold">Scam Email Analyzer</h3>
              </div>
              <textarea
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Paste suspicious email text..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-cyan-500/20 text-foreground mb-3 resize-none"
              />
              <div className="text-sm text-foreground/80 space-y-1">
                {!emailInput ? (
                  <p>Paste email content to check indicators.</p>
                ) : emailIndicators.length === 0 ? (
                  <p className="text-green-300">No common phishing indicators detected.</p>
                ) : (
                  emailIndicators.map((indicator) => <p key={indicator}>- {indicator}</p>)
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="card-gradient p-12 rounded-2xl"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Take Control of Your Digital Security
            </h2>
            <p className="text-lg text-foreground/70 mb-8">
              Start your cybersecurity journey with CyberRakshak today. Learn, protect, and stay ahead of threats.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/quiz"
                className="button-glow px-8 py-3 bg-cyan-500 text-background font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(0,204,255,0.6)] transition-all duration-300 inline-block"
              >
                Take Security Quiz
              </Link>
              <Link
                to="/cybercrime-types"
                className="button-glow px-8 py-3 border border-cyan-500/50 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-500/10 transition-all duration-300 inline-block"
              >
                Learn Cybercrime Types
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-cyan-500/20 py-12 text-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-foreground/60 mb-2">
            © 2026 CyberRakshak. Protecting the digital world.
          </p>
          <p className="text-foreground/40 text-sm">
            Stay vigilant, stay secure.
          </p>
        </div>
      </footer>

    </div>
  );
}






