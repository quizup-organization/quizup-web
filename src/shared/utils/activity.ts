import type { ActivityDay } from "@/features/player/domain/activity";

export type ContributionRange = "month" | "year";

/** Nombre de semaines affichées dans la vue annuelle (~1 an). */
export const YEAR_WEEKS = 53;

/** Nombre de jours de part et d'autre d'aujourd'hui dans la vue mensuelle. */
export const MONTH_RADIUS_DAYS = 15;

export function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

/** Bornes (incluses) de la fenêtre affichée, selon la vue. */
export function windowBounds(range: ContributionRange, weeks = YEAR_WEEKS) {
  const today = startOfToday();
  if (range === "month") {
    return {
      today,
      start: addDays(today, -MONTH_RADIUS_DAYS),
      end: addDays(today, MONTH_RADIUS_DAYS),
    };
  }
  return { today, start: addDays(today, -(weeks * 7 - 1)), end: today };
}

/** Nombre de jours actifs dans la fenêtre affichée. */
export function countActiveDays(
  days: ActivityDay[],
  range: ContributionRange,
  weeks = YEAR_WEEKS,
): number {
  const { start, end } = windowBounds(range, weeks);
  const startIso = toIso(start);
  const endIso = toIso(end);
  return days.filter(
    (day) => day.games > 0 && day.date >= startIso && day.date <= endIso,
  ).length;
}
