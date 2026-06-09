import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { DocumentChatBot } from "../DocumentChatBot";

type Keyword = {
  term: string;
  definition: string;
};

type TooltipState = {
  keyword: Keyword;
  x: number;
  y: number;
} | null;

const KEYWORDS: Record<string, Keyword> = {
  paye_ref: {
    term: "PAYE Ref",
    definition:
      "Your employer's Pay As You Earn reference number, used by HMRC to identify the company for tax purposes.",
  },
  ni_number: {
    term: "NI Number",
    definition:
      "Your National Insurance number is a unique reference (e.g. AB 12 34 56 C) that links your earnings and contributions to your personal tax and benefits record.",
  },
  tax_code: {
    term: "Tax Code",
    definition:
      "A code used by your employer to calculate how much income tax to deduct. 1257L means you have a £12,570 tax-free Personal Allowance for the year.",
  },
  ni_category: {
    term: "NI Category",
    definition:
      "Determines which National Insurance rate applies to you. Category A is the standard rate for most employees under State Pension age.",
  },
  gross_pay: {
    term: "Gross Pay",
    definition:
      "Your total earnings before any deductions (tax, NI, pension etc.) are taken out. This is NOT what hits your bank account.",
  },
  performance_bonus: {
    term: "Performance Bonus",
    definition:
      "An additional payment on top of your regular salary, rewarded for hitting targets. It is still taxable income.",
  },
  paye_tax: {
    term: "Income Tax (PAYE)",
    definition:
      "Pay As You Earn — your employer deducts income tax directly from your wages before you receive them, and sends it to HMRC on your behalf.",
  },
  national_insurance: {
    term: "National Insurance",
    definition:
      "A mandatory contribution deducted from your wages that funds the NHS, State Pension, and other benefits. The amount depends on your earnings and NI category.",
  },
  pension: {
    term: "Pension Contribution",
    definition:
      "The percentage of your gross salary deducted and paid into your workplace pension. Your employer also contributes separately.",
  },
  student_loan: {
    term: "Student Loan (Plan 2)",
    definition:
      "Repayments are automatically deducted once you earn above £27,295/yr. You repay 9% of earnings above that threshold, regardless of how much you borrowed.",
  },
  net_pay: {
    term: "Net Pay",
    definition:
      "Also called 'take-home pay' — this is what's actually deposited into your bank account after all deductions have been made.",
  },
  ytd: {
    term: "Year to Date (YTD)",
    definition:
      "A running total of your earnings and deductions from the start of the tax year (6 April) up to this payslip. Useful for checking you're being taxed the right amount.",
  },
  bacs: {
    term: "BACS",
    definition:
      "Bankers' Automated Clearing Services — the standard UK system for sending money directly between bank accounts electronically. Most UK salaries are paid this way.",
  },
};

function Kw({
  id,
  children,
  onTap,
  activeId,
}: {
  id: string;
  children: React.ReactNode;
  onTap: (id: string, el: HTMLElement) => void;
  activeId: string | null;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isActive = activeId === id;

  return (
    <span
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        if (ref.current) onTap(id, ref.current);
      }}
      style={{
        background: isActive ? "#fbbf24" : "#fef3c7",
        color: isActive ? "#78350f" : "#92400e",
        borderBottom: "1.5px dashed #d97706",
        borderRadius: 3,
        padding: "0 2px",
        cursor: "pointer",
        fontSize: "inherit",
        fontWeight: "inherit",
        display: "inline",
      }}
    >
      {children}
    </span>
  );
}

export function PayslipDocument({ onBack }: { onBack: () => void }) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTap = (id: string, el: HTMLElement) => {
    if (activeId === id) {
      setTooltip(null);
      setActiveId(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const scrollEl = scrollRef.current;
    const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
    const containerRect = scrollEl ? scrollEl.getBoundingClientRect() : { top: 0, left: 0 };

    setTooltip({
      keyword: KEYWORDS[id],
      x: rect.left - containerRect.left,
      y: rect.bottom - containerRect.top + scrollTop + 6,
    });
    setActiveId(id);
  };

  useEffect(() => {
    const handler = () => {
      setTooltip(null);
      setActiveId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const row = (label: React.ReactNode, value: string, muted = false) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "5px 0",
        borderBottom: "0.5px solid rgba(0,0,0,0.06)",
        gap: 8,
      }}
    >
      <span style={{ color: muted ? "var(--p-text-2)" : "var(--p-text-1)", fontSize: 12, flex: 1 }}>
        {label}
      </span>
      <span
        style={{
          color: "var(--p-text-1)",
          fontSize: 12,
          fontWeight: muted ? 400 : 500,
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--p-text-3)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <div className="anp-app anp-lessons-bg" style={{ position: "relative" }}>
      <div className="anp-spacer" />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px 8px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "var(--p-text-1)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--p-text-1)" }}>
            Monthly payslip
          </div>
          <div style={{ fontSize: 11, color: "var(--p-text-2)" }}>
            Tap highlighted words to learn what they mean
          </div>
        </div>
      </div>

      {/* Scrollable document area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 14px 24px",
          position: "relative",
        }}
        onClick={() => {
          setTooltip(null);
          setActiveId(null);
        }}
      >
        {/* Tooltip */}
        {tooltip && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: tooltip.y,
              left: Math.max(8, Math.min(tooltip.x, 200)),
              zIndex: 50,
              background: "#1a2e4a",
              color: "#f0f4f8",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              lineHeight: 1.6,
              maxWidth: 220,
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 4 }}>
              {tooltip.keyword.term}
            </div>
            <div>{tooltip.keyword.definition}</div>
          </div>
        )}

        {/* Document card */}
        <div
          style={{
            background: "var(--p-card)",
            borderRadius: 16,
            overflow: "hidden",
            border: "0.5px solid rgba(0,0,0,0.08)",
          }}
        >
          {/* Company header */}
          <div
            style={{
              background: "#1a2e4a",
              color: "#fff",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700 }}>Meridian Group Ltd</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
              14 Ashford Business Park, London, EC2A 4BQ
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>
              Company Reg: 08234761 ·{" "}
              <Kw id="paye_ref" onTap={handleTap} activeId={activeId}>
                PAYE Ref
              </Kw>
              : 475/AB12345
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Payslip
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>April 2025</div>
                <div style={{ fontSize: 11, opacity: 0.65 }}>Pay date: 30 Apr 2025</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 0 }}>

            {section(
              "Employee details",
              <>
                {row("Name", "Jamie L. Carter")}
                {row("Job title", "Marketing Executive")}
                {row("Department", "Brand & Comms")}
                {row("Employee no", "EMP-00429")}
              </>
            )}

            {section(
              "Tax & NI details",
              <>
                {row(<Kw id="ni_number" onTap={handleTap} activeId={activeId}>NI number</Kw>, "AB 12 34 56 C")}
                {row(<Kw id="tax_code" onTap={handleTap} activeId={activeId}>Tax code</Kw>, "1257L")}
                {row(<Kw id="ni_category" onTap={handleTap} activeId={activeId}>NI category</Kw>, "A")}
                {row("Pay frequency", "Monthly")}
              </>
            )}

            {section(
              "Earnings",
              <>
                {row("Basic salary", "£2,500.00")}
                {row("Overtime (8 hrs)", "£180.00")}
                {row(<Kw id="performance_bonus" onTap={handleTap} activeId={activeId}>Performance bonus</Kw>, "£350.00")}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 3px", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--p-text-1)" }}>
                    <Kw id="gross_pay" onTap={handleTap} activeId={activeId}>Gross pay</Kw>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--p-text-1)" }}>£3,030.00</span>
                </div>
              </>
            )}

            {section(
              "Deductions",
              <>
                {row(<Kw id="paye_tax" onTap={handleTap} activeId={activeId}>Income tax (PAYE)</Kw>, "£414.60")}
                {row(<Kw id="national_insurance" onTap={handleTap} activeId={activeId}>National Insurance</Kw>, "£224.22")}
                {row(<Kw id="pension" onTap={handleTap} activeId={activeId}>Pension (5%)</Kw>, "£125.00")}
                {row(<Kw id="student_loan" onTap={handleTap} activeId={activeId}>Student loan (Plan 2)</Kw>, "£66.00")}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 3px", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--p-text-1)" }}>Total deductions</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--p-text-1)" }}>£829.82</span>
                </div>
              </>
            )}

            {/* Net pay highlight */}
            <div
              style={{
                background: "#d1fae5",
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>
                <Kw id="net_pay" onTap={handleTap} activeId={activeId}>Net pay</Kw>
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#065f46" }}>£2,200.18</span>
            </div>

            {section(
              "Year to date",
              <>
                {row(<Kw id="ytd" onTap={handleTap} activeId={activeId}>What is YTD?</Kw>, "")}
                {row("Gross earnings", "£12,120.00", true)}
                {row("Tax paid", "£1,658.40", true)}
                {row("NI paid", "£896.88", true)}
              </>
            )}

            {section(
              "Payment details",
              <>
                {row(<Kw id="bacs" onTap={handleTap} activeId={activeId}>Payment method (BACS)</Kw>, "")}
                {row("Bank (last 4)", "****4821", true)}
                {row("Sort code", "20-**-**", true)}
              </>
            )}

            <div
              style={{
                fontSize: 10,
                color: "var(--p-text-3)",
                lineHeight: 1.6,
                borderTop: "0.5px solid rgba(0,0,0,0.06)",
                paddingTop: 10,
                marginTop: 4,
              }}
            >
              Pension provider: Nest Pensions · Employer contribution: 3% (£75.00 this period) ·
              Queries: payroll@meridiangroup.co.uk
            </div>
          </div>
        </div>
      </div>
      <DocumentChatBot 
        documentTitle="Monthly Payslip"
        documentPath="payslip.md"
      />
    </div>
  );
}
