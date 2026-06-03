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
  completeOnboarding: (p: UserProfile) => void;
  resetProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const STORAGE_KEY = "anticipate_profile_v2";
export const UID_KEY = "anticipate_uid";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as UserProfile;
    } catch { /* corrupt — ignore */ }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // currentUserId reads from localStorage so it's available synchronously on mount
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    () => localStorage.getItem(UID_KEY)
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
          const uid = session.user.id;
          localStorage.setItem(UID_KEY, uid);
          setCurrentUserId(uid);
          const dbProfile = await fetchProfile(uid);
          if (dbProfile) {
            setProfile(dbProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbProfile));
          }
          setIsLoading(false);
        } else if (event === "INITIAL_SESSION" && !session) {
          setIsLoading(false);
        } else if (event === "SIGNED_OUT") {
          localStorage.removeItem(UID_KEY);
          localStorage.removeItem(STORAGE_KEY);
          setCurrentUserId(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const completeOnboarding = (p: UserProfile) => {
    // Navigate immediately — never block the user on DB writes
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);

    // Sync to DB in background; silently swallow errors
    if (currentUserId) {
      const uid = currentUserId;
      upsertProfile(uid, p)
        .then(() => seedStoryFacts(uid, p))
        .then(() => {
          const allItems = generateTimeline(p).flatMap((g) => g.items);
          return seedTimeline(uid, allItems);
        })
        .catch(() => {});
    }
  };

  const resetProfile = async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(UID_KEY);
    setCurrentUserId(null);
    setProfile(null);
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
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
