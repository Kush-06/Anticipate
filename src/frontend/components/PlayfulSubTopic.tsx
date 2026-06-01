import { useNavigate, useParams } from "react-router";
import { topics } from "../data/topics";
import { ChevronRight, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { TopicIcon } from "./TopicIcon";

export function PlayfulSubTopic() {
  const navigate = useNavigate();
  const { topicId, subTopicId } = useParams<{ topicId: string; subTopicId: string }>();

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
    <div className="anp-plan">
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
          {renderContent(subTopic.content)}
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
