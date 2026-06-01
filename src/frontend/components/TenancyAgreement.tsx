import { useRef, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

type Keyword = { term: string; definition: string };
type TooltipState = { keyword: Keyword; x: number; y: number } | null;

const KEYWORDS: Record<string, Keyword> = {
  ast: {
    term: "Assured Shorthold Tenancy (AST)",
    definition: "The most common type of private rental agreement in England. It gives the landlord the right to reclaim the property after a fixed term, and gives you (the tenant) basic legal protections.",
  },
  deposit: {
    term: "Security Deposit",
    definition: "A sum paid upfront (usually 5 weeks' rent) held by the landlord as protection against damage or unpaid rent. By law it must be protected in a government-approved scheme within 30 days.",
  },
  deposit_scheme: {
    term: "Deposit Protection Scheme",
    definition: "A government-backed scheme where your deposit is held securely. There are three: DPS, MyDeposits, and TDS. Your landlord must protect your deposit here and give you the scheme details within 30 days or face penalties.",
  },
  break_clause: {
    term: "Break Clause",
    definition: "A clause that allows either the tenant or landlord to end the tenancy early, usually after a minimum period (e.g. 6 months into a 12-month tenancy). Not all tenancies have one — check carefully.",
  },
  section_21: {
    term: "Section 21 Notice",
    definition: "A 'no-fault' eviction notice a landlord can serve to ask you to leave at the end of a fixed term, without needing to give a reason. They must give at least 2 months' notice.",
  },
  fair_wear: {
    term: "Fair Wear and Tear",
    definition: "Normal deterioration of a property through everyday use — e.g. minor scuffs on walls or carpet fading. Landlords cannot charge you for this. They can only deduct from your deposit for damage beyond normal use.",
  },
  periodic: {
    term: "Periodic Tenancy",
    definition: "What your tenancy automatically becomes after the fixed term ends if neither party ends it. It rolls month-to-month on the same terms. You can leave with one month's notice; the landlord must give two.",
  },
  guarantor: {
    term: "Guarantor",
    definition: "A third party (often a parent) who agrees to pay rent or cover damages if you can't. By signing, the guarantor becomes legally liable for your obligations under the tenancy. This is a significant legal commitment.",
  },
  inventory: {
    term: "Inventory / Check-In Report",
    definition: "A detailed document recording the condition of the property and its contents at the start of the tenancy. Crucial for disputing deposit deductions at the end — always photograph everything and sign the inventory.",
  },
  stamp_duty: {
    term: "Stamp Duty (SDLT)",
    definition: "A tax paid when buying property. As a renter you don't pay this — but if you ever buy, you'll pay it on the purchase price above certain thresholds. First-time buyers get a reduced rate.",
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

export function TenancyAgreement({ onBack }: { onBack: () => void }) {
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

  const clause = (num: string, title: string, content: React.ReactNode) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--p-text-1)", marginBottom: 4 }}>
        {num}. {title}
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "var(--p-text-2, #555)" }}>{content}</p>
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
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--p-text-1)" }}>Tenancy Agreement (AST)</div>
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
          <div style={{ background: "#1d3461", color: "#fff", padding: "16px 16px 14px" }}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Residential Letting</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{kw("ast", "Assured Shorthold Tenancy Agreement")}</div>
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Document ref: AST-2025-00193 · Dated: 1 June 2025</div>
          </div>

          <div style={{ padding: "16px", fontSize: 13, lineHeight: 1.7, color: "var(--p-text-1)", display: "flex", flexDirection: "column", gap: 4 }}>

            {/* Parties */}
            <div style={{ background: "#f5f5f5", borderRadius: 10, padding: "12px 14px", marginBottom: 10, border: "0.5px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--p-text-3)", marginBottom: 8 }}>Parties to this agreement</div>
              {[
                ["Landlord", "Harwood Property Holdings Ltd, 22 Gray's Inn Road, London WC1X 8HR"],
                ["Tenant", "Jamie L. Carter, 47B Ferndale Road, London SW9 8AN"],
                ["Guarantor", "Patricia Carter (Tenant's parent)"],
                ["Managing agent", "Ashbridge Lettings, 5 Clapham High St, London SW4 7TS"],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)", fontSize: 12 }}>
                  <span style={{ color: "var(--p-text-3)", minWidth: 90, flexShrink: 0 }}>{label}</span>
                  <span style={{ color: "var(--p-text-1)" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Key terms */}
            <div style={{ background: "#f0f7f0", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "0.5px solid #c8e6c9" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#2d4a22", marginBottom: 8 }}>Key terms</div>
              {[
                ["Property", "47B Ferndale Road, London SW9 8AN"],
                ["Term", "12 months (1 Jun 2025 – 31 May 2026)"],
                ["Monthly rent", "£1,650.00, payable in advance"],
                ["Security deposit", kw("deposit", "£1,903.84 (5 weeks' rent)")],
                ["Deposit scheme", kw("deposit_scheme", "Tenancy Deposit Scheme (TDS)")],
                ["Break clause", kw("break_clause", "6 months — either party, 2 months' notice")],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: i < 5 ? "0.5px solid rgba(45,74,34,0.12)" : "none", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "#2d4a22", opacity: 0.7 }}>{label}</span>
                  <span style={{ fontWeight: 600, color: "#2d4a22", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>

            {clause("1", "Tenancy type", <>This agreement creates an {kw("ast", "Assured Shorthold Tenancy")} under the Housing Act 1988 (as amended). At the end of the fixed term, the tenancy will become a {kw("periodic", "periodic (rolling) tenancy")} unless either party serves notice to end it.</>)}

            {clause("2", "Deposit protection", <>The landlord will protect the {kw("deposit", "security deposit")} of £1,903.84 with the {kw("deposit_scheme", "Tenancy Deposit Scheme (TDS)")} within 30 days of receipt. You will receive prescribed information detailing how to access or dispute the deposit at the end of tenancy.</>)}

            {clause("3", "Guarantor obligations", <>By signing this agreement, the {kw("guarantor", "guarantor")} agrees to be jointly and severally liable for all rental payments and obligations under this tenancy should the tenant default. This is a legally binding commitment and the guarantor should seek independent legal advice before signing.</>)}

            {clause("4", "Condition & inventory", <>An {kw("inventory", "inventory and check-in report")} will be prepared prior to move-in. The tenant must sign this within 7 days. The property must be returned in the same condition, allowing for {kw("fair_wear", "fair wear and tear")}. Deductions from the deposit will only be made for damage beyond normal use.</>)}

            {clause("5", "Ending the tenancy", <>After the fixed term, the landlord may serve a {kw("section_21", "Section 21 notice")} to request possession, requiring at least 2 months' notice. The tenant must give 1 month's notice in writing to end a periodic tenancy.</>)}

            <div style={{ background: "#fff8e1", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #ffe082", marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c5e00", marginBottom: 4 }}>Before you sign</div>
              <p style={{ margin: 0, fontSize: 12, color: "#7c5e00", lineHeight: 1.6 }}>
                Read every clause carefully. Check the {kw("deposit_scheme", "deposit scheme")} details, confirm the {kw("break_clause", "break clause")} terms, and photograph the property thoroughly on move-in day alongside the {kw("inventory", "inventory")}. Keep copies of all signed documents.
              </p>
            </div>

            <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.07)", paddingTop: 12, marginTop: 10, fontSize: 11, color: "var(--p-text-3)", lineHeight: 1.6 }}>
              This agreement is governed by the laws of England and Wales. Ashbridge Lettings is a member of ARLA Propertymark. Property Redress Scheme member PRS-034821.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}