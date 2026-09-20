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
import { SearchToolbar } from "@/components/search-toolbar";
import { FacetCombobox } from "@/components/facet-combobox";
import { Toggle } from "@/components/ui/toggle";
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
          <>
            <FacetCombobox
              label="Catégorie"
              options={facetList.map((facet) => ({
                value: facet.code,
                label: facet.label,
                count: facet.count,
                color: categoryColor(facet.code),
              }))}
              value={store.categories}
              onChange={(value) => {
                store.setCategories(value);
                setVisiblePages(1);
              }}
            />
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
          </>
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
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="h-[112px] w-[97px] animate-pulse rounded-2xl bg-muted/60"
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
