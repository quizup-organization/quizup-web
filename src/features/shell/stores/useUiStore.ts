import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  /** Sujets récemment ouverts (palette ⌘K « Repris récemment »). */
  recentTopicIds: string[];
  pushRecentTopic: (topicId: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      recentTopicIds: [],
      pushRecentTopic: (topicId) =>
        set((state) => ({
          recentTopicIds: [
            topicId,
            ...state.recentTopicIds.filter((id) => id !== topicId),
          ].slice(0, 8),
        })),
    }),
    {
      name: "quizup-ui",
      partialize: (state) => ({ recentTopicIds: state.recentTopicIds }),
    },
  ),
);
