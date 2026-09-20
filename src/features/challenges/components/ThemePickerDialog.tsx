import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppDialog } from "@/components/app-dialog";
import { Input } from "@/components/ui/input";
import { HexGrid } from "@/components/hex-grid";
import { queryKeys } from "@/lib/query-keys";
import { topicsService, toTopicView } from "@/lib/services/topics";
import { normalize } from "@/lib/helpers";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { FilterCriteria, SearchRequest } from "@/shared/types/search";

interface ThemePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (topicId: string) => void;
  opponentName: string;
}

/**
 * Sélecteur de thème du défi. Le thème choisi déclenche `POST /api/challenges`.
 * Recherche serveur (`POST /topics/search`, `name CONTAINS`).
 */
export function ThemePickerDialog({
  open,
  onClose,
  onSelect,
  opponentName,
}: ThemePickerDialogProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  const request: SearchRequest = useMemo(() => {
    const filters: FilterCriteria[] = [
      { property: "status", operator: "EQUALS", value: "PUBLISHED" },
    ];
    if (debounced.trim()) {
      filters.push({
        property: "nameNormalized",
        operator: "CONTAINS",
        value: normalize(debounced),
      });
    }
    return {
      filters,
      sorts: [{ property: "followersCounter", direction: "DESC" }],
      page: { number: 0, size: 12 },
    };
  }, [debounced]);

  const topicsQuery = useQuery({
    queryKey: queryKeys.topics.search(request),
    queryFn: () => topicsService.search(request),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const topics = (topicsQuery.data?.content ?? []).map(toTopicView);

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
