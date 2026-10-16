// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TitleRibbon } from "./TitleRibbon"

describe("TitleRibbon", () => {
  it("affiche le libellé du titre porté sur un ruban doré à pointes", () => {
    render(<TitleRibbon label="Historien confirmé" />)

    const label = screen.getByText("Historien confirmé")
    expect(label).toBeInTheDocument()
    // Bande dorée (dégradé) à pointes latérales (clip-path), encre foncée.
    const style = label.getAttribute("style") ?? ""
    expect(style).toContain("linear-gradient")
    expect(style).toContain("polygon")
    expect(style).toContain("color")
  })
})
