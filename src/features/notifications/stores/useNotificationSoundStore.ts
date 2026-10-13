import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationSoundState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const NOTIFICATION_SOUND_STORAGE_KEY = "quizup-notification-sound";

export const useNotificationSoundStore = create<NotificationSoundState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: NOTIFICATION_SOUND_STORAGE_KEY,
      partialize: (state) => ({ enabled: state.enabled }),
    },
  ),
);
