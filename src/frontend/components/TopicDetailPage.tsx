import { ArrowLeft, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { getTopicById } from "../data/topics";

export function TopicDetailPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topic = getTopicById(topicId || "");

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-full bg-[#EDEEF2]">
        <p className="text-gray-500">Topic not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#EDEEF2]">
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

      {/* Header with back button */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-4 flex-shrink-0">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all flex-shrink-0"
        >
          <ArrowLeft size={16} strokeWidth={2} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[24px] leading-none">{topic.icon}</span>
            <h1 className="text-[18px] font-bold text-gray-900">
              {topic.title}
            </h1>
          </div>
          <p className="text-[12px] text-gray-500">
            Choose a topic to learn about
          </p>
        </div>
      </div>

      {/* Sub-topics list */}
      <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: "none" }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        <div className="space-y-2.5">
          {topic.subTopics.map((subTopic) => (
            <button
              key={subTopic.id}
              onClick={() => navigate(`/topic/${topicId}/subtopic/${subTopic.id}`)}
              className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                    subTopic.completed
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {subTopic.completed && (
                    <Check size={14} strokeWidth={3} className="text-white" />
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 text-left">
                  <h3 className={`text-[13px] font-semibold ${
                    subTopic.completed ? "text-gray-900" : "text-gray-700"
                  }`}>
                    {subTopic.title}
                  </h3>
                </div>

                {/* Status badge */}
                {subTopic.completed ? (
                  <div className="px-2.5 py-1 rounded-full bg-emerald-50 flex-shrink-0">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">
                      Completed
                    </span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1 rounded-full bg-sky-50 flex-shrink-0">
                    <span className="text-[9px] font-bold text-sky-600 uppercase tracking-wide">
                      Start
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
