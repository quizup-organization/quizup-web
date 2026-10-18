// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"

vi.mock("@/shared/hooks/use-device", () => ({
  useIsTouchLayout: () => true,
}))

import { QuitDuelDialog } from "./QuitDuelDialog"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("QuitDuelDialog", () => {
  it("conserve la hauteur des actions tactiles (pas de flex-1 en colonne)", () => {
    render(<QuitDuelDialog open onOpenChange={vi.fn()} onAbandon={vi.fn()} />)

    const cancel = screen.getByRole("button", { name: "Continuer" })
    const abandon = screen.getByRole("button", { name: "Abandonner" })
    const footer = cancel.parentElement

    expect(footer).toBe(abandon.parentElement)
    expect(footer).toHaveClass("[&>button]:w-full")
    expect(footer).not.toHaveClass("[&>button]:flex-1")
  })
})
