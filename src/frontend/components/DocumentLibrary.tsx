import { useNavigate } from "react-router";
import { decoderDocuments } from "../data/decoder";
import { useState } from "react";
import { AnticipateLogo } from "./RobotIcon";
import { TopicIllustration } from "./TopicIllustration";

export function DocumentLibrary() {
  const navigate = useNavigate();
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);

  const handleCardClick = (id: string, status: string) => {
    if (status === "Locked") {
      setLockedMsg("This document is locked! Complete more lessons in the Learn section to unlock it.");
      setTimeout(() => setLockedMsg(null), 3000);
      return;
    }
    navigate(`/decoder/view/${id}`);
  };

  return (
    <div className="anp-doc-lib">
      {/* Header */}
      <div className="anp-home__header" style={{ paddingBottom: "12px" }}>
        <AnticipateLogo />
        <p className="anp-home__eyebrow">Financial Decoder</p>
        <h1 className="anp-home__title" style={{ marginBottom: "4px" }}>Document Decoder</h1>
        <p className="anp-doc-card__subtitle" style={{ textAlign: "center", margin: "4px 16px 0", color: "var(--p-ink-3)" }}>
          Decode the jargon in your payslips, contracts, and financial documents.
        </p>
      </div>

      {/* Lock alert banner if active */}
      {lockedMsg && (
        <div 
          style={{
            margin: "0 16px 12px",
            padding: "10px 14px",
            background: "var(--p-coral-tint)",
            border: "1.5px solid var(--p-coral)",
            borderRadius: "var(--r-md)",
            color: "var(--p-ink)",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "pulse-halo 2s infinite"
          }}
        >
          <span>🔒</span>
          <span>{lockedMsg}</span>
        </div>
      )}

      {/* Scrollable list */}
      <div className="anp-doc-lib__scroll">
        <p className="anp-home__section-label">Select a document</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {decoderDocuments.map((doc, idx) => {
            const isLocked = doc.status === "Locked";
            const badgeClass = `anp-badge anp-badge--${doc.status.toLowerCase()}`;

            return (
              <div
                key={doc.id}
                className={`anp-doc-card anp-card-animate ${isLocked ? "anp-doc-card--locked" : ""}`}
                style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
                onClick={() => handleCardClick(doc.id, doc.status)}
                role="button"
                tabIndex={isLocked ? -1 : 0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleCardClick(doc.id, doc.status);
                  }
                }}
              >
                {/* Icon wrapper */}
                <TopicIllustration iconName={doc.title} size={44} />

                {/* Card body */}
                <div className="anp-doc-card__body">
                  <div className="anp-doc-card__title">
                    {doc.title}
                  </div>
                  <div className="anp-doc-card__subtitle">
                    {doc.subtitle}
                  </div>
                  
                  {/* Badge & Info strip */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "between", width: "100%" }}>
                    <span className={badgeClass}>{doc.status}</span>
                    
                    {!isLocked && doc.flagsCount > 0 && (
                      <span 
                        style={{ 
                          fontSize: "11px", 
                          color: "var(--p-coral)", 
                          fontWeight: 700, 
                          fontFamily: "var(--font-display)",
                          marginLeft: "auto"
                        }}
                      >
                        ⚠️ {doc.flagsCount} flags
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
