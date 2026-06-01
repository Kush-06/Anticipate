import { useRef, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

type Keyword = { term: string; definition: string };
type TooltipState = { keyword: Keyword; x: number; y: number } | null;

const KEYWORDS: Record<string, Keyword> = {
  auto_enrolment: {
    term: "Auto-Enrolment",
    definition: "A law requiring employers to automatically enrol eligible workers into a workplace pension. You don't have to do anything to join — but you can choose to opt out.",
  },
  opt_out: {
    term: "Opt-Out",
    definition: "Your legal right to leave the workplace pension within one month of being enrolled. If you opt out within this window, any contributions are refunded. After this window, you can still leave but won't get a refund.",
  },
  qualifying_earnings: {
    term: "Qualifying Earnings",
    definition: "The slice of your salary used to calculate pension contributions. Currently this is earnings between £6,240 and £50,270 per year — not your full salary.",
  },
  employee_contribution: {
    term: "Employee Contribution (5%)",
    definition: "The minimum you must contribute to your pension under auto-enrolment rules. This is taken from your pay before you receive it, reducing the amount of tax you pay.",
  },
  employer_contribution: {
    term: "Employer Contribution (3%)",
    definition: "Free money added to your pension by your employer. You only get this if you stay enrolled. Opting out means losing this on top of your own contributions.",
  },
  tax_relief: {
    term: "Tax Relief",
    definition: "The government tops up your pension contributions because pension saving is tax-free. A basic-rate taxpayer effectively pays £80 for every £100 that goes into their pension.",
  },
  nest: {
    term: "NEST",
    definition: "National Employment Savings Trust — a government-backed pension scheme set up specifically for auto-enrolment. It's one of the most common default workplace pension providers.",
  },
  pot: {
    term: "Pension Pot",
    definition: "The total fund built up in your name inside the pension scheme. It grows through contributions and investment returns over time, and you can access it from age 57 (rising to 57 in 2028).",
  },
  default_fund: {
    term: "Default Investment Fund",
    definition: "If you don't choose where to invest, your money goes into this fund automatically. It's designed to be balanced — not too risky, not too conservative — for the average saver.",
  },
  state_pension_age: {
    term: "State Pension Age",
    definition: "The age at which you can claim your UK State Pension (currently 66, rising to 67 by 2028). Your workplace pension is separate and can usually be accessed earlier.",
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

export function PensionWelcomeLetter({ onBack }: { onBack: () => void }) {
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

  return (
    <div className="anp-app anp-lessons-bg" style={{ position: "relative" }}>
      <div className="anp-spacer" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 8px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--p-text-1)", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--p-text-1)" }}>Auto-Enrolment Pension</div>
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
          {/* Header */}
          <div style={{ background: "#1e3a5f", color: "#fff", padding: "16px 16px 14px" }}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>NEST — National Employment Savings Trust</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Welcome to your workplace pension</div>
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Reference: NEST-2025-00847261 · Issued: 1 May 2025</div>
          </div>

          <div style={{ padding: "16px 16px", fontSize: 13, lineHeight: 1.7, color: "var(--p-text-1, #111)", display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--p-text-3, #999)", marginBottom: 6 }}>To</div>
              <div style={{ fontWeight: 600 }}>Jamie L. Carter</div>
              <div style={{ color: "var(--p-text-2, #666)", fontSize: 12 }}>Employed by: Meridian Group Ltd · PAYE Ref: 475/AB12345</div>
            </div>

            <p style={{ margin: 0 }}>
              Dear Jamie, your employer has enrolled you into a workplace pension as required by law under {kw("auto_enrolment", "Auto-Enrolment")} regulations. This letter confirms your membership and explains what happens next.
            </p>

            {/* Key details box */}
            <div style={{ background: "#f0f7ff", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #bcd4ee" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1e3a5f", marginBottom: 10 }}>Your pension at a glance</div>
              {[
                ["Pension provider", kw("nest", "NEST")],
                ["Enrolment date", "1 May 2025"],
                ["Your contribution", kw("employee_contribution", "5% of qualifying earnings")],
                ["Employer contribution", kw("employer_contribution", "3% of qualifying earnings")],
                ["Calculated on", kw("qualifying_earnings", "Qualifying earnings")],
                ["Investment", kw("default_fund", "Default investment fund")],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: i < 5 ? "0.5px solid rgba(30,58,95,0.1)" : "none", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#1e3a5f", opacity: 0.7 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1e3a5f", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--p-text-1)", marginBottom: 6 }}>How your contributions work</div>
              <p style={{ margin: "0 0 8px" }}>
                Each month, 5% of your {kw("qualifying_earnings", "qualifying earnings")} will be deducted from your pay before tax. Your employer adds a further 3%. The government also adds {kw("tax_relief", "tax relief")}, effectively boosting your contributions automatically.
              </p>
              <p style={{ margin: 0 }}>
                All contributions go into your personal {kw("pot", "pension pot")} and are invested on your behalf.
              </p>
            </div>

            {/* Opt out box */}
            <div style={{ background: "#fff8e1", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #ffe082" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c5e00", marginBottom: 6 }}>Your right to {kw("opt_out", "opt out")}</div>
              <p style={{ margin: 0, fontSize: 12, color: "#7c5e00", lineHeight: 1.6 }}>
                You have one calendar month from your enrolment date to opt out and receive a full refund of any contributions deducted. After this window you may still leave, but contributions already made will remain in your pot until retirement. To opt out, visit nest.org.uk or call 0300 020 0090.
              </p>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: "var(--p-text-2, #666)" }}>
              You will be re-enrolled automatically every three years if you opt out, as required by law. Your {kw("state_pension_age", "State Pension")} is separate and unaffected by this pension.
            </p>

            <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.07)", paddingTop: 12, fontSize: 11, color: "var(--p-text-3, #aaa)", lineHeight: 1.6 }}>
              NEST Corporation · Registered in England & Wales No. 6635041 · Regulated by The Pensions Regulator · nest.org.uk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}