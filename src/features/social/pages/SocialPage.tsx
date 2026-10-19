import { Navigate, useSearchParams } from "react-router-dom"
import { useUrlParam } from "@/shared/hooks/useUrlParam"
import type { PeopleDirection } from "@/features/player/domain/profile"
import { PeopleDirectory } from "../components/PeopleDirectory"

/**
 * Espace **Social** : annuaire des personnes (abonnements / abonnés). La direction vit dans
 * l'URL (`?tab=following|followers`) et se choisit dans la barre de recherche — plus d'onglets.
 * Les anciens liens de l'onglet « Défis & Salons » sont redirigés vers la page dédiée
 * `/challenges` en conservant leurs filtres (`type`, `sort`, `q`, `challenge`).
 */
export function SocialPage() {
  const [rawTab, setTab] = useUrlParam<string>("tab", "following")
  const [searchParams] = useSearchParams()

  if (rawTab === "challenges" || rawTab === "rooms") {
    const params = new URLSearchParams(searchParams)
    params.delete("tab")
    if (rawTab === "rooms" && !params.has("type")) params.set("type", "room")
    const query = params.toString()
    return (
      <Navigate to={query ? `/challenges?${query}` : "/challenges"} replace />
    )
  }

  const direction: PeopleDirection =
    rawTab === "followers" ? "followers" : "following"

  return <PeopleDirectory direction={direction} onDirectionChange={setTab} />
}
