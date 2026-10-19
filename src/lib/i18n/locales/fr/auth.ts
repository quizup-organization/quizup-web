/** Textes des écrans d'authentification : connexion, code de connexion, callback OIDC. */
export const auth = {
  shell: {
    hero: "Sept tours, dix secondes par question. Défie le monde et grimpe au classement.",
  },
  login: {
    sessionUnknownUser:
      "Ta session n'est plus valide (réinitialisation du service). Reconnecte-toi.",
    sessionExpired: "Ta session a expiré. Reconnecte-toi.",
    sessionSuspended:
      "Ton compte est suspendu. Consulte l'email reçu pour connaître le motif et l'échéance.",
    title: "Connexion à ton compte",
    subtitle: "Entre ton e-mail : on t'envoie un code de connexion.",
    emailLabel: "E-mail",
    emailPlaceholder: "toi@exemple.fr",
    emailInvalid: "Adresse e-mail invalide",
    requestError: "Impossible d'envoyer le code. Réessaie.",
    submitPending: "Envoi…",
    submit: "Recevoir un code",
    separator: "Ou continuer avec",
    google: "Continuer avec Google",
    facebook: "Continuer avec Facebook",
    facebookEmailMissing:
      "Facebook n'a pas transmis d'email. Utilise la connexion par email.",
    facebookUnavailable:
      "Facebook est temporairement indisponible. Réessaie ou utilise la connexion par email.",
    socialError:
      "La connexion sociale a échoué. Réessaie ou utilise la connexion par email.",
  },
  code: {
    invalid: "Code invalide ou expiré. Réessaie.",
    resendError: "Impossible de renvoyer le code. Réessaie.",
    invalidFormat: "Le code doit contenir 6 chiffres",
    changeEmail: "Changer d'e-mail",
  },
  callback: {
    title: "Connexion impossible",
    fallbackError: "Échec de la connexion",
    loading: "Connexion en cours…",
  },
}
