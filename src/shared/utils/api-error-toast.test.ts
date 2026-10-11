import { beforeAll, describe, expect, it } from "vitest";
import i18n from "@/lib/i18n";
import { apiErrorToast } from "./api-error-toast";

describe("apiErrorToast", () => {
  // Node expose `navigator.language = "en-US"` : on force le français pour les assertions.
  beforeAll(async () => {
    await i18n.changeLanguage("fr");
  });

  it("donne un message dédié quand la salle n'existe plus", () => {
    const toast = apiErrorToast({
      message: "Salon introuvable",
      detail: "Le salon room-1 n'existe pas",
      type: "urn:quizup:room:notFound",
    });

    expect(toast.title).toBe("Ce défi n'est plus disponible");
    expect(toast.description).toContain("expiré");
  });

  it("donne un message dédié quand le défi n'est plus actionnable", () => {
    const toast = apiErrorToast({
      message: "Défi déjà résolu",
      detail: "Le défi challenge-1 est en statut CANCELLED",
      type: "urn:quizup:challenge:notPending",
    });

    expect(toast.title).toBe("Ce défi n'est plus disponible");
    expect(toast.description).toContain("annulé");
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
