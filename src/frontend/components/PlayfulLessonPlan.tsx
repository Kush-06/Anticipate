import { useNavigate, useParams } from "react-router";
import { topics } from "../data/topics";
import { useProgress } from "../context/ProgressContext";

type NodeStatus = "done" | "active" | "locked";

const SIDE_PATTERN = ["c", "r", "l", "c", "r", "l"] as const;
const MINS_PER_MODULE = 3;

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="anp-icon-btn" onClick={onClick} aria-label="Back">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L4 8l6 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ModuleGlyph({ status }: { status: NodeStatus }) {
  if (status === "locked") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (status === "done") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9a3 3 0 116 0c0 1.5-3 2-3 4M12 17v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PlayfulLessonPlan() {
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();
  const { completedSubTopicIds } = useProgress();

  const topic = topics.find((t) => t.id === topicId);

  if (!topic) {
    return (
      <div className="anp-app anp-lessons-bg">
        <div className="anp-scroll" style={{ padding: "24px 20px" }}>
          <p style={{ color: "var(--p-ink-3)", textAlign: "center" }}>Lesson not found.</p>
        </div>
      </div>
    );
  }

  const totalModules = topic.subTopics.length;
  const completedCount = topic.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
  const minutesLeft = (totalModules - completedCount) * MINS_PER_MODULE;

  const nodeStatuses: NodeStatus[] = topic.subTopics.map((sub, i) => {
    if (completedSubTopicIds.includes(sub.id)) return "done";
    const firstIncomplete = topic.subTopics.findIndex((s) => !completedSubTopicIds.includes(s.id));
    if (i === firstIncomplete) return "active";
    return "locked";
  });

  return (
    <div className="anp-app anp-lessons-bg">
      <div className="anp-spacer" />

      <div className="anp-top">
        <BackBtn onClick={() => navigate("/learn")} />
        <div className="anp-wordmark">Lesson plan</div>
        <div style={{ width: "calc(36px * var(--d))" }} />
      </div>

      <div className="anp-scroll">
        <div className="anp-l-plan-head">
          <div className="eyebrow">
            {topic.title} · {completedCount} of {totalModules} modules done
          </div>
          <h1>{topic.title}</h1>
          <div className="sub">
            {totalModules} short modules.{" "}
            {completedCount > 0 ? `${completedCount} done. ` : ""}
            {minutesLeft > 0 ? `About ${minutesLeft} min left.` : "All complete!"}
          </div>

          <div className="anp-l-plan-meta">
            <div className="m">
              <div className="v">{completedCount}/{totalModules}</div>
              <div className="l">Modules</div>
            </div>
            <div className="m">
              <div className="v">
                {minutesLeft}
                <span style={{ color: "var(--p-ink-3)", fontWeight: 400 }}>m</span>
              </div>
              <div className="l">Left</div>
            </div>
            <div className="m">
              <div className="v">{totalModules}</div>
              <div className="l">Total</div>
            </div>
          </div>
        </div>

        <div className="anp-l-path">
          {topic.subTopics.map((sub, i) => {
            const status = nodeStatuses[i];
            const side = SIDE_PATTERN[i % SIDE_PATTERN.length];

            return (
              <div
                key={sub.id}
                className={`anp-l-node side-${side} ${status}`}
                onClick={() => status !== "locked" && navigate(`/topic/${topic.id}/subtopic/${sub.id}`)}
              >
                {status === "active" && <div className="halo" />}
                <div className="bubble">
                  {status === "active" && <div className="cta-pulse">Start ›</div>}
                  <div className="glyph">
                    <ModuleGlyph status={status} />
                  </div>
                </div>
                <div className="label">
                  <div className="ttl">{sub.title}</div>
                  <div className="sub">
                    {status === "locked"
                      ? "Locked"
                      : status === "done"
                      ? "Done"
                      : `${MINS_PER_MODULE} min · quiz`}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="anp-l-finish-clean">
            <div className="rosette">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text">
              <div className="ttl">{topic.title}, handled</div>
              <div className="sub">Finish all {totalModules} modules to wrap up this lesson.</div>
            </div>
          </div>
        </div>

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
