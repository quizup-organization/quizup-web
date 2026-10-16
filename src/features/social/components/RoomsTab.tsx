import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DoorOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { useServerClock } from "@/shared/clock/useServerClock"
import {
  nearestDeadline,
  useCountdownTicks,
} from "@/shared/hooks/useCountdownTicks"
import { useSocialPending } from "../hooks/useSocialPending"
import { PendingDuelList } from "./PendingDuelList"

/**
 * Onglet « Salons » : salles ouvertes en attente de joueurs (liste empilée, ouvrir / annuler).
 */
export function RoomsTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { rooms, isLoading } = useSocialPending()
  const { serverNow } = useServerClock()

  const nextDeadline = useMemo(
    () => nearestDeadline(rooms.map((item) => item.expiresAt)),
    [rooms]
  )
  useCountdownTicks({ deadlineAt: nextDeadline, clock: serverNow })

  if (isLoading && rooms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("common.app.loading")}</p>
    )
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={<DoorOpen className="size-6 text-muted-foreground" />}
        title={t("social.rooms.empty")}
        description={t("social.rooms.emptyDescription")}
      >
        <Button variant="outline" onClick={() => void navigate("/topics")}>
          {t("social.rooms.create")}
        </Button>
      </EmptyState>
    )
  }

  return <PendingDuelList items={rooms} />
}
