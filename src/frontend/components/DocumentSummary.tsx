import { useParams, useNavigate } from "react-router";
import { decoderDocuments } from "../data/decoder";
import { useState } from "react";
import { SageAvatar } from "./SageAvatar";

export function DocumentSummary() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();

  const doc = decoderDocuments.find((d) => d.id === docId);

  if (!doc) {
    return (
      <div className="anp-doc-sum">
        <div className="anp-doc-sum__topbar">
          <button className="anp-doc-sum__back" onClick={() => navigate("/decoder")} aria-label="Back to library">
            ‹
          </button>
          <span className="anp-doc-sum__title">Summary Not Found</span>
        </div>
        <div className="anp-doc-sum__scroll" style={{ textAlign: "center", color: "var(--p-ink-3)" }}>
          <p>This document summary could not be found.</p>
        </div>
      </div>
    );
  }

  const [isExiting, setIsExiting] = useState(false);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => navigate(`/decoder/view/${doc.id}`), 250);
  };

  return (
    <div className={`anp-doc-sum anp-screen-forward ${isExiting ? "anp-screen-backward" : ""}`}>
      {/* Topbar */}
      <div className="anp-doc-sum__topbar">
        <button
          className="anp-doc-sum__back"
          onClick={handleBack}
          aria-label="Back to document"
        >
          ‹
        </button>
        <span className="anp-doc-sum__title">{doc.title} Summary</span>
      </div>

      {/* Summary Scrollable Area */}
      <div className="anp-doc-sum__scroll">
        {/* Top Sage Verdict Card */}
        <div className="anp-sage-card">
          <SageAvatar size={68} />
          <div className="anp-sage-card__bubble">
            <div className="anp-sage-card__name">Sage Verdict</div>
            <p className="anp-sage-card__text">{doc.verdict}</p>
          </div>
        </div>

        {/* Flagged Items List */}
        <div className="anp-sum-flags">
          <h3 className="anp-sum-flags__title">Key Takeaways</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {doc.flaggedItems.map((item, idx) => (
              <div key={idx} className="anp-sum-flag-item">
                <span className={`anp-sum-flag-item__dot anp-sum-flag-item__dot--${item.severity}`} />
                <div className="anp-sum-flag-item__content">
                  <h4 className="anp-sum-flag-item__title">{item.title}</h4>
                  <p className="anp-sum-flag-item__desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Good vs Typical Comparison Card (if exists) */}
        {doc.comparison && (
          <div className="anp-comp-card">
            <div className="anp-comp-card__header">
              ⚖️ Comparison: {doc.comparison.title}
            </div>
            <div className="anp-comp-card__grid">
              {/* This document column (Red) */}
              <div className="anp-comp-card__col">
                <span className="anp-comp-card__col-title anp-comp-card__col-title--red">
                  {doc.comparison.thisDoc.title}
                </span>
                <h4 className="anp-comp-card__clause">{doc.comparison.thisDoc.clause}</h4>
                <p className="anp-comp-card__desc">{doc.comparison.thisDoc.description}</p>
              </div>

              {/* Typical column (Green) */}
              <div className="anp-comp-card__col">
                <span className="anp-comp-card__col-title anp-comp-card__col-title--green">
                  {doc.comparison.typical.title}
                </span>
                <h4 className="anp-comp-card__clause">{doc.comparison.typical.clause}</h4>
                <p className="anp-comp-card__desc">{doc.comparison.typical.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Sage Suggestion & Action Buttons */}
        <div className="anp-doc-sum__footer">
          <div className="anp-sage-card" style={{ borderStyle: "dashed" }}>
            <SageAvatar size={68} />
            <div className="anp-sage-card__bubble">
              <div className="anp-sage-card__name">Suggested Lesson</div>
              <p className="anp-sage-card__text">{doc.suggestedLesson.message}</p>
            </div>
          </div>

          <div className="anp-doc-sum__buttons">
            <button
              className="anp-doc-sum__btn anp-doc-sum__btn--skip"
              onClick={() => navigate("/decoder")}
            >
              Skip for now
            </button>
            <button
              className="anp-doc-sum__btn anp-doc-sum__btn--show"
              onClick={() => navigate(doc.suggestedLesson.path)}
            >
              Yes, show me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
