/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@backend/supabaseClient";
import { fetchProfile, upsertProfile, seedStoryFacts } from "@backend/profileService";
import { seedTimeline } from "@backend/timelineService";
import { generateTimeline } from "../utils/timelineGenerator";

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
  ageRange?: string;
  education?: string;
  livingSituation?: string;
  livingDuration?: string;
  planningToMove?: string;
  salary?: string;
  studentLoan?: string;
  financialProducts?: string[];
  hasDebt?: string;
  interestedTopics?: string[];
  motivation?: string;
  usageFrequency?: string;
}

interface ProfileContextType {
  completedOnboarding: boolean;
  profile: UserProfile | null;
  isLoading: boolean;
  completeOnboarding: (p: UserProfile) => Promise<void>;
  resetProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const STORAGE_KEY = "anticipate_profile_v2";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Fast-path cache: avoid flashing onboarding while async session check runs
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as UserProfile;
    } catch {
      // corrupt data — ignore
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            const dbProfile = await fetchProfile(session.user.id);
            if (dbProfile) {
              setProfile(dbProfile);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(dbProfile));
            }
          }
          setIsLoading(false);
        } else if (event === "SIGNED_IN" && session?.user) {
          const dbProfile = await fetchProfile(session.user.id);
          if (dbProfile) {
            setProfile(dbProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbProfile));
          }
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const completeOnboarding = async (p: UserProfile) => {
    // Write to localStorage immediately so the app transitions without waiting
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const uid = session.user.id;
      await upsertProfile(uid, p);
      await seedStoryFacts(uid, p);
      const groups = generateTimeline(p);
      const allItems = groups.flatMap((g) => g.items);
      await seedTimeline(uid, allItems);
    }
  };

  const resetProfile = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  };

  return (
    <ProfileContext.Provider
      value={{ completedOnboarding: !!profile, profile, isLoading, completeOnboarding, resetProfile }}
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
