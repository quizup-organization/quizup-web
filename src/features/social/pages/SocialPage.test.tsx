// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { usePeople } from "@/features/follows"
import { SocialPage } from "./SocialPage"

vi.mock("@/features/shell", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  useMe: () => ({ data: { followingCount: 3, followersCount: 1 } }),
}))
vi.mock("@/features/follows", () => ({
  PersonTile: () => null,
  usePeople: vi.fn(),
}))
vi.mock("@/shared/hooks/use-device", () => ({
  useDevice: () => "desktop",
  useIsTouchLayout: () => false,
}))

function renderSocial(entry = "/social?tab=following") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <SocialPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  vi.mocked(usePeople).mockReturnValue({
    data: { content: [], totalElements: 0 },
    isError: false,
    refetch: vi.fn(),
  } as never)
})

describe("SocialPage", () => {
  it("présente Abonnements et Abonnés comme filtres, sans onglets", () => {
    renderSocial()

    expect(screen.queryByRole("tab")).toBeNull()
    expect(
      screen.getByRole("button", { name: "Abonnements (3)" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Abonnés (1)" })
    ).toBeInTheDocument()
  })

  it("bascule la direction depuis la barre de recherche", async () => {
    renderSocial()

    await userEvent.click(screen.getByRole("button", { name: "Abonnés (1)" }))

    expect(vi.mocked(usePeople).mock.calls.at(-1)?.[0]).toBe("followers")
  })

  it("redirige l'ancien onglet Défis vers /challenges en conservant les filtres", async () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={["/social?tab=challenges&type=received&challenge=c1"]}
        >
          <Routes>
            <Route path="/social" element={<SocialPage />} />
            <Route path="/challenges" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/challenges?type=received&challenge=c1"
    )
  })

  it("redirige l'ancien onglet Salons vers le filtre room", async () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/social?tab=rooms&sort=LATEST"]}>
          <Routes>
            <Route path="/social" element={<SocialPage />} />
            <Route path="/challenges" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/challenges?sort=LATEST&type=room"
    )
  })
})
