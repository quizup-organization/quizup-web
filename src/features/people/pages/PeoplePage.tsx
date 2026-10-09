import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { SearchToolbar } from "@/shared/components/search-toolbar";
import { PageHeaderBar } from "@/shared/components/page-header-bar";
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section";
import { PageContainer, useMe } from "@/features/shell";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useUrlParam } from "@/shared/hooks/useUrlParam";
import { PersonCard } from "../components/PersonCard";
import { usePeople } from "../hooks/usePeople";
import type { PeopleDirection, PeopleSort } from "@/features/player/domain/profile";

const SORTS: { value: PeopleSort; label: string }[] = [
  { value: "LEVEL", label: "Niveau" },
  { value: "RECENT", label: "Ajout récent" },
  { value: "ALPHA", label: "Ordre alphabétique" },
];

export function PeoplePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useUrlParam<PeopleDirection>("tab", "following");
  const [query, setQuery] = useUrlParam<string>("q", "");
  const [sort, setSort] = useUrlParam<PeopleSort>("sort", "RECENT");
  const debounced = useDebounce(query, 250);
  const me = useMe();

  const active = usePeople(tab, {
    q: debounced,
    sort,
    page: 0,
    size: 100,
  });
  const people = active.data?.content ?? [];
  const total = active.data?.totalElements ?? 0;
  const followingCount = me.data?.followingCount ?? 0;
  const followersCount = me.data?.followersCount ?? 0;

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as PeopleDirection)}
      className="gap-0"
    >
      <PageHeaderBar>
        <TabsList>
          <TabsTrigger value="following">
            Abonnements ({followingCount})
          </TabsTrigger>
          <TabsTrigger value="followers">
            Abonnés ({followersCount})
          </TabsTrigger>
        </TabsList>
      </PageHeaderBar>

      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Chercher une personne…"
        controls={
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as PeopleSort)}
          >
            <SelectTrigger size="sm" className="w-[190px]" aria-label="Trier les personnes">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
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
              title="Trier par"
              summary={SORTS.find((option) => option.value === sort)?.label}
            >
              {SORTS.map((option) => (
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
        countLabel="personne"
      />

      <PageContainer>
        <TabsContent value={tab} className="mt-0">
          {active.isError ? (
            <EmptyState title="Impossible de charger les personnes">
              <Button variant="outline" onClick={() => active.refetch()}>
                Réessayer
              </Button>
            </EmptyState>
          ) : people.length === 0 ? (
            <EmptyState
              icon={<UserRound className="size-6 text-muted-foreground" />}
              title={
                tab === "following"
                  ? "Tu ne suis encore personne"
                  : "Personne ne te suit encore"
              }
              description="Trouve des joueurs via la recherche, puis ouvre leur profil pour les suivre."
            >
              <Button variant="outline" onClick={() => navigate("/topics")}>
                Explorer les sujets
              </Button>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4">
              {people.map((person) => (
                <PersonCard
                  key={person.userId}
                  person={person}
                  onOpen={(userId) => navigate(`/players/${userId}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </PageContainer>
    </Tabs>
  );
}
