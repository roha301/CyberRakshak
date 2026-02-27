import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Brain, Trophy, Flame, RotateCw, ShieldAlert } from "lucide-react";
import { QuizQuestion } from "@shared/api";

type QuizMode = "rapid" | "scenario" | "trick";
type Difficulty = "easy" | "medium" | "hard" | "all";
type Stage = "setup" | "active" | "results";

interface AnswerState {
  questionId: string;
  selected: number;
  isCorrect: boolean;
}

export default function Quiz() {
  const [stage, setStage] = useState<Stage>("setup");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [mode, setMode] = useState<QuizMode>("rapid");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
  const total = questions.length;
  const score = answers.filter((a) => a.isCorrect).length;
  const progress = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  const longestStreak = useMemo(() => {
    let best = 0;
    let run = 0;
    for (const answer of answers) {
      if (answer.isCorrect) {
        run++;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    return best;
  }, [answers]);

  const questionLimit = mode === "rapid" ? 6 : mode === "scenario" ? 8 : 10;

  async function fetchCategories() {
    try {
      const response = await fetch("/api/quiz-categories");
      const data = await response.json();
      setAllCategories(data.categories || []);
    } catch {
      setAllCategories([]);
    }
  }

  async function startQuiz() {
    try {
      setError(null);
      setLoading(true);
      setAnswers([]);
      setCurrentIndex(0);

      const params = new URLSearchParams();
      params.set("limit", String(questionLimit));
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (difficulty !== "all") params.set("difficulty", difficulty);

      const response = await fetch(`/api/quiz/questions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Unable to load quiz questions");
      }

      const data = await response.json();
      const items: QuizQuestion[] = data.data || [];

      if (!items.length) {
        throw new Error("No questions found for the selected filters");
      }

      setQuestions(items);
      setStage("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(optionIndex: number) {
    if (!currentQuestion || currentAnswer) return;

    const answer: AnswerState = {
      questionId: currentQuestion.id,
      selected: optionIndex,
      isCorrect: optionIndex === currentQuestion.correctAnswer,
    };

    setAnswers((prev) => [...prev, answer]);
  }

  function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      setStage("results");
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  }

  function resetQuiz() {
    setStage("setup");
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-5">
            <div className="p-4 bg-cyan-500/10 rounded-lg">
              <Brain className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-glow">Cyber Awareness Quiz</span>
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Practice with rapid rounds, scenario challenge, and trick-spotting drills.
          </p>
        </motion.div>

        {stage === "setup" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-gradient p-6 rounded-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3">Choose Quiz Mode</h2>
              <div className="grid md:grid-cols-3 gap-3">
                <button
                  onClick={() => setMode("rapid")}
                  className={`p-4 rounded-lg text-left border transition ${
                    mode === "rapid" ? "border-cyan-400 bg-cyan-500/10" : "border-cyan-500/20 hover:bg-cyan-500/5"
                  }`}
                >
                  <p className="font-semibold">Rapid Fire</p>
                  <p className="text-sm text-foreground/70">6 quick essentials</p>
                </button>
                <button
                  onClick={() => setMode("scenario")}
                  className={`p-4 rounded-lg text-left border transition ${
                    mode === "scenario" ? "border-cyan-400 bg-cyan-500/10" : "border-cyan-500/20 hover:bg-cyan-500/5"
                  }`}
                >
                  <p className="font-semibold">Scenario Master</p>
                  <p className="text-sm text-foreground/70">8 practical situations</p>
                </button>
                <button
                  onClick={() => setMode("trick")}
                  className={`p-4 rounded-lg text-left border transition ${
                    mode === "trick" ? "border-cyan-400 bg-cyan-500/10" : "border-cyan-500/20 hover:bg-cyan-500/5"
                  }`}
                >
                  <p className="font-semibold">Trick Detector</p>
                  <p className="text-sm text-foreground/70">10 mixed difficulty questions</p>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3 text-foreground"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-black/30 border border-cyan-500/20 rounded-lg p-3 text-foreground"
                >
                  <option value="all">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={startQuiz}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition disabled:opacity-60"
            >
              {loading ? "Loading Questions..." : `Start ${mode === "rapid" ? "Rapid Fire" : mode === "scenario" ? "Scenario Master" : "Trick Detector"}`}
            </button>
          </motion.div>
        )}

        {stage === "active" && currentQuestion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="card-gradient p-5 rounded-xl">
              <div className="flex items-center justify-between text-sm text-foreground/70 mb-2">
                <span>Question {currentIndex + 1} / {total}</span>
                <span>{progress}% complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-cyan-500/10 overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="card-gradient p-6 rounded-xl">
              <div className="flex flex-wrap gap-2 mb-4 text-xs">
                <span className="px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                  {currentQuestion.category}
                </span>
                <span className="px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 uppercase">
                  {currentQuestion.difficulty}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-5">{currentQuestion.question}</h2>
              <div className="space-y-3">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = currentAnswer?.selected === optionIndex;
                  const isCorrectOption = optionIndex === currentQuestion.correctAnswer;
                  const answered = Boolean(currentAnswer);

                  return (
                    <button
                      key={option}
                      onClick={() => selectAnswer(optionIndex)}
                      disabled={answered}
                      className={`w-full text-left p-4 rounded-lg border transition ${
                        answered
                          ? isCorrectOption
                            ? "border-green-500/40 bg-green-500/10"
                            : isSelected
                              ? "border-red-500/40 bg-red-500/10"
                              : "border-cyan-500/20 bg-black/20 opacity-70"
                          : "border-cyan-500/20 bg-black/20 hover:border-cyan-400/40 hover:bg-cyan-500/5"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {currentAnswer && (
                <div className="mt-5 space-y-4">
                  <div
                    className={`p-3 rounded-lg border text-sm ${
                      currentAnswer.isCorrect
                        ? "bg-green-500/10 border-green-500/30 text-green-200"
                        : "bg-red-500/10 border-red-500/30 text-red-200"
                    }`}
                  >
                    {currentAnswer.isCorrect ? "Correct." : "Not quite."} {currentQuestion.explanation}
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="px-5 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
                  >
                    {currentIndex + 1 === total ? "See Results" : "Next Question"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {stage === "results" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-gradient p-8 rounded-xl">
            <div className="text-center mb-6">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h2 className="text-3xl font-bold mb-2">Quiz Complete</h2>
              <p className="text-foreground/70">
                You scored {score} out of {total} ({Math.round((score / Math.max(total, 1)) * 100)}%)
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-black/20 border border-cyan-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-cyan-300 mb-1">
                  <Flame size={18} />
                  <span className="font-semibold">Best Streak</span>
                </div>
                <p className="text-2xl font-bold">{longestStreak}</p>
              </div>
              <div className="bg-black/20 border border-cyan-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-cyan-300 mb-1">
                  <ShieldAlert size={18} />
                  <span className="font-semibold">Need More Practice</span>
                </div>
                <p className="text-sm text-foreground/80">
                  {[...new Set(answers.filter((a) => !a.isCorrect).map((a) => questions.find((q) => q.id === a.questionId)?.category).filter(Boolean))]
                    .join(", ") || "None. Great job."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={startQuiz}
                className="px-5 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
              >
                Retry Same Settings
              </button>
              <button
                onClick={resetQuiz}
                className="px-5 py-2 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition inline-flex items-center gap-2"
              >
                <RotateCw size={16} />
                Change Mode
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
