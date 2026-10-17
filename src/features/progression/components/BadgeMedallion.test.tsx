// @vitest-environment jsdom
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { BADGE_PICTO_INK } from "../domain/badge-medal"
import type { BadgeTier } from "../domain/progression"
import { BadgeMedallion } from "./BadgeMedallion"

describe("BadgeMedallion", () => {
  it.each([
    ["FER", "badge-fer"],
    ["BRONZE", "badge-bronze"],
    ["ARGENT", "badge-argent"],
    ["OR", "badge-or"],
    ["PLATINE", "badge-platine"],
    ["EMERAUDE", "badge-emeraude"],
    ["DIAMANT", "badge-diamant"],
  ] as const)("choisit le sceau métallique du palier %s", (tier, file) => {
    const { container } = render(<BadgeMedallion family="VOLUME" tier={tier} />)

    // Le visuel est décoratif : le libellé est porté par la tuile ou la modale.
    expect(container.querySelector("img")?.getAttribute("src")).toContain(file)
    expect(container.firstElementChild).toHaveAttribute("aria-hidden")
  })

  it("retombe sur le bronze pour un palier inconnu", () => {
    const { container } = render(
      <BadgeMedallion family="VOLUME" tier={"MYTHRIL" as BadgeTier} />
    )

    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "badge-bronze"
    )
  })

  it("désature le métal quand le badge est verrouillé", () => {
    const { container } = render(
      <BadgeMedallion family="VOLUME" tier="OR" locked />
    )

    const image = container.querySelector("img")
    expect(image?.className).toContain("grayscale")
    expect(image?.className).toContain("opacity-60")
  })

  it("pose l'emblème de la famille au centre, dans l'encre du palier", () => {
    const { container } = render(
      <BadgeMedallion family="VICTORY" tier="DIAMANT" />
    )

    expect(container.querySelector("svg.lucide")).toHaveStyle({
      color: BADGE_PICTO_INK.DIAMANT,
    })
  })
})
