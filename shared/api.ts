/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/* ============ CYBERCRIME TYPES ============ */
export interface CrimeTip {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export interface CrimeType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  examples: string[];
  signs: string[];
  prevention: string[];
  tips: CrimeTip[];
}

export interface CrimeTypesResponse {
  data: CrimeType[];
}

/* ============ LIVE ALERTS ============ */
export interface ScamAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  targetAudience: string;
  reportedCases: number;
  timestamp: string;
  preventionTips: string[];
}

export interface LiveAlertsResponse {
  data: ScamAlert[];
  total: number;
}

/* ============ QUIZ ============ */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

export interface QuizResponse {
  data: QuizQuestion[];
}

export interface QuizSubmission {
  questionId: string;
  userAnswer: number;
  isCorrect: boolean;
}

export interface QuizResultResponse {
  score: number;
  totalQuestions: number;
  percentage: number;
  results: QuizSubmission[];
}

/* ============ SCAM REPORT ============ */
export interface ScamReportInput {
  type: string;
  description: string;
  amount?: number;
  url?: string;
  email?: string;
  phoneNumber?: string;
  incidentDate: string;
  reportedTo?: string;
}

export interface ScamReportResponse {
  success: boolean;
  reportId: string;
  message: string;
}

/* ============ SAFETY CHECKLIST ============ */
export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  steps: string[];
  priority: "high" | "medium" | "low";
  estimatedTime: string;
}

export interface ChecklistResponse {
  data: ChecklistItem[];
}

/* ============ GENERAL RESPONSE ============ */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
