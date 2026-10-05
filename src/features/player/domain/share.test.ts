import { describe, expect, it } from "vitest";
import { profileShareMessage } from "./share";

describe("profileShareMessage", () => {
  it("cite le pseudonyme", () => {
    expect(profileShareMessage("Ada")).toBe(
      "Rejoins-moi sur QuizUp et découvre mon profil « Ada » !",
    );
  });
});
