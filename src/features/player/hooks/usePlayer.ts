import { useRef } from "react";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { getUserId } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { profilesService } from "@/lib/services/profiles";
import { userFollowsService } from "@/lib/services/user-follows";
import { emptyPage, pageOf } from "@/shared/utils/page";
import type { ApiError, PageResponse } from "@/shared/types/search";
import type { UserFollower } from "@/shared/types/domain";
import { useFollowCounts, type FollowCounts } from "@/shared/hooks/useFollowCounts";

/** Profil public + progression + compteurs de suivi d'un joueur. */
export function usePlayer(playerId: string) {
  const profile = useQuery({
    queryKey: queryKeys.profiles.detail(playerId),
    queryFn: () => profilesService.getById(playerId),
    enabled: !!playerId,
    staleTime: 10 * 60 * 1000,
  });

  const progression = useQuery({
    queryKey: queryKeys.profiles.progress(playerId),
    queryFn: () => profilesService.getProgress(playerId),
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });

  const counts = useFollowCounts(playerId);

  return {
    profile: profile.data,
    progression: progression.data,
    counts: counts.data,
    isLoading: profile.isLoading,
    isError: profile.isError,
  };
}

/** Page de suivi de `followerId` vers `followedId` (le cache `state` stocke cette PageResponse). */
async function fetchFollowStatePage(
  followerId: string,
  followedId: string,
): Promise<PageResponse<UserFollower>> {
  return userFollowsService.search({
    filters: [
      ...(followerId
        ? [{ property: "followerId", operator: "EQUALS", value: followerId } as const]
        : []),
      { property: "followedId", operator: "EQUALS", value: followedId },
    ],
    page: { number: 0, size: 1 },
  });
}

/** État de suivi du joueur ciblé par l'utilisateur courant (record + followId). */
export function useFollowState(playerId: string) {
  const userId = getUserId();
  return useQuery({
    queryKey: queryKeys.userFollows.state(userId ?? "", playerId),
    queryFn: () => fetchFollowStatePage(userId ?? "", playerId),
    enabled: !!userId && !!playerId,
    select: (page) => page.content[0] ?? null,
    staleTime: 5 * 60 * 1000,
  });
}

/** Délai avant réconciliation : la projection `user-follows` est en lecture différée. */
const RECONCILE_DELAY_MS = 2000;

function isDuplicateFollow(error: unknown): boolean {
  if ((error as ApiError | undefined)?.statusCode === 409) return true;
  const message = error instanceof Error ? error.message : "";
  return /already follows/i.test(message);
}

function isMissingFollow(error: unknown): boolean {
  const status = (error as ApiError | undefined)?.statusCode;
  if (status === 404 || status === 410) return true;
  const message = error instanceof Error ? error.message : "";
  return /not found.*deleted|already unfollowed/i.test(message);
}

/**
 * Suivi/désuivi d'un joueur, **instantané et coalescé**.
 *
 * Chaque clic met à jour l'état et les compteurs en optimiste (aucun blocage du bouton), puis
 * une **file d'attente sérialise** les appels réseau : un spam de clics n'envoie que ce qui est
 * nécessaire pour atteindre l'état final (ex. follow→unfollow→unfollow = au plus 2 requêtes),
 * sans doublon ni id périmé.
 */
export function useToggleUserFollow(playerId: string) {
  const queryClient = useQueryClient();
  const userId = getUserId();
  const stateKey = queryKeys.userFollows.state(userId ?? "", playerId);
  const targetCountsKey = queryKeys.userFollows.counts(playerId);
  const selfCountsKey = queryKeys.userFollows.counts(userId ?? "");

  const desiredRef = useRef<boolean | null>(null);
  const runningRef = useRef(false);
  // Dernier `followId` réel connu (renvoyé par le POST), pour ne pas dépendre de la projection.
  const knownFollowIdRef = useRef<string | null>(null);

  function setStateData(data: PageResponse<UserFollower>) {
    queryClient.setQueryData(stateKey, data);
  }

  function setFollowState(record: UserFollower | null) {
    setStateData(record ? pageOf(record) : emptyPage<UserFollower>());
  }

  function cachedFollow(): UserFollower | null {
    return (
      queryClient.getQueryData<PageResponse<UserFollower>>(stateKey)
        ?.content[0] ?? null
    );
  }

  function bumpCounts(key: QueryKey, field: keyof FollowCounts, delta: number) {
    queryClient.setQueryData<FollowCounts>(key, (previous) =>
      previous
        ? { ...previous, [field]: Math.max(0, previous[field] + delta) }
        : previous,
    );
  }

  function applyOptimistic(next: boolean) {
    if (next) {
      setFollowState({
        followId: `pending-${playerId}`,
        followerId: userId ?? "",
        followedId: playerId,
        followedAt: new Date().toISOString(),
      });
      bumpCounts(targetCountsKey, "followers", 1);
      bumpCounts(selfCountsKey, "following", 1);
    } else {
      setFollowState(null);
      bumpCounts(targetCountsKey, "followers", -1);
      bumpCounts(selfCountsKey, "following", -1);
    }
  }

  function refreshLists() {
    queryClient.invalidateQueries({
      queryKey: queryKeys.userFollows.following(userId ?? ""),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.userFollows.followers(playerId),
    });
  }

  /**
   * Les compteurs sont dérivés d'une projection en lecture différée : on ne les rafraîchit
   * qu'après un délai, pour ne pas écraser la mise à jour optimiste par une valeur périmée.
   */
  function reconcileCountsLater() {
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: targetCountsKey });
      queryClient.invalidateQueries({ queryKey: selfCountsKey });
    }, RECONCILE_DELAY_MS);
  }

  async function serverFollowId(): Promise<string | null> {
    if (knownFollowIdRef.current) return knownFollowIdRef.current;
    const cached = cachedFollow();
    if (cached && !cached.followId.startsWith("pending-")) {
      knownFollowIdRef.current = cached.followId;
      return cached.followId;
    }
    // La projection peut être en retard : on retente avant de conclure à l'absence de suivi.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const record = await fetchFollowStatePage(userId ?? "", playerId)
        .then((page) => page.content[0] ?? null)
        .catch(() => null);
      if (record) {
        knownFollowIdRef.current = record.followId;
        return record.followId;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 200));
    }
    return null;
  }

  async function syncFromServer() {
    const record = await fetchFollowStatePage(userId ?? "", playerId)
      .then((page) => page.content[0] ?? null)
      .catch(() => null);
    knownFollowIdRef.current = record?.followId ?? null;
    setFollowState(record);
  }

  async function applyFollow() {
    try {
      const data = await userFollowsService.follow(playerId);
      knownFollowIdRef.current = data.id;
      setFollowState({
        followId: data.id,
        followerId: userId ?? "",
        followedId: playerId,
        followedAt: new Date().toISOString(),
      });
    } catch (error) {
      // Déjà suivi côté serveur (projection en retard) : on récupère l'id réel.
      if (isDuplicateFollow(error)) {
        await syncFromServer();
        return;
      }
      desiredRef.current = null;
      await syncFromServer();
    }
  }

  async function applyUnfollow() {
    const followId = await serverFollowId();
    if (!followId) {
      setFollowState(null);
      return;
    }
    try {
      await userFollowsService.unfollow(followId);
      knownFollowIdRef.current = null;
      setFollowState(null);
    } catch (error) {
      // Déjà désabonné côté serveur : l'état optimiste est correct.
      if (isMissingFollow(error)) {
        knownFollowIdRef.current = null;
        setFollowState(null);
        return;
      }
      desiredRef.current = null;
      await syncFromServer();
    }
  }

  async function drainQueue() {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      while (desiredRef.current !== null) {
        const target = desiredRef.current;
        desiredRef.current = null;
        if (target) await applyFollow();
        else await applyUnfollow();
      }
    } finally {
      runningRef.current = false;
      refreshLists();
      reconcileCountsLater();
    }
  }

  /** Bascule l'état de suivi : effet visuel immédiat, requêtes coalescées en arrière-plan. */
  function toggle() {
    const next = !cachedFollow();
    applyOptimistic(next);
    desiredRef.current = next;
    void drainQueue();
  }

  return { toggle };
}
