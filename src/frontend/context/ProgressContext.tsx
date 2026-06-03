import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { topics } from "../data/topics";
import { supabase } from "@backend/supabaseClient";
import { fetchProgress, saveProgress } from "@backend/progressService";
import { UID_KEY } from "./ProfileContext";

interface ProgressContextType {
  completedSubTopicIds: string[];
  completeSubTopic: (subTopicId: string) => void;
  getTopicCompletion: (topicId: string) => number;
  totalXP: number;
  isLoading: boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [completedSubTopicIds, setCompletedSubTopicIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session?.user) {
        setUserId(session.user.id);
        const ids = await fetchProgress(session.user.id);
        setCompletedSubTopicIds(ids);
        setIsLoading(false);
      } else if (event === "INITIAL_SESSION" && !session) {
        setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setCompletedSubTopicIds([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const completeSubTopic = (subTopicId: string) => {
    setCompletedSubTopicIds((prev) => {
      if (prev.includes(subTopicId)) return prev;
      const next = [...prev, subTopicId];
      if (userId) void saveProgress(userId, next);
      return next;
    });
  };

  const getTopicCompletion = useCallback((topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return 0;
    const totalSubtopics = topic.subTopics.length;
    const completedSubtopics = topic.subTopics.filter((s) =>
      completedSubTopicIds.includes(s.id)
    ).length;
    return Math.round((completedSubtopics / totalSubtopics) * 100);
  }, [completedSubTopicIds]);

  const totalXP = useMemo(() => {
    return topics.reduce((acc, topic) => acc + getTopicCompletion(topic.id) * 0.5, 0);
  }, [getTopicCompletion]);

  return (
    <ProgressContext.Provider
      value={{ completedSubTopicIds, completeSubTopic, getTopicCompletion, totalXP, isLoading }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
