import { BrowserRouter, Routes, Route } from "react-router";
import { HomePage } from "./components/HomePage";
import { TopicDetailPage } from "./components/TopicDetailPage";
import { ContentPage } from "./components/ContentPage";
import { ContentPageWithJargon } from "./components/ContentPageWithJargon";
import { QuizPage } from "./components/QuizPage";
import { QuizResultPage } from "./components/QuizResultPage";

export default function App() {
  return (
    <BrowserRouter>
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 py-8"
        style={{ background: "#D6D9E0", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* Phone container */}
        <div
          className="relative bg-[#EDEEF2] overflow-hidden flex flex-col"
          style={{
            width: "min(340px, calc(100vw - 2rem))",
            aspectRatio: "9 / 16",
            borderRadius: "2.5rem",
            boxShadow: "0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.14)",
          }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/topic/:topicId" element={<TopicDetailPage />} />
            {/* Special route for auto-enrolment with jargon decoder */}
            <Route path="/topic/pension/subtopic/auto-enrolment" element={<ContentPageWithJargon />} />
            {/* Default content page for all other sub-topics */}
            <Route path="/topic/:topicId/subtopic/:subTopicId" element={<ContentPage />} />
            <Route path="/topic/:topicId/subtopic/:subTopicId/quiz" element={<QuizPage />} />
            <Route path="/topic/:topicId/subtopic/:subTopicId/quiz/result" element={<QuizResultPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
