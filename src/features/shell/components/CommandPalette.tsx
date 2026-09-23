import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import { queryKeys } from "@/lib/query-keys";
import { toTopicView } from "@/lib/services/topics";
import { profilesService } from "@/lib/services/profiles";
import { personColor } from "@/features/people";
import { countryFlag, countryLabel } from "@/shared/utils/country";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useTopicSuggestions } from "../hooks/useTopicSuggestions";
import { useProfileSuggestions } from "../hooks/useProfileSuggestions";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Recherche globale (⌘K) — Sujets + Utilisateurs. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  const isQuery = debounced.trim().length >= 2;
  const topicsQuery = useTopicSuggestions(debounced, open);
  const playersQuery = useProfileSuggestions(debounced, open);

  const topics = (topicsQuery.data ?? []).map(toTopicView);
  const players = playersQuery.data ?? [];

  const playerProgress = useQueries({
    queries: (open && players.length > 0 ? players : []).map((player) => ({
      queryKey: queryKeys.profiles.progress(player.userId),
      queryFn: () => profilesService.getProgress(player.userId),
      staleTime: 10 * 60 * 1000,
    })),
  });

  function close() {
    setQuery("");
    onOpenChange(false);
  }

  function goTopic(topicId: string) {
    close();
    navigate(`/topics/${topicId}`);
  }

  function goPlayer(userId: string) {
    close();
    navigate(`/players/${userId}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Recherche globale"
      description="Chercher un sujet ou un utilisateur"
    >
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Chercher un sujet ou un utilisateur…"
        />
        <CommandList>
          <CommandEmpty>
            {isQuery
              ? "Aucun sujet ni utilisateur ne correspond."
              : "Commencez à taper pour rechercher un sujet ou un utilisateur…"}
          </CommandEmpty>

          {isQuery && topics.length > 0 && (
            <CommandGroup heading="Sujets">
              {topics.map((topic) => (
                <CommandItem
                  key={topic.id}
                  value={`topic-${topic.id}`}
                  onSelect={() => goTopic(topic.id)}
                >
                  <TopicIcon topic={topic} size={24} />
                  <span className="truncate">{topic.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Sujet</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {isQuery && players.length > 0 && (
            <CommandGroup heading="Utilisateurs">
              {players.map((player, index) => {
                const level = playerProgress[index]?.data?.level;
                return (
                  <CommandItem
                    key={player.userId}
                    value={`player-${player.userId}`}
                    onSelect={() => goPlayer(player.userId)}
                  >
                    <UserAvatar
                      name={player.displayName}
                      color={personColor(player.userId)}
                      size={24}
                    />
                    <span className="truncate">{player.displayName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {level != null ? `Niveau ${level}` : "Utilisateur"}
                      {player.country
                        ? ` · ${countryFlag(player.country)} ${countryLabel(player.country)}`
                        : ""}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
