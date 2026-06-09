import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router";
import { Capacitor } from "@capacitor/core";
import { PlayfulHome } from "./components/PlayfulHome";
import { DecoderPage } from "./components/DecoderPage";
import { PlayfulLessonPlan } from "./components/PlayfulLessonPlan";
import { PlayfulQuiz } from "./components/PlayfulQuiz";
import { PlayfulSubTopic } from "./components/PlayfulSubTopic";
import { LessonComplete } from "./components/LessonComplete";
import { MainLayout } from "./components/MainLayout";
import { HomeScreen } from "./components/HomeScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { NotificationsScreen } from "./components/NotificationsScreen";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { ProgressProvider } from "./context/ProgressContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { TimelineProvider } from "./context/TimelineContext";
import { LoadingScreen } from "./components/LoadingScreen";
import { CommunityScreen } from "./components/CommunityScreen";

function MainApp() {
  const { completedOnboarding } = useProfile();
  const platform = Capacitor.getPlatform();
  const isNative = platform === "android" || platform === "ios";
  const [appLoading, setAppLoading] = useState(true);

  // ProgressProvider and TimelineProvider live here — above the completedOnboarding
  // gate — so they mount at app startup and receive INITIAL_SESSION before any
  // route renders. Moving them inside the gate meant they mounted after INITIAL_SESSION
  // had already fired, so they never saw the existing session on page refresh.
  const inner = (
    <ProgressProvider>
      <TimelineProvider>
        {appLoading ? (
          <LoadingScreen onFinished={() => setAppLoading(false)} fade={completedOnboarding} />
        ) : !completedOnboarding ? (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <OnboardingFlow />
          </div>
        ) : (
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/decoder" element={<DecoderPage />} />
              <Route path="/learn" element={<PlayfulHome />} />
              <Route path="/community" element={<CommunityScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>
            <Route path="/notifications" element={<NotificationsScreen />} />
            <Route path="/topic/:topicId" element={<PlayfulLessonPlan />} />
            <Route path="/topic/:topicId/quiz" element={<PlayfulQuiz />} />
            <Route path="/topic/:topicId/subtopic/:subTopicId" element={<PlayfulSubTopic />} />
            <Route path="/topic/:topicId/subtopic/:subTopicId/quiz" element={<PlayfulQuiz />} />
            <Route path="/topic/:topicId/subtopic/:subTopicId/complete" element={<LessonComplete />} />
          </Routes>
        )}
      </TimelineProvider>
    </ProgressProvider>
  );

  if (isNative) {
    return (
      <HashRouter>
        <div style={{ width: "100%", height: "100vh", background: "var(--p-bg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {inner}
        </div>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <PhoneFrame>{inner}</PhoneFrame>
    </HashRouter>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "1.5rem", padding: "2rem 0", background: "#c9bfb0",
    }}>
      <div style={{
        position: "relative", background: "var(--p-bg)", overflow: "hidden",
        display: "flex", flexDirection: "column",
        width: "min(360px, calc(100vw - 2rem))", aspectRatio: "9 / 16",
        borderRadius: "2.5rem",
        boxShadow: "0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.14)",
      }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <MainApp />
    </ProfileProvider>
  );
}
