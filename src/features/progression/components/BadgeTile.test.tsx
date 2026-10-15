// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import type { BadgeItem } from "../domain/progression"
import { BadgeTile } from "./BadgeTile"

function badge(overrides: Partial<BadgeItem> = {}): BadgeItem {
  return {
    code: "DUELIST_BRONZE",
    label: "Duelliste",
    tier: "BRONZE",
    metric: "HUMAN_DUELS",
    target: 10,
    earned: false,
    progress: 0,
    ...overrides,
  }
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("BadgeTile", () => {
  it("badge verrouillé : objectif chiffré et progression vers la cible", () => {
    render(<BadgeTile family="VOLUME" badge={badge({ progress: 7 })} />)

    expect(screen.getByText("Duelliste")).toBeInTheDocument()
    expect(screen.getByText("Bronze · 7 sur 10")).toBeInTheDocument()
  })

  it("acquisition explicite : ce qui reste, l'action à faire et le palier suivant", () => {
    render(
      <BadgeTile
        family="VOLUME"
        badge={badge({ progress: 7 })}
        nextTier={{ tier: "ARGENT", label: "Bretteur" }}
      />
    )

    expect(screen.getByText("Plus que 3")).toBeInTheDocument()
    expect(
      screen.getByText("Joue 3 duel(s) contre des joueurs")
    ).toBeInTheDocument()
    expect(screen.getByText("Prochain : Argent — Bretteur")).toBeInTheDocument()
  })

  it("palier maximal : pas de suite à annoncer", () => {
    render(<BadgeTile family="VOLUME" badge={badge({ tier: "DIAMANT" })} />)

    expect(screen.getByText("Palier maximal atteint")).toBeInTheDocument()
  })

  it("badge acquis : palier et mention « Débloqué », sans barre de progression", () => {
    render(
      <BadgeTile
        family="VOLUME"
        badge={badge({ earned: true, progress: 10 })}
      />
    )

    expect(screen.getByText("Bronze · Débloqué")).toBeInTheDocument()
    expect(screen.queryByText("10 sur 10")).not.toBeInTheDocument()
  })

  it("traduit le code connu du catalogue", () => {
    render(
      <BadgeTile
        family="EXPLOIT"
        badge={badge({ code: "FIRST_WIN", label: "Première victoire" })}
      />
    )

    expect(screen.getByText("Première victoire")).toBeInTheDocument()
  })

  it("retombe sur le libellé du serveur pour un code inconnu", () => {
    render(
      <BadgeTile
        family="COLLECTION"
        badge={badge({ code: "NEXT_SEASON_HERO", label: "Héros" })}
      />
    )

    expect(screen.getByText("Héros")).toBeInTheDocument()
  })
})
