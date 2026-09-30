import type {
  DuelStats,
  Language,
  Progression,
} from "@/features/player/domain/profile";

/** Joueur courant (`MeView`) — coquille, badge de défis, écrans profil. */
export interface Me {
  userId: string;
  email: string | null;
  pseudonym: string | null;
  bio: string | null;
  country: string | null;
  avatarOptions: string | null;
  language: Language;
  progression: Progression;
  stats: DuelStats;
  followingCount: number;
  followersCount: number;
  pendingChallengesCount: number;
}
