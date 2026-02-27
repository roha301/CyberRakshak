import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Home from "./pages/Home";
import CybercrimeTypes from "./pages/CybercrimeTypes";
import LiveAlerts from "./pages/LiveAlerts";
import SafetyChecklist from "./pages/SafetyChecklist";
import Quiz from "./pages/Quiz";
import ReportScam from "./pages/ReportScam";
import AIAssistant from "./pages/AIAssistant";
import SecurityTools from "./pages/SecurityTools";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cybercrime-types" element={<CybercrimeTypes />} />
            <Route path="/live-alerts" element={<LiveAlerts />} />
            <Route path="/safety-checklist" element={<SafetyChecklist />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/report-scam" element={<ReportScam />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/security-tools" element={<SecurityTools />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
