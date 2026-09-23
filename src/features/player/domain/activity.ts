/** Activité journalière d'un joueur (streak + graphe de contribution). */
export interface ActivityDay {
  date: string;
  games: number;
}

export interface Activity {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalActiveDays: number;
  days: ActivityDay[];
}
