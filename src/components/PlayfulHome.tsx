import { useNavigate } from "react-router";
import { topics } from "../data/topics";

type TrackState = "active" | "done" | "upcoming" | "locked";

function resolveTrackState(completion: number, index: number): TrackState {
  if (completion === 100) return "done";
  if (completion > 0) return "active";
  // First topic with 0% is upcoming, rest are locked
  if (index === 0) return "upcoming";
  const prevHasProgress = topics.slice(0, index).some((t) => t.completion > 0);
  return prevHasProgress ? "upcoming" : "locked";
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

const TOTAL_XP = topics.reduce((acc, t) => acc + Math.round(t.completion * 0.5), 0);
const MAX_XP = 250;

export function PlayfulHome() {
  const navigate = useNavigate();

  return (
    <div className="anp-home">
      {/* Header */}
      <div className="anp-home__header">
        <p className="anp-home__eyebrow">Your learning</p>
        <h1 className="anp-home__title">Financial&nbsp;Literacy</h1>

        {/* XP Bar */}
        <div className="anp-home__xp">
          <span className="anp-home__xp-label">Level 2</span>
          <div className="anp-home__xp-track">
            <div
              className="anp-home__xp-fill"
              style={{ width: `${Math.min(100, (TOTAL_XP / MAX_XP) * 100)}%` }}
            />
          </div>
          <span className="anp-home__xp-badge">{TOTAL_XP}&nbsp;/&nbsp;{MAX_XP}&nbsp;XP</span>
        </div>
      </div>

      {/* Scrollable track list */}
      <div className="anp-home__scroll">
        <p className="anp-home__section-label">Topics</p>
        <div className="anp-home__tracks">
          {topics.map((topic, index) => {
            const state = resolveTrackState(topic.completion, index);
            const isLocked = state === "locked";
            const completedSubtopics = topic.subTopics.filter((s) => s.completed).length;

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
                    <span>{completedSubtopics}&nbsp;/&nbsp;{topic.subTopics.length}&nbsp;lessons</span>
                    {topic.completion > 0 && (
                      <>
                        <span className="anp-l-track__dot" />
                        <span>{topic.completion}%&nbsp;done</span>
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
                      style={{ width: `${Math.max(topic.completion, state === "active" ? 8 : 0)}%` }}
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
