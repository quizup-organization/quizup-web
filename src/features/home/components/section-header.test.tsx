// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { SectionHeader } from "./section-header"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("SectionHeader", () => {
  it("masque l'action en compact tout en la gardant en tablette/desktop", () => {
    render(
      <SectionHeader
        title="Les plus joués en ce moment"
        actionLabel="Explorer le catalogue"
        onAction={vi.fn()}
      />
    )

    const action = screen.getByRole("button", {
      name: /Explorer le catalogue/,
    })
    expect(action.parentElement).toHaveClass("compact:hidden")
  })
})
