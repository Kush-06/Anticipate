import { useNavigate, useParams } from "react-router";
import { topics } from "../data/topics";
import { useProgress } from "../context/ProgressContext";

type NodeState = "done" | "active" | "upcoming" | "locked";

const NODE_ICONS: Record<NodeState, string> = {
  done: "✓",
  active: "▶",
  upcoming: "○",
  locked: "🔒",
};

const NODE_ALIGNMENTS = ["right", "center", "left", "center", "right", "center"] as const;

export function PlayfulLessonPlan() {
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();
  const { completedSubTopicIds } = useProgress();

  const topic = topics.find((t) => t.id === topicId);

  if (!topic) {
    return (
      <div className="anp-plan">
        <div className="anp-plan__scroll" style={{ padding: "24px 16px" }}>
          <p style={{ color: "var(--p-ink-3)", textAlign: "center" }}>Topic not found.</p>
        </div>
      </div>
    );
  }

  const completedCount = topic.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
  const totalModules = topic.subTopics.length;

  const nodeStates: NodeState[] = topic.subTopics.map((sub, i) => {
    const isCompleted = completedSubTopicIds.includes(sub.id);
    if (isCompleted) return "done";
    
    const firstIncompleteIdx = topic.subTopics.findIndex((s) => !completedSubTopicIds.includes(s.id));
    if (i === firstIncompleteIdx) return "active";
    if (i === firstIncompleteIdx + 1) return "upcoming";
    return "locked";
  });

  const xpEarned = completedCount * 15;
  const estimatedMins = totalModules * 5;

  return (
    <div className="anp-plan">
      {/* Top bar */}
      <div className="anp-plan__topbar">
        <button className="anp-plan__back" onClick={() => navigate("/")} aria-label="Back to home">
          ‹
        </button>
        <span className="anp-plan__topbar-title">{topic.title}</span>
      </div>

      <div className="anp-plan__scroll">
        {/* Course header card */}
        <div className="anp-plan__header-card">
          <span className="anp-plan__header-icon">{topic.icon}</span>
          <h2 className="anp-plan__header-title">{topic.title}</h2>
          <p className="anp-plan__header-subtitle">Complete all modules to unlock the final quiz</p>
          <div className="anp-plan__stats">
            <div className="anp-plan__stat">
              <span className="anp-plan__stat-val">{totalModules}</span>
              <span className="anp-plan__stat-label">Modules</span>
            </div>
            <div className="anp-plan__stat">
              <span className="anp-plan__stat-val">{xpEarned}&nbsp;XP</span>
              <span className="anp-plan__stat-label">Earned</span>
            </div>
            <div className="anp-plan__stat">
              <span className="anp-plan__stat-val">~{estimatedMins}m</span>
              <span className="anp-plan__stat-label">Est. time</span>
            </div>
            <div className="anp-plan__stat">
              <span className="anp-plan__stat-val">{completedCount}/{totalModules}</span>
              <span className="anp-plan__stat-label">Progress</span>
            </div>
          </div>
        </div>

        {/* Snaking path */}
        <div className="anp-plan__path">
          {topic.subTopics.map((sub, index) => {
            const state = nodeStates[index];
            const alignment = NODE_ALIGNMENTS[index % NODE_ALIGNMENTS.length];
            const isLast = index === topic.subTopics.length - 1;

            return (
              <div key={sub.id} style={{ width: "100%" }}>
                <div className={`anp-plan__node-row anp-plan__node-row--${alignment}`}>
                  <div
                    className={`anp-plan__node${state !== "locked" ? " anp-plan__node--clickable" : ""}`}
                    onClick={() => {
                      if (state !== "locked") {
                        navigate(`/topic/${topic.id}/subtopic/${sub.id}`);
                      }
                    }}
                  >
                    <div className={`anp-plan__node-bubble anp-plan__node-bubble--${state}`}>
                      {NODE_ICONS[state]}
                    </div>
                    <span className={`anp-plan__node-label anp-plan__node-label--${state}`}>
                      {sub.title}
                    </span>
                    {state === "active" && (
                      <span className="anp-plan__node-start">Start ›</span>
                    )}
                  </div>
                </div>

                {!isLast && (
                  <div className="anp-plan__connector">
                    <div className={`anp-plan__connector-line anp-plan__connector-line--${alignment}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Treasure chest completion card */}
        {completedCount === totalModules && (
          <div className="anp-plan__chest-card">
            <span className="anp-plan__chest-icon">🏆</span>
            <div className="anp-plan__chest-body">
              <p className="anp-plan__chest-title">Topic Complete!</p>
              <p className="anp-plan__chest-sub">Finish all modules and ace the quiz to earn your badge</p>
            </div>
          </div>
        )}

        {/* Quiz CTA */}
        <button
          className="anp-plan__quiz-cta"
          onClick={() => navigate(`/topic/${topic.id}/quiz`)}
        >
          <span>📝</span>
          Take the topic quiz
        </button>
      </div>
    </div>
  );
}
