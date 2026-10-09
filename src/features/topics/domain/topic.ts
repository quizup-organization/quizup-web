import type { Page } from "@/shared/types/api";
import type { Language } from "@/features/player/domain/profile";

/** Noms localisés d'un sujet (clé = langue, FR de référence, EN optionnel). */
export type TopicNames = Partial<Record<Language, string>>;

/**
 * Résout le nom d'un sujet pour une langue : langue demandée → FR → EN → `fallback`.
 * Miroir de la résolution backend (`Question.contents`).
 */
export function topicName(
  names: TopicNames | null | undefined,
  language: Language,
  fallback = "",
): string {
  if (!names) return fallback;
  return names[language] ?? names.fr ?? names.en ?? fallback;
}

/** Tris exposés par `GET /api/topics` (enum backend `TopicSort`). */
export type TopicSort = "POPULAR" | "ALPHA" | "RECENT";

/** Statut d'un sujet (enum backend `TopicStatus`). */
export type TopicStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Nombre minimum de questions approuvées pour publier un sujet (règle de l'atelier d'auteur). */
export const MIN_QUESTIONS_TO_PUBLISH = 7;

/** Horizon d'un classement (enum backend `LeaderboardPeriod`). */
export type LeaderboardPeriod = "ALL_TIME" | "MONTHLY";

/** Portée d'un classement (enum backend `LeaderboardScope`). */
export type LeaderboardScope = "WORLD" | "FOLLOWING" | "COUNTRY";

/** Carte de sujet (`TopicCardView`) — catalogue, accueil et sujets suivis. */
export interface TopicCard {
  topicId: string;
  names: TopicNames;
  description: string | null;
  category: string | null;
  categoryLabel: string | null;
  emoji: string | null;
  color: string | null;
  imageUrl: string | null;
  followersCount: number;
  questionsCount: number;
  followed: boolean;
  status: TopicStatus;
}

/** Référence minimale d'un sujet (`TopicRefView`) — historique, défi. */
export interface TopicRef {
  topicId: string;
  names: TopicNames;
  category: string | null;
  emoji: string | null;
  color: string | null;
  imageUrl: string | null;
}

/** Catégorie de sujet (`TopicCategoryView`). */
export interface TopicCategory {
  category: string;
  label: string;
}

/** Compteur d'une catégorie (`TopicFacetsView.CategoryFacetView`). */
export interface TopicCategoryFacet {
  category: string;
  label: string;
  count: number;
}

/** Facettes du catalogue (`TopicFacetsView`). */
export interface TopicFacets {
  total: number;
  categories: TopicCategoryFacet[];
}

/** Progression du joueur courant sur un sujet (`TopicOverviewView.MyProgressView`). */
export interface TopicProgress {
  xp: number;
  level: number;
  title: string;
  xpForNextLevel: number;
  levelProgressPercent: number;
  /** Questions distinctes du sujet effectivement répondues. */
  completedQuestions: number;
  /** Nombre total de questions approuvées du sujet. */
  totalQuestions: number;
  /** Complétion du sujet en pourcentage (`completedQuestions / totalQuestions`). */
  completionPercent: number;
}

/** Vue agrégée de la fiche sujet (`TopicOverviewView`). */
export interface TopicOverview {
  topic: TopicCard;
  myRank: number | null;
  myProgress: TopicProgress;
  /** Le joueur courant est le créateur du sujet (accès à l'atelier). */
  canManage: boolean;
}

/** Entrée de classement (`TopicLeaderboardView.EntryView`). */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  pseudonym: string | null;
  avatarOptions: string | null;
  country: string | null;
  level: number;
  totalXp: number;
  monthlyXp: number;
}

/** Classement d'un sujet (`TopicLeaderboardView`). */
export interface TopicLeaderboard {
  entries: Page<LeaderboardEntry>;
  me: LeaderboardEntry | null;
}

export interface TopicListParams {
  q?: string;
  category?: string;
  followed?: boolean;
  /** Sujets créés par le joueur courant (brouillons + publiés). */
  mine?: boolean;
  sort?: TopicSort;
  page?: number;
  size?: number;
}

export interface TopicFacetsParams {
  q?: string;
  followed?: boolean;
}

export interface TopicLeaderboardParams {
  period?: LeaderboardPeriod;
  scope?: LeaderboardScope;
  /** Mois `YYYY-MM` du classement mensuel ; absent = mois courant. */
  month?: string;
  page?: number;
  size?: number;
}
