import type { Rank } from "./progression"

/** Paliers Elo : une seule échelle, alignée sur les métaux des badges. */
export const ELO_TIERS: readonly { rank: Rank; min: number }[] = [
  { rank: "FER", min: 0 },
  { rank: "BRONZE", min: 400 },
  { rank: "ARGENT", min: 600 },
  { rank: "OR", min: 800 },
  { rank: "PLATINE", min: 1000 },
  { rank: "EMERAUDE", min: 1200 },
  { rank: "DIAMANT", min: 1400 },
]

export const ELO_INITIAL = 200
export const ELO_PROVISIONAL_GAMES = 10

/** Palier courant pour un Elo donné. */
export function eloTier(rating: number): Rank {
  let tier: Rank = "FER"
  for (const entry of ELO_TIERS) {
    if (rating >= entry.min) tier = entry.rank
  }
  return tier
}

/** Palier suivant, `null` au sommet. */
export function nextEloTier(rating: number): { rank: Rank; min: number } | null {
  return ELO_TIERS.find((entry) => entry.min > rating) ?? null
}

/** Progression vers le palier suivant (0–100). */
export function eloProgressPercent(rating: number): number {
  const current = eloTier(rating)
  const next = nextEloTier(rating)
  if (!next) return 100
  const currentMin = ELO_TIERS.find((entry) => entry.rank === current)?.min ?? 0
  const span = next.min - currentMin
  if (span <= 0) return 100
  return Math.max(0, Math.min(100, Math.round(((rating - currentMin) * 100) / span)))
}
