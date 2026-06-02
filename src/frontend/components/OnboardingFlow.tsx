import { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import type { UserProfile } from "../context/ProfileContext";
import { AppIcon } from "./AppIcon";
import { SageAvatar } from "./SageAvatar";

// A list of 3-4 specific lesson cards with their personal reasons, picked dynamically
function getRecommendedSummary(
  lifeStage: string,
  livingSituation: string,
  upcomingEvents: string[],
  moneyWorry: string,
  confidence: Record<string, number>,
  studentLoan: string
) {
  const selected: { title: string; desc: string; topicId: string; subTopicId: string; icon: string }[] = [];

  // 1. Tax confusion / low tax confidence -> Payslip lesson
  if (moneyWorry === "I don't really understand how tax works" || confidence.payslip <= 2) {
    selected.push({
      title: "Decoding your payslip",
      desc: "You said tax confuses you. Let's make sense of your tax codes and deductions first.",
      topicId: "starting-work",
      subTopicId: "lesson-01",
      icon: "💼"
    });
  } else if (lifeStage === "I've just started my first job" || upcomingEvents.includes("Starting a new job soon")) {
    selected.push({
      title: "Decoding your payslip",
      desc: "Since you're starting a new job, let's make sure you understand your very first paycheck.",
      topicId: "starting-work",
      subTopicId: "lesson-01",
      icon: "💼"
    });
  }

  // 2. Budgeting rule / Nothing left -> 50/30/20 Rule
  if (moneyWorry === "I never seem to have anything left at the end of the month" || confidence.budgeting <= 2) {
    selected.push({
      title: "The 50/30/20 Rule",
      desc: "A simple, stress-free way to split your income and make sure you have enough left for the fun stuff.",
      topicId: "starting-work",
      subTopicId: "lesson-03",
      icon: "📊"
    });
  }

  // 3. Debt payoff strategies -> Debt Spectrum
  if (moneyWorry === "I've got debt I'm trying to deal with" || lifeStage === "I'm not working at the moment") {
    selected.push({
      title: "The Debt Spectrum",
      desc: "Dealing with debt is exhausting. Let's review payoff strategies and how to get free help.",
      topicId: "debt",
      subTopicId: "lesson-29",
      icon: "📉"
    });
  }

  // 4. Renting -> Deposits & Guarantors
  if (livingSituation?.includes("Renting — just moved in") || upcomingEvents.includes("Moving out for the first time")) {
    selected.push({
      title: "Deposits & Guarantors",
      desc: "Since you're renting soon, let's make sure you protect your deposit and understand your contract.",
      topicId: "renting",
      subTopicId: "lesson-05",
      icon: "🔑"
    });
  }

  // 5. Mortgages / Buying -> Mortgages 101
  if (livingSituation?.includes("Renting — been here a while") || upcomingEvents.includes("Thinking about buying a place")) {
    selected.push({
      title: "Mortgages 101",
      desc: "You want to buy a place. Let's demystify how much you can borrow and interest tiers.",
      topicId: "buying-a-home",
      subTopicId: "lesson-08",
      icon: "🏡"
    });
  }

  // 6. Student Loan -> Student Loan Repayments
  if (studentLoan === "Yes and it comes off my payslip" || studentLoan === "I'm not sure actually") {
    selected.push({
      title: "Student Loan Repayments",
      desc: "Let's review why this functions more like an extra graduate tax than a traditional debt.",
      topicId: "starting-work",
      subTopicId: "lesson-04",
      icon: "🎓"
    });
  }

  // 7. Pension Auto-Enrolment -> Auto-Enrolment Pension
  if (moneyWorry === "I have no idea what my pension is doing" || confidence.pensions <= 2) {
    selected.push({
      title: "The Auto-Enrolment Pension",
      desc: "Workplace pensions can be confusing, but you're turning down free match money if you opt out.",
      topicId: "starting-work",
      subTopicId: "lesson-02",
      icon: "🏦"
    });
  }

  // 8. Investing 101 -> Stocks & Shares ISAs
  if (moneyWorry === "I want to start investing but don't know where to begin" || confidence.investing <= 2) {
    selected.push({
      title: "Stocks & Shares ISAs",
      desc: "You want to start investing. Let's learn how to grow your wealth tax-free with index funds.",
      topicId: "investing-101",
      subTopicId: "lesson-43",
      icon: "📈"
    });
  }

  // 9. Joint Accounts / Relationship Money -> The Money Talk
  if (upcomingEvents.includes("Moving in with a partner")) {
    selected.push({
      title: "The Money Talk",
      desc: "Moving in is exciting! Let's get on the same page about bills and joint accounts early.",
      topicId: "relationships",
      subTopicId: "lesson-12",
      icon: "💑"
    });
  }

  // 10. Maternity & Paternity Pay -> Maternity & Paternity Pay
  if (upcomingEvents.includes("Having a baby or just had one")) {
    selected.push({
      title: "Maternity & Paternity Pay",
      desc: "Let's walk through your legal rights to statutory pay and what allowances you can claim.",
      topicId: "family",
      subTopicId: "lesson-15",
      icon: "👶"
    });
  }

  // 11. Salary Negotiation -> Salary Negotiation
  if (upcomingEvents.includes("Getting a pay rise or changing jobs")) {
    selected.push({
      title: "Salary Negotiation",
      desc: "Prepare a killer business case to ask for what you're worth and get that raise.",
      topicId: "career",
      subTopicId: "lesson-18",
      icon: "📈"
    });
  }

  // 12. Car Finance -> Car Finance Demystified
  if (upcomingEvents.includes("Buying a car")) {
    selected.push({
      title: "Car Finance Demystified",
      desc: "Buying a car is a major purchase. Let's look at PCP, HP, and the true cost of driving.",
      topicId: "cars",
      subTopicId: "lesson-24",
      icon: "🚗"
    });
  }

  // Fallbacks: If we have fewer than 3 cards, let's add foundational building blocks
  if (selected.length < 3) {
    if (!selected.some((s) => s.subTopicId === "lesson-37")) {
      selected.push({
        title: "The Emergency Fund",
        desc: "Your financial safety net. Let's build a buffer so unexpected bills don't throw you off.",
        topicId: "foundations",
        subTopicId: "lesson-37",
        icon: "💡"
      });
    }
  }
  if (selected.length < 3) {
    if (!selected.some((s) => s.subTopicId === "lesson-36")) {
      selected.push({
        title: "The Power of Compound Interest",
        desc: "The ultimate wealth builder. See how small savings grow exponentially over time.",
        topicId: "foundations",
        subTopicId: "lesson-36",
        icon: "💡"
      });
    }
  }

  // Limit to at most 4 items
  return selected.slice(0, 4);
}

export function OnboardingFlow() {
  const { completeOnboarding } = useProfile();
  const [step, setStep] = useState(0);

  // States
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [lifeStage, setLifeStage] = useState("");
  const [livingSituation, setLivingSituation] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<string[]>([]);
  const [moneyWorry, setMoneyWorry] = useState("");
  const [confidence, setConfidence] = useState<Record<string, number>>({
    payslip: 3,
    budgeting: 3,
    pensions: 3,
    investing: 3,
    renting: 3
  });
  const [studentLoan, setStudentLoan] = useState("");
  const [salaryInput, setSalaryInput] = useState("");

  const totalSteps = 9; // Welcome (0), Q1-Q7 (1-7), Summary (8)

  const advance = () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Map selections back to UserProfile fields
    const cleanSalary = salaryInput.trim().replace(/[^0-9.]/g, "") || "28000";
    const mappedCompany = upcomingEvents.includes("Starting a new job soon") ? "your new employer" : "your employer";

    const profile: UserProfile = {
      firstName: firstName.trim() || "Maya",
      email: email.trim() || "maya@example.com",
      companyName: mappedCompany,
      lifeStage: lifeStage,
      employmentType: lifeStage,
      sixMonthGoal: moneyWorry || "Personal finance confidence",
      upcomingEvents: upcomingEvents.filter((x) => x !== "None of these right now"),
      confidenceScores: {
        tax: confidence.payslip,
        pensions: confidence.pensions,
        budgeting: confidence.budgeting,
        investing: confidence.investing,
        contracts: confidence.renting
      },
      livingSituation: livingSituation,
      planningToMove: upcomingEvents.includes("Moving out for the first time") ? "Yes" : "No",
      salary: cleanSalary,
      studentLoan: studentLoan,
      hasDebt: moneyWorry === "I've got debt I'm trying to deal with" ? "Yes" : "No",
      interestedTopics: [moneyWorry],
      motivation: "Improve general knowledge",
      usageFrequency: "A few times a week"
    };

    completeOnboarding(profile);
  };

  const handleSelectSingle = (setter: (v: string) => void, val: string) => {
    setter(val);
    setTimeout(() => {
      setStep((s) => s + 1);
    }, 280);
  };

  const toggleUpcomingEvent = (evt: string) => {
    setUpcomingEvents((prev) => {
      if (evt === "None of these right now") return ["None of these right now"];
      const filtered = prev.filter((x) => x !== "None of these right now");
      if (filtered.includes(evt)) {
        return filtered.filter((x) => x !== evt);
      } else {
        return [...filtered, evt];
      }
    });
  };

  // Validators
  const canAdvance = [
    // Welcome / Info
    firstName.trim().length > 0 && email.trim().length > 0,
    // Q1
    lifeStage.length > 0,
    // Q2
    livingSituation.length > 0,
    // Q3 (Upcoming Events)
    upcomingEvents.length > 0,
    // Q4 (Money Worry)
    moneyWorry.length > 0,
    // Q5 (Confidence check)
    true, // always valid to continue
    // Q6 (Student Loan)
    studentLoan.length > 0,
    // Q7 (Salary)
    true, // optional, can skip
    // Summary
    true
  ][step];

  // Styling helpers
  const questionTitleStyle: React.CSSProperties = {
    fontFamily: "var(--p-sans)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--p-ink-3)",
    marginBottom: 8
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#fff",
    border: "1.5px solid var(--p-line)",
    borderRadius: "var(--r-md)",
    padding: "12px 14px",
    fontSize: 15,
    color: "var(--p-ink)",
    outline: "none",
    fontFamily: "var(--p-sans)",
    transition: "border-color 0.15s"
  };

  const rowChoiceStyle = (active: boolean): React.CSSProperties => ({
    width: "100%",
    border: active ? "2.2px solid var(--p-coral)" : "1.5px solid var(--p-line)",
    background: active ? "var(--p-coral-tint)" : "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: active ? "var(--p-coral)" : "var(--p-ink)",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "var(--p-sans)",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  });

  // Get recommendations for closing slide
  const recSummary = getRecommendedSummary(
    lifeStage,
    livingSituation,
    upcomingEvents,
    moneyWorry,
    confidence,
    studentLoan
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--p-bg)", overflow: "hidden" }}>
      {/* Onboarding Header */}
      <div style={{ padding: "max(24px, env(safe-area-inset-top)) 20px 16px", flexShrink: 0, borderBottom: "1px solid var(--p-line-2)", background: "var(--p-bg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--p-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", textTransform: "lowercase", color: "var(--p-ink)" }}>
            anticipate.
          </div>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 9.5, letterSpacing: "0.02em", color: "var(--p-ink-3)", textTransform: "uppercase" }}>
            {step === 0 ? "Welcome" : step === 8 ? "Tailored plan" : `Question ${step} of 7`}
          </div>
        </div>
        {/* Step indicator bar */}
        <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 8 }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? "var(--p-coral)" : "var(--p-line)",
                transition: "all 0.25s"
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Conversation Scroll Area */}
      <div className="anp-scroll" style={{ flex: 1, padding: "20px 20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* SAGE CHAT BUBBLE (Steps 0 to 7) */}
          {step < 8 && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
              <SageAvatar size={42} />
              <div style={{
                background: "#fff",
                border: "1.5px solid var(--p-line)",
                borderRadius: "0px 16px 16px 16px",
                padding: "14px 16px",
                fontSize: 14.5,
                lineHeight: 1.45,
                color: "var(--p-ink)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                flex: 1,
                fontFamily: "var(--p-sans)"
              }}>
                {step === 0 && "Before we get started, I want to make sure everything I show you is actually relevant to you. I'm going to ask you a few things — no wrong answers, and you can update any of this later."}
                {step === 1 && "So first things first — what best describes where you are right now?"}
                {step === 2 && "Where are you living at the moment?"}
                {step === 3 && "Is anything big coming up for you in the next few months? Pick everything that applies."}
                {step === 4 && "Be honest — what's the thing that stresses you out most about money right now?"}
                {step === 5 && "Quick one — how would you rate yourself on each of these? Be honest, this just helps me skip stuff you already know."}
                {step === 6 && "Did you go to university and take out a student loan?"}
                {step === 7 && "Last one and completely optional — if you drop in your rough take home salary, I can make the lessons use your actual numbers instead of hypotheticals. So instead of 'imagine you earn £30,000' I'll just say what you actually take home."}
              </div>
            </div>
          )}

          {/* STEP 0: Welcome & Profile Info */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your first name?</label>
                <input style={inputStyle} placeholder="e.g. Maya" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your email address?</label>
                <input style={inputStyle} type="email" placeholder="e.g. maya@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 1: Q1 - Life Stage */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "I'm still at university", val: "I'm still at university" },
                { label: "I've just started my first job", val: "I've just started my first job" },
                { label: "I've been working for a year or two", val: "I've been working for a year or two" },
                { label: "I'm self employed or doing freelance work", val: "I'm self employed or doing freelance work" },
                { label: "I'm not working at the moment", val: "I'm not working at the moment" }
              ].map((opt) => (
                <button key={opt.val} style={rowChoiceStyle(lifeStage === opt.val)} onClick={() => handleSelectSingle(setLifeStage, opt.val)}>
                  <span>{opt.label}</span>
                  {lifeStage === opt.val && <AppIcon name="check" size={14} stroke={2.4} />}
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: Q2 - Living Situation */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "At home with family", val: "At home with family" },
                { label: "Renting — just moved in or about to", val: "Renting — just moved in or about to" },
                { label: "Renting — been here a while", val: "Renting — been here a while" },
                { label: "I own my place", val: "I own my place" },
                { label: "Student accommodation", val: "Student accommodation" }
              ].map((opt) => (
                <button key={opt.val} style={rowChoiceStyle(livingSituation === opt.val)} onClick={() => handleSelectSingle(setLivingSituation, opt.val)}>
                  <span>{opt.label}</span>
                  {livingSituation === opt.val && <AppIcon name="check" size={14} stroke={2.4} />}
                </button>
              ))}
            </div>
          )}

          {/* STEP 3: Q3 - Upcoming Events (Multi-Select) */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Starting a new job soon",
                "Moving out for the first time",
                "Thinking about buying a place",
                "Moving in with a partner",
                "Having a baby or just had one",
                "Getting a pay rise or changing jobs",
                "Buying a car",
                "None of these right now"
              ].map((evt) => {
                const active = upcomingEvents.includes(evt);
                return (
                  <button key={evt} style={rowChoiceStyle(active)} onClick={() => toggleUpcomingEvent(evt)}>
                    <span>{evt}</span>
                    {active && <AppIcon name="check" size={14} stroke={2.4} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 4: Q4 - Money Worry */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "I don't really understand how tax works", val: "I don't really understand how tax works" },
                { label: "I never seem to have anything left at the end of the month", val: "I never seem to have anything left at the end of the month" },
                { label: "I've got debt I'm trying to deal with", val: "I've got debt I'm trying to deal with" },
                { label: "I don't know if I'm saving enough or doing it right", val: "I don't know if I'm saving enough or doing it right" },
                { label: "I have no idea what my pension is doing", val: "I have no idea what my pension is doing" },
                { label: "I want to start investing but don't know where to begin", val: "I want to start investing but don't know where to begin" },
                { label: "I feel like I'm missing out on money the government owes me", val: "I feel like I'm missing out on money the government owes me" },
                { label: "Honestly I don't know what I don't know", val: "Honestly I don't know what I don't know" }
              ].map((opt) => (
                <button key={opt.val} style={rowChoiceStyle(moneyWorry === opt.val)} onClick={() => handleSelectSingle(setMoneyWorry, opt.val)}>
                  <span style={{ maxWidth: "88%" }}>{opt.label}</span>
                  {moneyWorry === opt.val && <AppIcon name="check" size={14} stroke={2.4} />}
                </button>
              ))}
            </div>
          )}

          {/* STEP 5: Q5 - Confidence Matrix */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { key: "payslip", label: "Understanding your payslip and tax" },
                { key: "budgeting", label: "Budgeting and managing money day to day" },
                { key: "pensions", label: "Pensions and retirement saving" },
                { key: "investing", label: "Investing and ISAs" },
                { key: "renting", label: "Your rights as a renter or buyer" }
              ].map(({ key, label }) => {
                const rating = confidence[key] || 3;
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: "1.5px solid var(--p-line)", borderRadius: 14, padding: "12px 14px" }}>
                    <span style={{ fontSize: 13, color: "var(--p-ink-2)", fontWeight: 600, fontFamily: "var(--p-sans)" }}>{label}</span>
                    <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 4 }}>
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isSelected = val <= rating;
                        const isExact = val === rating;
                        return (
                          <button
                            key={val}
                            onClick={() => setConfidence((prev) => ({ ...prev, [key]: val }))}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              border: "none",
                              cursor: "pointer",
                              background: isExact ? "var(--p-coral)" : isSelected ? "var(--p-coral-tint)" : "var(--p-line)",
                              color: isExact ? "#fff" : "var(--p-ink-2)",
                              fontWeight: 700,
                              fontSize: 12,
                              fontFamily: "var(--p-mono)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.1s ease"
                            }}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 6: Q6 - Student Loan */}
          {step === 6 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Yes and it comes off my payslip", val: "Yes and it comes off my payslip" },
                { label: "Yes but I haven't started repaying yet", val: "Yes but I haven't started repaying yet" },
                { label: "No I didn't take one out", val: "No I didn't take one out" },
                { label: "I'm not sure actually", val: "I'm not sure actually" }
              ].map((opt) => (
                <button key={opt.val} style={rowChoiceStyle(studentLoan === opt.val)} onClick={() => handleSelectSingle(setStudentLoan, opt.val)}>
                  <span>{opt.label}</span>
                  {studentLoan === opt.val && <AppIcon name="check" size={14} stroke={2.4} />}
                </button>
              ))}
            </div>
          )}

          {/* STEP 7: Q7 - Salary Input */}
          {step === 7 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>Take home salary (optional)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: 12, color: "var(--p-ink-3)", fontWeight: 600, fontSize: 16 }}>£</span>
                  <input
                    style={{ ...inputStyle, paddingLeft: 28 }}
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 28,000"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: CLOSING MESSAGE / PERSOMALISATION SUMMARY */}
          {step === 8 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <SageAvatar size={46} />
                <div style={{
                  background: "#fff",
                  border: "1.5px solid var(--p-line)",
                  borderRadius: "0px 16px 16px 16px",
                  padding: "14px 16px",
                  fontSize: 14.5,
                  lineHeight: 1.45,
                  color: "var(--p-ink)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  flex: 1,
                  fontFamily: "var(--p-sans)"
                }}>
                  Ok <b>{firstName || "Maya"}</b>. Based on what you've told me, here's where I'm starting you off.
                </div>
              </div>

              {/* List of recommended cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
                {recSummary.map((card, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1.5px solid var(--p-line)",
                      borderRadius: 18,
                      padding: "16px 16px",
                      display: "flex",
                      gap: 14,
                      alignItems: "flex-start",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: "var(--p-coral-tint)",
                        color: "var(--p-coral)",
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {card.icon}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--p-ink)", fontFamily: "var(--p-sans)" }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--p-ink-2)", lineHeight: 1.4, fontFamily: "var(--p-sans)" }}>
                        {card.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Onboarding Bottom Action Bar */}
      <div style={{ padding: "12px 20px max(20px, env(safe-area-inset-bottom)) 20px", flexShrink: 0, borderTop: "1px solid var(--p-line)", background: "var(--p-card)" }}>
        <button
          disabled={!canAdvance}
          onClick={advance}
          style={{
            width: "100%",
            padding: "15px",
            background: canAdvance ? "var(--p-ink)" : "var(--p-line)",
            color: canAdvance ? "#fff" : "var(--p-ink-3)",
            border: "none",
            borderRadius: 14,
            fontFamily: "var(--p-display)",
            fontWeight: 600,
            fontSize: 15,
            cursor: canAdvance ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: canAdvance ? "0 4px 0 #08070a" : "none",
            transition: "all 0.15s ease"
          }}
        >
          {step === 0 ? "Let's start" : step === 8 ? "Let's go" : "Continue"}
          <AppIcon name="arrowRight" size={16} stroke={2} />
        </button>
        
        {/* Back and Skip buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
          {step > 0 && step < 8 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                color: "var(--p-ink-3)",
                fontFamily: "var(--p-sans)",
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              Back
            </button>
          )}
          {step === 7 && (
            <button
              onClick={advance}
              style={{
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                color: "var(--p-coral)",
                fontFamily: "var(--p-sans)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
