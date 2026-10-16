// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
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
  it("verrouillée : libellé, palier, compteur et barre au aplat du palier", () => {
    const { container } = render(
      <BadgeTile
        family="VOLUME"
        badge={badge({ progress: 7 })}
        onOpen={vi.fn()}
      />
    )

    expect(screen.getByText("Duelliste")).toBeInTheDocument()
    expect(screen.getByText("Bronze")).toBeInTheDocument()
    expect(screen.getByText("7 sur 10")).toBeInTheDocument()
    // Barre de progression à l'aplat du palier (bronze), sans aucun halo.
    const bar = container.querySelector<HTMLElement>(".h-1 [style]")
    expect(bar?.getAttribute("style") ?? "").toMatch(/180, 114, 60|#B4723C/i)
    // Aucune ombre : la tuile est un simple cadre plat.
    expect(container.querySelector("[class*='shadow']")).toBeNull()
  })

  it("acquise : « Débloqué », coche verte et pas de barre de progression", () => {
    const { container } = render(
      <BadgeTile
        family="VOLUME"
        badge={badge({ earned: true, progress: 10 })}
        onOpen={vi.fn()}
      />
    )

    expect(screen.getByText("Débloqué")).toBeInTheDocument()
    expect(screen.getByText("Débloqué").className).toContain("text-success-600")
    expect(container.querySelector(".bg-success-600\\/8")).not.toBeNull()
    // Aucune barre de progression sur un palier acquis.
    expect(container.querySelector(".h-1")).toBeNull()
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
