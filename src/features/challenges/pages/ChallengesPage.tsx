import { useMemo, useState } from "react";
import { Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SearchToolbar } from "@/shared/components/search-toolbar";
import { PageContainer } from "@/features/shell";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { normalize } from "@/lib/helpers";
import { ChallengeRow } from "../components/ChallengeRow";
import { useChallengeActions, useChallenges } from "../hooks/useChallenges";
import type { ChallengeCard } from "../domain/challenge";

/**
 * Défis — liste unique reçus + envoyés (comme la maquette), recherche joueur/sujet,
 * accept/refus (reçus) et annulation (envoyés).
 */
export function ChallengesPage() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  const { data, isLoading, isError } = useChallenges({
    box: "ALL",
    page: 0,
    size: 100,
  });
  const { accept, decline, cancel } = useChallengeActions();

  const items = useMemo(() => {
    const cards: ChallengeCard[] = data?.content ?? [];
    const needle = normalize(debounced);
    if (!needle) return cards;
    return cards.filter(
      (card) =>
        normalize(card.opponent.pseudonym ?? "").includes(needle) ||
        normalize(card.topic.name).includes(needle),
    );
  }, [data, debounced]);

  const pending = accept.isPending || decline.isPending || cancel.isPending;

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
        {isError ? (
          <Card className="items-center gap-3 py-12 text-center">
            <div className="text-base font-semibold">
              Impossible de charger les défis
            </div>
          </Card>
        ) : isLoading ? (
          <Card size="sm" className="px-4 py-6 text-sm text-muted-foreground">
            Chargement…
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
            {items.map((card) => (
              <ChallengeRow
                key={card.challengeId}
                card={card}
                pending={pending}
                onAccept={(id) => accept.mutate(id)}
                onDecline={(id) => decline.mutate(id)}
                onCancel={(id) => cancel.mutate(id)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
