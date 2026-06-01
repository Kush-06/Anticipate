import { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import type { UserProfile } from "../context/ProfileContext";
import { SageAvatar } from "./SageAvatar";
import { TopicIllustration } from "./TopicIllustration";

export function OnboardingFlow() {
  const { completeOnboarding } = useProfile();
  
  const [screen, setScreenState] = useState<number>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const setScreen = (nextScreen: number | ((prev: number) => number)) => {
    setScreenState((prev) => {
      const resolved = typeof nextScreen === "function" ? nextScreen(prev) : nextScreen;
      setDirection(resolved > prev ? "forward" : "back");
      return resolved;
    });
  };
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<{ firstName?: string; email?: string; password?: string }>({});

  // Question answers
  const [lifeStage, setLifeStage] = useState("");
  const [topWorry, setTopWorry] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<string[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({
    tax: 3,
    pensions: 3,
    budgeting: 3,
    investing: 3,
    contracts: 3
  });
  const [employmentType, setEmploymentType] = useState("");
  const [sixMonthGoal, setSixMonthGoal] = useState("");

  const handleSliderChange = (topicKey: string, val: number) => {
    setConfidenceScores((prev) => ({
      ...prev,
      [topicKey]: val
    }));
  };

  const handleToggleUpcomingEvent = (eventLabel: string) => {
    setUpcomingEvents((prev) => {
      if (eventLabel === "Nothing right now") {
        return ["Nothing right now"];
      }
      const filtered = prev.filter((e) => e !== "Nothing right now");
      if (filtered.includes(eventLabel)) {
        return filtered.filter((e) => e !== eventLabel);
      } else {
        return [...filtered, eventLabel];
      }
    });
  };

  // Progress Percentage by Screen
  const progressMap: Record<number, number> = {
    2: 10,
    3: 25,
    4: 40,
    5: 55,
    6: 70,
    7: 85,
    8: 95,
    9: 100
  };

  // Handlers
  const handleBack = () => {
    if (screen > 1) {
      setScreen((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (screen < 9) {
      setScreen((prev) => prev + 1);
    }
  };

  const handleScreen1Submit = () => {
    setScreen(2);
  };

  const handleLoginExisting = () => {
    // Quick auto-populate for login simulation
    const demoProfile: UserProfile = {
      firstName: "Alex",
      email: "alex@demo.com",
      lifeStage: "Just got my first job",
      topWorry: "payslip",
      upcomingEvents: ["New job starting"],
      confidenceScores: { tax: 3, pensions: 2, budgeting: 4, investing: 2, contracts: 3 },
      employmentType: "Full time employed",
      sixMonthGoal: "Actually saving regularly"
    };
    completeOnboarding(demoProfile);
  };

  const handleScreen2Submit = () => {
    const newErrors: typeof errors = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!email.includes("@")) newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setScreen(3);
  };

  const handleFinishOnboarding = () => {
    const finalProfile: UserProfile = {
      firstName: firstName || "Alex",
      email: email || "alex@example.com",
      lifeStage: lifeStage || "Working 1 to 2 years",
      topWorry: topWorry || "tax",
      upcomingEvents: upcomingEvents.length > 0 ? upcomingEvents : ["Nothing right now"],
      confidenceScores,
      employmentType: employmentType || "Full time employed",
      sixMonthGoal: sixMonthGoal || "Actually saving regularly"
    };
    completeOnboarding(finalProfile);
  };

  // Render Helpers
  const renderProgressBar = () => {
    if (screen === 1) return null;
    return (
      <div className="anp-onboard__progress" style={{ height: "8px", background: "#F5F0EB", borderRadius: "4px" }}>
        <div 
          className="anp-onboard__progress-fill anp-progress-bar-fill" 
          style={{ 
            width: `${progressMap[screen]}%`,
            background: "#FF6B35",
            borderRadius: "4px",
            transition: `width ${direction === "forward" ? "400ms" : "300ms"} cubic-bezier(0.16, 1, 0.3, 1)`
          }}
        />
      </div>
    );
  };

  const renderHeader = (titleText: string) => {
    return (
      <div className="anp-onboard__header" style={{ borderBottom: "none" }}>
        <button 
          onClick={handleBack} 
          style={{
            background: "var(--p-card)",
            border: "1.5px solid var(--p-line)",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--p-ink)"
          }}
          aria-label="Back"
        >
          ‹
        </button>
        
        <div className="anp-onboard__header-left" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <SageAvatar size={26} />
          <span className="anp-onboard__header-label" style={{ color: "var(--p-ink-2)", fontWeight: 600 }}>{titleText}</span>
        </div>

        <button className="anp-onboard__skip-btn" onClick={handleSkip} style={{ color: "#B8A99A", border: "none", background: "transparent", fontWeight: 600 }}>
          Skip
        </button>
      </div>
    );
  };

  // Build the dynamic summary preview sentence
  const getDynamicSummary = () => {
    let summaryText = `You're setting up your track, `;
    
    if (lifeStage === "Still studying") {
      summaryText += "preparing for your graduation transition, ";
    } else if (lifeStage === "Just got my first job") {
      summaryText += "stepping into your first corporate job, ";
    } else if (lifeStage === "Freelancing or self employed") {
      summaryText += "navigating the self-employed tax landscape, ";
    } else {
      summaryText += "taking control of your finances, ";
    }

    if (topWorry === "I am not saving enough") {
      summaryText += "focusing heavily on regular savings habits, ";
    } else if (topWorry === "I signed a contract I did not fully understand") {
      summaryText += "learning to decode tricky employment details, ";
    } else {
      summaryText += "and building core financial literacy. ";
    }

    summaryText += `I've prepared 4 personalized tracks to get you ready.`;
    return summaryText;
  };

  const getLessonsPreview = () => {
    const list = [];
    if (topWorry === "payslip" || topWorry === "tax" || topWorry.toLowerCase().includes("payslip")) {
      list.push({ icon: "🧾", title: "Reading your first payslip before it lands" });
    }
    if (upcomingEvents.includes("New job starting")) {
      list.push({ icon: "💼", title: "Your employment contract decoded" });
    }
    if (confidenceScores.pensions <= 2) {
      list.push({ icon: "🏦", title: "Pensions explained simply" });
    }
    list.push({ icon: "📅", title: "UK tax calendar, what matters this year" });

    // Pad if less than 4 to make sure we always show 4
    const fallbacks = [
      { icon: "📈", title: "National Insurance & Income Tax" },
      { icon: "🏠", title: "Tenancy covenants & rent guide" },
      { icon: "💰", title: "ISA limits and compound interest" }
    ];
    let fallbackIdx = 0;
    while (list.length < 4 && fallbackIdx < fallbacks.length) {
      list.push(fallbacks[fallbackIdx]);
      fallbackIdx++;
    }
    return list.slice(0, 4);
  };

  // Helper to render the Golden Hour Sage Speech Bubble card
  const renderSageCard = (text: string) => {
    return (
      <div 
        className="anp-sage-card-onboard"
        style={{ 
          position: "relative", 
          background: "#FFF0E8", 
          borderRadius: "20px", 
          padding: "24px 16px 16px",
          marginTop: "24px",
          marginBottom: "20px",
          boxShadow: "0px 2px 12px rgba(255,107,53,0.08)"
        }}
      >
        <div style={{ position: "absolute", top: "-20px", left: "16px", zIndex: 5 }}>
          <SageAvatar size={48} />
        </div>
        <p style={{ fontSize: "13px", color: "#6B5744", lineHeight: 1.5, margin: 0, fontWeight: 400, textAlign: "left" }}>
          {text}
        </p>
      </div>
    );
  };

  return (
    <div className="anp-onboard" style={{ background: "#FFF8F0", height: "100%", display: "flex", flexDirection: "column" }}>
      {renderProgressBar()}

      {/* ==================== SCREEN 1: LANDING ==================== */}
      {screen === 1 && (
        <div className="anp-onboard-landing" style={{ background: "#FFF8F0", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center" }}>
          {/* Avatar with Glow behind it */}
          <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
            {/* Glow circle */}
            <div 
              style={{ 
                position: "absolute", 
                width: "120px", 
                height: "120px", 
                borderRadius: "50%", 
                background: "#FFE4D4", 
                opacity: 0.4, 
                zIndex: 0 
              }} 
            />
            {/* Sage Avatar (80px) */}
            <div style={{ zIndex: 1 }}>
              <SageAvatar size={96} />
            </div>
          </div>
          
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#B8A99A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            Meet Sage
          </p>
          
          <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#1A1207", lineHeight: 1.3, marginBottom: "16px", maxWidth: "100%" }}>
            The financial education you should have got but didn't
          </h1>
          
          <p style={{ fontSize: "14px", color: "#6B5744", lineHeight: 1.5, marginBottom: "40px", maxWidth: "90%" }}>
            Sage learns where you are in life and quietly prepares you for every financial moment before it arrives.
          </p>

          <div className="anp-onboard__footer" style={{ background: "#FFF8F0", width: "100%", padding: "0 20px" }}>
            <button className="anp-onboard__btn anp-onboard__btn--primary" onClick={handleScreen1Submit} style={{ height: "52px" }}>
              Create my account
            </button>
            <button 
              className="anp-onboard__btn" 
              onClick={handleLoginExisting} 
              style={{ 
                height: "52px", 
                background: "transparent", 
                color: "#FF6B35", 
                border: "1.5px solid #EDE5DC", 
                borderRadius: "16px",
                width: "100%",
                marginTop: "8px",
                fontWeight: 600
              }}
            >
              I already have an account
            </button>
          </div>
        </div>
      )}

      {/* ==================== SCREEN 2: SIGN UP ==================== */}
      {screen === 2 && (
        <>
          {renderHeader("Create your profile")}

          <div className="anp-onboard__scroll">
            {renderSageCard("First things first. What should I call you? I will use this throughout the app, not just on a welcome screen.")}

            {/* Inputs Stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="anp-onboard__field">
                <label className="anp-onboard__label">First name</label>
                <input
                  type="text"
                  className="anp-onboard__input"
                  placeholder="e.g. Alex"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ height: "52px", borderRadius: "14px", border: "1.5px solid #EDE5DC", padding: "14px" }}
                />
                {errors.firstName && <span style={{ color: "var(--p-coral)", fontSize: "11px", fontWeight: 600 }}>{errors.firstName}</span>}
              </div>

              <div className="anp-onboard__field">
                <label className="anp-onboard__label">Email address</label>
                <input
                  type="email"
                  className="anp-onboard__input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ height: "52px", borderRadius: "14px", border: "1.5px solid #EDE5DC", padding: "14px" }}
                />
                {errors.email && <span style={{ color: "var(--p-coral)", fontSize: "11px", fontWeight: 600 }}>{errors.email}</span>}
              </div>

              <div className="anp-onboard__field">
                <label className="anp-onboard__label">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="anp-onboard__input"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: "100%", height: "52px", borderRadius: "14px", border: "1.5px solid #EDE5DC", padding: "14px" }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#FF6B35",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && <span style={{ color: "var(--p-coral)", fontSize: "11px", fontWeight: 600 }}>{errors.password}</span>}
              </div>
            </div>

            {/* Privacy Shield */}
            <div className="anp-onboard__privacy">
              <span className="anp-onboard__privacy-icon">🔒</span>
              <p className="anp-onboard__privacy-text" style={{ color: "#6B5744" }}>
                Your personal details are never shared or used for advertising. Sage only uses them to personalise your experience.
              </p>
            </div>
          </div>

          <div className="anp-onboard__footer">
            <button className="anp-onboard__btn anp-onboard__btn--primary" onClick={handleScreen2Submit} style={{ height: "52px" }}>
              Continue
            </button>
          </div>
        </>
      )}

      {/* ==================== SCREEN 3: QUESTION 1 (lifeStage) ==================== */}
      {screen === 3 && (
        <>
          {renderHeader("Question 1 of 6")}

          <div className="anp-onboard__scroll">
            {renderSageCard(`Hey ${firstName || "there"}. What is your situation right now? No wrong answer, just helps me know where to start.`)}

            {/* Option Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "Still studying", icon: "🎓" },
                { label: "Just got my first job", icon: "💼" },
                { label: "Working 1 to 2 years", icon: "📈" },
                { label: "Freelancing or self employed", icon: "✍️" }
              ].map((opt) => {
                const isSelected = lifeStage === opt.label;
                return (
                  <div
                    key={opt.label}
                    onClick={() => setLifeStage(opt.label)}
                    className={`anp-onboard-row ${isSelected ? "anp-onboard-row--selected" : ""}`}
                    style={{
                      borderRadius: "20px",
                      padding: "16px 12px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      textAlign: "center",
                      position: "relative",
                      minHeight: "84px",
                      justifyContent: "center"
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{opt.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--p-ink)", lineHeight: 1.2 }}>
                      {opt.label}
                    </span>
                    <div 
                      className="anp-onboard-row__circle" 
                      style={{ position: "absolute", top: "8px", right: "8px" }} 
                    />
                  </div>
                );
              })}
            </div>

            {/* Sage Reaction Bubble */}
            {lifeStage && (
              <div className="anp-onboard__reaction" style={{ background: "#FFF1E4", borderRadius: "14px", padding: "12px" }}>
                <span>🦉</span>
                <p style={{ fontWeight: 600, fontSize: "12px", color: "var(--p-ink-2)" }}>
                  {lifeStage === "Still studying" && "Good to know. I will focus on getting you ready for what is coming rather than what is happening now."}
                  {lifeStage === "Just got my first job" && "Nice, first job is a big one. I have got a lot that will be useful for you right now."}
                  {lifeStage === "Working 1 to 2 years" && "Got it. I will skip the basics and focus on what actually matters at your stage."}
                  {lifeStage === "Freelancing or self employed" && "Self-employed is exciting but tax is a minefield. I'll make sure you understand the basics."}
                </p>
              </div>
            )}
          </div>

          <div className="anp-onboard__footer">
            <button className="anp-onboard__btn anp-onboard__btn--primary" onClick={() => setScreen(4)} style={{ height: "52px" }}>
              Next
            </button>
          </div>
        </>
      )}

      {/* ==================== SCREEN 4: QUESTION 2 (topWorry) ==================== */}
      {screen === 4 && (
        <>
          {renderHeader("Question 2 of 6")}

          <div className="anp-onboard__scroll">
            {renderSageCard("Be real with me. What is your biggest money worry right now? I will make sure we tackle this first.")}

            {/* Vertical options Checklist list */}
            <div className="anp-onboard-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "I do not really understand my payslip", icon: "🧾" },
                { label: "I am not saving enough", icon: "📉" },
                { label: "Tax stuff confuses me", icon: "📊" },
                { label: "Debt or overdraft", icon: "💳" },
                { label: "I signed a contract I did not fully understand", icon: "📄" }
              ].map((opt) => {
                const isSelected = topWorry === opt.label;
                return (
                  <button
                    key={opt.label}
                    className={`anp-onboard-row ${isSelected ? "anp-onboard-row--selected" : ""}`}
                    onClick={() => setTopWorry(opt.label)}
                    style={{ minHeight: "56px" }}
                  >
                    <div className="anp-onboard-row__icon-box">
                      <span>{opt.icon}</span>
                    </div>
                    <span className="anp-onboard-row__label">{opt.label}</span>
                    <div className="anp-onboard-row__circle" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="anp-onboard__footer">
            <button className="anp-onboard__btn anp-onboard__btn--primary" onClick={() => setScreen(5)} style={{ height: "52px" }}>
              Next
            </button>
          </div>
        </>
      )}

      {/* ==================== SCREEN 5: QUESTION 3 (upcomingEvents) ==================== */}
      {screen === 5 && (
        <>
          {renderHeader("Question 3 of 6")}

          <div className="anp-onboard__scroll">
            {renderSageCard("Anything big coming up for you soon?")}

            {/* Grid of multi-select cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "New job starting", icon: "💼" },
                { label: "Moving out", icon: "🏠" },
                { label: "Going freelance", icon: "🧾" },
                { label: "Nothing right now", icon: "✅" }
              ].map((opt) => {
                const isSelected = upcomingEvents.includes(opt.label);
                return (
                  <div
                    key={opt.label}
                    onClick={() => handleToggleUpcomingEvent(opt.label)}
                    className={`anp-onboard-row ${isSelected ? "anp-onboard-row--selected" : ""}`}
                    style={{
                      borderRadius: "20px",
                      padding: "16px 12px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      textAlign: "center",
                      position: "relative",
                      minHeight: "84px",
                      justifyContent: "center"
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{opt.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--p-ink)", lineHeight: 1.2 }}>
                      {opt.label}
                    </span>
                    <div 
                      className="anp-onboard-row__circle" 
                      style={{ position: "absolute", top: "8px", right: "8px" }} 
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="anp-onboard__footer">
            <button className="anp-onboard__btn anp-onboard__btn--primary" onClick={() => setScreen(6)} style={{ height: "52px" }}>
              Next
            </button>
          </div>
        </>
      )}

      {/* ==================== SCREEN 6: QUESTION 4 (confidenceScores) ==================== */}
      {screen === 6 && (
        <>
          {renderHeader("Question 4 of 6")}

          <div className="anp-onboard__scroll" style={{ paddingBottom: "110px" }}>
            {renderSageCard("Be real with me. How clued up are you on each of these? I will skip the basics on anything you are already confident about.")}

            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--p-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "-4px 0 2px", textAlign: "center" }}>
              Rate yourself from 1 to 5
            </p>

            {/* Range sliders stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "tax", label: "Tax and National Insurance" },
                { key: "pensions", label: "Pensions" },
                { key: "budgeting", label: "Budgeting and saving" },
                { key: "investing", label: "Investing" },
                { key: "contracts", label: "Contracts and employment" }
              ].map((topic) => (
                <div key={topic.key} className="anp-onboard-slider" style={{ boxShadow: "0px 2px 12px rgba(255,107,53,0.08)", border: "none", background: "#FFFFFF", borderRadius: "20px" }}>
                  <div className="anp-onboard-slider__header">
                    <span className="anp-onboard-slider__label" style={{ fontWeight: 600, color: "var(--p-ink)" }}>{topic.label}</span>
                    <span className="anp-onboard-slider__score" style={{ color: "#FF6B35", fontWeight: 600 }}>{confidenceScores[topic.key]} of 5</span>
                  </div>
                  
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={confidenceScores[topic.key]}
                    onChange={(e) => handleSliderChange(topic.key, parseInt(e.target.value))}
                  />

                  <div className="anp-onboard-slider__dots">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <span key={val} className="anp-onboard-slider__dot-label">{val}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="anp-onboard__footer">
            <button className="anp-onboard__btn anp-onboard__btn--primary" onClick={() => setScreen(7)} style={{ height: "52px" }}>
              Next
            </button>
          </div>
        </>
      )}

      {/* ==================== SCREEN 7: QUESTION 5 (employmentType) ==================== */}
      {screen === 7 && (
        <>
          {renderHeader("Question 5 of 6")}

          <div className="anp-onboard__scroll">
            {renderSageCard("How do you earn money right now?")}

            {/* Grid 2-column cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "Full time employed", icon: "💼" },
                { label: "Part time", icon: "⏰" },
                { label: "Self employed", icon: "✍️" },
                { label: "No income yet", icon: "🌙" }
              ].map((opt) => {
                const isSelected = employmentType === opt.label;
                return (
                  <div
                    key={opt.label}
                    onClick={() => setEmploymentType(opt.label)}
                    className={`anp-onboard-row ${isSelected ? "anp-onboard-row--selected" : ""}`}
                    style={{
                      borderRadius: "20px",
                      padding: "16px 12px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      textAlign: "center",
                      position: "relative",
                      minHeight: "84px",
                      justifyContent: "center"
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{opt.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--p-ink)", lineHeight: 1.2 }}>
                      {opt.label}
                    </span>
                    <div 
                      className="anp-onboard-row__circle" 
                      style={{ position: "absolute", top: "8px", right: "8px" }} 
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="anp-onboard__footer">
            <button className="anp-onboard__btn anp-onboard__btn--primary" onClick={() => setScreen(8)} style={{ height: "52px" }}>
              Next
            </button>
          </div>
        </>
      )}

      {/* ==================== SCREEN 8: QUESTION 6 (sixMonthGoal) ==================== */}
      {screen === 8 && (
        <>
          {renderHeader("Question 6 of 6")}

          <div className="anp-onboard__scroll">
            {renderSageCard("Last one. What would feel like a win for you 6 months from now?")}

            {/* List options checklist */}
            <div className="anp-onboard-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Actually saving regularly", icon: "🐷" },
                { label: "Understanding my finances properly", icon: "📖" },
                { label: "Saving up for something big", icon: "🎯" },
                { label: "Just feeling less stressed about money", icon: "💖" }
              ].map((opt) => {
                const isSelected = sixMonthGoal === opt.label;
                return (
                  <button
                    key={opt.label}
                    className={`anp-onboard-row ${isSelected ? "anp-onboard-row--selected" : ""}`}
                    onClick={() => setSixMonthGoal(opt.label)}
                    style={{ minHeight: "56px" }}
                  >
                    <div className="anp-onboard-row__icon-box">
                      <span>{opt.icon}</span>
                    </div>
                    <span className="anp-onboard-row__label">{opt.label}</span>
                    <div className="anp-onboard-row__circle" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="anp-onboard__footer">
            <button className="anp-onboard__btn anp-onboard__btn--primary" onClick={() => setScreen(9)} style={{ height: "52px" }}>
              Next
            </button>
          </div>
        </>
      )}

      {/* ==================== SCREEN 9: SAGE SUMMARY ==================== */}
      {screen === 9 && (
        <>
          <div className="anp-onboard__header" style={{ justifyContent: "center", borderBottom: "none" }}>
            <span className="anp-onboard__header-label" style={{ fontWeight: 600, color: "var(--p-ink-2)" }}>Your personal plan</span>
          </div>

          <div className="anp-onboard__scroll" style={{ paddingBottom: "80px", alignItems: "center", textAlign: "center" }}>
            {/* Sparkles icon rounded square */}
            <div 
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                background: "#FFE4D4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                marginBottom: "16px"
              }}
            >
              ✨
            </div>

            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--p-ink)", marginBottom: "8px" }}>
              All set, {firstName}!
            </h2>

            <p style={{ fontSize: "14px", color: "var(--p-ink-2)", lineHeight: 1.5, marginBottom: "20px", padding: "0 10px" }}>
              {getDynamicSummary()}
            </p>

            {/* List preview items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", textAlign: "left" }}>
              {getLessonsPreview().map((lesson, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: "var(--p-card)",
                    border: "none",
                    borderRadius: "20px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0px 2px 12px rgba(255,107,53,0.08)"
                  }}
                >
                  <TopicIllustration iconName={lesson.icon} size={30} style={{ borderRadius: "10px" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--p-ink)" }}>{lesson.title}</span>
                </div>
              ))}
            </div>

            {/* Sage note styled as 56px overlapping avatar card */}
            <div 
              style={{ 
                position: "relative", 
                background: "#FFF0E8", 
                borderRadius: "20px", 
                padding: "28px 16px 16px",
                marginTop: "32px",
                marginBottom: "20px",
                boxShadow: "0px 2px 12px rgba(255,107,53,0.08)",
                textAlign: "left",
                width: "100%"
              }}
            >
              <div style={{ position: "absolute", top: "-28px", left: "16px", zIndex: 5 }}>
                <SageAvatar size={68} />
              </div>
              <p style={{ fontSize: "13px", color: "#6B5744", lineHeight: 1.5, margin: 0 }}>
                This is your plan. Nothing generic. You can update any of this as your life changes and I will always adapt.
              </p>
            </div>
          </div>

          <div className="anp-onboard__footer">
            <button className="anp-onboard__btn anp-onboard__btn--primary" onClick={handleFinishOnboarding} style={{ height: "52px" }}>
              Let us go
            </button>
          </div>
        </>
      )}
    </div>
  );
}
