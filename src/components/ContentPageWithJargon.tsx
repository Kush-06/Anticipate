import { useRef } from "react";
import { ArrowLeft, MoreHorizontal, MousePointer2, ChevronRight, Lightbulb } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { getTopicById, getSubTopicById } from "../data/topics";

function DocumentView({ highlightRef, highlightText }: { highlightRef?: React.RefObject<HTMLSpanElement>, highlightText?: string }) {
  return (
    <div
      className="flex-1 overflow-y-auto px-5 pt-3 pb-0"
      style={{ scrollbarWidth: "none", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Document paper */}
      <div
        className="bg-white rounded-xl shadow-md border border-gray-200 px-5 py-5"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {/* Document header */}
        <div className="text-center mb-4 pb-3 border-b border-gray-200">
          <p className="text-[8px] font-sans font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
            CONFIDENTIAL — EMPLOYMENT AGREEMENT
          </p>
          <h1 className="text-xs font-bold text-gray-800">Graduate Employment Contract</h1>
          <p className="text-[8px] text-gray-400 mt-0.5 font-sans">Ref: HR/2026/GEC-0142</p>
        </div>

        {/* Section 4 heading */}
        <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-gray-400 mb-1">
          Section 4 — Remuneration &amp; Benefits
        </p>

        {/* 4.1 */}
        <p className="text-[8.5px] font-sans font-semibold text-gray-700 mb-0.5">4.1 Base Salary</p>
        <p className="text-[8px] leading-relaxed text-gray-500 mb-3 font-sans">
          The Employee shall receive an annual gross salary of{" "}
          <span className="font-semibold text-gray-700">£30,000</span>, payable in equal monthly
          instalments on the last working day of each calendar month, subject to statutory
          deductions including income tax and National Insurance contributions.
        </p>

        {/* 4.2 — key paragraph */}
        <p className="text-[8.5px] font-sans font-semibold text-gray-700 mb-0.5">
          4.2 Workplace Pension
        </p>
        <p className="text-[8px] leading-relaxed text-gray-500 font-sans">
          Upon commencement of employment, you will be subject to statutory{" "}
          {/* ── Highlighted clickable phrase ─────────────────────── */}
          <span className="relative inline">
            <span
              ref={highlightRef}
              className="relative inline-block px-0.5 rounded-sm"
              style={{
                outline: "1.5px solid #22d3ee",
                boxShadow: "0 0 6px rgba(34,211,238,0.45), 0 0 2px rgba(34,211,238,0.6)",
                borderRadius: 3,
                textDecoration: "underline",
                textDecorationColor: "#22d3ee",
                textDecorationThickness: "1.5px",
                textUnderlineOffset: "2px",
                color: "#0284c7",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {highlightText || "pension auto-enrolment"}
            </span>
            {/* Cursor icon */}
            <span
              className="absolute pointer-events-none"
              style={{ top: "-10px", right: "-16px", zIndex: 10 }}
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0F2044] shadow-lg">
                <MousePointer2 size={10} strokeWidth={2} className="text-white" style={{ marginTop: 1 }} />
              </span>
            </span>
          </span>{" "}
          upon your first day of work. The Employer shall enrol you into the Company Pension Scheme
          in accordance with the Pensions Act 2008 and subsequent amendments.
        </p>

        <p className="text-[8px] leading-relaxed text-gray-500 mt-2 font-sans">
          Contributions shall be deducted at a minimum of{" "}
          <span className="font-semibold text-gray-700">5%</span> of qualifying earnings, with the
          Employer contributing a minimum of{" "}
          <span className="font-semibold text-gray-700">3%</span>, in compliance with auto-enrolment
          thresholds as set by The Pensions Regulator.
        </p>

        {/* Section 5 stub */}
        <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-gray-400 mt-4 mb-1">
          Section 5 — Obligations &amp; Conduct
        </p>
        <p className="text-[8px] leading-relaxed text-gray-500 font-sans">
          The Employee agrees to carry out their duties with reasonable care and skill, to follow all
          lawful and reasonable instructions of the Employer, and to comply with all applicable
          company policies in force from time to time...
        </p>

        {/* Signature lines */}
        <div className="mt-5 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Employee Signature", name: "Jessica Liu" },
              { label: "Authorised Signatory", name: "M. Thornton, HR" },
            ].map(({ label, name }) => (
              <div key={label}>
                <div className="h-px bg-gray-300 mb-1" />
                <p className="text-[7px] font-sans text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-[8px] font-sans text-gray-500 mt-0.5">{name}</p>
              </div>
            ))}
          </div>
          <p className="text-[7px] font-sans text-gray-400 text-center mt-3">
            Page 3 of 7 — HR/2026/GEC-0142
          </p>
        </div>
      </div>
    </div>
  );
}

function JargonDecoderSheet({ title }: { title: string }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-10"
      style={{
        height: "42%",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
      }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-8 h-1 rounded-full bg-gray-200" />
      </div>

      <div className="px-5 pt-1 pb-4 flex flex-col h-[calc(100%-24px)]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={13} strokeWidth={2} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-[11px] font-bold text-gray-900 leading-tight">
              Jargon Decoder
            </h2>
            <p className="text-[9px] font-semibold text-sky-600 leading-none">{title}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-3" />

        {/* Bullets */}
        <div className="flex-1 space-y-2.5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <style>{`div::-webkit-scrollbar{display:none}`}</style>
          {[
            {
              label: "What it means",
              text: "Your employer is legally required to automatically sign you up to a workplace pension. You don't need to do anything — it happens on day one.",
            },
            {
              label: "The 5% rule",
              text: "At least 5% of your qualifying earnings are deducted each month and placed into your pension pot before you receive your pay. Your employer tops this up with a further 3%.",
            },
            {
              label: "Why it matters",
              text: "This is free money from your employer! Even though it reduces your take-home pay slightly, you're building long-term wealth for retirement.",
            },
          ].map(({ label, text }) => (
            <div key={label} className="flex gap-2.5">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-bold text-gray-800 leading-tight mb-0.5">{label}</p>
                <p className="text-[8.5px] leading-relaxed text-gray-500">{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll to continue hint */}
        <p className="text-[8px] text-center text-gray-400 mt-2 mb-1">
          Scroll down to close and see the quiz button
        </p>
      </div>
    </div>
  );
}

export function ContentPageWithJargon() {
  const { topicId, subTopicId } = useParams();
  const navigate = useNavigate();
  const highlightRef = useRef<HTMLSpanElement>(null);

  const topic = getTopicById(topicId || "");
  const subTopic = getSubTopicById(topicId || "", subTopicId || "");

  if (!topic || !subTopic) {
    return (
      <div className="flex items-center justify-center h-full bg-[#EDEEF2]">
        <p className="text-gray-500">Content not found</p>
      </div>
    );
  }

  return (
    <div className="relative bg-[#EDEEF2] flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-1 flex-shrink-0">
        <span className="text-[10px] font-semibold text-gray-500 font-mono tracking-wide">9:41</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5 items-end h-3">
            {[3, 5, 7, 9].map((h, i) => (
              <div key={i} className="w-[3px] rounded-sm bg-gray-500" style={{ height: h }} />
            ))}
          </div>
          <div className="w-5 h-2.5 rounded-sm border border-gray-400 flex items-center px-0.5">
            <div className="w-3 h-1.5 rounded-[1px] bg-gray-500" />
          </div>
        </div>
      </div>

      {/* App top bar */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0 bg-[#EDEEF2]">
        <button
          onClick={() => navigate(`/topic/${topicId}`)}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={14} strokeWidth={2} className="text-gray-700" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-900 leading-none">{subTopic.title}</p>
          <p className="text-[8px] text-gray-400 mt-0.5">{topic.title}</p>
        </div>
        <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200">
          <MoreHorizontal size={14} strokeWidth={2} className="text-gray-700" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-2 flex-shrink-0">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full" style={{ width: "57%" }} />
        </div>
      </div>

      {/* Document body */}
      <DocumentView highlightRef={highlightRef} highlightText={subTopic.content} />

      {/* Quiz button at bottom */}
      <div className="px-5 pb-4 pt-2 flex-shrink-0 bg-[#EDEEF2]">
        <button
          onClick={() => navigate(`/topic/${topicId}/subtopic/${subTopicId}/quiz`)}
          className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:from-sky-600 hover:to-sky-700 active:scale-[0.98] transition-all shadow-sm"
        >
          <span>Take the Quiz</span>
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Jargon Decoder overlay */}
      <JargonDecoderSheet title={subTopic.title} />
    </div>
  );
}
