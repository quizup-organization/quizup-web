import { useMemo, useState } from "react";
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
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SearchToolbar } from "@/components/search-toolbar";
import { PageContainer } from "@/features/shell/components/PageContainer";
import { categoryColor } from "@/shared/utils/categories";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toTopicView } from "@/lib/services/topics";
import { TopicGrid } from "../components/TopicGrid";
import {
  PAGE_SIZE,
  TOPIC_SORTS,
  useActiveFilterCount,
  useTopicFilterStore,
} from "../stores/useTopicFilterStore";
import {
  useFollowedTopicIds,
  useTopicCategories,
  useTopicFacetCounts,
  useTopicSearch,
} from "../hooks/useTopics";

export function TopicsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useTopicFilterStore();
  const activeCount = useActiveFilterCount();
  const [visiblePages, setVisiblePages] = useState(1);

  // Initialise la recherche depuis `?q=` (barre supérieure / liens « Voir tout »).
  const initialQuery = searchParams.get("q") ?? "";
  useMemo(() => {
    if (initialQuery && initialQuery !== store.q) store.setQuery(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const debouncedQuery = useDebounce(store.q, 300);
  const { data: followedIds = [] } = useFollowedTopicIds();

  const query = useTopicSearch({
    query: debouncedQuery,
    categories: store.categories,
    sort: store.sort,
    followedOnly: store.followedOnly,
    followedIds,
    page: 0,
    size: visiblePages * PAGE_SIZE,
  });

  const categories = useTopicCategories();
  const categoryCodes = useMemo(
    () => (categories.data ?? []).map((c) => c.category),
    [categories.data],
  );
  const facetCounts = useTopicFacetCounts(categoryCodes);

  const facetList = useMemo(
    () =>
      (categories.data ?? []).map((c) => ({
        code: c.category,
        label: c.label,
        count: facetCounts[c.category] ?? 0,
      })),
    [categories.data, facetCounts],
  );

  const topics = (query.data?.content ?? []).map(toTopicView);
  const total = query.data?.totalElements ?? 0;
  const hasMore = visiblePages * PAGE_SIZE < total;

  return (
    <>
      <SearchToolbar
        query={store.q}
        onQueryChange={(q) => {
          store.setQuery(q);
          setVisiblePages(1);
        }}
        placeholder="Chercher parmi tous les sujets…"
        leading={
          <Toggle
            variant="outline"
            size="sm"
            pressed={store.followedOnly}
            onPressedChange={(pressed) => {
              store.setFollowedOnly(pressed);
              setVisiblePages(1);
            }}
          >
            <Heart /> Suivis
          </Toggle>
        }
        controls={
          <Select
            value={store.sort}
            onValueChange={(value) => {
              store.setSort(value as typeof store.sort);
              setVisiblePages(1);
            }}
          >
            <SelectTrigger size="sm" className="w-[190px]" aria-label="Trier les sujets">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOPIC_SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        facets={
          <ToggleGroup
            variant="outline"
            size="sm"
            value={store.categories}
            onValueChange={(value) => {
              store.setCategories(value as string[]);
              setVisiblePages(1);
            }}
          >
            {facetList.map((facet) => (
              <ToggleGroupItem key={facet.code} value={facet.code} className="gap-1.5">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: categoryColor(facet.code) }}
                />
                {facet.label}
                <span className="text-[11px] text-muted-foreground">
                  {facet.count}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
        activeCount={activeCount}
        onClear={() => {
          store.reset();
          setVisiblePages(1);
        }}
        count={total}
        countLabel="sujet"
      />

      <PageContainer>
        {query.isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(256px,1fr))] gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-[88px] animate-pulse" />
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
            <Button variant="outline" onClick={() => store.reset()}>
              Réinitialiser les filtres
            </Button>
          </Card>
        ) : (
          <>
            <TopicGrid topics={topics} onOpen={(id) => navigate(`/topics/${id}`)} />
            {hasMore && (
              <div className="mt-5 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setVisiblePages((p) => p + 1)}
                >
                  Afficher {Math.min(PAGE_SIZE, total - topics.length)} sujets de plus
                  <span className="font-normal text-muted-foreground">
                    · {topics.length} / {total}
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
