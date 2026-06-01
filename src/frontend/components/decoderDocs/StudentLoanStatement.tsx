import { useRef, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

type Keyword = { term: string; definition: string };
type TooltipState = { keyword: Keyword; x: number; y: number } | null;

const KEYWORDS: Record<string, Keyword> = {
  plan2: {
    term: "Plan 2 Loan",
    definition: "The repayment plan for students who started university in England or Wales on or after 1 September 2012. Repayments begin once you earn above £27,295/year and are wiped after 30 years regardless of how much you've repaid.",
  },
  repayment_threshold: {
    term: "Repayment Threshold",
    definition: "The annual income above which you start repaying your student loan. For Plan 2 this is £27,295/year (£2,274/month). Below this, you repay nothing — even if you have a large balance.",
  },
  repayment_rate: {
    term: "9% Repayment Rate",
    definition: "You repay 9% of everything you earn above the threshold — not 9% of your total salary. So if you earn £30,000, you repay 9% of £2,705 (the amount above £27,295) = £243/year.",
  },
  interest_rate: {
    term: "Interest Rate (RPI + 3%)",
    definition: "While studying and until you earn above the upper threshold (£49,130), interest is charged at RPI (Retail Price Index inflation) + 3%. This means your balance can grow even while you're making repayments.",
  },
  rpi: {
    term: "RPI (Retail Price Index)",
    definition: "A measure of inflation in the UK. Student loan interest is linked to RPI, so when inflation is high, your loan grows faster. RPI is usually slightly higher than the more common CPI measure.",
  },
  outstanding_balance: {
    term: "Outstanding Balance",
    definition: "The total amount you owe including all interest added to date. This number can go up even if you're making repayments, because interest may exceed your repayment amount.",
  },
  write_off: {
    term: "30-Year Write-Off",
    definition: "Any remaining Plan 2 student loan balance is automatically cancelled 30 years after the April following your graduation. Most graduates never fully repay their loan — it's more like a graduate tax than a traditional loan.",
  },
  slc: {
    term: "SLC (Student Loans Company)",
    definition: "The government-owned organisation that administers student loans in the UK. They collect repayments via HMRC (through your payslip) and manage your loan account.",
  },
  voluntary_repayment: {
    term: "Voluntary Repayment",
    definition: "You can pay extra directly to SLC at any time, but there is no early repayment penalty or benefit for most graduates — if your balance will be written off anyway, overpaying is wasted money.",
  },
  deducted_at_source: {
    term: "Deducted at Source",
    definition: "Repayments are taken directly from your salary by your employer (via HMRC), just like income tax. You never have to manually make a payment — it happens automatically when you earn above the threshold.",
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

export function StudentLoanStatement({ onBack }: { onBack: () => void }) {
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
      <span style={{ fontSize: 12, color: "var(--p-text-2, #666)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: bold ? 700 : 500, color: "var(--p-text-1, #111)", textAlign: "right" }}>{value}</span>
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
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--p-text-1)" }}>Student Loan Statement</div>
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
          <div style={{ background: "#1c3f6e", color: "#fff", padding: "16px 16px 14px" }}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{kw("slc", "Student Loans Company")}</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Annual Statement 2024–25</div>
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Account ref: SLC-EN-20192847631 · Statement date: 6 April 2025</div>
          </div>

          <div style={{ padding: "16px", fontSize: 13, lineHeight: 1.7, color: "var(--p-text-1)", display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--p-text-3, #999)", marginBottom: 4 }}>Borrower</div>
              <div style={{ fontWeight: 600 }}>Jamie L. Carter</div>
              <div style={{ fontSize: 12, color: "var(--p-text-2)" }}>Course start: September 2019 · Graduation: July 2022</div>
              <div style={{ fontSize: 12, color: "var(--p-text-2)" }}>Loan type: {kw("plan2", "Plan 2")}</div>
            </div>

            {/* Balance summary */}
            <div style={{ background: "#f0f4ff", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #c5d0f0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1c3f6e", marginBottom: 10 }}>Balance summary</div>
              {row("Opening balance (6 Apr 2024)", "£47,320.00")}
              {row("Interest added (RPI + 3%)", <span style={{ color: "#c0392b" }}>+ £2,850.40</span>)}
              {row("Repayments via PAYE", <span style={{ color: "#27ae60" }}>− £792.00</span>)}
              {row(kw("outstanding_balance", "Closing balance (5 Apr 2025)"), "£49,378.40", true)}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Repayment details</div>
              {row("Current threshold", kw("repayment_threshold", "£27,295 / year"))}
              {row("Repayment rate", kw("repayment_rate", "9% above threshold"))}
              {row("Current interest rate", kw("interest_rate", "RPI + 3% = 8.5%"))}
              {row("Method", kw("deducted_at_source", "Deducted at source (PAYE)"))}
              {row("Loan write-off date", kw("write_off", "April 2053 (30 years)"))}
            </div>

            {/* This year breakdown */}
            <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "12px 14px", border: "0.5px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--p-text-3)", marginBottom: 8 }}>2024–25 repayments</div>
              {["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m, i) => (
                <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: i < 11 ? "0.5px solid rgba(0,0,0,0.05)" : "none" }}>
                  <span style={{ fontSize: 12, color: "var(--p-text-2)" }}>{m} 2024</span>
                  <span style={{ fontSize: 12, color: "var(--p-text-1)" }}>£66.00</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Total repaid this year</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>£792.00</span>
              </div>
            </div>

            <div style={{ background: "#fff8e1", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #ffe082" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c5e00", marginBottom: 4 }}>About {kw("voluntary_repayment", "voluntary repayments")}</div>
              <p style={{ margin: 0, fontSize: 12, color: "#7c5e00", lineHeight: 1.6 }}>
                You can make additional payments directly to SLC at any time. However, for most Plan 2 borrowers, voluntary overpayments are not financially beneficial — if your loan is likely to be written off before full repayment, extra payments are lost. Seek independent financial advice before overpaying.
              </p>
            </div>

            <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.07)", paddingTop: 12, fontSize: 11, color: "var(--p-text-3)", lineHeight: 1.6 }}>
              Student Loans Company Ltd · Registered in Scotland No. SC327208 · studentloansrepayment.co.uk · 0300 100 0611
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}