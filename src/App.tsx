import { BrowserRouter, Routes, Route } from "react-router";
import { Capacitor } from "@capacitor/core";
import { HomePage } from "./components/HomePage";
import { TopicDetailPage } from "./components/TopicDetailPage";
import { ContentPage } from "./components/ContentPage";
import { ContentPageWithJargon } from "./components/ContentPageWithJargon";
import { QuizPage } from "./components/QuizPage";
import { QuizResultPage } from "./components/QuizResultPage";

export default function App() {
  const platform = Capacitor.getPlatform();
  const isNative = platform === 'android' || platform === 'ios';

  const AppRoutes = (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/topic/:topicId" element={<TopicDetailPage />} />
      <Route path="/topic/pension/subtopic/auto-enrolment" element={<ContentPageWithJargon />} />
      <Route path="/topic/:topicId/subtopic/:subTopicId" element={<ContentPage />} />
      <Route path="/topic/:topicId/subtopic/:subTopicId/quiz" element={<QuizPage />} />
      <Route path="/topic/:topicId/subtopic/:subTopicId/quiz/result" element={<QuizResultPage />} />
    </Routes>
  );

  // Mobile view
  if (isNative) {
    return (
      <BrowserRouter>
        <div className="w-full h-screen bg-[#EDEEF2] overflow-hidden flex flex-col">
          {AppRoutes}
        </div>
      </BrowserRouter>
    );
  }

  // Web view
  return (
    <BrowserRouter>
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 py-8"
        style={{ background: "#D6D9E0", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        <div
          className="relative bg-[#EDEEF2] overflow-hidden flex flex-col"
          style={{
            width: "min(340px, calc(100vw - 2rem))",
            aspectRatio: "9 / 16",
            borderRadius: "2.5rem",
            boxShadow: "0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.14)",
          }}
        >
          {AppRoutes}
        </div>
      </div>
    </BrowserRouter>
  );
}