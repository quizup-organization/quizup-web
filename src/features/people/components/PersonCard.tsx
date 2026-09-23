import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/shared/components/user-avatar";

export interface Person {
  userId: string;
  displayName: string;
  avatarOptions?: string;
  /** Renseigné uniquement lorsque le tri par niveau est demandé. */
  level?: number;
}

/** Carte de personne minimaliste — avatar + nom, aucune action (le suivi se fait sur la fiche). */
export function PersonCard({
  person,
  onOpen,
}: {
  person: Person;
  onOpen: (userId: string) => void;
}) {
  return (
    <Card
      size="sm"
      onClick={() => onOpen(person.userId)}
      className="cursor-pointer transition-[color,box-shadow] hover:ring-foreground/25"
    >
      <CardHeader className="items-center">
        <div className="flex min-w-0 items-center gap-2.5">
          <UserAvatar
            name={person.displayName}
            userId={person.userId}
            avatarOptions={person.avatarOptions}
            size={36}
          />
          <CardTitle className="truncate font-heading text-[15px]">
            {person.displayName}
          </CardTitle>
        </div>
      </CardHeader>
    </Card>
  );
}
