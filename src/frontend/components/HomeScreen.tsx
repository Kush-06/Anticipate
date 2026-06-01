import { useNavigate } from "react-router";
import { useProfile } from "../context/ProfileContext";
import { useTimeline } from "../context/TimelineContext";
import { decoderDocuments } from "../data/decoder";
import { AnticipateLogo } from "./RobotIcon";
import { SageText } from "./SageText";
import { SageAvatar } from "./SageAvatar";
import { TopicIllustration } from "./TopicIllustration";

export function HomeScreen() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { tracks, unreadCount } = useTimeline();

  const firstName = profile?.firstName || "Alex";
  const lifeStage = profile?.lifeStage || "Just got my first job";
  const topWorry = profile?.topWorry || "payslip";
  const upcomingEvents = profile?.upcomingEvents || ["New job starting"];
  const confidenceScores = profile?.confidenceScores || { tax: 2, pensions: 1, budgeting: 3, investing: 1, contracts: 2 };

  // 1. Time of day greeting (sentence case as requested)
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "good evening";
    if (hour < 12) timeGreeting = "good morning";
    else if (hour < 17) timeGreeting = "good afternoon";
    
    return `${timeGreeting.charAt(0).toUpperCase()}${timeGreeting.slice(1)}, ${firstName}.`;
  };

  // 2. Personalized Sage Advice Bar Message
  const getSageHomeMessage = () => {
    const company = profile?.companyName || "your employer";
    if (upcomingEvents.includes("New job starting") || lifeStage === "Just got my first job") {
      return (
        <>
          Your first payslip from <span className="anp-sage-highlight">{company}</span> lands in 3 days. Let's walk through it now so you're prepared. It takes <span className="anp-sage-highlight">4 minutes</span>.
        </>
      );
    }
    if (upcomingEvents.includes("Moving out")) {
      return (
        <>
          Your moving out track starts soon. I've scheduled <span className="anp-sage-highlight">tenancy agreement checks</span> for this Thursday.
        </>
      );
    }
    if (confidenceScores.pensions <= 2) {
      return (
        <>
          Your pensions confidence score is low (<span className="anp-sage-highlight">{confidenceScores.pensions}/5</span>). Let's review auto-enrolment basics today.
        </>
      );
    }
    return (
      <>
        Let's work towards your goal of <span className="anp-sage-highlight">{profile?.sixMonthGoal || "saving regularly"}</span> today.
      </>
    );
  };

  // 3. Filter active timeline tracks for horizontal chips
  const activeTracks = tracks.filter((t) => t.id !== "tax-calendar");

  // 4. Personalized lessons selection
  const getPersonalizedLessons = () => {
    const lessons = [];
    if (topWorry === "payslip" || topWorry === "tax") {
      lessons.push({
        id: "payslip-lesson",
        title: "Reading your first payslip before it lands",
        icon: "🧾",
        path: "/decoder/view/first-payslip"
      });
    }
    if (confidenceScores.pensions <= 2) {
      lessons.push({
        id: "pensions-lesson",
        title: "Pensions explained simply",
        icon: "🏦",
        path: "/topic/pension/subtopic/auto-enrolment"
      });
    }
    if (upcomingEvents.includes("New job starting") || lifeStage === "Just got my first job") {
      lessons.push({
        id: "contracts-lesson",
        title: "Your employment contract decoded",
        icon: "💼",
        path: "/decoder/view/employment-contract"
      });
    }
    // Always include tax calendar
    lessons.push({
      id: "tax-calendar-lesson",
      title: "UK tax calendar, what matters this year",
      icon: "📅",
      path: "/topic/taxes/subtopic/tax-codes"
    });

    return lessons.slice(0, 3);
  };

  // 5. Relevant decoder documents based on upcomingEvents
  const getRelevantDocs = () => {
    const docs = [];
    if (upcomingEvents.includes("New job starting") || lifeStage === "Just got my first job") {
      const ec = decoderDocuments.find((d) => d.id === "employment-contract");
      const fp = decoderDocuments.find((d) => d.id === "first-payslip");
      if (ec) docs.push(ec);
      if (fp) docs.push(fp);
    }
    if (upcomingEvents.includes("Moving out")) {
      const ta = decoderDocuments.find((d) => d.id === "tenancy-agreement");
      if (ta) docs.push(ta);
    }
    // Fallback: show first-payslip if empty
    if (docs.length === 0) {
      const fp = decoderDocuments.find((d) => d.id === "first-payslip");
      if (fp) docs.push(fp);
    }
    return docs;
  };

  return (
    <div className="anp-home" style={{ background: "var(--p-bg)" }}>
      {/* Top Header */}
      <div 
        className="anp-doc-view__topbar" 
        style={{ 
          borderBottom: "none", 
          paddingBottom: "4px",
          paddingTop: "max(calc(16px * var(--d)), env(safe-area-inset-top))",
          background: "var(--p-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ flex: 1 }}>
          <AnticipateLogo />
          <h1 className="anp-home__title" style={{ fontSize: "20px", fontWeight: 600, color: "var(--p-ink)", marginBottom: "2px" }}>
            {getGreeting()}
          </h1>
          <p style={{ color: "var(--p-ink-2)", fontSize: "11px" }}>
            Let's get ahead of your money moments today
          </p>
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate("/notifications")}
          style={{
            position: "relative",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1.5px solid var(--p-line)",
            background: "var(--p-card)",
            boxShadow: "0px 2px 12px rgba(255,107,53,0.08)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px"
          }}
          aria-label="View notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span
              className="anp-notif-dot"
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                background: "var(--p-coral)",
                color: "#ffffff",
                fontSize: "9px",
                fontWeight: "bold",
                borderRadius: "50%",
                width: "16px",
                height: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid var(--p-card)"
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Scroll Container */}
      <div className="anp-home__scroll" style={{ paddingTop: "8px" }}>
        
        {/* Sage Message Bar Card */}
        <div 
          className="anp-sage-card" 
          style={{ 
            background: "#FFF0E8", 
            border: "none", 
            boxShadow: "0px 2px 12px rgba(255,107,53,0.08)", 
            borderRadius: "20px", 
            padding: "14px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "16px"
          }}
        >
          <SageAvatar size={48} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "10px", textTransform: "uppercase", color: "#FFB800", fontWeight: 600, letterSpacing: "0.06em" }}>
              Sage
            </span>
            <SageText style={{ fontSize: "13px", color: "#6B5744", lineHeight: 1.5 }}>
              {getSageHomeMessage()}
            </SageText>
          </div>
        </div>

        {/* 3. Horizontal Timeline Tracks Chips */}
        <div style={{ marginBottom: "20px" }}>
          <p className="anp-home__section-label">Active tracks</p>
          <div 
            style={{ 
              display: "flex", 
              gap: "8px", 
              overflowX: "auto", 
              paddingBottom: "8px",
              scrollbarWidth: "none"
            }}
          >
            {activeTracks.map((track, idx) => (
              <div
                key={track.id}
                onClick={() => navigate("/timeline")}
                className="anp-card-animate"
                style={{
                  background: "var(--p-card)",
                  boxShadow: "0px 2px 12px rgba(255,107,53,0.08)",
                  borderRadius: "20px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  animationDelay: `${Math.min(idx * 50, 300)}ms`
                }}
              >
                <TopicIllustration iconName={track.icon} size={32} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--p-ink)" }}>
                    {track.title.split(".")[0]}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--p-ink-2)" }}>
                    {track.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Personalized Lessons List */}
        <div style={{ marginBottom: "20px" }}>
          <p className="anp-home__section-label">Your lessons</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {getPersonalizedLessons().map((lesson, idx) => (
              <div
                key={lesson.id}
                onClick={() => navigate(lesson.path)}
                className="anp-card-animate"
                style={{
                  background: "var(--p-card)",
                  boxShadow: "0px 2px 12px rgba(255,107,53,0.08)",
                  borderRadius: "20px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  animationDelay: `${Math.min(idx * 50, 300)}ms`
                }}
              >
                <TopicIllustration iconName={lesson.icon} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 400, color: "var(--p-ink)", lineHeight: 1.3 }}>
                    {lesson.title}
                  </h4>
                </div>
                <span style={{ color: "var(--p-primary)", fontSize: "14px" }}>▶</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Horizontal Decoder Documents */}
        <div style={{ marginBottom: "16px" }}>
          <p className="anp-home__section-label">Related documents</p>
          <div 
            style={{ 
              display: "flex", 
              gap: "8px", 
              overflowX: "auto", 
              paddingBottom: "8px",
              scrollbarWidth: "none"
            }}
          >
            {getRelevantDocs().map((doc, idx) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/decoder/view/${doc.id}`)}
                className="anp-card-animate"
                style={{
                  background: "var(--p-card)",
                  boxShadow: "0px 2px 12px rgba(255,107,53,0.08)",
                  borderRadius: "20px",
                  padding: "16px",
                  width: "160px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  cursor: "pointer",
                  flexShrink: 0,
                  animationDelay: `${Math.min(idx * 50, 300)}ms`
                }}
              >
                <TopicIllustration iconName={doc.icon} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--p-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {doc.title}
                </span>
                <span style={{ fontSize: "11px", color: "var(--p-ink-2)", lineHeight: 1.3 }}>
                  {doc.subtitle}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
