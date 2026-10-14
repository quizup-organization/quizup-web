import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import {
  playResultChime,
  reserveOutcomeChime,
  type DuelResultOutcome,
} from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import { RESULT_OPENING_MS } from "../domain/game-constants"

/**
 * Son de fin de duel, joué **une fois** quand le bilan sportif devient disponible — **après
 * l'animation d'ouverture** de la page (`qu-pop`, `RESULT_OPENING_MS` ; immédiat en
 * `prefers-reduced-motion`, où les animations sont neutralisées). Quitter la page avant la fin
 * annule le son. Une partie sans issue sportive (`null` : annulée) reste muette.
 *
 * La fenêtre du son est **réservée dès la planification** (`reserveOutcomeChime`) : le reveal de
 * la récompense (`useRewardRevealGate`) l'attend, pour que la salve d'XP ne recouvre jamais le
 * son du bilan.
 */
export function useResultSound(outcome: DuelResultOutcome | null): void {
  const enabled = useSoundStore((s) => s.enabled)
  const reduced = useReducedMotion()
  const played = useRef(false)

  useEffect(() => {
    if (!enabled || played.current || outcome == null) return
    const delay = reduced ? 0 : RESULT_OPENING_MS
    reserveOutcomeChime(outcome, delay)
    const timer = setTimeout(() => {
      played.current = true
      playResultChime(outcome)
    }, delay)
    return () => clearTimeout(timer)
  }, [enabled, outcome, reduced])
}
