import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useProfile, getPendingQuestions } from "../context/ProfileContext";
import { useTimeline } from "../context/TimelineContext";
import type { SpineItem } from "../context/TimelineContext";
import { useProgress } from "../context/ProgressContext";
import { topics, getRecommendedTopics } from "../data/topics";
import { getFallbackAccessibleTimelineItemId, isTimelineItemAccessible } from "../utils/timelineAccessibility";
import { getTimelineItemDestination } from "../utils/timelineNavigation";
import { SageAvatar } from "./SageAvatar";
import { AppIcon } from "./AppIcon";
import { TopBar } from "./TopBar";
import { HomeSageChat } from "./HomeSageChat";
import { TimelineUpdatePopup } from "./TimelineUpdatePopup";
import { ExtraContextChatPopup } from "./ExtraContextChatPopup";


function getGreeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <>
      {time}, <b>{name}.</b>
    </>
  );
}

function SpineNode({
  item,
  isLast,
  isAccessible,
  destination,
  onNavigate,
}: {
  item: SpineItem;
  isLast: boolean;
  isAccessible: boolean;
  destination: string | null;
  onNavigate: (path: string) => void;
}) {
  const isExplicitlyActive = item.status === "active";
  const isActive = isExplicitlyActive || isAccessible;
  const canNavigate = isActive && destination !== null;

  const handleOpen = () => {
    if (canNavigate) onNavigate(destination);
  };

  return (
    <div
      className={`av-spine-item ${item.status === "done" ? "is-done" : ""} ${canNavigate ? "is-clickable" : ""}`}
      style={{ "--is-last": isLast ? "1" : "0" } as React.CSSProperties}
      role={canNavigate ? "button" : undefined}
      tabIndex={canNavigate ? 0 : undefined}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (!canNavigate) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      <div className="av-spine-rail">
        <div className={`av-spine-node ${isActive ? "active" : item.status === "done" ? "done" : ""}`}>
          {isActive
            ? <AppIcon name="play" size={11} stroke={2} />
            : item.status === "done"
            ? <AppIcon name="check" size={13} stroke={2.4} />
            : <AppIcon name="clock" size={13} />}
        </div>
        {!isLast && <div className="av-spine-line" />}
      </div>
      <div className="av-spine-body">
        <div className="av-spine-when">{item.when}</div>
        <div className="av-spine-ttl">{item.title}</div>
        <span className="av-spine-tag">{item.tag}</span>
        {isActive && canNavigate && (
          <div>
            <span className="av-spine-go">
              {item.lessonPath ? "Start now" : "Explore topic"} <AppIcon name="arrowRight" size={12} stroke={2} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [sageChatOpen, setSageChatOpen] = useState(false);
  const { groups, isLoading: timelineLoading } = useTimeline();
  const { completedSubTopicIds } = useProgress();
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [showExtraPopup, setShowExtraPopup] = useState(false);

  useEffect(() => {
    if (profile) {
      const pending = getPendingQuestions(profile);
      const skipped = sessionStorage.getItem("anticipate_skipped_extra_details");
      const justOnboarded = localStorage.getItem("anticipate_just_onboarded") === "true";
      if (pending.length > 0 && !skipped && justOnboarded) {
        setShowExtraPopup(true);
      }
    }
  }, [profile]);


  const firstName = profile?.firstName ?? "there";
  const company = profile?.companyName ?? "your employer";

  // Recommendation logic - filter out fully completed topics
  const recs = getRecommendedTopics(profile).filter((id) => {
    const t = topics.find((topic) => topic.id === id);
    if (!t) return false;
    const completedCount = t.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
    return completedCount < t.subTopics.length;
  });

  // Fallback to first incomplete topic if all recommendations are completed or if there are none
  const incompleteTopics = topics.filter((t) => {
    const completedCount = t.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
    return completedCount < t.subTopics.length;
  });

  const recTopic = topics.find((t) => recs.includes(t.id)) ?? incompleteTopics[0] ?? topics[0];

  let sageNudgeText = `Your first payslip from <b>${company}</b> lands in 3 days. Let's walk through it now so you're ready — it takes <b>4 minutes</b>.`;
  if (recTopic) {
    if (recTopic.id === "buying-a-home") {
      sageNudgeText = `Based on your goal to buy a home, I recommend starting with the <b>Buying a Home</b> module. It covers mortgages and Lifetime ISAs!`;
    } else if (recTopic.id === "debt") {
      sageNudgeText = `I noticed you want to keep on top of debt. Let's start with the <b>Managing Debt</b> module to review payoff strategies together.`;
    } else if (recTopic.id === "investing-101") {
      sageNudgeText = `You mentioned an interest in investing. Let's explore <b>Investing 101</b> to learn about stock markets, risk, and index funds.`;
    } else if (recTopic.id === "renting") {
      sageNudgeText = `Since you have tenancy questions, let's explore <b>Renting</b> to learn about deposits, bill budgeting, and tenancy rights.`;
    } else if (recTopic.id === "starting-work") {
      sageNudgeText = `Let's make sure you understand your payslip. It's the best foundation for learning about taxes and PAYE!`;
    } else if (recTopic.id === "foundations") {
      sageNudgeText = `I recommend starting with <b>The Foundations</b>. Let's explore compound interest and building emergency funds.`;
    } else if (recTopic.id === "taxes-wealth") {
      sageNudgeText = `Let's tackle tax brackets and capital gains. I recommend starting with <b>Taxes & Wealth Building</b>!`;
    } else if (recTopic.id === "career") {
      sageNudgeText = `Want to improve your pay? Let's walk through <b>Career & Pay</b> to review negotiation and pension consolidation.`;
    }
  }

  // Find the active topic for the continue card
  const topicCompletions = topics.map((t) => {
    const done = t.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
    return { topic: t, done, total: t.subTopics.length, pct: done / Math.max(t.subTopics.length, 1) };
  });
  const activeEntry = topicCompletions.find((e) => e.pct > 0 && e.pct < 1) ?? topicCompletions[0];
  const nextLesson = activeEntry?.topic.subTopics.find((s) => !completedSubTopicIds.includes(s.id));

  const totalItems = groups.reduce((a, g) => a + g.items.length, 0);
  const accessibleItemId = getFallbackAccessibleTimelineItemId(groups.flatMap((g) => g.items));

  return (
    <div className="anp-app" style={{ background: "var(--p-bg)" }}>
      <TopBar />

      <div className="anp-scroll">
        {/* Greeting */}
        <div className="av-greet">
          <h1 style={{ fontFamily: "var(--p-display)", fontWeight: 400 }}>{getGreeting(firstName)}</h1>
          <div className="sub">Here's what's coming — and what to get ahead of.</div>
        </div>

        {/* Continue card — only when user has real progress */}
        {activeEntry && activeEntry.pct > 0 && (
          <div
            className="anp-l-current"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(nextLesson ? `/topic/${activeEntry.topic.id}/subtopic/${nextLesson.id}` : `/topic/${activeEntry.topic.id}`)}
          >
            <div className="hd">
              <div>
                <div className="eyebrow">Continue where you left off</div>
                <h2>{activeEntry.topic.title}</h2>
                <div className="reason">
                  {activeEntry.done} of {activeEntry.total} lessons complete
                </div>
              </div>
              <div className="prog-ring">
                <svg viewBox="0 0 44 44" width="44" height="44">
                  <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                  <circle
                    cx="22" cy="22" r="18" stroke="#fff" strokeWidth="4" fill="none"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 * (1 - activeEntry.pct)}
                    transform="rotate(-90 22 22)"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="pct">{Math.round(activeEntry.pct * 100)}%</div>
              </div>
            </div>
            <div className="dots">
              {activeEntry.topic.subTopics.map((s) => (
                <div
                  key={s.id}
                  className={`dot ${completedSubTopicIds.includes(s.id) ? "done" : s.id === nextLesson?.id ? "active" : ""}`}
                />
              ))}
            </div>
            {nextLesson && (
              <div className="next-mod">
                <div>
                  <div className="lbl">Next lesson</div>
                  <div className="title">{nextLesson.title}</div>
                </div>
                <button
                  className="go"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/topic/${activeEntry.topic.id}/subtopic/${nextLesson.id}`);
                  }}
                >
                  Continue <AppIcon name="chevronRight" size={13} stroke={2} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sage nudge — recommendation + community actions merged into one card */}
        <div className="av-sage">
          <div className="av-sage__row">
            <SageAvatar size={46} />
            <div>
              <div className="av-sage__eyebrow">Sage recommendation</div>
              <div className="av-sage__text" dangerouslySetInnerHTML={{ __html: sageNudgeText }} />
            </div>
          </div>
          <div className="av-sage__actions">
            <button className="av-sage__action-row" onClick={() => setSageChatOpen(true)}>
              Chat with Sage <AppIcon name="arrowRight" size={13} stroke={2} />
            </button>
            <button className="av-sage__action-row" onClick={() => navigate(recTopic ? `/topic/${recTopic.id}` : "/learn")}>
              Start lesson <AppIcon name="arrowRight" size={13} stroke={2} />
            </button>
            <button className="av-sage__action-row" onClick={() => navigate("/community")}>
              Ask community <AppIcon name="arrowRight" size={13} stroke={2} />
            </button>
          </div>
        </div>

        {/* Timeline spine */}
        <div className="av-sect" style={{ marginTop: "calc(20px * var(--d))" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div>
              <h3>What's ahead</h3>
              <span className="meta">{totalItems > 0 ? "Your timeline" : ""}</span>
            </div>
            <button 
              className="ut-btn"
              onClick={() => setShowUpdatePopup(true)}
            >
              <AppIcon name="plus" size={14} stroke={2.5} /> Update
            </button>
          </div>
        </div>

        <div className="av-spine">
          {timelineLoading ? (
            <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", gap: 16 }}>
              {[80, 120, 96].map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--p-line)", flexShrink: 0, marginTop: 4 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <div style={{ height: 12, width: `${w}px`, borderRadius: 6, background: "var(--p-line)" }} />
                    <div style={{ height: 10, width: "60%", borderRadius: 6, background: "var(--p-line)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : totalItems === 0 ? (
            <div style={{ padding: "32px 0 16px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--p-ink)", fontFamily: "var(--p-sans)", marginBottom: 6 }}>
                Nothing on your radar yet
              </div>
              <div style={{ fontSize: 13, color: "var(--p-ink-2)", fontFamily: "var(--p-sans)", lineHeight: 1.5 }}>
                Sage will fill in your upcoming milestones<br />once you complete your profile.
              </div>
            </div>
          ) : (
            groups.filter((g) => g.items.length > 0).map((group) => (
              <div key={group.key}>
                <div className="av-spine__group-h">
                  {group.label}
                  <span className="n">· {group.items.length}</span>
                </div>
                {group.items.map((item, i) => (
                  <SpineNode
                    key={item.id}
                    item={item}
                    isLast={i === group.items.length - 1 && group.key === "later"}
                    isAccessible={isTimelineItemAccessible(item, accessibleItemId)}
                    destination={getTimelineItemDestination(item, topics)}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <div style={{ height: 32 }} />
      </div>

      <HomeSageChat open={sageChatOpen} onClose={() => setSageChatOpen(false)} />

      <TimelineUpdatePopup 
        isOpen={showUpdatePopup} 
        onClose={() => setShowUpdatePopup(false)} 
      />

      {showExtraPopup && (
        <ExtraContextChatPopup 
          isOpen={showExtraPopup} 
          onClose={() => {
            setShowExtraPopup(false);
            localStorage.removeItem("anticipate_just_onboarded");
          }}
        />
      )}


      <style>{`
        .ut-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #e6dbc4;
          border: none;
          border-radius: 100px;
          color: #5f5848;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s ease, background 0.15s ease;
        }
        .ut-btn:active {
          transform: scale(0.96);
          background: #d9cdb0;
        }
      `}</style>
    </div>
  );
}
