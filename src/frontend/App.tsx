import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Capacitor } from "@capacitor/core";
import { PlayfulHome } from "./components/PlayfulHome";
import { PlayfulLessonPlan } from "./components/PlayfulLessonPlan";
import { PlayfulQuiz } from "./components/PlayfulQuiz";
import { PlayfulSubTopic } from "./components/PlayfulSubTopic";
import { LessonComplete } from "./components/LessonComplete";
import { MainLayout } from "./components/MainLayout";
import { HomeScreen } from "./components/HomeScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { ProgressProvider } from "./context/ProgressContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { TimelineProvider } from "./context/TimelineContext";
import { LoadingScreen } from "./components/LoadingScreen";

function MainApp() {
  const { completedOnboarding, isLoading: profileLoading } = useProfile();
  const platform = Capacitor.getPlatform();
  const isNative = platform === "android" || platform === "ios";
  const [animationDone, setAnimationDone] = useState(false);

  const appLoading = !animationDone || profileLoading;

  if (appLoading) {
    if (isNative) {
      return (
        <div style={{ width: "100%", height: "100vh", background: "var(--p-coral, #e9694a)", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
          <LoadingScreen onFinished={() => setAnimationDone(true)} fade={completedOnboarding} />
        </div>
      );
    }
    return (
      <PhoneFrame>
        <LoadingScreen onFinished={() => setAnimationDone(true)} fade={completedOnboarding} />
      </PhoneFrame>
    );
  }

  if (!completedOnboarding) {
    const shell = (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <OnboardingFlow />
      </div>
    );
    if (isNative) {
      return (
        <BrowserRouter>
          <div style={{ width: "100%", height: "100vh", background: "var(--p-bg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {shell}
          </div>
        </BrowserRouter>
      );
    }
    return (
      <BrowserRouter>
        <PhoneFrame>{shell}</PhoneFrame>
      </BrowserRouter>
    );
  }

  const AppRoutes = (
    <ProgressProvider>
      <TimelineProvider>
        <Routes>
          {/* Main tab views */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/learn" element={<PlayfulHome />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Route>

          {/* Full-screen lesson pages — no tab bar */}
          <Route path="/topic/:topicId" element={<PlayfulLessonPlan />} />
          <Route path="/topic/:topicId/quiz" element={<PlayfulQuiz />} />
          <Route path="/topic/:topicId/subtopic/:subTopicId" element={<PlayfulSubTopic />} />
          <Route path="/topic/:topicId/subtopic/:subTopicId/quiz" element={<PlayfulQuiz />} />
          <Route path="/topic/:topicId/subtopic/:subTopicId/complete" element={<LessonComplete />} />
        </Routes>
      </TimelineProvider>
    </ProgressProvider>
  );

  if (isNative) {
    return (
      <BrowserRouter>
        <div style={{ width: "100%", height: "100vh", background: "var(--p-bg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {AppRoutes}
        </div>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <PhoneFrame>{AppRoutes}</PhoneFrame>
    </BrowserRouter>
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
