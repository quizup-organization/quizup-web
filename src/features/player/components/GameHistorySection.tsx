import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect"
import { useScrollContainer } from "@/shared/hooks/useScrollContainer"
import { useUrlParam, useUrlParams } from "@/shared/hooks/useUrlParam"
import { PageContainer } from "@/features/shell"
import { MatchList } from "./MatchList"
import { GameHistoryToolbar } from "./GameHistoryToolbar"
import { useGameHistory } from "../hooks/usePlayer"
import {
  isGameHistorySort,
  isGameOpponentTypeFilter,
  isGameOutcomeFilter,
} from "../domain/history"

interface GameHistorySectionProps {
  /** Joueur consulté (`GET /api/profiles/{id}/games`). */
  userId: string
  /** Scope serveur : sujet d'une fiche sujet. */
  topicId?: string
  /** Scope serveur : adversaire (« Tes duels contre X »). */
  opponentId?: string
  /** État vide **sans filtre** (aucune partie du tout) — propre à l'écran. */
  empty: ReactNode
}

const SKELETON_ROWS = 5

/**
 * Historique des parties d'un joueur : **liste complète** (scroll infini) avec filtres (issue,
 * type d'adversaire) et tri — appliqués **côté serveur**, la pagination reste donc exacte.
 * Filtres et tri sont **persistés dans l'URL** : un retour restaure l'écran à l'identique et
 * l'état est partageable. Un filtre actif sans résultat propose de les effacer ; sans aucun
 * filtre, l'écran fournit son propre état vide (`empty`).
 */
export function GameHistorySection({
  userId,
  topicId,
  opponentId,
  empty,
}: GameHistorySectionProps) {
  const { t } = useTranslation()
  const [outcomeParam, setOutcome] = useUrlParam<string>("outcome", "ALL")
  const [opponentTypeParam, setOpponentType] = useUrlParam<string>(
    "opponentType",
    "ALL"
  )
  const [sortParam, setSort] = useUrlParam<string>("sort", "RECENT")
  /* Valeurs d'URL gardées : un lien trafiqué retombe sur le défaut au lieu de partir au BFF. */
  const outcome = isGameOutcomeFilter(outcomeParam) ? outcomeParam : "ALL"
  const opponentType = isGameOpponentTypeFilter(opponentTypeParam)
    ? opponentTypeParam
    : "ALL"
  const sort = isGameHistorySort(sortParam) ? sortParam : "RECENT"
  const updateParams = useUrlParams()
  const scrollContainer = useScrollContainer()

  const history = useGameHistory(userId, {
    topicId,
    opponentId,
    outcome,
    opponentType: opponentType === "ALL" ? undefined : opponentType,
    sort,
  })

  const activeCount =
    (outcome !== "ALL" ? 1 : 0) +
    (opponentType !== "ALL" ? 1 : 0) +
    (sort !== "RECENT" ? 1 : 0)

  /** Une seule navigation : effacer trois paramètres en appels successifs s'écraserait. */
  const clearFilters = () =>
    updateParams((params) => {
      params.delete("outcome")
      params.delete("opponentType")
      params.delete("sort")
    })

  const sentinelRef = useLoadMoreOnIntersect({
    enabled: history.hasNextPage && !history.isFetchingNextPage,
    onLoadMore: history.fetchNextPage,
    rootRef: scrollContainer,
  })

  return (
    <>
      <GameHistoryToolbar
        outcome={outcome}
        onOutcomeChange={setOutcome}
        opponentType={opponentType}
        onOpponentTypeChange={setOpponentType}
        sort={sort}
        onSortChange={setSort}
        count={history.total}
        activeCount={activeCount}
        onClear={clearFilters}
      />

      <PageContainer>
        {history.isLoading ? (
          <div className="flex flex-col gap-2.5" aria-busy="true">
            {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-4xl bg-muted/50"
              />
            ))}
          </div>
        ) : history.isError ? (
          <EmptyState
            title={t("history.error")}
            description={t("history.emptyFilteredDescription")}
          >
            <Button variant="outline" onClick={history.refetch}>
              {t("history.retry")}
            </Button>
          </EmptyState>
        ) : history.items.length === 0 ? (
          activeCount > 0 ? (
            <EmptyState
              title={t("history.emptyFilteredTitle")}
              description={t("history.emptyFilteredDescription")}
            >
              <Button variant="destructive" onClick={clearFilters}>
                {t("history.reset")}
              </Button>
            </EmptyState>
          ) : (
            <>{empty}</>
          )
        ) : (
          <>
            <MatchList items={history.items} />

            {history.hasNextPage && (
              <div ref={sentinelRef} className="mt-1 h-px" aria-hidden="true" />
            )}

            {history.isFetchingNextPage && (
              <div className="mt-2.5 flex flex-col gap-2.5" aria-busy="true">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-4xl bg-muted/50"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  )
}
