import type { ReactNode } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { cn } from "cn"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  BottomSheet,
  BottomSheetClose,
} from "@/components/arc/bottom-sheet/bottom-sheet"
import { useIsMobile } from "@/shared/hooks/use-mobile"

/**
 * Barre de filtres partagée Sujets / Personnes — composants shadcn natifs.
 * Desktop : bande collante sous la topbar (recherche + chips + selects + facettes).
 * Mobile : une seule ligne `recherche + bouton Filtres` ouvrant le bottom sheet Arc UI
 * (drags/peek, `detents`) ; le contenu du sheet est fourni par `filters` (`FilterSection`).
 */
interface SearchToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  placeholder: string
  leading?: ReactNode
  controls?: ReactNode
  facets?: ReactNode
  /** Contenu du drawer de filtres mobile (sections `FilterSection`). */
  filters?: ReactNode
  activeCount: number
  onClear: () => void
  count: number
  countLabel: string
}

export function SearchToolbar({
  query,
  onQueryChange,
  placeholder,
  leading,
  controls,
  facets,
  filters,
  activeCount,
  onClear,
  count,
  countLabel,
}: SearchToolbarProps) {
  const isMobile = useIsMobile()
  const countLabelFull = `${count} ${countLabel}${count > 1 ? "s" : ""}`

  const searchField = (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          // Entrée replie le clavier mobile (la recherche est déjà live).
          if (event.key === "Enter") event.currentTarget.blur()
        }}
        enterKeyHint="search"
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )

  if (isMobile) {
    return (
      <div className="sticky top-[var(--qu-topbar-offset,0rem)] z-10 border-b bg-background/70 backdrop-blur-2xl transition-[top] duration-[240ms] ease-out supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-3.5 py-2.5">
          <div className="min-w-0 flex-1">{searchField}</div>
          {filters && (
            <BottomSheet
              title="Filtres"
              description={`${countLabelFull} correspondant${count > 1 ? "s" : ""}`}
              detents={[0.55, 0.92]}
              initialDetent={1}
              trigger={
                <button
                  type="button"
                  aria-label={
                    activeCount > 0
                      ? `Filtres (${activeCount} actif${activeCount > 1 ? "s" : ""})`
                      : "Filtres"
                  }
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "relative size-11 shrink-0"
                  )}
                >
                  <SlidersHorizontal className="size-4" />
                  {activeCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-heading text-[10px] font-bold text-primary-foreground">
                      {activeCount}
                    </span>
                  )}
                </button>
              }
              footer={
                <div className="flex gap-2">
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={onClear}
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-11 flex-1 gap-1.5"
                      )}
                    >
                      <X /> Tout effacer
                    </button>
                  )}
                  <BottomSheetClose asChild>
                    <button
                      type="button"
                      className={cn(buttonVariants(), "h-11 flex-1")}
                    >
                      Voir les résultats
                    </button>
                  </BottomSheetClose>
                </div>
              }
            >
              {filters}
            </BottomSheet>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-16 z-10 scroll-mt-16 border-b bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-[300px] max-w-full">{searchField}</div>
          {leading}
          {controls}

          <div className="flex-1" />

          <span className="text-xs text-muted-foreground">
            {countLabelFull}
          </span>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X /> Tout effacer
            </Button>
          )}
        </div>

        {facets && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {facets}
          </div>
        )}
      </div>
    </div>
  )
}
