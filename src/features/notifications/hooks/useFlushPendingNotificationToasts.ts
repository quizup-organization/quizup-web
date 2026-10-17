import { useEffect } from "react"
import { usePendingNotificationToastStore } from "../stores/usePendingNotificationToastStore"
import { useNotificationToast } from "./useNotificationToast"

/**
 * Rejoue les toasts mis en attente pendant un écran immersif dès que l'affichage redevient
 * autorisé (écran normal, ou page résultat d'un duel). Le drain est atomique : un toast déjà
 * présenté n'est jamais rejoué.
 */
export function useFlushPendingNotificationToasts(deferToasts: boolean): void {
  const showNotificationToast = useNotificationToast()
  const drain = usePendingNotificationToastStore((state) => state.drain)
  const clear = usePendingNotificationToastStore((state) => state.clear)

  // La file est éphémère et liée à la session : on la purge avec la coquille (logout).
  useEffect(() => () => clear(), [clear])

  useEffect(() => {
    if (deferToasts) return
    for (const notification of drain()) {
      showNotificationToast(notification)
    }
  }, [deferToasts, drain, showNotificationToast])
}
