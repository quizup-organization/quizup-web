import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BottomNavVariant } from "@/components/ui/bottom-nav-bar";

interface BottomNavState {
  /** Habillage de la nav basse mobile : pilule flottante ou barre fixe pleine largeur. */
  variant: BottomNavVariant;
  setVariant: (variant: BottomNavVariant) => void;
}

const BOTTOM_NAV_STORAGE_KEY = "quizup-bottom-nav";

/**
 * Préférence d'habillage de la nav basse (mobile). Persistée ; l'application au DOM
 * (`data-bottom-nav` sur `<html>`) est portée par `AppShell`, source unique des offsets CSS.
 */
export const useBottomNavStore = create<BottomNavState>()(
  persist(
    (set) => ({
      variant: "floating",
      setVariant: (variant) => set({ variant }),
    }),
    {
      name: BOTTOM_NAV_STORAGE_KEY,
      partialize: (state) => ({ variant: state.variant }),
    },
  ),
);
