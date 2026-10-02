import { Card } from "@heroui/react";
import { cn } from "cn";
import { UserAvatar } from "@/shared/components/user-avatar";
import type { PlayerCard as PlayerCardView } from "@/features/player/domain/profile";

interface PersonCardProps {
  person: PlayerCardView;
  onOpen: (userId: string) => void;
  /** Sélection (ex. choix d'un adversaire) plutôt que navigation. */
  selected?: boolean;
}

/** Carte de personne horizontale minimaliste — avatar + nom + niveau. */
export function PersonCard({ person, onOpen, selected = false }: PersonCardProps) {
  const name = person.pseudonym ?? "Joueur";
  return (
    <Card
      onClick={() => onOpen(person.userId)}
      className={cn(
        "flex cursor-pointer flex-row items-center gap-3 p-1 transition-[color,box-shadow] hover:ring-foreground/25",
        selected && "ring-2 ring-accent",
      )}
    >
      <UserAvatar
        name={name}
        userId={person.userId}
        avatarOptions={person.avatarOptions ?? undefined}
        size={64}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <Card.Title className="truncate font-heading text-sm">{name}</Card.Title>
        <Card.Description className="truncate text-xs text-muted">
          Niveau {person.level}
          {person.title ? ` · ${person.title}` : ""}
        </Card.Description>
      </div>
    </Card>
  );
}
