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
  // Dynamic onboarding answers
  firstJobCompanyName?: string;
  firstJobStartDate?: string;
  firstJobPayDate?: string;
  firstJobSalary?: string;
  uniDegreeYears?: string;
  uniStudyYear?: string;
  freelanceIndustry?: string;
  rentAmount?: string;
  tenancyLength?: string;
  familyRentBoard?: string;
  homeMortgage?: string;
  movingCity?: string;
  movingTimeframe?: string;
  buyingLisa?: string;
  buyingBudget?: string;
  // Extra fields for previously unmapped options
  workingYearsRole?: string;
  workingYearsPension?: string;
  notWorkingFundsSource?: string;
  mortgagePayment?: string;
  mortgageType?: string;
  studentRentAmount?: string;
  studentRentSource?: string;
  babySavingsFund?: string;
  expectedNewSalary?: string;
  carTargetBudget?: string;
  carPurchaseMethod?: string;
}

interface ProfileContextType {
  completedOnboarding: boolean;
  profile: UserProfile | null;
  userId: string | null;
  isLoading: boolean;
  completeOnboarding: (p: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

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
    localStorage.setItem("anticipate_just_onboarded", "true");
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

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const next = { ...profile!, ...updates };
    setProfile(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (currentUserId) {
      await upsertProfile(currentUserId, next).catch(() => {});
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
      value={{ completedOnboarding: !!profile, profile, userId: currentUserId, isLoading, completeOnboarding, updateProfile, resetProfile, logout }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function getPendingQuestions(profile: UserProfile | null): string[] {
  if (!profile) return [];
  const pending: string[] = [];

  // Q1: day-to-day (lifeStage)
  if (profile.lifeStage === "I'm about to start my first proper job") {
    if (!profile.firstJobCompanyName) pending.push("firstJobCompanyName");
    if (!profile.firstJobStartDate) pending.push("firstJobStartDate");
    if (!profile.firstJobPayDate) pending.push("firstJobPayDate");
    if (!profile.firstJobSalary) pending.push("firstJobSalary");
  } else if (profile.lifeStage === "I've just started my first proper job") {
    if (!profile.firstJobCompanyName) pending.push("firstJobCompanyName");
    if (!profile.firstJobSalary) pending.push("firstJobSalary");
  } else if (profile.lifeStage === "I'm still at uni") {
    if (!profile.uniDegreeYears) pending.push("uniDegreeYears");
    if (!profile.uniStudyYear) pending.push("uniStudyYear");
  } else if (profile.lifeStage === "I'm doing the freelance / self-employed thing") {
    if (!profile.freelanceIndustry) pending.push("freelanceIndustry");
  } else if (profile.lifeStage === "I've been working for a year or two") {
    if (!profile.workingYearsRole) pending.push("workingYearsRole");
    if (!profile.workingYearsPension) pending.push("workingYearsPension");
  } else if (profile.lifeStage === "I'm not working at the moment") {
    if (!profile.notWorkingFundsSource) pending.push("notWorkingFundsSource");
  }

  // Q2: livingSituation
  if (profile.livingSituation === "Renting (just moved in, or about to)" || profile.livingSituation === "Renting (been here a while now)") {
    if (!profile.rentAmount) pending.push("rentAmount");
    if (!profile.tenancyLength) pending.push("tenancyLength");
  } else if (profile.livingSituation === "Living at home with family") {
    if (!profile.familyRentBoard) pending.push("familyRentBoard");
  } else if (profile.livingSituation === "I own my place") {
    if (!profile.mortgagePayment) pending.push("mortgagePayment");
    if (!profile.mortgageType) pending.push("mortgageType");
  } else if (profile.livingSituation === "Student accommodation") {
    if (!profile.studentRentAmount) pending.push("studentRentAmount");
    if (!profile.studentRentSource) pending.push("studentRentSource");
  }

  // Q3: upcomingEvents
  if (profile.upcomingEvents?.includes("Starting my first job soon")) {
    if (!profile.firstJobCompanyName) pending.push("firstJobCompanyName");
    if (!profile.firstJobStartDate) pending.push("firstJobStartDate");
    if (!profile.firstJobPayDate) pending.push("firstJobPayDate");
    if (!profile.firstJobSalary) pending.push("firstJobSalary");
  }
  if (profile.upcomingEvents?.includes("Starting a new job (not my first) soon")) {
    if (!profile.firstJobCompanyName) pending.push("firstJobCompanyName");
    if (!profile.firstJobStartDate) pending.push("firstJobStartDate");
    if (!profile.firstJobSalary) pending.push("firstJobSalary");
  }
  if (profile.upcomingEvents?.includes("Moving out for the very first time") || profile.upcomingEvents?.includes("Moving in with a partner")) {
    if (!profile.rentAmount) pending.push("rentAmount");
    if (!profile.movingCity) pending.push("movingCity");
    if (!profile.movingTimeframe) pending.push("movingTimeframe");
  }
  if (profile.upcomingEvents?.includes("Thinking about buying a place")) {
    if (!profile.buyingLisa) pending.push("buyingLisa");
    if (!profile.buyingBudget) pending.push("buyingBudget");
    if (!profile.movingCity) pending.push("movingCity");
  }
  if (profile.upcomingEvents?.includes("Having a baby (or just had one)")) {
    if (!profile.babySavingsFund) pending.push("babySavingsFund");
  }
  if (profile.upcomingEvents?.includes("Getting a pay rise or switching roles")) {
    if (!profile.expectedNewSalary) pending.push("expectedNewSalary");
  }
  if (profile.upcomingEvents?.includes("Buying a car")) {
    if (!profile.carTargetBudget) pending.push("carTargetBudget");
    if (!profile.carPurchaseMethod) pending.push("carPurchaseMethod");
  }

  // Deduplicate
  return Array.from(new Set(pending));
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be inside ProfileProvider");
  return ctx;
}

