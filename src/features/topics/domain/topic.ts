/**
 * Modèle métier « sujet » (contrat partagé entre features) — aligné sur les DTOs backend.
 * `Topic` / `TopicStats` sont des view-models consommés par le design system.
 */
export interface Topic {
  id: string;
  name: string;
  emoji: string;
  category: string;
  color: string;
  followers: number;
  description?: string;
}

export interface TopicStats {
  level: number;
  pct: number;
  played: number;
  points: number;
}

export interface TopicCategory {
  category: string;
  label: string;
}

export interface TopicFollower {
  followId: string;
  topicId: string;
  userId: string;
  followedAt: string;
}

export interface TopicLeaderboardEntry {
  rank: number;
  topicId: string;
  userId: string;
  displayName: string;
  country: string;
  totalXp: number;
  monthlyXp: number;
  level: number;
}
