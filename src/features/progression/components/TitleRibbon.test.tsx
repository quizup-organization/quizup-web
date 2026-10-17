// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RIBBON_INK, RIBBON_TITLE_MAX_WIDTH, RIBBON_TITLE_SIZE } from "../domain/ribbon"
import { TitleRibbon } from "./TitleRibbon"

function ribbon(label: string) {
  const region = screen.getByRole("img", { name: label })
  const art = region.parentElement?.querySelector("img")
  // Le nœud de mesure (libre, jamais comprimé) porte `data-measure` : on lit le nœud visible.
  const text = region.querySelector("text:not([data-measure])")
  return { region, art, text }
}

describe("TitleRibbon", () => {
  it("choisit le ruban métallique du rang et centre le titre dans le bandeau", () => {
    render(<TitleRibbon label="Historien confirmé" rank="OR" />)

    const { region, art, text } = ribbon("Historien confirmé")
    expect(region).toBeInTheDocument()
    // Le visuel du ruban est décoratif : le libellé n'est annoncé qu'une fois (l'overlay).
    expect(art?.getAttribute("src")).toContain("ruban-or")
    expect(art).toHaveAttribute("aria-hidden")
    // Le texte est centré dans le repère de l'asset, sur la ligne du bandeau.
    expect(text).toHaveTextContent("Historien confirmé")
    expect(text).toHaveAttribute("x", "470")
    expect(text).toHaveAttribute("y", "100")
    expect(text).toHaveAttribute("text-anchor", "middle")
    expect(text).toHaveAttribute("fill", RIBBON_INK.OR.fill)
    expect(text).not.toHaveAttribute("textLength")
    expect(region.querySelector("textPath")).toBeNull()
  })

  it("change d'asset et d'encre avec le rang", () => {
    const { rerender } = render(<TitleRibbon label="Novice" rank="FER" />)

    let { art, text } = ribbon("Novice")
    expect(art?.getAttribute("src")).toContain("ruban-fer")
    expect(text).toHaveAttribute("fill", RIBBON_INK.FER.fill)

    rerender(<TitleRibbon label="Novice" rank="DIAMANT" />)

    ;({ art, text } = ribbon("Novice"))
    expect(art?.getAttribute("src")).toContain("ruban-diamant")
    expect(text).toHaveAttribute("fill", RIBBON_INK.DIAMANT.fill)
  })

  it("réduit puis comprime un libellé trop large pour le bandeau", () => {
    render(
      <TitleRibbon
        label="Légende · Les plus grands mystères non résolus"
        rank="DIAMANT"
      />
    )

    const { text } = ribbon(
      "Légende · Les plus grands mystères non résolus"
    )
    expect(Number(text?.getAttribute("font-size"))).toBeLessThan(
      RIBBON_TITLE_SIZE
    )
    // Mesure indisponible en jsdom : l'estimation déclenche la compression de sécurité.
    expect(text).toHaveAttribute("textLength", String(RIBBON_TITLE_MAX_WIDTH))
    expect(text).toHaveAttribute("lengthAdjust", "spacingAndGlyphs")
  })

  it("ne contraint pas un titre court (aucun interlettrage artificiel)", () => {
    render(<TitleRibbon label="Novice" rank="FER" />)

    const { text } = ribbon("Novice")
    expect(Number(text?.getAttribute("font-size"))).toBe(RIBBON_TITLE_SIZE)
    expect(text).not.toHaveAttribute("textLength")
  })
})
