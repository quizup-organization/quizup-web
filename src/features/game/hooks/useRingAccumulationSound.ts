import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { playAccumulationChime } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import {
  REDUCED_MOTION_TICKS,
  ringAccumulationTicks,
} from "../domain/accumulation"

/**
 * Salve d'accumulation de l'anneau de niveau (page résultat) : le **même motif** que celui de
 * l'arène, joué **une fois par affichage** dès que la récompense est projetée — c'est l'instant
 * où `useRingReveal` lance le remplissage de l'arc et le compteur d'XP. En
 * `prefers-reduced-motion`, l'anneau est posé d'un coup (aucune animation à accompagner) : motif
 * court unique. Muet tant que la récompense n'est pas là (partie annulée, `reward` en cours
 * d'attribution) ou si elle vaut 0 XP.
 */
export function useRingAccumulationSound(xpGained: number | null): void {
  const enabled = useSoundStore((s) => s.enabled)
  const reduced = useReducedMotion() ?? false
  const played = useRef(false)

  useEffect(() => {
    if (!enabled || played.current || xpGained == null || xpGained <= 0) return
    played.current = true
    playAccumulationChime(
      reduced ? REDUCED_MOTION_TICKS : ringAccumulationTicks(xpGained)
    )
  }, [enabled, xpGained, reduced])
}
