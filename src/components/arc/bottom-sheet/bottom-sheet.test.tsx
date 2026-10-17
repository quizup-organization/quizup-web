// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import "@/lib/i18n"
import { BottomSheet } from "./bottom-sheet"

describe("BottomSheet", () => {
  it("applique le layer et suspend la modalité", () => {
    render(
      <BottomSheet open title="Feuille de test" layer={60} suspended>
        <p>Contenu</p>
      </BottomSheet>
    )

    const dialog = screen.getByRole("dialog", { name: "Feuille de test" })
    expect(dialog.style.zIndex).toBe("61")
    expect(dialog.getAttribute("aria-modal")).not.toBe("true")
  })
})
