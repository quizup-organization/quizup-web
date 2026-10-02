import { useState } from "react";
import { SearchField } from "@heroui/react";
import { AppDialog } from "@/shared/components/app-dialog";
import { TopicGrid, useTopicsList } from "@/features/topics";
import { useDebounce } from "@/shared/hooks/useDebounce";

interface ThemePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (topicId: string) => void;
  opponentName: string;
}

/**
 * Sélecteur de thème du défi. Le thème choisi déclenche `POST /api/challenges`.
 * Recherche serveur (`GET /api/topics?q=`, tri popularité).
 */
export function ThemePickerDialog({
  open,
  onClose,
  onSelect,
  opponentName,
}: ThemePickerDialogProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  const topicsQuery = useTopicsList({
    q: debounced,
    sort: "POPULAR",
    page: 0,
    size: 12,
  });
  const topics = topicsQuery.data?.content ?? [];

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Choisir un thème"
      sub={`Défie ${opponentName} sur le thème de ton choix.`}
      className="sm:max-w-lg"
    >
      <SearchField
        aria-label="Rechercher un thème"
        value={query}
        onChange={setQuery}
        variant="secondary"
        fullWidth
        className="mb-3.5"
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Rechercher un thème…" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      <TopicGrid topics={topics} onOpen={onSelect} />
      {!topicsQuery.isLoading && topics.length === 0 && (
        <div className="py-4 text-center text-[13px] text-muted">
          Aucun thème à ce nom.
        </div>
      )}
    </AppDialog>
  );
}
