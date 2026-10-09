import { useState } from "react";
import { Search } from "lucide-react";
import { AppDialog } from "@/shared/components/app-dialog";
import { Input } from "@/components/ui/input";
import { TopicGrid, useTopicsList } from "@/features/topics";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { PlayerSelectRow, type PlayerRef } from "./PlayerSelectRow";

interface ThemePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (topicId: string) => void;
  title?: string;
  sub?: string;
  /** Adversaire visé (défi nominatif) : rappel affiché en tête, carte identique à la sélection. */
  opponent?: PlayerRef;
}

/**
 * Sélecteur de thème pour créer un salon (PRIVATE) sur le thème choisi.
 * Recherche serveur (`GET /api/topics?q=`, tri popularité).
 */
export function ThemePickerDialog({
  open,
  onClose,
  onSelect,
  title = "Choisir un thème",
  sub = "Crée un salon sur le thème de ton choix.",
  opponent,
}: ThemePickerDialogProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  const topicsQuery = useTopicsList({
    q: debounced,
    sort: "POPULAR",
  });
  const topics = (topicsQuery.data?.pages[0]?.content ?? []).slice(0, 12);

  function handleSelect(topicId: string) {
    // Replie le clavier mobile pour libérer l'écran avant de continuer.
    (document.activeElement as HTMLElement | null)?.blur();
    onSelect(topicId);
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      sub={sub}
      className="sm:max-w-lg"
      toolbar={
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
      }
    >
      {opponent && (
        <div className="mb-3">
          <PlayerSelectRow player={opponent} />
        </div>
      )}
      <TopicGrid topics={topics} onOpen={handleSelect} />
      {!topicsQuery.isLoading && topics.length === 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Aucun thème à ce nom.
        </div>
      )}
    </AppDialog>
  );
}
