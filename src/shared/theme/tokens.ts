/**
 * Pointeurs vers les variables CSS.
 * Utilisés dans les `style={{}}` de la maquette. À l'intégration shadcn, ces styles
 * inline deviennent des classes Tailwind (`bg-primary`, `text-muted-foreground`, …)
 * qui pointent exactement sur les mêmes variables : rien à re-mapper.
 */
export const TOKEN = {
    bg: "var(--background)",
    fg: "var(--foreground)",
    card: "var(--card)",
    popover: "var(--popover)",
    primary: "var(--primary)",
    primaryFg: "var(--primary-foreground)",
    secondary: "var(--secondary)",
    muted: "var(--muted)",
    mutedFg: "var(--muted-foreground)",
    accent: "var(--accent)",
    destructive: "var(--destructive)",
    border: "var(--border)",
    ring: "var(--ring)",
    sidebar: "var(--sidebar)",
    sidebarBorder: "var(--sidebar-border)",
    sidebarAccent: "var(--sidebar-accent)",
    duelBg: "var(--duel-bg)",
    duelSurface: "var(--duel-surface)",
    duelSurfaceFg: "var(--duel-surface-foreground)",
    duelSurfaceMuted: "var(--duel-surface-muted)",
    duelSurfaceMutedFg: "var(--duel-surface-muted-foreground)",
    correct: "var(--duel-correct)",
    correctAccent: "var(--duel-correct-accent)",
    correctFg: "var(--duel-correct-foreground)",
    wrong: "var(--duel-wrong)",
    wrongAccent: "var(--duel-wrong-accent)",
    wrongFg: "var(--duel-wrong-foreground)",
    gauge: "var(--duel-gauge)",
    gaugeTrack: "var(--duel-gauge-track)",
    score: "var(--duel-score)",
    timer: "var(--duel-timer)",
    timerUrgent: "var(--duel-timer-urgent)",
    fontSans: "var(--font-sans)",
    fontDisplay: "var(--font-display)",
} as const;

/** Rayons dérivés de --radius, comme le fait shadcn. */
export const RADIUS = {
    sm: "calc(var(--radius) - 4px)",
    md: "calc(var(--radius) - 2px)",
    lg: "var(--radius)",
    xl: "calc(var(--radius) + 4px)",
} as const;

/** Voile translucide à partir d'une couleur quelconque (hex de sujet ou variable CSS). */
export const veil = (color: string, pct: number) =>
    `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** Breakpoints partagés (maquette → web Tailwind / mobile). */
export const BREAKPOINTS = {
    mobile: 0,
    tablet: 640,
    desktop: 1024,
} as const;
