import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Barre de filtres partagée Sujets / Personnes / Défis — composants shadcn natifs.
 * Sticky pleine largeur (fond opaque edge-to-edge), contenu centré max-w-screen-xl.
 * [SCALE] métadonnées de filtres dérivées des `@Searchable` : à proposer côté services.
 */
interface SearchToolbarProps {
    query: string;
    onQueryChange: (value: string) => void;
    placeholder: string;
    leading?: ReactNode;
    controls?: ReactNode;
    facets?: ReactNode;
    activeCount: number;
    onClear: () => void;
    count: number;
    countLabel: string;
}

export function SearchToolbar({ query, onQueryChange, placeholder, leading, controls, facets, activeCount, onClear, count, countLabel }: SearchToolbarProps) {
    return (
        <div className="sticky top-0 z-10 border-b bg-background">
            <div className="mx-auto w-full max-w-screen-xl px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative w-[300px] max-w-full">
                        <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder={placeholder} className="pl-9" />
                    </div>
                    {leading}
                    {controls}

                    <div className="flex-1" />

                    <span className="text-xs text-muted-foreground">
                        {count} {countLabel}
                        {count > 1 ? "s" : ""}
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
    );
}
