import { Link } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Home", path: "/" },
    { name: "Cybercrime Types", path: "/cybercrime-types" },
    { name: "Live Alerts", path: "/live-alerts" },
    { name: "Safety Checklist", path: "/safety-checklist" },
    { name: "Quiz", path: "/quiz" },
    { name: "Report Scam", path: "/report-scam" },
    { name: "AI Assistant", path: "/ai-assistant" },
    { name: "Security Tools", path: "/security-tools" },
  ];

  return (
    <nav className="fixed w-full top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyan-400 animate-pulse-glow" />
              <div className="absolute inset-0 animate-pulse-glow opacity-75 blur-md bg-cyan-400"></div>
            </div>
            <span className="text-xl font-bold text-glow hidden sm:inline">
              CyberRakshak
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-cyan-400 transition-colors duration-200 relative group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? "auto" : 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="px-2 pt-2 pb-4 space-y-1 border-t border-cyan-500/20">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-foreground/80 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </nav>
  );
}
