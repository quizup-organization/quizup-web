import { describe, expect, it } from "vitest";
import { apiErrorToast } from "./api-error-toast";

describe("apiErrorToast", () => {
  it("donne un message dédié quand la salle n'existe plus", () => {
    const toast = apiErrorToast({
      message: "Salon introuvable",
      detail: "Le salon room-1 n'existe pas",
      type: "urn:quizup:room:notFound",
    });

    expect(toast.title).toBe("Ce défi n'est plus disponible");
    expect(toast.description).toContain("expiré");
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
