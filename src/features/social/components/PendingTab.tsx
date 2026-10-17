import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/shared/components/empty-state"
import { SearchToolbar } from "@/shared/components/search-toolbar"
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import { PageContainer, useTopicName } from "@/features/shell"
import { normalize } from "@/lib/helpers"
import { useUrlParam, useUrlParams } from "@/shared/hooks/useUrlParam"
import { useServerClock } from "@/shared/clock/useServerClock"
import {
  nearestDeadline,
  useCountdownTicks,
} from "@/shared/hooks/useCountdownTicks"
import type { TranslationKey } from "@/lib/i18n/types"
import { useSocialPending } from "../hooks/useSocialPending"
import {
  PENDING_SORTS,
  PENDING_TYPE_FILTERS,
  isPendingSort,
  isPendingTypeFilter,
  sortPending,
  type PendingDuel,
  type PendingSort,
  type PendingTypeFilter,
} from "../domain/pending-duel"
import { PendingDuelList } from "./PendingDuelList"

const TYPE_LABEL_KEYS: Record<PendingTypeFilter, TranslationKey> = {
  ALL: "social.pending.typeAll",
  received: "social.pending.typeReceived",
  sent: "social.pending.typeSent",
  room: "social.pending.typeRoom",
}

const SORT_LABEL_KEYS: Record<PendingSort, TranslationKey> = {
  EXPIRING: "social.pending.sortExpiring",
  LATEST: "social.pending.sortLatest",
}

/**
 * Onglet fusionné **Défis & Salons** : défis reçus, défis envoyés et salons ouverts, avec une
 * **barre de filtres unique** (recherche sujet/joueur, type, tri par échéance). Les listes de
 * défis sont bornées par un `ScrollArea` (barre en surimpression, espace réservé) ; les salons
 * restent une liste simple. Une seule source de tic-tac par écran : l'échéance la plus proche
 * des éléments visibles.
 */
export function PendingTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const resolveName = useTopicName()
  const { received, sent, rooms, isLoading } = useSocialPending()
  const { serverNow } = useServerClock()

  const [query, setQuery] = useUrlParam<string>("q", "")
  const [rawType, setType] = useUrlParam<string>("type", "ALL")
  const [rawSort, setSort] = useUrlParam<string>("sort", "EXPIRING")
  const type = isPendingTypeFilter(rawType) ? rawType : "ALL"
  const sort = isPendingSort(rawSort) ? rawSort : "EXPIRING"
  const updateParams = useUrlParams()

  const filtered = useMemo(() => {
    const needle = normalize(query)
    const matches = (item: PendingDuel) => {
      if (!needle) return true
      const topic = resolveName(item.topic.names)
      const player = item.player?.pseudonym ?? ""
      return normalize(`${topic} ${player}`).includes(needle)
    }

    return {
      received:
        type === "sent" || type === "room"
          ? []
          : sortPending(received.filter(matches), sort),
      sent:
        type === "received" || type === "room"
          ? []
          : sortPending(sent.filter(matches), sort),
      rooms:
        type === "ALL" || type === "room"
          ? sortPending(rooms.filter(matches), sort)
          : [],
    }
  }, [query, received, resolveName, rooms, sent, sort, type])

  const visible = useMemo(
    () => [...filtered.received, ...filtered.sent, ...filtered.rooms],
    [filtered]
  )
  const nextDeadline = useMemo(
    () => nearestDeadline(visible.map((item) => item.expiresAt)),
    [visible]
  )
  useCountdownTicks({ deadlineAt: nextDeadline, clock: serverNow })

  const hasPending = received.length + sent.length + rooms.length > 0
  const filteredTotal = visible.length
  const activeCount =
    (query ? 1 : 0) + (type === "ALL" ? 0 : 1) + (sort === "EXPIRING" ? 0 : 1)

  const clearFilters = () =>
    updateParams((params) => {
      params.delete("q")
      params.delete("type")
      params.delete("sort")
    })

  if (isLoading && !hasPending) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          {t("common.app.loading")}
        </p>
      </PageContainer>
    )
  }

  if (!hasPending) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Inbox className="size-6 text-muted-foreground" />}
          title={t("social.pending.emptyAllTitle")}
          description={t("social.pending.emptyAllDescription")}
        >
          <Button variant="outline" onClick={() => void navigate("/topics")}>
            {t("social.exploreTopics")}
          </Button>
        </EmptyState>
      </PageContainer>
    )
  }

  const typeOptions = PENDING_TYPE_FILTERS.map((value) => ({
    value,
    label: t(TYPE_LABEL_KEYS[value]),
  }))
  const sortOptions = PENDING_SORTS.map((value) => ({
    value,
    label: t(SORT_LABEL_KEYS[value]),
  }))
  const typeLabel = t(TYPE_LABEL_KEYS[type])
  const sortLabel = t(SORT_LABEL_KEYS[sort])

  const section = (title: string, items: PendingDuel[], bounded: boolean) => (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      {bounded ? (
        <ScrollArea
          orientation="vertical"
          label={title}
          maxHeight="min(60dvh, 28rem)"
          viewportClassName="pb-3"
        >
          <PendingDuelList items={items} />
        </ScrollArea>
      ) : (
        <PendingDuelList items={items} />
      )}
    </section>
  )

  return (
    <>
      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={t("social.pending.searchPlaceholder")}
        leading={
          <>
            {typeOptions.map((option) => (
              <Toggle
                key={option.value}
                variant="outline"
                size="sm"
                pressed={type === option.value}
                onPressedChange={() => setType(option.value)}
              >
                {option.label}
              </Toggle>
            ))}
          </>
        }
        controls={
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as PendingSort)}
          >
            <SelectTrigger
              size="sm"
              className="w-[190px]"
              aria-label={t("social.pending.sortAria")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        filters={
          <FilterSections defaultOpen="type">
            <FilterSection
              value="type"
              title={t("social.pending.filterType")}
              summary={typeLabel}
            >
              {typeOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  selected={type === option.value}
                  onSelect={() => setType(option.value)}
                >
                  {option.label}
                </FilterOption>
              ))}
            </FilterSection>
            <FilterSection
              value="sort"
              title={t("social.pending.filterSort")}
              summary={sortLabel}
            >
              {sortOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  selected={sort === option.value}
                  onSelect={() => setSort(option.value)}
                >
                  {option.label}
                </FilterOption>
              ))}
            </FilterSection>
          </FilterSections>
        }
        activeCount={activeCount}
        onClear={clearFilters}
        count={filteredTotal}
        countLabel={t("social.pending.countLabel")}
      />

      <PageContainer>
        {filteredTotal === 0 ? (
          <EmptyState
            icon={<Inbox className="size-6 text-muted-foreground" />}
            title={t("social.pending.filteredEmptyTitle")}
            description={t("social.pending.filteredEmptyDescription")}
          >
            <Button variant="outline" onClick={clearFilters}>
              {t("shared.searchToolbar.clearAll")}
            </Button>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-8 compact:gap-6">
            {filtered.received.length > 0 &&
              section(
                t("social.challenges.receivedGroup", {
                  count: filtered.received.length,
                }),
                filtered.received,
                true
              )}
            {filtered.sent.length > 0 &&
              section(
                t("social.challenges.sentGroup", {
                  count: filtered.sent.length,
                }),
                filtered.sent,
                true
              )}
            {filtered.rooms.length > 0 &&
              section(
                t("social.rooms.group", { count: filtered.rooms.length }),
                filtered.rooms,
                false
              )}
          </div>
        )}
      </PageContainer>
    </>
  )
}
