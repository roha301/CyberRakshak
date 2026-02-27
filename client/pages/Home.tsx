import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Brain,
  Lock,
  Eye,
  Zap,
  BarChart3,
} from "lucide-react";

export default function Home() {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

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

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Logo Animation */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center mb-8"
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
              className="text-xl text-foreground/70 max-w-2xl mx-auto"
            >
              Empowering individuals and businesses with AI-powered cybersecurity awareness, real-time threat detection, and intelligent voice-assisted security guidance.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
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

      {/* Advanced Features Section */}
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
              <span className="text-glow">Advanced Security Tools</span>
            </h2>
            <p className="text-lg text-foreground/70">
              Cutting-edge features powered by artificial intelligence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Fake URL Detector",
                description: "Identify malicious links and suspicious domains",
                icon: "🔗",
              },
              {
                title: "Password Strength Checker",
                description: "Analyze and improve your password security",
                icon: "🔐",
              },
              {
                title: "Email Scam Analyzer",
                description: "AI-powered detection of phishing and scam emails",
                icon: "📧",
              },
              {
                title: "Cyber Safety Score",
                description: "Gamified security assessment and improvement tracking",
                icon: "📊",
              },
            ].map((tool, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="glassmorphism p-6 rounded-xl hover:border-cyan-500/40 transition-all duration-300"
              >
                <div className="text-4xl mb-3">{tool.icon}</div>
                <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                <p className="text-foreground/70">{tool.description}</p>
              </motion.div>
            ))}
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
            © 2024 CyberRakshak. Protecting the digital world.
          </p>
          <p className="text-foreground/40 text-sm">
            Stay vigilant, stay secure.
          </p>
        </div>
      </footer>
    </div>
  );
}

