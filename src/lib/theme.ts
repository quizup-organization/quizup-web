import { useSyncExternalStore } from "react";

/**
 * Thème de l'application (Clair / Sombre / Système), partagé sans provider.
 * Persisté dans `localStorage` et appliqué via la classe `.dark` sur `<html>`
 * (mêmes variables CSS que le preset shadcn — cf. `index.css`).
 */
export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "quizup-theme";
const MEDIA = "(prefers-color-scheme: dark)";

export const THEME_OPTIONS: { value: Theme; label: string }[] = [
    { value: "light", label: "Clair" },
    { value: "dark", label: "Sombre" },
    { value: "system", label: "Système" },
];

const isTheme = (v: unknown): v is Theme => v === "light" || v === "dark" || v === "system";

function readStored(): Theme {
    if (typeof localStorage === "undefined") return "dark";
    const v = localStorage.getItem(STORAGE_KEY);
    return isTheme(v) ? v : "dark";
}

let current: Theme = readStored();
/* Force le mode sombre indépendamment du thème (ex. pendant un duel / lobby). */
let forcedDark = false;
const listeners = new Set<() => void>();

const prefersDark = () => typeof window !== "undefined" && window.matchMedia(MEDIA).matches;

function apply() {
    if (typeof document === "undefined") return;
    const dark = forcedDark || current === "dark" || (current === "system" && prefersDark());
    document.documentElement.classList.toggle("dark", dark);
}

/**
 * Force (ou non) le thème sombre, sans toucher à la préférence persistée.
 * Utilisé par les écrans de duel pour rester sombres même en thème clair.
 */
export function setForcedDark(forced: boolean) {
    if (forcedDark === forced) return;
    forcedDark = forced;
    apply();
}

function emit() {
    listeners.forEach((l) => l());
}

export function setTheme(next: Theme) {
    current = next;
    try {
        localStorage.setItem(STORAGE_KEY, next);
    } catch {
        /* stockage indisponible : on garde le thème en mémoire */
    }
    apply();
    emit();
}

function subscribe(cb: () => void) {
    listeners.add(cb);
    return () => {
        listeners.delete(cb);
    };
}

/** Thème courant + setter, partagés par tous les composants. */
export function useTheme(): [Theme, (t: Theme) => void] {
    const theme = useSyncExternalStore(
        subscribe,
        () => current,
        () => current,
    );
    return [theme, setTheme];
}

/* Application immédiate (évite le flash) + suivi du thème système. */
if (typeof window !== "undefined") {
    apply();
    window.matchMedia(MEDIA).addEventListener("change", () => {
        if (current === "system") {
            apply();
            emit();
        }
    });
}
