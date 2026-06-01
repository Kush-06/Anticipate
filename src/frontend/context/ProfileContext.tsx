import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  firstName: string;
  email: string;
  companyName: string;
  lifeStage: string;
  employmentType: string;
  sixMonthGoal: string;
  upcomingEvents: string[];
  confidenceScores: {
    tax: number;
    pensions: number;
    budgeting: number;
    investing: number;
    contracts: number;
  };
}

interface ProfileContextType {
  completedOnboarding: boolean;
  profile: UserProfile | null;
  completeOnboarding: (p: UserProfile) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const STORAGE_KEY = "anticipate_profile_v2";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // corrupt data — ignore
    }
  }, []);

  const completeOnboarding = (p: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
  };

  const resetProfile = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  };

  return (
    <ProfileContext.Provider
      value={{ completedOnboarding: !!profile, profile, completeOnboarding, resetProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be inside ProfileProvider");
  return ctx;
}
