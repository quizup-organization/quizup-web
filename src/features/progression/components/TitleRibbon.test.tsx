// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RIBBON_TITLE_MAX_WIDTH, RIBBON_TITLE_SIZE } from "../domain/ribbon"
import { TitleRibbon } from "./TitleRibbon"

function ribbon(label: string) {
  const region = screen.getByRole("img", { name: label })
  const art = region.parentElement?.querySelector("img")
  const path = region.querySelector("textPath")
  // Le nœud de mesure (libre, jamais comprimé) porte `data-measure` : on lit le nœud visible.
  const text = region.querySelector("text:not([data-measure])")
  return { region, art, text, path }
}

describe("TitleRibbon", () => {
  it("insère le titre sur la courbe du ruban doré (asset dédié, textPath)", () => {
    render(<TitleRibbon label="Historien confirmé" />)

    const { region, art, path } = ribbon("Historien confirmé")
    expect(region).toBeInTheDocument()
    // Le visuel du ruban est décoratif : le libellé n'est annoncé qu'une fois (l'overlay).
    expect(art?.getAttribute("src")).toContain("ruban")
    expect(art).toHaveAttribute("aria-hidden")
    // Le texte suit la courbe médiane, centré, sans déformation quand il tient.
    expect(path).toHaveTextContent("Historien confirmé")
    expect(path).toHaveAttribute("startOffset", "50%")
    expect(path).toHaveAttribute("text-anchor", "middle")
    expect(path?.getAttribute("href")).toMatch(/^#/)
    expect(path).not.toHaveAttribute("textLength")
    expect(region.querySelector("path")).toHaveAttribute(
      "d",
      expect.stringContaining("Q")
    )
  })

  it("réduit puis comprime un libellé trop large pour le bandeau", () => {
    render(
      <TitleRibbon label="Légende · Les plus grands mystères non résolus" />
    )

    const { text, path } = ribbon(
      "Légende · Les plus grands mystères non résolus"
    )
    expect(Number(text?.getAttribute("font-size"))).toBeLessThan(
      RIBBON_TITLE_SIZE
    )
    // Mesure indisponible en jsdom : l'estimation déclenche la compression de sécurité.
    expect(path).toHaveAttribute("textLength", String(RIBBON_TITLE_MAX_WIDTH))
    expect(path).toHaveAttribute("lengthAdjust", "spacingAndGlyphs")
  })

  it("ne contraint pas un titre court (aucun interlettrage artificiel)", () => {
    render(<TitleRibbon label="Novice" />)

    const { text, path } = ribbon("Novice")
    expect(Number(text?.getAttribute("font-size"))).toBe(RIBBON_TITLE_SIZE)
    expect(path).not.toHaveAttribute("textLength")
  })
})
