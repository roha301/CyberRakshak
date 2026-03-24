import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bot } from "lucide-react";

export default function GlobalAIAssistantButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="fixed right-5 bottom-5 z-50"
    >
      <Link
        to="/ai-assistant"
        className="group relative flex items-center justify-center rounded-full border border-cyan-400/40 bg-black/75 p-4 backdrop-blur-md shadow-[0_0_25px_rgba(0,204,255,0.28)] hover:shadow-[0_0_30px_rgba(0,204,255,0.45)] transition-all duration-300"
        aria-label="Open CyberRakshak Assistant"
      >
        <Bot className="w-6 h-6 text-cyan-300" />
        <span className="absolute -inset-1 rounded-full border border-cyan-300/30 animate-ping" />
      </Link>
    </motion.div>
  );
}
