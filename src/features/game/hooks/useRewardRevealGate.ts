import { useEffect, useState } from "react"
import { outcomeChimeWindowEndsAt } from "@/shared/audio"
import { RESULT_OPENING_MS } from "../domain/game-constants"

/**
 * Feu vert du reveal de la **récompense** de la page résultat — anneau de niveau **et** salve
 * d'XP qui l'accompagne (`useRingAccumulationSound`) partagent ce drapeau, pour que le son et
 * le visuel restent solidaires.
 *
 * Le reveal attend deux choses : que la récompense soit projetée (elle n'est jamais estimée
 * côté client) et que l'ouverture de la page soit terminée — animation `qu-pop`
 * (`RESULT_OPENING_MS`) puis **son du bilan** s'il est joué (fenêtre réservée par
 * `useResultSound`). La récompense est le plus souvent déjà disponible quand la page s'ouvre :
 * sans cette attente, le remplissage de l'anneau empiétait sur l'animation d'ouverture et sa
 * salve d'XP recouvrait le jingle de défaite/victoire.
 */
export function useRewardRevealGate(available: boolean): boolean {
  const [openingAt] = useState(() => Date.now() + RESULT_OPENING_MS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!available) return
    const deadline = Math.max(openingAt, outcomeChimeWindowEndsAt())
    // `setTimeout` même à 0 : l'état passe dans un callback (jamais pendant l'effet).
    const timer = setTimeout(
      () => setReady(true),
      Math.max(0, deadline - Date.now())
    )
    return () => clearTimeout(timer)
  }, [available, openingAt])

  return ready
}
