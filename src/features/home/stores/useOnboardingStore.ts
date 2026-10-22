import { create } from "zustand"
import { persist } from "zustand/middleware"

interface OnboardingState {
  /** Onboarding terminé (ou passé) sur ce navigateur. */
  completed: boolean
  complete: () => void
}

const ONBOARDING_STORAGE_KEY = "quizup-onboarding"

/**
 * Premier lancement : flag local pour ne pas réafficher l'onboarding à chaque session.
 * Le profil (`stats.played > 0`) sert de garde-fou supplémentaire côté composant.
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      complete: () => set({ completed: true }),
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      version: 1,
      partialize: (state) => ({ completed: state.completed }),
    }
  )
)
