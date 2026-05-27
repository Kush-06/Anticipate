import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { topics } from "../data/topics";

function getCompletionColor(percentage: number): string {
  if (percentage === 0) return "#94a3b8";
  if (percentage < 40) return "#ef4444";
  if (percentage < 70) return "#f59e0b";
  return "#10b981";
}

export function HomePage() {
  const navigate = useNavigate();

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

      {/* Header */}
      <div className="px-5 pt-3 pb-4 flex-shrink-0">
        <h1 className="text-[20px] font-bold text-gray-900 mb-1">
          Financial Literacy
        </h1>
        <p className="text-[13px] text-gray-500">
          Master essential money skills for your career
        </p>
      </div>

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: "none" }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        <div className="space-y-3">
          {topics.map((topic) => {
            const completionColor = getCompletionColor(topic.completion);
            const circumference = 2 * Math.PI * 28;
            const strokeDashoffset = circumference - (topic.completion / 100) * circumference;

            return (
              <button
                key={topic.id}
                onClick={() => navigate(`/topic/${topic.id}`)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Circular progress */}
                  <div className="relative flex-shrink-0">
                    <svg width="64" height="64" className="transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="6"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={completionColor}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                      />
                    </svg>
                    {/* Icon and percentage */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[20px] leading-none mb-0.5">{topic.icon}</span>
                      <span className="text-[9px] font-bold" style={{ color: completionColor }}>
                        {topic.completion}%
                      </span>
                    </div>
                  </div>

                  {/* Title and sub-topics count */}
                  <div className="flex-1 text-left">
                    <h3 className="text-[14px] font-bold text-gray-900 mb-1">
                      {topic.title}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {topic.subTopics.filter(st => st.completed).length} of {topic.subTopics.length} topics completed
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={18} strokeWidth={2} className="text-gray-400 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
