import { describe, expect, it } from "vitest";
import { apiErrorToast } from "./api-error-toast";

describe("apiErrorToast", () => {
  it("donne un message dédié quand le thème n'est pas disponible dans la langue", () => {
    const toast = apiErrorToast({
      message: "Topic not available in the players' languages",
      detail: "Le thème topic-1 n'a pas assez de questions dans [fr, en]",
      type: "urn:quizup:lobby:topicNotAvailableInLanguage",
    });

    expect(toast.title).toBe("Défi impossible");
    expect(toast.description).toContain("langue de l'autre joueur");
  });

  it("conserve le message backend pour les autres problèmes", () => {
    const toast = apiErrorToast({
      message: "Bad request",
      detail: "invalid body",
      type: "urn:quizup:social:invalid",
    });

    expect(toast.title).toBe("Bad request");
    expect(toast.description).toBe("invalid body");
  });
});
