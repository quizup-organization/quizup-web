// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useSoundStore } from "@/shared/stores/useSoundStore"

vi.mock("@/shared/audio", () => ({
  playCorrectChime: vi.fn(),
  playWrongChime: vi.fn(),
  playTimeoutChime: vi.fn(),
  playOpponentChime: vi.fn(),
}))

import {
  playCorrectChime,
  playOpponentChime,
  playTimeoutChime,
  playWrongChime,
} from "@/shared/audio"
import { useDuelSounds, type DuelSoundsParams } from "./useDuelSounds"

const mocks = {
  correct: vi.mocked(playCorrectChime),
  wrong: vi.mocked(playWrongChime),
  timeout: vi.mocked(playTimeoutChime),
  opponent: vi.mocked(playOpponentChime),
}

function props(overrides: Partial<DuelSoundsParams> = {}): DuelSoundsParams {
  return {
    scene: { kind: "question" },
    roundIndex: 0,
    yourCorrect: null,
    yourPick: null,
    theirPick: null,
    ...overrides,
  }
}

describe("useDuelSounds", () => {
  beforeEach(() => {
    useSoundStore.setState({ enabled: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("joue le son de bonne réponse dès l'écho, une seule fois par round", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ yourCorrect: true, yourPick: "A" }))
    expect(mocks.correct).toHaveBeenCalledTimes(1)

    // La scène est re-projetée à chaque tick et l'écho peut être re-livré : pas de rejeu.
    rerender(props({ yourCorrect: true, yourPick: "A" }))
    rerender(
      props({ yourCorrect: true, yourPick: "A", scene: { kind: "reveal" } })
    )
    expect(mocks.correct).toHaveBeenCalledTimes(1)
    expect(mocks.timeout).not.toHaveBeenCalled()
  })

  it("joue le son de mauvaise réponse puis repart pour le round suivant", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ yourCorrect: false, yourPick: "B" }))
    expect(mocks.wrong).toHaveBeenCalledTimes(1)

    rerender(props({ roundIndex: 1, scene: { kind: "roundIntro" } }))
    rerender(props({ roundIndex: 1, yourCorrect: true, yourPick: "C" }))
    expect(mocks.correct).toHaveBeenCalledTimes(1)
  })

  it("joue le son neutre au reveal quand je n'ai pas répondu", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ scene: { kind: "reveal" } }))
    expect(mocks.timeout).toHaveBeenCalledTimes(1)
  })

  it("ne sonorise jamais un état déjà terminal au montage (rechargement)", () => {
    renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props({ yourCorrect: true, yourPick: "A" }),
    })
    expect(mocks.correct).not.toHaveBeenCalled()

    renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props({ scene: { kind: "reveal" } }),
    })
    expect(mocks.timeout).not.toHaveBeenCalled()
  })

  it("blip l'adversaire quand sa réponse arrive en direct, une fois par round", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ theirPick: "A" }))
    expect(mocks.opponent).toHaveBeenCalledTimes(1)

    // Ticks et écho re-livré : pas de rejeu, même au reveal suivant.
    rerender(props({ theirPick: "A" }))
    rerender(props({ theirPick: "A", scene: { kind: "reveal" } }))
    expect(mocks.opponent).toHaveBeenCalledTimes(1)

    rerender(props({ roundIndex: 1 }))
    rerender(props({ roundIndex: 1, theirPick: "B" }))
    expect(mocks.opponent).toHaveBeenCalledTimes(2)
  })

  it("reste muet si l'adversaire avait déjà répondu au montage", () => {
    renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props({ theirPick: "A" }),
    })
    expect(mocks.opponent).not.toHaveBeenCalled()
  })

  it("ne blip pas si l'écho adverse tombe pendant le reveal", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ scene: { kind: "reveal" }, theirPick: "A" }))
    expect(mocks.opponent).not.toHaveBeenCalled()
  })

  it("reste muet sur un round sans événement", () => {
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props({ scene: { kind: "vs" } }),
    })
    rerender(props({ scene: { kind: "question" } }))
    expect(mocks.correct).not.toHaveBeenCalled()
    expect(mocks.wrong).not.toHaveBeenCalled()
    expect(mocks.timeout).not.toHaveBeenCalled()
    expect(mocks.opponent).not.toHaveBeenCalled()
  })

  it("reste muet quand les sons sont désactivés", () => {
    useSoundStore.setState({ enabled: false })
    const { rerender } = renderHook((p: DuelSoundsParams) => useDuelSounds(p), {
      initialProps: props(),
    })
    rerender(props({ yourCorrect: true, yourPick: "A", theirPick: "B" }))
    expect(mocks.correct).not.toHaveBeenCalled()
    expect(mocks.opponent).not.toHaveBeenCalled()
  })
})
