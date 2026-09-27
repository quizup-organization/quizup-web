import type { DuelStats, Progression } from "@/features/player/domain/profile";

/** Joueur courant (`MeView`) — coquille, badge de défis, écrans profil. */
export interface Me {
  userId: string;
  email: string | null;
  displayName: string | null;
  bio: string | null;
  country: string | null;
  avatarOptions: string | null;
  progression: Progression;
  stats: DuelStats;
  followingCount: number;
  followersCount: number;
  pendingChallengesCount: number;
}
