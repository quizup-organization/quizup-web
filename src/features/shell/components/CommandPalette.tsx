import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Description,
  Header,
  Kbd,
  Label,
  ListBox,
  Modal,
  ScrollShadow,
  SearchField,
} from "@heroui/react";
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

  function go(key: string) {
    if (key.startsWith("topic-")) {
      close();
      navigate(`/topics/${key.slice("topic-".length)}`);
    } else if (key.startsWith("player-")) {
      close();
      navigate(`/players/${key.slice("player-".length)}`);
    }
  }

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      variant="blur"
    >
      <Modal.Container placement="top" size="lg" className="mt-[8vh]">
        <Modal.Dialog className="p-0" aria-label="Recherche globale">
          <div className="border-b border-separator p-3">
            <SearchField
              aria-label="Chercher un sujet ou un utilisateur"
              value={query}
              onChange={setQuery}
              variant="secondary"
              autoFocus
              fullWidth
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Chercher un sujet ou un utilisateur…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <ScrollShadow orientation="vertical" className="max-h-[55vh] min-h-[136px] p-2">
            {isQuery && suggestions.length > 0 ? (
              <ListBox
                aria-label="Suggestions"
                selectionMode="none"
                onAction={(key) => go(String(key))}
              >
                {topics.length > 0 && (
                  <ListBox.Section>
                    <Header>Sujets</Header>
                    {topics.map((topic) => (
                      <ListBox.Item
                        key={`topic-${topic.id}`}
                        id={`topic-${topic.id}`}
                        textValue={topic.label ?? "Sujet"}
                      >
                        <TopicIcon topic={topic} size={24} />
                        <Label className="truncate">{topic.label ?? "Sujet"}</Label>
                        <Description className="ms-auto text-xs">
                          {topic.subtitle ?? "Sujet"}
                        </Description>
                      </ListBox.Item>
                    ))}
                  </ListBox.Section>
                )}
                {players.length > 0 && (
                  <ListBox.Section>
                    <Header>Utilisateurs</Header>
                    {players.map((player) => (
                      <ListBox.Item
                        key={`player-${player.id}`}
                        id={`player-${player.id}`}
                        textValue={player.label ?? "Joueur"}
                      >
                        <UserAvatar
                          name={player.label ?? "Joueur"}
                          userId={player.id}
                          avatarOptions={player.avatarOptions ?? undefined}
                          size={24}
                        />
                        <Label className="truncate">{player.label ?? "Joueur"}</Label>
                        <Description className="ms-auto text-xs">
                          {player.subtitle ?? "Utilisateur"}
                        </Description>
                      </ListBox.Item>
                    ))}
                  </ListBox.Section>
                )}
              </ListBox>
            ) : (
              <p className="px-3 py-10 text-center text-sm text-muted">
                {isQuery
                  ? "Aucun sujet ni utilisateur ne correspond."
                  : "Commencez à taper pour rechercher un sujet ou un utilisateur…"}
              </p>
            )}
          </ScrollShadow>
          <div className="flex items-center justify-end gap-3 border-t border-separator px-3 py-2 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <Kbd variant="light">
                <Kbd.Abbr keyValue="up" />
                <Kbd.Abbr keyValue="down" />
              </Kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd variant="light">
                <Kbd.Abbr keyValue="enter" />
              </Kbd>
              ouvrir
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd variant="light">
                <Kbd.Abbr keyValue="escape" />
              </Kbd>
              fermer
            </span>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
