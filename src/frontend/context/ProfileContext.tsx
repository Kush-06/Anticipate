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
  logout: () => Promise<void>;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    () => localStorage.getItem(UID_KEY)
  );
  // undefined = INITIAL_SESSION not yet received; null = no session; string = authenticated
  const [sessionUserId, setSessionUserId] = useState<string | null | undefined>(undefined);

  // Synchronously track auth state — never do async work inside this callback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(UID_KEY);
        localStorage.removeItem(STORAGE_KEY);
        setCurrentUserId(null);
        setProfile(null);
        setIsLoading(false);
        setSessionUserId(null);
      } else if (session?.user) {
        setSessionUserId(session.user.id);
      } else if (event === "INITIAL_SESSION") {
        // No session found on load — stop loading
        setSessionUserId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Async: load profile from DB whenever a valid session user ID becomes known
  useEffect(() => {
    if (sessionUserId === undefined) return; // auth state not yet known
    const timer = setTimeout(() => {
      if (!sessionUserId) {
        setIsLoading(false);
        return;
      }
      const uid = sessionUserId;
      localStorage.setItem(UID_KEY, uid);
      setCurrentUserId(uid);
      void fetchProfile(uid)
        .then((dbProfile) => {
          if (dbProfile) {
            setProfile(dbProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbProfile));
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [sessionUserId]);

  const completeOnboarding = (p: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
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

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
  };

  return (
    <ProfileContext.Provider
      value={{ completedOnboarding: !!profile, profile, isLoading, completeOnboarding, resetProfile, logout }}
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
