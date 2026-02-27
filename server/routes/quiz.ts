import { RequestHandler } from "express";
import { QuizResponse, QuizResultResponse } from "@shared/api";

// Mock database
const quizQuestions = [
  {
    id: "q1",
    question:
      "What is the most common way hackers steal passwords online?",
    options: [
      "Phishing emails and fake websites",
      "Breaking into data centers",
      "Hacking your WiFi router",
      "Using a microscope to see passwords",
    ],
    correctAnswer: 0,
    explanation:
      "Phishing emails and fake websites are the most common methods used by hackers to trick users into revealing their passwords. Always verify URLs and sender identities.",
    difficulty: "easy" as const,
    category: "Phishing",
  },
  {
    id: "q2",
    question: "What does 2FA (Two-Factor Authentication) provide?",
    options: [
      "A second email address",
      "Protection using something you know AND something you have",
      "Double the storage space",
      "Two operating systems",
    ],
    correctAnswer: 1,
    explanation:
      "2FA combines something you know (password) with something you have (phone, security key), making it much harder for attackers to gain access to your accounts.",
    difficulty: "easy" as const,
    category: "Account Security",
  },
  {
    id: "q3",
    question: "What is a characteristic of a strong password?",
    options: [
      "Your birth year and pet name",
      "A simple word like 'password123'",
      "12+ characters with uppercase, lowercase, numbers, and symbols",
      "Your username repeated twice",
    ],
    correctAnswer: 2,
    explanation:
      "A strong password should have at least 12 characters and include a mix of uppercase letters, lowercase letters, numbers, and special characters to resist brute-force attacks.",
    difficulty: "easy" as const,
    category: "Password Security",
  },
  {
    id: "q4",
    question: "What should you do if you receive a suspicious email?",
    options: [
      "Click the link to verify it's real",
      "Reply and ask for more information",
      "Don't click links, verify through official channels",
      "Forward it to everyone you know",
    ],
    correctAnswer: 2,
    explanation:
      "Never click links in suspicious emails. Instead, go to the official website directly or call the organization to verify if the request is legitimate.",
    difficulty: "easy" as const,
    category: "Phishing",
  },
  {
    id: "q5",
    question: "What is ransomware?",
    options: [
      "A free antivirus software",
      "Malware that encrypts files and demands payment for decryption",
      "A backup service for your files",
      "A type of password manager",
    ],
    correctAnswer: 1,
    explanation:
      "Ransomware is malicious software that encrypts your files, making them inaccessible, and then demands payment (ransom) for the decryption key.",
    difficulty: "medium" as const,
    category: "Malware",
  },
  {
    id: "q6",
    question:
      "How can you protect yourself from ransomware attacks? (Select all that apply)",
    options: [
      "Regular backups of important files",
      "Keeping software updated",
      "Not opening suspicious attachments",
      "All of the above",
    ],
    correctAnswer: 3,
    explanation:
      "All three measures are important: regular backups allow recovery without paying ransom, updates patch security vulnerabilities, and avoiding suspicious attachments prevents infection.",
    difficulty: "medium" as const,
    category: "Malware",
  },
  {
    id: "q7",
    question: "What is social engineering in cybersecurity?",
    options: [
      "Building social media networks",
      "Manipulating people into divulging confidential information",
      "Engineering social apps",
      "Studying human behavior",
    ],
    correctAnswer: 1,
    explanation:
      "Social engineering is the practice of manipulating people into revealing sensitive information or performing actions that compromise security, often through psychological tactics.",
    difficulty: "medium" as const,
    category: "Social Engineering",
  },
  {
    id: "q8",
    question: "What should you never do on a public WiFi network?",
    options: [
      "Browse websites",
      "Check personal financial accounts or enter passwords",
      "Read emails",
      "Watch videos",
    ],
    correctAnswer: 1,
    explanation:
      "On public WiFi, never access sensitive accounts or enter passwords as data can be intercepted. Use a VPN if you must access sensitive information.",
    difficulty: "medium" as const,
    category: "Network Security",
  },
  {
    id: "q9",
    question: "What is identity theft?",
    options: [
      "Stealing someone's wallet",
      "Using someone's personal information without permission to commit fraud",
      "Taking someone's photo",
      "Impersonating someone in person",
    ],
    correctAnswer: 1,
    explanation:
      "Identity theft is when someone uses your personal information (SSN, credit card, etc.) without permission to commit fraud, open accounts, or make unauthorized purchases.",
    difficulty: "medium" as const,
    category: "Identity Theft",
  },
  {
    id: "q10",
    question:
      "How should you respond if you suspect a deepfake video call?",
    options: [
      "Send money immediately as requested",
      "Verify through an alternative communication method with a known contact",
      "Ignore it completely",
      "Ask the caller for their password",
    ],
    correctAnswer: 1,
    explanation:
      "If you suspect a deepfake, verify the request through another known contact method. Never make decisions based on unexpected video calls requesting money.",
    difficulty: "hard" as const,
    category: "Deepfake Scams",
  },
  {
    id: "q11",
    question: "What is HTTPS and why is it important?",
    options: [
      "A type of file format",
      "A protocol that encrypts data between your browser and website",
      "A password security system",
      "A backup service",
    ],
    correctAnswer: 1,
    explanation:
      "HTTPS encrypts data transmitted between your browser and websites, protecting sensitive information from being intercepted by hackers.",
    difficulty: "hard" as const,
    category: "Web Security",
  },
  {
    id: "q12",
    question: "What is a zero-day vulnerability?",
    options: [
      "A hack that happens at midnight",
      "A previously unknown security flaw exploited before a patch exists",
      "A daily security update",
      "A type of password",
    ],
    correctAnswer: 1,
    explanation:
      "A zero-day vulnerability is a security flaw that is unknown to the software vendor and has not been patched, making it particularly dangerous.",
    difficulty: "hard" as const,
    category: "Vulnerabilities",
  },
];

export const handleGetQuizQuestions: RequestHandler = (req, res) => {
  try {
    const { category, difficulty, limit } = req.query;

    let filtered = [...quizQuestions];

    if (category && typeof category === "string") {
      filtered = filtered.filter((q) => q.category === category);
    }

    if (difficulty && typeof difficulty === "string") {
      filtered = filtered.filter((q) => q.difficulty === difficulty);
    }

    // Shuffle questions
    filtered = filtered.sort(() => Math.random() - 0.5);

    // Limit results
    const questionLimit = limit ? parseInt(limit as string) : filtered.length;
    filtered = filtered.slice(0, questionLimit);

    const response: QuizResponse = {
      data: filtered,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quiz questions" });
  }
};

export const handleGetQuestionById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const question = quizQuestions.find((q) => q.id === id);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch question" });
  }
};

export const handleSubmitQuiz: RequestHandler = (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid answers format" });
    }

    let correctCount = 0;
    const results = answers.map(
      (answer: { questionId: string; selectedAnswer: number }) => {
        const question = quizQuestions.find((q) => q.id === answer.questionId);
        if (!question) {
          return {
            questionId: answer.questionId,
            isCorrect: false,
          };
        }

        const isCorrect = answer.selectedAnswer === question.correctAnswer;
        if (isCorrect) correctCount++;

        return {
          questionId: answer.questionId,
          isCorrect,
        };
      }
    );

    const percentage = Math.round((correctCount / answers.length) * 100);

    const response: QuizResultResponse = {
      score: correctCount,
      totalQuestions: answers.length,
      percentage,
      results,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit quiz" });
  }
};

export const handleGetCategories: RequestHandler = (req, res) => {
  try {
    const categories = [...new Set(quizQuestions.map((q) => q.category))];
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};
