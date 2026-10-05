import { describe, expect, it } from "vitest";
import { topicShareMessage } from "./share";

describe("topicShareMessage", () => {
  it("cite le thème", () => {
    expect(topicShareMessage("Cinéma")).toBe(
      "Découvre le thème « Cinéma » sur QuizUp !",
    );
  });
});
