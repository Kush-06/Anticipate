import { useEffect } from "react";
import { Trophy, RotateCcw, ChevronRight, Award } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router";
import confetti from "canvas-confetti";

export function QuizResultPage() {
  const { topicId, subTopicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalQuestions = 0, correctAnswers = 0, allCorrect = false } = location.state || {};

  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (allCorrect) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [allCorrect]);

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

      {/* Results content */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-4 flex flex-col items-center justify-center" style={{ scrollbarWidth: "none" }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        {allCorrect ? (
          <>
            {/* Success icon */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl">
                <Trophy size={48} strokeWidth={2} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <Award size={20} strokeWidth={2.5} className="text-white" />
                </div>
              </div>
            </div>

            {/* Success message */}
            <h1 className="text-[24px] font-bold text-gray-900 text-center mb-2">
              Perfect Score!
            </h1>
            <p className="text-[14px] text-gray-600 text-center mb-6 max-w-[280px]">
              Congratulations! You've mastered this topic and got all {totalQuestions} questions correct.
            </p>

            {/* Stats card */}
            <div className="w-full max-w-[300px] bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border-2 border-emerald-200 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wide">
                  Your Score
                </span>
                <span className="text-[24px] font-bold text-emerald-600">
                  {percentage}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-emerald-800">Correct Answers</span>
                <span className="font-bold text-emerald-900">{correctAnswers}/{totalQuestions}</span>
              </div>
            </div>

            {/* Completion badge */}
            <div className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm mb-6 w-full max-w-[300px]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
                  <Award size={24} strokeWidth={2} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[12px] font-bold text-gray-900 mb-0.5">
                    Topic Completed!
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    This topic is now marked as complete
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Partial success icon */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl mb-6">
              <RotateCcw size={42} strokeWidth={2} className="text-white" />
            </div>

            {/* Partial success message */}
            <h1 className="text-[24px] font-bold text-gray-900 text-center mb-2">
              Good Effort!
            </h1>
            <p className="text-[14px] text-gray-600 text-center mb-6 max-w-[280px]">
              You got {correctAnswers} out of {totalQuestions} questions correct. Review the material and try again!
            </p>

            {/* Stats card */}
            <div className="w-full max-w-[300px] bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 border-2 border-amber-200 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wide">
                  Your Score
                </span>
                <span className="text-[24px] font-bold text-amber-600">
                  {percentage}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-amber-800">Correct Answers</span>
                <span className="font-bold text-amber-900">{correctAnswers}/{totalQuestions}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-4 flex-shrink-0 space-y-2.5">
        {allCorrect ? (
          <button
            onClick={() => navigate(`/topic/${topicId}`)}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] transition-all shadow-sm"
          >
            <span>Back to Topics</span>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate(`/topic/${topicId}/subtopic/${subTopicId}/quiz`)}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:from-sky-600 hover:to-sky-700 active:scale-[0.98] transition-all shadow-sm"
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              <span>Retake Quiz</span>
            </button>
            <button
              onClick={() => navigate(`/topic/${topicId}`)}
              className="w-full bg-white text-gray-700 text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm border border-gray-200"
            >
              <span>Back to Topics</span>
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
