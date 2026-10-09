/**
 * Detents des bottom sheets Arc UI — contrat responsive (responsive-sizing.md).
 * Aucun écran ne recopie de valeurs numériques locales : on choisit un preset.
 */
export const SHEET_DETENTS = {
  /** Filtres de catalogue : une moitié pour parcourir, quasi plein pour agir. */
  filters: [0.55, 0.92],
  /** Classement : résumé + contrôles. */
  leaderboard: [0.5, 0.92],
  /** Picker quasi plein cadre (emoji). */
  picker: [0.85, 0.96],
  /** Review de duel : plein cadre permanent. */
  review: [0.95],
  /** Partage social : QR + actions, hauteur compacte. */
  share: [0.62],
  /** Confirmation (abandon…) : courte, titre + phrase + actions. */
  confirm: [0.45],
  /** Défi / duel (lancer, choisir un thème) : hauteur moyenne + quasi plein pour agir. */
  duel: [0.72, 0.94],
} satisfies Record<string, number[]>;
