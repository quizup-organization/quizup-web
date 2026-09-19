export const ROUNDS = 7;
export const ROUND_SECONDS = 10;

export const NORMAL_BASE_POINTS = 10;
export const NORMAL_SPEED_BONUS = 10;
export const BONUS_BASE_POINTS = 20;
export const BONUS_SPEED_BONUS = 20;

export const NORMAL_MAX = NORMAL_BASE_POINTS + NORMAL_SPEED_BONUS;
export const BONUS_MAX = BONUS_BASE_POINTS + BONUS_SPEED_BONUS;

export const MAX_SCORE = (ROUNDS - 1) * NORMAL_MAX + BONUS_MAX;

export const isBonusRound = (round: number): boolean => round === ROUNDS - 1;

export const QUESTION_READ_MS = 1400;
export const ANSWER_REVEAL_STAGGER_MS = 120;

/**
 * Durées purement présentationnelles (le serveur reste source de vérité du chrono) :
 * l'écran VS et la transition avant le premier round.
 */
export const VS_DURATION_MS = 2700;
export const SWOOSH_DURATION_MS = 1450;

/**
 * Durée de l'intro de tour (RoundIntro) affichée avant chaque question. La transition
 * serveur entre deux rounds (`GameRules.ROUND_TRANSITION_MS`) est scindée en révélation
 * du round clos puis intro du round suivant.
 */
export const ROUND_INTRO_MS = 1900;
