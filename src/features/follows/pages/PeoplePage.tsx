import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs"
import { SearchToolbar } from "@/shared/components/search-toolbar"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import { PageContainer, useMe } from "@/features/shell"
import { useDebounce } from "@/shared/hooks/useDebounce"
import { useUrlParam } from "@/shared/hooks/useUrlParam"
import type { TranslationKey } from "@/lib/i18n/types"
import { PersonTile } from "../components/PersonTile"
import { usePeople } from "../hooks/usePeople"
import type {
  PeopleDirection,
  PeopleSort,
} from "@/features/player/domain/profile"

const SORTS: { value: PeopleSort; labelKey: TranslationKey }[] = [
  { value: "LEVEL", labelKey: "people.sorts.level" },
  { value: "RECENT", labelKey: "people.sorts.recent" },
  { value: "ALPHA", labelKey: "people.sorts.alpha" },
]

export function PeoplePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useUrlParam<PeopleDirection>("tab", "following")
  const [query, setQuery] = useUrlParam<string>("q", "")
  const [sort, setSort] = useUrlParam<PeopleSort>("sort", "RECENT")
  const debounced = useDebounce(query, 250)
  const me = useMe()

  const active = usePeople(tab, {
    q: debounced,
    sort,
    page: 0,
    size: 100,
  })
  const people = active.data?.content ?? []
  const total = active.data?.totalElements ?? 0
  const followingCount = me.data?.followingCount ?? 0
  const followersCount = me.data?.followersCount ?? 0

  const sortOptions = SORTS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as PeopleDirection)}
      className="gap-0"
    >
      <PageHeaderBar>
        <TabsList>
          <TabsTrigger value="following">
            {t("people.tabs.following", { count: followingCount })}
          </TabsTrigger>
          <TabsTrigger value="followers">
            {t("people.tabs.followers", { count: followersCount })}
          </TabsTrigger>
        </TabsList>
      </PageHeaderBar>

      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={t("people.searchPlaceholder")}
        controls={
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as PeopleSort)}
          >
            <SelectTrigger
              size="sm"
              className="w-[190px]"
              aria-label={t("people.sortAria")}
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
          <FilterSections defaultOpen="sort">
            <FilterSection
              value="sort"
              title={t("people.sortSection")}
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
        activeCount={query ? 1 : 0}
        onClear={() => setQuery("")}
        count={total}
        countLabel={t("people.countLabel")}
      />

      <PageContainer>
        <TabsContent value={tab} className="mt-0">
          {active.isError ? (
            <EmptyState title={t("people.error")}>
              <Button variant="outline" onClick={() => void active.refetch()}>
                {t("people.retry")}
              </Button>
            </EmptyState>
          ) : people.length === 0 ? (
            <EmptyState
              icon={<UserRound className="size-6 text-muted-foreground" />}
              title={
                tab === "following"
                  ? t("people.emptyFollowing")
                  : t("people.emptyFollowers")
              }
              description={t("people.emptyDescription")}
            >
              <Button
                variant="outline"
                onClick={() => void navigate("/topics")}
              >
                {t("people.exploreTopics")}
              </Button>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-3 gap-x-1.5 gap-y-2 tablet:grid-cols-5 tablet:gap-3 desktop:grid-cols-7">
              {people.map((person) => (
                <PersonTile
                  key={person.userId}
                  person={person}
                  onOpen={(userId) => void navigate(`/players/${userId}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </PageContainer>
    </Tabs>
  )
}
