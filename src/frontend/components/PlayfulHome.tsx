import { useNavigate } from "react-router";
import {
  Baby,
  Briefcase,
  Car,
  CreditCard,
  Gift,
  HeartHandshake,
  House,
  KeyRound,
  Landmark,
  Lightbulb,
  LineChart,
  Scale,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { topics } from "../data/topics";
import { useProgress } from "../context/ProgressContext";

const TOPIC_ICONS: Record<string, LucideIcon> = {
  "starting-work":    Briefcase,
  "renting":          KeyRound,
  "buying-a-home":    House,
  "relationships":    HeartHandshake,
  "family":           Baby,
  "career":           TrendingUp,
  "cars":             Car,
  "debt":             Scale,
  "windfalls":        Gift,
  "foundations":      Lightbulb,
  "mastering-credit": CreditCard,
  "investing-101":    LineChart,
  "taxes-wealth":     Landmark,
};

type TrackStatus = "done" | "active" | "queued";

const SIDE_COLORS = ["mint", "coral", "gold", "plum", "navy", "mint"];
const MINS_PER_SUBTOPIC = 3;

function deriveStatuses(completions: number[]): TrackStatus[] {
  const activeIdx = completions.findIndex((c) => c < 1);
  if (activeIdx === -1) return completions.map(() => "done");

  return completions.map((c, i) => {
    if (c === 1) return "done";
    if (i === activeIdx) return "active";
    return "queued";
  });
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="anp-icon-btn" onClick={onClick} aria-label="Back">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L4 8l6 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
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
        <BackBtn onClick={() => navigate(-1)} />
        <div className="anp-wordmark">Your learning</div>
        <div style={{ width: "calc(36px * var(--d))" }} />
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
            return (
              <div
                key={topic.id}
                className={`anp-l-track ${status} ${color}`}
                onClick={() => navigate(`/topic/${topic.id}`)}
              >
                <div className="anp-l-track-num">
                  {status === "done" ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (() => {
                    const Icon = TOPIC_ICONS[topic.id];
                    return Icon ? <Icon size={24} strokeWidth={1.5} /> : null;
                  })()}
                </div>

                <div className="anp-l-track-body">
                  <div className="anp-l-track-title">
                    {topic.title}
                    {status === "active" && <span className="now-tag">NOW</span>}
                  </div>

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
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 50 }} />
      </div>
    </div>
  );
}
