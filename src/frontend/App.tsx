import { BrowserRouter, Routes, Route } from "react-router";
import { Capacitor } from "@capacitor/core";
import { PlayfulHome } from "./components/PlayfulHome";
import { PlayfulLessonPlan } from "./components/PlayfulLessonPlan";
import { PlayfulQuiz } from "./components/PlayfulQuiz";
import { PlayfulSubTopic } from "./components/PlayfulSubTopic";
import { MainLayout } from "./components/MainLayout";
import { DocumentLibrary } from "./components/DocumentLibrary";
import { DocumentViewer } from "./components/DocumentViewer";
import { DocumentSummary } from "./components/DocumentSummary";
import { TimelineOverview } from "./components/TimelineOverview";
import { NotificationView } from "./components/NotificationView";
import { DayAfterCheckIn } from "./components/DayAfterCheckIn";
import { TimelineProvider } from "./context/TimelineContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { HomeScreen } from "./components/HomeScreen";
import { ProfileScreen } from "./components/ProfileScreen";

function MainAppContent() {
  const { completedOnboarding } = useProfile();
  const platform = Capacitor.getPlatform();
  const isNative = platform === "android" || platform === "ios";

  const AppRoutes = completedOnboarding ? (
    <TimelineProvider>
      <Routes>
        {/* Main Tab Views */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/learn" element={<PlayfulHome />} />
          <Route path="/decoder" element={<DocumentLibrary />} />
          <Route path="/timeline" element={<TimelineOverview />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>

        {/* Full-screen Content Pages */}
        <Route path="/topic/:topicId" element={<PlayfulLessonPlan />} />
        <Route path="/topic/:topicId/quiz" element={<PlayfulQuiz />} />
        <Route path="/topic/:topicId/subtopic/:subTopicId" element={<PlayfulSubTopic />} />
        <Route path="/topic/:topicId/subtopic/:subTopicId/quiz" element={<PlayfulQuiz />} />
        <Route path="/decoder/view/:docId" element={<DocumentViewer />} />
        <Route path="/decoder/summary/:docId" element={<DocumentSummary />} />
        <Route path="/notifications" element={<NotificationView />} />
        <Route path="/check-in" element={<DayAfterCheckIn />} />
      </Routes>
    </TimelineProvider>
  ) : (
    <OnboardingFlow />
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

export default function App() {
  return (
    <ProfileProvider>
      <MainAppContent />
    </ProfileProvider>
  );
}
