import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";
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
import { useUrlParam, useUrlParamBool, useUrlParams } from "@/shared/hooks/useUrlParam";
import { TopicGrid } from "../components/TopicGrid";
import type { TopicSort } from "../domain/topic";
import { useTopicFacets, useTopicsList } from "../hooks/useTopics";

const SKELETON_COUNT = 6;

const TOPIC_SORTS: { value: TopicSort; label: string }[] = [
  { value: "POPULAR", label: "Les plus suivis" },
  { value: "ALPHA", label: "Ordre alphabétique" },
];

/**
 * Catalogue Sujets : recherche et filtres **persistés dans l'URL** (`?q=&category=&sort=&followed=`)
 * — un retour depuis une fiche sujet restaure exactement la même vue, et le lien est partageable.
 */
export function TopicsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useUrlParam<string>("q", "");
  const [category, setCategory] = useUrlParam<string>("category", "");
  const [sort, setSort] = useUrlParam<TopicSort>("sort", "POPULAR");
  const [followedOnly, setFollowedOnly] = useUrlParamBool("followed", false);
  const updateParams = useUrlParams();
  const scrollContainer = useScrollContainer();
  const canObserve = typeof IntersectionObserver !== "undefined";

  const debouncedQuery = useDebounce(q, 300);

  const query = useTopicsList({
    q: debouncedQuery,
    category: category || undefined,
    sort,
    followed: followedOnly,
  });

  const facets = useTopicFacets({
    q: debouncedQuery,
    followed: followedOnly,
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
  const activeCount =
    (q ? 1 : 0) + (category ? 1 : 0) + (followedOnly ? 1 : 0);

  const reset = () =>
    updateParams((params) => {
      params.delete("q");
      params.delete("category");
      params.delete("sort");
      params.delete("followed");
    });

  const sentinelRef = useLoadMoreOnIntersect({
    enabled: query.hasNextPage && !query.isFetchingNextPage,
    onLoadMore: () => query.fetchNextPage(),
    rootRef: scrollContainer,
  });

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
        summary={followedOnly ? "Uniquement mes suivis" : "Tous les sujets"}
      >
        <FilterOption
          selected={followedOnly}
          onSelect={() => setFollowedOnly(!followedOnly)}
        >
          <Heart className="size-4" /> Uniquement mes suivis
        </FilterOption>
      </FilterSection>

      <FilterSection
        value="category"
        title="Catégorie"
        summary={
          facetList.find((facet) => facet.value === category)?.label ?? "Toutes"
        }
      >
        <FacetOptionList
          options={facetList}
          value={category || null}
          onChange={(value) => setCategory(value ?? "")}
        />
      </FilterSection>

      <FilterSection
        value="sort"
        title="Trier par"
        summary={TOPIC_SORTS.find((option) => option.value === sort)?.label}
      >
        {TOPIC_SORTS.map((option) => (
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
  );

  return (
    <>
      <SearchToolbar
        query={q}
        onQueryChange={setQ}
        placeholder="Chercher parmi tous les sujets…"
        leading={
          <Toggle
            variant="outline"
            size="sm"
            pressed={followedOnly}
            onPressedChange={setFollowedOnly}
          >
            <Heart /> Suivis
          </Toggle>
        }
        controls={
          <>
            <FacetCombobox
              label="Catégorie"
              options={facetList}
              value={category || null}
              onChange={(value) => setCategory(value ?? "")}
            />
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as TopicSort)}
            >
              <SelectTrigger size="sm" className="w-[190px]" aria-label="Trier les sujets">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPIC_SORTS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        filters={mobileFilters}
        activeCount={activeCount}
        onClear={reset}
        count={total}
        countLabel="sujet"
      />

      <PageContainer>
        {query.isLoading ? (
          <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-19 animate-pulse rounded-2xl bg-muted/50"
              />
            ))}
          </div>
        ) : query.isError ? (
          <EmptyState title="Impossible de charger les sujets">
            <Button variant="outline" onClick={() => query.refetch()}>
              Réessayer
            </Button>
          </EmptyState>
        ) : total === 0 ? (
          <EmptyState
            title="Aucun sujet ne correspond"
            description="Essaie un mot-clé plus court, ou retire une catégorie."
          >
            <Button variant="outline" onClick={reset}>
              Réinitialiser les filtres
            </Button>
          </EmptyState>
        ) : (
          <>
            <TopicGrid topics={topics} onOpen={(id) => navigate(`/topics/${id}`)} />

            {query.hasNextPage && (
              <div ref={sentinelRef} className="mt-1 h-px" aria-hidden="true" />
            )}

            {query.isFetchingNextPage && (
              <div className="mt-4 grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    className="h-19 animate-pulse rounded-2xl bg-muted/50"
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
