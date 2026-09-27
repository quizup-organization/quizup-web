import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useSuggestions } from "../hooks/useSuggestions";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Recherche globale (⌘K) — Sujets + Utilisateurs, composée par `GET /api/suggestions`. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  const isQuery = debounced.trim().length >= 2;
  const suggestionsQuery = useSuggestions(debounced, open);
  const suggestions = suggestionsQuery.data ?? [];
  const topics = suggestions.filter((suggestion) => suggestion.type === "TOPIC");
  const players = suggestions.filter((suggestion) => suggestion.type === "PLAYER");

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
                  <span className="truncate">{topic.label ?? "Sujet"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {topic.subtitle ?? "Sujet"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {isQuery && players.length > 0 && (
            <CommandGroup heading="Utilisateurs">
              {players.map((player) => (
                <CommandItem
                  key={player.id}
                  value={`player-${player.id}`}
                  onSelect={() => goPlayer(player.id)}
                >
                  <UserAvatar
                    name={player.label ?? "Joueur"}
                    userId={player.id}
                    avatarOptions={player.avatarOptions ?? undefined}
                    size={24}
                  />
                  <span className="truncate">{player.label ?? "Joueur"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {player.subtitle ?? "Utilisateur"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
