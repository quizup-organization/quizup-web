import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Heart } from "lucide-react";
import {
  Button,
  Card,
  Label,
  ListBox,
  Select,
  ToggleButton,
} from "@heroui/react";
import { SearchToolbar } from "@/shared/components/search-toolbar";
import { FacetCombobox } from "../components/facet-combobox";
import { PageContainer } from "@/features/shell";
import { categoryColor } from "@/shared/utils/categories";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { TopicGrid } from "../components/TopicGrid";
import {
  PAGE_SIZE,
  TOPIC_SORTS,
  useActiveFilterCount,
  useTopicFilterStore,
} from "../stores/useTopicFilterStore";
import { useTopicFacets, useTopicsList } from "../hooks/useTopics";

const MAX_PAGE_SIZE = 100;

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
  const size = Math.min(visiblePages * PAGE_SIZE, MAX_PAGE_SIZE);

  const query = useTopicsList({
    q: debouncedQuery,
    category: store.category ?? undefined,
    sort: store.sort,
    followed: store.followedOnly,
    page: 0,
    size,
  });

  const facets = useTopicFacets({
    q: debouncedQuery,
    followed: store.followedOnly,
  });

  const facetList = useMemo(
    () =>
      (facets.data?.categories ?? []).map((facet) => ({
        code: facet.category,
        label: facet.label,
        count: facet.count,
        color: categoryColor(facet.category),
      })),
    [facets.data],
  );

  const topics = query.data?.content ?? [];
  const total = query.data?.totalElements ?? 0;
  const hasMore = topics.length < Math.min(total, MAX_PAGE_SIZE);

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
          <ToggleButton
            size="sm"
            isSelected={store.followedOnly}
            onChange={(isSelected) => {
              store.setFollowedOnly(isSelected);
              setVisiblePages(1);
            }}
          >
            <Heart /> Suivis
          </ToggleButton>
        }
        controls={
          <>
            <FacetCombobox
              label="Catégorie"
              options={facetList.map((facet) => ({
                value: facet.code,
                label: facet.label,
                count: facet.count,
                color: facet.color,
              }))}
              value={store.category}
              onChange={(value) => {
                store.setCategory(value);
                setVisiblePages(1);
              }}
            />
            <Select
              value={store.sort}
              onChange={(key) => {
                store.setSort(String(key) as typeof store.sort);
                setVisiblePages(1);
              }}
              className="w-[190px]"
            >
              <Select.Trigger aria-label="Trier les sujets">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {TOPIC_SORTS.map((s) => (
                    <ListBox.Item key={s.value} id={s.value} textValue={s.label}>
                      <Label>{s.label}</Label>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
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
                className="h-[106px] w-[96px] animate-pulse bg-default/60"
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              />
            ))}
          </div>
        ) : query.isError ? (
          <Card className="items-center gap-3 py-12 text-center">
            <div className="text-base font-semibold">Impossible de charger les sujets</div>
            <Button variant="outline" onPress={() => query.refetch()}>
              Réessayer
            </Button>
          </Card>
        ) : total === 0 ? (
          <Card className="items-center gap-3 py-12 text-center">
            <div className="text-base font-semibold">Aucun sujet ne correspond</div>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted">
              Essaie un mot-clé plus court, ou retire une catégorie.
            </p>
            <Button variant="outline" onPress={() => store.reset()}>
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
                  onPress={() => setVisiblePages((p) => p + 1)}
                >
                  Afficher {Math.min(PAGE_SIZE, total - topics.length)} sujets de plus
                  <span className="font-normal text-muted">
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
