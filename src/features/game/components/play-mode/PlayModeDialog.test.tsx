// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { Suggestion } from "@/features/shell/domain/suggestion"
import type { TopicCard } from "@/features/topics/domain/topic"
import { PlayModeDialog } from "./PlayModeDialog"

/** Force le rendu **desktop** (modale centrée Radix) : jsdom n'a pas de vrai `matchMedia`. */
beforeAll(async () => {
  await i18n.changeLanguage("fr")
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: query.includes("min-width: 1024px"),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
})

const topic: TopicCard = {
  topicId: "topic-1",
  names: { fr: "Star Wars" },
  description: null,
  category: "CINEMA",
  categoryLabel: "Cinéma",
  emoji: "🚀",
  color: null,
  imageUrl: null,
  followersCount: 0,
  questionsCount: 7,
  followed: false,
  status: "PUBLISHED",
}

const playerSuggestion: Suggestion = {
  type: "PLAYER",
  id: "player-1",
  label: "Ada",
  subtitle: "Niveau 3",
  emoji: null,
  color: null,
  imageUrl: null,
  avatarOptions: null,
  names: null,
}

function renderDialog(
  overrides: Partial<Parameters<typeof PlayModeDialog>[0]>
) {
  const props = {
    open: true,
    onClose: vi.fn(),
    topic,
    onStartWorld: vi.fn(),
    onStartBot: vi.fn(),
    onStartPlayer: vi.fn(),
    onStartPrivate: vi.fn(),
    playerQuery: "",
    onPlayerQueryChange: vi.fn(),
    playerSource: "following" as const,
    onPlayerSourceChange: vi.fn(),
    playerResults: [playerSuggestion],
    playersLoading: false,
    ...overrides,
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <PlayModeDialog {...props} />
    </QueryClientProvider>
  )
  return props
}

describe("PlayModeDialog", () => {
  it("bot : choix de la difficulté puis lancement immédiat", async () => {
    const user = userEvent.setup()
    const props = renderDialog({})

    // Étape 1 : sélection de l'adversaire (le sujet est rappelé).
    await screen.findByText("Qui veux-tu défier ?")
    expect(screen.getByText("Star Wars")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Défier un Bot/ }))
    await user.click(screen.getByRole("button", { name: "Suivant" }))

    // Étape 2 : difficulté, le bouton final devient « Lancer ».
    await screen.findByText("Quelle difficulté ?")
    await user.click(screen.getByRole("button", { name: /Difficile/ }))
    await user.click(screen.getByRole("button", { name: "Lancer" }))

    expect(props.onStartBot).toHaveBeenCalledWith("HARD")
    expect(props.onStartWorld).not.toHaveBeenCalled()
  })

  it("joueur : source de recherche puis sélection nominative", async () => {
    const user = userEvent.setup()
    const props = renderDialog({})

    await screen.findByText("Qui veux-tu défier ?")
    await user.click(screen.getByRole("button", { name: /Défier un joueur/ }))
    await user.click(screen.getByRole("button", { name: "Suivant" }))

    // Étape 2 : source (abonnements / abonnés / recherche universelle).
    await screen.findByText("Où chercher ton adversaire ?")
    await user.click(screen.getByRole("button", { name: /Mes abonnés/ }))
    expect(props.onPlayerSourceChange).toHaveBeenCalledWith("followers")
    await user.click(screen.getByRole("button", { name: "Suivant" }))

    // Étape 3 : sélection du joueur — « Lancer » exige un choix.
    await screen.findByText("Choisis un joueur")
    const launch = screen.getByRole("button", { name: "Lancer" })
    expect(launch).toBeDisabled()

    await user.click(screen.getByRole("button", { name: /Ada/ }))
    await user.click(screen.getByRole("button", { name: "Lancer" }))

    expect(props.onStartPlayer).toHaveBeenCalledWith("player-1")
    expect(props.onStartBot).not.toHaveBeenCalled()
  })

  it("retour : revient à l'étape précédente et réinitialise la sélection", async () => {
    const user = userEvent.setup()
    renderDialog({})

    await screen.findByText("Qui veux-tu défier ?")
    await user.click(screen.getByRole("button", { name: /Défier un joueur/ }))
    await user.click(screen.getByRole("button", { name: "Suivant" }))
    await screen.findByText("Où chercher ton adversaire ?")
    await user.click(screen.getByRole("button", { name: "Suivant" }))
    await screen.findByText("Choisis un joueur")

    await user.click(screen.getByRole("button", { name: "Précédent" }))
    expect(
      await screen.findByText("Où chercher ton adversaire ?")
    ).toBeInTheDocument()
  })
})
