// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { ChallengeView } from "@/features/challenges/domain/challenge"
import type { RoomView } from "@/features/rooms/domain/room"
import {
  useAcceptChallenge,
  useCancelChallenge,
  useDeclineChallenge,
  useMyChallenges,
} from "@/features/challenges"
import { useCancelRoom, useMyOpenRooms } from "@/features/rooms"
import { SocialPage } from "./SocialPage"

vi.mock("@/features/auth", () => ({ getSessionUserId: () => "me" }))
vi.mock("@/features/shell", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  useMe: () => ({ data: { followingCount: 3, followersCount: 1 } }),
  useTopicName: () => (names: Record<string, string>) => names.fr ?? "",
  useImmersiveNavigate: () => vi.fn(),
}))
vi.mock("@/shared/clock/useServerClock", () => ({
  useServerClock: () => ({
    serverNow: () => Date.now(),
    synced: true,
    resync: vi.fn(),
  }),
}))
vi.mock("@/features/follows", () => ({
  PersonTile: () => null,
  usePeople: () => ({
    data: { content: [], totalElements: 0 },
    isError: false,
    refetch: vi.fn(),
  }),
}))
vi.mock("@/features/notifications", () => ({
  useResolveChallenge: () => vi.fn(),
}))
// Barre de filtres en mode desktop : les puces de type sont rendues directement.
vi.mock("@/shared/hooks/use-device", () => ({
  useDevice: () => "desktop",
  useIsTouchLayout: () => false,
}))
vi.mock("@/features/challenges", () => ({
  useMyChallenges: vi.fn(),
  useAcceptChallenge: vi.fn(),
  useDeclineChallenge: vi.fn(),
  useCancelChallenge: vi.fn(),
}))
vi.mock("@/features/rooms", () => ({
  useMyOpenRooms: vi.fn(),
  useCancelRoom: vi.fn(),
}))

const TOPIC = {
  topicId: "t1",
  names: { fr: "Pokémon", en: "Pokémon" },
  category: null,
  emoji: null,
  color: null,
  imageUrl: null,
  titles: null,
}

/** Échéance à ~1 jour : au-delà de la fenêtre d'un `setTimeout` 32 bits, le countdown prévient. */
const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

function challenge(overrides: Partial<ChallengeView> = {}): ChallengeView {
  return {
    challengeId: "c1",
    topic: TOPIC,
    challenger: { userId: "u9", pseudonym: "Nadjim", avatarOptions: null },
    opponent: { userId: "me", pseudonym: "Moi", avatarOptions: null },
    status: "PENDING",
    roomId: null,
    gameId: null,
    createdAt: "2026-01-01T10:00:00Z",
    expiresAt: FUTURE,
    ...overrides,
  }
}

function room(overrides: Partial<RoomView> = {}): RoomView {
  return {
    roomId: "r1",
    topic: TOPIC,
    status: "WAITING_PLAYERS",
    vsBot: false,
    canCancel: true,
    opponent: { userId: "u9", pseudonym: "Nadjim", avatarOptions: null },
    initiatorPresent: true,
    participantPresent: false,
    gameId: null,
    createdAt: "2026-01-01T10:00:00Z",
    expiresAt: FUTURE,
    updatedAt: "2026-01-01T10:00:00Z",
    ...overrides,
  }
}

const accept = vi.fn().mockResolvedValue({ status: "accepted", roomId: null })
const decline = vi.fn().mockResolvedValue(undefined)

function renderPage(tab: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/social?tab=${tab}`]}>
        <SocialPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  accept.mockReset().mockResolvedValue({ status: "accepted", roomId: null })
  decline.mockReset().mockResolvedValue(undefined)
  vi.mocked(useMyChallenges).mockReturnValue({
    data: [challenge()],
    isLoading: false,
  } as never)
  vi.mocked(useMyOpenRooms).mockReturnValue({
    data: [room()],
    isLoading: false,
  } as never)
  vi.mocked(useAcceptChallenge).mockReturnValue({
    accept,
    pending: false,
  } as never)
  vi.mocked(useDeclineChallenge).mockReturnValue({
    decline,
    pending: false,
  } as never)
  vi.mocked(useCancelChallenge).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never)
  vi.mocked(useCancelRoom).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never)
})

describe("SocialPage", () => {
  it("expose les trois onglets avec leurs compteurs (défis et salons fusionnés)", () => {
    renderPage("following")

    expect(
      screen.getByRole("tab", { name: "Abonnements (3)" })
    ).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Abonnés (1)" })).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: "Défis & Salons (2)" })
    ).toBeInTheDocument()
  })

  it("onglet Défis : cartes des invitations reçues et liste des défis envoyés", async () => {
    vi.mocked(useMyChallenges).mockReturnValue({
      data: [
        challenge(),
        challenge({
          challengeId: "c2",
          challenger: { userId: "me", pseudonym: "Moi", avatarOptions: null },
          opponent: { userId: "u9", pseudonym: "Nadjim", avatarOptions: null },
        }),
      ],
      isLoading: false,
    } as never)

    renderPage("challenges")

    // Invitations reçues : cartes empilées dans un ScrollArea, mêmes actions inline.
    expect(
      screen.getByRole("region", { name: "Défis reçus (1)" })
    ).toBeInTheDocument()
    expect(screen.getByText("Défis reçus (1)")).toBeInTheDocument()
    expect(screen.getByText("Défi reçu")).toBeInTheDocument()
    expect(screen.getByText("de Nadjim")).toBeInTheDocument()

    // Défis envoyés : liste empilée dans un ScrollArea, action unique (annuler).
    expect(
      screen.getByRole("region", { name: "Défis envoyés (1)" })
    ).toBeInTheDocument()
    expect(screen.getByText("Défis envoyés (1)")).toBeInTheDocument()
    expect(screen.getByText("Défi envoyé")).toBeInTheDocument()
    expect(screen.getByText("à Nadjim")).toBeInTheDocument()
    expect(
      within(
        screen.getByRole("region", { name: "Défis envoyés (1)" })
      ).getByRole("button", { name: "Annuler" })
    ).toBeInTheDocument()

    // Les salons ouverts vivent dans le même onglet.
    expect(screen.getByText("Salons (1)")).toBeInTheDocument()
    expect(screen.getByText("Salon ouvert")).toBeInTheDocument()

    // Carte reçue : le bouton « Accepter » tranche l'invitation.
    await userEvent.click(screen.getByRole("button", { name: "Accepter" }))
    expect(accept).toHaveBeenCalledWith("c1")
  })

  it("onglet fusionné : filtre les cartes par type", async () => {
    renderPage("challenges")

    await userEvent.click(screen.getByRole("button", { name: "Salons" }))

    expect(screen.getByText("Salon ouvert")).toBeInTheDocument()
    expect(screen.queryByText("Défi reçu")).toBeNull()
    expect(screen.queryByText("Défi envoyé")).toBeNull()
  })

  it("onglet Défis : le refus part par le bouton destructif de la carte", async () => {
    renderPage("challenges")

    const refuse = screen.getByRole("button", { name: "Refuser" })
    await userEvent.click(refuse)
    expect(decline).toHaveBeenCalledWith("c1")
  })

  it("onglet Salons : carte de salle ouverte avec ses actions", () => {
    renderPage("rooms")

    expect(screen.getByText("Salon ouvert")).toBeInTheDocument()
    expect(screen.getByText("avec Nadjim")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Ouvrir la salle" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Annuler" })).toBeInTheDocument()
  })

  it("onglet Salons : salle sans adversaire affiche l'attente", () => {
    vi.mocked(useMyOpenRooms).mockReturnValue({
      data: [room({ opponent: null })],
      isLoading: false,
    } as never)

    renderPage("rooms")

    expect(screen.getByText("Salon ouvert")).toBeInTheDocument()
    expect(screen.getByText("En attente d'un joueur")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Ouvrir la salle" })
    ).toBeInTheDocument()
  })

  it("sans rien en attente : un état vide commun", () => {
    vi.mocked(useMyChallenges).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)
    vi.mocked(useMyOpenRooms).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)

    const { unmount } = renderPage("challenges")
    expect(
      screen.getByText("Aucun défi ni salon en attente")
    ).toBeInTheDocument()
    unmount()

    // Ancien lien conservé : il retombe sur l'onglet fusionné.
    renderPage("rooms")
    expect(
      screen.getByText("Aucun défi ni salon en attente")
    ).toBeInTheDocument()
  })
})
