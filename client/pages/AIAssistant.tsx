import { motion } from "framer-motion";
import { Mic, Send, Volume2, RotateCcw, Bot, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const quickPrompts = [
  "How do I spot a phishing email?",
  "How can I secure my WhatsApp account?",
  "What should I do after clicking a suspicious link?",
  "Tips to create a strong password",
];

const responses = [
  "Always use strong, unique passwords for each account. A good password should be at least 12 characters long with a mix of uppercase letters, lowercase letters, numbers, and symbols.",
  "Be cautious with emails asking for sensitive information. Legitimate companies never ask for passwords or financial details via email.",
  "Enable two-factor authentication on all your important accounts to add an extra layer of security.",
  "Keep your software and operating system updated to protect against known security vulnerabilities.",
  "Never share personal information with unknown sources online. Verify the authenticity of websites before entering sensitive data.",
  "If you suspect account compromise, change your password immediately, sign out from all devices, and review account recovery settings.",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastAssistantMessageRef = useRef("");

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    recognitionRef.current = new SpeechRecognitionCtor();
    recognitionRef.current.language = "en-US";

    recognitionRef.current.onstart = () => setIsListening(true);

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setInput((prev) => `${prev}${transcript}`);
        }
      }
    };

    recognitionRef.current.onend = () => setIsListening(false);
  }, []);

  const speakText = (text: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInput("");

    setTimeout(() => {
      const aiResponse = responses[Math.floor(Math.random() * responses.length)];
      const updatedMessages = [...newMessages, { role: "assistant" as const, content: aiResponse }];
      setMessages(updatedMessages);
      lastAssistantMessageRef.current = aiResponse;
      speakText(aiResponse);
    }, 450);
  };

  const handleSendMessage = () => sendMessage(input);

  const handleClear = () => {
    setMessages([]);
    lastAssistantMessageRef.current = "";
    window.speechSynthesis.cancel();
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
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-5">
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Bot className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-glow">AI Security Assistant</span>
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Ask practical cybersecurity questions and get quick, clear guidance.
          </p>
          <div className="flex justify-center gap-2 mt-4 text-xs">
            <span className="px-2 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">English Voice</span>
            <span className="px-2 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">Voice + Text</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-gradient border border-cyan-500/20 rounded-xl p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-3 text-sm text-foreground/70">
            <Sparkles size={16} className="text-cyan-300" />
            Try quick prompts
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
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
          className="card-gradient border border-cyan-500/20 p-5 rounded-xl mb-4 h-[24rem] overflow-y-auto space-y-4"
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <p className="text-foreground/60 text-lg">
                  Start with a quick prompt, microphone, or type your question.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-500 text-background rounded-br-none"
                      : "bg-black/30 text-foreground border border-cyan-500/25 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))
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
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your cybersecurity question..."
              className="flex-1 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-foreground placeholder-foreground/50 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
            <button
              onClick={startListening}
              disabled={isListening}
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
              onClick={handleSendMessage}
              className="px-4 py-3 bg-cyan-500 text-background rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(0,204,255,0.6)] transition-all duration-300"
              title="Send"
            >
              <Send size={20} />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-cyan-500/30 rounded-lg text-foreground/70 hover:bg-cyan-500/10 transition-colors"
            >
              <RotateCcw size={18} />
              Clear Chat
            </button>
            <button
              onClick={handleRepeat}
              disabled={isSpeaking || messages.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                isSpeaking
                  ? "bg-purple-500 text-background"
                  : "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50"
              }`}
            >
              <Volume2 size={18} />
              {isSpeaking ? "Speaking..." : "Repeat Last Reply"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
