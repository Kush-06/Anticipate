import { useState, useEffect } from "react";
import { useProfile } from "../context/ProfileContext";
import type { UserProfile } from "../context/ProfileContext";
import { AppIcon } from "./AppIcon";
import { SageAvatar } from "./SageAvatar";
import { getRecommendedSummary } from "../data/topics";

// Parse string with bold tags into clean text segments
function parseParagraph(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return { text: part.slice(2, -2), isBold: true };
    }
    return { text: part, isBold: false };
  });
}

// Custom typewriter engine component
function TypewriterMessage({
  paragraphs,
  onComplete,
  speed = 35
}: {
  paragraphs: string[];
  onComplete: () => void;
  speed?: number;
}) {
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState(0);
  const [displayedLengths, setDisplayedLengths] = useState<number[]>(paragraphs.map(() => 0));
  const [isTyping, setIsTyping] = useState(true);

  // Initialize once on mount
  useEffect(() => {
    setCurrentParagraphIdx(0);
    setDisplayedLengths(paragraphs.map(() => 0));
    setIsTyping(true);
  }, []);

  useEffect(() => {
    if (!isTyping) return;
    if (currentParagraphIdx >= paragraphs.length) {
      setIsTyping(false);
      onComplete();
      return;
    }

    const targetText = paragraphs[currentParagraphIdx];
    const segments = parseParagraph(targetText);
    const totalLength = segments.reduce((sum, seg) => sum + seg.text.length, 0);

    let charIdx = 0;

    const interval = setInterval(() => {
      setDisplayedLengths((prev) => {
        const next = [...prev];
        next[currentParagraphIdx] = charIdx + 1;
        return next;
      });
      charIdx++;

      if (charIdx >= totalLength) {
        clearInterval(interval);
        // Staggered pause (400ms) between paragraph blocks
        setTimeout(() => {
          setCurrentParagraphIdx((idx) => idx + 1);
        }, 400);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [currentParagraphIdx, paragraphs, isTyping, speed, onComplete]);

  const renderSegments = (segments: ReturnType<typeof parseParagraph>, maxLength: number) => {
    let charsLeft = maxLength;
    return segments.map((seg, i) => {
      if (charsLeft <= 0) return null;
      const visibleText = seg.text.slice(0, charsLeft);
      charsLeft -= seg.text.length;

      if (seg.isBold) {
        return <strong key={i}>{visibleText}</strong>;
      }
      return <span key={i}>{visibleText}</span>;
    });
  };

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <SageAvatar size={50} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {paragraphs.map((paraText, idx) => {
          if (idx > currentParagraphIdx) return null;
          
          const segments = parseParagraph(paraText);
          const maxLength = displayedLengths[idx] ?? 0;
          const totalLength = segments.reduce((sum, seg) => sum + seg.text.length, 0);
          const isCurrent = idx === currentParagraphIdx && maxLength < totalLength;

          return (
            <div
              key={idx}
              style={{
                background: "linear-gradient(135deg, #f7f9f6 0%, #edf3ee 100%)",
                border: "1.5px solid #d8e6db",
                borderRadius: idx === 0 ? "0px 16px 16px 16px" : "16px",
                padding: "14px 16px",
                fontSize: 14.5,
                lineHeight: 1.45,
                color: "var(--p-ink)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                alignSelf: "flex-start",
                maxWidth: "100%",
                fontFamily: "var(--p-sans)"
              }}
            >
              {renderSegments(segments, maxLength)}
              {isCurrent && <span className="anp-cursor">|</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OnboardingFlow() {
  const { completeOnboarding } = useProfile();

  // Navigation and auth states
  const [screen, setScreen] = useState<"welcome" | "login" | "register" | "onboarding">("welcome");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [animateWelcome, setAnimateWelcome] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");

  const [step, setStep] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingText, setAnalyzingText] = useState("Looking at where you are right now...");

  // States
  const [firstName, setFirstName] = useState("");
  const [lifeStage, setStepLifeStage] = useState("");
  const [livingSituation, setStepLivingSituation] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<string[]>([]);
  const [moneyWorry, setStepMoneyWorry] = useState("");
  const [confidence, setConfidence] = useState<Record<string, number>>({
    payslip: 3,
    budgeting: 3,
    pensions: 3,
    investing: 3,
    renting: 3
  });
  const [studentLoan, setStepStudentLoan] = useState("");
  const [salaryInput, setSalaryInput] = useState("");

  const totalSteps = 10;

  useEffect(() => {
    setTypingComplete(false);
  }, [step]);

  useEffect(() => {
    if (screen === "welcome") {
      const timer = setTimeout(() => {
        setAnimateWelcome(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  useEffect(() => {
    if (isAnalyzing) {
      setAnalyzingText("Looking at where you are right now...");
      const t1 = setTimeout(() => {
        setAnalyzingText("Targeting your main money worries...");
      }, 1100);
      const t2 = setTimeout(() => {
        setAnalyzingText("Setting up your custom dashboard...");
      }, 2200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isAnalyzing]);

  const advance = () => {
    if (step === 8) {
      // Trigger smooth analyzing transition on completing Q7
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setStep(9);
      }, 3500);
      return;
    }

    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Save profile data
    const cleanSalary = salaryInput.trim().replace(/[^0-9.]/g, "") || "28000";
    const mappedCompany = upcomingEvents.includes("Starting a new job soon") ? "your new employer" : "your employer";
    const cleanEmail = registeredEmail.trim() || `${firstName.toLowerCase().replace(/\s+/g, "")}@example.com`;

    const profile: UserProfile = {
      firstName: firstName.trim() || "Maya",
      email: cleanEmail,
      companyName: mappedCompany,
      lifeStage: lifeStage,
      employmentType: lifeStage,
      sixMonthGoal: moneyWorry || "Personal finance confidence",
      upcomingEvents: upcomingEvents.filter((x) => x !== "Nothing major right now"),
      confidenceScores: {
        tax: confidence.payslip,
        pensions: confidence.pensions,
        budgeting: confidence.budgeting,
        investing: confidence.investing,
        contracts: confidence.renting
      },
      livingSituation: livingSituation,
      planningToMove: upcomingEvents.includes("Moving out for the very first time") ? "Yes" : "No",
      salary: cleanSalary,
      studentLoan: studentLoan,
      hasDebt: moneyWorry?.includes("debt") ? "Yes" : "No",
      interestedTopics: [moneyWorry],
      motivation: "Improve general knowledge",
      usageFrequency: "A few times a week"
    };

    completeOnboarding(profile);
  };

  const handleSelectSingle = (setter: (v: string) => void, val: string) => {
    setter(val);
  };

  const handleSelectRating = (key: string, val: number) => {
    setConfidence((prev) => ({ ...prev, [key]: val }));
  };

  const toggleUpcomingEvent = (evt: string) => {
    setUpcomingEvents((prev) => {
      if (evt === "Nothing major right now") return ["Nothing major right now"];
      const filtered = prev.filter((x) => x !== "Nothing major right now");
      if (filtered.includes(evt)) {
        return filtered.filter((x) => x !== evt);
      } else {
        return [...filtered, evt];
      }
    });
  };

  // Validators
  const canAdvance = [
    firstName.trim().length >= 2, // step 0 (Name only)
    true, // step 1
    lifeStage.length > 0, // step 2
    livingSituation.length > 0, // step 3
    upcomingEvents.length > 0, // step 4
    moneyWorry.length > 0, // step 5
    true, // step 6
    studentLoan.length > 0, // step 7
    salaryInput.trim().length > 0, // step 8
    true // step 9
  ][step];

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

  const authInputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255, 255, 255, 0.15)",
    border: "1.5px solid rgba(255, 255, 255, 0.25)",
    borderRadius: "14px",
    padding: "14px 16px",
    fontSize: 15,
    color: "#ffffff",
    outline: "none",
    fontFamily: "var(--p-sans)",
    transition: "all 0.15s ease",
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

  const tempProfileForRecs: UserProfile = {
    firstName: firstName.trim() || "Maya",
    email: registeredEmail,
    companyName: upcomingEvents.includes("Starting a new job soon") ? "your new employer" : "your employer",
    lifeStage: lifeStage,
    employmentType: lifeStage,
    sixMonthGoal: moneyWorry || "Personal finance confidence",
    upcomingEvents: upcomingEvents.filter((x) => x !== "Nothing major right now"),
    confidenceScores: {
      tax: confidence.payslip,
      pensions: confidence.pensions,
      budgeting: confidence.budgeting,
      investing: confidence.investing,
      contracts: confidence.renting
    },
    livingSituation: livingSituation,
    planningToMove: upcomingEvents.includes("Moving out for the very first time") ? "Yes" : "No",
    salary: salaryInput.trim().replace(/[^0-9.]/g, "") || "28000",
    studentLoan: studentLoan,
    hasDebt: moneyWorry?.includes("debt") ? "Yes" : "No",
    interestedTopics: [moneyWorry],
    motivation: "Improve general knowledge",
    usageFrequency: "A few times a week"
  };

  const recSummary = getRecommendedSummary(tempProfileForRecs);

  const stepParagraphs = [
    // Step 0: Welcome & Name Catch
    [
      "Hey, I'm Sage, your personalised financial guide. Honestly, though? Think of me more as a friend who you can turn to for help.",
      "Most money apps are boring as hell, but this one is completely custom-built around you.",
      "Drop your first name below so I know who I'm talking to, and we'll get you set up."
    ],
    // Step 1: Nice to meet you transition
    [
      `Nice to meet you, ${firstName || "there"}.`,
      "To make sure I only show you stuff that's actually relevant to your life right now, I just need a quick steer on where you're at.",
      "No trick questions, and you can change any of this later if things shift."
    ],
    // Step 2: Q1 - Life Stage
    [
      "So, first things first — what best describes your day-to-day right now?"
    ],
    // Step 3: Q2 - Living Situation
    [
      "Got it. And what's your living situation looking like?"
    ],
    // Step 4: Q3 - Upcoming Events
    [
      "Life moves pretty fast. Is anything big coming up for you in the next few months? Tap anything that applies."
    ],
    // Step 5: Q4 - Money Worry
    [
      "Be real with me here — what's the single biggest thing that stresses you out about money right now?"
    ],
    // Step 6: Q5 - Confidence Check
    [
      "Let's do a quick pulse check on a few specific topics.",
      "Be completely honest — this just helps me skip the basic stuff you already know inside out."
    ],
    // Step 7: Q6 - Student Loan
    [
      "Quick one regarding university — did you take out a student loan?"
    ],
    // Step 8: Q7 - Salary
    [
      "Last thing, and it's completely optional.",
      "If you drop in your rough take-home salary, I can run the numbers in your lessons using your actual pay packet.",
      "It means instead of saying 'imagine you earn £30k', I can show you exactly how things impact your wallet."
    ],
    // Step 9: Summary Reveal
    [
      `Perfect. Thanks, ${firstName || "Maya"}.`,
      "Based on what you just shared, I've custom-built your priority track.",
      "Here is exactly where we're starting today:"
    ]
  ][step];

  // Analyzing processing micro-interaction UI
  if (isAnalyzing) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--p-bg)", padding: 40, textAlign: "center" }}>
        <SageAvatar size={100} />
        <h2 style={{ fontFamily: "var(--p-display)", fontWeight: 800, fontSize: 22, marginTop: 24, color: "var(--p-ink)" }}>
          {analyzingText}
        </h2>
        <p style={{ fontSize: 14, color: "var(--p-ink-2)", marginTop: 8, maxWidth: 280, lineHeight: 1.45, fontFamily: "var(--p-sans)" }}>
          Sage is building your custom learning queue based on your stressors and life stage.
        </p>
        <div style={{ marginTop: 24, width: 45, height: 4, borderRadius: 2, background: "var(--p-coral)", animation: "anp-pulse 1.2s infinite ease-in-out" }} />
        <style>{`
          @keyframes anp-pulse {
            0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
            50% { opacity: 1; transform: scaleX(1.3); }
          }
        `}</style>
      </div>
    );
  }

  if (screen === "welcome") {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--p-coral, #e9694a)",
        position: "relative",
        padding: "24px",
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
        {/* Animated logo/name wrapper */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: animateWelcome ? "translateY(-60px)" : "translateY(0px)"
        }}>
          <SageAvatar size={100} />
          <div style={{
            fontFamily: "var(--font-display, 'Bricolage Grotesque')",
            fontWeight: 800,
            fontSize: 32,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            textTransform: "lowercase",
          }}>
            anticipate.
          </div>
        </div>

        {/* Buttons wrapper, fade in */}
        <div style={{
          position: "absolute",
          bottom: "12%",
          left: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          opacity: animateWelcome ? 1 : 0,
          transform: animateWelcome ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: animateWelcome ? "auto" : "none"
        }}>
          <button
            onClick={() => {
              setAnimateWelcome(false);
              setScreen("register");
            }}
            style={{
              padding: "16px",
              background: "#ffffff",
              color: "var(--p-coral, #e9694a)",
              border: "none",
              borderRadius: "16px",
              fontFamily: "var(--p-display)",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Get Started
          </button>
          
          <button
            onClick={() => {
              setAnimateWelcome(false);
              setScreen("login");
            }}
            style={{
              padding: "16px",
              background: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              border: "1.5px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "16px",
              fontFamily: "var(--p-display)",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              transition: "background 0.2s ease, transform 0.15s ease"
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Already have an account
          </button>
        </div>
      </div>
    );
  }

  if (screen === "login") {
    const isLoginValid = authEmail.trim().length > 0 && authPassword.trim().length > 0;
    
    const handleLogin = () => {
      const defaultMockProfile: UserProfile = {
        firstName: "Maya",
        email: authEmail.trim(),
        companyName: "your employer",
        lifeStage: "I've just started my first job",
        employmentType: "I've just started my first job",
        sixMonthGoal: "Personal finance confidence",
        upcomingEvents: [],
        confidenceScores: {
          tax: 3,
          pensions: 3,
          budgeting: 3,
          investing: 3,
          contracts: 3
        },
        livingSituation: "Renting — just moved in or about to",
        planningToMove: "No",
        salary: "28000",
        studentLoan: "No",
        hasDebt: "No",
        interestedTopics: [],
        motivation: "Improve general knowledge",
        usageFrequency: "A few times a week"
      };
      completeOnboarding(defaultMockProfile);
    };

    return (
      <div className="anp-auth-slide-in" style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--p-coral, #e9694a)",
        padding: "max(24px, env(safe-area-inset-top)) 24px 24px",
        boxSizing: "border-box",
        color: "#ffffff",
        overflow: "hidden"
      }}>
        {/* Navigation */}
        <div style={{ alignSelf: "flex-start", marginBottom: 12 }}>
          <button
            onClick={() => {
              setScreen("welcome");
              setAuthPassword("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 0",
              fontFamily: "var(--p-sans)",
              fontSize: 14,
              fontWeight: 500,
              opacity: 0.8,
              transition: "opacity 0.2s"
            }}
          >
            <AppIcon name="chevronLeft" size={20} stroke={2.5} />
            <span>Back</span>
          </button>
        </div>

        {/* Logo and title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 10, marginBottom: 28 }}>
          <SageAvatar size={60} />
          <h2 style={{ fontFamily: "var(--font-display, 'Bricolage Grotesque')", fontWeight: 800, fontSize: 24, color: "#ffffff", margin: 0 }}>
            Welcome Back
          </h2>
          <p style={{ fontFamily: "var(--p-sans)", fontSize: 13, color: "rgba(255, 255, 255, 0.75)", margin: 0, textAlign: "center" }}>
            Log in to access your financial guide
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "var(--p-sans)", fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
            <input
              type="email"
              className="anp-auth-input"
              style={authInputStyle}
              placeholder="hello@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "var(--p-sans)", fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input
              type="password"
              className="anp-auth-input"
              style={authInputStyle}
              placeholder="Enter your password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Bottom submit button */}
        <div style={{ marginTop: "auto", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <button
            disabled={!isLoginValid}
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "16px",
              background: isLoginValid ? "#ffffff" : "rgba(255, 255, 255, 0.2)",
              color: isLoginValid ? "var(--p-coral, #e9694a)" : "rgba(255, 255, 255, 0.4)",
              border: "none",
              borderRadius: "16px",
              fontFamily: "var(--p-display)",
              fontWeight: 700,
              fontSize: 15,
              cursor: isLoginValid ? "pointer" : "not-allowed",
              boxShadow: isLoginValid ? "0 4px 14px rgba(0,0,0,0.12)" : "none",
              transition: "all 0.25s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            <span>Log In</span>
            <AppIcon name="arrowRight" size={16} stroke={2.5} />
          </button>
        </div>
      </div>
    );
  }

  if (screen === "register") {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail.trim());
    const isPasswordValid = authPassword.length >= 6;
    const isConfirmPasswordValid = authPassword === authConfirmPassword;
    const isRegisterValid = isEmailValid && isPasswordValid && isConfirmPasswordValid;

    const handleRegisterSubmit = () => {
      if (isRegisterValid) {
        setRegisteredEmail(authEmail.trim());
        setScreen("onboarding");
      }
    };

    return (
      <div className="anp-auth-slide-in" style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--p-coral, #e9694a)",
        padding: "max(24px, env(safe-area-inset-top)) 24px 24px",
        boxSizing: "border-box",
        color: "#ffffff",
        overflow: "hidden"
      }}>
        {/* Navigation */}
        <div style={{ alignSelf: "flex-start", marginBottom: 12 }}>
          <button
            onClick={() => {
              setScreen("welcome");
              setAuthPassword("");
              setAuthConfirmPassword("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 0",
              fontFamily: "var(--p-sans)",
              fontSize: 14,
              fontWeight: 500,
              opacity: 0.8,
              transition: "opacity 0.2s"
            }}
          >
            <AppIcon name="chevronLeft" size={20} stroke={2.5} />
            <span>Back</span>
          </button>
        </div>

        {/* Logo and title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 10, marginBottom: 28 }}>
          <SageAvatar size={60} />
          <h2 style={{ fontFamily: "var(--font-display, 'Bricolage Grotesque')", fontWeight: 800, fontSize: 24, color: "#ffffff", margin: 0 }}>
            Create Account
          </h2>
          <p style={{ fontFamily: "var(--p-sans)", fontSize: 13, color: "rgba(255, 255, 255, 0.75)", margin: 0, textAlign: "center" }}>
            Sign up to build your personalised financial guide
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "var(--p-sans)", fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
            <input
              type="email"
              className="anp-auth-input"
              style={authInputStyle}
              placeholder="hello@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "var(--p-sans)", fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input
              type="password"
              className="anp-auth-input"
              style={authInputStyle}
              placeholder="Min. 6 characters"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />
            {authPassword.length > 0 && authPassword.length < 6 && (
              <span style={{ fontSize: 12, color: "#ffe285", fontFamily: "var(--p-sans)" }}>Password must be at least 6 characters.</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "var(--p-sans)", fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm Password</label>
            <input
              type="password"
              className="anp-auth-input"
              style={authInputStyle}
              placeholder="Confirm password"
              value={authConfirmPassword}
              onChange={(e) => setAuthConfirmPassword(e.target.value)}
            />
            {authConfirmPassword.length > 0 && authPassword !== authConfirmPassword && (
              <span style={{ fontSize: 12, color: "#ffe285", fontFamily: "var(--p-sans)" }}>Passwords do not match.</span>
            )}
          </div>
        </div>

        {/* Bottom submit button */}
        <div style={{ marginTop: "auto", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <button
            disabled={!isRegisterValid}
            onClick={handleRegisterSubmit}
            style={{
              width: "100%",
              padding: "16px",
              background: isRegisterValid ? "#ffffff" : "rgba(255, 255, 255, 0.2)",
              color: isRegisterValid ? "var(--p-coral, #e9694a)" : "rgba(255, 255, 255, 0.4)",
              border: "none",
              borderRadius: "16px",
              fontFamily: "var(--p-display)",
              fontWeight: 700,
              fontSize: 15,
              cursor: isRegisterValid ? "pointer" : "not-allowed",
              boxShadow: isRegisterValid ? "0 4px 14px rgba(0,0,0,0.12)" : "none",
              transition: "all 0.25s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            <span>Create Account</span>
            <AppIcon name="arrowRight" size={16} stroke={2.5} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--p-bg)", overflow: "hidden" }}>
      {/* Header bar */}
      <div style={{ padding: "max(24px, env(safe-area-inset-top)) 20px 16px", flexShrink: 0, borderBottom: "1px solid var(--p-line-2)", background: "var(--p-bg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--p-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", textTransform: "lowercase", color: "var(--p-ink)" }}>
            anticipate.
          </div>
        </div>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 8 }}>
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

      {/* Message Log scroll body */}
      <div className="anp-scroll" style={{ flex: 1, padding: "20px 20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <TypewriterMessage
            key={step}
            paragraphs={stepParagraphs}
            onComplete={() => setTypingComplete(true)}
          />

          {/* Render inputs ONLY after Sage finishes typing */}
          {typingComplete && (
            <div style={{ animation: "anp-fade-in 0.3s ease both" }}>
              {/* Step 0: Name info */}
              {step === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <input
                      className="anp-name-input"
                      style={inputStyle}
                      placeholder="Your name..."
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Transition slide (no input, just continues) */}
              {step === 1 && null}

              {/* Step 2: Q1 - Life stage */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "I'm still at uni",
                    "I've just started my first proper job",
                    "I've been working for a year or two",
                    "I'm doing the freelance / self-employed thing",
                    "I'm not working at the moment"
                  ].map((opt) => (
                    <button key={opt} style={rowChoiceStyle(lifeStage === opt)} onClick={() => handleSelectSingle(setStepLifeStage, opt)}>
                      <span>{opt}</span>
                      {lifeStage === opt && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3: Q2 - Living situation */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Living at home with family",
                    "Renting (just moved in, or about to)",
                    "Renting (been here a while now)",
                    "I own my place",
                    "Student accommodation"
                  ].map((opt) => (
                    <button key={opt} style={rowChoiceStyle(livingSituation === opt)} onClick={() => handleSelectSingle(setStepLivingSituation, opt)}>
                      <span>{opt}</span>
                      {livingSituation === opt && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 4: Q3 - Upcoming events (Multi) */}
              {step === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Starting a new job soon",
                    "Moving out for the very first time",
                    "Thinking about buying a place",
                    "Moving in with a partner",
                    "Having a baby (or just had one)",
                    "Getting a pay rise or switching roles",
                    "Buying a car",
                    "Nothing major right now"
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

              {/* Step 5: Q4 - Money worry */}
              {step === 5 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "I honestly don't get how tax works",
                    "I never seem to have anything left at the end of the month",
                    "I've got debt I'm trying to clear",
                    "I don't know if I'm saving right, or saving enough",
                    "I have absolutely no idea what my pension is doing",
                    "I want to start investing but I'm stuck at square one",
                    "I feel like I'm missing out on free government cash",
                    "Honestly? I don't even know what I don't know"
                  ].map((opt) => (
                    <button key={opt} style={rowChoiceStyle(moneyWorry === opt)} onClick={() => handleSelectSingle(setStepMoneyWorry, opt)}>
                      <span style={{ maxWidth: "88%" }}>{opt}</span>
                      {moneyWorry === opt && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 6: Q5 - Confidence Check (Consolidated) */}
              {step === 6 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ alignSelf: "center", fontSize: 13, fontWeight: 600, color: "var(--p-ink-3)", fontFamily: "var(--p-sans)", marginBottom: 4 }}>
                    1 = Clueless • 5 = Expert
                  </div>
                  {[
                    { label: "Decoding your payslip and tax", key: "payslip" },
                    { label: "Managing cash flow and day-to-day budgeting", key: "budgeting" },
                    { label: "Pensions and saving for the future", key: "pensions" },
                    { label: "Investing, ISAs, and growing wealth", key: "investing" },
                    { label: "Your rights as a tenant or home buyer", key: "renting" }
                  ].map(({ label, key }) => (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--p-ink)", fontFamily: "var(--p-sans)" }}>{label}</span>
                      <div style={{ display: "flex", gap: 6, justifyContent: "space-between", background: "#fff", border: "1.5px solid var(--p-line)", borderRadius: 12, padding: "8px" }}>
                        {[1, 2, 3, 4, 5].map((val) => {
                          const isSelected = val === confidence[key];
                          return (
                            <button
                              key={val}
                              onClick={() => handleSelectRating(key, val)}
                              style={{
                                flex: 1,
                                height: 36,
                                borderRadius: 8,
                                border: isSelected ? "2.2px solid var(--p-coral)" : "1.5px solid var(--p-line)",
                                background: isSelected ? "var(--p-coral-tint)" : "var(--p-line-2)",
                                color: isSelected ? "var(--p-coral)" : "var(--p-ink)",
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: "pointer",
                                fontFamily: "var(--p-mono)"
                              }}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 7: Q6 - Student loan */}
              {step === 7 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Yes, and it's actively coming off my payslip",
                    "Yes, but I haven't started paying it back yet",
                    "No, I didn't take one out",
                    "I'm not entirely sure, actually"
                  ].map((opt) => (
                    <button key={opt} style={rowChoiceStyle(studentLoan === opt)} onClick={() => handleSelectSingle(setStepStudentLoan, opt)}>
                      <span>{opt}</span>
                      {studentLoan === opt && <AppIcon name="check" size={14} stroke={2.4} />}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 8: Q7 - Salary */}
              {step === 8 && (
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
                    <button
                      onClick={() => {
                        setSalaryInput("");
                        advance();
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--p-coral)",
                        fontFamily: "var(--p-sans)",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "8px 12px",
                        marginTop: 12,
                        alignSelf: "center",
                        textDecoration: "underline"
                      }}
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              )}

              {/* Step 9: Summary learning queue reveal */}
              {step === 9 && (
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
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <AppIcon name={card.icon as any} size={20} stroke={2} />
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
              )}

            </div>
          )}

        </div>
      </div>

      {/* Action panel */}
      {typingComplete && (
        <div style={{ padding: "12px 20px max(20px, env(safe-area-inset-bottom)) 20px", flexShrink: 0, borderTop: "1px solid var(--p-line)", background: "var(--p-card)", animation: "anp-fade-in 0.3s ease both" }}>
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
            {step === 0 ? "Continue" : step === 1 ? "Let's do it" : step === 9 ? "Let's go" : "Continue"}
            <AppIcon name="arrowRight" size={16} stroke={2} />
          </button>
          
          {/* Helper footer */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
            {step > 0 && step < 9 && (
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
          </div>
        </div>
      )}

      {/* Embedded Animations styles */}
      <style>{`
        @keyframes anp-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes anp-blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .anp-cursor {
          animation: anp-blink 0.8s infinite;
          color: var(--p-coral);
          font-weight: bold;
          margin-left: 2px;
          display: inline-block;
        }
        .anp-name-input::placeholder {
          color: var(--p-ink-3);
          font-weight: 400;
          opacity: 0.8;
        }
        .anp-auth-slide-in {
          animation: anp-auth-fade-slide 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes anp-auth-fade-slide {
          from {
            opacity: 0;
            transform: translateX(16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .anp-auth-input::placeholder {
          color: rgba(255, 255, 255, 0.55);
        }
        .anp-auth-input:focus {
          background: rgba(255, 255, 255, 0.22) !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
}
