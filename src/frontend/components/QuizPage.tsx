import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { getSubTopicById } from "../data/topics";

export function QuizPage() {
  const { topicId, subTopicId } = useParams();
  const navigate = useNavigate();
  const subTopic = getSubTopicById(topicId || "", subTopicId || "");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  if (!subTopic || !subTopic.quiz.length) {
    return (
      <div className="flex items-center justify-center h-full bg-[#EDEEF2]">
        <p className="text-gray-500">Quiz not found</p>
      </div>
    );
  }

  const currentQuestion = subTopic.quiz[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === subTopic.quiz.length - 1;
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowFeedback(true);
    setAnswers([...answers, isCorrect]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const allCorrect = [...answers, isCorrect].every(a => a);
      navigate(`/topic/${topicId}/subtopic/${subTopicId}/quiz/result`, {
        state: {
          totalQuestions: subTopic.quiz.length,
          correctAnswers: [...answers, isCorrect].filter(a => a).length,
          allCorrect
        }
      });
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

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
      <div className="flex items-center gap-3 px-5 pt-3 pb-3 flex-shrink-0">
        <button
          onClick={() => navigate(`/topic/${topicId}/subtopic/${subTopicId}`)}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all flex-shrink-0"
        >
          <ArrowLeft size={16} strokeWidth={2} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-[16px] font-bold text-gray-900">
            Quiz: {subTopic.title}
          </h1>
          <p className="text-[11px] text-gray-500">
            Question {currentQuestionIndex + 1} of {subTopic.quiz.length}
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="px-5 pb-4 flex-shrink-0">
        <div className="flex gap-1.5">
          {subTopic.quiz.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                idx < currentQuestionIndex
                  ? "bg-emerald-500"
                  : idx === currentQuestionIndex
                  ? "bg-sky-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question and answers */}
      <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: "none" }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        {/* Question card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-4">
          <p className="text-[14px] leading-relaxed text-gray-900 font-semibold">
            {currentQuestion.question}
          </p>
        </div>

        {/* Answer options */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectAnswer = idx === currentQuestion.correctAnswer;
            const showCorrect = showFeedback && isCorrectAnswer;
            const showIncorrect = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={idx}
                onClick={() => !showFeedback && setSelectedAnswer(idx)}
                disabled={showFeedback}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  showCorrect
                    ? "bg-emerald-50 border-emerald-500"
                    : showIncorrect
                    ? "bg-red-50 border-red-500"
                    : isSelected
                    ? "bg-sky-50 border-sky-500"
                    : "bg-white border-gray-200 hover:border-gray-300 active:scale-[0.99]"
                } ${showFeedback ? "cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {/* Radio button */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      showCorrect
                        ? "border-emerald-500 bg-emerald-500"
                        : showIncorrect
                        ? "border-red-500 bg-red-500"
                        : isSelected
                        ? "border-sky-500 bg-sky-500"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && !showFeedback && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                    {showCorrect && (
                      <CheckCircle2 size={16} strokeWidth={2.5} className="text-white" />
                    )}
                    {showIncorrect && (
                      <XCircle size={16} strokeWidth={2.5} className="text-white" />
                    )}
                  </div>

                  {/* Option text */}
                  <span
                    className={`text-[13px] font-medium flex-1 ${
                      showCorrect
                        ? "text-emerald-900"
                        : showIncorrect
                        ? "text-red-900"
                        : isSelected
                        ? "text-sky-900"
                        : "text-gray-700"
                    }`}
                  >
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback box */}
        {showFeedback && (
          <div
            className={`mt-4 p-4 rounded-2xl border-2 ${
              isCorrect
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle2 size={18} strokeWidth={2} className="text-emerald-600" />
              ) : (
                <XCircle size={18} strokeWidth={2} className="text-red-600" />
              )}
              <h3
                className={`text-[12px] font-bold ${
                  isCorrect ? "text-emerald-900" : "text-red-900"
                }`}
              >
                {isCorrect ? "Correct!" : "Not quite right"}
              </h3>
            </div>
            <p className={`text-[11px] leading-relaxed ${
              isCorrect ? "text-emerald-800" : "text-red-800"
            }`}>
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Submit/Next button */}
      <div className="px-5 pb-4 flex-shrink-0">
        {!showFeedback ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className={`w-full text-white text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${
              selectedAnswer === null
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-[0.98]"
            }`}
          >
            <span>Submit Answer</span>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] transition-all shadow-sm"
          >
            <span>{isLastQuestion ? "See Results" : "Next Question"}</span>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
