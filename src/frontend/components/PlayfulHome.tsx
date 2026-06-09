import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Baby,
  Briefcase,
  Car,
  ChevronDown,
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
import { topics, getRecommendedTopics, getRecommendedSummary } from "../data/topics";
import { useProgress } from "../context/ProgressContext";
import { useProfile } from "../context/ProfileContext";
import { TopBar } from "./TopBar";

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

const TOPIC_SUBTITLES: Record<string, string> = {
  "starting-work":    "Payslip, pension, student loan & budgeting",
  "renting":          "Deposits, bills and renters' insurance",
  "buying-a-home":    "Mortgages, LISA and hidden costs",
  "relationships":    "Joint accounts and the marriage allowance",
  "family":           "Parental pay and junior ISAs",
  "career":           "Salary negotiation and pension consolidation",
  "cars":             "Car finance and the true cost of driving",
  "debt":             "Debt spectrum, payoff strategies and free help",
  "windfalls":        "The 30-day pause and maximising allowances",
  "foundations":      "Compound interest, emergency funds & inflation",
  "mastering-credit": "Credit scores, cards and smart borrowing",
  "investing-101":    "Funds, ISAs and building long-term wealth",
  "taxes-wealth":     "Tax brackets, CGT and the state pension",
};

type TrackStatus = "done" | "active" | "queued";

const SIDE_COLORS = ["mint", "coral", "gold", "coral", "navy", "mint"];
const MINS_PER_SUBTOPIC = 3;

const FOUNDATIONAL_IDS = new Set(["foundations", "mastering-credit", "investing-101", "taxes-wealth"]);

function deriveStatuses(completions: number[]): TrackStatus[] {
  const activeIdx = completions.findIndex((c) => c < 1);
  if (activeIdx === -1) return completions.map(() => "done");

  return completions.map((c, i) => {
    if (c === 1) return "done";
    if (i === activeIdx) return "active";
    return "queued";
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

function TrackIcon({ topicId, status }: { topicId: string; status: TrackStatus }) {
  if (status === "done") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const Icon = TOPIC_ICONS[topicId];
  return Icon ? <Icon size={22} strokeWidth={1.5} /> : null;
}

function TrackTile({ topic, status, completedCount, minutes, pct, color, isRecommended, onClick }: {
  topic: typeof topics[0];
  status: TrackStatus;
  completedCount: number;
  minutes: number;
  pct: number;
  color: string;
  isRecommended?: boolean;
  onClick: () => void;
}) {
  const total = topic.subTopics.length;
  return (
    <div
      className={`anp-l-track ${status} ${color}`}
      onClick={onClick}
    >
      <div className="anp-l-track-num">
        <TrackIcon topicId={topic.id} status={status} />
      </div>
      <div className="anp-l-track-body">
        <div className="anp-l-track-title">
          {topic.title}
          {status === "active" && <span className="now-tag">NOW</span>}
          {isRecommended && <span className="rec-tag">FOR YOU</span>}
        </div>
        <div className="anp-l-track-sub">{TOPIC_SUBTITLES[topic.id]}</div>
        <div className="anp-l-track-progress">
          <div className="bar">
            <div style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="anp-l-track-meta">
          <span>{status === "done" ? "Complete" : `${completedCount}/${total} modules`}</span>
          <span>{minutes} min</span>
        </div>
      </div>
    </div>
  );
}

export function PlayfulHome() {
  const navigate = useNavigate();
  const { completedSubTopicIds } = useProgress();
  const { profile } = useProfile();
  const [foundationalOpen, setFoundationalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

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
  const ringCirc = 2 * Math.PI * 18;

  // Filter recommendations to show on non-completed topics
  const recs = getRecommendedTopics(profile).filter((id) => {
    const t = topics.find((topic) => topic.id === id);
    if (!t) return false;
    const completedCount = t.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
    return completedCount < t.subTopics.length;
  });

  const recSummary = getRecommendedSummary(profile);
  const recTopicIds = Array.from(new Set(recSummary.map((c) => c.topicId)));
  const suggestedTopics = recTopicIds
    .map((id) => topics.find((t) => t.id === id))
    .filter((t): t is typeof topics[0] => !!t);

  const foundational = topics.filter((t) => FOUNDATIONAL_IDS.has(t.id));
  const suggested = topics
    .filter((t) => !FOUNDATIONAL_IDS.has(t.id))
    .sort((a, b) => {
      const aRec = recs.includes(a.id);
      const bRec = recs.includes(b.id);
      if (aRec && !bRec) return -1;
      if (!aRec && bRec) return 1;
      return 0;
    });

  const renderTrackTile = (topic: typeof topics[0]) => {
    const globalIdx = topics.indexOf(topic);
    const status = statuses[globalIdx];
    const completedCount = topic.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
    const total = topic.subTopics.length;
    const pct = (completedCount / Math.max(total, 1)) * 100;
    const minutes = total * MINS_PER_SUBTOPIC;
    const color = SIDE_COLORS[globalIdx % SIDE_COLORS.length];
    const isRecommended = recTopicIds.includes(topic.id);
    return (
      <TrackTile
        key={topic.id}
        topic={topic}
        status={status}
        completedCount={completedCount}
        minutes={minutes}
        pct={pct}
        color={color}
        isRecommended={isRecommended}
        onClick={() => navigate(`/topic/${topic.id}`)}
      />
    );
  };

  return (
    <div className="anp-app anp-lessons-bg">
      <TopBar showNotifications={false} />

      <div className="anp-scroll">

        {/* Continue card */}
        <div className="anp-l-current" style={{ margin: "0 calc(16px * var(--d)) calc(20px * var(--d))" }}>
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
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Suggested for you ── */}
        {suggestedTopics.length > 0 && (
          <>
            <div className="anp-sect-h" style={{ marginTop: "calc(4px * var(--d))" }}>
              <h3>Suggested for you</h3>
              <span className="count">Based on your profile</span>
            </div>
            <div className="anp-l-tracks">
              {suggestedTopics.map(renderTrackTile)}
            </div>
          </>
        )}

        {/* ── Module Library — collapsible card ── */}
        <div style={{
          margin: "0 calc(16px * var(--d)) calc(16px * var(--d))",
          background: "var(--p-bg-card, #fff)",
          borderRadius: "calc(20px * var(--d))",
          border: "1px solid var(--p-line-1)",
          overflow: "hidden",
        }}>
          <button
            onClick={() => setLibraryOpen((o) => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "calc(14px * var(--d)) calc(14px * var(--d))",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "calc(6px * var(--d))" }}>
              <span style={{
                fontFamily: "var(--p-display)",
                fontWeight: 600,
                fontSize: "calc(16px * var(--d))",
                letterSpacing: "-0.01em",
                color: "var(--p-ink)",
              }}>Module Library</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "calc(8px * var(--d))" }}>
              <span style={{
                fontFamily: "var(--p-mono)",
                fontSize: "calc(9.5px * var(--d))",
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "var(--p-ink-3)",
              }}>All topics</span>
              <ChevronDown
                size={16}
                color="var(--p-ink-3)"
                style={{
                  transition: "transform 0.25s ease",
                  transform: libraryOpen ? "rotate(180deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}
              />
            </div>
          </button>

          {libraryOpen && (
            <div style={{
              padding: "0 calc(14px * var(--d)) calc(14px * var(--d))",
              display: "flex",
              flexDirection: "column",
              gap: "calc(10px * var(--d))",
            }}>
              {suggested.map(renderTrackTile)}
            </div>
          )}
        </div>

        {/* ── Foundational section — collapsible card ── */}
        <div style={{
          margin: "calc(16px * var(--d)) calc(16px * var(--d)) calc(16px * var(--d))",
          background: "linear-gradient(135deg, #fef9ee 0%, #faeac8 45%, #fdf5e2 100%)",
          borderRadius: "calc(20px * var(--d))",
          border: "1px solid var(--p-gold-tint)",
          overflow: "hidden",
        }}>
          {/* Tappable header row */}
          <button
            onClick={() => setFoundationalOpen((o) => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "calc(14px * var(--d)) calc(14px * var(--d))",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "calc(6px * var(--d))" }}>
              <span style={{ color: "var(--p-gold)", fontSize: "calc(14px * var(--d))", lineHeight: 1 }}>✦</span>
              <span style={{
                fontFamily: "var(--p-display)",
                fontWeight: 600,
                fontSize: "calc(16px * var(--d))",
                letterSpacing: "-0.01em",
                color: "var(--p-ink)",
              }}>Foundational</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "calc(8px * var(--d))" }}>
              <span style={{
                fontFamily: "var(--p-mono)",
                fontSize: "calc(9.5px * var(--d))",
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "var(--p-gold)",
              }}>Everyone starts here</span>
              <ChevronDown
                size={16}
                color="var(--p-gold)"
                style={{
                  transition: "transform 0.25s ease",
                  transform: foundationalOpen ? "rotate(180deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}
              />
            </div>
          </button>

          {/* Collapsible content */}
          {foundationalOpen && (
            <div style={{
              padding: "0 calc(14px * var(--d)) calc(14px * var(--d))",
              display: "flex",
              flexDirection: "column",
              gap: "calc(10px * var(--d))",
            }}>
              {foundational.map(renderTrackTile)}
            </div>
          )}
        </div>

        <div style={{ height: 50 }} />
      </div>
    </div>
  );
}
