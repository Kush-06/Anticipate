import { useNavigate } from "react-router";
import { topics } from "../data/topics";
import { useProgress } from "../context/ProgressContext";

type TrackState = "active" | "done" | "upcoming" | "locked";

function resolveTrackState(completion: number): TrackState {
  if (completion === 100) return "done";
  if (completion > 0) return "active";
  // All topics are unlocked (upcoming) for testing purposes
  return "upcoming";
}

const STATE_ICONS: Record<TrackState, string> = {
  active: "▶",
  done: "✓",
  upcoming: "★",
  locked: "🔒",
};

const TOPIC_GLYPHS: Record<string, string> = {
  pension: "🏦",
  taxes: "💷",
  employment: "📋",
  benefits: "🎁",
  savings: "💰",
};

export function PlayfulHome() {
  const navigate = useNavigate();
  const { getTopicCompletion, completedSubTopicIds } = useProgress();

  const totalSubTopics = topics.reduce((acc, t) => acc + t.subTopics.length, 0);
  const totalCompleted = completedSubTopicIds.length;
  const globalCompletion = Math.round((totalCompleted / totalSubTopics) * 100);

  return (
    <div className="anp-home">
      {/* Header */}
      <div className="anp-home__header">
        <div className="anp-home__header-text">
          <p className="anp-home__eyebrow">Your learning progress</p>
          <h1 className="anp-home__title">Financial&nbsp;Literacy</h1>
        </div>
        
        {/* Semi-circle Gauge Meter - Centered */}
        <div className="anp-home__gauge-container">
          <span className="anp-home__gauge-percentage">{globalCompletion}%</span>
          <div className="anp-home__gauge">
            <svg viewBox="0 0 100 50" className="anp-home__gauge-svg">
              <path
                className="anp-home__gauge-bg"
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                strokeWidth="8"
              />
              <path
                className="anp-home__gauge-fill"
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${(globalCompletion / 100) * 125.6}, 125.6`}
              />
            </svg>
          </div>
        </div>
      </div>

      <style>{`
        .anp-home__header {
          padding-bottom: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .anp-home__header-text {
          margin-bottom: 12px;
        }
        .anp-home__gauge-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 90px;
        }
        .anp-home__gauge-percentage {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 16px;
          color: var(--p-ink);
          margin-bottom: -2px;
        }
        .anp-home__gauge {
          width: 100%;
          height: 45px;
          overflow: hidden;
        }
        .anp-home__gauge-svg {
          width: 100%;
          height: 100%;
        }
        .anp-home__gauge-bg {
          stroke: var(--p-ink-4);
          opacity: 0.2;
        }
        .anp-home__gauge-fill {
          stroke: var(--p-mint);
          stroke-linecap: round;
          transition: stroke-dasharray 0.8s ease-out;
        }
      `}</style>

      {/* Scrollable track list */}
      <div className="anp-home__scroll">
        <p className="anp-home__section-label">Topics</p>
        <div className="anp-home__tracks">
          {topics.map((topic) => {
            const completion = getTopicCompletion(topic.id);
            const state = resolveTrackState(completion);
            const isLocked = state === "locked";
            const completedSubtopicsCount = topic.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;

            const handleClick = () => {
              if (!isLocked) navigate(`/topic/${topic.id}`);
            };

            return (
              <div
                key={topic.id}
                className={[
                  "anp-l-track",
                  state === "active" && "anp-l-track--active",
                  state === "done" && "anp-l-track--done",
                  state === "locked" && "anp-l-track--locked",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={handleClick}
                role={isLocked ? undefined : "button"}
                tabIndex={isLocked ? -1 : 0}
                onKeyDown={(e) => {
                  if (!isLocked && (e.key === "Enter" || e.key === " ")) handleClick();
                }}
              >
                {/* Status bubble */}
                <div
                  className={[
                    "anp-l-track__status",
                    `anp-l-track__status--${state === "upcoming" ? "upcoming" : state}`,
                  ].join(" ")}
                >
                  {state === "done"
                    ? "✓"
                    : state === "locked"
                    ? "🔒"
                    : TOPIC_GLYPHS[topic.id] ?? STATE_ICONS[state]}
                </div>

                {/* Body */}
                <div className="anp-l-track__body">
                  <div className="anp-l-track__title">{topic.title}</div>
                  <div className="anp-l-track__meta">
                    <span>{completedSubtopicsCount}&nbsp;/&nbsp;{topic.subTopics.length}&nbsp;lessons</span>
                    {completion > 0 && (
                      <>
                        <span className="anp-l-track__dot" />
                        <span>{completion}%&nbsp;done</span>
                      </>
                    )}
                    {state === "locked" && (
                      <>
                        <span className="anp-l-track__dot" />
                        <span>Locked</span>
                      </>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="anp-l-track__bar">
                    <div
                      className={`anp-l-track__bar-fill anp-l-track__bar-fill--${
                        state === "upcoming" ? "upcoming" : state
                      }`}
                      style={{ width: `${Math.max(completion, state === "active" ? 8 : 0)}%` }}
                    />
                  </div>
                </div>

                {/* Arrow */}
                {!isLocked && <span className="anp-l-track__arrow">›</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
