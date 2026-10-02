import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { Button, Card, Label, ListBox, Select, Tabs } from "@heroui/react";
import { SearchToolbar } from "@/shared/components/search-toolbar";
import { PageContainer, useMe } from "@/features/shell";
import { useDebounce } from "@/shared/hooks/useDebounce";
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
  const [tab, setTab] = useState<PeopleDirection>("following");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PeopleSort>("RECENT");
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
      selectedKey={tab}
      onSelectionChange={(key) => setTab(key as PeopleDirection)}
      className="gap-0"
    >
      <div className="border-b bg-background">
        <div className="mx-auto w-full max-w-screen-xl px-3.5 pt-5 sm:px-5 lg:px-6">
          <Tabs.ListContainer className="w-fit max-w-full">
            <Tabs.List
              aria-label="Personnes"
              className="min-w-0 justify-start **:data-[slot=tabs-tab]:whitespace-nowrap"
            >
              <Tabs.Tab id="following">
                Abonnements ({followingCount})
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="followers">
                Abonnés ({followersCount})
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </div>
      </div>

      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Chercher une personne…"
        controls={
          <Select
            value={sort}
            onChange={(value) => setSort(value as PeopleSort)}
            className="w-[190px]"
          >
            <Select.Trigger aria-label="Trier les personnes">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {SORTS.map((s) => (
                  <ListBox.Item key={s.value} id={s.value} textValue={s.label}>
                    <Label>{s.label}</Label>
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        }
        activeCount={query ? 1 : 0}
        onClear={() => setQuery("")}
        count={total}
        countLabel="personne"
      />

      <PageContainer>
        <Tabs.Panel id={tab}>
          {active.isError ? (
            <Card className="items-center gap-3 py-12 text-center">
              <div className="text-base font-semibold">
                Impossible de charger les personnes
              </div>
              <Button variant="outline" onPress={() => active.refetch()}>
                Réessayer
              </Button>
            </Card>
          ) : people.length === 0 ? (
            <Card className="items-center gap-3 py-12 text-center">
              <UserRound className="size-6 text-muted" />
              <div className="text-base font-semibold">
                {tab === "following"
                  ? "Tu ne suis encore personne"
                  : "Personne ne te suit encore"}
              </div>
              <p className="max-w-[52ch] text-sm leading-relaxed text-muted">
                Trouve des joueurs via la recherche, puis ouvre leur profil pour les suivre.
              </p>
              <Button variant="outline" onPress={() => navigate("/topics")}>
                Explorer les sujets
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),260px))] gap-3">
              {people.map((person) => (
                <PersonCard
                  key={person.userId}
                  person={person}
                  onOpen={(userId) => navigate(`/players/${userId}`)}
                />
              ))}
            </div>
          )}
        </Tabs.Panel>
      </PageContainer>
    </Tabs>
  );
}
