import { useProfile } from "../context/ProfileContext";
import { AnticipateLogo } from "./RobotIcon";
import { SageText } from "./SageText";
import { SageAvatar } from "./SageAvatar";

export function ProfileScreen() {
  const { profile, resetProfile } = useProfile();

  const firstName = profile?.firstName || "Alex";
  const email = profile?.email || "alex@example.com";
  const lifeStage = profile?.lifeStage || "Just got my first job";
  const upcomingEvents = profile?.upcomingEvents || ["New job starting"];
  const confidenceScores = profile?.confidenceScores || { tax: 2, pensions: 1, budgeting: 3, investing: 1, contracts: 2 };
  const employmentType = profile?.employmentType || "Full time employed";
  const sixMonthGoal = profile?.sixMonthGoal || "Actually saving regularly";

  const getSageProfileMessage = () => {
    const pensionsScore = confidenceScores.pensions;
    if (pensionsScore <= 2) {
      return (
        <>
          Hi {firstName}, your pension confidence is low (<span className="anp-sage-highlight">{pensionsScore}/5</span>). Let's work on auto-enrolment details this week.
        </>
      );
    }
    return (
      <>
        Hi {firstName}, your profile is set up. Let's focus on your goal of <span className="anp-sage-highlight">{sixMonthGoal}</span>.
      </>
    );
  };

  return (
    <div className="anp-doc-lib" style={{ background: "var(--p-bg)" }}>
      {/* Topbar */}
      <div 
        className="anp-doc-view__topbar" 
        style={{ 
          borderBottom: "none", 
          paddingBottom: "10px",
          paddingTop: "max(calc(16px * var(--d)), env(safe-area-inset-top))",
          background: "var(--p-bg)"
        }}
      >
        <div style={{ flex: 1 }}>
          <AnticipateLogo />
          <span className="anp-doc-view__title" style={{ fontSize: "18px", fontWeight: 600, color: "var(--p-ink)" }}>
            Your profile
          </span>
        </div>
      </div>

      {/* Profile content */}
      <div className="anp-doc-lib__scroll">
        {/* Sage Message Bar */}
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
            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#FFB800", fontWeight: 600, letterSpacing: "0.06em" }}>
              Sage check-in
            </div>
            <SageText trigger={profile}>{getSageProfileMessage()}</SageText>
          </div>
        </div>

        {/* 1. Personal Details Card */}
        <div className="anp-doc-card" style={{ display: "flex", flexDirection: "column", gap: "8px", cursor: "default" }}>
          <p className="anp-home__section-label" style={{ marginBottom: "2px" }}>Personal details</p>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <span style={{ color: "var(--p-ink-2)", fontSize: "12px" }}>First name</span>
            <span style={{ color: "var(--p-ink)", fontSize: "12px", fontWeight: 600 }}>{firstName}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderTop: "0.5px solid var(--p-line)", paddingTop: "8px" }}>
            <span style={{ color: "var(--p-ink-2)", fontSize: "12px" }}>Email</span>
            <span style={{ color: "var(--p-ink)", fontSize: "12px", fontWeight: 600 }}>{email}</span>
          </div>
        </div>

        {/* 2. Situation & Goals Card */}
        <div className="anp-doc-card" style={{ display: "flex", flexDirection: "column", gap: "8px", cursor: "default" }}>
          <p className="anp-home__section-label" style={{ marginBottom: "2px" }}>Situation & goals</p>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <span style={{ color: "var(--p-ink-2)", fontSize: "12px" }}>Life stage</span>
            <span style={{ color: "var(--p-ink)", fontSize: "12px", fontWeight: 600, textAlign: "right" }}>
              {lifeStage}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderTop: "0.5px solid var(--p-line)", paddingTop: "8px" }}>
            <span style={{ color: "var(--p-ink-2)", fontSize: "12px" }}>6-month goal</span>
            <span style={{ color: "var(--p-ink)", fontSize: "12px", fontWeight: 600, textAlign: "right" }}>
              {sixMonthGoal}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderTop: "0.5px solid var(--p-line)", paddingTop: "8px" }}>
            <span style={{ color: "var(--p-ink-2)", fontSize: "12px" }}>Employment type</span>
            <span style={{ color: "var(--p-ink)", fontSize: "12px", fontWeight: 600, textAlign: "right" }}>
              {employmentType}
            </span>
          </div>
        </div>

        {/* 3. Upcoming Milestones */}
        <div className="anp-doc-card" style={{ display: "flex", flexDirection: "column", gap: "8px", cursor: "default" }}>
          <p className="anp-home__section-label" style={{ marginBottom: "2px" }}>Upcoming milestones</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            {upcomingEvents.map((evt, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  fontSize: "12px", 
                  color: "var(--p-ink)",
                  borderTop: idx > 0 ? "0.5px solid var(--p-line)" : "none",
                  paddingTop: idx > 0 ? "6px" : "0"
                }}
              >
                <span>📅</span>
                <span>{evt}</span>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <span style={{ color: "var(--p-ink-3)", fontSize: "12px" }}>No upcoming events scheduled.</span>
            )}
          </div>
        </div>

        {/* 4. Confidence Ratings Card */}
        <div className="anp-doc-card" style={{ display: "flex", flexDirection: "column", gap: "8px", cursor: "default" }}>
          <p className="anp-home__section-label" style={{ marginBottom: "2px" }}>Confidence ratings</p>
          {[
            { label: "Tax & NI", score: confidenceScores.tax },
            { label: "Pensions", score: confidenceScores.pensions },
            { label: "Budget & saving", score: confidenceScores.budgeting },
            { label: "Investing", score: confidenceScores.investing },
            { label: "Contracts & job info", score: confidenceScores.contracts }
          ].map((item, idx) => (
            <div 
              key={idx} 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                width: "100%",
                borderTop: idx > 0 ? "0.5px solid var(--p-line)" : "none",
                paddingTop: idx > 0 ? "6px" : "0"
              }}
            >
              <span style={{ color: "var(--p-ink-2)", fontSize: "12px" }}>{item.label}</span>
              
              {/* Rating score represented by dots */}
              <div style={{ display: "flex", gap: "4px" }}>
                {[1, 2, 3, 4, 5].map((dot) => (
                  <span
                    key={dot}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: dot <= item.score ? "var(--p-plum)" : "var(--p-line)"
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 5. Reset Profile Button */}
        <div style={{ marginTop: "10px" }}>
          <button
            className="anp-onboard__btn anp-onboard__btn--outlined"
            onClick={resetProfile}
            style={{ 
              borderColor: "var(--p-line)", 
              color: "var(--p-coral)",
              fontSize: "13px"
            }}
          >
            Reset my onboarding profile
          </button>
        </div>

      </div>
    </div>
  );
}
