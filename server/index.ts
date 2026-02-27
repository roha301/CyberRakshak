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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  return app;
}
