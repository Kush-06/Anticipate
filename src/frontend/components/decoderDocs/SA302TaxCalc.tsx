import { useRef, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { DocumentChatBot } from "../DocumentChatBot";

type Keyword = { term: string; definition: string };
type TooltipState = { keyword: Keyword; x: number; y: number } | null;

const KEYWORDS: Record<string, Keyword> = {
  sa302: {
    term: "SA302",
    definition: "A summary of your income and tax calculation from HMRC, produced after you submit a Self Assessment tax return. Often required as proof of income by mortgage lenders, landlords, and visa applications.",
  },
  self_assessment: {
    term: "Self Assessment",
    definition: "A system where you declare your own income and calculate your tax bill — rather than having it done via PAYE. You must register if you're self-employed, have income over £100,000, or earn from rental/investments.",
  },
  personal_allowance: {
    term: "Personal Allowance",
    definition: "The amount of income you can earn each year completely tax-free. Currently £12,570. This is what tax code 1257L represents on a payslip. If you earn over £100,000, this allowance tapers away.",
  },
  basic_rate: {
    term: "Basic Rate (20%)",
    definition: "Income tax charged at 20% on earnings between £12,571 and £50,270. Most UK earners pay this rate on most of their income.",
  },
  higher_rate: {
    term: "Higher Rate (40%)",
    definition: "Income tax charged at 40% on earnings between £50,271 and £125,140. You become a higher-rate taxpayer once your income crosses £50,271.",
  },
  class4_ni: {
    term: "Class 4 National Insurance",
    definition: "NI contributions paid by self-employed people on their profits. Unlike employed workers (Class 1), self-employed people pay Class 4 NI at 9% on profits between £12,570 and £50,270, and 2% above that.",
  },
  class2_ni: {
    term: "Class 2 National Insurance",
    definition: "A flat weekly NI contribution paid by the self-employed (£3.45/week). Counts towards your State Pension entitlement. Now collected via Self Assessment rather than separately.",
  },
  payments_on_account: {
    term: "Payments on Account",
    definition: "Advance tax payments made towards next year's bill. If your tax bill is over £1,000, HMRC requires you to pay 50% in January and 50% in July as a deposit against the following year. A nasty surprise for first-time Self Assessment filers.",
  },
  trading_income: {
    term: "Trading Income",
    definition: "Money earned from self-employment or running a business. Taxed differently to employment income — you can deduct allowable business expenses before calculating profit, which is what gets taxed.",
  },
  tax_year: {
    term: "Tax Year",
    definition: "The UK tax year runs from 6 April to 5 April the following year — not the calendar year. Your SA302 will always reference this unusual date range, a quirk dating back to the 18th century.",
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

export function SA302TaxCalc({ onBack }: { onBack: () => void }) {
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

  const row = (label: React.ReactNode, value: string, indent = false, bold = false, dimmed = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)", gap: 8, paddingLeft: indent ? 12 : 0 }}>
      <span style={{ fontSize: 12, color: dimmed ? "var(--p-text-3, #aaa)" : "var(--p-text-2, #666)", flex: 1 }}>{label}</span>
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
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--p-text-1)" }}>SA302 Tax Calculation</div>
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
          {/* HMRC Header */}
          <div style={{ background: "#1d3461", color: "#fff", padding: "16px 16px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>HM Revenue & Customs</div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{kw("sa302", "Tax Calculation Summary (SA302)")}</div>
                <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>
                  {kw("tax_year", "Tax year: 6 April 2024 to 5 April 2025")}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, opacity: 0.7 }}>UTR</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>1234 567890</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "16px", fontSize: 13, lineHeight: 1.7, color: "var(--p-text-1)", display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <div style={{ fontWeight: 600 }}>Alex J. Morgan</div>
              <div style={{ fontSize: 12, color: "var(--p-text-2)" }}>NI number: QQ 98 76 54 A · Self-employed: Freelance Graphic Designer</div>
            </div>

            {/* Income */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--p-text-3)", marginBottom: 6 }}>Income</div>
              {row(kw("trading_income", "Self-employment income (gross)"), "£68,400.00")}
              {row("Less: allowable business expenses", "−£12,600.00", true, false, true)}
              {row("Net profit from self-employment", "£55,800.00", false, true)}
              {row("PAYE employment income (part year)", "£8,200.00")}
              {row("Total income", "£64,000.00", false, true)}
            </div>

            {/* Tax calculation */}
            <div style={{ background: "#f0f5ff", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #c5d0f0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1d3461", marginBottom: 8 }}>Income tax calculation</div>
              {row(kw("personal_allowance", "Less: Personal Allowance"), "−£12,570.00", false, false, true)}
              {row("Taxable income", "£51,430.00", false, true)}
              {row(kw("basic_rate", "Basic rate tax: £37,700 @ 20%"), "£7,540.00")}
              {row(kw("higher_rate", "Higher rate tax: £13,730 @ 40%"), "£5,492.00")}
              {row("Total income tax", "£13,032.00", false, true)}
            </div>

            {/* NI */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--p-text-3)", marginBottom: 6 }}>National Insurance</div>
              {row(kw("class4_ni", "Class 4 NI: £37,700 @ 9%"), "£3,393.00")}
              {row("Class 4 NI: £5,530 @ 2%", "£110.60")}
              {row(kw("class2_ni", "Class 2 NI (£3.45 × 52 weeks)"), "£179.40")}
              {row("Total NI", "£3,683.00", false, true)}
            </div>

            {/* Summary */}
            <div style={{ background: "#f0f7f0", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #c8e6c9" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#2d4a22", marginBottom: 8 }}>Tax & NI summary</div>
              {row("Total income tax", "£13,032.00")}
              {row("Total National Insurance", "£3,683.00")}
              {row("Less: tax already paid (PAYE)", "−£1,640.00", false, false, true)}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 3px", borderTop: "1px solid rgba(45,74,34,0.15)", marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2d4a22" }}>Balancing payment due</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#2d4a22" }}>£15,075.00</span>
              </div>
              <div style={{ fontSize: 11, color: "#2d4a22", opacity: 0.7, marginTop: 4 }}>Due by: 31 January 2026</div>
            </div>

            {/* Payments on account */}
            <div style={{ background: "#fff8e1", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #ffe082" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c5e00", marginBottom: 6 }}>{kw("payments_on_account", "Payments on Account for 2025–26")}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#7c5e00", padding: "3px 0" }}>
                <span>First payment (31 Jan 2026)</span><span>£7,537.50</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#7c5e00", padding: "3px 0", borderBottom: "0.5px solid rgba(124,94,0,0.15)" }}>
                <span>Second payment (31 Jul 2026)</span><span>£7,537.50</span>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "#7c5e00", lineHeight: 1.6 }}>
                Total due 31 Jan 2026 (balancing + first POA): <strong>£22,612.50</strong>. Payments on account are advance payments toward next year's bill and can catch first-time {kw("self_assessment", "Self Assessment")} filers off guard.
              </p>
            </div>

            <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.07)", paddingTop: 12, fontSize: 11, color: "var(--p-text-3)", lineHeight: 1.6 }}>
              This is not a demand for payment. Pay at gov.uk/pay-self-assessment-tax-bill. HMRC helpline: 0300 200 3310. UTR must be quoted on all correspondence.
            </div>
          </div>
        </div>
      </div>
      <DocumentChatBot 
        documentTitle="SA302 Tax Calc"
        documentPath="tax.md"
      />
      </div>
      );
      }