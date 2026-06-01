import { useState } from "react";
import { useNavigate } from "react-router";
import { FileText, BookOpen, Receipt, Landmark } from "lucide-react";
import { PayslipDocument } from "./PayslipDocument";

type Document = {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: React.ReactNode;
  color: string;
};

const DOCUMENTS: Document[] = [
  {
    id: "payslip",
    title: "Monthly payslip",
    description: "Understand gross pay, deductions, tax codes and what actually hits your bank.",
    tag: "Employment",
    icon: <Receipt size={24} />,
    color: "mint",
  },
  {
    id: "tenancy",
    title: "Tenancy agreement",
    description: "Break down rental contracts, deposit rules, and your rights as a tenant.",
    tag: "Housing",
    icon: <Landmark size={24} />,
    color: "gold",
  },
];

export function DecoderPage() {
  const navigate = useNavigate();
  const [openDoc, setOpenDoc] = useState<string | null>(null);

  if (openDoc === "payslip") {
    return <PayslipDocument onBack={() => setOpenDoc(null)} />;
  }

  return (
    <div className="anp-app anp-lessons-bg">
      <div className="anp-spacer" />

      <div className="anp-top" style={{ paddingBottom: 0 }}>
        <div className="anp-logo">anticipate.</div>
      </div>

      <div className="anp-scroll">
        <div style={{ padding: "8px 20px 24px" }}>
          <h1 className="anp-wordmark" style={{ fontSize: "28px", marginBottom: "8px", letterSpacing: "-0.03em" }}>
            Decoder
          </h1>
          <p style={{ color: "var(--p-ink-2)", fontSize: "14px", lineHeight: "1.5", opacity: 0.8 }}>
            Practice reading realistic financial documents ahead of time.
            Tap any highlighted word to get a plain-English definition.
          </p>
        </div>

        <div className="anp-l-tracks">
          {DOCUMENTS.map((doc) => {
            const isAvailable = doc.id === "payslip";
            return (
              <div
                key={doc.id}
                className={`anp-l-track ${isAvailable ? "active" : "locked"} ${doc.color}`}
                onClick={() => (isAvailable ? setOpenDoc(doc.id) : null)}
              >
                <div className="anp-l-track-num">
                  {doc.icon}
                </div>

                <div className="anp-l-track-body">
                  <div className="anp-l-track-title">
                    {doc.title}
                    {isAvailable && <span className="now-tag">READY</span>}
                  </div>
                  <div className="anp-l-track-sub">
                    {doc.description}
                  </div>
                  {!isAvailable && (
                    <div className="anp-l-track-meta">
                      <span className="lock-meta">Coming soon</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 60 }} />
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
