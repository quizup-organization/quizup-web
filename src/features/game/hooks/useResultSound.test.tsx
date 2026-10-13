// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import type { DuelResultOutcome } from "@/shared/audio"

vi.mock("@/shared/audio", () => ({ playResultChime: vi.fn() }))

import { playResultChime } from "@/shared/audio"
import { useResultSound } from "./useResultSound"

const playResultChimeMock = vi.mocked(playResultChime)

describe("useResultSound", () => {
  beforeEach(() => {
    useSoundStore.setState({ enabled: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("joue le son du bilan une fois quand il devient disponible", () => {
    const { rerender } = renderHook(
      (outcome: DuelResultOutcome | null) => useResultSound(outcome),
      { initialProps: null as DuelResultOutcome | null }
    )
    expect(playResultChimeMock).not.toHaveBeenCalled()

    rerender("win")
    expect(playResultChimeMock).toHaveBeenCalledWith("win")

    rerender("win")
    rerender("draw")
    expect(playResultChimeMock).toHaveBeenCalledTimes(1)
  })

  it("reste muet pour une partie sans issue sportive (annulée)", () => {
    renderHook((outcome: DuelResultOutcome | null) => useResultSound(outcome), {
      initialProps: null as DuelResultOutcome | null,
    })
    expect(playResultChimeMock).not.toHaveBeenCalled()
  })

  it("reste muet quand les sons sont désactivés", () => {
    useSoundStore.setState({ enabled: false })
    renderHook((outcome: DuelResultOutcome) => useResultSound(outcome), {
      initialProps: "win",
    })
    expect(playResultChimeMock).not.toHaveBeenCalled()
  })
})
