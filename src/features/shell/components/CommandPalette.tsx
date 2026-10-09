import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { usePreloadImages } from "@/shared/hooks/usePreloadImages";
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

  // Visuels des suggestions de sujets préchargés (navigation instantanée depuis ⌘K).
  const suggestionImageUrls = useMemo(
    () =>
      (suggestionsQuery.data ?? [])
        .filter((suggestion) => suggestion.type === "TOPIC")
        .map((suggestion) => suggestion.imageUrl),
    [suggestionsQuery.data],
  );
  usePreloadImages(suggestionImageUrls, { limit: 5, priority: "low" });

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
      showCloseButton={false}
    >
      <Command shouldFilter={false}>
        {/* Compact : bandeau dédié qui porte la sortie de la recherche plein écran. */}
        <div className="hidden items-center justify-between gap-2 border-b px-(--page-gutter-x) py-2 compact:flex">
          <span className="px-1.5 font-heading text-sm font-bold">Recherche</span>
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                aria-label="Fermer la recherche"
              />
            }
          >
            <X className="size-5" />
          </DialogClose>
        </div>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          enterKeyHint="search"
          onKeyDown={(event) => {
            // Sans suggestion à sélectionner, Entrée replie le clavier (cmdk garde la main sinon).
            if (event.key === "Enter" && suggestions.length === 0) {
              event.currentTarget.blur();
            }
          }}
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
