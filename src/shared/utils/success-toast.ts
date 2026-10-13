import { toast, type ExternalToast } from "sonner"
import { playSuccessChime } from "@/shared/audio"

/**
 * Confirmation de succès standard : joue le « ding » discret (best-effort, respecte le réglage
 * « Sons ») puis affiche le toast sonner. À privilégier pour toute action enregistrée.
 */
export function showSuccessToast(
  message: string,
  options?: ExternalToast
): void {
  playSuccessChime()
  toast.success(message, options)
}
