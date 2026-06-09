import { useState, useContext } from "react";
import { useSearchParams } from "react-router";
import { Receipt, Landmark, Home, Mail, Calculator, GraduationCap, ChevronDown } from "lucide-react";
import { PayslipDocument } from "./decoderDocs/PayslipDocument";
import { TenancyAgreement } from "./decoderDocs/TenancyAgreement";
import { MortgageESIS } from "./decoderDocs/MortgageESIS";
import { PensionWelcomeLetter } from "./decoderDocs/PensionWelcomeLetter";
import { SA302TaxCalc } from "./decoderDocs/SA302TaxCalc";
import { StudentLoanStatement } from "./decoderDocs/StudentLoanStatement";
import { TopBar } from "./TopBar";
import { SageAvatar } from "./SageAvatar";
import { ProfileContext, type UserProfile } from "../context/ProfileContext";

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

function getRecommendedDocuments(profile: UserProfile | null): string[] {
  if (!profile) return ["payslip"]; // default suggestion if no profile
  
  const recs: string[] = [];
  
  // 1. Payslip
  if (
    profile.lifeStage === "I've just started my first proper job" ||
    profile.upcomingEvents?.includes("Starting a new job soon") ||
    profile.upcomingEvents?.includes("Getting a pay rise or switching roles") ||
    profile.sixMonthGoal?.includes("tax") ||
    profile.sixMonthGoal?.includes("payslip") ||
    profile.firstJobCompanyName ||
    profile.salary
  ) {
    recs.push("payslip");
  }
  
  // 2. Tenancy
  if (
    profile.livingSituation?.includes("Renting") ||
    profile.upcomingEvents?.includes("Moving out for the very first time") ||
    profile.upcomingEvents?.includes("Moving in with a partner") ||
    profile.rentAmount
  ) {
    recs.push("tenancy");
  }
  
  // 3. Student Loan
  if (
    profile.studentLoan?.includes("Yes") ||
    profile.lifeStage === "I'm still at uni"
  ) {
    recs.push("student-loan");
  }
  
  // 4. Mortgage
  if (
    profile.upcomingEvents?.includes("Thinking about buying a place") ||
    profile.buyingBudget ||
    profile.buyingLisa
  ) {
    recs.push("mortgage");
  }
  
  // 5. Pension
  if (
    profile.lifeStage === "I've just started my first proper job" ||
    profile.lifeStage === "I've been working for a year or two" ||
    profile.sixMonthGoal?.includes("pension")
  ) {
    recs.push("pension");
  }
  
  // 6. Tax
  if (
    profile.lifeStage?.includes("freelance") ||
    profile.lifeStage?.includes("self-employed") ||
    profile.sixMonthGoal?.includes("tax") ||
    profile.freelanceIndustry
  ) {
    recs.push("tax");
  }
  
  if (recs.length === 0) {
    return ["payslip"];
  }
  
  // Limit to at most 1-2 recommendations (slice to 2)
  return recs.slice(0, 2);
}

export function DecoderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openDoc = searchParams.get("doc");
  const context = useContext(ProfileContext);
  const profile = context ? context.profile : null;
  const [libraryOpen, setLibraryOpen] = useState(true);

  const openDocument = (id: string) => setSearchParams({ doc: id });
  const closeDocument = () => setSearchParams({});

  if (openDoc && DOCUMENT_COMPONENTS[openDoc]) {
    const SelectedDoc = DOCUMENT_COMPONENTS[openDoc];
    return <SelectedDoc onBack={closeDocument} />;
  }

  const recommendedIds = getRecommendedDocuments(profile);
  const suggestedDocs = DOCUMENTS.filter((doc) => recommendedIds.includes(doc.id));

  return (
    <div className="anp-app anp-lessons-bg">
      <TopBar showNotifications={false} subtitle="Practice reading documents" />

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

        {/* Suggested for you */}
        {suggestedDocs.length > 0 && (
          <div className="av-sage" style={{ 
            margin: "0 20px 14px",
            padding: "16px"
          }}>
            <div className="av-sage__row">
              <SageAvatar size={46} />
              <div style={{ flex: 1 }}>
                <div className="av-sage__eyebrow">Sage recommendation</div>
                <div className="av-sage__text">
                  Based on your profile, I recommend starting with these document guides:
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
              {suggestedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="anp-l-track active"
                  onClick={() => openDocument(doc.id)}
                >
                  <div className="anp-l-track-num">
                    {doc.icon}
                  </div>
                  <div className="anp-l-track-body">
                    <div className="anp-l-track-title">
                      {doc.title}
                      <span className="now-tag">READY</span>
                      <span className="rec-tag" style={{ marginLeft: 6, background: "var(--p-coral-tint)", color: "var(--p-coral)", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>FOR YOU</span>
                    </div>
                    <div className="anp-l-track-sub">
                      {doc.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Document Library */}
        <div style={{
          margin: "16px 20px 24px",
          background: "var(--p-bg-card, #fff)",
          borderRadius: "18px",
          border: "1px solid var(--p-line)",
          overflow: "hidden",
        }}>
          <button
            onClick={() => setLibraryOpen((o) => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontFamily: "var(--p-display)",
                fontWeight: 600,
                fontSize: "16px",
                letterSpacing: "-0.01em",
                color: "var(--p-ink)",
              }}>Document Library</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontFamily: "var(--p-mono)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--p-ink-3)",
              }}>All documents</span>
              <ChevronDown
                size={16}
                color="var(--p-ink-3)"
                style={{
                  transition: "transform 0.25s ease",
                  transform: libraryOpen ? "rotate(180deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}
              />
            </div>
          </button>

          {libraryOpen && (
            <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  className="anp-l-track active"
                  onClick={() => openDocument(doc.id)}
                  style={{
                    background: "var(--p-bg)",
                    border: "1px solid var(--p-line-2)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    cursor: "pointer"
                  }}
                >
                  <div className="anp-l-track-num" style={{ minWidth: 40 }}>
                    {doc.icon}
                  </div>
                  <div className="anp-l-track-body">
                    <div className="anp-l-track-title" style={{ fontSize: 14, fontWeight: 700 }}>
                      {doc.title}
                    </div>
                    <div className="anp-l-track-sub" style={{ fontSize: 12 }}>
                      {doc.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
