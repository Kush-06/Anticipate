import { useNavigate, useParams } from "react-router";
import { topics } from "../data/topics";
import { ChevronRight, ArrowLeft } from "lucide-react";

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

  // Simple "markdown" renderer
  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, i) => {
      if (block.startsWith("### ")) {
        return <h3 key={i} className="anp-subtopic__h3">{block.replace("### ", "")}</h3>;
      }
      if (block.startsWith("* ")) {
        const items = block.split("\n").map(item => item.replace("* ", ""));
        return (
          <ul key={i} className="anp-subtopic__ul">
            {items.map((item, j) => <li key={j}>{renderText(item)}</li>)}
          </ul>
        );
      }
      return <p key={i} className="anp-subtopic__p">{renderText(block)}</p>;
    });
  };

  const renderText = (text: string) => {
    // Handle bold **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
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
           <span className="anp-subtopic__icon">{topic.icon}</span>
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
        .anp-subtopic__icon {
          font-size: 32px;
        }
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
        .anp-subtopic__content {
          color: var(--p-ink-2);
          line-height: 1.6;
        }
        .anp-subtopic__h3 {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--p-ink);
          margin-top: 24px;
          margin-bottom: 8px;
        }
        .anp-subtopic__p {
          font-size: 14px;
          margin-bottom: 12px;
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
      `}</style>
    </div>
  );
}
