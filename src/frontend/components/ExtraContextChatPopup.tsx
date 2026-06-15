import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
import { useProfile } from "../context/ProfileContext";
import type { UserProfile } from "../context/ProfileContext";
import { AppIcon } from "./AppIcon";
import { SageAvatar } from "./SageAvatar";

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

// Local Typewriter component matching OnboardingFlow
const PopupTypewriterMessage = forwardRef(({
  paragraphs,
  onComplete,
  speed = 25
}: {
  paragraphs: string[];
  onComplete: () => void;
  speed?: number;
}, ref) => {
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState(0);
  const [displayedLengths, setDisplayedLengths] = useState<number[]>(() => paragraphs.map(() => 0));
  const [isTyping, setIsTyping] = useState(true);

  const skipCurrent = useCallback(() => {
    if (!isTyping || currentParagraphIdx >= paragraphs.length) return;

    setDisplayedLengths((prev) => {
      const next = [...prev];
      const targetText = paragraphs[currentParagraphIdx];
      const segments = parseParagraph(targetText);
      next[currentParagraphIdx] = segments.reduce((sum, seg) => sum + seg.text.length, 0);
      return next;
    });
  }, [currentParagraphIdx, paragraphs, isTyping]);

  useImperativeHandle(ref, () => ({
    skipCurrent
  }));


  useEffect(() => {
    if (!isTyping) return;
    if (currentParagraphIdx >= paragraphs.length) {
      const timer = setTimeout(() => {
        setIsTyping(false);
        onComplete();
      }, 0);
      return () => clearTimeout(timer);
    }

    const targetText = paragraphs[currentParagraphIdx];
    const segments = parseParagraph(targetText);
    const totalLength = segments.reduce((sum, seg) => sum + seg.text.length, 0);

    if (displayedLengths[currentParagraphIdx] >= totalLength) {
      const timer = setTimeout(() => {
        setCurrentParagraphIdx((idx) => idx + 1);
      }, 150);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setDisplayedLengths((prev) => {
        const next = [...prev];
        const currentLen = next[currentParagraphIdx] ?? 0;

        if (currentLen >= totalLength) {
          clearInterval(interval);
          return next;
        }

        next[currentParagraphIdx] = currentLen + 1;
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [currentParagraphIdx, paragraphs, isTyping, speed, onComplete, displayedLengths]);

  const renderSegments = (segments: ReturnType<typeof parseParagraph>, maxLength: number) => {
    let charsLeft = maxLength;
    return segments.map((seg, i) => {
      if (charsLeft <= 0) return null;
      const visibleText = seg.text.slice(0, charsLeft);
      charsLeft -= seg.text.length;

      if (seg.isBold) {
        return <strong key={i} style={{ fontWeight: 700 }}>{visibleText}</strong>;
      }
      return <span key={i}>{visibleText}</span>;
    });
  };

  return (
    <div
      onClick={skipCurrent}
      style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: isTyping ? "pointer" : "default" }}
    >
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
});

PopupTypewriterMessage.displayName = "PopupTypewriterMessage";

interface ExtraContextChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuestionConfig {
  field: keyof UserProfile;
  label: string;
  placeholder?: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  getSageText: (firstName: string) => string[];
}

// Get greeting + question configuration
function getQuestionConfigs(prof: UserProfile): QuestionConfig[] {
  const configs: QuestionConfig[] = [];

  // Q1: day-to-day (lifeStage)
  if (prof.lifeStage === "I've just started my first proper job") {
    configs.push({
      field: "firstJobCompanyName",
      label: "Company Name",
      placeholder: "e.g. Google, NHS, Deloitte...",
      type: "text",
      getSageText: (name) => [
        `Congrats on starting your first proper job, **${name}**! That is huge.`,
        "What is the name of the company or employer?"
      ]
    });
    configs.push({
      field: "firstJobStartDate",
      label: "Start Date",
      type: "date",
      getSageText: () => [
        "And when is your official start date? This helps me map out your timeline."
      ]
    });
    configs.push({
      field: "firstJobPayDate",
      label: "First Pay Date",
      type: "date",
      getSageText: () => [
        "Got it. And when do you expect your first payslip or pay day to land?"
      ]
    });
    configs.push({
      field: "firstJobSalary",
      label: "Salary",
      placeholder: "e.g. 30000",
      type: "number",
      getSageText: () => [
        "What is your starting gross annual salary? (Rough estimate is fine!)"
      ]
    });
  } else if (prof.lifeStage === "I'm still at uni") {
    configs.push({
      field: "uniDegreeYears",
      label: "Degree Length",
      type: "select",
      options: ["1 year", "2 years", "3 years", "4 years", "5+ years"],
      getSageText: () => [
        "University is a fantastic chapter!",
        "How many years is your degree program in total?"
      ]
    });
    configs.push({
      field: "uniStudyYear",
      label: "Current Year of Study",
      type: "select",
      options: ["1st year", "2nd year", "3rd year", "Final year", "Postgraduate"],
      getSageText: () => [
        "And which year of study are you in right now?"
      ]
    });
  } else if (prof.lifeStage === "I'm doing the freelance / self-employed thing") {
    configs.push({
      field: "freelanceIndustry",
      label: "Freelance Industry",
      placeholder: "e.g. Design, software development, marketing...",
      type: "text",
      getSageText: () => [
        "Freelancing offers so much freedom!",
        "What industry or field do you work in?"
      ]
    });
  } else if (prof.lifeStage === "I've been working for a year or two") {
    configs.push({
      field: "workingYearsRole",
      label: "Job Title / Role",
      placeholder: "e.g. Software Engineer, Teacher...",
      type: "text",
      getSageText: () => [
        "Awesome! A year or two of experience makes a big difference in finding your feet.",
        "What is your current job title or role?"
      ]
    });
    configs.push({
      field: "workingYearsPension",
      label: "Workplace Pension Scheme",
      type: "select",
      options: ["Yes, I'm contributing", "No, I opted out", "I don't know", "Not offered by employer"],
      getSageText: () => [
        "And are you currently contributing to your workplace pension scheme?"
      ]
    });
  } else if (prof.lifeStage === "I'm not working at the moment") {
    configs.push({
      field: "notWorkingFundsSource",
      label: "Primary Source of Funds",
      type: "select",
      options: ["Savings", "Family support", "Government benefits", "Student finance", "Other"],
      getSageText: () => [
        "Taking some time out or looking for the next step is completely normal.",
        "What is your primary source of funds right now?"
      ]
    });
  }

  // Q2: livingSituation
  if (prof.livingSituation === "Renting (just moved in, or about to)" || prof.livingSituation === "Renting (been here a while now)") {
    configs.push({
      field: "rentAmount",
      label: "Monthly Rent Amount",
      placeholder: "e.g. 750",
      type: "number",
      getSageText: () => [
        "Renting is usually a major expense.",
        "How much is your monthly rent (or your share of it)?"
      ]
    });
    configs.push({
      field: "tenancyLength",
      label: "Tenancy Agreement Length",
      type: "select",
      options: ["6 months", "12 months", "18 months", "24 months", "Other / Rolling"],
      getSageText: () => [
        "And how long is your tenancy agreement?"
      ]
    });
  } else if (prof.livingSituation === "Living at home with family") {
    configs.push({
      field: "familyRentBoard",
      label: "Monthly Rent/Board",
      placeholder: "e.g. 150",
      type: "number",
      getSageText: () => [
        "Living with family can be a great way to save.",
        "Do you contribute any rent or board monthly? (Type 0 if you don't pay anything)"
      ]
    });
  } else if (prof.livingSituation === "I own my place") {
    configs.push({
      field: "mortgagePayment",
      label: "Monthly Mortgage Payment",
      placeholder: "e.g. 950",
      type: "number",
      getSageText: () => [
        "Owning your own home is a massive milestone, congrats!",
        "How much is your monthly mortgage payment? (Type 0 if you have no mortgage)"
      ]
    });
    configs.push({
      field: "mortgageType",
      label: "Mortgage Rate Type",
      type: "select",
      options: ["Fixed rate", "Variable rate / Tracker", "No mortgage / Paid off", "Not sure"],
      getSageText: () => [
        "And is your mortgage currently on a fixed rate or a variable/tracker rate?"
      ]
    });
  } else if (prof.livingSituation === "Student accommodation") {
    configs.push({
      field: "studentRentAmount",
      label: "Monthly Rent Amount",
      placeholder: "e.g. 600",
      type: "number",
      getSageText: () => [
        "Student accommodation has its own unique setup.",
        "How much is your monthly rent (or share of it)?"
      ]
    });
    configs.push({
      field: "studentRentSource",
      label: "Rent Funding Source",
      type: "select",
      options: ["Maintenance loan", "Parents / Family", "Part-time job / Savings", "Scholarship / Grants"],
      getSageText: () => [
        "And how is your accommodation rent primarily funded?"
      ]
    });
  }

  // Q3: upcomingEvents
  if (prof.upcomingEvents?.includes("Starting a new job soon")) {
    if (!configs.some(c => c.field === "firstJobCompanyName")) {
      configs.push({
        field: "firstJobCompanyName",
        label: "Company Name",
        placeholder: "e.g. Google, NHS, Deloitte...",
        type: "text",
        getSageText: (name) => [
          `Congrats on starting a new job soon, **${name}**! That's exciting.`,
          "What is the name of the company or employer?"
        ]
      });
      configs.push({
        field: "firstJobStartDate",
        label: "Start Date",
        type: "date",
        getSageText: () => [
          "And when is your official start date?"
        ]
      });
      configs.push({
        field: "firstJobPayDate",
        label: "First Pay Date",
        type: "date",
        getSageText: () => [
          "Got it. And when do you expect your first payslip or pay day to land?"
        ]
      });
      configs.push({
        field: "firstJobSalary",
        label: "Salary",
        placeholder: "e.g. 30000",
        type: "number",
        getSageText: () => [
          "What is your starting gross annual salary? (It's fine to estimate)"
        ]
      });
    }
  }
  if (prof.upcomingEvents?.includes("Moving out for the very first time") || prof.upcomingEvents?.includes("Moving in with a partner")) {
    const isPartner = prof.upcomingEvents?.includes("Moving in with a partner") ?? false;
    if (!configs.some(c => c.field === "rentAmount")) {
      configs.push({
        field: "rentAmount",
        label: "Target Rent Budget",
        placeholder: "e.g. 800",
        type: "number",
        getSageText: () => [
          isPartner ? "Moving in with a partner is a huge step!" : "Moving out for the first time is a massive milestone!",
          "What is your target monthly rent budget (or your share of it)?"
        ]
      });
    }
    configs.push({
      field: "movingCity",
      label: "Target City / Area",
      placeholder: "e.g. London, Birmingham...",
      type: "text",
      getSageText: () => [
        "Which city or area are you planning to move to?"
      ]
    });
    configs.push({
      field: "movingTimeframe",
      label: "Target Timeframe",
      type: "select",
      options: ["Within a month", "In 2-3 months", "In 4-6 months", "Later this year"],
      getSageText: () => [
        "And what is your target timeframe for making the move?"
      ]
    });
  }
  if (prof.upcomingEvents?.includes("Thinking about buying a place")) {
    configs.push({
      field: "buyingLisa",
      label: "LISA Status",
      type: "select",
      options: ["Yes, I have one", "No, but I want to", "No, and don't plan to", "What's a LISA?"],
      getSageText: () => [
        "Thinking about buying a place is very exciting!",
        "Do you have a Lifetime ISA (LISA) open, or are you planning to open one?"
      ]
    });
    configs.push({
      field: "buyingBudget",
      label: "Target Buying Budget",
      placeholder: "e.g. 250000",
      type: "number",
      getSageText: () => [
        "To help customize your purchase timeline, what is your target buying budget?"
      ]
    });
    if (!configs.some(c => c.field === "movingCity")) {
      configs.push({
        field: "movingCity",
        label: "Target City / Area",
        placeholder: "e.g. London, Bristol...",
        type: "text",
        getSageText: () => [
          "Which city or area are you looking to buy in?"
        ]
      });
    }
  }
  if (prof.upcomingEvents?.includes("Having a baby (or just had one)")) {
    configs.push({
      field: "babySavingsFund",
      label: "Baby Savings Fund",
      type: "select",
      options: ["Yes, I have a dedicated fund", "Not yet, but starting soon", "No, planning to fund from monthly income", "I'm not sure yet"],
      getSageText: () => [
        "Congratulations, a new baby is a beautiful adventure!",
        "Do you have a dedicated savings fund set aside for baby costs?"
      ]
    });
  }
  if (prof.upcomingEvents?.includes("Getting a pay rise or switching roles")) {
    configs.push({
      field: "expectedNewSalary",
      label: "Expected New Salary",
      placeholder: "e.g. 35000",
      type: "number",
      getSageText: () => [
        "Congrats on the potential pay rise or role switch!",
        "What is your expected new gross annual salary?"
      ]
    });
  }
  if (prof.upcomingEvents?.includes("Buying a car")) {
    configs.push({
      field: "carTargetBudget",
      label: "Car Purchase Budget",
      placeholder: "e.g. 8000",
      type: "number",
      getSageText: () => [
        "Buying a car is a very common and exciting goal!",
        "What is your target budget for the car purchase?"
      ]
    });
    configs.push({
      field: "carPurchaseMethod",
      label: "Funding Method",
      type: "select",
      options: ["Cash savings", "Bank loan", "PCP / HP financing", "Family help"],
      getSageText: () => [
        "And how are you planning to fund the purchase?"
      ]
    });
  }

  return configs;
}

export function ExtraContextChatPopup({ isOpen, onClose }: ExtraContextChatPopupProps) {
  const { profile, updateProfile } = useProfile();
  const typewriterRef = useRef<{ skipCurrent: () => void }>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  const [questions] = useState<QuestionConfig[]>(() => {
    if (!profile) return [];
    const allConfigs = getQuestionConfigs(profile);
    return allConfigs.filter(cfg => {
      const val = profile[cfg.field];
      return val === undefined || val === null || val === "";
    });
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinishedScreen, setShowFinishedScreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentQuestion = questions[currentStep];

  // Set default / existing value if user goes back or we load next
  useEffect(() => {
    if (currentQuestion) {
      const val = profile?.[currentQuestion.field];
      if (val !== undefined && val !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInputValue(String(val));
      } else {
         
        setInputValue("");
      }
       
      setTypingComplete(false);
       
      setErrorMsg("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, currentQuestion]);

  // Auto scroll to bottom when typing is completed and input is revealed
  useEffect(() => {
    if (typingComplete) {
      const timer = setTimeout(scrollToBottom, 60);
      return () => clearTimeout(timer);
    }
  }, [typingComplete, scrollToBottom]);

  // Listen to visual viewport changes to dynamically center the modal above the keyboard on iOS
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      document.documentElement.style.setProperty('--extra-vv-height', `${vv.height}px`);
      document.documentElement.style.setProperty('--extra-vv-offset-top', `${vv.offsetTop}px`);
      // Keep input in view when visual viewport height changes due to keyboard showing/hiding
      setTimeout(scrollToBottom, 60);
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, [isOpen, scrollToBottom]);

  // Lock body scroll using position: fixed to prevent background layout scroll on iOS
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    
    // Save original styles
    const origPosition = document.body.style.position;
    const origTop = document.body.style.top;
    const origWidth = document.body.style.width;
    const origLeft = document.body.style.left;
    const origOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;

    // Apply fixed positioning to lock background scrolling
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.left = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.position = origPosition;
      document.body.style.top = origTop;
      document.body.style.width = origWidth;
      document.body.style.left = origLeft;
      document.body.style.overflow = origOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Prevent touchmove scrolling background on iOS when open
  useEffect(() => {
    if (!isOpen) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollEl = target.closest('.anp-scroll');

      if (scrollEl) {
        const el = scrollEl as HTMLElement;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY;

        // If at top and trying to scroll up
        if (el.scrollTop === 0 && deltaY > 0) {
          if (e.cancelable) e.preventDefault();
        }
        // If at bottom and trying to scroll down
        else if (el.scrollTop + el.clientHeight >= el.scrollHeight && deltaY < 0) {
          if (e.cancelable) e.preventDefault();
        }
      } else {
        const isInput = target.closest('textarea') || target.closest('input') || target.closest('select') || target.closest('button');
        if (!isInput) {
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  const handleSkipAll = () => {
    sessionStorage.setItem("anticipate_skipped_extra_details", "true");
    onClose();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleContinue = async () => {
    if (!currentQuestion) return;
    if (inputValue.trim().length === 0) return;

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await updateProfile({
        [currentQuestion.field]: inputValue.trim()
      });
      if (currentStep < questions.length - 1) {
        setCurrentStep(prev => prev + 1);
        setInputValue("");
      } else {
        // All finished!
        setShowFinishedScreen(true);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to save details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOption = (opt: string) => {
    setInputValue(opt);
  };

  // Determine if Continue button is active
  const isValid = inputValue.trim().length > 0;

  // Render question text
  const rawParagraphs = useMemo(() => {
    if (showFinishedScreen) {
      return [
        `All set! Thanks, **${profile?.firstName || "Maya"}**!`,
        "I've got to know you a bit better now.",
        "This will help me customize your lessons, milestones, and timeline recommendations perfectly."
      ];
    }
    return currentQuestion
      ? currentQuestion.getSageText(profile?.firstName || "Maya")
      : [];
  }, [showFinishedScreen, currentQuestion, profile?.firstName]);

  // Prefix greeting for the very first step
  const sageParagraphs = useMemo(() => {
    if (currentStep === 0 && !showFinishedScreen) {
      return [
        `Hey **${profile?.firstName || "there"}**! Before you get started, I just want to grab some extra details to get more context about you.`,
        ...rawParagraphs
      ];
    }
    return rawParagraphs;
  }, [currentStep, showFinishedScreen, rawParagraphs, profile?.firstName]);

  const totalSteps = questions.length;

  if (!isOpen || !profile) return null;

  return (
    <div
      className="extra-popup-overlay"
      onClick={() => {
        if (!typingComplete) {
          typewriterRef.current?.skipCurrent();
        }
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(28, 26, 36, 0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 2000,
        cursor: !typingComplete ? "pointer" : "default",
        overflow: "hidden"
      }}
    >
      <div
        className="extra-popup-viewport-wrapper"
        style={{
          position: "absolute",
          top: "var(--extra-vv-offset-top, 0px)",
          left: 0,
          right: 0,
          height: "var(--extra-vv-height, 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "max(20px, env(safe-area-inset-top)) 20px 20px 20px",
          boxSizing: "border-box"
        }}
      >
        <div
          className="extra-popup-card"
          onClick={(e) => {
            if (!typingComplete) {
              typewriterRef.current?.skipCurrent();
            }
            e.stopPropagation();
          }}
          style={{
            width: "100%",
            maxWidth: "360px",
            height: "100%",
            maxHeight: "min(580px, calc(var(--extra-vv-height, 100vh) - max(20px, env(safe-area-inset-top)) - 40px))",
            background: "var(--p-bg-2)",
            border: "1.5px solid var(--p-line-2)",
            borderRadius: "28px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 16px 48px rgba(28, 26, 36, 0.18)",
            position: "relative",
            animation: "anp-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
        {/* Header bar */}
        <div style={{ padding: "18px 20px 14px", flexShrink: 0, borderBottom: "1px solid var(--p-line)", background: "var(--p-bg-2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "var(--p-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", textTransform: "lowercase", color: "var(--p-ink)" }}>
              anticipate.
            </div>
          {!showFinishedScreen && (
            <button
              onClick={handleSkipAll}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--p-coral)",
                fontFamily: "var(--p-sans)",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 8px"
              }}
            >
              Skip for now
            </button>
          )}
        </div>
        {/* Step indicator */}
        {!showFinishedScreen && totalSteps > 0 && (
          <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 14 }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: i <= currentStep ? "var(--p-coral)" : "var(--p-line)",
                  transition: "all 0.25s"
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div ref={scrollContainerRef} className="anp-scroll" style={{ flex: 1, padding: "20px 20px 24px", overscrollBehavior: "contain" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PopupTypewriterMessage
            ref={typewriterRef}
            key={showFinishedScreen ? "finish" : currentStep}
            paragraphs={sageParagraphs}
            onComplete={() => setTypingComplete(true)}
          />

          {typingComplete && !showFinishedScreen && currentQuestion && (
            <div style={{ animation: "anp-fade-in 0.3s ease both" }}>
              {/* Inputs based on type */}
              {currentQuestion.type === "text" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <input
                    style={{
                      width: "100%",
                      background: "#fff",
                      border: "1.5px solid var(--p-line)",
                      borderRadius: "var(--r-md)",
                      padding: "12px 14px",
                      fontSize: 16,
                      color: "var(--p-ink)",
                      outline: "none",
                      fontFamily: "var(--p-sans)",
                      transition: "border-color 0.15s"
                    }}
                    placeholder={currentQuestion.placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
              )}

              {currentQuestion.type === "number" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: 12, color: "var(--p-ink-3)", fontWeight: 600, fontSize: 16 }}>£</span>
                    <input
                      style={{
                        width: "100%",
                        background: "#fff",
                        border: "1.5px solid var(--p-line)",
                        borderRadius: "var(--r-md)",
                        padding: "12px 14px 12px 28px",
                        fontSize: 16,
                        color: "var(--p-ink)",
                        outline: "none",
                        fontFamily: "var(--p-sans)",
                        transition: "border-color 0.15s"
                      }}
                      inputMode="numeric"
                      placeholder={currentQuestion.placeholder}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value.replace(/[^0-9.]/g, ""))}
                    />
                  </div>
                </div>
              )}

              {currentQuestion.type === "date" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "#ffffff",
                      border: "1.5px solid var(--p-line)",
                      borderRadius: "var(--r-md)",
                      padding: "12px 14px",
                    }}
                  >
                    <AppIcon name="calendar" size={18} stroke={2} style={{ color: "var(--p-ink-3)" }} />
                    <input
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontFamily: "var(--p-sans)",
                        fontSize: 16,
                        width: "100%",
                        color: "var(--p-ink)",
                      }}
                      type="date"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {currentQuestion.type === "select" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {currentQuestion.options?.map((opt) => {
                    const active = inputValue === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        style={{
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
                        }}
                      >
                        <span>{opt}</span>
                        {active && <AppIcon name="check" size={14} stroke={2.4} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom action panel */}
      {typingComplete && (
        <div style={{ padding: "12px 20px max(20px, env(safe-area-inset-bottom)) 20px", flexShrink: 0, borderTop: "1px solid var(--p-line)", background: "var(--p-card)", animation: "anp-fade-in 0.3s ease both" }}>
          {errorMsg && (
            <p style={{ fontSize: 13, color: "#c0392b", fontFamily: "var(--p-sans)", textAlign: "center", marginBottom: 10, marginTop: 0, fontWeight: 500 }}>
              {errorMsg}
            </p>
          )}
          {showFinishedScreen ? (
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "15px",
                background: "var(--p-ink)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontFamily: "var(--p-display)",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 0 #08070a",
                transition: "all 0.15s ease"
              }}
            >
              <span>Get Started</span>
              <AppIcon name="arrowRight" size={16} stroke={2} />
            </button>
          ) : (
            <>
              <button
                disabled={!isValid || isSubmitting}
                onClick={handleContinue}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: isValid && !isSubmitting ? "var(--p-ink)" : "var(--p-line)",
                  color: isValid && !isSubmitting ? "#fff" : "var(--p-ink-3)",
                  border: "none",
                  borderRadius: 14,
                  fontFamily: "var(--p-display)",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: isValid && !isSubmitting ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: isValid && !isSubmitting ? "0 4px 0 #08070a" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                <span>{isSubmitting ? "Saving..." : "Continue"}</span>
                {!isSubmitting && <AppIcon name="arrowRight" size={16} stroke={2} />}
              </button>

              {currentStep > 0 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <button
                    onClick={handleBack}
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
                </div>
              )}
            </>
          )}
        </div>
      )}
      <style>{`
        @keyframes anp-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes anp-slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
        @media (max-width: 600px) {
          .extra-popup-card {
            max-width: 100% !important;
            border-radius: 0 !important;
            max-height: 100% !important;
          }
          .extra-popup-viewport-wrapper {
            padding: 0 !important;
          }
        }
      `}</style>
      </div>
      </div>
    </div>
  );
}
