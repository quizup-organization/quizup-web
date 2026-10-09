import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Plus, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeaderBar } from "@/shared/components/page-header-bar";
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
import { MyTopicRow } from "../components/MyTopicRow";
import type { TopicSort } from "../domain/topic";
import { useTopicFacets, useTopicsList } from "../hooks/useTopics";

const SKELETON_COUNT = 6;

const TOPIC_SORTS: { value: TopicSort; label: string }[] = [
  { value: "POPULAR", label: "Les plus suivis" },
  { value: "ALPHA", label: "Ordre alphabétique" },
  { value: "RECENT", label: "Nouveautés" },
];

/**
 * Catalogue Sujets : recherche et filtres **persistés dans l'URL** (`?q=&category=&sort=&followed=`)
 * — un retour depuis une fiche sujet restaure exactement la même vue, et le lien est partageable.
 * L'atelier d'auteur est un **filtre** (`?mine=true`, comme « Suivis ») avec un bouton
 * « Créer un sujet » : `mine` étant exclusif des autres filtres côté BFF, activer un autre
 * filtre (ou saisir une recherche) quitte « Mes sujets ».
 */
export function TopicsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useUrlParam<string>("q", "");
  const [category, setCategory] = useUrlParam<string>("category", "");
  const [sort, setSort] = useUrlParam<TopicSort>("sort", "POPULAR");
  const [followedOnly, setFollowedOnly] = useUrlParamBool("followed", false);
  const [mine, setMine] = useUrlParamBool("mine", false);
  const updateParams = useUrlParams();
  const scrollContainer = useScrollContainer();
  const canObserve = typeof IntersectionObserver !== "undefined";

  const debouncedQuery = useDebounce(q, 300);

  const query = useTopicsList(
    mine
      ? { mine: true }
      : {
          q: debouncedQuery,
          category: category || undefined,
          sort,
          followed: followedOnly,
        },
  );

  const facets = useTopicFacets(
    {
      q: debouncedQuery,
      followed: followedOnly,
    },
    !mine,
  );

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
    (q ? 1 : 0) +
    (category ? 1 : 0) +
    (followedOnly ? 1 : 0) +
    (mine ? 1 : 0);

  const reset = () =>
    updateParams((params) => {
      params.delete("q");
      params.delete("category");
      params.delete("sort");
      params.delete("followed");
      params.delete("mine");
    });

  /** `mine` est exclusif côté BFF : l'activer repart d'un état de filtres vierge. */
  const activateMine = () =>
    updateParams((params) => {
      params.delete("q");
      params.delete("category");
      params.delete("sort");
      params.delete("followed");
      params.set("mine", "true");
    });

  const toggleMine = (next: boolean) => {
    if (next) activateMine();
    else setMine(false);
  };

  /** Quitte « Mes sujets » dès qu'un autre filtre (ou la recherche) est utilisé. */
  const exitMine = () => {
    if (mine) setMine(false);
  };

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

  const listClassName = mine
    ? "flex flex-col gap-3"
    : "grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4";
  const itemSkeletonClassName = mine
    ? "h-23 animate-pulse rounded-2xl bg-muted/50"
    : "h-19 animate-pulse rounded-2xl bg-muted/50";

  const mobileFilters = (
    <FilterSections defaultOpen="sort">
      <FilterSection
        value="source"
        title="Filtres"
        summary={
          mine
            ? "Mes sujets"
            : followedOnly
              ? "Uniquement mes suivis"
              : "Tous les sujets"
        }
      >
        <FilterOption
          selected={followedOnly && !mine}
          onSelect={() => {
            exitMine();
            setFollowedOnly(!followedOnly);
          }}
        >
          <Heart className="size-4" /> Uniquement mes suivis
        </FilterOption>
        <FilterOption selected={mine} onSelect={() => toggleMine(!mine)}>
          <SquarePen className="size-4" /> Mes sujets
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
          onChange={(value) => {
            exitMine();
            setCategory(value ?? "");
          }}
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
            onSelect={() => {
              exitMine();
              setSort(option.value);
            }}
          >
            {option.label}
          </FilterOption>
        ))}
      </FilterSection>
    </FilterSections>
  );

  return (
    <>
      <PageHeaderBar>
        <Button
          className="ml-auto"
          nativeButton={false}
          render={<Link to="/topics/new" />}
        >
          <Plus /> Créer un sujet
        </Button>
      </PageHeaderBar>

      <SearchToolbar
        query={q}
        onQueryChange={(value) => {
          exitMine();
          setQ(value);
        }}
        placeholder="Chercher parmi tous les sujets…"
        leading={
          <>
            <Toggle
              variant="outline"
              size="sm"
              pressed={followedOnly && !mine}
              onPressedChange={() => {
                exitMine();
                setFollowedOnly(!followedOnly);
              }}
            >
              <Heart /> Suivis
            </Toggle>
            <Toggle
              variant="outline"
              size="sm"
              pressed={mine}
              onPressedChange={() => toggleMine(!mine)}
            >
              <SquarePen /> Mes sujets
            </Toggle>
          </>
        }
        controls={
          mine ? undefined : (
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
          )
        }
        filters={mobileFilters}
        activeCount={activeCount}
        onClear={reset}
        count={total}
        countLabel="sujet"
      />

      <PageContainer>
        {query.isLoading ? (
          <div className={listClassName}>
            {Array.from({ length: mine ? 3 : 12 }).map((_, i) => (
              <div key={i} className={itemSkeletonClassName} />
            ))}
          </div>
        ) : query.isError ? (
          <EmptyState
            title={mine ? "Impossible de charger tes sujets" : "Impossible de charger les sujets"}
          >
            <Button variant="outline" onClick={() => query.refetch()}>
              Réessayer
            </Button>
          </EmptyState>
        ) : total === 0 ? (
          mine ? (
            <EmptyState
              icon={<SquarePen className="size-6 text-muted-foreground" />}
              title="Aucun sujet créé"
              description="Crée ton premier sujet, ajoute au moins 7 questions approuvées, puis publie-le."
            >
              <Button nativeButton={false} render={<Link to="/topics/new" />}>
                <Plus /> Créer un sujet
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              title="Aucun sujet ne correspond"
              description="Essaie un mot-clé plus court, ou retire une catégorie."
            >
              <Button variant="outline" onClick={reset}>
                Réinitialiser les filtres
              </Button>
            </EmptyState>
          )
        ) : (
          <>
            {mine ? (
              <div className="flex flex-col gap-3">
                {topics.map((topic) => (
                  <MyTopicRow
                    key={topic.topicId}
                    topic={topic}
                    onManage={(id) => navigate(`/topics/${id}/manage`)}
                  />
                ))}
              </div>
            ) : (
              <TopicGrid topics={topics} onOpen={(id) => navigate(`/topics/${id}`)} />
            )}

            {query.hasNextPage && (
              <div ref={sentinelRef} className="mt-1 h-px" aria-hidden="true" />
            )}

            {query.isFetchingNextPage && (
              <div className={`mt-4 ${listClassName}`}>
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <div key={i} className={itemSkeletonClassName} />
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
