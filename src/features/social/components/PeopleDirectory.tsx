import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { EmptyState } from "@/shared/components/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchToolbar } from "@/shared/components/search-toolbar"
import { PageContainer, useMe } from "@/features/shell"
import { useDebounce } from "@/shared/hooks/useDebounce"
import { useUrlParam, useUrlParams } from "@/shared/hooks/useUrlParam"
import type { TranslationKey } from "@/lib/i18n/types"
import { PersonTile, usePeople } from "@/features/follows"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import type {
  PeopleDirection,
  PeopleSort,
} from "@/features/player/domain/profile"

const SORTS: { value: PeopleSort; labelKey: TranslationKey }[] = [
  { value: "LEVEL", labelKey: "social.sorts.level" },
  { value: "RECENT", labelKey: "social.sorts.recent" },
  { value: "ALPHA", labelKey: "social.sorts.alpha" },
]

interface PeopleDirectoryProps {
  direction: PeopleDirection
  onDirectionChange: (direction: PeopleDirection) => void
}

/**
 * Annuaire **Social** : abonnements / abonnés, avec recherche, tri et grille de tuiles. La
 * direction est un **filtre** de la barre de recherche — des puces sur desktop, une section
 * dédiée dans la bottom sheet en tactile — et reste persistée dans l'URL.
 */
export function PeopleDirectory({
  direction,
  onDirectionChange,
}: PeopleDirectoryProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const me = useMe()
  const [query, setQuery] = useUrlParam<string>("q", "")
  const [sort, setSort] = useUrlParam<PeopleSort>("sort", "RECENT")
  const updateParams = useUrlParams()
  const debounced = useDebounce(query, 250)

  const active = usePeople(direction, {
    q: debounced,
    sort,
    page: 0,
    size: 100,
  })
  const people = active.data?.content ?? []
  const total = active.data?.totalElements ?? 0

  const sortOptions = SORTS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const directionOptions: { value: PeopleDirection; label: string }[] = [
    {
      value: "following",
      label: t("social.people.following", {
        count: me.data?.followingCount ?? 0,
      }),
    },
    {
      value: "followers",
      label: t("social.people.followers", {
        count: me.data?.followersCount ?? 0,
      }),
    },
  ]
  const directionLabel =
    directionOptions.find((option) => option.value === direction)?.label ?? ""
  const activeCount =
    (query ? 1 : 0) +
    (sort === "RECENT" ? 0 : 1) +
    (direction === "following" ? 0 : 1)

  const clearFilters = () =>
    updateParams((params) => {
      params.delete("q")
      params.delete("sort")
      params.delete("tab")
    })

  return (
    <>
      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={t("social.searchPlaceholder")}
        leading={
          <>
            {directionOptions.map((option) => (
              <Toggle
                key={option.value}
                variant="outline"
                size="sm"
                pressed={direction === option.value}
                onPressedChange={() => onDirectionChange(option.value)}
              >
                {option.label}
              </Toggle>
            ))}
          </>
        }
        controls={
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as PeopleSort)}
          >
            <SelectTrigger
              size="sm"
              className="w-[190px]"
              aria-label={t("social.sortAria")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        filters={
          <FilterSections defaultOpen="direction">
            <FilterSection
              value="direction"
              title={t("social.people.filterTitle")}
              summary={directionLabel}
            >
              {directionOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  selected={direction === option.value}
                  onSelect={() => onDirectionChange(option.value)}
                >
                  {option.label}
                </FilterOption>
              ))}
            </FilterSection>
            <FilterSection
              value="sort"
              title={t("social.sortSection")}
              summary={
                sortOptions.find((option) => option.value === sort)?.label
              }
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
        count={total}
        countLabel={t("social.countLabel")}
      />

      <PageContainer>
        {active.isError ? (
          <EmptyState title={t("social.error")}>
            <Button variant="outline" onClick={() => void active.refetch()}>
              {t("social.retry")}
            </Button>
          </EmptyState>
        ) : people.length === 0 ? (
          <EmptyState
            icon={<UserRound className="size-6 text-muted-foreground" />}
            title={
              direction === "following"
                ? t("social.emptyFollowing")
                : t("social.emptyFollowers")
            }
            description={t("social.emptyDescription")}
          >
            <Button variant="outline" onClick={() => void navigate("/topics")}>
              {t("social.exploreTopics")}
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-3 gap-x-1.5 gap-y-2 tablet-up:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] tablet-up:gap-3">
            {people.map((person) => (
              <PersonTile
                key={person.userId}
                person={person}
                onOpen={(userId) => void navigate(`/players/${userId}`)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  )
}
