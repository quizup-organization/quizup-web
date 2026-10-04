import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchToolbar } from "@/shared/components/search-toolbar";
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section";
import { FacetCombobox } from "../components/facet-combobox";
import { FacetOptionList } from "../components/facet-option-list";
import { Toggle } from "@/components/ui/toggle";
import { PageContainer } from "@/features/shell";
import { categoryColor } from "@/shared/utils/categories";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect";
import { usePreloadImages } from "@/shared/hooks/usePreloadImages";
import { useScrollContainer } from "@/shared/hooks/useScrollContainer";
import { TopicGrid } from "../components/TopicGrid";
import {
  TOPIC_SORTS,
  useActiveFilterCount,
  useTopicFilterStore,
} from "../stores/useTopicFilterStore";
import { useTopicFacets, useTopicsList } from "../hooks/useTopics";

const SKELETON_COUNT = 6;

export function TopicsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useTopicFilterStore();
  const activeCount = useActiveFilterCount();
  const scrollContainer = useScrollContainer();
  const canObserve = typeof IntersectionObserver !== "undefined";

  // Initialise la recherche depuis `?q=` (barre supérieure / liens « Voir tout »).
  const initialQuery = searchParams.get("q") ?? "";
  useMemo(() => {
    if (initialQuery && initialQuery !== store.q) store.setQuery(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const debouncedQuery = useDebounce(store.q, 300);

  const query = useTopicsList({
    q: debouncedQuery,
    category: store.category ?? undefined,
    sort: store.sort,
    followed: store.followedOnly,
  });

  const facets = useTopicFacets({
    q: debouncedQuery,
    followed: store.followedOnly,
  });

  const facetList = useMemo(
    () =>
      (facets.data?.categories ?? []).map((facet) => ({
        value: facet.category,
        label: facet.label,
        count: facet.count,
        color: categoryColor(facet.category),
      })),
    [facets.data],
  );

  const topics = useMemo(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.totalElements ?? 0;

  const sentinelRef = useLoadMoreOnIntersect({
    enabled: query.hasNextPage && !query.isFetchingNextPage,
    onLoadMore: () => query.fetchNextPage(),
    rootRef: scrollContainer,
  });

  // Un changement de filtre repart du haut (sauf au montage : restauration POP préservée).
  const filtersKey = `${debouncedQuery}|${store.category ?? ""}|${store.sort}|${store.followedOnly}`;
  const initialFiltersRef = useRef(filtersKey);
  useEffect(() => {
    if (initialFiltersRef.current === filtersKey) return;
    initialFiltersRef.current = filtersKey;
    scrollContainer?.current?.scrollTo({ top: 0 });
  }, [filtersKey, scrollContainer]);

  // Précharge les premiers visuels de la grille (priorité basse, le reste en lazy).
  const preloadUrls = useMemo(
    () => topics.map((topic) => topic.imageUrl),
    [topics],
  );
  usePreloadImages(preloadUrls, { limit: 8, priority: "low" });

  const mobileFilters = (
    <FilterSections defaultOpen="sort">
      <FilterSection
        value="followed"
        title="Abonnements"
        summary={
          store.followedOnly ? "Uniquement mes suivis" : "Tous les sujets"
        }
      >
        <FilterOption
          selected={store.followedOnly}
          onSelect={() => store.setFollowedOnly(!store.followedOnly)}
        >
          <Heart className="size-4" /> Uniquement mes suivis
        </FilterOption>
      </FilterSection>

      <FilterSection
        value="category"
        title="Catégorie"
        summary={
          facetList.find((facet) => facet.value === store.category)?.label ??
          "Toutes"
        }
      >
        <FacetOptionList
          options={facetList}
          value={store.category}
          onChange={store.setCategory}
        />
      </FilterSection>

      <FilterSection
        value="sort"
        title="Trier par"
        summary={TOPIC_SORTS.find((sort) => sort.value === store.sort)?.label}
      >
        {TOPIC_SORTS.map((sort) => (
          <FilterOption
            key={sort.value}
            selected={store.sort === sort.value}
            onSelect={() => store.setSort(sort.value)}
          >
            {sort.label}
          </FilterOption>
        ))}
      </FilterSection>
    </FilterSections>
  );

  return (
    <>
      <SearchToolbar
        query={store.q}
        onQueryChange={store.setQuery}
        placeholder="Chercher parmi tous les sujets…"
        leading={
          <Toggle
            variant="outline"
            size="sm"
            pressed={store.followedOnly}
            onPressedChange={store.setFollowedOnly}
          >
            <Heart /> Suivis
          </Toggle>
        }
        controls={
          <>
            <FacetCombobox
              label="Catégorie"
              options={facetList}
              value={store.category}
              onChange={store.setCategory}
            />
            <Select
              value={store.sort}
              onValueChange={(value) =>
                store.setSort(value as typeof store.sort)
              }
            >
              <SelectTrigger size="sm" className="w-[190px]" aria-label="Trier les sujets">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPIC_SORTS.map((sort) => (
                  <SelectItem key={sort.value} value={sort.value}>
                    {sort.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        filters={mobileFilters}
        activeCount={activeCount}
        onClear={store.reset}
        count={total}
        countLabel="sujet"
      />

      <PageContainer>
        {query.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-[86px] animate-pulse rounded-2xl bg-muted/50"
              />
            ))}
          </div>
        ) : query.isError ? (
          <Card className="items-center gap-3 py-12 text-center">
            <div className="text-base font-semibold">Impossible de charger les sujets</div>
            <Button variant="outline" onClick={() => query.refetch()}>
              Réessayer
            </Button>
          </Card>
        ) : total === 0 ? (
          <Card className="items-center gap-3 py-12 text-center">
            <div className="text-base font-semibold">Aucun sujet ne correspond</div>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              Essaie un mot-clé plus court, ou retire une catégorie.
            </p>
            <Button variant="outline" onClick={store.reset}>
              Réinitialiser les filtres
            </Button>
          </Card>
        ) : (
          <>
            <TopicGrid topics={topics} onOpen={(id) => navigate(`/topics/${id}`)} />

            {query.hasNextPage && (
              <div ref={sentinelRef} className="mt-1 h-px" aria-hidden="true" />
            )}

            {query.isFetchingNextPage && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[86px] animate-pulse rounded-2xl bg-muted/50"
                  />
                ))}
              </div>
            )}

            {!canObserve && query.hasNextPage && (
              <div className="mt-5 flex justify-center">
                <Button variant="outline" onClick={() => query.fetchNextPage()}>
                  Afficher plus de sujets
                </Button>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
