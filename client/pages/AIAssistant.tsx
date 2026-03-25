import { motion } from "framer-motion";
import {
  Mic,
  Send,
  Volume2,
  RotateCcw,
  Bot,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

type SpeechRecognitionCtor = new () => {
  language: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: any) => void) | null;
  start: () => void;
};

const quickPromptsEn = [
  "How do I spot a phishing email?",
  "How can I secure my WhatsApp account?",
  "What should I do after clicking a suspicious link?",
  "Tips to create a strong password",
];

const quickPromptsHi = [
  "मैं फ़िशिंग ईमेल कैसे पहचानूँ?",
  "मैं अपना WhatsApp अकाउंट कैसे सुरक्षित रखूँ?",
  "यदि मैंने संदिग्ध लिंक पर क्लिक कर दिया है तो क्या करूँ?",
  "मज़बूत पासवर्ड बनाने के सुझाव",
];



export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const lastAssistantMessageRef = useRef("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const speechApi = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognitionClass =
      speechApi.SpeechRecognition || speechApi.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    recognitionRef.current = new SpeechRecognitionClass();
    recognitionRef.current.language = language === "en" ? "en-US" : "hi-IN";
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          setInput((prev) => `${prev}${transcript}`);
        }
      }
    };
  }, [language]);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length) setVoices(available);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const pickPreferredVoice = () => {
    const localePrefix = language === "en" ? "en" : "hi";
    const localeVoices = voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith(localePrefix)
    );
    return localeVoices[0] || voices[0];
  };

  const speakText = (text: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "en" ? "en-US" : "hi-IN";
    const voice = pickPreferredVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userText = text.trim();
    const newMessages = [...messages, { role: "user" as const, content: userText }];
    setMessages(newMessages);
    setInput("");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          language,
          history: messages.slice(-8),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.reply) {
        throw new Error(data?.error || "AI request failed.");
      }

      const aiResponse = data.reply as string;
      setMessages([...newMessages, { role: "assistant", content: aiResponse }]);
      lastAssistantMessageRef.current = aiResponse;
      if (autoSpeak) speakText(aiResponse);
    } catch (error) {
      const fallback =
        language === "en"
          ? `I could not reach the AI service right now. ${
              error instanceof Error ? error.message : "Please try again."
            }`
          : `अभी AI सेवा से कनेक्शन नहीं हो पाया। ${
              error instanceof Error ? error.message : "कृपया दोबारा प्रयास करें।"
            }`;
      setMessages([...newMessages, { role: "assistant", content: fallback }]);
      lastAssistantMessageRef.current = fallback;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRepeat = () => {
    if (!lastAssistantMessageRef.current) return;
    speakText(lastAssistantMessageRef.current);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-black/40 to-blue-500/10 p-6 mb-6"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/30">
              <Bot className="w-9 h-9 text-cyan-300" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-glow">CyberRakshak Assistant</span>
              </h1>
              <p className="text-foreground/75">
                {language === "en"
                  ? "Cybercrime-only assistant. Text replies by default, voice replies only when enabled."
                  : "केवल साइबरक्राइम सहायक। डिफ़ॉल्ट रूप से टेक्स्ट उत्तर, आवाज़ उत्तर तभी जब आप सक्षम करें।"}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    language === "en"
                      ? "bg-cyan-500 text-black border-cyan-400"
                      : "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("hi")}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    language === "hi"
                      ? "bg-cyan-500 text-black border-cyan-400"
                      : "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                  }`}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => {
                    const next = !autoSpeak;
                    setAutoSpeak(next);
                    if (!next) window.speechSynthesis.cancel();
                  }}
                  className={`px-3 py-1 rounded-full text-sm border transition inline-flex items-center gap-2 ${
                    autoSpeak
                      ? "bg-green-500/20 border-green-400/50 text-green-300"
                      : "bg-black/30 border-cyan-500/40 text-cyan-300"
                  }`}
                >
                  {autoSpeak ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  {autoSpeak
                    ? language === "en"
                      ? "Voice Reply ON"
                      : "Voice Reply ON"
                    : language === "en"
                      ? "Voice Reply OFF"
                      : "Voice Reply OFF"}
                </button>
                <span className="px-3 py-1 rounded-full text-sm border border-orange-500/40 bg-orange-500/15 text-orange-200">
                  {language === "en" ? "Cybercrime Topics Only" : "केवल साइबरक्राइम विषय"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-gradient border border-cyan-500/20 rounded-xl p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-3 text-sm text-foreground/70">
            <Sparkles size={16} className="text-cyan-300" />
            {language === "en" ? "Quick cyber prompts" : "त्वरित साइबर प्रश्न"}
          </div>
          <div className="flex flex-wrap gap-2">
            {(language === "en" ? quickPromptsEn : quickPromptsHi).map((prompt) => (
              <button
                key={prompt}
                onClick={() => void sendMessage(prompt)}
                className="text-left px-3 py-2 rounded-lg bg-black/25 border border-cyan-500/20 text-sm text-foreground/85 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card-gradient border border-cyan-500/20 p-5 rounded-xl mb-4 h-[26rem] overflow-y-auto space-y-4"
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-foreground/60 text-lg max-w-xl">
                {language === "en"
                  ? "Ask a cybercrime-related question using text or microphone."
                  : "टेक्स्ट या माइक्रोफ़ोन से साइबरक्राइम से जुड़ा प्रश्न पूछें।"}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={`${msg.role}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-cyan-300" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-500 text-background rounded-br-none"
                      : "bg-black/35 text-foreground border border-cyan-500/25 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-cyan-300" />
              </div>
              <div className="ml-2 max-w-[82%] px-4 py-3 rounded-xl text-sm leading-relaxed bg-black/35 text-foreground border border-cyan-500/25 rounded-bl-none">
                <div className="flex items-center gap-2">
                  <span className="text-foreground/70">
                    {language === "en" ? "Thinking" : "उत्तर तैयार हो रहा है"}
                  </span>
                  <span className="inline-flex items-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-bounce [animation-delay:-0.1s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-bounce" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendMessage(input)}
              placeholder={
                language === "en"
                  ? "Ask a cybercrime-related question..."
                  : "साइबरक्राइम से जुड़ा प्रश्न पूछें..."
              }
              className="flex-1 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
            <button
              onClick={() => recognitionRef.current?.start()}
              disabled={isListening || isGenerating}
              className={`p-3 rounded-lg font-semibold transition-all duration-300 ${
                isListening
                  ? "bg-red-500/50 text-white animate-pulse"
                  : "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30"
              }`}
              title="Start voice input"
            >
              <Mic size={20} />
            </button>
            <button
              onClick={handleRepeat}
              disabled={isSpeaking || messages.length === 0}
              className={`p-3 rounded-lg font-semibold transition-all duration-300 ${
                isSpeaking
                  ? "bg-cyan-500 text-background"
                  : "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50"
              }`}
              title="Speak aloud"
            >
              <Volume2 size={20} />
            </button>
            <button
              onClick={() => void sendMessage(input)}
              disabled={isGenerating}
              className="px-4 py-3 bg-cyan-500 text-background rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(0,204,255,0.6)] transition-all duration-300 disabled:opacity-60"
              title="Send"
            >
              {isGenerating ? "..." : <Send size={20} />}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setMessages([]);
                setInput("");
                setIsGenerating(false);
                lastAssistantMessageRef.current = "";
                window.speechSynthesis.cancel();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-cyan-500/30 rounded-lg text-foreground/70 hover:bg-cyan-500/10 transition-colors"
            >
              <RotateCcw size={18} />
              {language === "en" ? "Clear Chat" : "चैट साफ करें"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
