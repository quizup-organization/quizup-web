import type { TFunction } from "i18next";
import type { TranslationKey } from "@/lib/i18n/types";

/**
 * Titres honorifiques par niveau (repris de la maquette, appliqués côté profil).
 * Le libellé est résolu par le catalogue (`shared.levels.*`) ; le serveur reste la source
 * pour un profil chargé (repli local uniquement).
 */
const TITLES: { min: number; key: TranslationKey }[] = [
  { min: 50, key: "shared.levels.legend" },
  { min: 40, key: "shared.levels.master" },
  { min: 30, key: "shared.levels.expert" },
  { min: 20, key: "shared.levels.historian" },
  { min: 10, key: "shared.levels.veteran" },
  { min: 5, key: "shared.levels.apprentice" },
  { min: 1, key: "shared.levels.beginner" },
];

export function titleForLevel(level: number, t: TFunction): string {
  return t(TITLES.find((entry) => level >= entry.min)?.key ?? "shared.levels.beginner");
}

export function xpProgress(xp: number, xpForNextLevel: number): number {
  if (!xpForNextLevel) return 0;
  const inLevel = xp % Math.max(1, xpForNextLevel);
  return Math.min(100, Math.round((inLevel / xpForNextLevel) * 100));
}
