import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { topicsService } from "@/features/topics";
import type { Page } from "@/shared/types/api";
import type {
  TopicCard,
  TopicLeaderboardParams,
  TopicOverview,
} from "@/features/topics/domain/topic";
import type { Home } from "@/features/home/domain/home";

const OVERVIEW_STALE_MS = 5 * 60 * 1000;
const LEADERBOARD_STALE_MS = 5 * 60 * 1000;

/** Délai avant réconciliation : la projection Axon est en lecture différée. */
const RECONCILE_DELAY_MS = 2000;

/** Fiche agrégée d'un sujet : carte (suivi inclus), rang réel et progression du joueur. */
export function useTopicOverview(topicId: string) {
  return useQuery({
    queryKey: queryKeys.topics.overview(topicId),
    queryFn: () => topicsService.overview(topicId),
    enabled: !!topicId,
    staleTime: OVERVIEW_STALE_MS,
  });
}

/** Classement paginé d'un sujet + rang du joueur courant dans la même portée. */
export function useTopicLeaderboard(
  topicId: string,
  params: TopicLeaderboardParams,
) {
  return useQuery({
    queryKey: queryKeys.topics.leaderboard(topicId, params),
    queryFn: () => topicsService.leaderboard(topicId, params),
    enabled: !!topicId,
    staleTime: LEADERBOARD_STALE_MS,
    placeholderData: (previous) => previous,
  });
}

/**
 * Suivi/ne plus suivre un sujet, **optimiste** (recette TanStack Query officielle) : la vue
 * propriétaire (`topics.overview`), les listes de sujets et l'accueil sont simulés au clic
 * (`onMutate`), restaurés en erreur (`onError`), puis réconciliés après un délai (`onSettled`).
 */
export function useToggleTopicFollow(topicId: string) {
  const queryClient = useQueryClient();
  const overviewKey = queryKeys.topics.overview(topicId);

  function patchOverview(next: boolean) {
    queryClient.setQueryData<TopicOverview>(overviewKey, (previous) =>
      previous
        ? {
            ...previous,
            topic: {
              ...previous.topic,
              followed: next,
              followersCount: Math.max(
                0,
                previous.topic.followersCount + (next ? 1 : -1),
              ),
            },
          }
        : previous,
    );
  }

  function patchLists(next: boolean, card: TopicCard | undefined) {
    queryClient.setQueriesData<Page<TopicCard>>(
      { queryKey: ["topics", "list"] },
      (previous) =>
        previous
          ? {
              ...previous,
              content: previous.content.map((topic) =>
                topic.topicId === topicId
                  ? {
                      ...topic,
                      followed: next,
                      followersCount: Math.max(
                        0,
                        topic.followersCount + (next ? 1 : -1),
                      ),
                    }
                  : topic,
              ),
            }
          : previous,
    );

    queryClient.setQueryData<Home>(queryKeys.home(), (previous) => {
      if (!previous) return previous;
      if (!next) {
        return {
          ...previous,
          followedTopics: previous.followedTopics.filter(
            (topic) => topic.topicId !== topicId,
          ),
        };
      }
      if (
        !card ||
        previous.followedTopics.some((topic) => topic.topicId === topicId)
      ) {
        return previous;
      }
      return { ...previous, followedTopics: [card, ...previous.followedTopics] };
    });
  }

  function scheduleReconcile() {
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.home() });
    }, RECONCILE_DELAY_MS);
  }

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next
        ? topicsService.follow(topicId)
        : topicsService.unfollow(topicId),
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.topics.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.home() });
      const previousOverview = queryClient.getQueryData<TopicOverview>(overviewKey);
      const previousLists = queryClient.getQueriesData<Page<TopicCard>>({
        queryKey: ["topics", "list"],
      });
      const previousHome = queryClient.getQueryData<Home>(queryKeys.home());

      patchOverview(next);
      const card = queryClient.getQueryData<TopicOverview>(overviewKey)?.topic;
      patchLists(next, card);

      return { previousOverview, previousLists, previousHome };
    },
    onError: (_error, _next, context) => {
      if (!context) return;
      queryClient.setQueryData(overviewKey, context.previousOverview);
      context.previousLists.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      queryClient.setQueryData(queryKeys.home(), context.previousHome);
    },
    onSettled: () => scheduleReconcile(),
  });

  function toggle() {
    if (mutation.isPending) return;
    const current =
      queryClient.getQueryData<TopicOverview>(overviewKey)?.topic.followed ??
      false;
    mutation.mutate(!current);
  }

  return { toggle, isPending: mutation.isPending };
}
