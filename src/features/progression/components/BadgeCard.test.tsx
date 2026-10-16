// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import type { BadgeItem } from "../domain/progression"
import { BadgeCard } from "./BadgeCard"

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

describe("BadgeCard", () => {
  it("replié : médaille, libellé, palier et compteur de progression", () => {
    const { container } = render(
      <BadgeCard family="VOLUME" badge={badge({ progress: 7 })} />
    )

    expect(screen.getByText("Duelliste")).toBeInTheDocument()
    expect(screen.getByText("Bronze · 7 sur 10")).toBeInTheDocument()
    expect(container.querySelector("[aria-expanded='false']")).not.toBeNull()
  })

  it("dépliage : révèle la condition d'obtention et la progression", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <BadgeCard family="VOLUME" badge={badge({ progress: 7 })} />
    )

    expect(container.querySelector("[aria-expanded='false']")).not.toBeNull()
    await user.click(screen.getByRole("button", { expanded: false }))

    expect(container.querySelector("[aria-expanded='true']")).not.toBeNull()
    expect(
      screen.getByText("Joue 3 duel(s) contre des joueurs")
    ).toBeInTheDocument()
    expect(screen.getByText("7 sur 10")).toBeInTheDocument()
    expect(screen.getByText("70 %")).toBeInTheDocument()
  })

  it("badge acquis : mention « Débloqué » et critère atteint, sans barre de progression", () => {
    render(
      <BadgeCard
        family="VOLUME"
        badge={badge({ earned: true, progress: 10 })}
      />
    )

    expect(screen.getByText("Bronze · Débloqué")).toBeInTheDocument()
    expect(
      screen.getByText("Critère atteint : duels contre des joueurs")
    ).toBeInTheDocument()
    expect(screen.queryByText("10 sur 10")).not.toBeInTheDocument()
  })

  it("traduit le code connu du catalogue", () => {
    render(
      <BadgeCard
        family="EXPLOIT"
        badge={badge({ code: "FIRST_WIN", label: "Première victoire" })}
      />
    )

    expect(screen.getByText("Première victoire")).toBeInTheDocument()
  })

  it("retombe sur le libellé du serveur pour un code inconnu", () => {
    render(
      <BadgeCard
        family="COLLECTION"
        badge={badge({ code: "NEXT_SEASON_HERO", label: "Héros" })}
      />
    )

    expect(screen.getByText("Héros")).toBeInTheDocument()
  })
})
