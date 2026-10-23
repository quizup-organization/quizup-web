// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { OnboardingGate } from "./OnboardingGate"

const useMe = vi.hoisted(() => vi.fn())

vi.mock("@/features/shell", () => ({ useMe }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/onboarding" element={<div>onboarding-route</div>} />
        <Route
          path="*"
          element={
            <OnboardingGate>
              <div>application</div>
            </OnboardingGate>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

function me(patch: Record<string, unknown> = {}) {
  return {
    data: {
      onboardingCompleted: false,
      stats: { played: 0 },
      ...patch,
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }
}

beforeEach(() => {
  useMe.mockReset()
})

describe("OnboardingGate", () => {
  it("redirige un nouveau joueur vers la route d'onboarding en conservant la cible", () => {
    useMe.mockReturnValue(me())
    renderAt("/profile?tab=stats")

    expect(screen.getByText("onboarding-route")).toBeInTheDocument()
  })

  it("laisse entrer directement dans une room, même sans onboarding", () => {
    useMe.mockReturnValue(me())
    renderAt("/join/room-1")

    expect(screen.getByText("application")).toBeInTheDocument()
    expect(screen.queryByText("onboarding-route")).not.toBeInTheDocument()
  })

  it("laisse entrer dans le jeu et son résultat", () => {
    useMe.mockReturnValue(me())
    const { unmount } = renderAt("/game/game-1")
    expect(screen.getByText("application")).toBeInTheDocument()
    unmount()

    renderAt("/game/game-1/result")
    expect(screen.getByText("application")).toBeInTheDocument()
  })

  it("ne redirige plus après le flag serveur ou une partie humaine", () => {
    useMe.mockReturnValue(me({ onboardingCompleted: true }))
    const { unmount } = renderAt("/")
    expect(screen.getByText("application")).toBeInTheDocument()
    unmount()

    useMe.mockReturnValue(me({ stats: { played: 1 } }))
    renderAt("/")
    expect(screen.getByText("application")).toBeInTheDocument()
  })
})
