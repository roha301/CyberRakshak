import { NextFunction, Request, RequestHandler, Response } from "express";
import { scamReportsStore } from "./scam-report";
import { liveAlertsStore } from "./live-alerts";
import { quizAttemptsStore, quizQuestionsStore } from "./quiz";

const ADMIN_USERNAME = "CyberRakshak_21";
const ADMIN_PASSWORD = "CyberRakshak@1234";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 3;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

type SessionRecord = {
  token: string;
  createdAt: number;
  expiresAt: number;
};

type AiQueryLog = {
  id: string;
  userId: string;
  prompt: string;
  reply: string;
  language: "en" | "hi";
  createdAt: string;
  reviewStatus: "open" | "reviewed";
  isPotentiallyHarmful: boolean;
  markedIncorrect: boolean;
  reviewerNote?: string;
};

type ApiUsageLog = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  at: string;
};

type SecurityAlert = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "resolved";
  createdAt: string;
};

type Article = {
  id: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  updatedAt: string;
};

type Faq = {
  id: string;
  question: string;
  answer: string;
  updatedAt: string;
};

const adminSessions = new Map<string, SessionRecord>();
const loginAttempts = new Map<
  string,
  { count: number; lockedUntil: number }
>();

const aiQueriesStore: AiQueryLog[] = [];
const apiUsageStore: ApiUsageLog[] = [];
const securityAlertsStore: SecurityAlert[] = [
  {
    id: "sec-1",
    title: "High failed login attempts observed on /api/ai-assistant/chat",
    severity: "medium",
    status: "open",
    createdAt: new Date().toISOString(),
  },
];

const articlesStore: Article[] = [
  {
    id: "article-1",
    title: "How to Spot Phishing Emails",
    category: "Phishing",
    summary: "Quick checks to detect phishing attempts before clicking links.",
    body: "Always verify sender domain, avoid urgent-action requests, and hover over links before opening.",
    updatedAt: new Date().toISOString(),
  },
];

const faqStore: Faq[] = [
  {
    id: "faq-1",
    question: "What should I do after clicking a suspicious link?",
    answer: "Disconnect from network, run malware scan, change passwords, and enable 2FA immediately.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "faq-2",
    question: "How can I verify if a website is genuine?",
    answer: "Check exact domain spelling, HTTPS certificate, and visit site directly instead of email links.",
    updatedAt: new Date().toISOString(),
  },
];

const platformConfig = {
  maintenanceMode: false,
  aiSafetyFilter: true,
  maxQuizQuestionsPerRequest: 20,
  scamReportAutoTagging: true,
};

const apiUsageSummary = {
  totalRequests: 0,
  totalErrors: 0,
};

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readAuthToken(req: Request) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return "";
  return auth.slice("Bearer ".length).trim();
}

function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) {
    if (session.expiresAt <= now) {
      adminSessions.delete(token);
    }
  }
}

function getUniqueUsers() {
  const userMap = new Map<
    string,
    { id: string; reportCount: number; quizAttempts: number; aiQueries: number; lastActivity: string }
  >();

  for (const report of scamReportsStore) {
    const existing = userMap.get(report.userId) || {
      id: report.userId,
      reportCount: 0,
      quizAttempts: 0,
      aiQueries: 0,
      lastActivity: report.timestamp,
    };
    existing.reportCount += 1;
    if (report.timestamp > existing.lastActivity) existing.lastActivity = report.timestamp;
    userMap.set(report.userId, existing);
  }

  for (const attempt of quizAttemptsStore) {
    const existing = userMap.get(attempt.userId) || {
      id: attempt.userId,
      reportCount: 0,
      quizAttempts: 0,
      aiQueries: 0,
      lastActivity: attempt.submittedAt,
    };
    existing.quizAttempts += 1;
    if (attempt.submittedAt > existing.lastActivity) existing.lastActivity = attempt.submittedAt;
    userMap.set(attempt.userId, existing);
  }

  for (const query of aiQueriesStore) {
    const existing = userMap.get(query.userId) || {
      id: query.userId,
      reportCount: 0,
      quizAttempts: 0,
      aiQueries: 0,
      lastActivity: query.createdAt,
    };
    existing.aiQueries += 1;
    if (query.createdAt > existing.lastActivity) existing.lastActivity = query.createdAt;
    userMap.set(query.userId, existing);
  }

  return Array.from(userMap.values()).sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : -1));
}

export function recordApiUsage(method: string, path: string, statusCode: number, durationMs: number) {
  apiUsageSummary.totalRequests += 1;
  if (statusCode >= 400) apiUsageSummary.totalErrors += 1;
  apiUsageStore.unshift({
    id: generateId("api"),
    method,
    path,
    statusCode,
    durationMs,
    at: new Date().toISOString(),
  });
  if (apiUsageStore.length > 300) {
    apiUsageStore.length = 300;
  }
}

export function recordAiQueryLog(entry: {
  userId: string;
  prompt: string;
  reply: string;
  language: "en" | "hi";
}) {
  aiQueriesStore.unshift({
    id: generateId("aiq"),
    userId: entry.userId,
    prompt: entry.prompt,
    reply: entry.reply,
    language: entry.language,
    createdAt: new Date().toISOString(),
    reviewStatus: "open",
    isPotentiallyHarmful: false,
    markedIncorrect: false,
  });
  if (aiQueriesStore.length > 500) {
    aiQueriesStore.length = 500;
  }
}

export function getAdminFaqEntries() {
  return faqStore;
}

export const requireAdminAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  cleanupSessions();
  const token = readAuthToken(req);
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized admin access" });
  }
  next();
};

export const handleAdminLogin: RequestHandler = (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const attemptKey = req.ip || "unknown-ip";
  const attemptState = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: 0 };
  const now = Date.now();

  if (attemptState.lockedUntil > now) {
    return res.status(429).json({
      error: "Admin access denied due to multiple failed attempts. Try again later.",
      retryAfterMs: attemptState.lockedUntil - now,
    });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    const nextCount = attemptState.count + 1;
    if (nextCount >= LOGIN_MAX_ATTEMPTS) {
      loginAttempts.set(attemptKey, {
        count: nextCount,
        lockedUntil: now + LOGIN_LOCK_MS,
      });
      return res.status(429).json({
        error: "Admin access denied due to multiple failed attempts. Try again later.",
        retryAfterMs: LOGIN_LOCK_MS,
      });
    }
    loginAttempts.set(attemptKey, { count: nextCount, lockedUntil: 0 });
    return res.status(401).json({ error: "Invalid username or password" });
  }

  loginAttempts.delete(attemptKey);

  const token = generateId("admin-token");
  const createdAt = Date.now();
  adminSessions.set(token, {
    token,
    createdAt,
    expiresAt: createdAt + SESSION_TTL_MS,
  });
  return res.json({
    token,
    username: ADMIN_USERNAME,
    expiresInMs: SESSION_TTL_MS,
  });
};

export const handleAdminSession: RequestHandler = (req, res) => {
  cleanupSessions();
  const token = readAuthToken(req);
  const active = Boolean(token && adminSessions.has(token));
  res.json({ active, username: active ? ADMIN_USERNAME : null });
};

export const handleAdminLogout: RequestHandler = (req, res) => {
  const token = readAuthToken(req);
  if (token) adminSessions.delete(token);
  res.json({ success: true });
};

export const handleAdminDashboard: RequestHandler = (_req, res) => {
  const totalReports = scamReportsStore.length;
  const activeUsers = getUniqueUsers().length;
  const mostCommonScamTypes = Object.entries(
    scamReportsStore.reduce<Record<string, number>>((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  const quizParticipationRate =
    activeUsers > 0 ? Math.round((quizAttemptsStore.length / activeUsers) * 100) : 0;

  res.json({
    metrics: {
      totalScamReports: totalReports,
      activeUsers,
      mostCommonScamTypes,
      quizParticipationRate,
      aiQueries: aiQueriesStore.length,
      apiErrors: apiUsageSummary.totalErrors,
    },
  });
};

export const handleAdminUsers: RequestHandler = (_req, res) => {
  res.json({ data: getUniqueUsers() });
};

export const handleAdminReports: RequestHandler = (_req, res) => {
  res.json({ data: scamReportsStore });
};

export const handleAdminUpdateReport: RequestHandler = (req, res) => {
  const { id } = req.params;
  const report = scamReportsStore.find((r) => r.id === id);
  if (!report) return res.status(404).json({ error: "Report not found" });

  const { moderationStatus, authenticity, moderatorNote } = req.body as {
    moderationStatus?: "pending" | "approved" | "rejected" | "investigating";
    authenticity?: "unverified" | "verified" | "suspected-fake";
    moderatorNote?: string;
  };

  if (moderationStatus) report.moderationStatus = moderationStatus;
  if (authenticity) report.authenticity = authenticity;
  if (typeof moderatorNote === "string") report.moderatorNote = moderatorNote;

  res.json({ success: true, data: report });
};

export const handleAdminAlerts: RequestHandler = (_req, res) => {
  res.json({ data: liveAlertsStore });
};

export const handleAdminCreateAlert: RequestHandler = (req, res) => {
  const { title, description, severity, type, targetAudience } = req.body as {
    title?: string;
    description?: string;
    severity?: "low" | "medium" | "high" | "critical";
    type?: string;
    targetAudience?: string;
  };
  if (!title || !description || !severity || !type || !targetAudience) {
    return res.status(400).json({ error: "Missing required alert fields" });
  }
  const alert = {
    id: generateId("alert"),
    title,
    description,
    severity,
    type,
    targetAudience,
    reportedCases: 0,
    timestamp: new Date().toISOString(),
    preventionTips: ["Stay alert and verify with official channels."],
  };
  liveAlertsStore.unshift(alert);
  res.status(201).json({ success: true, data: alert });
};

export const handleAdminUpdateAlert: RequestHandler = (req, res) => {
  const { id } = req.params;
  const alert = liveAlertsStore.find((a) => a.id === id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  Object.assign(alert, req.body || {});
  alert.timestamp = new Date().toISOString();
  res.json({ success: true, data: alert });
};

export const handleAdminDeleteAlert: RequestHandler = (req, res) => {
  const { id } = req.params;
  const idx = liveAlertsStore.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "Alert not found" });
  liveAlertsStore.splice(idx, 1);
  res.json({ success: true });
};

export const handleAdminArticles: RequestHandler = (_req, res) => {
  res.json({ data: articlesStore });
};

export const handleAdminCreateArticle: RequestHandler = (req, res) => {
  const { title, category, summary, body } = req.body as Partial<Article>;
  if (!title || !category || !summary || !body) {
    return res.status(400).json({ error: "Missing required article fields" });
  }
  const article: Article = {
    id: generateId("article"),
    title,
    category,
    summary,
    body,
    updatedAt: new Date().toISOString(),
  };
  articlesStore.unshift(article);
  res.status(201).json({ success: true, data: article });
};

export const handleAdminUpdateArticle: RequestHandler = (req, res) => {
  const { id } = req.params;
  const article = articlesStore.find((a) => a.id === id);
  if (!article) return res.status(404).json({ error: "Article not found" });
  Object.assign(article, req.body || {});
  article.updatedAt = new Date().toISOString();
  res.json({ success: true, data: article });
};

export const handleAdminDeleteArticle: RequestHandler = (req, res) => {
  const { id } = req.params;
  const idx = articlesStore.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "Article not found" });
  articlesStore.splice(idx, 1);
  res.json({ success: true });
};

export const handleAdminQuizQuestions: RequestHandler = (_req, res) => {
  res.json({ data: quizQuestionsStore });
};

export const handleAdminCreateQuizQuestion: RequestHandler = (req, res) => {
  const { question, options, correctAnswer, explanation, difficulty, category } = req.body as {
    question?: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
    difficulty?: "easy" | "medium" | "hard";
    category?: string;
  };
  if (
    !question ||
    !Array.isArray(options) ||
    options.length < 2 ||
    typeof correctAnswer !== "number" ||
    !explanation ||
    !difficulty ||
    !category
  ) {
    return res.status(400).json({ error: "Invalid quiz question payload" });
  }
  const item = {
    id: generateId("quiz"),
    question,
    options,
    correctAnswer,
    explanation,
    difficulty,
    category,
  };
  quizQuestionsStore.unshift(item);
  res.status(201).json({ success: true, data: item });
};

export const handleAdminUpdateQuizQuestion: RequestHandler = (req, res) => {
  const { id } = req.params;
  const question = quizQuestionsStore.find((q) => q.id === id);
  if (!question) return res.status(404).json({ error: "Question not found" });
  Object.assign(question, req.body || {});
  res.json({ success: true, data: question });
};

export const handleAdminDeleteQuizQuestion: RequestHandler = (req, res) => {
  const { id } = req.params;
  const idx = quizQuestionsStore.findIndex((q) => q.id === id);
  if (idx === -1) return res.status(404).json({ error: "Question not found" });
  quizQuestionsStore.splice(idx, 1);
  res.json({ success: true });
};

export const handleAdminFaqs: RequestHandler = (_req, res) => {
  res.json({ data: faqStore });
};

export const handleAdminCreateFaq: RequestHandler = (req, res) => {
  const { question, answer } = req.body as Partial<Faq>;
  if (!question || !answer) return res.status(400).json({ error: "Missing FAQ fields" });
  const faq: Faq = {
    id: generateId("faq"),
    question,
    answer,
    updatedAt: new Date().toISOString(),
  };
  faqStore.unshift(faq);
  res.status(201).json({ success: true, data: faq });
};

export const handleAdminUpdateFaq: RequestHandler = (req, res) => {
  const { id } = req.params;
  const faq = faqStore.find((f) => f.id === id);
  if (!faq) return res.status(404).json({ error: "FAQ not found" });
  Object.assign(faq, req.body || {});
  faq.updatedAt = new Date().toISOString();
  res.json({ success: true, data: faq });
};

export const handleAdminDeleteFaq: RequestHandler = (req, res) => {
  const { id } = req.params;
  const idx = faqStore.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "FAQ not found" });
  faqStore.splice(idx, 1);
  res.json({ success: true });
};

export const handleAdminAnalytics: RequestHandler = (_req, res) => {
  const commonScamTypes = Object.entries(
    scamReportsStore.reduce<Record<string, number>>((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  const quizParticipationRate =
    getUniqueUsers().length > 0
      ? Math.round((quizAttemptsStore.length / getUniqueUsers().length) * 100)
      : 0;

  res.json({
    totalScamReports: scamReportsStore.length,
    activeUsers: getUniqueUsers().length,
    commonScamTypes,
    quizParticipationRate,
    aiQueries: aiQueriesStore.length,
  });
};

export const handleAdminAiQueries: RequestHandler = (_req, res) => {
  res.json({ data: aiQueriesStore });
};

export const handleAdminUpdateAiQuery: RequestHandler = (req, res) => {
  const { id } = req.params;
  const query = aiQueriesStore.find((q) => q.id === id);
  if (!query) return res.status(404).json({ error: "AI query log not found" });
  const { reviewStatus, isPotentiallyHarmful, markedIncorrect, reviewerNote } = req.body as Partial<AiQueryLog>;
  if (reviewStatus) query.reviewStatus = reviewStatus;
  if (typeof isPotentiallyHarmful === "boolean") query.isPotentiallyHarmful = isPotentiallyHarmful;
  if (typeof markedIncorrect === "boolean") query.markedIncorrect = markedIncorrect;
  if (typeof reviewerNote === "string") query.reviewerNote = reviewerNote;
  res.json({ success: true, data: query });
};

export const handleAdminSystemConfig: RequestHandler = (_req, res) => {
  res.json({ data: platformConfig });
};

export const handleAdminUpdateSystemConfig: RequestHandler = (req, res) => {
  Object.assign(platformConfig, req.body || {});
  res.json({ success: true, data: platformConfig });
};

export const handleAdminSystemLogs: RequestHandler = (_req, res) => {
  res.json({
    summary: apiUsageSummary,
    data: apiUsageStore,
  });
};

export const handleAdminSecurityAlerts: RequestHandler = (_req, res) => {
  res.json({ data: securityAlertsStore });
};

export const handleAdminCreateSecurityAlert: RequestHandler = (req, res) => {
  const { title, severity } = req.body as Partial<SecurityAlert>;
  if (!title || !severity) return res.status(400).json({ error: "Missing security alert fields" });
  const item: SecurityAlert = {
    id: generateId("sec"),
    title,
    severity,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  securityAlertsStore.unshift(item);
  res.status(201).json({ success: true, data: item });
};

export const handleAdminDeleteSecurityAlert: RequestHandler = (req, res) => {
  const { id } = req.params;
  const idx = securityAlertsStore.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Security alert not found" });
  securityAlertsStore.splice(idx, 1);
  res.json({ success: true });
};
