import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * En-tête de section de l'Accueil — titre + action « Tout voir » / « Explorer le catalogue ».
 * En compact, l'action est masquée pour laisser toute la largeur au titre ; elle réapparaît
 * à partir de la tablette.
 */
interface SectionHeaderProps {
  title: string
  actionLabel?: string
  onAction?: () => void
  /** Remplace l'action par défaut (ex. un `<Select>`). */
  children?: ReactNode
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  children,
}: SectionHeaderProps) {
  const { t } = useTranslation()
  const action =
    children ??
    (onAction ? (
      <Button variant="ghost" size="sm" onClick={onAction}>
        {actionLabel ?? t("home.sectionHeader.seeAll")} <ChevronRight />
      </Button>
    ) : null)

  return (
    <div className="mb-3 flex items-center justify-between gap-3 compact:mb-2">
      <h2 className="min-w-0 font-heading text-xl leading-tight font-bold">
        {title}
      </h2>
      {action && (
        <div className="flex shrink-0 items-center compact:hidden">
          {action}
        </div>
      )}
    </div>
  )
}
