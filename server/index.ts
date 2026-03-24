import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleGetCrimeTypes,
  handleGetCrimeTypeById,
} from "./routes/cybercrime-types";
import {
  handleGetLiveAlerts,
  handleGetAlertById,
  handleGetAlertsByType,
} from "./routes/live-alerts";
import {
  handleGetChecklist,
  handleGetChecklistItemById,
  handleGetCategories as getChecklistCategories,
} from "./routes/safety-checklist";
import {
  handleGetQuizQuestions,
  handleGetQuestionById,
  handleSubmitQuiz,
  handleGetCategories as getQuizCategories,
} from "./routes/quiz";
import {
  handleSubmitScamReport,
  handleGetReportStatus,
  handleGetReportStats,
  handleGetRecommendations,
  handleGetRecentReports,
} from "./routes/scam-report";
import { handleAiAssistantChat } from "./routes/ai-assistant";
import {
  handleAdminAiQueries,
  handleAdminAlerts,
  handleAdminAnalytics,
  handleAdminArticles,
  handleAdminCreateAlert,
  handleAdminCreateArticle,
  handleAdminCreateFaq,
  handleAdminCreateQuizQuestion,
  handleAdminCreateSecurityAlert,
  handleAdminDashboard,
  handleAdminDeleteAlert,
  handleAdminDeleteArticle,
  handleAdminDeleteFaq,
  handleAdminDeleteQuizQuestion,
  handleAdminDeleteSecurityAlert,
  handleAdminFaqs,
  handleAdminLogin,
  handleAdminLogout,
  handleAdminQuizQuestions,
  handleAdminReports,
  handleAdminSecurityAlerts,
  handleAdminSession,
  handleAdminSystemConfig,
  handleAdminSystemLogs,
  handleAdminUpdateAiQuery,
  handleAdminUpdateAlert,
  handleAdminUpdateArticle,
  handleAdminUpdateFaq,
  handleAdminUpdateQuizQuestion,
  handleAdminUpdateReport,
  handleAdminUpdateSystemConfig,
  handleAdminUsers,
  recordApiUsage,
  requireAdminAuth,
} from "./routes/admin";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ extended: true, limit: "4mb" }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api")) {
        recordApiUsage(req.method, req.path, res.statusCode, Date.now() - start);
      }
    });
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Cybercrime Types Routes
  app.get("/api/cybercrime-types", handleGetCrimeTypes);
  app.get("/api/cybercrime-types/:id", handleGetCrimeTypeById);

  // Live Alerts Routes
  app.get("/api/live-alerts", handleGetLiveAlerts);
  app.get("/api/live-alerts/:id", handleGetAlertById);
  app.get("/api/live-alerts/type/:type", handleGetAlertsByType);

  // Safety Checklist Routes
  app.get("/api/safety-checklist", handleGetChecklist);
  app.get("/api/safety-checklist/:id", handleGetChecklistItemById);
  app.get("/api/safety-checklist-categories", getChecklistCategories);

  // Quiz Routes
  app.get("/api/quiz/questions", handleGetQuizQuestions);
  app.get("/api/quiz/questions/:id", handleGetQuestionById);
  app.post("/api/quiz/submit", handleSubmitQuiz);
  app.get("/api/quiz-categories", getQuizCategories);

  // Scam Report Routes
  app.post("/api/scam-report", handleSubmitScamReport);
  app.get("/api/scam-report/:reportId", handleGetReportStatus);
  app.get("/api/scam-report-stats", handleGetReportStats);
  app.get("/api/scam-recommendations", handleGetRecommendations);
  app.get("/api/recent-reports", handleGetRecentReports);

  // AI Assistant Route
  app.post("/api/ai-assistant/chat", handleAiAssistantChat);

  // Admin Auth Routes
  app.post("/api/admin/login", handleAdminLogin);
  app.get("/api/admin/session", handleAdminSession);
  app.post("/api/admin/logout", requireAdminAuth, handleAdminLogout);

  // Admin Protected Routes
  app.get("/api/admin/dashboard", requireAdminAuth, handleAdminDashboard);
  app.get("/api/admin/users", requireAdminAuth, handleAdminUsers);

  app.get("/api/admin/reports", requireAdminAuth, handleAdminReports);
  app.patch("/api/admin/reports/:id", requireAdminAuth, handleAdminUpdateReport);

  app.get("/api/admin/alerts", requireAdminAuth, handleAdminAlerts);
  app.post("/api/admin/alerts", requireAdminAuth, handleAdminCreateAlert);
  app.put("/api/admin/alerts/:id", requireAdminAuth, handleAdminUpdateAlert);
  app.delete("/api/admin/alerts/:id", requireAdminAuth, handleAdminDeleteAlert);

  app.get("/api/admin/articles", requireAdminAuth, handleAdminArticles);
  app.post("/api/admin/articles", requireAdminAuth, handleAdminCreateArticle);
  app.put("/api/admin/articles/:id", requireAdminAuth, handleAdminUpdateArticle);
  app.delete("/api/admin/articles/:id", requireAdminAuth, handleAdminDeleteArticle);

  app.get("/api/admin/quiz-questions", requireAdminAuth, handleAdminQuizQuestions);
  app.post("/api/admin/quiz-questions", requireAdminAuth, handleAdminCreateQuizQuestion);
  app.put("/api/admin/quiz-questions/:id", requireAdminAuth, handleAdminUpdateQuizQuestion);
  app.delete("/api/admin/quiz-questions/:id", requireAdminAuth, handleAdminDeleteQuizQuestion);

  app.get("/api/admin/faqs", requireAdminAuth, handleAdminFaqs);
  app.post("/api/admin/faqs", requireAdminAuth, handleAdminCreateFaq);
  app.put("/api/admin/faqs/:id", requireAdminAuth, handleAdminUpdateFaq);
  app.delete("/api/admin/faqs/:id", requireAdminAuth, handleAdminDeleteFaq);

  app.get("/api/admin/analytics", requireAdminAuth, handleAdminAnalytics);

  app.get("/api/admin/ai-queries", requireAdminAuth, handleAdminAiQueries);
  app.patch("/api/admin/ai-queries/:id", requireAdminAuth, handleAdminUpdateAiQuery);

  app.get("/api/admin/system/config", requireAdminAuth, handleAdminSystemConfig);
  app.patch("/api/admin/system/config", requireAdminAuth, handleAdminUpdateSystemConfig);
  app.get("/api/admin/system/logs", requireAdminAuth, handleAdminSystemLogs);
  app.get("/api/admin/system/security-alerts", requireAdminAuth, handleAdminSecurityAlerts);
  app.post("/api/admin/system/security-alerts", requireAdminAuth, handleAdminCreateSecurityAlert);
  app.delete("/api/admin/system/security-alerts/:id", requireAdminAuth, handleAdminDeleteSecurityAlert);

  return app;
}
