import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TopicIcon } from "@/shared/components/topic-icon";
import { ThemePickerDialog } from "../components/ThemePickerDialog";
import { useCreateLobby, useMyLobbies } from "../hooks/useLobbies";

/**
 * Mes salons ouverts (filet de reprise si l'onglet a été fermé sans « Quitter »)
 * et création rapide d'un salon privé partageable.
 */
export function LobbiesPage() {
  const navigate = useNavigate();
  const lobbies = useMyLobbies();
  const create = useCreateLobby();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-extrabold tracking-tight">Salons</h1>
          <p className="text-[13px] text-muted-foreground">
            Tes salons ouverts et la création d'un salon à partager.
          </p>
        </div>
        <Button onClick={() => setPickerOpen(true)} disabled={create.isPending}>
          <Plus size={16} /> Nouveau salon
        </Button>
      </div>

      {lobbies.isLoading && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Chargement…
        </div>
      )}

      {!lobbies.isLoading && (lobbies.data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Swords className="text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Aucun salon ouvert. Crée un salon, défie le monde, ou lance un duel contre un bot
              depuis un sujet.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {(lobbies.data ?? []).map((lobby) => (
          <Card key={lobby.lobbyId} size="sm" className="gap-0 py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <TopicIcon topic={lobby.topic} size={38} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{lobby.topic.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  Salon privé · partage le lien
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(`/lobbies/${lobby.lobbyId}`)}>
                Rouvrir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ThemePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Créer un salon"
        sub="Choisis un thème : tu obtiendras un lien à partager."
        onSelect={(topicId) => {
          setPickerOpen(false);
          create.mutate(topicId);
        }}
      />
    </div>
  );
}
