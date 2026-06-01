import { useState } from "react";
import { useNavigate } from "react-router";
import { FileText, BookOpen, Receipt, Landmark, Home, Mail, Calculator } from "lucide-react";
import { PayslipDocument } from "./PayslipDocument";
import { TenancyAgreement } from "./TenancyAgreement";
import { MortgageESIS } from "./MortgageESIS";
import { PensionWelcomeLetter } from "./PensionWelcomeLetter";
import { SA302TaxCalc } from "./SA302TaxCalc";

type Document = {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: React.ReactNode;
};

const DOCUMENTS: Document[] = [
  {
    id: "payslip",
    title: "Monthly payslip",
    description: "Understand gross pay, deductions, tax codes and what actually hits your bank.",
    tag: "Employment",
    icon: <Receipt size={24} />,
  },
  {
    id: "tenancy",
    title: "Tenancy agreement",
    description: "Break down rental contracts, deposit rules, and your rights as a tenant.",
    tag: "Housing",
    icon: <Home size={24} />,
  },
  {
    id: "mortgage",
    title: "Mortgage (ESIS)",
    description: "Compare mortgage costs, APRC, fees, and early repayment charges.",
    tag: "Property",
    icon: <Landmark size={24} />,
  },
  {
    id: "pension",
    title: "Pension letter",
    description: "Auto-enrolment details, employer contributions, and opt-out rights.",
    tag: "Future",
    icon: <Mail size={24} />,
  },
  {
    id: "tax",
    title: "Tax calculation",
    description: "SA302 summary for self-assessment, NI, and payments on account.",
    tag: "Tax",
    icon: <Calculator size={24} />,
  },
];

export function DecoderPage() {
  const navigate = useNavigate();
  const [openDoc, setOpenDoc] = useState<string | null>(null);

  if (openDoc === "payslip") return <PayslipDocument onBack={() => setOpenDoc(null)} />;
  if (openDoc === "tenancy") return <TenancyAgreement onBack={() => setOpenDoc(null)} />;
  if (openDoc === "mortgage") return <MortgageESIS onBack={() => setOpenDoc(null)} />;
  if (openDoc === "pension") return <PensionWelcomeLetter onBack={() => setOpenDoc(null)} />;
  if (openDoc === "tax") return <SA302TaxCalc onBack={() => setOpenDoc(null)} />;

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
          {DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="anp-l-track active"
              onClick={() => setOpenDoc(doc.id)}
            >
              <div className="anp-l-track-num">
                {doc.icon}
              </div>

              <div className="anp-l-track-body">
                <div className="anp-l-track-title">
                  {doc.title}
                  <span className="now-tag">READY</span>
                </div>
                <div className="anp-l-track-sub">
                  {doc.description}
                </div>
              </div>
            </div>
          ))}
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
