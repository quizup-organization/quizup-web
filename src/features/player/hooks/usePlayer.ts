import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { profilesService } from "../lib/profiles";
import { userFollowsService } from "../lib/user-follows";
import { userFollowId } from "@/shared/utils/follower-ids";
import type { ApiError, IdResponse, PageResponse } from "@/shared/types/search";
import type { UserFollower } from "@/features/player/domain/follow";
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

/**
 * État de suivi du joueur ciblé par l'utilisateur courant, lu **par id déterministe**
 * (`GET /api/user-follows/{followerId}:{followedId}`). Un 404 signifie « non suivi » → `null`.
 */
export function useFollowState(playerId: string) {
  const userId = getUserId();
  const followId = userId && playerId ? userFollowId(userId, playerId) : "";
  return useQuery({
    queryKey: queryKeys.userFollows.state(userId ?? "", playerId),
    queryFn: async (): Promise<UserFollower | null> => {
      try {
        return await userFollowsService.getById(followId);
      } catch (error) {
        if ((error as ApiError | undefined)?.statusCode === 404) return null;
        throw error;
      }
    },
    enabled: !!userId && !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Délai avant réconciliation : la projection `user-follows` est en lecture différée. */
const RECONCILE_DELAY_MS = 2000;

interface ToggleVariables {
  next: boolean;
  followId: string | null;
}

interface ToggleContext {
  state: UserFollower | null | undefined;
  targetCounts: FollowCounts | undefined;
  selfCounts: FollowCounts | undefined;
  following: PageResponse<UserFollower> | undefined;
  followers: PageResponse<UserFollower> | undefined;
}

/**
 * Suivi/désuivi d'un joueur, **optimiste** (recette TanStack Query officielle) : l'état, les
 * compteurs et les listes sont simulés au clic (`onMutate`), restaurés en erreur (`onError`),
 * puis réconciliés avec la projection après un délai (`onSettled`).
 */
export function useToggleUserFollow(playerId: string) {
  const queryClient = useQueryClient();
  const userId = getUserId() ?? "";
  const stateKey = queryKeys.userFollows.state(userId, playerId);
  const targetCountsKey = queryKeys.userFollows.counts(playerId);
  const selfCountsKey = queryKeys.userFollows.counts(userId);
  const followingKey = queryKeys.userFollows.following(userId);
  const followersKey = queryKeys.userFollows.followers(playerId);

  function cachedRecord(): UserFollower | null {
    return queryClient.getQueryData<UserFollower | null>(stateKey) ?? null;
  }

  function setState(record: UserFollower | null) {
    queryClient.setQueryData(stateKey, record);
  }

  function bumpCounts(key: QueryKey, field: keyof FollowCounts, delta: number) {
    queryClient.setQueryData<FollowCounts>(key, (previous) =>
      previous
        ? { ...previous, [field]: Math.max(0, previous[field] + delta) }
        : previous,
    );
  }

  /**
   * Insère/retire un suivi dans une liste (`following` ou `followers`) ; `matches` identifie
   * le couple concerné pour éviter d'impacter les autres entrées.
   */
  function patchList(
    key: QueryKey,
    record: UserFollower | null,
    add: boolean,
    matches: (row: UserFollower) => boolean,
  ) {
    queryClient.setQueryData<PageResponse<UserFollower>>(key, (previous) => {
      if (!previous) return previous;
      if (add) {
        if (!record || previous.content.some(matches)) return previous;
        return {
          ...previous,
          content: [record, ...previous.content],
          totalElements: previous.totalElements + 1,
        };
      }
      const content = previous.content.filter((row) => !matches(row));
      if (content.length === previous.content.length) return previous;
      return {
        ...previous,
        content,
        totalElements: Math.max(0, previous.totalElements - 1),
      };
    });
  }

  function scheduleReconcile() {
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: targetCountsKey });
      queryClient.invalidateQueries({ queryKey: selfCountsKey });
      queryClient.invalidateQueries({ queryKey: followingKey });
      queryClient.invalidateQueries({ queryKey: followersKey });
    }, RECONCILE_DELAY_MS);
  }

  const mutation = useMutation<
    IdResponse | null,
    unknown,
    ToggleVariables,
    ToggleContext
  >({
    mutationFn: async ({ next, followId }) => {
      if (next) return userFollowsService.follow(playerId);
      if (followId) await userFollowsService.unfollow(followId);
      return null;
    },
    onMutate: async ({ next, followId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.userFollows.all });
      const context: ToggleContext = {
        state: queryClient.getQueryData<UserFollower | null>(stateKey),
        targetCounts: queryClient.getQueryData<FollowCounts>(targetCountsKey),
        selfCounts: queryClient.getQueryData<FollowCounts>(selfCountsKey),
        following:
          queryClient.getQueryData<PageResponse<UserFollower>>(followingKey),
        followers:
          queryClient.getQueryData<PageResponse<UserFollower>>(followersKey),
      };

      const optimistic: UserFollower | null = next
        ? {
            followId: followId ?? `pending-${playerId}`,
            followerId: userId,
            followedId: playerId,
            followedAt: new Date().toISOString(),
          }
        : null;

      setState(optimistic);
      bumpCounts(targetCountsKey, "followers", next ? 1 : -1);
      bumpCounts(selfCountsKey, "following", next ? 1 : -1);
      patchList(followingKey, optimistic, next, (row) => row.followedId === playerId);
      patchList(followersKey, optimistic, next, (row) => row.followerId === userId);

      return context;
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(stateKey, context.state);
      queryClient.setQueryData(targetCountsKey, context.targetCounts);
      queryClient.setQueryData(selfCountsKey, context.selfCounts);
      queryClient.setQueryData(followingKey, context.following);
      queryClient.setQueryData(followersKey, context.followers);
    },
    onSuccess: (data, { next }) => {
      if (next && data) {
        setState({
          followId: data.id,
          followerId: userId,
          followedId: playerId,
          followedAt: new Date().toISOString(),
        });
      }
    },
    onSettled: () => scheduleReconcile(),
  });

  /** Bascule l'état de suivi : effet visuel immédiat, requête en arrière-plan. */
  function toggle() {
    if (mutation.isPending) return;
    const current = cachedRecord();
    const next = !current;
    const followId =
      current && !current.followId.startsWith("pending-")
        ? current.followId
        : null;
    mutation.mutate({ next, followId });
  }

  return { toggle, isPending: mutation.isPending };
}
