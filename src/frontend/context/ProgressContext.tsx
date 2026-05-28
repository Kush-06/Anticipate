import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { topics } from "../data/topics";
import { supabase } from "@backend/supabaseClient";
import { fetchProgress, saveProgress } from "@backend/progressService";

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
    async function initSession() {
      const { data: sessionData } = await supabase.auth.getSession();
      let uid = sessionData.session?.user.id ?? null;

      if (!uid) {
        const { data: signInData } = await supabase.auth.signInAnonymously();
        uid = signInData.user?.id ?? null;
      }

      if (uid) {
        setUserId(uid);
        const ids = await fetchProgress(uid);
        setCompletedSubTopicIds(ids);
      }

      setIsLoading(false);
    }

    void initSession();
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
