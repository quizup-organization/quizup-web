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
import { TopicIcon } from "@/components/topic-icon";
import { UserAvatar } from "@/components/user-avatar";
import { queryKeys } from "@/lib/query-keys";
import { topicsService, toTopicView } from "@/lib/services/topics";
import { profilesService } from "@/lib/services/profiles";
import { personColor } from "@/features/people/lib/person-color";
import { countryFlag, countryLabel } from "@/shared/utils/country";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useUiStore } from "../stores/useUiStore";
import { useTopicSuggestions } from "../hooks/useTopicSuggestions";
import { useProfileSuggestions } from "../hooks/useProfileSuggestions";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Recherche globale (⌘K) — Sujets + Joueurs + « Repris récemment ». */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);
  const recentTopicIds = useUiStore((s) => s.recentTopicIds);

  const isQuery = debounced.trim().length >= 2;
  const topicsQuery = useTopicSuggestions(debounced, open);
  const playersQuery = useProfileSuggestions(debounced, open);

  const recentQueries = useQueries({
    queries: (open && !isQuery ? recentTopicIds : []).map((topicId) => ({
      queryKey: queryKeys.topics.detail(topicId),
      queryFn: () => topicsService.getById(topicId),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const topics = (topicsQuery.data ?? []).map(toTopicView);
  const players = playersQuery.data ?? [];
  const recentTopics = recentQueries
    .map((q) => q.data)
    .filter((d): d is NonNullable<typeof d> => !!d)
    .map(toTopicView);

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
      description="Chercher un sujet ou un joueur"
    >
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Chercher un sujet ou un joueur…"
        />
        <CommandList>
          <CommandEmpty>Aucun sujet ni joueur ne correspond.</CommandEmpty>

          {!isQuery && recentTopics.length > 0 && (
            <CommandGroup heading="Repris récemment">
              {recentTopics.map((topic) => (
                <CommandItem
                  key={topic.id}
                  value={topic.id}
                  onSelect={() => goTopic(topic.id)}
                >
                  <TopicIcon topic={topic} size={24} />
                  <span className="truncate">{topic.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Sujet</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

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
            <CommandGroup heading="Joueurs">
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
                      {level != null ? `Niveau ${level}` : "Joueur"}
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
