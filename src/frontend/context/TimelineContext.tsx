/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@backend/supabaseClient";
import { fetchTimeline } from "@backend/timelineService";
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

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTimeline = useCallback(async (uid: string) => {
    setIsLoading(true);
    const items = await fetchTimeline(uid);

    const grouped = (["this-week", "coming-up", "later"] as SpineGroup[]).map((key) => ({
      key,
      label: GROUP_LABELS[key],
      items: items
        .filter((item) => item.spineGroup === key)
        .map((item) => ({
          id: item.itemKey,
          status: item.status,
          when: item.whenLabel,
          title: item.title,
          tag: item.tag,
          lessonPath: item.lessonPath,
          group: item.spineGroup,
        } satisfies SpineItem)),
    }));

    setGroups(grouped);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            setUserId(session.user.id);
            await loadTimeline(session.user.id);
          } else {
            setIsLoading(false);
          }
        } else if (event === "SIGNED_IN" && session?.user) {
          setUserId(session.user.id);
          await loadTimeline(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setUserId(null);
          setGroups([]);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadTimeline]);

  const refreshTimeline = useCallback(async () => {
    if (userId) await loadTimeline(userId);
  }, [userId, loadTimeline]);

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
