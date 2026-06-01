import { useNavigate } from "react-router";
import { topics } from "../data/topics";
import { useProgress } from "../context/ProgressContext";
import { BookOpen, FileText } from "lucide-react";
import { TopicIcon } from "./TopicIcon";

type TrackStatus = "done" | "active" | "queued" | "locked";

const SIDE_COLORS = ["mint", "coral", "gold", "coral", "navy", "mint"];
const MINS_PER_SUBTOPIC = 3;

function deriveStatuses(completions: number[]): TrackStatus[] {
  const activeIdx = completions.findIndex((c) => c < 1);
  if (activeIdx === -1) return completions.map(() => "done");

  return completions.map((c) => {
    if (c === 1) return "done";
    return "active";
  });
}

function ModuleDots({ total, completedCount }: { total: number; completedCount: number }) {
  return (
    <div className="dots">
      {Array.from({ length: total }, (_, i) => {
        const cls = i < completedCount ? "done" : i === completedCount ? "active" : "";
        return <div key={i} className={`dot ${cls}`} />;
      })}
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function PlayfulHome() {
  const navigate = useNavigate();
  const { completedSubTopicIds } = useProgress();

  const completions = topics.map((t) => {
    const done = t.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
    return done / Math.max(t.subTopics.length, 1);
  });

  const statuses = deriveStatuses(completions);
  const activeIdx = statuses.findIndex((s) => s === "active");
  const activeTopic = activeIdx >= 0 ? topics[activeIdx] : topics[0];
  const activeCompletedCount = activeTopic.subTopics.filter((s) =>
    completedSubTopicIds.includes(s.id)
  ).length;
  const activeTotal = activeTopic.subTopics.length;
  const activePct = Math.round((activeCompletedCount / Math.max(activeTotal, 1)) * 100);
  const nextModule = activeTopic.subTopics[activeCompletedCount] ?? activeTopic.subTopics[0];
  const nextModuleIndex = activeTopic.subTopics.indexOf(nextModule) + 1;
  const doneCount = statuses.filter((s) => s === "done").length;
  const ringCirc = 2 * Math.PI * 18;

  return (
    <div className="anp-app anp-lessons-bg">
      <div className="anp-spacer" />

      <div className="anp-top">
        <div className="anp-logo">anticipate.</div>
      </div>

      <div className="anp-scroll">

        {/* Current lesson — dark card */}
        <div className="anp-l-current">
          <div className="hd">
            <div>
              <div className="eyebrow">Continue where you left off</div>
              <h2>{activeTopic.title}</h2>
              <div className="reason">
                {activeCompletedCount} of {activeTotal} modules complete
              </div>
            </div>
            <div className="prog-ring">
              <svg viewBox="0 0 44 44" width="44" height="44">
                <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                <circle
                  cx="22" cy="22" r="18"
                  stroke="#fff"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringCirc * (1 - activePct / 100)}
                  transform="rotate(-90 22 22)"
                  strokeLinecap="round"
                />
              </svg>
              <div className="pct">{activePct}%</div>
            </div>
          </div>

          <ModuleDots total={activeTotal} completedCount={activeCompletedCount} />

          <div className="next-mod">
            <div>
              <div className="lbl">Module {nextModuleIndex} of {activeTotal}</div>
              <div className="title">{nextModule.title}</div>
            </div>
            <button className="go" onClick={() => navigate(`/topic/${activeTopic.id}/subtopic/${nextModule.id}`)}>

              Continue
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="anp-sect-h" style={{ marginTop: "calc(8px * var(--d))" }}>
          <h3>Your lessons</h3>
          <span className="count">{doneCount} done · {topics.length} total</span>
        </div>

        <div className="anp-l-tracks">
          {topics.map((topic, i) => {
            const status = statuses[i];
            const completedCount = topic.subTopics.filter((s) =>
              completedSubTopicIds.includes(s.id)
            ).length;
            const total = topic.subTopics.length;
            const pct = (completedCount / Math.max(total, 1)) * 100;
            const minutes = total * MINS_PER_SUBTOPIC;
            const color = SIDE_COLORS[i] ?? "mint";
            const isLocked = status === "locked";

            return (
              <div
                key={topic.id}
                className={`anp-l-track ${status} ${color}`}
                onClick={() => !isLocked && navigate(`/topic/${topic.id}`)}
              >
                <div className="anp-l-track-num">
                  {isLocked ? (
                    <LockIcon />
                  ) : (
                    <TopicIcon topicId={topic.id} size={24} />
                  )}
                </div>

                <div className="anp-l-track-body">
                  <div className="anp-l-track-title">
                    {topic.title}
                    {status === "active" && <span className="now-tag">NOW</span>}
                  </div>

                  {isLocked ? (
                    <div className="anp-l-track-meta">
                      <span className="lock-meta">Complete earlier lessons to unlock</span>
                    </div>
                  ) : (
                    <>
                      <div className="anp-l-track-progress">
                        <div className="bar">
                          <div style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="anp-l-track-meta">
                        <span>{status === "done" ? "Complete" : `${completedCount}/${total} modules`}</span>
                        <span>{minutes} min</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 50 }} />
      </div>

      <div className="anp-bottom-nav">
        <button className="anp-bottom-nav__tab" onClick={() => navigate("/decoder")}>
          <FileText size={22} />
          <span className="anp-bottom-nav__label">Decoder</span>
        </button>
        <button className="anp-bottom-nav__tab anp-bottom-nav__tab--active" onClick={() => navigate("/")}>
          <BookOpen size={22} />
          <span className="anp-bottom-nav__label">Learn</span>
        </button>
      </div>
    </div>
  );
}
