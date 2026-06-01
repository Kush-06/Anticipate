import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { topics, type QuizQuestion } from "../data/topics";
import { useProgress } from "../context/ProgressContext";
import { fetchQuizQuestions } from "../../backend/quizService";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

const QUESTION_GLYPHS = ["💡", "🎯", "🔍", "📊", "⚡"];

const CONFETTI_COLORS = [
  "var(--p-coral)",
  "var(--p-gold)",
  "var(--p-mint)",
  "var(--p-navy)",
  "var(--p-plum)",
];

function ConfettiPiece({ index }: { index: number }) {
  const left = `${5 + (index * 19) % 90}%`;
  // Stagger start positions across the full screen height so pieces appear scattered
  const top = `${(index * 23) % 80}%`;
  const delay = `${(index * 0.12) % 2}s`;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const isCircle = index % 3 === 0;

  return (
    <div
      className="anp-result__confetti-piece"
      style={{
        left,
        top,
        animationDelay: delay,
        background: color,
        borderRadius: isCircle ? "50%" : "2px",
        width: isCircle ? "8px" : "6px",
        height: isCircle ? "8px" : "14px",
      }}
    />
  );
}

function Confetti() {
  return (
    <div className="anp-result__confetti">
      {Array.from({ length: 26 }, (_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>
  );
}

type AnswerState = {
  selectedIndex: number;
  isCorrect: boolean;
};

type Phase = "answering" | "feedback" | "results";

export function PlayfulQuiz() {
  const navigate = useNavigate();
  const { topicId, subTopicId } = useParams<{ topicId: string; subTopicId?: string }>();
  const { completeSubTopic } = useProgress();

  const topic = topics.find((t) => t.id === topicId);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(true);

  useEffect(() => {
    void fetchQuizQuestions(topicId ?? '', subTopicId ?? null)
      .then(qs => { setQuestions(qs); setQuizLoading(false); });
  }, [topicId, subTopicId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("answering");
  const [answerState, setAnswerState] = useState<AnswerState | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, setAnsweredCorrect] = useState<boolean[]>([]);

  // Lock options once answered
  const isLocked = phase === "feedback" || phase === "results";

  const currentQ = questions[currentIndex];

  const backPath = subTopicId ? `/topic/${topicId}/subtopic/${subTopicId}` : `/topic/${topicId}`;

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (isLocked || !currentQ) return;

      const isCorrect = optionIndex === currentQ.correctAnswer;
      const newScore = isCorrect ? score + 1 : score;

      setAnswerState({ selectedIndex: optionIndex, isCorrect });
      if (isCorrect) setScore(newScore);
      setAnsweredCorrect((prev) => [...prev, isCorrect]);
      setPhase("feedback");

      // Slight delay before sheet slides up for visual clarity
      requestAnimationFrame(() => {
        setSheetOpen(true);
      });
    },
    [isLocked, currentQ, score],
  );

  const handleNext = useCallback(() => {
    setSheetOpen(false);

    // Wait for sheet to slide back down, then advance
    setTimeout(() => {
      const isLastQuestion = currentIndex === questions.length - 1;
      
      // Calculate what the score will be after this answer
      const finalScore = score;
      
      setAnswerState(null);
      if (isLastQuestion) {
        setPhase("results");
        // If it's a sub-topic quiz and they got full marks, mark it as complete
        if (subTopicId && finalScore === questions.length) {
          completeSubTopic(subTopicId);
        }
      } else {
        setCurrentIndex((prev) => prev + 1);
        setPhase("answering");
      }
    }, 300);
  }, [currentIndex, questions.length, subTopicId, score, completeSubTopic]);

  const handleTryAgain = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setPhase("answering");
    setAnswerState(null);
    setSheetOpen(false);
    setAnsweredCorrect([]);
  }, []);

  // Keyboard shortcut: 1-4 for options
  useEffect(() => {
    if (phase !== "answering") return;

    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) handleAnswer(num - 1);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleAnswer]);

  // ——— Results screen ———
  if (phase === "results") {
    const totalQs = questions.length;
    const missed = totalQs - score;
    const xpEarned = score * 5;
    const perfClass =
      score >= totalQs - 1 ? "win" : score >= Math.ceil(totalQs / 2) ? "mid" : "low";
    const subline =
      perfClass === "win"
        ? "You've mastered this topic."
        : perfClass === "mid"
        ? "A few more questions and you'll have it."
        : "Review the lesson plan and try again.";

    return (
      <div className="anp-result">
        {score >= totalQs - 1 && <Confetti />}

        {/* Close button top-right */}
        <button
          className="anp-result__close"
          onClick={() => navigate(backPath)}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="anp-result__content">
          {/* Party emoji icon above score */}
          <div className="anp-result__emoji">
            {perfClass === "win" ? "🎉" : perfClass === "mid" ? "👍" : "💪"}
          </div>

          {/* Score — numerator colored, slash + denominator gray */}
          <div className="anp-result__score-big">
            <span className={`anp-result__score-num--${perfClass}`}>{score}</span>
            <span className="anp-result__score-denom">/{totalQs}</span>
          </div>

          <h2 className={`anp-result__headline anp-result__headline--${perfClass}`}>
            {perfClass === "win" ? "Nailed it!" : perfClass === "mid" ? "Good start!" : "Keep practising"}
          </h2>
          <p className="anp-result__subline">{subline}</p>

          {/* Stats — compact inline strip */}
          <div className="anp-result__stats">
            <div className="anp-result__stat-box">
              <span className="anp-result__stat-val" style={{ color: "var(--p-mint)" }}>{score}</span>
              <span className="anp-result__stat-label">Correct</span>
            </div>
            <div className="anp-result__stat-box">
              <span className="anp-result__stat-val" style={{ color: "var(--p-coral)" }}>{missed}</span>
              <span className="anp-result__stat-label">Missed</span>
            </div>
            <div className="anp-result__stat-box">
              <span className="anp-result__stat-val" style={{ color: "var(--p-gold)" }}>+{xpEarned}</span>
              <span className="anp-result__stat-label">XP</span>
            </div>
          </div>

          <div className="anp-result__ctas">
            <button
              className="anp-result__btn anp-result__btn--secondary"
              onClick={() => navigate(backPath)}
            >
              ↺ Review answers
            </button>
            {perfClass === "win" ? (
              <button
                className="anp-result__btn anp-result__btn--primary anp-result__btn--win"
                onClick={() => navigate(subTopicId ? `/topic/${topicId}` : "/")}
              >
                {subTopicId ? "Back to lesson ›" : "Next topic ›"}
              </button>
            ) : (
              <button
                className="anp-result__btn anp-result__btn--primary"
                onClick={handleTryAgain}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ——— Quiz question screen ———
  if (quizLoading) {
    return (
      <div className="anp-quiz">
        <div className="anp-quiz__body">
          <p style={{ color: "var(--p-ink-3)", textAlign: "center" }}>
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="anp-quiz">
        <div className="anp-quiz__body">
          <p style={{ color: "var(--p-ink-3)", textAlign: "center" }}>
            No quiz questions found for this topic.
          </p>
        </div>
      </div>
    );
  }

  const totalQs = questions.length;

  return (
    <div className="anp-quiz">
      {/* Top bar */}
      <div className="anp-quiz__topbar">
        <button
          className="anp-quiz__close"
          onClick={() => navigate(backPath)}
          aria-label="Close quiz"
        >
          ✕
        </button>
        <span className="anp-quiz__topbar-title">{topic?.subTopics.find(s => s.id === subTopicId)?.title ?? topic?.title ?? "Quiz"}</span>
        <span className="anp-quiz__score-pill">
          {score}/{totalQs}
        </span>
      </div>

      {/* Segmented progress bar */}
      <div className="anp-quiz__progress" role="progressbar" aria-valuenow={currentIndex}>
        {questions.map((_, i) => (
          <div
            key={i}
            className={[
              "anp-quiz__seg",
              i < currentIndex && "anp-quiz__seg--done",
              i === currentIndex && "anp-quiz__seg--active",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </div>

      {/* Question body */}
      <div className="anp-quiz__body">
        {/* Question card */}
        <div className="anp-quiz__q-card">
          <p className="anp-quiz__q-eyebrow">
            Question {currentIndex + 1} of {totalQs}
          </p>
          <span className="anp-quiz__q-glyph">{QUESTION_GLYPHS[currentIndex % QUESTION_GLYPHS.length]}</span>
          <p className="anp-quiz__q-text">{currentQ.question}</p>
        </div>

        {/* Options */}
        <div className="anp-quiz__options">
          {currentQ.options.map((option, i) => {
            const selected = answerState?.selectedIndex === i;
            const isCorrectOption = i === currentQ.correctAnswer;

            let stateClass = "";
            if (answerState !== null) {
              if (selected && answerState.isCorrect) stateClass = "anp-quiz__option--correct";
              else if (selected && !answerState.isCorrect) stateClass = "anp-quiz__option--wrong";
              else if (!selected && isCorrectOption) stateClass = "anp-quiz__option--correct";
              else stateClass = "anp-quiz__option--dim";
            }

            const icon = (() => {
              if (answerState === null) return null;
              if (selected && answerState.isCorrect) return "✓";
              if (selected && !answerState.isCorrect) return "✗";
              if (!selected && isCorrectOption) return "✓";
              return null;
            })();

            return (
              <button
                key={i}
                className={[
                  "anp-quiz__option",
                  isLocked && "anp-quiz__option--locked",
                  stateClass,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleAnswer(i)}
                disabled={isLocked}
              >
                <span className="anp-quiz__option-chip">{OPTION_LETTERS[i]}</span>
                <span className="anp-quiz__option-text">{option}</span>
                {icon && <span className="anp-quiz__option-icon">{icon}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`anp-quiz__overlay${sheetOpen ? " anp-quiz__overlay--open" : ""}`}
      />

      {/* Feedback sheet */}
      <div
        className={`anp-quiz__sheet${sheetOpen ? " anp-quiz__sheet--open" : ""}`}
        role="dialog"
        aria-live="polite"
      >
        {answerState !== null && (
          <>
            <div className="anp-quiz__sheet-header">
              <span className="anp-quiz__sheet-icon">
                {answerState.isCorrect ? "🎉" : "💪"}
              </span>
              <span
                className={`anp-quiz__sheet-verdict anp-quiz__sheet-verdict--${
                  answerState.isCorrect ? "correct" : "wrong"
                }`}
              >
                {answerState.isCorrect ? "Nailed it!" : "Not quite"}
              </span>
              {answerState.isCorrect && (
                <span className="anp-quiz__sheet-xp">+5 XP</span>
              )}
            </div>
            <p className="anp-quiz__sheet-explanation">
              {currentQ.explanation}
            </p>
            <button
              className={`anp-quiz__sheet-btn anp-quiz__sheet-btn--${
                answerState.isCorrect ? "correct" : "wrong"
              }`}
              onClick={handleNext}
            >
              {currentIndex === totalQs - 1 ? "See results" : "Next question"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
