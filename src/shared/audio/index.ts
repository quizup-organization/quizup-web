import type { NotificationType } from "@/shared/types/notifications"
import {
  CORRECT_CHIME,
  DEFEAT_CHIME,
  DRAW_CHIME,
  OPPONENT_CHIME,
  SUCCESS_CHIME,
  TIMEOUT_CHIME,
  VICTORY_CHIME,
  WRONG_CHIME,
  notificationChime,
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

/** Fin de duel : victoire, défaite ou égalité. */
export function playResultChime(outcome: DuelResultOutcome): void {
  const chime =
    outcome === "win"
      ? VICTORY_CHIME
      : outcome === "loss"
        ? DEFEAT_CHIME
        : DRAW_CHIME
  playChime(chime)
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
