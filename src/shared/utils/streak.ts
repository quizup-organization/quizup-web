/** Issue terminale d'un duel (contrat minimal, partagé sans import de feature). */
export type StreakOutcome = "WIN" | "LOSS" | "DRAW";

/** Langue du viewer pour les initiales des ronds (contenu localisé selon le profil). */
export type StreakLanguage = "fr" | "en";

export interface StreakResult {
  outcome: StreakOutcome;
  count: number;
}

const LETTERS: Record<StreakOutcome, Record<StreakLanguage, string>> = {
  WIN: { fr: "V", en: "W" },
  LOSS: { fr: "D", en: "L" },
  DRAW: { fr: "N", en: "D" },
};

/** Initiale affichée dans un rond : FR V/D/N (victoire/défaite/nul), EN W/L/D (win/loss/draw). */
export function streakLetter(
  outcome: StreakOutcome,
  language: StreakLanguage,
): string {
  return LETTERS[outcome][language];
}

/** Issue terminale d'un duel, sinon `null` (partie en attente / en cours / annulée). */
export function terminalOutcome(outcome: string): StreakOutcome | null {
  return outcome === "WIN" || outcome === "LOSS" || outcome === "DRAW"
    ? outcome
    : null;
}

/**
 * Série actuelle d'un joueur, dérivée d'un historique **du plus récent au plus ancien** :
 * les issues terminales identiques consécutives depuis la dernière partie. Les parties non
 * terminées sont ignorées (elles ne comptent ni ne cassent la série). `null` sans résultat.
 */
export function currentStreak(
  items: ReadonlyArray<{ outcome: string }>,
): StreakResult | null {
  let streak: StreakResult | null = null;
  for (const item of items) {
    const outcome = terminalOutcome(item.outcome);
    if (!outcome) continue;
    if (!streak) {
      streak = { outcome, count: 1 };
      continue;
    }
    if (outcome !== streak.outcome) break;
    streak = { outcome, count: streak.count + 1 };
  }
  return streak;
}
