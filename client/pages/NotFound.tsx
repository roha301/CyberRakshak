import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0 grid-pattern"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse-glow"></div>
            <AlertTriangle className="w-20 h-20 text-cyan-400 relative" />
          </div>
        </div>

        <h1 className="text-7xl md:text-8xl font-bold mb-4">
          <span className="text-glow">404</span>
        </h1>

        <p className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
          Page Not Found
        </p>

        <p className="text-lg text-foreground/70 mb-8 max-w-md">
          It seems you've encountered a security breach in the system. This page doesn't exist.
        </p>

        <Link
          to="/"
          className="button-glow inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-background font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(0,204,255,0.6)] transition-all duration-300"
        >
          Return to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
