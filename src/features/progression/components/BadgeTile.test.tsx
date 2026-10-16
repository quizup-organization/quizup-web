// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { TIER_COLORS, type BadgeItem } from "../domain/progression"
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
  it("verrouillée : libellé, palier et cadenas — sans aucune progression", () => {
    const { container } = render(
      <BadgeTile
        family="VOLUME"
        badge={badge({ progress: 7 })}
        onOpen={vi.fn()}
      />
    )

    expect(screen.getByText("Duelliste")).toBeInTheDocument()
    expect(screen.getByText("Bronze")).toBeInTheDocument()
    expect(screen.getByLabelText("Verrouillé")).toBeInTheDocument()
    // La progression (compteur, pourcentage, barre) n'est plus dans la tuile.
    expect(screen.queryByText("7 sur 10")).toBeNull()
    expect(container.querySelector(".h-1")).toBeNull()
    // Aucune ombre : la tuile est un simple cadre plat.
    expect(container.querySelector("[class*='shadow']")).toBeNull()
  })

  it("acquise : coche verte, fond plein (jamais translucide) et pas de cadenas", () => {
    const { container } = render(
      <BadgeTile
        family="VOLUME"
        badge={badge({ earned: true, progress: 10 })}
        onOpen={vi.fn()}
      />
    )

    expect(screen.getByLabelText("Débloqué")).toBeInTheDocument()
    expect(screen.queryByLabelText("Verrouillé")).toBeNull()
    // Fond **plein** : vert mélangé à la surface de la carte, aucun fond à alpha.
    const tile = container.querySelector("button")
    expect(tile?.className).toContain(
      "bg-[color-mix(in_oklab,var(--success-600)_12%,var(--card))]"
    )
    expect(tile?.className).not.toMatch(/\bbg-[a-z0-9-]*\/\d/)
  })

  it("pose le palier dans **sa** teinte, verrouillé comme acquis", () => {
    const { unmount } = render(
      <BadgeTile
        family="VOLUME"
        badge={badge({ progress: 7 })}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByText("Bronze").style.color).toBe(TIER_COLORS.BRONZE.text)
    unmount()

    render(
      <BadgeTile
        family="VICTORY"
        badge={badge({
          code: "WINNER_DIAMANT",
          tier: "DIAMANT",
          earned: true,
          progress: 50,
          target: 50,
        })}
      />
    )
    expect(screen.getByText("Diamant").style.color).toBe(
      TIER_COLORS.DIAMANT.text
    )
  })

  it("ouvre la fiche au clic", async () => {
    const onOpen = vi.fn()
    const item = badge({ progress: 7 })
    render(<BadgeTile family="VOLUME" badge={item} onOpen={onOpen} />)

    await userEvent.click(screen.getByRole("button"))

    expect(onOpen).toHaveBeenCalledWith(item)
  })

  it("inerte sans `onOpen` (aperçu) : aucune cible interactive", () => {
    render(<BadgeTile family="VOLUME" badge={badge()} />)

    expect(screen.queryByRole("button")).toBeNull()
  })

  it("traduit le code connu et retombe sur le libellé du serveur sinon", () => {
    const { unmount } = render(
      <BadgeTile
        family="EXPLOIT"
        badge={badge({ code: "FIRST_WIN", label: "Première victoire" })}
      />
    )
    expect(screen.getByText("Première victoire")).toBeInTheDocument()
    unmount()

    render(
      <BadgeTile
        family="COLLECTION"
        badge={badge({ code: "NEXT_SEASON_HERO", label: "Héros" })}
      />
    )
    expect(screen.getByText("Héros")).toBeInTheDocument()
  })
})
