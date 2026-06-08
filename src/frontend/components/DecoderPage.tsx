import { useState } from "react";
import { useNavigate } from "react-router";
import { Receipt, Landmark, Home, Mail, Calculator, GraduationCap } from "lucide-react";
import { PayslipDocument } from "./decoderDocs/PayslipDocument";
import { TenancyAgreement } from "./decoderDocs/TenancyAgreement";
import { MortgageESIS } from "./decoderDocs/MortgageESIS";
import { PensionWelcomeLetter } from "./decoderDocs/PensionWelcomeLetter";
import { SA302TaxCalc } from "./decoderDocs/SA302TaxCalc";
import { StudentLoanStatement } from "./decoderDocs/StudentLoanStatement";

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
    id: "student-loan",
    title: "Student loan",
    description: "Plan 2 statements, interest rates, thresholds and the 30-year write-off.",
    tag: "Education",
    icon: <GraduationCap size={24} />,
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

const DOCUMENT_COMPONENTS: Record<string, React.ComponentType<{ onBack: () => void }>> = {
  payslip: PayslipDocument,
  tenancy: TenancyAgreement,
  "student-loan": StudentLoanStatement,
  mortgage: MortgageESIS,
  pension: PensionWelcomeLetter,
  tax: SA302TaxCalc,
};

export function DecoderPage() {
  const navigate = useNavigate();
  const [openDoc, setOpenDoc] = useState<string | null>(null);

  if (openDoc && DOCUMENT_COMPONENTS[openDoc]) {
    const SelectedDoc = DOCUMENT_COMPONENTS[openDoc];
    return <SelectedDoc onBack={() => setOpenDoc(null)} />;
  }

  return (
    <div className="anp-app anp-lessons-bg">
      <div className="anp-spacer" />

      <div className="anp-top" style={{ paddingBottom: 0 }}>
        <div className="anp-logo">anticipate.</div>
      </div>

      <div className="anp-scroll" style={{ 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        <style>{`
          .anp-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
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
    </div>
  );
}
