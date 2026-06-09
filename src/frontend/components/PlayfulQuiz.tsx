import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { topics, type QuizQuestion } from "../data/topics";
import { useProgress } from "../context/ProgressContext";
import { fetchQuizQuestions } from "../../backend/quizService";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function QuizOption({
  letter,
  question,
  index,
  pickedIndex,
  correctIndex,
  onPick,
}: {
  letter: string;
  question: QuizQuestion;
  index: number;
  pickedIndex: number | null;
  correctIndex: number;
  onPick: (i: number) => void;
}) {
  const isPicked = pickedIndex === index;
  const isCorrect = pickedIndex !== null && index === correctIndex;
  const isWrong = isPicked && index !== correctIndex;
  const isDim = pickedIndex !== null && !isPicked && index !== correctIndex;

  const cls = isCorrect ? "correct" : isWrong ? "wrong" : isDim ? "dim" : "";

  return (
    <button
      className={`anp-l-quiz-opt ${cls}`}
      onClick={() => pickedIndex === null && onPick(index)}
      disabled={pickedIndex !== null}
    >
      <div className="letter">{letter}</div>
      <div className="body">
        <div className="value">{question.options[index]}</div>
      </div>
      {isCorrect && (
        <div className="check">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}

export function PlayfulQuiz() {
  const navigate = useNavigate();
  const { topicId, subTopicId } = useParams<{ topicId: string; subTopicId?: string }>();
  const { completeSubTopic } = useProgress();

  const topic = topics.find((t) => t.id === topicId);
  const subTopic = subTopicId ? topic?.subTopics.find((s) => s.id === subTopicId) : null;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const backPath = subTopicId
    ? `/topic/${topicId}/subtopic/${subTopicId}`
    : `/topic/${topicId}`;

  useEffect(() => {
    void fetchQuizQuestions(topicId ?? "", subTopicId ?? null).then((qs) => {
      setQuestions(qs);
      setLoading(false);
      startTimeRef.current = Date.now();
    });
  }, [topicId, subTopicId]);

  const currentQ = questions[currentIndex];
  const totalQs = questions.length;

  const handlePick = useCallback(
    (optIndex: number) => {
      if (pickedIndex !== null || !currentQ) return;
      setPickedIndex(optIndex);
      if (optIndex === currentQ.correctAnswer) {
        setScore((s) => s + 1);
      }
    },
    [pickedIndex, currentQ]
  );

  const handleContinue = useCallback(() => {
    if (pickedIndex === null) return;

    const isLast = currentIndex === totalQs - 1;
    elapsedRef.current = Math.round((Date.now() - startTimeRef.current) / 1000);

    if (isLast) {
      const finalScore = score;
      const isPerfect = finalScore === totalQs;
      if (subTopicId && isPerfect) completeSubTopic(subTopicId);

      navigate(
        subTopicId
          ? `/topic/${topicId}/subtopic/${subTopicId}/complete`
          : backPath,
        {
          state: {
            timeTaken: formatTime(elapsedRef.current),
            correct: finalScore,
            total: totalQs,
          },
        }
      );
    } else {
      setCurrentIndex((i) => i + 1);
      setPickedIndex(null);
    }
  }, [pickedIndex, currentIndex, totalQs, score, subTopicId, topicId, backPath, navigate, completeSubTopic]);

  // Keyboard: 1-4 selects option, Enter/Space continues
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4 && pickedIndex === null) handlePick(num - 1);
      if ((e.key === "Enter" || e.key === " ") && pickedIndex !== null) handleContinue();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePick, handleContinue, pickedIndex]);

  if (loading) {
    return (
      <div className="anp-app anp-quiz-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--p-ink-3)", fontFamily: "var(--p-mono)", fontSize: "13px" }}>Loading…</p>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="anp-app anp-quiz-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--p-ink-3)", textAlign: "center", padding: "24px" }}>
          No questions found for this lesson.
        </p>
      </div>
    );
  }

  const progressPct = ((currentIndex) / Math.max(totalQs, 1)) * 100;
  const subTopicTitle = subTopic?.title ?? topic?.title ?? "Quiz";
  const topicIdx = topic ? topics.indexOf(topic) + 1 : 1;
  const subTopicIdx = subTopic ? (topic?.subTopics.indexOf(subTopic) ?? 0) + 1 : 1;
  const subTopicTotal = topic?.subTopics.length ?? 1;

  return (
    <div className="anp-app anp-quiz-bg">
      <div className="anp-spacer" />

      {/* Top row: close + progress bar + counter */}
      <div className="anp-l-quiz-toprow">
        <button className="anp-icon-btn" onClick={() => navigate(backPath)} aria-label="Close quiz">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <div className="anp-l-quiz-progress">
          <div className="bar">
            <div style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="anp-l-quiz-count">{currentIndex + 1} / {totalQs}</div>
      </div>

      <div className="anp-scroll" style={{ paddingTop: "calc(8px * var(--d))" }}>
        <div style={{ padding: "0 calc(20px * var(--d))" }}>
          {/* Eyebrow */}
          <div className="anp-l-quiz-eyebrow">
            <span className="tag">
              {subTopicId ? `Lesson ${subTopicIdx} of ${subTopicTotal}` : `Module ${topicIdx}`}
            </span>
            <span>· {subTopicTitle}</span>
          </div>

          {/* Question */}
          <h2 className="anp-l-quiz-q">{currentQ.question}</h2>

          {/* Options */}
          <div className="anp-l-quiz-opts">
            {currentQ.options.map((_, i) => (
              <QuizOption
                key={i}
                letter={OPTION_LETTERS[i] ?? String(i + 1)}
                question={currentQ}
                index={i}
                pickedIndex={pickedIndex}
                correctIndex={currentQ.correctAnswer}
                onPick={handlePick}
              />
            ))}
          </div>

          {/* Reveal panel */}
          {pickedIndex !== null && (
            <div
              className={`anp-l-quiz-reveal ${pickedIndex === currentQ.correctAnswer ? "correct" : "wrong"}`}
            >
              <div className="head">
                <div className="badge">
                  {pickedIndex === currentQ.correctAnswer ? "Nailed it" : "Not quite"}
                </div>
              </div>
              <p>{currentQ.explanation}</p>
            </div>
          )}
        </div>

        <div style={{ height: 120 }} />
      </div>

      {/* Bottom bar */}
      <div className="anp-l-quiz-bottom">
        <button
          className="anp-l-quiz-cta"
          onClick={handleContinue}
          disabled={pickedIndex === null}
        >
          {currentIndex === totalQs - 1 ? "Finish" : "Continue"}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
