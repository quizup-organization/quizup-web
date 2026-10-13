import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TopicGridColumns = 3 | 4;

interface TopicGridState {
  columns: TopicGridColumns;
  setColumns: (columns: TopicGridColumns) => void;
}

const TOPIC_GRID_STORAGE_KEY = "quizup-topic-grid";

export const useTopicGridStore = create<TopicGridState>()(
  persist(
    (set) => ({
      columns: 4,
      setColumns: (columns) => set({ columns }),
    }),
    {
      name: TOPIC_GRID_STORAGE_KEY,
      partialize: (state) => ({ columns: state.columns }),
    },
  ),
);
