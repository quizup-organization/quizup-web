import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompactTilesState {
  /**
   * Vue « tuiles springboard » (icône + nom, style iOS) pour Sujets et Personnes en compact.
   * Feature flag client, désactivé par défaut (bascule progressive, cf. Réglages → Apparence).
   */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const COMPACT_TILES_STORAGE_KEY = "quizup.compact-tiles";

/** Préférence d'affichage des listes en tuiles springboard sur mobile. */
export const useCompactTilesStore = create<CompactTilesState>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: COMPACT_TILES_STORAGE_KEY,
      partialize: (state) => ({ enabled: state.enabled }),
    },
  ),
);
