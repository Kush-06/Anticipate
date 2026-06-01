import { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import type { UserProfile } from "../context/ProfileContext";
import { AppIcon } from "./AppIcon";

const LIFE_STAGES = [
  "Just got my first job",
  "Been working a few years",
  "Freelance / self-employed",
  "Student",
  "Career change",
];

const EVENTS = [
  "New job starting",
  "Moving out",
  "Going freelance",
  "Saving for something big",
];

const EMPLOYMENT_TYPES = [
  "Full time employed",
  "Part time employed",
  "Freelance / contractor",
  "Student",
];

const SIX_MONTH_GOALS = [
  "Actually saving regularly",
  "Build an emergency fund",
  "Understand my pay & tax",
  "Get on top of my pension",
  "Budget properly",
];

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background: i <= current ? "var(--p-coral)" : "var(--p-line)",
            transition: "all 0.25s",
          }}
        />
      ))}
    </div>
  );
}

export function OnboardingFlow() {
  const { completeOnboarding } = useProfile();
  const [step, setStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [lifeStage, setLifeStage] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [sixMonthGoal, setSixMonthGoal] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<string[]>([]);
  const [confidenceScores, setConfidenceScores] = useState({
    tax: 2, pensions: 1, budgeting: 3, investing: 1, contracts: 2,
  });

  const total = 4;

  const canAdvance = [
    firstName.trim().length > 0 && email.trim().length > 0,
    lifeStage.length > 0 && companyName.trim().length > 0,
    employmentType.length > 0 && sixMonthGoal.length > 0,
    true,
  ][step];

  const advance = () => {
    if (step < total - 1) { setStep((s) => s + 1); return; }
    const profile: UserProfile = {
      firstName: firstName.trim(),
      email: email.trim(),
      companyName: companyName.trim() || "your employer",
      lifeStage,
      employmentType,
      sixMonthGoal,
      upcomingEvents,
      confidenceScores,
    };
    completeOnboarding(profile);
  };

  const toggleEvent = (e: string) =>
    setUpcomingEvents((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );

  const setScore = (key: keyof typeof confidenceScores, val: number) =>
    setConfidenceScores((prev) => ({ ...prev, [key]: val }));

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--p-card)",
    border: "1.5px solid var(--p-line)",
    borderRadius: "var(--r-md)",
    padding: "12px 14px",
    fontSize: 16,
    color: "var(--p-ink)",
    outline: "none",
    fontFamily: "var(--p-sans)",
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    border: active ? "2px solid var(--p-coral)" : "1.5px solid var(--p-line)",
    background: active ? "var(--p-coral-tint)" : "var(--p-card)",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: active ? "var(--p-coral)" : "var(--p-ink)",
    cursor: "pointer",
    textAlign: "left" as const,
    fontFamily: "var(--p-sans)",
    transition: "all 0.15s",
  });

  const CONF_LABELS = [
    { key: "tax" as const,       label: "Tax & NI" },
    { key: "pensions" as const,  label: "Pensions" },
    { key: "budgeting" as const, label: "Budget & saving" },
    { key: "investing" as const, label: "Investing" },
    { key: "contracts" as const, label: "Contracts" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--p-bg)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "max(20px, env(safe-area-inset-top)) 20px 16px", flexShrink: 0 }}>
        <div style={{ fontFamily: "var(--p-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em", marginBottom: 20, textTransform: "lowercase" }}>
          anticipate.
        </div>
        <ProgressDots total={total} current={step} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px", scrollbarWidth: "none" }}>
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontFamily: "var(--p-display)", fontWeight: 600, fontSize: 26, letterSpacing: "-0.02em", margin: "4px 0 8px" }}>
              What's your name?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 11, fontFamily: "var(--p-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-ink-3)" }}>First name</label>
              <input style={inputStyle} placeholder="Maya" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 11, fontFamily: "var(--p-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-ink-3)" }}>Email</label>
              <input style={inputStyle} type="email" placeholder="maya@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontFamily: "var(--p-display)", fontWeight: 600, fontSize: 26, letterSpacing: "-0.02em", margin: "4px 0 8px" }}>
              What's your situation?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 11, fontFamily: "var(--p-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-ink-3)" }}>Company or employer</label>
              <input style={inputStyle} placeholder="e.g. Deloitte, NHS, Freelance" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 11, fontFamily: "var(--p-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-ink-3)" }}>Life stage</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {LIFE_STAGES.map((s) => (
                  <button key={s} style={chipStyle(lifeStage === s)} onClick={() => setLifeStage(s)}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontFamily: "var(--p-display)", fontWeight: 600, fontSize: 26, letterSpacing: "-0.02em", margin: "4px 0 8px" }}>
              Goals & employment
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 11, fontFamily: "var(--p-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-ink-3)" }}>Employment type</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {EMPLOYMENT_TYPES.map((s) => (
                  <button key={s} style={chipStyle(employmentType === s)} onClick={() => setEmploymentType(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 11, fontFamily: "var(--p-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-ink-3)" }}>6-month goal</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SIX_MONTH_GOALS.map((g) => (
                  <button key={g} style={chipStyle(sixMonthGoal === g)} onClick={() => setSixMonthGoal(g)}>{g}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 11, fontFamily: "var(--p-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-ink-3)" }}>What's coming up? (optional)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EVENTS.map((e) => (
                  <button key={e} style={{ ...chipStyle(upcomingEvents.includes(e)), padding: "8px 12px" }} onClick={() => toggleEvent(e)}>{e}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <h2 style={{ fontFamily: "var(--p-display)", fontWeight: 600, fontSize: 26, letterSpacing: "-0.02em", margin: "4px 0 4px" }}>
                How confident are you?
              </h2>
              <p style={{ fontSize: 13, color: "var(--p-ink-2)", lineHeight: 1.5 }}>Tap to rate 1–5. Be honest — Sage adapts.</p>
            </div>
            {CONF_LABELS.map(({ key, label }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <span style={{ fontSize: 13, color: "var(--p-ink-2)", flex: 1 }}>{label}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setScore(key, d)}
                      style={{
                        width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: d <= confidenceScores[key] ? "var(--p-plum)" : "var(--p-line)",
                        transition: "background 0.15s",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: "12px 20px max(20px, env(safe-area-inset-bottom)) 20px", flexShrink: 0, borderTop: "1px solid var(--p-line)" }}>
        <button
          disabled={!canAdvance}
          onClick={advance}
          style={{
            width: "100%", padding: "15px",
            background: canAdvance ? "var(--p-ink)" : "var(--p-line)",
            color: canAdvance ? "#fff" : "var(--p-ink-3)",
            border: "none", borderRadius: 14,
            fontFamily: "var(--p-display)", fontWeight: 600, fontSize: 15,
            cursor: canAdvance ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: canAdvance ? "0 4px 0 #08070a" : "none",
            transition: "all 0.15s",
          }}
        >
          {step < total - 1 ? "Continue" : "Let's go"}
          <AppIcon name="arrowRight" size={16} stroke={2} />
        </button>
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} style={{ width: "100%", marginTop: 10, padding: "10px", background: "transparent", border: "none", color: "var(--p-ink-3)", fontFamily: "var(--p-sans)", fontSize: 13, cursor: "pointer" }}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
