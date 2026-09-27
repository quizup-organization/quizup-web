import { useState } from "react";
import { Search } from "lucide-react";
import { AppDialog } from "@/shared/components/app-dialog";
import { Input } from "@/components/ui/input";
import { HexGrid } from "@/shared/components/hex-grid";
import { useTopicsList } from "@/features/topics";
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
      <div className="relative mb-3.5">
        <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un thème…"
          className="pl-9"
        />
      </div>

      <div className="max-h-[380px] overflow-y-auto">
        <HexGrid
          topics={topics}
          onOpen={onSelect}
          size={72}
          className="py-1"
        />
        {!topicsQuery.isLoading && topics.length === 0 && (
          <div className="py-4 text-center text-[13px] text-muted-foreground">
            Aucun thème à ce nom.
          </div>
        )}
      </div>
    </AppDialog>
  );
}
