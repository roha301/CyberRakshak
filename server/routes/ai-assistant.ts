import { RequestHandler } from "express";
import { AiAssistantRequest, AiAssistantResponse } from "../../shared/api";
import { getAdminFaqEntries, recordAiQueryLog } from "./admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function buildLocalFallbackReply(prompt: string, language: "en" | "hi") {
  const q = prompt.toLowerCase();

  if (q.includes("phish") || q.includes("email")) {
    return language === "hi"
      ? "Phishing emails se bachne ke liye hamesha sender ka asli domain aur email address check karein aur kisi bhi sandigdh link par click na karein. Aapko kabhi bhi apna OTP ya bank details kisi link par share nahi karni chahiye taaki aap surakshit rahein."
      : "To stay safe from phishing, always verify the sender's actual domain and email address and never click on suspicious links. You should never share your OTP or bank details on any link that looks suspect to ensure you stay secure.";
  }

  if (q.includes("password")) {
    return language === "hi"
      ? "Ek majboot password ke liye kam se kam 12 characters ka upyog karein jisme bade aur chhote akshar, number aur vishesh symbols shamil hon. Saath hi ye dhyan rakhein ki har ek alag account ke liye aapke pas alag password ho taaki ek account hack hone par dusre surakshit rahein."
      : "For a strong password, use at least 12 characters including uppercase, lowercase, numbers, and symbols. Additionally, ensure you use a unique password for every account to keep your other profiles safe even if one is compromised.";
  }

  if (q.includes("hacked") || q.includes("hack")) {
    return language === "hi"
      ? "Yadi aapka account hack ho gaya hai, to turant apna password badlein, sabhi active devices se logout karein aur turant Two-Factor Authentication chalu karein. Aapko apne contacts ko bhi inform kar dena chahiye taaki ve aapke naam se hone wale kisi fraud se bach sakein."
      : "If your account is hacked, change your password immediately, log out from all active devices, and enable Two-Factor Authentication. You should also inform your contacts so they can avoid any potential fraud being committed in your name.";
  }

  return language === "hi"
    ? "Cyber suraksha ke liye hamesha apne saare softwares ko update rakhein, hamesha Two-Factor Authentication ka upyog karein aur anjan sources se aane wale links se hamesha savdhan rahein. Adhik jaankari ya gambhir mamlo ke liye aap hamesha official cybercrime helpline par sampark kar sakte hain."
    : "For cyber safety, always keep all your software updated, consistently use Two-Factor Authentication, and remain cautious of links from unknown sources. For more information or serious incidents, you should always contact the official cybercrime helpline.";
}

export const handleAiAssistantChat: RequestHandler = async (req, res) => {
  try {
    const { prompt, language = "en" } = req.body as AiAssistantRequest;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }
    const userPrompt = prompt.trim();
    let reply = "";

    // Try Google Gemini if API Key is available
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const systemPrompt = `You are CyberRakshak, a global cybersecurity expert assistant. Answer any questions related to cybercrime, cybersecurity, and digital safety for users anywhere in the world. 
        IMPORTANT FORMATTING RULES: 
        1. Always answer in a flowing, continuous PARAGRAPH format. 
        2. DO NOT use bullet points, numbered lists, or markdown lists. 
        3. DO NOT use bolding or special markdown formatting for lists.
        4. Provide professional, clear, and direct advice.
        5. If the user asks something completely unrelated to computers, internet safety, or cybercrime, politely decline.
        Reply in ${language === "hi" ? "Hindi (translated correctly)" : "English"}.`;

        const result = await model.generateContent(`${systemPrompt}\n\nUser Question: ${userPrompt}`);
        const response = await result.response;
        reply = response.text().replace(/\n/g, " ").replace(/\*/g, "").replace(/- /g, "").trim();
      } catch (err) {
        console.error("Gemini AI API Error:", err);
      }
    }

    // Fallback to local logic if Gemini fails or is not configured
    if (!reply) {
      reply = buildLocalFallbackReply(userPrompt, language);
    }
    
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
