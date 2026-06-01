import { useNavigate } from "react-router";
import { FileText, BookOpen } from "lucide-react";

export function DecoderPage() {
  const navigate = useNavigate();

  return (
    <div className="anp-app anp-lessons-bg">
      <div className="anp-spacer" />

      <div className="anp-top">
        <div className="anp-logo">anticipate.</div>
      </div>

      <div className="anp-scroll">
        <div style={{ padding: "24px 20px" }}>
          <h1 className="anp-wordmark" style={{ fontSize: "24px", marginBottom: "16px" }}>Decoder</h1>
          <p style={{ color: "var(--p-ink-2)" }}>
            Practice reading realistic financial documents ahead of time.
          </p>
        </div>
      </div>

      <div className="anp-bottom-nav">
        <button className="anp-bottom-nav__tab anp-bottom-nav__tab--active" onClick={() => navigate("/decoder")}>
          <FileText size={22} />
          <span className="anp-bottom-nav__label">Decoder</span>
        </button>
        <button className="anp-bottom-nav__tab" onClick={() => navigate("/")}>
          <BookOpen size={22} />
          <span className="anp-bottom-nav__label">Learn</span>
        </button>
      </div>
    </div>
  );
}
