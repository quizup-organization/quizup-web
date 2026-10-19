// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { challengesService } from "../lib/challenges"
import { useCreateChallenge } from "./useCreateChallenge"

const navigate = vi.fn()

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}))
vi.mock("@/shared/utils/success-toast", () => ({
  showSuccessToast: vi.fn(),
}))
vi.mock("../lib/challenges", () => ({
  challengesService: { create: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  navigate.mockReset()
  vi.mocked(showSuccessToast).mockReset()
  vi.mocked(challengesService.create).mockResolvedValue({ id: "c1" })
})

describe("useCreateChallenge", () => {
  it("ouvre les défis envoyés au clic sur le toast", async () => {
    const { result } = renderHook(() => useCreateChallenge(), { wrapper })

    result.current.mutate({ topicId: "t1", opponentId: "u2" })

    await waitFor(() => expect(showSuccessToast).toHaveBeenCalledTimes(1))
    const options = vi.mocked(showSuccessToast).mock.calls[0][1]
    options?.onClick?.()

    expect(navigate).toHaveBeenCalledWith("/challenges?type=sent")
  })
})
