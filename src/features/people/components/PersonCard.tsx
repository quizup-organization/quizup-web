import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/shared/components/user-avatar";
import type { PlayerCard as PlayerCardView } from "@/features/player/domain/profile";

/** Carte de personne minimaliste — avatar + nom, aucune action (le suivi se fait sur la fiche). */
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
      <CardHeader className="items-center">
        <div className="flex min-w-0 items-center gap-2.5">
          <UserAvatar
            name={name}
            userId={person.userId}
            avatarOptions={person.avatarOptions ?? undefined}
            size={36}
          />
          <CardTitle className="truncate font-heading text-[15px]">
            {name}
          </CardTitle>
        </div>
      </CardHeader>
    </Card>
  );
}
