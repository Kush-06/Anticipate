import { useNavigate, useParams } from "react-router";
import { useEffect } from "react";
import { topics } from "../data/topics";
import { ChevronRight, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { TopicIcon } from "./TopicIcon";
import { useProfile, type UserProfile } from "../context/ProfileContext";
import { supabase } from "@backend/supabaseClient";
import { fetchStoryFacts } from "@backend/profileService";
import { createNudge, sendPushNudge } from "@backend/nudgeService";
import { isTopicOffProfile, buildNudgeQuestion } from "../utils/offProfileDetector"
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
  // Intentionally only runs on first mount for this lesson
   
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
        return <strong key={i}>{part.slice(2, -2)}</strong>;
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
      <div key={key} className="anp-subtopic__table-wrap">
        <table className="anp-subtopic__table">
          <thead>
            <tr>{headers.map((h, i) => <th key={i}>{renderInline(h)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>{row.map((c, j) => <td key={j}>{renderInline(c)}</td>)}</tr>
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

      // Reading time
      if (block.startsWith("**Reading Time:**")) {
        const time = block.replace("**Reading Time:**", "").trim();
        elements.push(
          <p key={i} className="anp-subtopic__reading-time">⏱ {time}</p>
        );
        continue;
      }

      // h2
      if (block.startsWith("## ")) {
        elements.push(
          <h2 key={i} className="anp-subtopic__h2">{renderInline(block.replace(/^## /, ""))}</h2>
        );
        continue;
      }

      // h3
      if (block.startsWith("### ")) {
        elements.push(
          <h3 key={i} className="anp-subtopic__h3">{renderInline(block.replace(/^### /, ""))}</h3>
        );
        continue;
      }

      // Divider
      if (block === "---") {
        elements.push(<hr key={i} className="anp-subtopic__hr" />);
        continue;
      }

      // Blockquote / action step
      if (block.startsWith("> ")) {
        const inner = block.replace(/^> /, "");
        elements.push(
          <blockquote key={i} className="anp-subtopic__blockquote">
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
          <ul key={i} className="anp-subtopic__ul">
            {lines.map((item, j) => (
              <li key={j}>{renderInline(item.replace(/^[-*] /, ""))}</li>
            ))}
          </ul>
        );
        continue;
      }

      // Paragraph
      elements.push(
        <p key={i} className="anp-subtopic__p">{renderInline(block)}</p>
      );
    }

    return elements;
  };

  return (
    <div className="anp-plan" style={{ position: "relative" }}>
      {/* Top bar */}
      <div className="anp-plan__topbar">
        <button
          className="anp-plan__back"
          onClick={() => navigate(`/topic/${topicId}`)}
          aria-label="Back to lesson plan"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="anp-plan__topbar-title">{subTopic.title}</span>
      </div>

      <div className="anp-plan__scroll" style={{ padding: "0 16px 32px" }}>
        {/* Header decoration */}
        <div className="anp-subtopic__header" style={{ backgroundColor: topic.color + "20" }}>
          <TopicIcon topicId={topic.id} size={32} color={topic.color} />
          <div className="anp-subtopic__topic-info">
            <span className="anp-subtopic__topic-title">{topic.title}</span>
            <h2 className="anp-subtopic__title">{subTopic.title}</h2>
          </div>
        </div>

        {/* Content Area */}
        <div className="anp-subtopic__content">
          {renderContent(processedContent)}
        </div>

        {/* Quiz CTA */}
        <button
          className="anp-plan__quiz-cta"
          style={{ margin: "24px 0 0", width: "100%" }}
          onClick={() => navigate(`/topic/${topicId}/subtopic/${subTopicId}/quiz`)}
        >
          <span>✍️</span>
          Start Quiz
          <ChevronRight size={18} style={{ marginLeft: "auto" }} />
        </button>
      </div>

      <LessonChatBot
        lessonTitle={subTopic.title}
        topicTitle={topic.title}
        lessonContent={processedContent}
      />

      <style>{`
        .anp-subtopic__header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border-radius: 20px;
          margin-top: 16px;
          margin-bottom: 24px;
        }
        .anp-subtopic__icon { font-size: 32px; }
        .anp-subtopic__topic-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          color: var(--p-ink-3);
          display: block;
        }
        .anp-subtopic__title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          color: var(--p-ink);
          line-height: 1.2;
        }
        .anp-subtopic__reading-time {
          font-size: 12px;
          font-weight: 600;
          color: var(--p-ink-3);
          margin-bottom: 20px;
        }
        .anp-subtopic__content {
          color: var(--p-ink-2);
          line-height: 1.6;
        }
        .anp-subtopic__h2 {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 800;
          color: var(--p-ink);
          margin-top: 28px;
          margin-bottom: 10px;
        }
        .anp-subtopic__h3 {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          color: var(--p-ink);
          margin-top: 20px;
          margin-bottom: 6px;
        }
        .anp-subtopic__p {
          font-size: 14px;
          margin-bottom: 12px;
        }
        .anp-subtopic__hr {
          border: none;
          border-top: 1px solid var(--p-ink-5, #e5e7eb);
          margin: 20px 0;
        }
        .anp-subtopic__blockquote {
          border-left: 3px solid var(--p-coral, #f97316);
          background: var(--p-coral, #f97316)14;
          border-radius: 0 12px 12px 0;
          padding: 12px 14px;
          margin: 16px 0;
          font-size: 14px;
          color: var(--p-ink);
          line-height: 1.55;
        }
        .anp-subtopic__ul {
          margin-bottom: 16px;
          padding-left: 20px;
        }
        .anp-subtopic__ul li {
          font-size: 14px;
          margin-bottom: 8px;
          list-style-type: disc;
        }
        .anp-subtopic__table-wrap {
          overflow-x: auto;
          margin: 16px 0;
          border-radius: 12px;
          border: 1px solid var(--p-ink-5, #e5e7eb);
        }
        .anp-subtopic__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .anp-subtopic__table th {
          background: var(--p-bg-2, #f3f4f6);
          font-weight: 700;
          color: var(--p-ink);
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid var(--p-ink-5, #e5e7eb);
        }
        .anp-subtopic__table td {
          padding: 9px 12px;
          color: var(--p-ink-2);
          border-bottom: 1px solid var(--p-ink-5, #e5e7eb);
          vertical-align: top;
        }
        .anp-subtopic__table tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
