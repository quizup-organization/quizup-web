import { useEffect, useState } from "react";
import { BREAKPOINTS } from "../theme/tokens";

/** Debounce générique — 250 ms, calé sur la latence cible de l'endpoint de recherche. */
export function useDebounced<T>(value: T, delay = 250): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const to = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(to);
    }, [value, delay]);
    return debounced;
}

export type Breakpoint = "mobile" | "tablet" | "desktop";

function readBreakpoint(width: number): Breakpoint {
    if (width >= BREAKPOINTS.desktop) return "desktop";
    if (width >= BREAKPOINTS.tablet) return "tablet";
    return "mobile";
}

/**
 * Breakpoint courant.
 * Les styles de la maquette sont inline : impossible d'y utiliser des media queries,
 * donc le responsive se pilote en JS. À l'intégration, remplacer par les variantes
 * Tailwind (`sm:`, `md:`, `lg:`) ou les hooks de quizup-mobile.
 */
export function useBreakpoint(): Breakpoint {
    const get = () => (typeof window === "undefined" ? "desktop" : readBreakpoint(window.innerWidth));
    const [bp, setBp] = useState<Breakpoint>(get);

    useEffect(() => {
        const onResize = () => setBp(get());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return bp;
}

/** Helpers dérivés pour lisibilité dans les composants. */
export function useIsMobile(): boolean {
    return useBreakpoint() === "mobile";
}
