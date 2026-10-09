import { useState } from "react";
import { Search } from "lucide-react";
import { AppDialog } from "@/shared/components/app-dialog";
import { SHEET_DETENTS } from "@/shared/theme/sheets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTopicsList } from "@/features/topics";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect";
import { ThemeSelectRow } from "./ThemeSelectRow";

interface ThemePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (topicId: string) => void;
  title?: string;
  sub?: string;
}

/**
 * Sélecteur de thème du défi nominatif : liste de thèmes au **même format que le wizard**
 * (lignes neutres + radio, pas de cartes de catalogue), recherche serveur (`GET /api/topics?q=`,
 * tri popularité) et confirmation par « Lancer ». Le champ de recherche est épinglé sous
 * l'en-tête (toolbar), jamais collé aux actions.
 */
export function ThemePickerDialog({
  open,
  onClose,
  onSelect,
  title = "Choisir un thème",
  sub = "Crée un salon sur le thème de ton choix.",
}: ThemePickerDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const debounced = useDebounce(query, 250);

  /** Repart d'une sélection vierge : la fermeture (et le lancement) réinitialise l'état local. */
  function reset() {
    setQuery("");
    setSelectedTopicId("");
  }

  function close() {
    reset();
    onClose();
  }

  const topicsQuery = useTopicsList({
    q: debounced,
    sort: "POPULAR",
  });
  const topics = topicsQuery.data?.pages.flatMap((page) => page.content) ?? [];

  // Scroll infini : charge la page suivante quand la sentinelle approche.
  const sentinelRef = useLoadMoreOnIntersect({
    enabled: topicsQuery.hasNextPage && !topicsQuery.isFetchingNextPage,
    onLoadMore: () => topicsQuery.fetchNextPage(),
  });

  function launch() {
    if (!selectedTopicId) return;
    // Replie le clavier mobile pour libérer l'écran avant de continuer.
    (document.activeElement as HTMLElement | null)?.blur();
    const topicId = selectedTopicId;
    reset();
    onSelect(topicId);
  }

  const searchField = (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        enterKeyHint="search"
        placeholder="Rechercher un thème…"
        className="pl-9"
      />
    </div>
  );

  return (
    <AppDialog
      open={open}
      onClose={close}
      title={title}
      sub={sub}
      className="sm:max-w-lg"
      sheetOnTouch
      sheetDetents={SHEET_DETENTS.duel}
      bodyClassName="flex flex-col"
      toolbar={searchField}
      footerClassName="compact:flex-row compact:items-center compact:justify-end"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Annuler
          </Button>
          <Button onClick={launch} disabled={!selectedTopicId}>
            Lancer
          </Button>
        </>
      }
    >
      {topicsQuery.isLoading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Chargement…
        </p>
      ) : topics.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Aucun thème à ce nom.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {topics.map((topic) => (
            <ThemeSelectRow
              key={topic.topicId}
              topic={topic}
              selected={selectedTopicId === topic.topicId}
              onSelect={() => setSelectedTopicId(topic.topicId)}
            />
          ))}
          {topicsQuery.hasNextPage && (
            <div
              ref={sentinelRef}
              className="py-3 text-center text-xs text-muted-foreground"
            >
              {topicsQuery.isFetchingNextPage ? "Chargement…" : "\u00a0"}
            </div>
          )}
        </div>
      )}
    </AppDialog>
  );
}
