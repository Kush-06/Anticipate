import { useParams, useNavigate } from "react-router";
import { decoderDocuments } from "../data/decoder";
import type { DecoderTerm } from "../data/decoder";
import { useState } from "react";
import { useDragToDismiss } from "./useDragToDismiss";

export function DocumentViewer() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  
  const doc = decoderDocuments.find((d) => d.id === docId);
  const [selectedTerm, setSelectedTerm] = useState<DecoderTerm | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipDrag = useDragToDismiss(() => closeTooltip(), showTooltip);

  if (!doc) {
    return (
      <div className="anp-doc-view">
        <div className="anp-doc-view__topbar">
          <button className="anp-doc-view__back" onClick={() => navigate("/decoder")} aria-label="Back to library">
            ‹
          </button>
          <span className="anp-doc-view__title">Document Not Found</span>
        </div>
        <div className="anp-doc-view__scroll" style={{ textAlign: "center", color: "var(--p-ink-3)" }}>
          <p>This document could not be found or is unavailable.</p>
        </div>
      </div>
    );
  }

  const openTooltip = (term: DecoderTerm) => {
    setSelectedTerm(term);
    setShowTooltip(true);
  };

  const closeTooltip = () => {
    setShowTooltip(false);
  };

  // Helper to highlight terms inside text
  const renderInteractiveText = (text: string, terms: DecoderTerm[]) => {
    if (terms.length === 0) return text;
    
    // Find all occurrences and build a list of segments
    // Filter and sort terms by where they appear in the text to avoid conflicts
    const sortedTerms = [...terms]
      .filter((t) => text.includes(t.phrase))
      .sort((a, b) => text.indexOf(a.phrase) - text.indexOf(b.phrase));

    if (sortedTerms.length === 0) return text;

    const segments: React.ReactNode[] = [];
    let currentIndex = 0;

    sortedTerms.forEach((term, idx) => {
      const termIndex = text.indexOf(term.phrase, currentIndex);
      if (termIndex === -1) return;

      // Add preceding plain text
      if (termIndex > currentIndex) {
        segments.push(text.substring(currentIndex, termIndex));
      }

      // Add highlighted interactive span
      let className = "anp-term";
      if (term.type === "flag") {
        className += " anp-term--flag";
      } else if (term.type === "definition") {
        className += " anp-term--definition";
      } else if (term.type === "positive") {
        className += " anp-term--positive";
      }
      if (selectedTerm && selectedTerm.phrase === term.phrase) {
        className += " anp-term--selected";
      }

      segments.push(
        <span
          key={`${term.phrase}-${idx}`}
          className={className}
          onClick={(e) => {
            e.stopPropagation();
            openTooltip(term);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              openTooltip(term);
            }
          }}
        >
          {term.phrase}
        </span>
      );

      currentIndex = termIndex + term.phrase.length;
    });

    // Add trailing plain text
    if (currentIndex < text.length) {
      segments.push(text.substring(currentIndex));
    }

    return segments;
  };

  const [isExiting, setIsExiting] = useState(false);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => navigate("/decoder"), 250);
  };

  return (
    <div className={`anp-doc-view anp-screen-forward ${isExiting ? "anp-screen-backward" : ""}`} style={{ position: "relative" }}>
      {/* Topbar */}
      <div className="anp-doc-view__topbar">
        <button className="anp-doc-view__back" onClick={handleBack} aria-label="Back to library">
          ‹
        </button>
        <span className="anp-doc-view__title">{doc.title}</span>
        {doc.flagsCount > 0 && (
          <span className="anp-doc-view__flags-badge">
            ⚠️ {doc.flagsCount} flags
          </span>
        )}
      </div>

      {/* Instructions bar */}
      <div className="anp-doc-view__instruction">
        👉 Tap any underlined text to understand it
      </div>

      {/* Main text area */}
      <div className="anp-doc-view__scroll">
        <div className="anp-doc-view__paper">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, marginBottom: "16px", borderBottom: "1.5px solid var(--p-line)", paddingBottom: "10px" }}>
            {doc.title}
          </h2>
          
          {doc.sections.map((section, idx) => (
            <div key={idx} className="anp-doc-view__section">
              <h3 className="anp-doc-view__section-title">{section.title}</h3>
              <p className="anp-doc-view__section-text">
                {renderInteractiveText(section.content, section.terms)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom footer with View Summary button */}
      <div className="anp-doc-view__footer">
        <button
          className="anp-doc-view__summary-btn"
          onClick={() => navigate(`/decoder/summary/${doc.id}`)}
        >
          📊 View Summary Report
        </button>
      </div>

      {/* Bottom Tooltip Sheet */}
      <div
        className={`anp-tooltip-overlay ${showTooltip ? "anp-tooltip-overlay--visible" : ""}`}
        onClick={closeTooltip}
      />
      
      <div 
        className={`anp-tooltip ${showTooltip ? "anp-tooltip--visible" : ""}`}
        onTouchStart={tooltipDrag.onTouchStart}
        onTouchMove={tooltipDrag.onTouchMove}
        onTouchEnd={tooltipDrag.onTouchEnd}
        style={tooltipDrag.style}
      >
        {selectedTerm && (
          <>
            <div className="anp-tooltip__header">
              <span className={`anp-tooltip__type-badge anp-tooltip__type-badge--${selectedTerm.type}`}>
                {selectedTerm.type === "flag" && "⚠️ Flag"}
                {selectedTerm.type === "definition" && "📖 Definition"}
                {selectedTerm.type === "positive" && "✅ Positive"}
              </span>
              <button 
                onClick={closeTooltip}
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  fontSize: "20px", 
                  color: "var(--p-ink-3)", 
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
                aria-label="Close details"
              >
                ×
              </button>
            </div>
            
            <div>
              <h4 className="anp-tooltip__phrase">{selectedTerm.phrase}</h4>
              <p className="anp-tooltip__explanation">{selectedTerm.explanation}</p>
            </div>
            
            <div className="anp-tooltip__buttons">
              <button
                className="anp-tooltip__btn anp-tooltip__btn--dismiss"
                onClick={closeTooltip}
              >
                Dismiss
              </button>
              {selectedTerm.lessonPath && (
                <button
                  className="anp-tooltip__btn anp-tooltip__btn--learn"
                  onClick={() => {
                    closeTooltip();
                    navigate(selectedTerm.lessonPath!);
                  }}
                >
                  Learn More
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
