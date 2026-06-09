import { useNavigate } from "react-router";
import { useProfile } from "../context/ProfileContext";
import { SageAvatar } from "./SageAvatar";
import { AppIcon } from "./AppIcon";
import { TopBar } from "./TopBar";

const MILESTONE_ICON: Record<string, React.ComponentProps<typeof AppIcon>["name"]> = {
  "New job starting":    "briefcase",
  "Moving out":          "house",
  "Going freelance":     "briefcase",
  "Saving for something big": "piggy",
};

const CONF_LABELS = [
  { key: "tax",       label: "Tax & NI" },
  { key: "pensions",  label: "Pensions" },
  { key: "budgeting", label: "Budget & saving" },
  { key: "investing", label: "Investing" },
  { key: "contracts", label: "Contracts & job info" },
] as const;

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: 14, padding: "calc(11px * var(--d)) 0", borderTop: "1px solid var(--p-line)",
    }}>
      <span style={{ fontSize: "calc(12.5px * var(--d))", color: "var(--p-ink-2)", flexShrink: 0 }}>{label}</span>
      <span style={{
        fontFamily: "var(--p-display)", fontWeight: 600, fontSize: "calc(13px * var(--d))",
        letterSpacing: "-0.01em", color: "var(--p-ink)", textAlign: "right",
      }}>{value}</span>
    </div>
  );
}

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--p-card)", border: "1px solid var(--p-line)",
      borderRadius: "calc(18px * var(--d))", padding: "0 calc(16px * var(--d))",
      overflow: "hidden",
    }}>
      <div style={{
        fontFamily: "var(--p-mono)", fontSize: "calc(9.5px * var(--d))",
        letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--p-ink-3)",
        padding: "calc(12px * var(--d)) 0 calc(6px * var(--d))",
        borderBottom: "1px solid var(--p-line)",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const { profile, logout } = useProfile();

  const firstName    = profile?.firstName    ?? "you";
  const email        = profile?.email        ?? "—";
  const lifeStage    = profile?.lifeStage    ?? "—";
  const company      = profile?.companyName  ?? "—";
  const sixMonthGoal = profile?.sixMonthGoal ?? "—";
  const employment   = profile?.employmentType ?? "—";
  const events       = profile?.upcomingEvents ?? [];
  const cs           = profile?.confidenceScores ?? { tax: 2, pensions: 1, budgeting: 3, investing: 1, contracts: 2 };

  return (
    <div className="anp-app" style={{ background: "var(--p-bg)" }}>
      <TopBar showNotifications={false} />

      <div className="av-greet" style={{ paddingBottom: "calc(12px * var(--d))" }}>
        <h1>Your profile</h1>
      </div>

      <div className="anp-scroll">
        <div style={{ padding: "0 calc(20px * var(--d)) calc(8px * var(--d))", display: "flex", flexDirection: "column", gap: "calc(14px * var(--d))" }}>

          {/* Dark identity card */}
          <div style={{
            display: "grid", gridTemplateColumns: "auto 1fr", gap: "calc(14px * var(--d))",
            alignItems: "center", background: "var(--p-ink)", color: "#fff",
            borderRadius: "calc(20px * var(--d))", padding: "calc(16px * var(--d))",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", inset: "-24px -30px auto auto", width: 150, height: 150, background: "radial-gradient(circle, rgba(108,63,162,0.45) 0%, transparent 62%)", pointerEvents: "none" }} />
            <div style={{
              width: "calc(54px * var(--d))", height: "calc(54px * var(--d))", borderRadius: "50%",
              background: "var(--p-plum)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--p-display)", fontWeight: 600, fontSize: "calc(22px * var(--d))", position: "relative", zIndex: 1,
            }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: "var(--p-display)", fontWeight: 600, fontSize: "calc(20px * var(--d))", letterSpacing: "-0.02em" }}>
                {firstName}
              </div>
              <div style={{ fontFamily: "var(--p-mono)", fontSize: "calc(10px * var(--d))", letterSpacing: "0.04em", color: "rgba(255,255,255,0.6)", marginTop: 4, textTransform: "uppercase" }}>
                Graduate · {company}
              </div>
            </div>
          </div>

          {/* Sage check-in */}
          <div className="av-sage" style={{ margin: 0 }}>
            <div className="av-sage__row">
              <SageAvatar size={46} />
              <div>
                <div className="av-sage__eyebrow">Sage check-in</div>
                <div className="av-sage__text">
                  Hi {firstName}, your pension confidence is still low (<b>{cs.pensions}/5</b>). Let's work through auto-enrolment this week.
                </div>
                <button className="av-sage__cta" onClick={() => navigate("/learn")}>
                  Open pension lessons <AppIcon name="arrowRight" size={13} stroke={2} />
                </button>
              </div>
            </div>
          </div>

          {/* Personal details */}
          <SectionCard label="Personal details">
            <KV label="First name" value={firstName} />
            <KV label="Email" value={email} />
          </SectionCard>

          {/* Situation & goals */}
          <SectionCard label="Situation & goals">
            <KV label="Life stage" value={lifeStage} />
            <KV label="6-month goal" value={sixMonthGoal} />
            <KV label="Employment" value={employment} />
          </SectionCard>

          {/* Upcoming milestones */}
          <SectionCard label="Upcoming milestones">
            {events.length === 0 ? (
              <div style={{ padding: "calc(11px * var(--d)) 0", fontSize: "calc(12px * var(--d))", color: "var(--p-ink-3)" }}>
                No upcoming events
              </div>
            ) : (
              events.map((evt, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto",
                  gap: "calc(12px * var(--d))", alignItems: "center",
                  padding: "calc(11px * var(--d)) 0", borderTop: i === 0 ? "none" : "1px solid var(--p-line)",
                }}>
                  <span style={{ color: "var(--p-coral)", display: "flex" }}>
                    <AppIcon name={MILESTONE_ICON[evt] ?? "calendar"} size={18} />
                  </span>
                  <span style={{ fontFamily: "var(--p-sans)", fontWeight: 600, fontSize: "calc(13px * var(--d))", color: "var(--p-ink)" }}>
                    {evt}
                  </span>
                </div>
              ))
            )}
          </SectionCard>

          {/* Confidence ratings */}
          <SectionCard label="Confidence ratings">
            {CONF_LABELS.map(({ key, label }, i) => (
              <div key={key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                padding: "calc(11px * var(--d)) 0", borderTop: i === 0 ? "none" : "1px solid var(--p-line)",
              }}>
                <span style={{ fontSize: "calc(12.5px * var(--d))", color: "var(--p-ink-2)" }}>{label}</span>
                <div style={{ display: "flex", gap: "calc(5px * var(--d))" }}>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <span key={d} style={{
                      width: "calc(8px * var(--d))", height: "calc(8px * var(--d))",
                      borderRadius: "50%",
                      background: d <= cs[key] ? "var(--p-plum)" : "var(--p-line)",
                      display: "block",
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </SectionCard>
        </div>

        {/* Log out */}
        <button
          onClick={logout}
          style={{
            width: "calc(100% - calc(40px * var(--d)))", margin: "calc(6px * var(--d)) calc(20px * var(--d)) 0",
            background: "transparent", border: "1px solid var(--p-line)", color: "var(--p-ink-2)",
            fontFamily: "var(--p-sans)", fontWeight: 600, fontSize: "calc(13px * var(--d))",
            padding: "calc(13px * var(--d))", borderRadius: "calc(14px * var(--d))", cursor: "pointer",
          }}
        >
          Log out
        </button>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
