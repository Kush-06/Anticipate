import { BrowserRouter, Routes, Route } from "react-router";
import { Capacitor } from "@capacitor/core";
import { PlayfulHome } from "./components/PlayfulHome";
import { PlayfulLessonPlan } from "./components/PlayfulLessonPlan";
import { PlayfulQuiz } from "./components/PlayfulQuiz";
import { PlayfulSubTopic } from "./components/PlayfulSubTopic";

export default function App() {
  const platform = Capacitor.getPlatform();
  const isNative = platform === "android" || platform === "ios";

  const AppRoutes = (
    <Routes>
      <Route path="/" element={<PlayfulHome />} />
      <Route path="/topic/:topicId" element={<PlayfulLessonPlan />} />
      <Route path="/topic/:topicId/quiz" element={<PlayfulQuiz />} />
      <Route path="/topic/:topicId/subtopic/:subTopicId" element={<PlayfulSubTopic />} />
      <Route path="/topic/:topicId/subtopic/:subTopicId/quiz" element={<PlayfulQuiz />} />
    </Routes>
  );

  // Native shell — full screen, no frame
  if (isNative) {
    return (
      <BrowserRouter>
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "var(--p-bg)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {AppRoutes}
        </div>
      </BrowserRouter>
    );
  }

  // Web shell — 9:16 phone frame centered on page
  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "2rem 0",
          background: "#c9bfb0",
        }}
      >
        <div
          style={{
            position: "relative",
            background: "var(--p-bg)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            width: "min(360px, calc(100vw - 2rem))",
            aspectRatio: "9 / 16",
            borderRadius: "2.5rem",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.14)",
          }}
        >
          {AppRoutes}
        </div>
      </div>
    </BrowserRouter>
  );
}
