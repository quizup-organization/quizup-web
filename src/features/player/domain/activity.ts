/** Activité journalière d'un joueur (`ActivityViewResponse`). */
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

export interface ActivityParams {
  from?: string;
  to?: string;
}
