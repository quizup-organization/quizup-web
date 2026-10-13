import { useEffect, useRef } from "react"
import { playResultChime, type DuelResultOutcome } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"

/**
 * Son de fin de duel, joué **une fois** quand le bilan sportif devient disponible (comme le
 * Confetti : à chaque arrivée sur la page résultat, jamais à chaque re-render). Une partie
 * sans issue sportive (`null` : annulée) reste muette.
 */
export function useResultSound(outcome: DuelResultOutcome | null): void {
  const enabled = useSoundStore((s) => s.enabled)
  const played = useRef(false)

  useEffect(() => {
    if (!enabled || played.current || outcome == null) return
    played.current = true
    playResultChime(outcome)
  }, [enabled, outcome])
}
