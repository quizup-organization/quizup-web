import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getSessionUserId as getUserId } from "@/features/auth"
import { queryKeys } from "@/lib/query-keys"
import type { Page } from "@/shared/types/api"
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile"
import type { Me } from "@/features/shell/domain/me"
import type { GameHistoryItem } from "../domain/history"
import type {
  PlayerCard,
  PlayerProfile,
  ProfileGamesParams,
} from "../domain/profile"
import { profilesService } from "../lib/profiles"

/**
 * Vues mutables (suivi, compteurs) : `staleTime` court + refetch au focus pour qu'une valeur
 * résiduelle se corrige sans rechargement — voir `optimistic-reconcile.ts`.
 */
const PROFILE_STALE_MS = 30 * 1000
const LIST_STALE_MS = 5 * 60 * 1000

/** Nombre de parties de l'aperçu d'historique des duels. */
const HISTORY_PAGE_SIZE = 5

/** Fiche joueur complète (profil + progression + stats + compteurs + présence + suivi). */
export function usePlayerProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(userId),
    queryFn: () => profilesService.profile(userId),
    enabled: !!userId,
    staleTime: PROFILE_STALE_MS,
    refetchOnWindowFocus: true,
  })
}

export interface GameHistory {
  items: GameHistoryItem[]
  isLoading: boolean
  isError: boolean
}

/**
 * Aperçu de l'historique des duels : **les 5 dernières parties** (pagination serveur). Une page
 * dédiée « historique complet » viendra plus tard pour en charger davantage.
 */
export function useGameHistory(
  userId: string,
  params: Omit<ProfileGamesParams, "page" | "size"> = {}
): GameHistory {
  const query = useQuery({
    queryKey: queryKeys.profiles.games(userId, params),
    queryFn: () =>
      profilesService.games(userId, {
        ...params,
        page: 0,
        size: HISTORY_PAGE_SIZE,
      }),
    enabled: !!userId,
    staleTime: LIST_STALE_MS,
  })

  return {
    items: query.data?.content ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

/**
 * Suivi/ne plus suivre un joueur, **optimiste** : la fiche (`profiles.detail`), le joueur courant
 * (`me`) et les listes de personnes sont simulés au clic (`onMutate`), restaurés en erreur
 * (`onError`), puis **réconciliés jusqu'à convergence** (`onSettled`) : on relit la fiche tant que
 * `following` n'a pas basculé, sans jamais écraser le patch avec une projection en retard.
 */
export function useToggleUserFollow(playerId: string) {
  const queryClient = useQueryClient()
  const meId = getUserId() ?? ""
  const profileKey = queryKeys.profiles.detail(playerId)

  function cachedFollowing(): boolean {
    return (
      queryClient.getQueryData<PlayerProfile>(profileKey)?.following ?? false
    )
  }

  function patchOwnerViews(next: boolean) {
    queryClient.setQueryData<PlayerProfile>(profileKey, (previous) =>
      previous
        ? {
            ...previous,
            following: next,
            followersCount: Math.max(
              0,
              previous.followersCount + (next ? 1 : -1)
            ),
          }
        : previous
    )
    queryClient.setQueryData<Me>(queryKeys.me(), (previous) =>
      previous
        ? {
            ...previous,
            followingCount: Math.max(
              0,
              previous.followingCount + (next ? 1 : -1)
            ),
          }
        : previous
    )
  }

  function patchPeopleLists(next: boolean) {
    const profile = queryClient.getQueryData<PlayerProfile>(profileKey)
    const me = queryClient.getQueryData<Me>(queryKeys.me())
    const targetCard: PlayerCard | null = profile
      ? {
          userId: profile.userId,
          pseudonym: profile.pseudonym,
          avatarOptions: profile.avatarOptions,
          level: profile.progression.level,
          title: profile.progression.title,
          following: next,
          presence: profile.presence,
        }
      : null
    const meCard: PlayerCard | null = me
      ? {
          userId: me.userId,
          pseudonym: me.pseudonym,
          avatarOptions: me.avatarOptions,
          level: me.progression.level,
          title: me.progression.title,
          following: true,
          presence: null,
        }
      : null

    queryClient
      .getQueriesData<Page<PlayerCard>>({ queryKey: ["profiles", "people"] })
      .forEach(([key]) => {
        const [, , ownerId, direction] = key as readonly unknown[]
        const isTargetList = ownerId === meId && direction === "following"
        const isFollowersList =
          ownerId === playerId && direction === "followers"
        if (!isTargetList && !isFollowersList) return

        const card = isTargetList ? targetCard : meCard
        const rowId = isTargetList ? playerId : meId
        queryClient.setQueryData<Page<PlayerCard>>(key, (previous) => {
          if (!previous) return previous
          const exists = previous.content.some((row) => row.userId === rowId)
          if (next) {
            if (!card || exists) return previous
            return {
              ...previous,
              content: [card, ...previous.content],
              totalElements: previous.totalElements + 1,
            }
          }
          if (!exists) return previous
          return {
            ...previous,
            content: previous.content.filter((row) => row.userId !== rowId),
            totalElements: Math.max(0, previous.totalElements - 1),
          }
        })
      })
  }

  function invalidateFollowViews() {
    void queryClient.invalidateQueries({ queryKey: profileKey })
    void queryClient.invalidateQueries({ queryKey: queryKeys.me() })
    void queryClient.invalidateQueries({ queryKey: ["profiles", "people"] })
  }

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next
        ? profilesService.follow(playerId)
        : profilesService.unfollow(playerId),
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey: profileKey })
      await queryClient.cancelQueries({ queryKey: queryKeys.me() })
      await queryClient.cancelQueries({ queryKey: ["profiles", "people"] })

      const previous = queryClient.getQueriesData({
        queryKey: ["profiles"],
      })
      const previousMe = queryClient.getQueryData<Me>(queryKeys.me())

      patchOwnerViews(next)
      patchPeopleLists(next)

      return { previous, previousMe }
    },
    onError: (_error, _next, context) => {
      if (!context) return
      context.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      )
      queryClient.setQueryData(queryKeys.me(), context.previousMe)
    },
    onSettled: (_data, error, next) => {
      if (error) return
      void reconcileUntil<PlayerProfile>({
        read: () => profilesService.profile(playerId),
        matches: (view) => view.following === next,
        onConverged: (view) => {
          queryClient.setQueryData(profileKey, view)
          void queryClient.invalidateQueries({ queryKey: queryKeys.me() })
          void queryClient.invalidateQueries({
            queryKey: ["profiles", "people"],
          })
        },
        onTimeout: invalidateFollowViews,
      })
    },
  })

  function toggle() {
    if (mutation.isPending) return
    mutation.mutate(!cachedFollowing())
  }

  return { toggle, isPending: mutation.isPending }
}
