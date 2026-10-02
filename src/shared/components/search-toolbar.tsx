import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button, SearchField } from "@heroui/react";

/**
 * Barre de filtres partagée Sujets / Personnes / Défis — composants HeroUI natifs.
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
        <div className="border-b border-separator bg-background">
            <div className="mx-auto w-full max-w-screen-xl px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-2.5">
                    <SearchField
                        aria-label={placeholder}
                        value={query}
                        onChange={onQueryChange}
                        className="w-[300px] max-w-full"
                    >
                        <SearchField.Group>
                            <SearchField.SearchIcon />
                            <SearchField.Input placeholder={placeholder} />
                            <SearchField.ClearButton />
                        </SearchField.Group>
                    </SearchField>
                    {leading}
                    {controls}

                    <div className="flex-1" />

                    <span className="text-xs text-muted">
                        {count} {countLabel}
                        {count > 1 ? "s" : ""}
                    </span>
                    {activeCount > 0 && (
                        <Button variant="ghost" size="sm" onPress={onClear}>
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
