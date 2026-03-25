import { RequestHandler } from "express";
import { AiAssistantRequest, AiAssistantResponse } from "../../shared/api";
import { getAdminFaqEntries, recordAiQueryLog } from "./admin";

function buildSystemInstruction(language: "en" | "hi") {
  const faqContext = getAdminFaqEntries().slice(0, 8).map((faq) => `Q: ${faq.question} A: ${faq.answer}`).join(" | ");
  if (language === "hi") {
    return "Aap ek cyber suraksha sahayak hain. Cyber suraksha se jude sawalon ka jawab dein.";
  }
  return `You are a cybersecurity assistant. Admin FAQ context: ${faqContext}`;
}

const CYBER_TOPIC_KEYWORDS = [
  "cyber", "cybersecurity", "cyber security", "cybercrime", "phish", "malware", "ransomware",
  "scam", "fraud", "hack", "hacked", "breach", "password", "otp", "2fa", "mfa",
  "identity theft", "data leak", "url", "link", "virus", "trojan", "spyware",
  "social engineering", "ddos", "xss", "sql injection"
];

function isCyberTopicPrompt(prompt: string) {
  const normalized = prompt.toLowerCase();
  return CYBER_TOPIC_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function buildLocalFallbackReply(prompt: string, language: "en" | "hi") {
  const q = prompt.toLowerCase();

  if (q.includes("phish") || q.includes("email")) {
    return language === "hi"
      ? "Phishing emails se bachne ke liye sender ka domain check karein aur kisi bhi sandigdh link par click na karein. Kabhi bhi apna OTP ya password share na karein."
      : "To stay safe from phishing, always verify the sender's domain and never click on suspicious links. Never share your OTP or password with anyone.";
  }

  if (q.includes("password")) {
    return language === "hi"
      ? "Majboot password ke liye kam se kam 12 characters ka upyog karein jisme uppercase, lowercase, numbers aur symbols hon. Har account ke liye alag password rakhein."
      : "For a strong password, use at least 12 characters including uppercase, lowercase, numbers, and symbols. Use a unique password for every account.";
  }

  if (q.includes("hacked") || q.includes("hack")) {
    return language === "hi"
      ? "Yadi aapka account hack ho gaya hai, to turant password badlein, sabhi devices se logout karein aur 2FA (Two-Factor Authentication) chalu karein."
      : "If your account is hacked, change your password immediately, log out from all devices, and enable 2FA (Two-Factor Authentication).";
  }

  return language === "hi"
    ? "Cyber suraksha ke liye hamesha apne softwares ko update rakhein, 2FA ka upyog karein aur anjan links se savdhan rahein. Adhik madad ke liye official helpline par sampark karein."
    : "For cyber safety, always keep your software updated, use 2FA, and be cautious of unknown links. Contact official helplines for more assistance.";
}

export const handleAiAssistantChat: RequestHandler = async (req, res) => {
  try {
    const { prompt, language = "en" } = req.body as AiAssistantRequest;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }
    const userPrompt = prompt.trim();
    
    // Topic filtering
    if (!isCyberTopicPrompt(userPrompt)) {
      const reply = language === "hi" 
        ? "Maim keval cyber suraksha se jude sawalon ka jawab de sakta hoon." 
        : "I can only answer questions related to cybersecurity and cybercrime.";
      return res.json({ reply });
    }

    // Pure local knowledge response (No External APIs)
    const reply = buildLocalFallbackReply(userPrompt, language);
    
    recordAiQueryLog({
      userId: req.ip || "anonymous-user",
      prompt: userPrompt,
      reply: reply,
      language,
    });

    return res.json({ reply });
  } catch (error) {
    const { prompt = "", language = "en" } = (req.body || {}) as any;
    const fallbackReply = buildLocalFallbackReply(
      String(prompt || ""),
      (language === "hi" ? "hi" : "en") as "en" | "hi"
    );
    res.json({ reply: fallbackReply });
  }
};
