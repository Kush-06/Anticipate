import { useState } from "react";
import { useNavigate } from "react-router";
import { useTimeline } from "../context/TimelineContext";
import { SageAvatar } from "./SageAvatar";

export function DayAfterCheckIn() {
  const navigate = useNavigate();
  const { advanceActiveStep } = useTimeline();

  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [selectedConfusions, setSelectedConfusions] = useState<string[]>([]);

  const feelings = ["Made sense", "A bit confusing", "Really confusing", "Lower than expected"];
  const confusions = ["NI contributions", "Tax code", "Pension deduction", "Student loan", "All fine actually"];

  const handleToggleConfusion = (opt: string) => {
    if (opt === "All fine actually") {
      setSelectedConfusions(["All fine actually"]);
      return;
    }

    setSelectedConfusions((prev) => {
      const filtered = prev.filter((o) => o !== "All fine actually");
      if (filtered.includes(opt)) {
        return filtered.filter((o) => o !== opt);
      } else {
        return [...filtered, opt];
      }
    });
  };

  const [isExiting, setIsExiting] = useState(false);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => navigate(-1), 250);
  };

  const handleDone = () => {
    // Generate custom Sage advice banner based on answers
    let feedback = "Nice job on checking in! Let's get ahead with pension auto-enrolment next.";
    
    if (selectedConfusions.includes("NI contributions")) {
      feedback = "I see National Insurance is a bit confusing. I have highlighted the National Insurance lesson for you. Let's tackle that soon.";
    } else if (selectedConfusions.includes("Tax code")) {
      feedback = "Tax codes are tricky! I have bumped up the tax codes explanation to the top of your list.";
    } else if (selectedConfusions.includes("Pension deduction")) {
      feedback = "Pensions are a long-term win! I have set auto-enrolment as the next active step in your timeline.";
    }

    advanceActiveStep("first-job", feedback);
    setIsExiting(true);
    setTimeout(() => navigate(-1), 250); // Return to timeline
  };

  return (
    <div className={`anp-doc-sum anp-screen-forward ${isExiting ? "anp-screen-backward" : ""}`} style={{ background: "var(--p-bg)", position: "relative" }}>
      {/* Header */}
      <div className="anp-doc-sum__topbar" style={{ paddingBottom: "10px" }}>
        <button
          className="anp-doc-sum__back"
          onClick={handleBack}
          aria-label="Go back"
        >
          ‹
        </button>
        <span className="anp-doc-sum__title">Day-After Check-in</span>
      </div>

      {/* Scrollable Container */}
      <div className="anp-doc-sum__scroll" style={{ paddingBottom: "90px" }}>
        
        {/* Sage Introduction card */}
        <div className="anp-sage-card">
          <SageAvatar size={68} />
          <div className="anp-sage-card__bubble">
            <div className="anp-sage-card__name">Sage Check-in</div>
            <p className="anp-sage-card__text">
              Yesterday was a big one. Your first ever salary. How did it actually feel opening that payslip?
            </p>
          </div>
        </div>

        {/* Question Card 1 */}
        <div 
          style={{
            background: "var(--p-card)",
            border: "1.5px solid var(--p-line)",
            borderRadius: "var(--r-xl)",
            padding: "16px",
            boxShadow: "var(--shadow-card)"
          }}
        >
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--p-ink)", marginBottom: "2px" }}>
            How did your first payslip feel?
          </h3>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--p-ink-3)", marginBottom: "12px" }}>
            Sage uses this to know what to focus on next
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {feelings.map((opt) => {
              const isSelected = selectedFeeling === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setSelectedFeeling(opt)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--r-pill)",
                    border: isSelected ? "1.5px solid var(--p-plum)" : "1.5px solid var(--p-line)",
                    background: isSelected ? "var(--p-plum-tint)" : "var(--p-card)",
                    color: "var(--p-ink)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card 2 */}
        <div 
          style={{
            background: "var(--p-card)",
            border: "1.5px solid var(--p-line)",
            borderRadius: "var(--r-xl)",
            padding: "16px",
            boxShadow: "var(--shadow-card)"
          }}
        >
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--p-ink)", marginBottom: "2px" }}>
            Anything specific that confused you?
          </h3>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--p-ink-3)", marginBottom: "12px" }}>
            Optional. Helps Sage personalise your next lesson
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {confusions.map((opt) => {
              const isSelected = selectedConfusions.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => handleToggleConfusion(opt)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--r-pill)",
                    border: isSelected ? "1.5px solid var(--p-plum)" : "1.5px solid var(--p-line)",
                    background: isSelected ? "var(--p-plum-tint)" : "var(--p-card)",
                    color: "var(--p-ink)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sage bottom context message */}
        <div className="anp-sage-card" style={{ borderStyle: "dashed" }}>
          <SageAvatar size={68} />
          <div className="anp-sage-card__bubble">
            <p className="anp-sage-card__text" style={{ fontSize: "12px" }}>
              Based on what you tell me I will update what is next in your track. Nothing is locked in, you can always change direction.
            </p>
          </div>
        </div>

      </div>

      {/* Done Button Bar */}
      <div className="anp-doc-view__footer">
        <button
          className="anp-doc-view__summary-btn"
          onClick={handleDone}
          disabled={!selectedFeeling}
          style={{
            background: !selectedFeeling ? "var(--p-line)" : "var(--p-plum)",
            color: !selectedFeeling ? "var(--p-ink-4)" : "white",
            cursor: !selectedFeeling ? "not-allowed" : "pointer"
          }}
        >
          Done
        </button>
      </div>

    </div>
  );
}
