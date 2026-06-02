import { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import type { UserProfile } from "../context/ProfileContext";
import { AppIcon } from "./AppIcon";

// ProgressDots component for tracking progress steps
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

  // SECTION 1: ABOUT YOU
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [education, setEducation] = useState("");

  // SECTION 1 (CONT) & SECTION 2: LIVING SITUATION
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [livingSituation, setLivingSituation] = useState("");
  const [livingDuration, setLivingDuration] = useState("");
  const [planningToMove, setPlanningToMove] = useState("");

  // SECTION 3: FINANCIAL SITUATION
  const [salary, setSalary] = useState("");
  const [studentLoan, setStudentLoan] = useState("");
  const [hasDebt, setHasDebt] = useState("");
  const [financialProducts, setFinancialProducts] = useState<string[]>([]);

  // SECTION 4: FINANCIAL KNOWLEDGE
  const [understanding, setUnderstanding] = useState<Record<string, number>>({
    payslip: 3,
    tax: 3,
    budgeting: 3,
    pensions: 3,
    investing: 3,
    renting: 3,
    buyingHome: 3,
    selfAssessment: 3
  });
  const [interestedTopics, setInterestedTopics] = useState<string[]>([]);

  // SECTION 5: GOALS & MOTIVATIONS
  const [motivation, setMotivation] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<string[]>([]);
  const [usageFrequency, setUsageFrequency] = useState("");

  const total = 6;

  // Validation array for enabling step advancement
  const canAdvance = [
    // Step 0: Welcome & basic info
    firstName.trim().length > 0 && email.trim().length > 0 && ageRange.length > 0 && education.length > 0,
    // Step 1: Living & Employment
    employmentStatus.length > 0 && livingSituation.length > 0 && livingDuration.length > 0 && planningToMove.length > 0,
    // Step 2: Financial situation
    studentLoan.length > 0 && hasDebt.length > 0,
    // Step 3: Financial products
    financialProducts.length > 0,
    // Step 4: Financial knowledge
    interestedTopics.length >= 1 && interestedTopics.length <= 3,
    // Step 5: Goals & motivations
    motivation.length > 0 && usageFrequency.length > 0,
  ][step];

  const advance = () => {
    if (step < total - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Map new survey selections back to standard UserProfile fields for backward compatibility
    let mappedCompany = "your employer";
    if (employmentStatus === "Student") {
      mappedCompany = "University";
    } else if (employmentStatus === "Self-employed / Freelancer") {
      mappedCompany = "Freelance Client";
    } else if (employmentStatus === "Not currently employed") {
      mappedCompany = "Job Search";
    }

    let mappedLifeStage = employmentStatus;
    if (employmentStatus.includes("graduate")) {
      mappedLifeStage = "Recent graduate";
    }

    const mappedSixMonthGoal = interestedTopics.slice(0, 2).join(" & ") || "Personal finance confidence";

    const mappedConfidence = {
      tax: understanding.tax || 3,
      pensions: understanding.pensions || 3,
      budgeting: understanding.budgeting || 3,
      investing: understanding.investing || 3,
      contracts: understanding.payslip || 3,
    };

    const profile: UserProfile = {
      firstName: firstName.trim(),
      email: email.trim(),
      companyName: mappedCompany,
      lifeStage: mappedLifeStage,
      employmentType: employmentStatus,
      sixMonthGoal: mappedSixMonthGoal,
      upcomingEvents: upcomingEvents.filter((x) => x !== "None of the above"),
      confidenceScores: mappedConfidence,
      ageRange,
      education,
      livingSituation,
      livingDuration,
      planningToMove,
      salary,
      studentLoan,
      financialProducts,
      hasDebt,
      interestedTopics,
      motivation,
      usageFrequency,
    };

    completeOnboarding(profile);
  };

  // Selection toggle helpers
  const toggleFinancialProduct = (prod: string) => {
    setFinancialProducts((prev) => {
      if (prod === "None of the above") return ["None of the above"];
      const filtered = prev.filter((x) => x !== "None of the above");
      if (filtered.includes(prod)) {
        return filtered.filter((x) => x !== prod);
      } else {
        return [...filtered, prod];
      }
    });
  };

  const toggleInterestedTopic = (topic: string) => {
    setInterestedTopics((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((x) => x !== topic);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, topic];
    });
  };

  const toggleUpcomingEvent = (evt: string) => {
    setUpcomingEvents((prev) => {
      if (evt === "None of the above") return ["None of the above"];
      const filtered = prev.filter((x) => x !== "None of the above");
      if (filtered.includes(evt)) {
        return filtered.filter((x) => x !== evt);
      } else {
        return [...filtered, evt];
      }
    });
  };

  const setConfidenceScore = (key: string, val: number) => {
    setUnderstanding((prev) => ({ ...prev, [key]: val }));
  };

  // Reusable inline style objects
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--p-card)",
    border: "1.5px solid var(--p-line)",
    borderRadius: "var(--r-md)",
    padding: "12px 14px",
    fontSize: 15,
    color: "var(--p-ink)",
    outline: "none",
    fontFamily: "var(--p-sans)",
    transition: "border-color 0.15s",
  };

  const questionTitleStyle: React.CSSProperties = {
    fontFamily: "var(--p-sans)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--p-ink-3)",
    marginBottom: 8,
  };

  const rowChoiceStyle = (active: boolean): React.CSSProperties => ({
    width: "100%",
    border: active ? "2.2px solid var(--p-coral)" : "1.5px solid var(--p-line)",
    background: active ? "var(--p-coral-tint)" : "var(--p-card)",
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
    justifyContent: "space-between",
  });

  const grid2x2Style: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--p-bg)", overflow: "hidden" }}>
      {/* Onboarding Header */}
      <div style={{ padding: "max(24px, env(safe-area-inset-top)) 20px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--p-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", textTransform: "lowercase", color: "var(--p-ink)" }}>
            anticipate.
          </div>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--p-ink-3)" }}>
            Section {step === 0 ? 1 : step === 1 ? "1 & 2" : step === 2 || step === 3 ? 3 : step === 4 ? 4 : 5} of 5
          </div>
        </div>
        <ProgressDots total={total} current={step} />
      </div>

      {/* Main Survey Scroll Area */}
      <div className="anp-scroll" style={{ flex: 1, padding: "0 20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* STEP 0: ABOUT YOU (PART 1) */}
          {step === 0 && (
            <>
              <div>
                <h2 style={{ fontFamily: "var(--p-display)", fontWeight: 800, fontSize: 25, letterSpacing: "-0.025em", margin: "0 0 6px", color: "var(--p-ink)" }}>
                  Onboarding
                </h2>
                <p style={{ fontSize: 13, color: "var(--p-ink-2)", lineHeight: 1.45, margin: 0 }}>
                  Help us personalise your experience by completing this onboarding.
                </p>
              </div>

              {/* First Name Input */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your first name?</label>
                <input style={inputStyle} placeholder="e.g. Maya" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>

              {/* Email Input */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your email address?</label>
                <input style={inputStyle} type="email" placeholder="e.g. maya@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              {/* Age Range Grid */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your age range?</label>
                <div style={grid2x2Style}>
                  {["18-21", "22-25", "26-30", "30+"].map((age) => (
                    <button key={age} style={rowChoiceStyle(ageRange === age)} onClick={() => setAgeRange(age)}>
                      {age}
                      {ageRange === age && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Education Stack */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your highest level of education?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Currently at university",
                    "Undergraduate degree",
                    "Postgraduate degree",
                    "Did not attend university"
                  ].map((edu) => (
                    <button key={edu} style={rowChoiceStyle(education === edu)} onClick={() => setEducation(edu)}>
                      {edu}
                      {education === edu && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 1: ABOUT YOU & LIVING SITUATION */}
          {step === 1 && (
            <>
              {/* Employment Status */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your current employment status?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Student",
                    "Recent graduate (less than 1 year)",
                    "Employed (1-2 years)",
                    "Employed (3+ years)",
                    "Self-employed / Freelancer",
                    "Not currently employed"
                  ].map((emp) => (
                    <button key={emp} style={rowChoiceStyle(employmentStatus === emp)} onClick={() => setEmploymentStatus(emp)}>
                      {emp}
                      {employmentStatus === emp && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Living Situation */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your current living situation?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Living with family",
                    "Student accommodation",
                    "Renting (private)",
                    "Own my home",
                    "Other"
                  ].map((living) => (
                    <button key={living} style={rowChoiceStyle(livingSituation === living)} onClick={() => setLivingSituation(living)}>
                      {living}
                      {livingSituation === living && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Living Duration */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>How long have you been in your current living situation?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Less than 6 months",
                    "6 months to 1 year",
                    "1-3 years",
                    "3+ years"
                  ].map((dur) => (
                    <button key={dur} style={rowChoiceStyle(livingDuration === dur)} onClick={() => setLivingDuration(dur)}>
                      {dur}
                      {livingDuration === dur && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Planning to Move Grid */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>Are you planning to move in the next 6 months?</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {["Yes", "No", "Unsure"].map((move) => (
                    <button key={move} style={{ ...rowChoiceStyle(planningToMove === move), justifyContent: "center" }} onClick={() => setPlanningToMove(move)}>
                      {move}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 2: FINANCIAL SITUATION */}
          {step === 2 && (
            <>
              {/* Gross Salary */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your approximate annual gross salary? (optional)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Under £20,000",
                    "£20,000 - £30,000",
                    "£30,000 - £40,000",
                    "£40,000 - £50,000",
                    "Over £50,000",
                    "Not applicable / Prefer not to say"
                  ].map((sal) => (
                    <button key={sal} style={rowChoiceStyle(salary === sal)} onClick={() => setSalary(sal)}>
                      {sal}
                      {salary === sal && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Loan */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>Do you currently have a student loan?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Yes, it is being deducted from my salary",
                    "Yes, but I have not started repaying yet",
                    "No",
                    "Not sure"
                  ].map((loan) => (
                    <button key={loan} style={rowChoiceStyle(studentLoan === loan)} onClick={() => setStudentLoan(loan)}>
                      <span style={{ maxWidth: "88%" }}>{loan}</span>
                      {studentLoan === loan && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outstanding Debt */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>Do you have outstanding debt? <span style={{ textTransform: "lowercase", fontWeight: 400 }}>(excl. student loans & mortgages)</span></label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Yes",
                    "No",
                    "Prefer not to say"
                  ].map((debt) => (
                    <button key={debt} style={rowChoiceStyle(hasDebt === debt)} onClick={() => setHasDebt(debt)}>
                      {debt}
                      {hasDebt === debt && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 3: FINANCIAL PRODUCTS (MULTI-SELECT) */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={questionTitleStyle}>Do you currently have any of the following? (Select all that apply)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "A pension",
                  "A Stocks and Shares ISA",
                  "A Lifetime ISA (LISA)",
                  "A Help to Buy ISA",
                  "Premium Bonds",
                  "None of the above"
                ].map((prod) => {
                  const active = financialProducts.includes(prod);
                  return (
                    <button key={prod} style={rowChoiceStyle(active)} onClick={() => toggleFinancialProduct(prod)}>
                      {prod}
                      {active && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: FINANCIAL KNOWLEDGE */}
          {step === 4 && (
            <>
              {/* Understanding matrix */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={questionTitleStyle}>How would you rate your understanding of the following?</label>
                  <p style={{ fontSize: 12, color: "var(--p-ink-3)", margin: 0, fontFamily: "var(--p-sans)" }}>1 = No understanding · 5 = Very confident</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--p-card)", border: "1.5px solid var(--p-line)", borderRadius: 18, padding: "16px 14px" }}>
                  {[
                    { key: "payslip", label: "How your payslip works" },
                    { key: "tax", label: "Income tax and National Insurance" },
                    { key: "budgeting", label: "Budgeting and saving" },
                    { key: "pensions", label: "Pensions" },
                    { key: "investing", label: "Investing" },
                    { key: "renting", label: "Renting and tenancy rights" },
                    { key: "buyingHome", label: "Buying a home" },
                    { key: "selfAssessment", label: "Self-assessment tax returns" },
                  ].map(({ key, label }) => (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 10, borderBottom: "1px solid var(--p-line-2)", lastChild: { borderBottom: "none" } } as React.CSSProperties}>
                      <span style={{ fontSize: 13, color: "var(--p-ink-2)", fontWeight: 600 }}>{label}</span>
                      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", padding: "2px 0" }}>
                        {[1, 2, 3, 4, 5].map((rate) => {
                          const isSelected = rate <= understanding[key];
                          return (
                            <button
                              key={rate}
                              onClick={() => setConfidenceScore(key, rate)}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                border: "none",
                                cursor: "pointer",
                                background: isSelected ? "var(--p-coral)" : "var(--p-line)",
                                color: isSelected ? "#fff" : "var(--p-ink-2)",
                                fontWeight: 700,
                                fontSize: 13,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {rate}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Interested Topics */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>Which financial topics are you most interested in learning about? (Select up to 3)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    "Understanding my payslip",
                    "Tax and PAYE",
                    "Budgeting",
                    "Saving and ISAs",
                    "Pensions",
                    "Investing",
                    "Renting",
                    "Buying a home",
                    "Debt management",
                    "Self-employment / freelancing",
                    "Student finance"
                  ].map((topic) => {
                    const active = interestedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        style={{
                          ...rowChoiceStyle(active),
                          width: "auto",
                          padding: "8px 14px",
                          borderRadius: 20,
                          fontSize: 12,
                          gap: 6
                        }}
                        onClick={() => toggleInterestedTopic(topic)}
                      >
                        {topic}
                        {active && <AppIcon name="check" size={12} stroke={2.4} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* STEP 5: GOALS AND MOTIVATIONS */}
          {step === 5 && (
            <>
              {/* Primary Motivation */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What is your primary motivation for using Anticipate?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "I have a specific financial event coming up",
                    "I want to improve my general financial knowledge",
                    "I want to make sure I'm not missing out on money",
                    "I was recommended it by someone",
                    "Other"
                  ].map((mot) => (
                    <button key={mot} style={rowChoiceStyle(motivation === mot)} onClick={() => setMotivation(mot)}>
                      <span style={{ maxWidth: "88%" }}>{mot}</span>
                      {motivation === mot && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upcoming Life Events */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>What upcoming life events apply to you? (Select all that apply)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Starting a new job",
                    "Moving out for the first time",
                    "Moving in with a partner",
                    "Buying a property",
                    "Having a child",
                    "Changing jobs or receiving a pay rise",
                    "None of the above"
                  ].map((evt) => {
                    const active = upcomingEvents.includes(evt);
                    return (
                      <button key={evt} style={rowChoiceStyle(active)} onClick={() => toggleUpcomingEvent(evt)}>
                        {evt}
                        {active && <AppIcon name="check" size={14} stroke={2.4} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expected Usage Frequency */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={questionTitleStyle}>How often do you expect to use Anticipate?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Daily",
                    "A few times a week",
                    "Once a week",
                    "A few times a month",
                    "Occasionally as needed"
                  ].map((freq) => (
                    <button key={freq} style={rowChoiceStyle(usageFrequency === freq)} onClick={() => setUsageFrequency(freq)}>
                      {freq}
                      {usageFrequency === freq && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
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
            transition: "all 0.15s ease",
          }}
        >
          {step < total - 1 ? "Continue" : "Let's go"}
          <AppIcon name="arrowRight" size={16} stroke={2} />
        </button>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "10px",
              background: "transparent",
              border: "none",
              color: "var(--p-ink-3)",
              fontFamily: "var(--p-sans)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
