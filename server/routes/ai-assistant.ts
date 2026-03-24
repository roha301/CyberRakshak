import { RequestHandler } from "express";
import { AiAssistantRequest, AiAssistantResponse } from "@shared/api";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getAdminFaqEntries, recordAiQueryLog } from "./admin";

const GEMINI_MODEL = "gemini-2.5-pro";
const OPENAI_MODEL = "gpt-4o-mini";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGeminiApiKey() {
  if (process.env.GOOGLE_GENAI_API_KEY) {
    return process.env.GOOGLE_GENAI_API_KEY;
  }

  // Fallback: explicitly load .env in case runtime cwd differs.
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  if (process.env.GOOGLE_GENAI_API_KEY) {
    return process.env.GOOGLE_GENAI_API_KEY;
  }

  // Fallback for compiled server path: dist/server -> project root
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  return process.env.GOOGLE_GENAI_API_KEY;
}

function getOpenAiApiKey() {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  return process.env.OPENAI_API_KEY;
}

function buildSystemInstruction(language: "en" | "hi") {
  const faqContext = getAdminFaqEntries().slice(0, 8).map((faq) => `Q: ${faq.question} A: ${faq.answer}`).join(" | ");
  if (language === "hi") {
    return [
      "à¤†à¤ª à¤à¤• à¤¸à¤¾à¤‡à¤¬à¤° à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤¸à¤¹à¤¾à¤¯à¤• à¤¹à¥ˆà¤‚à¥¤",
      "à¤‰à¤¤à¥à¤¤à¤° à¤¸à¥à¤ªà¤·à¥à¤Ÿ, à¤µà¥à¤¯à¤¾à¤µà¤¹à¤¾à¤°à¤¿à¤• à¤”à¤° à¤ªà¥‡à¤¶à¥‡à¤µà¤° à¤¹à¤¿à¤‚à¤¦à¥€ à¤®à¥‡à¤‚ à¤¦à¥‡à¤‚à¥¤",
      "à¤¡à¤¿à¤«à¤¼à¥‰à¤²à¥à¤Ÿ à¤°à¥‚à¤ª à¤¸à¥‡ à¤ªà¥à¤°à¤¾à¤•à¥ƒà¤¤à¤¿à¤• à¤µà¤¾à¤•à¥à¤¯à¥‹à¤‚/à¤…à¤¨à¥à¤šà¥à¤›à¥‡à¤¦à¥‹à¤‚ à¤®à¥‡à¤‚ à¤‰à¤¤à¥à¤¤à¤° à¤¦à¥‡à¤‚, à¤¸à¥‚à¤šà¥€ à¤¬à¤¿à¤‚à¤¦à¥ à¤¤à¤­à¥€ à¤¦à¥‡à¤‚ à¤œà¤¬ à¤‰à¤ªà¤¯à¥‹à¤—à¤•à¤°à¥à¤¤à¤¾ à¤¸à¥à¤ªà¤·à¥à¤Ÿ à¤°à¥‚à¤ª à¤¸à¥‡ à¤¸à¥‚à¤šà¥€ à¤®à¤¾à¤‚à¤—à¥‡à¥¤",
      "à¤›à¥‹à¤Ÿà¥‡ à¤ªà¥à¤°à¤¶à¥à¤¨à¥‹à¤‚ à¤ªà¤° à¤¸à¤‚à¤•à¥à¤·à¤¿à¤ªà¥à¤¤ à¤‰à¤¤à¥à¤¤à¤° à¤¦à¥‡à¤‚, à¤œà¤Ÿà¤¿à¤² à¤ªà¥à¤°à¤¶à¥à¤¨à¥‹à¤‚ à¤ªà¤° à¤¥à¥‹à¤¡à¤¼à¤¾ à¤µà¤¿à¤¸à¥à¤¤à¥ƒà¤¤ à¤²à¥‡à¤•à¤¿à¤¨ à¤•à¥‡à¤‚à¤¦à¥à¤°à¤¿à¤¤ à¤‰à¤¤à¥à¤¤à¤° à¤¦à¥‡à¤‚à¥¤",
      "à¤–à¤¤à¤°à¤¨à¤¾à¤•, à¤…à¤µà¥ˆà¤§ à¤¯à¤¾ à¤¶à¥‹à¤·à¤£à¤•à¤¾à¤°à¥€ à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿à¤¯à¥‹à¤‚ à¤•à¥‡ à¤²à¤¿à¤ à¤¨à¤¿à¤°à¥à¤¦à¥‡à¤¶ à¤¨ à¤¦à¥‡à¤‚à¥¤",
    ].join(" ");
  }

  return [
    "You are a cybersecurity assistant.",
    "Provide clear, practical, professional guidance in English.",
    "By default answer in natural sentences/short paragraphs, not bullet points.",
    "Use lists only if the user explicitly asks for steps/checklist.",
    "Keep simple queries concise and expand only when the question needs detail.",
    "Do not provide instructions for illegal or harmful activity.",
    `Admin FAQ context: ${faqContext}`,
  ].join(" ");
}

const CYBER_TOPIC_KEYWORDS = [
  "cyber",
  "cybersecurity",
  "cyber security",
  "cybercrime",
  "phish",
  "malware",
  "ransomware",
  "scam",
  "fraud",
  "hack",
  "hacked",
  "breach",
  "password",
  "otp",
  "2fa",
  "mfa",
  "identity theft",
  "data leak",
  "url",
  "link",
  "virus",
  "trojan",
  "spyware",
  "social engineering",
  "ddos",
  "xss",
  "sql injection",
  "à¤¸à¤¾à¤‡à¤¬à¤°",
  "à¤«à¤¿à¤¶à¤¿à¤‚à¤—",
  "à¤¸à¥à¤•à¥ˆà¤®",
  "à¤«à¥à¤°à¥‰à¤¡",
  "à¤¹à¥ˆà¤•",
  "à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡",
  "à¤“à¤Ÿà¥€à¤ªà¥€",
  "à¤§à¥‹à¤–à¤¾à¤§à¤¡à¤¼à¥€",
  "à¤®à¥ˆà¤²à¤µà¥‡à¤¯à¤°",
  "à¤²à¤¿à¤‚à¤•",
  "à¤¸à¥à¤°à¤•à¥à¤·à¤¾",
];

function isCyberTopicPrompt(prompt: string) {
  const normalized = prompt.toLowerCase();
  return CYBER_TOPIC_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function buildLocalFallbackReply(prompt: string, language: "en" | "hi") {
  const q = prompt.toLowerCase();

  if (q.includes("phish") || q.includes("email") || q.includes("à¤ˆà¤®à¥‡à¤²") || q.includes("à¤«à¤¿à¤¶")) {
    return language === "hi"
      ? "à¤«à¤¼à¤¿à¤¶à¤¿à¤‚à¤— à¤ˆà¤®à¥‡à¤² à¤®à¥‡à¤‚ à¤†à¤®à¤¤à¥Œà¤° à¤ªà¤° à¤­à¥‡à¤œà¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤•à¤¾ à¤ªà¤¤à¤¾ à¤¸à¤‚à¤¦à¤¿à¤—à¥à¤§ à¤¹à¥‹à¤¤à¤¾ à¤¹à¥ˆ, à¤¸à¤‚à¤¦à¥‡à¤¶ à¤®à¥‡à¤‚ à¤œà¤²à¥à¤¦à¥€ à¤•à¤¾à¤°à¥à¤°à¤µà¤¾à¤ˆ à¤•à¤¾ à¤¦à¤¬à¤¾à¤µ à¤¬à¤¨à¤¾à¤¯à¤¾ à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆ, à¤”à¤° à¤²à¤¿à¤‚à¤• à¤…à¤¸à¤²à¥€ à¤µà¥‡à¤¬à¤¸à¤¾à¤‡à¤Ÿ à¤œà¥ˆà¤¸à¤¾ à¤¦à¤¿à¤–à¤•à¤° à¤­à¥€ à¤…à¤²à¤— à¤¡à¥‹à¤®à¥‡à¤¨ à¤ªà¤° à¤²à¥‡ à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆà¥¤ à¤•à¤¿à¤¸à¥€ à¤­à¥€ à¤²à¤¿à¤‚à¤• à¤ªà¤° à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¤¨à¥‡ à¤¸à¥‡ à¤ªà¤¹à¤²à¥‡ à¤‰à¤¸à¤•à¤¾ à¤¡à¥‹à¤®à¥‡à¤¨ à¤œà¤¾à¤‚à¤šà¥‡à¤‚, OTP à¤¯à¤¾ à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤¸à¤¾à¤à¤¾ à¤¨ à¤•à¤°à¥‡à¤‚, à¤”à¤° à¤¯à¤¦à¤¿ à¤†à¤ªà¤¨à¥‡ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤¦à¥‡ à¤¦à¥€ à¤¹à¥ˆ à¤¤à¥‹ à¤¤à¥à¤°à¤‚à¤¤ à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤¬à¤¦à¤²à¤•à¤° 2FA à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¤°à¥‡à¤‚à¥¤"
      : "Phishing emails usually rely on urgency, suspicious sender domains, and links that look legitimate but redirect elsewhere. Before clicking anything, verify the sender and destination URL, never share OTPs or passwords, and if you already shared details, reset credentials immediately and enable 2FA.";
  }

  if (q.includes("password") || q.includes("à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡")) {
    return language === "hi"
      ? "à¤®à¤œà¤¼à¤¬à¥‚à¤¤ à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤•à¥‡ à¤²à¤¿à¤ à¤²à¤‚à¤¬à¤¾ à¤ªà¤¾à¤¸à¤«à¥à¤°à¥‡à¤œà¤¼ à¤°à¤–à¥‡à¤‚, à¤¹à¤° à¤–à¤¾à¤¤à¥‡ à¤®à¥‡à¤‚ à¤…à¤²à¤— à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤°à¥‡à¤‚, à¤”à¤° à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤®à¥ˆà¤¨à¥‡à¤œà¤° à¤…à¤ªà¤¨à¤¾à¤à¤à¥¤ à¤•à¥‡à¤µà¤² à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤ªà¤°à¥à¤¯à¤¾à¤ªà¥à¤¤ à¤¨à¤¹à¥€à¤‚ à¤¹à¥‹à¤¤à¤¾, à¤‡à¤¸à¤²à¤¿à¤ 2FA à¤…à¤µà¤¶à¥à¤¯ à¤šà¤¾à¤²à¥‚ à¤•à¤°à¥‡à¤‚à¥¤ à¤¯à¤¦à¤¿ à¤•à¤¿à¤¸à¥€ à¤¡à¥‡à¤Ÿà¤¾ à¤²à¥€à¤• à¤¯à¤¾ à¤¸à¤‚à¤¦à¤¿à¤—à¥à¤§ à¤²à¥‰à¤—à¤¿à¤¨ à¤•à¥€ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤®à¤¿à¤²à¥‡, à¤¤à¥‹ à¤¸à¤‚à¤¬à¤‚à¤§à¤¿à¤¤ à¤–à¤¾à¤¤à¥‡ à¤•à¤¾ à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤¤à¥à¤°à¤‚à¤¤ à¤¬à¤¦à¤²à¥‡à¤‚à¥¤"
      : "A strong password strategy means using a long passphrase, keeping every account unique, and relying on a password manager instead of reusing credentials. You should also enable 2FA, because password-only security is no longer enough. If any account is exposed in a breach, rotate that password immediately.";
  }

  if (q.includes("link") || q.includes("url") || q.includes("à¤²à¤¿à¤‚à¤•")) {
    return language === "hi"
      ? "à¤¸à¤‚à¤¦à¤¿à¤—à¥à¤§ à¤²à¤¿à¤‚à¤• à¤•à¥‡ à¤®à¤¾à¤®à¤²à¥‡ à¤®à¥‡à¤‚ à¤¸à¤¬à¤¸à¥‡ à¤ªà¤¹à¤²à¥‡ à¤¡à¥‹à¤®à¥‡à¤¨ à¤¨à¤¾à¤® à¤•à¥‹ à¤§à¥à¤¯à¤¾à¤¨ à¤¸à¥‡ à¤¦à¥‡à¤–à¥‡à¤‚, à¤•à¥à¤¯à¥‹à¤‚à¤•à¤¿ à¤¹à¤®à¤²à¤¾à¤µà¤° à¤…à¤•à¥à¤¸à¤° à¤®à¤¿à¤²à¤¤à¤¾-à¤œà¥à¤²à¤¤à¤¾ URL à¤¬à¤¨à¤¾à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤ à¤¶à¥‰à¤°à¥à¤Ÿ à¤²à¤¿à¤‚à¤• à¤•à¥‹ à¤¸à¥€à¤§à¥‡ à¤¨ à¤–à¥‹à¤²à¥‡à¤‚; à¤ªà¤¹à¤²à¥‡ à¤‰à¤¸à¤•à¤¾ à¤µà¤¾à¤¸à¥à¤¤à¤µà¤¿à¤• à¤—à¤‚à¤¤à¤µà¥à¤¯ à¤œà¤¾à¤‚à¤šà¥‡à¤‚à¥¤ à¤²à¥‰à¤—à¤¿à¤¨ à¤¯à¤¾ à¤­à¥à¤—à¤¤à¤¾à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤²à¤¿à¤‚à¤• à¤ªà¤° à¤¨à¤¿à¤°à¥à¤­à¤° à¤¹à¥‹à¤¨à¥‡ à¤•à¥‡ à¤¬à¤œà¤¾à¤¯, à¤µà¥‡à¤¬à¤¸à¤¾à¤‡à¤Ÿ à¤•à¤¾ à¤ªà¤¤à¤¾ à¤–à¥à¤¦ à¤Ÿà¤¾à¤‡à¤ª à¤•à¤°à¤•à¥‡ à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤¸à¤¾à¤‡à¤Ÿ à¤–à¥‹à¤²à¤¨à¤¾ à¤…à¤§à¤¿à¤• à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤°à¤¹à¤¤à¤¾ à¤¹à¥ˆà¥¤"
      : "For suspicious links, the most important check is the real domain, since attackers often use lookalike URLs. Avoid opening shortened links blindly and verify their destination first. For login or payment actions, it is safer to open the official website manually instead of trusting a link from email or chat.";
  }

  if (q.includes("hacked") || q.includes("compromise") || q.includes("hack") || q.includes("à¤¹à¥ˆà¤•")) {
    return language === "hi"
      ? "à¤¯à¤¦à¤¿ à¤…à¤•à¤¾à¤‰à¤‚à¤Ÿ à¤¹à¥ˆà¤• à¤¹à¥‹à¤¨à¥‡ à¤•à¤¾ à¤¶à¤• à¤¹à¥ˆ à¤¤à¥‹ à¤¤à¥à¤°à¤‚à¤¤ à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤¬à¤¦à¤²à¥‡à¤‚, à¤¸à¤­à¥€ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¸à¥‡à¤¶à¤¨à¥à¤¸ à¤¸à¥‡ à¤²à¥‰à¤—à¤†à¤‰à¤Ÿ à¤•à¤°à¥‡à¤‚ à¤”à¤° 2FA à¤šà¤¾à¤²à¥‚ à¤•à¤°à¥‡à¤‚à¥¤ à¤‡à¤¸à¤•à¥‡ à¤¬à¤¾à¤¦ à¤°à¤¿à¤•à¤µà¤°à¥€ à¤ˆà¤®à¥‡à¤²/à¤«à¥‹à¤¨ à¤”à¤° à¤¹à¤¾à¤² à¤•à¥€ à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿ à¤•à¥€ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¤°à¥‡à¤‚, à¤–à¤¾à¤¸à¤•à¤° à¤…à¤¨à¤œà¤¾à¤¨ à¤²à¥‰à¤—à¤¿à¤¨ à¤¯à¤¾ à¤Ÿà¥à¤°à¤¾à¤‚à¤œà¥ˆà¤•à¥à¤¶à¤¨ à¤ªà¤° à¤§à¥à¤¯à¤¾à¤¨ à¤¦à¥‡à¤‚à¥¤ à¤¯à¤¦à¤¿ à¤µà¤¿à¤¤à¥à¤¤à¥€à¤¯ à¤¯à¤¾ à¤ªà¤¹à¤šà¤¾à¤¨ à¤¸à¤‚à¤¬à¤‚à¤§à¥€ à¤œà¥‹à¤–à¤¿à¤® à¤¹à¥ˆ, à¤¤à¥‹ à¤¬à¥ˆà¤‚à¤• à¤¯à¤¾ à¤¸à¤‚à¤¬à¤‚à¤§à¤¿à¤¤ à¤ªà¥à¤²à¥‡à¤Ÿà¤«à¤¼à¥‰à¤°à¥à¤® à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ à¤¸à¥‡ à¤¤à¥à¤°à¤‚à¤¤ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚à¥¤"
      : "If you suspect account compromise, act immediately by changing the password, logging out of all sessions, and enabling 2FA. Then review recovery settings and recent activity for unknown logins or transactions. If money or identity data may be affected, contact your bank and platform support without delay.";
  }

  return language === "hi"
    ? "à¤¸à¤¾à¤‡à¤¬à¤° à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤•à¤¿à¤¸à¥€ à¤­à¥€ à¤¸à¤‚à¤¦à¤¿à¤—à¥à¤§ à¤®à¤¾à¤®à¤²à¥‡ à¤®à¥‡à¤‚ à¤ªà¤¹à¤²à¥‡ à¤¸à¤¬à¥‚à¤¤ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤°à¤–à¥‡à¤‚, à¤«à¤¿à¤° à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤¬à¤¦à¤²à¤•à¤° 2FA à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¤°à¥‡à¤‚, à¤”à¤° à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ à¤šà¥ˆà¤¨à¤² à¤¸à¥‡ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨ à¤•à¤°à¥‡à¤‚à¥¤ à¤¯à¤¦à¤¿ à¤–à¤¾à¤¤à¥‡, à¤ªà¥ˆà¤¸à¥‡ à¤¯à¤¾ à¤µà¥à¤¯à¤•à¥à¤¤à¤¿à¤—à¤¤ à¤¡à¥‡à¤Ÿà¤¾ à¤ªà¤° à¤œà¥‹à¤–à¤¿à¤® à¤¹à¥‹, à¤¤à¥‹ à¤¤à¥à¤°à¤‚à¤¤ à¤¸à¤‚à¤¬à¤‚à¤§à¤¿à¤¤ à¤¸à¤‚à¤¸à¥à¤¥à¤¾ à¤¯à¤¾ à¤¸à¤¾à¤‡à¤¬à¤° à¤¹à¥‡à¤²à¥à¤ªà¤²à¤¾à¤‡à¤¨ à¤¸à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¤¨à¤¾ à¤¸à¤¬à¤¸à¥‡ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤•à¤¦à¤® à¤¹à¥ˆà¥¤"
    : "In any suspicious cybersecurity situation, preserve evidence first, then rotate credentials and enable 2FA, and verify through official support channels. If accounts, money, or personal data are at risk, contact the relevant provider or cyber helpline immediately.";
}

export const handleAiAssistantChat: RequestHandler = async (req, res) => {
  try {
    const { prompt, language = "en", history = [] } = req.body as AiAssistantRequest;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }
    const userPrompt = prompt.trim();
    if (!isCyberTopicPrompt(userPrompt)) {
      const payload: AiAssistantResponse = {
        reply:
          language === "hi"
            ? "à¤®à¥ˆà¤‚ à¤•à¥‡à¤µà¤² à¤¸à¤¾à¤‡à¤¬à¤°à¤•à¥à¤°à¤¾à¤‡à¤® à¤”à¤° à¤¸à¤¾à¤‡à¤¬à¤° à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤¸à¥‡ à¤œà¥à¤¡à¤¼à¥‡ à¤ªà¥à¤°à¤¶à¥à¤¨à¥‹à¤‚ à¤•à¤¾ à¤‰à¤¤à¥à¤¤à¤° à¤¦à¥‡à¤¤à¤¾ à¤¹à¥‚à¤à¥¤ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤¸à¥à¤•à¥ˆà¤®, à¤«à¤¿à¤¶à¤¿à¤‚à¤—, à¤¹à¥ˆà¤•à¤¿à¤‚à¤—, à¤«à¥à¤°à¥‰à¤¡, à¤®à¥ˆà¤²à¤µà¥‡à¤¯à¤°, à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤¯à¤¾ à¤‘à¤¨à¤²à¤¾à¤‡à¤¨ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤ªà¤° à¤ªà¥à¤°à¤¶à¥à¤¨ à¤ªà¥‚à¤›à¥‡à¤‚à¥¤"
            : "I can only answer cybercrime and cybersecurity questions. Please ask about scams, phishing, hacking, fraud, malware, passwords, or online safety.",
      };
      return res.json(payload);
    }

    const safeHistory = Array.isArray(history) ? history.slice(-8) : [];
    const contents = [
      ...safeHistory.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ];

    const openAiKey = getOpenAiApiKey();
    if (openAiKey) {
      const openAiMessages = [
        {
          role: "system",
          content: `${buildSystemInstruction(language)} Always answer the latest user question directly. Avoid repeating a generic template.`,
        },
        ...safeHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: "user",
          content: userPrompt,
        },
      ];

      const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: openAiMessages,
          temperature: 0.45,
          max_tokens: 700,
        }),
      });

      const openAiData = await openAiResponse.json();
      const openAiReply =
        openAiData?.choices?.[0]?.message?.content?.trim() || "";

      if (openAiResponse.ok && openAiReply) {
        recordAiQueryLog({
          userId: req.ip || "anonymous-user",
          prompt: userPrompt,
          reply: openAiReply,
          language,
        });
        const payload: AiAssistantResponse = { reply: openAiReply };
        return res.json(payload);
      }
    }

    const geminiKey = getGeminiApiKey();
    if (!geminiKey) {
      return res.status(500).json({
        error:
          "No AI provider key configured. Add OPENAI_API_KEY or GOOGLE_GENAI_API_KEY.",
      });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `${buildSystemInstruction(language)} Always answer the latest user question directly. Avoid repeating a generic template.`,
              },
            ],
          },
          contents,
          generationConfig: {
            temperature: 0.45,
            topP: 0.9,
            maxOutputTokens: 700,
          },
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const geminiReply =
      geminiData?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("")
        .trim() || "";

    if (!geminiResponse.ok || !geminiReply) {
      const fallbackReply = buildLocalFallbackReply(prompt, language);
      recordAiQueryLog({ userId: req.ip || "anonymous-user", prompt: userPrompt, reply: fallbackReply, language });
      const payload: AiAssistantResponse = {
        reply: fallbackReply,
      };
      return res.json(payload);
    }

    recordAiQueryLog({
      userId: req.ip || "anonymous-user",
      prompt: userPrompt,
      reply: geminiReply,
      language,
    });
    const payload: AiAssistantResponse = { reply: geminiReply };
    return res.json(payload);
  } catch (_error) {
    const { prompt = "", language = "en" } = req.body as AiAssistantRequest;
    const fallbackReply = buildLocalFallbackReply(prompt, language);
    recordAiQueryLog({ userId: req.ip || "anonymous-user", prompt, reply: fallbackReply, language });
    const payload: AiAssistantResponse = {
      reply: fallbackReply,
    };
    res.json(payload);
  }
};


