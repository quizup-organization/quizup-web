import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchToolbar } from "@/components/search-toolbar";
import { PageContainer } from "@/features/shell/components/PageContainer";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { normalize } from "@/lib/helpers";
import { PersonCard } from "../components/PersonCard";
import { usePeople, type PeopleDirection } from "../hooks/usePeople";

const SORTS = [
  { value: "alpha", label: "Ordre alphabétique" },
  { value: "level", label: "Niveau" },
  { value: "recent", label: "Ajout récent" },
];

export function PeoplePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<PeopleDirection>("following");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const debounced = useDebounce(query, 250);

  const withLevel = sort === "level";
  const following = usePeople("following", { withLevel });
  const followers = usePeople("followers", { withLevel });
  const active = tab === "following" ? following : followers;

  const people = useMemo(() => {
    const needle = normalize(debounced);
    const filtered = needle
      ? active.people.filter((p) => normalize(p.displayName).includes(needle))
      : active.people;
    if (sort === "alpha") {
      return [...filtered].sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "fr"),
      );
    }
    if (sort === "level") {
      return [...filtered].sort(
        (a, b) =>
          (b.level ?? 0) - (a.level ?? 0) ||
          a.displayName.localeCompare(b.displayName, "fr"),
      );
    }
    return filtered;
  }, [active.people, debounced, sort]);

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as PeopleDirection)}
      className="gap-0"
    >
      <div className="mx-auto w-full max-w-screen-xl px-3.5 pt-5 sm:px-5 lg:px-6">
        <TabsList variant="line" className="h-auto w-full justify-start">
          <TabsTrigger value="following">
            Abonnements ({following.people.length})
          </TabsTrigger>
          <TabsTrigger value="followers">
            Abonnés ({followers.people.length})
          </TabsTrigger>
        </TabsList>
      </div>

      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Chercher une personne…"
        controls={
          <Select value={sort} onValueChange={(value) => setSort(String(value))}>
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
        activeCount={query ? 1 : 0}
        onClear={() => setQuery("")}
        count={people.length}
        countLabel="personne"
      />

      <PageContainer>
        <TabsContent value={tab}>
          {active.isError ? (
            <Card className="items-center gap-3 py-12 text-center">
              <div className="text-base font-semibold">
                Impossible de charger les personnes
              </div>
              <Button variant="outline" onClick={() => active.refetch()}>
                Réessayer
              </Button>
            </Card>
          ) : people.length === 0 ? (
            <Card className="items-center gap-3 py-12 text-center">
              <UserRound className="size-6 text-muted-foreground" />
              <div className="text-base font-semibold">
                {tab === "following"
                  ? "Tu ne suis encore personne"
                  : "Personne ne te suit encore"}
              </div>
              <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                Trouve des joueurs via la recherche, puis ouvre leur profil pour les suivre.
              </p>
              <Button variant="outline" onClick={() => navigate("/topics")}>
                Explorer les sujets
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
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
