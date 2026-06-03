import { useNavigate, useParams } from "react-router";
import { useEffect } from "react";
import { topics } from "../data/topics";
import { ChevronRight, ArrowLeft, AlertTriangle, TrendingUp, Wallet, Info, Sparkles, Scale, Percent, Home, Clock, FileText, PenTool } from "lucide-react";
import type { ReactNode } from "react";
import { useProfile, type UserProfile } from "../context/ProfileContext";
import { supabase } from "@backend/supabaseClient";
import { fetchStoryFacts } from "@backend/profileService";
import { createNudge, sendPushNudge } from "@backend/nudgeService";
import { isTopicOffProfile, buildNudgeQuestion } from "../utils/offProfileDetector";
import { LessonChatBot } from "./LessonChatBot";

function estimateNetPay(gross: number, profile: UserProfile | null | undefined): number {
  const personalAllowance = 12570;
  const basicLimit = 50270;

  // 1. Tax
  const taxable = Math.max(0, gross - personalAllowance);
  const basicTaxable = Math.min(taxable, basicLimit - personalAllowance);
  const higherTaxable = Math.max(0, gross - basicLimit);
  const tax = (basicTaxable * 0.2) + (higherTaxable * 0.4);

  // 2. National Insurance (roughly 8% on earnings above £12,570 up to £50,270, 2% above)
  const niable = Math.max(0, gross - 12570);
  const basicNiable = Math.min(niable, basicLimit - 12570);
  const higherNiable = Math.max(0, gross - basicLimit);
  const ni = (basicNiable * 0.08) + (higherNiable * 0.02);

  // 3. Student Loan
  let studentLoanDeduction = 0;
  if (profile?.studentLoan?.includes("payslip") || profile?.studentLoan?.includes("deducted") || profile?.studentLoan === "Yes and it comes off my payslip") {
    const threshold = 27295;
    studentLoanDeduction = Math.max(0, (gross - threshold) * 0.09);
  }

  // 4. Pension (5% on earnings above £6,240 up to £50,270)
  const pensionBase = Math.max(0, Math.min(gross, basicLimit) - 6240);
  const pension = pensionBase * 0.05;

  const netAnnual = gross - tax - ni - studentLoanDeduction - pension;
  return Math.round(netAnnual / 12);
}

function customizeLessonText(content: string, subTopicId: string, salary: number, profile: UserProfile | null | undefined): string {
  let text = content;
  const formattedSalary = "£" + salary.toLocaleString("en-GB", { maximumFractionDigits: 0 });

  // 1. Replace default starting-work example (£30,000) in Lesson 1
  if (subTopicId === "lesson-01") {
    text = text.replace(/£30,000/g, formattedSalary);
  }

  // 2. Replace student loan Plan 2 example in Lesson 4
  if (subTopicId === "lesson-04") {
    const threshold = 27295;
    const over = salary - threshold;
    if (over <= 0) {
      const plan2Replacement = `Example: If you are on Plan 2 and earn ${formattedSalary} a year, you are under the £27,295 threshold, so your current repayments are **£0** (you pay 9% of £0).`;
      text = text.replace(/Example: If you are on Plan 2 and earn £30,295 a year, you are £3,000 over the threshold\. You pay 9% of that £3,000\. That's £270 a year, or just \*\*£22\.50 a month\*\*\./g, plan2Replacement);
    } else {
      const yearly = Math.round(over * 0.09);
      const monthly = (over * 0.09 / 12).toFixed(2);
      const plan2Replacement = `Example: If you are on Plan 2 and earn ${formattedSalary} a year, you are £${over.toLocaleString("en-GB")} over the threshold. You pay 9% of that £${over.toLocaleString("en-GB")}. That's £${yearly.toLocaleString("en-GB")} a year, or just **£${monthly} a month**.`;
      text = text.replace(/Example: If you are on Plan 2 and earn £30,295 a year, you are £3,000 over the threshold\. You pay 9% of that £3,000\. That's £270 a year, or just \*\*£22\.50 a month\*\*\./g, plan2Replacement);
    }
  }

  // 3. Replace mortgages multiplier in Lesson 8
  if (subTopicId === "lesson-08") {
    const singleLoan = Math.round(salary * 4.5);
    const jointLoan = Math.round((salary + 35000) * 4.5);

    text = text.replace(
      /- \*\*Single applicant:\*\* £30,000 × 4.5 = maximum loan of \*\*£135,000\*\*/g,
      `- **Single applicant:** ${formattedSalary} × 4.5 = maximum loan of **£${singleLoan.toLocaleString("en-GB")}**`
    );
    text = text.replace(
      /- \*\*Joint applicants:\*\* \(£30,000 \+ £35,000\) × 4.5 = maximum loan of \*\*£292,500\*\*/g,
      `- **Joint applicants:** (${formattedSalary} + £35,000) × 4.5 = maximum loan of **£${jointLoan.toLocaleString("en-GB")}**`
    );
  }

  // 4. Customize Script pitch target in Lesson 18
  if (subTopicId === "lesson-18") {
    const minSalary = Math.round(salary * 1.05);
    const maxSalary = Math.round(salary * 1.15);
    const targetSalary = Math.round(salary * 1.10);

    text = text.replace(
      /between £X and £Y/g,
      `between £${minSalary.toLocaleString("en-GB")} and £${maxSalary.toLocaleString("en-GB")}`
    );
    text = text.replace(
      /adjusting my salary to £Z/g,
      `adjusting my salary to £${targetSalary.toLocaleString("en-GB")}`
    );
  }

  // 5. Replace lifestyle creep raise examples in Lesson 19
  if (subTopicId === "lesson-19") {
    const raise = Math.round((salary * 0.08) / 12 / 10) * 10 || 200;
    const save = raise / 2;
    const formattedRaise = "£" + raise.toLocaleString("en-GB");
    const formattedSave = "£" + save.toLocaleString("en-GB");

    text = text.replace(
      /increases by £200 a month/g,
      `increases by ${formattedRaise} a month`
    );
    text = text.replace(
      /move £100 into your ISA/g,
      `move ${formattedSave} into your ISA`
    );
    text = text.replace(
      /increasing your contribution by £100/g,
      `increasing your contribution by ${formattedSave}`
    );
    text = text.replace(
      /cost you \*\*less than £100\*\*/g,
      `cost you **less than ${formattedSave}**`
    );
  }

  // 6. Tax Bracket example in Lesson 48
  if (subTopicId === "lesson-48") {
    const sBase = salary;
    const sRaise = salary + 2000;
    const isHigher = sBase >= 50270;

    if (!isHigher) {
      text = text.replace(
        /Imagine your annual salary increases from £50,000 to £52,000\. This puts you £1,730 over the Higher Rate threshold\./g,
        `Imagine your annual salary increases from £${sBase.toLocaleString("en-GB")} to £${sRaise.toLocaleString("en-GB")}.`
      );
      text = text.replace(
        /- You pay 0% on your first £12,570\.\n- You pay 20% on the next £37,700 \(the basic rate layer\)\.\n- You only pay the 40% rate on the £1,730 that crossed over the line\./g,
        `- You pay 0% on your first £12,570.\n- You pay 20% on the portion above £12,570 up to your new salary.\n- You pay 0% higher rate tax because your earnings didn't cross the £50,270 boundary.`
      );
    } else {
      const crossover = sRaise - Math.max(sBase, 50270);
      text = text.replace(
        /Imagine your annual salary increases from £50,000 to £52,000\. This puts you £1,730 over the Higher Rate threshold\./g,
        `Imagine your annual salary increases from £${sBase.toLocaleString("en-GB")} to £${sRaise.toLocaleString("en-GB")}. This puts your raise in the Higher Rate (40%) bracket.`
      );
      text = text.replace(
        /You only pay the 40% rate on the £1,730 that crossed over the line\./g,
        `You only pay the 40% rate on the £${crossover.toLocaleString("en-GB")} that crossed over the line.`
      );
    }
  }

  // 7. Add estimated 50/30/20 split context in Lesson 3
  if (subTopicId === "lesson-03") {
    const netPay = estimateNetPay(salary, profile);
    const needs = Math.round(netPay * 0.5);
    const wants = Math.round(netPay * 0.3);
    const savings = Math.round(netPay * 0.2);

    const splitContext = `
---

## Your Personal 50/30/20 Split

Based on your salary of **${formattedSalary}** a year, your estimated monthly take-home pay is **£${netPay.toLocaleString("en-GB")}** (after estimated tax, NI, pension, and student loan). Here is how you could divide it:

- **50% Needs:** **£${needs.toLocaleString("en-GB")}** (rent, bills, food)
- **30% Wants:** **£${wants.toLocaleString("en-GB")}** (fun, dining out, subs)
- **20% Savings:** **£${savings.toLocaleString("en-GB")}** (emergency buffer, investing)

*Adjust these boundaries as needed — if you live in a high-cost area, a 60/20/20 split is perfectly fine!*
`;
    text = text + splitContext;
  }

  return text;
}

const getReadingTime = (content: string): string => {
  const match = content.match(/\*\*Reading Time:\*\*\s*(.*?)(?:\r?\n|$)/i);
  return match ? match[1].trim() : "5 minutes";
};

interface CardConfig {
  icon: any;
  color: string;
  bgColor: string;
  labelColor: string;
}

function getCardConfig(term: string): CardConfig {
  const t = term.toLowerCase();
  
  if (t.includes("gross")) {
    return {
      icon: TrendingUp,
      color: "text-[#e9694a]",
      bgColor: "bg-[#fbe1d6]",
      labelColor: "text-[#b8523c]"
    };
  }
  if (t.includes("net")) {
    return {
      icon: Wallet,
      color: "text-[#5fab84]",
      bgColor: "bg-[#d5ebde]",
      labelColor: "text-[#4a8566]"
    };
  }
  if (t.includes("example")) {
    return {
      icon: Sparkles,
      color: "text-[#efb13c]",
      bgColor: "bg-[#f9e7be]",
      labelColor: "text-[#c28720]"
    };
  }
  if (t.includes("rule") || t.includes("law") || t.includes("policy") || t.includes("guideline")) {
    return {
      icon: Scale,
      color: "text-[#6c3fa2]",
      bgColor: "bg-[#e5d6f3]",
      labelColor: "text-[#562f83]"
    };
  }
  if (t.includes("step") || t.includes("action") || t.includes("caution") || t.includes("warning")) {
    return {
      icon: AlertTriangle,
      color: "text-[#e9694a]",
      bgColor: "bg-[#fbe1d6]",
      labelColor: "text-[#b8523c]"
    };
  }
  if (t.includes("home") || t.includes("mortgage") || t.includes("rent") || t.includes("property") || t.includes("buy")) {
    return {
      icon: Home,
      color: "text-[#3b82f6]",
      bgColor: "bg-[#d8e1ee]",
      labelColor: "text-[#2563eb]"
    };
  }
  if (t.includes("percent") || t.includes("fee") || t.includes("cost") || t.includes("price") || t.includes("tax")) {
    return {
      icon: Percent,
      color: "text-[#e9694a]",
      bgColor: "bg-[#fbe1d6]",
      labelColor: "text-[#b8523c]"
    };
  }
  
  return {
    icon: Info,
    color: "text-[#3b82f6]",
    bgColor: "bg-[#d8e1ee]",
    labelColor: "text-[#2563eb]"
  };
}

export function PlayfulSubTopic() {
  const navigate = useNavigate();
  const { topicId, subTopicId } = useParams<{ topicId: string; subTopicId: string }>();
  const { profile } = useProfile();

  // Fire-and-forget: check if user is starting a topic that seems off-profile
  useEffect(() => {
    if (!topicId) return;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const facts = await fetchStoryFacts(session.user.id);
      if (!isTopicOffProfile(topicId, facts)) return;
      // Check for an unanswered nudge for this course to avoid re-asking
      const nudge = await createNudge(
        session.user.id,
        { type: "course_start_off_profile", courseId: topicId, detail: `started ${topicId}` },
        buildNudgeQuestion(topicId)
      );
      if (nudge) await sendPushNudge(nudge);
    })();
  }, [topicId]);

  const topic = topics.find((t) => t.id === topicId);
  const subTopic = topic?.subTopics.find((s) => s.id === subTopicId);

  if (!topic || !subTopic) {
    return (
      <div className="anp-plan">
        <div className="anp-plan__scroll" style={{ padding: "24px 16px" }}>
          <p style={{ color: "var(--p-ink-3)", textAlign: "center" }}>Content not found.</p>
        </div>
      </div>
    );
  }

  const salaryNum = profile?.salary ? parseFloat(profile.salary.replace(/[^0-9.]/g, "")) : 28000;
  const processedContent = customizeLessonText(subTopic.content, subTopic.id, salaryNum || 28000, profile);

  const renderInline = (text: string): ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ fontWeight: 800, color: "#1c1a24" }}>{part.slice(2, -2)}</strong>;
      }
      return part as ReactNode;
    });
  };

  const isSeparatorRow = (line: string) => /^\|[\s\-:|]+\|$/.test(line.trim());

  const renderTable = (block: string, key: number) => {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    const dataLines = lines.filter(l => !isSeparatorRow(l));
    if (dataLines.length < 1) return null;

    const parseRow = (line: string) =>
      line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);

    const headers = parseRow(dataLines[0]);
    const rows = dataLines.slice(1).map(parseRow);

    return (
      <div key={key} style={{ overflowX: "auto", margin: "24px 0", borderRadius: "16px", border: "1px solid #e6dbc4", backgroundColor: "#ffffff", boxShadow: "0 2px 8px rgba(28,26,36,0.03)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <thead>
            <tr style={{ backgroundColor: "#fbf5e9", borderBottom: "1px solid #e6dbc4" }}>
              {headers.map((h, i) => (
                <th key={i} style={{ fontWeight: "bold", color: "#1c1a24", padding: "12px", textAlign: "left" }}>
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e6dbc4" }}>
                {row.map((c, j) => (
                  <td key={j} style={{ padding: "12px", color: "#5f5848", verticalAlign: "top" }}>
                    {renderInline(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = (content: string): ReactNode[] => {
    const blocks = content.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
    const elements: ReactNode[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // Skip h1 — title already shown in header
      if (block.startsWith("# ")) continue;

      // Reading time (handled in hero card, so skip)
      if (block.startsWith("**Reading Time:**")) {
        continue;
      }

      // h2
      if (block.startsWith("## ")) {
        elements.push(
          <h2 key={i} style={{ fontSize: "21px", fontWeight: "bold", color: "#1c1a24", marginTop: "28px", marginBottom: "14px", fontFamily: "Georgia, serif", lineHeight: "1.3" }}>
            {renderInline(block.replace(/^## /, ""))}
          </h2>
        );
        continue;
      }

      // h3
      if (block.startsWith("### ")) {
        elements.push(
          <h3 key={i} style={{ fontSize: "17px", fontWeight: "bold", color: "#1c1a24", marginTop: "20px", marginBottom: "10px", fontFamily: "Georgia, serif", lineHeight: "1.3" }}>
            {renderInline(block.replace(/^### /, ""))}
          </h3>
        );
        continue;
      }

      // Divider
      if (block === "---") {
        elements.push(<hr key={i} style={{ border: "none", borderTop: "1px solid #e6dbc4", margin: "24px 0" }} />);
        continue;
      }

      // Blockquote / action step
      if (block.startsWith("> ")) {
        const inner = block.replace(/^> /, "").trim();
        const match = inner.match(/^\*\*([^*]+?):\*\*\s*(.*)/s);
        if (match) {
          const actionTitle = match[1].trim().toUpperCase();
          const actionText = match[2].trim();
          elements.push(
            <div 
              key={i} 
              style={{
                backgroundColor: "#2e1b30", // Deep plum/burgundy color to distinguish it from the navy header card
                borderRadius: "20px",
                padding: "24px",
                marginTop: "24px",
                marginBottom: "24px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
              }}
            >
              {/* Soft coral background glow */}
              <div 
                style={{ 
                  position: "absolute",
                  borderRadius: "50%",
                  backgroundColor: "rgba(233, 105, 74, 0.08)", 
                  width: '100px', 
                  height: '100px', 
                  right: '-30px', 
                  top: '-20px' 
                }} 
              />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", position: "relative", zIndex: 10 }}>
                <div 
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(233, 105, 74, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(233, 105, 74, 0.3)",
                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={14} style={{ color: "#e9694a" }} />
                </div>
                <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em", color: "#e9694a" }}>
                  {actionTitle}
                </span>
              </div>
              <p style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#ffffff", margin: 0, position: "relative", zIndex: 10, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                {renderInline(actionText)}
              </p>
            </div>
          );
          continue;
        }

        elements.push(
          <blockquote key={i} style={{ borderLeft: "4px solid #e9694a", backgroundColor: "rgba(233,105,74,0.1)", borderRadius: "0 16px 16px 0", padding: "16px 18px", margin: "20px 0", fontSize: "14.5px", color: "#1c1a24", lineHeight: "1.6", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {renderInline(inner)}
          </blockquote>
        );
        continue;
      }

      // Table
      if (block.includes("|")) {
        const tableEl = renderTable(block, i);
        if (tableEl) { elements.push(tableEl); continue; }
      }

      // List (- or *)
      const lines = block.split("\n");
      if (lines.every(l => l.match(/^[-*] /))) {
        elements.push(
          <ul key={i} style={{ padding: 0, margin: 0, listStyleType: "none", marginBottom: "24px" }}>
            {lines.map((item, j) => {
              const isLast = j === lines.length - 1;
              return (
                <li 
                  key={j} 
                  style={{ 
                    display: "flex", 
                    gap: "12px", 
                    alignItems: "flex-start", 
                    borderBottom: isLast ? "none" : "1px solid #e6dbc4", 
                    paddingBottom: isLast ? "0px" : "14px", 
                    marginBottom: isLast ? "0px" : "14px" 
                  }}
                >
                  <span 
                    style={{ 
                      width: "6px", 
                      height: "6px", 
                      borderRadius: "50%", 
                      backgroundColor: "#e9694a", 
                      marginTop: "8px", 
                      flexShrink: 0 
                    }} 
                  />
                  <span style={{ fontSize: "15px", lineHeight: "1.6", color: "#5f5848", flex: 1, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                    {renderInline(item.replace(/^[-*] /, ""))}
                  </span>
                </li>
              );
            })}
          </ul>
        );
        continue;
      }

      // Paragraph Cards or Standard Paragraph
      const cardMatch = block.match(/^(?:\*\*([^*]+?):\*\*|\*\*([^*]+?)\*\*:)\s*(.*)/s);
      if (cardMatch) {
        const term = (cardMatch[1] || cardMatch[2]).trim();
        const rest = cardMatch[3].trim();
        
        let title = "";
        let description = "";
        const sentenceBoundary = rest.indexOf(". ");
        if (sentenceBoundary !== -1) {
          title = rest.substring(0, sentenceBoundary + 1).trim();
          description = rest.substring(sentenceBoundary + 1).trim();
        } else {
          const lastPeriod = rest.indexOf(".");
          if (lastPeriod !== -1) {
            title = rest.substring(0, lastPeriod + 1).trim();
            description = rest.substring(lastPeriod + 1).trim();
          } else {
            description = rest;
          }
        }

        const config = getCardConfig(term);
        const IconComp = config.icon;

        elements.push(
          <div 
            key={i} 
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #e6dbc4",
              padding: "20px",
              marginTop: "20px",
              marginBottom: "20px",
              boxShadow: "0 4px 12px rgba(28,26,36,0.03)",
              display: "flex",
              gap: "16px",
              alignItems: "flex-start"
            }}
          >
            <div 
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
              className={config.bgColor}
            >
              <IconComp size={20} className={config.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span 
                style={{ 
                  fontSize: "10px", 
                  fontWeight: 800, 
                  textTransform: "uppercase", 
                  letterSpacing: "0.1em", 
                  marginBottom: "4px", 
                  display: "block" 
                }}
                className={config.labelColor}
              >
                {term}
              </span>
              {title && (
                <h4 style={{ fontSize: "15.5px", fontWeight: "bold", color: "#1c1a24", marginBottom: "4px", lineHeight: "1.3", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  {renderInline(title)}
                </h4>
              )}
              {description && (
                <p style={{ fontSize: "13.5px", lineHeight: "1.5", color: "#5f5848", margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  {renderInline(description)}
                </p>
              )}
            </div>
          </div>
        );
        continue;
      }

      // Standard Paragraph
      elements.push(
        <p key={i} style={{ fontSize: "15px", lineHeight: "1.65", color: "#5f5848", marginBottom: "16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          {renderInline(block)}
        </p>
      );
    }

    return elements;
  };

  const currentIndex = topic ? topic.subTopics.findIndex((s) => s.id === subTopicId) : 0;
  const totalSubTopics = topic ? topic.subTopics.length : 0;
  const readingTime = getReadingTime(processedContent);

  return (
    <div className="anp-plan" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", backgroundColor: "#f4f0e6", position: "relative" }}>
      {/* Top bar */}
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "max(12px, env(safe-area-inset-top)) 20px 10px 20px", 
          backgroundColor: "#f4f0e6", 
          flexShrink: 0 
        }}
      >
        <button
          onClick={() => navigate(`/topic/${topicId}`)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid #e6dbc4",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
            flexShrink: 0
          }}
          aria-label="Back to lesson plan"
        >
          <ArrowLeft size={16} strokeWidth={2.5} style={{ color: "#1c1a24" }} />
        </button>
        <h1 style={{ fontSize: "15px", fontWeight: "bold", color: "#1c1a24", textAlign: "center", flex: 1, margin: "0 12px", fontFamily: "system-ui, -apple-system, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {subTopic.title}
        </h1>
        <div style={{ backgroundColor: "#fbe1d6", padding: "4px 10px", borderRadius: "999px", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#b8523c", letterSpacing: "0.05em", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {currentIndex + 1} of {totalSubTopics}
          </span>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div 
        className="anp-plan__scroll" 
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          overflowX: "hidden", 
          paddingLeft: "20px", 
          paddingRight: "20px", 
          paddingBottom: "40px", 
          paddingTop: "6px",
          backgroundColor: "#f4f0e6" 
        }}
      >
        {/* Hero Card */}
        <div 
          style={{ 
            backgroundColor: "#1c2a47", 
            borderRadius: "24px", 
            padding: "24px", 
            position: "relative", 
            overflow: "hidden", 
            marginBottom: "24px", 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "space-between", 
            minHeight: "160px",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
          }}
        >
          {/* Dark purple/plum circle overlay */}
          <div 
            style={{ 
              position: "absolute",
              borderRadius: "50%",
              backgroundColor: "#412a4c",
              width: '140px', 
              height: '140px', 
              right: '-30px', 
              top: '-10px',
              opacity: 0.85 
            }} 
          />
          <div style={{ position: "relative", zIndex: 10, flex: 1 }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#e9694a", marginBottom: "8px", display: "block", fontFamily: "system-ui, -apple-system, sans-serif" }}>
              {topic.title}
            </span>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff", lineHeight: "1.25", marginBottom: "16px", paddingRight: "40px", fontFamily: "Georgia, serif" }}>
              {subTopic.title}
            </h2>
          </div>
          <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: "16px", color: "#95a4bb", fontSize: "12px", fontWeight: "600", marginTop: "4px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={13} style={{ color: "#95a4bb" }} />
              {readingTime}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText size={13} style={{ color: "#95a4bb" }} />
              Read + quiz
            </span>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px", paddingLeft: "4px", paddingRight: "4px", flexShrink: 0 }}>
          {Array.from({ length: totalSubTopics }).map((_, idx) => {
            let bg = "#e6dbc4"; // Muted/future grey
            if (idx <= currentIndex) {
              bg = "#e9694a"; // Completed or active
            } else if (idx === currentIndex + 1) {
              bg = "#fbe1d6"; // Next up peach
            }
            return (
              <div 
                key={idx} 
                style={{ 
                  height: "4px", 
                  flex: 1, 
                  borderRadius: "999px", 
                  backgroundColor: bg,
                  transition: "background-color 300ms ease" 
                }} 
              />
            );
          })}
        </div>

        {/* Content Area */}
        <div style={{ color: "#5f5848", lineHeight: "1.6" }}>
          {renderContent(processedContent)}
        </div>

        {/* Quiz CTA */}
        <button
          onClick={() => navigate(`/topic/${topicId}/subtopic/${subTopicId}/quiz`)}
          style={{
            width: "100%",
            backgroundImage: "linear-gradient(135deg, #ff9b7d 0%, #ff7350 100%)", // Lighter, more vibrant sunset coral-peach gradient
            color: "#ffffff", // Pure white typography
            fontSize: "15px",
            fontWeight: "bold",
            padding: "16px 20px",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid rgba(255, 255, 255, 0.3)", // Slightly brighter glassmorphic border for lighter background
            cursor: "pointer",
            marginTop: "24px",
            boxShadow: "0 8px 20px -4px rgba(255, 115, 80, 0.3)", // Softer coral glow shadow
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PenTool size={16} style={{ color: "#ffffff" }} />
            <span>Start Quiz</span>
          </span>
          <ChevronRight size={16} strokeWidth={2.5} style={{ color: "#ffffff" }} />
        </button>

        {/* Spacer at the bottom to prevent layout clipping by the phone frame corners */}
        <div style={{ height: "64px" }} />
      </div>

      <LessonChatBot
        lessonTitle={subTopic.title}
        topicTitle={topic.title}
        lessonContent={processedContent}
      />

      <style>{`
        .anp-plan {
          background-color: #f4f0e6 !important;
        }
        .anp-plan__scroll {
          background-color: #f4f0e6 !important;
        }
      `}</style>
    </div>
  );
}
