import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  firstName: string;
  email: string;
  lifeStage?: string;
  topWorry?: string;
  upcomingEvents?: string[];
  confidenceScores?: Record<string, number>;
  employmentType?: string;
  sixMonthGoal?: string;
  companyName?: string;
  startDate?: string;
  firstSalaryDate?: string;
}

interface ProfileContextType {
  completedOnboarding: boolean;
  profile: UserProfile | null;
  completeOnboarding: (newProfile: UserProfile) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [completedOnboarding, setCompletedOnboarding] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load profile from localStorage on startup
  useEffect(() => {
    const isCompleted = localStorage.getItem("anticipate_onboarding_completed") === "true";
    const savedProfile = localStorage.getItem("anticipate_user_profile");
    
    if (isCompleted && savedProfile) {
      setCompletedOnboarding(true);
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Error parsing saved profile", e);
      }
    }
  }, []);

  const completeOnboarding = (newProfile: UserProfile) => {
    localStorage.setItem("anticipate_onboarding_completed", "true");
    localStorage.setItem("anticipate_user_profile", JSON.stringify(newProfile));
    setProfile(newProfile);
    setCompletedOnboarding(true);
  };

  const resetProfile = () => {
    localStorage.removeItem("anticipate_onboarding_completed");
    localStorage.removeItem("anticipate_user_profile");
    setProfile(null);
    setCompletedOnboarding(false);
  };

  return (
    <ProfileContext.Provider value={{ completedOnboarding, profile, completeOnboarding, resetProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
