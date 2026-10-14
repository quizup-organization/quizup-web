import type { NotificationType } from "@/shared/types/notifications"
import {
  accumulationChime,
  chimeDurationMs,
  countdownTickChime,
  CORRECT_CHIME,
  OPPONENT_CHIME,
  SUCCESS_CHIME,
  TIMEOUT_CHIME,
  WRONG_CHIME,
  notificationChime,
  resultChime,
  type DuelResultOutcome,
} from "./chimes"
import { playChime } from "./engine"

export * from "./chimes"
export { playChime } from "./engine"

/** Notification reçue : motif selon le type (générique pour les suivis et défis reçus). */
export function playNotificationChime(type?: NotificationType | null): void {
  playChime(notificationChime(type))
}

/** Bonne réponse en duel. */
export function playCorrectChime(): void {
  playChime(CORRECT_CHIME)
}

/** Mauvaise réponse en duel. */
export function playWrongChime(): void {
  playChime(WRONG_CHIME)
}

/** L'adversaire vient de répondre (duel humain ou bot). */
export function playOpponentChime(): void {
  playChime(OPPONENT_CHIME)
}

/** Temps écoulé sans réponse en duel. */
export function playTimeoutChime(): void {
  playChime(TIMEOUT_CHIME)
}

/** Accumulation de points/XP : salve de ticks montants (arène et anneau de la page résultat). */
export function playAccumulationChime(count: number): void {
  playChime(accumulationChime(count))
}

/** Tic-tac d'un écran à countdown (une seconde restante par appel). */
export function playCountdownTick(secondsLeft: number): void {
  playChime(countdownTickChime(secondsLeft))
}

/**
 * Fenêtre (fin, epoch ms) réservée au **son du bilan** de la page résultat ; `0` = aucune
 * réservation. Le reveal de la récompense l'attend pour que la salve d'XP ne recouvre pas le
 * son d'issue (cf. `useResultSound` / `useRewardRevealGate`).
 */
let outcomeChimeWindowEnd = 0

/**
 * Réserve la fenêtre pendant laquelle le son d'issue va sonner (délai d'ouverture + durée réelle
 * du motif) — appelé **au moment où le son est planifié**, donc avant sa lecture : le reveal de
 * la récompense sait ainsi combien de temps patienter.
 */
export function reserveOutcomeChime(
  outcome: DuelResultOutcome,
  delayMs: number
): void {
  outcomeChimeWindowEnd =
    Date.now() + delayMs + chimeDurationMs(resultChime(outcome))
}

/** Fin (epoch ms) de la fenêtre réservée au son d'issue ; `0` si aucune (sons coupés, autre écran). */
export function outcomeChimeWindowEndsAt(): number {
  return outcomeChimeWindowEnd
}

/** Fin de duel : victoire, défaite ou égalité. */
export function playResultChime(outcome: DuelResultOutcome): void {
  playChime(resultChime(outcome))
}

/** Anti-superposition du « ding » de succès (sauvegardes de réglages champ par champ). */
const SUCCESS_COOLDOWN_MS = 600
let lastSuccessAt = 0

/** Enregistrement/action réussis : « ding » discret (ignoré si un autre vient de sonner). */
export function playSuccessChime(): void {
  const now = Date.now()
  if (now - lastSuccessAt < SUCCESS_COOLDOWN_MS) return
  lastSuccessAt = now
  playChime(SUCCESS_CHIME)
}
