import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { topics } from "../data/topics";

interface ProgressContextType {
  completedSubTopicIds: string[];
  completeSubTopic: (topicId: string, subTopicId: string) => void;
  getTopicCompletion: (topicId: string) => number;
  totalXP: number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [completedSubTopicIds, setCompletedSubTopicIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("completedSubTopics");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("completedSubTopics", JSON.stringify(completedSubTopicIds));
  }, [completedSubTopicIds]);

  const completeSubTopic = (topicId: string, subTopicId: string) => {
    setCompletedSubTopicIds((prev) => {
      if (prev.includes(subTopicId)) return prev;
      return [...prev, subTopicId];
    });
  };

  const getTopicCompletion = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return 0;
    const totalSubtopics = topic.subTopics.length;
    const completedSubtopics = topic.subTopics.filter((s) => completedSubTopicIds.includes(s.id)).length;
    return Math.round((completedSubtopics / totalSubtopics) * 100);
  };

  const totalXP = useMemo(() => {
    return topics.reduce((acc, topic) => {
      return acc + getTopicCompletion(topic.id) * 0.5;
    }, 0);
  }, [completedSubTopicIds]);

  return (
    <ProgressContext.Provider value={{ completedSubTopicIds, completeSubTopic, getTopicCompletion, totalXP }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
