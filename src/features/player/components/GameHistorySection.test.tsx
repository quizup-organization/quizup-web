// @vitest-environment jsdom
import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { useGameHistory } from "../hooks/usePlayer"
import { GameHistorySection } from "./GameHistorySection"

vi.mock("../hooks/usePlayer", () => ({
  useGameHistory: vi.fn(),
}))

vi.mock("@/features/shell", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}))

// Barre en mode desktop : la puce « Contre moi » est directement accessible.
vi.mock("@/shared/hooks/use-device", () => ({
  useDevice: () => "desktop",
  useIsTouchLayout: () => false,
}))

const history = {
  items: [],
  total: 0,
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
  refetch: vi.fn(),
}

function renderSection() {
  return render(
    <MemoryRouter initialEntries={["/players/player-1?tab=parties"]}>
      <GameHistorySection
        userId="player-1"
        opponentId="me"
        empty={<p>aucune partie</p>}
      />
    </MemoryRouter>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  vi.mocked(useGameHistory).mockReset()
  vi.mocked(useGameHistory).mockReturnValue(history)
})

describe("GameHistorySection — filtre « Contre moi »", () => {
  it("applique l'adversaire par défaut puis permet de le retirer", async () => {
    renderSection()

    expect(useGameHistory).toHaveBeenLastCalledWith(
      "player-1",
      expect.objectContaining({ opponentId: "me" })
    )

    await userEvent.click(screen.getByRole("button", { name: "Contre moi" }))

    expect(useGameHistory).toHaveBeenLastCalledWith(
      "player-1",
      expect.objectContaining({ opponentId: undefined })
    )
    // Toutes les parties du joueur : l'état vide de l'écran redevient visible.
    expect(screen.getByText("aucune partie")).toBeInTheDocument()
  })
})
