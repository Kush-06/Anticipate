/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@backend/supabaseClient";
import { fetchTimeline, seedTimeline } from "@backend/timelineService";
import { useProfile } from "./ProfileContext";
import { generateTimeline } from "../utils/timelineGenerator";
import type { SpineGroup, SpineItem } from "../utils/timelineGenerator";

export type { SpineStatus, SpineGroup, SpineItem } from "../utils/timelineGenerator";
export { generateTimeline } from "../utils/timelineGenerator";

interface TimelineGroup {
  key: SpineGroup;
  label: string;
  items: SpineItem[];
}

interface TimelineContextType {
  groups: TimelineGroup[];
  isLoading: boolean;
  refreshTimeline: () => Promise<void>;
}

const GROUP_LABELS: Record<SpineGroup, string> = {
  "this-week": "This week",
  "coming-up": "Coming up",
  "later": "Later",
};

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

function itemsToGroups(items: SpineItem[]): TimelineGroup[] {
  return (["this-week", "coming-up", "later"] as SpineGroup[]).map((key) => ({
    key,
    label: GROUP_LABELS[key],
    items: items.filter((item) => item.group === key),
  }));
}

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTimeline = useCallback(async (uid: string, currentProfile: typeof profile) => {
    setIsLoading(true);
    try {
      const dbItems = await fetchTimeline(uid);

      if (dbItems.length > 0) {
        // Use the DB's unique 'id' for SpineItem, allowing items with same itemKey to coexist
        const spineItems: SpineItem[] = dbItems.map((item) => ({
          id: item.id, // Use actual DB row ID
          status: item.status,
          when: item.whenLabel,
          title: item.title,
          tag: item.tag,
          lessonPath: item.lessonPath,
          group: item.spineGroup,
        }));
        setGroups(itemsToGroups(spineItems));
      } else {
        // No DB rows yet — seed from profile and fall back to generated timeline
        const generated = generateTimeline(currentProfile);
        const allItems = generated.flatMap((g) => g.items);
        if (allItems.length > 0) {
          seedTimeline(uid, allItems).catch(() => {});
        }
        setGroups(generated);
      }
    } catch {
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Synchronously track auth state — no async work inside this callback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setGroups([]);
        setIsLoading(false);
      } else if (event === "INITIAL_SESSION") {
        // No session on load — show generated timeline
        setGroups(generateTimeline(profile));
        setIsLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  // profile excluded intentionally — only needed for the no-session fallback at setup time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Async: load timeline from DB when userId is set
  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(() => {
      void loadTimeline(userId, profile);
    }, 0);
    return () => clearTimeout(timer);
  // profile excluded — loadTimeline captures it at call time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loadTimeline]);

  const refreshTimeline = useCallback(async () => {
    if (userId) await loadTimeline(userId, profile);
  }, [userId, profile, loadTimeline]);

  return (
    <TimelineContext.Provider value={{ groups, isLoading, refreshTimeline }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline must be inside TimelineProvider");
  return ctx;
}
