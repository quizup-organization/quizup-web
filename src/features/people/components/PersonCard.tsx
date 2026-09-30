import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/shared/components/user-avatar";
import type { PlayerCard as PlayerCardView } from "@/features/player/domain/profile";

/** Carte de personne verticale minimaliste — avatar 64 px + nom, aucune action. */
export function PersonCard({
  person,
  onOpen,
}: {
  person: PlayerCardView;
  onOpen: (userId: string) => void;
}) {
  const name = person.pseudonym ?? "Joueur";
  return (
    <Card
      size="sm"
      onClick={() => onOpen(person.userId)}
      className="cursor-pointer transition-[color,box-shadow] hover:ring-foreground/25"
    >
      <CardHeader className="items-center gap-2.5 text-center">
        <UserAvatar
          name={name}
          userId={person.userId}
          avatarOptions={person.avatarOptions ?? undefined}
          size={64}
        />
        <CardTitle className="truncate font-heading text-[15px]">
          {name}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
