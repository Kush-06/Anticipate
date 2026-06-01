import { useNavigate } from "react-router";
import { useProfile } from "../context/ProfileContext";
import { useTimeline } from "../context/TimelineContext";
import type { SpineItem } from "../context/TimelineContext";
import { useProgress } from "../context/ProgressContext";
import { topics } from "../data/topics";
import { SageAvatar } from "./SageAvatar";
import { AppIcon } from "./AppIcon";

function getGreeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <>
      {time}, <b>{name}.</b>
    </>
  );
}

function SpineNode({ item, isLast, onNavigate }: { item: SpineItem; isLast: boolean; onNavigate: (path: string) => void }) {
  const isActive = item.status === "active";
  return (
    <div className="av-spine-item" style={{ "--is-last": isLast ? "1" : "0" } as React.CSSProperties}>
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
        {isActive && item.lessonPath && (
          <div>
            <button className="av-spine-go" onClick={() => onNavigate(item.lessonPath!)}>
              Start now <AppIcon name="arrowRight" size={12} stroke={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { groups } = useTimeline();
  const { completedSubTopicIds } = useProgress();

  const firstName = profile?.firstName ?? "there";
  const company = profile?.companyName ?? "your employer";

  // Find the active topic for the continue card
  const topicCompletions = topics.map((t) => {
    const done = t.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
    return { topic: t, done, total: t.subTopics.length, pct: done / Math.max(t.subTopics.length, 1) };
  });
  const activeEntry = topicCompletions.find((e) => e.pct > 0 && e.pct < 1) ?? topicCompletions[0];
  const nextLesson = activeEntry?.topic.subTopics.find((s) => !completedSubTopicIds.includes(s.id));

  const totalItems = groups.reduce((a, g) => a + g.items.length, 0);

  return (
    <div className="anp-app" style={{ background: "var(--p-bg)" }}>
      <div style={{ height: "max(calc(16px * var(--d)), env(safe-area-inset-top))", flexShrink: 0 }} />

      {/* Top bar */}
      <div className="anp-top">
        <div className="av-logo">anticipate.</div>
        <button className="anp-icon-btn" onClick={() => navigate("/notifications")} aria-label="Notifications">
          <AppIcon name="bell" size={19} />
        </button>
      </div>

      <div className="anp-scroll">
        {/* Greeting */}
        <div className="av-greet">
          <h1 style={{ fontFamily: "var(--p-display)", fontWeight: 400 }}>{getGreeting(firstName)}</h1>
          <div className="sub">Here's what's coming — and what to get ahead of.</div>
        </div>

        {/* Sage nudge */}
        <div className="av-sage">
          <div className="av-sage__row">
            <SageAvatar size={46} />
            <div>
              <div className="av-sage__eyebrow">Sage</div>
              <div className="av-sage__text">
                Your first payslip from <b>{company}</b> lands in 3 days. Let's walk through it now so you're ready — it takes <b>4 minutes</b>.
              </div>
              <button className="av-sage__cta" onClick={() => navigate("/learn")}>
                Start the lesson <AppIcon name="arrowRight" size={13} stroke={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Continue card */}
        {activeEntry && (
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
                  {activeEntry.done > 0
                    ? `${activeEntry.done} of ${activeEntry.total} lessons complete`
                    : `${activeEntry.total} lessons · start now`}
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

        {/* Timeline spine */}
        <div className="av-sect" style={{ marginTop: "calc(20px * var(--d))" }}>
          <h3>What's ahead</h3>
          <span className="meta">{totalItems > 0 ? "Your timeline" : ""}</span>
        </div>

        <div className="av-spine">
          {groups.map((group) => (
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
                  onNavigate={navigate}
                />
              ))}
            </div>
          ))}
        </div>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
