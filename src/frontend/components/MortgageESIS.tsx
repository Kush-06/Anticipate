import { useRef, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

type Keyword = { term: string; definition: string };
type TooltipState = { keyword: Keyword; x: number; y: number } | null;

const KEYWORDS: Record<string, Keyword> = {
  esis: {
    term: "ESIS (European Standardised Information Sheet)",
    definition: "A standardised document all UK mortgage lenders must provide before you formally apply. It lets you compare mortgages on a like-for-like basis. The format is set by law so every lender uses the same structure.",
  },
  aprc: {
    term: "APRC (Annual Percentage Rate of Charge)",
    definition: "The true total cost of the mortgage per year, including the interest rate AND all fees spread over the full term. Use this to compare mortgages — a low interest rate with high fees can have a higher APRC than a slightly higher rate with no fees.",
  },
  ltv: {
    term: "LTV (Loan to Value)",
    definition: "The size of your mortgage as a percentage of the property's value. A £180,000 mortgage on a £225,000 property = 80% LTV. Lower LTV = less risk for the lender = better interest rates for you.",
  },
  fixed_rate: {
    term: "Fixed Rate",
    definition: "Your interest rate stays the same for an agreed period (here, 5 years), regardless of changes to the Bank of England base rate. Gives certainty but you miss out if rates fall.",
  },
  svr: {
    term: "SVR (Standard Variable Rate)",
    definition: "The rate your mortgage reverts to after your fixed or tracker deal ends. SVRs are set by the lender and are usually much higher than deal rates. Most borrowers remortgage before hitting SVR.",
  },
  early_repayment: {
    term: "Early Repayment Charge (ERC)",
    definition: "A penalty for paying off or overpaying your mortgage during the fixed-rate period. Here it's 3% in year 1, dropping each year. On a large mortgage this can be thousands of pounds — check before overpaying.",
  },
  overpayment: {
    term: "Overpayment Allowance",
    definition: "Most mortgages allow you to overpay up to 10% of the outstanding balance per year without an ERC. Overpaying reduces your balance faster, saving interest over the long term.",
  },
  arrangement_fee: {
    term: "Arrangement Fee",
    definition: "A fee charged by the lender to set up the mortgage. It can be paid upfront or added to the loan — but adding it means you pay interest on it for the full mortgage term, costing more overall.",
  },
  repayment: {
    term: "Capital Repayment Mortgage",
    definition: "Each monthly payment covers both interest and a portion of the loan itself (the capital). By the end of the term, the mortgage is fully paid off. The alternative — interest-only — leaves the full loan outstanding at the end.",
  },
  conveyancing: {
    term: "Conveyancing",
    definition: "The legal process of transferring property ownership. You'll need a solicitor or licensed conveyancer to do this. Costs typically £1,000–£2,500 and takes 8–12 weeks.",
  },
};

function Kw({ id, children, onTap, activeId }: { id: string; children: React.ReactNode; onTap: (id: string, el: HTMLElement) => void; activeId: string | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isActive = activeId === id;
  return (
    <span ref={ref} onClick={(e) => { e.stopPropagation(); if (ref.current) onTap(id, ref.current); }}
      style={{ background: isActive ? "#fbbf24" : "#fef3c7", color: isActive ? "#78350f" : "#92400e", borderBottom: "1.5px dashed #d97706", borderRadius: 3, padding: "0 2px", cursor: "pointer", fontSize: "inherit", fontWeight: "inherit", display: "inline" }}>
      {children}
    </span>
  );
}

export function MortgageESIS({ onBack }: { onBack: () => void }) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTap = (id: string, el: HTMLElement) => {
    if (activeId === id) { setTooltip(null); setActiveId(null); return; }
    const rect = el.getBoundingClientRect();
    const scrollEl = scrollRef.current;
    const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
    const containerRect = scrollEl ? scrollEl.getBoundingClientRect() : { top: 0, left: 0 };
    setTooltip({ keyword: KEYWORDS[id], x: rect.left - containerRect.left, y: rect.bottom - containerRect.top + scrollTop + 6 });
    setActiveId(id);
  };

  useEffect(() => {
    const handler = () => { setTooltip(null); setActiveId(null); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const kw = (id: string, label: string) => <Kw id={id} onTap={handleTap} activeId={activeId}>{label}</Kw>;

  const row = (label: React.ReactNode, value: React.ReactNode, bold = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)", gap: 8 }}>
      <span style={{ fontSize: 12, color: "var(--p-text-2, #666)", flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: bold ? 700 : 500, color: "var(--p-text-1)", textAlign: "right" }}>{value}</span>
    </div>
  );

  return (
    <div className="anp-app anp-lessons-bg" style={{ position: "relative" }}>
      <div className="anp-spacer" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 8px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--p-text-1)", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--p-text-1)" }}>Mortgage Illustration (ESIS)</div>
          <div style={{ fontSize: 11, color: "var(--p-text-2)" }}>Tap highlighted words to learn what they mean</div>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "0 14px 24px", position: "relative" }} onClick={() => { setTooltip(null); setActiveId(null); }}>
        {tooltip && (
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: tooltip.y, left: Math.max(8, Math.min(tooltip.x, 180)), zIndex: 50, background: "#1a2e4a", color: "#f0f4f8", borderRadius: 10, padding: "10px 12px", fontSize: 12, lineHeight: 1.6, maxWidth: 230, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", pointerEvents: "none" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 4 }}>{tooltip.keyword.term}</div>
            <div>{tooltip.keyword.definition}</div>
          </div>
        )}

        <div style={{ background: "var(--p-card, #fff)", borderRadius: 16, overflow: "hidden", border: "0.5px solid rgba(0,0,0,0.08)" }}>
          <div style={{ background: "#1a3550", color: "#fff", padding: "16px 16px 14px" }}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Nationwide Building Society</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{kw("esis", "Mortgage Illustration (ESIS)")}</div>
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Illustration ref: NBS-2025-MIL-003847 · Valid for: 30 days from 1 May 2025</div>
          </div>

          <div style={{ padding: "16px", fontSize: 13, lineHeight: 1.7, color: "var(--p-text-1)", display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ fontSize: 12, color: "var(--p-text-2)", background: "#f8f8f8", borderRadius: 8, padding: "10px 12px", border: "0.5px solid rgba(0,0,0,0.07)" }}>
              This illustration is not a mortgage offer. It shows the key features of the mortgage you've enquired about so you can compare it with other products. Prepared for: <strong>Jamie L. Carter</strong>
            </div>

            {/* Headline numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Borrowing", "£180,000"],
                ["Property value", "£225,000"],
                [kw("ltv", "LTV"), "80%"],
                ["Term", "25 years"],
              ].map(([label, value], i) => (
                <div key={i} style={{ background: "#f0f5ff", borderRadius: 10, padding: "10px 12px", border: "0.5px solid #c5d0f0" }}>
                  <div style={{ fontSize: 11, color: "#1a3550", opacity: 0.6, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1a3550" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Rate details */}
            <div style={{ background: "#f0f5ff", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #c5d0f0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1a3550", marginBottom: 10 }}>Rate details</div>
              {row("Product", kw("fixed_rate", "5-Year Fixed Rate"))}
              {row("Initial rate", "4.39% fixed for 60 months")}
              {row("Monthly payment (initial)", "£984.62")}
              {row("Reverts to", <>{kw("svr", "SVR")} (currently 7.49%)</>)}
              {row("Monthly payment (SVR)", "£1,256.40")}
              {row(kw("aprc", "APRC"), "5.8% per year", true)}
            </div>

            {/* Fees */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Fees & charges</div>
              {row(kw("arrangement_fee", "Arrangement fee"), "£999 (can be added to loan)")}
              {row("Valuation fee", "£250")}
              {row(kw("conveyancing", "Conveyancing (estimated)"), "£1,400–£2,000")}
              {row("Broker fee", "£0 (fee-free broker used)")}
            </div>

            {/* ERC table */}
            <div style={{ background: "#fff8e1", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #ffe082" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c5e00", marginBottom: 8 }}>{kw("early_repayment", "Early Repayment Charges (ERC)")}</div>
              {[["Year 1", "3% of outstanding balance"], ["Year 2", "2.5%"], ["Year 3", "2%"], ["Year 4", "1.5%"], ["Year 5", "1%"]].map(([yr, pct]) => (
                <div key={yr as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#7c5e00", padding: "3px 0", borderBottom: yr !== "Year 5" ? "0.5px solid rgba(124,94,0,0.1)" : "none" }}>
                  <span>{yr}</span><span>{pct}</span>
                </div>
              ))}
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "#7c5e00" }}>
                {kw("overpayment", "Overpayments up to 10%/year")} are permitted without charge.
              </p>
            </div>

            {/* Total cost */}
            <div style={{ background: "#f0f7f0", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #c8e6c9" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#2d4a22", marginBottom: 8 }}>Total cost over full term</div>
              {row("Total amount repayable", "£294,876.00")}
              {row("Of which: interest", "£113,877.00")}
              {row("Of which: fees", "£1,249.00")}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 3px", borderTop: "1px solid rgba(45,74,34,0.15)", marginTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2d4a22" }}>Total cost (inc. deposit)</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2d4a22" }}>£340,124.00</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#2d4a22", opacity: 0.75 }}>
                Based on a {kw("repayment", "capital repayment mortgage")}. Figures assume the SVR remains at 7.49% after the fixed period.
              </p>
            </div>

            <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.07)", paddingTop: 12, fontSize: 11, color: "var(--p-text-3)", lineHeight: 1.6 }}>
              Nationwide Building Society is authorised by the PRA and regulated by the FCA and PRA. FCA Register No. 106078. YOUR HOME MAY BE REPOSSESSED IF YOU DO NOT KEEP UP REPAYMENTS ON YOUR MORTGAGE.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}