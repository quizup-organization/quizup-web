import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { playResultChime, type DuelResultOutcome } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"

/** Durée de l'animation d'ouverture `qu-pop` de la page résultat (le jingle attend la fin). */
const RESULT_CHIME_DELAY_MS = 340

/**
 * Son de fin de duel, joué **une fois** quand le bilan sportif devient disponible — **après
 * l'animation d'ouverture** de la page (`qu-pop`, 340 ms ; immédiat en `prefers-reduced-motion`,
 * où les animations sont neutralisées). Quitter la page avant la fin annule le son. Une partie
 * sans issue sportive (`null` : annulée) reste muette.
 */
export function useResultSound(outcome: DuelResultOutcome | null): void {
  const enabled = useSoundStore((s) => s.enabled)
  const reduced = useReducedMotion()
  const played = useRef(false)

  useEffect(() => {
    if (!enabled || played.current || outcome == null) return
    const timer = setTimeout(
      () => {
        played.current = true
        playResultChime(outcome)
      },
      reduced ? 0 : RESULT_CHIME_DELAY_MS
    )
    return () => clearTimeout(timer)
  }, [enabled, outcome, reduced])
}
