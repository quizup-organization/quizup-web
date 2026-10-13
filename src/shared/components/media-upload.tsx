import { useTranslation } from "react-i18next"
import { ImagePlus, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileDropzone,
  type FileDropzoneLabels,
  type FileDropzoneUpload,
} from "@/components/arc/file-dropzone/file-dropzone"
import { useUploadMedia } from "@/features/media"
import { cn } from "@/lib/utils"
import type { ApiError } from "@/shared/types/api"

interface MediaUploadProps {
  /** URL courante de l'image (`null` = aucune). */
  value: string | null
  onChange: (url: string | null) => void
  /** Ratio de l'aperçu (classe Tailwind), ex. `aspect-video` (bannière) ou `aspect-square`. */
  aspectClassName?: string
  disabled?: boolean
  /** Dimension maximale du pré-redimensionnement client (px). */
  maxDimension?: number
  /** Afficher le repli « coller une URL » (désactivé quand la sauvegarde est immédiate). */
  allowUrlInput?: boolean
}

/** Limite serveur (`POST /api/media` : JPEG/PNG ≤ 5 Mo) — refusée avant l'envoi. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Réduit l'image côté client (canvas) pour alléger l'envoi ; le serveur normalise ensuite. */
async function prepareFile(file: File, maxDimension: number): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file
  }
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    )
    if (scale >= 1 && file.size <= 1_500_000) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext("2d")
    if (!context) {
      bitmap.close()
      return file
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const keepAlpha = file.type !== "image/jpeg"
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, keepAlpha ? "image/png" : "image/jpeg", 0.85)
    )
    if (!blob) {
      return file
    }
    const extension = keepAlpha ? ".png" : ".jpg"
    const name = file.name.replace(/\.[^.]+$/, "") + extension
    return new File([blob], name, { type: blob.type })
  } catch {
    // Format non décodable par le navigateur (ex. HEIC) : le serveur tranche avec un message clair.
    return file
  }
}

/**
 * Champ d'image réutilisable (couverture de sujet, bannière, illustration de question) :
 * **zone de dépôt Arc UI** (`FileDropzone` : glisser-déposer, sélection, progression, réessai,
 * collage) branchée sur le téléversement multipart du BFF/MinIO, avec aperçu,
 * pré-redimensionnement client, suppression et repli « coller une URL ».
 */
export function MediaUpload({
  value,
  onChange,
  aspectClassName = "aspect-video",
  disabled = false,
  maxDimension = 1600,
  allowUrlInput = true,
}: MediaUploadProps) {
  const { t } = useTranslation()
  const upload = useUploadMedia()

  const uploading = upload.isPending

  const messageFor = (cause: Error): string => {
    const apiError = cause as ApiError
    const type = apiError.type ?? ""
    if (apiError.statusCode === 413 || type.endsWith(":tooLarge")) {
      return t("shared.media.errors.tooLarge")
    }
    if (apiError.statusCode === 429 || type.endsWith(":quotaExceeded")) {
      return t("shared.media.errors.quota")
    }
    if (apiError.statusCode === 503 || type.endsWith(":storageUnavailable")) {
      return t("shared.media.errors.storage")
    }
    if (type.endsWith(":unsupportedFormat")) {
      return t("shared.media.errors.unsupported")
    }
    if (apiError.statusCode === 400 || type.endsWith(":invalidImage")) {
      return t("shared.media.errors.invalid")
    }
    return t("shared.media.errors.failed")
  }

  // Localisation du composant vendored (défauts anglais du registry).
  const dropzoneLabels: Partial<FileDropzoneLabels> = {
    uploading: t("shared.media.dropzone.uploading"),
    uploaded: t("shared.media.dropzone.uploaded"),
    failed: t("shared.media.dropzone.failed"),
    retry: t("shared.media.dropzone.retry"),
    remove: t("shared.media.dropzone.remove"),
    list: t("shared.media.dropzone.list"),
    fallbackError: t("shared.media.errors.failed"),
    rejectedSingle: (name) =>
      t("shared.media.dropzone.rejectedSingle", { name }),
    rejectedSome: t("shared.media.dropzone.rejectedSome"),
    overflow: () => t("shared.media.dropzone.overflow"),
    tooLarge: () => t("shared.media.errors.tooLarge"),
    announceAdded: (count) =>
      t("shared.media.dropzone.announceAdded", { count }),
    announceUploaded: (name) =>
      t("shared.media.dropzone.announceUploaded", { name }),
    announceFailed: (name, reason) =>
      t("shared.media.dropzone.announceFailed", { name, reason }),
    announceRemoved: (name) =>
      t("shared.media.dropzone.announceRemoved", { name }),
    announceRetrying: (name) =>
      t("shared.media.dropzone.announceRetrying", { name }),
    ariaUploading: (name) => t("shared.media.dropzone.ariaUploading", { name }),
    ariaRetry: (name) => t("shared.media.dropzone.ariaRetry", { name }),
    ariaRemove: (name) => t("shared.media.dropzone.ariaRemove", { name }),
  }

  const handleUpload: FileDropzoneUpload = async (item, { signal }) => {
    if (!item.file) return
    try {
      const prepared = await prepareFile(item.file, maxDimension)
      if (signal.aborted) return
      const media = await upload.mutateAsync(prepared)
      onChange(media.url)
    } catch (cause) {
      // La raison s'affiche dans la ligne (échec + réessai gérés par la dropzone).
      throw new Error(messageFor(cause as Error), { cause })
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border bg-muted/30",
          aspectClassName
        )}
      >
        {value ? (
          <img
            src={value}
            alt={t("shared.media.previewAlt")}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <ImagePlus className="size-6" aria-hidden />
          </div>
        )}
        {uploading ? (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : null}
      </div>

      <div className={cn(disabled && "pointer-events-none opacity-60")}>
        <FileDropzone
          accept="image/jpeg,image/png"
          multiple={false}
          maxFiles={1}
          maxSize={MAX_IMAGE_BYTES}
          label={value ? t("shared.media.change") : t("shared.media.upload")}
          description={t("shared.media.dropzone.description")}
          dropLabel={t("shared.media.dropzone.drop")}
          note={t("shared.media.hint")}
          labels={dropzoneLabels}
          onUpload={handleUpload}
        />
      </div>

      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => onChange(null)}
        >
          <X className="size-4" aria-hidden />
          {t("shared.media.remove")}
        </Button>
      ) : null}

      {allowUrlInput ? (
        <Input
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value.trim() ? event.target.value : null)
          }
          placeholder={t("shared.media.urlPlaceholder")}
          aria-label={t("shared.media.urlLabel")}
          disabled={disabled || uploading}
        />
      ) : null}
    </div>
  )
}
