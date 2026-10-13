import { describe, expect, it } from "vitest";
import { useTopicGridStore } from "./useTopicGridStore";

describe("useTopicGridStore", () => {
  it("démarre à 4 colonnes et accepte 3 colonnes", () => {
    expect(useTopicGridStore.getState().columns).toBe(4);
    useTopicGridStore.getState().setColumns(3);
    expect(useTopicGridStore.getState().columns).toBe(3);
    useTopicGridStore.getState().setColumns(4);
  });
});
