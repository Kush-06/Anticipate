import { useNavigate, useParams, useLocation } from "react-router";
import { topics } from "../data/topics";
import { useProgress } from "../context/ProgressContext";
import { RotateCcw, BookOpen } from "lucide-react";
import { SageAvatar } from "./SageAvatar";

interface CompleteState {
  timeTaken?: string;
  correct?: number;
  total?: number;
}

export function LessonComplete() {
  const navigate = useNavigate();
  const { topicId, subTopicId } = useParams<{ topicId: string; subTopicId: string }>();
  const location = useLocation();
  const { completedSubTopicIds } = useProgress();
  const state = (location.state ?? {}) as CompleteState;

  const topic = topics.find((t) => t.id === topicId);
  const currentSubIdx = topic?.subTopics.findIndex((s) => s.id === subTopicId) ?? -1;
  const nextSub = topic?.subTopics[currentSubIdx + 1];

  const completedCount = topic?.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length ?? 0;
  const totalModules = topic?.subTopics.length ?? 0;

  const moduleNum = currentSubIdx >= 0 ? currentSubIdx + 1 : 1;
  const timeTaken = state.timeTaken ?? "—";
  const correct = state.correct ?? 0;
  const total = state.total ?? 0;
  const isPerfect = total > 0 && correct === total;
  const currentSubTitle = topic?.subTopics[currentSubIdx]?.title ?? "";

  const handleKeepGoing = () => {
    if (isPerfect && nextSub) {
      navigate(`/topic/${topicId}/subtopic/${nextSub.id}`);
    } else {
      // If not perfect, or no next sub, go back to topic overview (or home)
      navigate(`/topic/${topicId}`);
    }
  };

  return (
    <div className={`anp-app ${isPerfect ? 'anp-complete-bg' : 'anp-quiz-fail-bg'}`}>
      <div className="anp-spacer" />

      <div
        style={{
          padding: "calc(4px * var(--d)) calc(20px * var(--d))",
          display: "flex",
          justifyContent: "flex-end",
          flexShrink: 0,
        }}
      >
        <button className="anp-icon-btn" onClick={() => navigate(`/topic/${topicId}`)} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="anp-scroll" style={{ display: "flex", flexDirection: "column" }}>
        <div className="anp-l-complete">
          <div className={`check-mark ${!isPerfect ? 'fail' : ''}`}>
            {isPerfect ? (
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <SageAvatar size={64} />
            )}
          </div>

          <div className="title">
            {isPerfect 
              ? (nextSub ? "Lesson complete" : "Module complete")
              : "Almost there!"}
          </div>
          <div className="sub">
            {isPerfect
              ? (currentSubTitle ? `"${currentSubTitle}" — keep the momentum going.` : "Well done — keep the momentum going.")
              : "You're making great progress! Review the lesson once more to master this topic."}
          </div>

          <div className="stats">
            <div className="stat">
              <div className="v">{timeTaken}</div>
              <div className="l">Time</div>
            </div>
            <div className="stat">
              <div className="v">{total > 0 ? `${correct}/${total}` : "—"}</div>
              <div className="l">Correct</div>
            </div>
            <div className="stat">
              <div className="v">{completedCount}/{totalModules}</div>
              <div className="l">Modules</div>
            </div>
          </div>

          {isPerfect && nextSub && (
            <div className="next-card">
              <div className="lbl">Next up · module {moduleNum + 1}</div>
              <div className="t">{nextSub.title}</div>
              <div className="next-sub">{MINS_PER_SUBTOPIC} min · quiz</div>
            </div>
          )}

          <div style={{ display: "flex", gap: "calc(10px * var(--d))", marginTop: "calc(20px * var(--d))" }}>
            <button
              className="anp-result__btn anp-result__btn--secondary"
              style={{ 
                flex: 1, 
                padding: "calc(12px * var(--d))", 
                fontSize: "calc(13px * var(--d))", 
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onClick={() => navigate(`/topic/${topicId}/subtopic/${subTopicId}/quiz`)}
            >
              <RotateCcw size={14} />
              <span>Try Again</span>
            </button>
            <button
              className="anp-result__btn anp-result__btn--secondary"
              style={{ 
                flex: 1, 
                padding: "calc(12px * var(--d))", 
                fontSize: "calc(13px * var(--d))", 
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onClick={() => navigate(`/topic/${topicId}/subtopic/${subTopicId}`)}
            >
              <BookOpen size={14} />
              <span>Review Lesson</span>
            </button>
          </div>
        </div>

        <div style={{ height: 30 }} />
      </div>

      <div className="anp-l-quiz-bottom">
        <button className="anp-l-quiz-cta" onClick={handleKeepGoing}>
          {isPerfect && nextSub ? "Keep going" : "Back to lesson overview"}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const MINS_PER_SUBTOPIC = 3;
