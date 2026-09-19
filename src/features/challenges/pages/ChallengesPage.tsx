import { useMemo, useState } from "react";
import { Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SearchToolbar } from "@/components/search-toolbar";
import { PageContainer } from "@/features/shell/components/PageContainer";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { normalize } from "@/lib/helpers";
import { ChallengeRow } from "../components/ChallengeRow";
import {
  useChallenges,
  useChallengeActions,
  type ChallengeView,
} from "../hooks/useChallenges";

/**
 * Défis — liste **unique** reçus + envoyés (comme la maquette), recherche joueur/sujet,
 * accept/refus (reçus) et annulation (envoyés).
 */
export function ChallengesPage() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  const received = useChallenges("received");
  const sent = useChallenges("sent");
  const { accept, decline } = useChallengeActions();

  const items = useMemo(() => {
    const merged = [...received.items, ...sent.items].sort(
      (a, b) =>
        new Date(b.challenge.createdAt).getTime() -
        new Date(a.challenge.createdAt).getTime(),
    );
    const needle = normalize(debounced);
    if (!needle) return merged;
    return merged.filter(
      (view: ChallengeView) =>
        normalize(view.otherName).includes(needle) ||
        normalize(view.topic.name).includes(needle),
    );
  }, [received.items, sent.items, debounced]);

  const pending = accept.isPending || decline.isPending;

  return (
    <>
      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Chercher parmi mes défis (joueur ou sujet)…"
        activeCount={query ? 1 : 0}
        onClear={() => setQuery("")}
        count={items.length}
        countLabel="défi"
      />

      <PageContainer>
        {received.isError || sent.isError ? (
          <Card className="items-center gap-3 py-12 text-center">
            <div className="text-base font-semibold">
              Impossible de charger les défis
            </div>
          </Card>
        ) : items.length === 0 ? (
          <Card className="items-center gap-3 py-12 text-center">
            <Swords className="size-6 text-muted-foreground" />
            <div className="text-base font-semibold">
              {query ? "Aucun défi à cette recherche" : "Aucun défi"}
            </div>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              Défie un joueur depuis sa fiche : choisis un thème et lance le défi.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((view) => (
              <ChallengeRow
                key={view.challenge.challengeId}
                view={view}
                pending={pending}
                onAccept={(id) => accept.mutate(id)}
                onDecline={(id) => decline.mutate(id)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
