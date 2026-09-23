/** Profil public d'un joueur. */
export interface Profile {
  userId: string;
  email: string;
  displayName: string;
  bio?: string;
  country?: string;
}

/** Progression d'un joueur sur un sujet. */
export interface TopicProgress {
  topicId: string;
  xp: number;
  level: number;
  title: string;
}

/** Statistiques de duels d'un joueur. */
export interface DuelStats {
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  bestScore: number;
  bestStreak: number;
}

/** Progression globale d'un joueur (XP, niveau, badges, sujets). */
export interface Progression {
  userId: string;
  xpTotal: number;
  level: number;
  title: string;
  xpForNextLevel: number;
  badges: { code: string; label: string }[];
  topics: TopicProgress[];
  duelStats: DuelStats;
}
