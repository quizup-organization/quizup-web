/** Textes de l'espace Social : abonnements, abonnés, défis et salons en attente. */
export const social = {
  tabs: {
    following: "Abonnements ({{count}})",
    followers: "Abonnés ({{count}})",
    challenges: "Défis",
    challengesWithCount: "Défis ({{count}})",
    rooms: "Salons",
    roomsWithCount: "Salons ({{count}})",
  },
  searchPlaceholder: "Chercher une personne…",
  sortSection: "Trier par",
  sortAria: "Trier les personnes",
  countLabel: "personne",
  sorts: {
    level: "Niveau",
    recent: "Ajout récent",
    alpha: "Ordre alphabétique",
  },
  retry: "Réessayer",
  error: "Impossible de charger les personnes",
  emptyFollowing: "Tu ne suis encore personne",
  emptyFollowers: "Personne ne te suit encore",
  emptyDescription:
    "Trouve des joueurs via la recherche, puis ouvre leur profil pour les suivre.",
  exploreTopics: "Explorer les sujets",
  card: {
    level: "Niveau {{level}}",
    fallbackName: "Joueur",
  },
  presence: {
    online: "En ligne",
    recently: "Vu récemment",
    offline: "Hors ligne",
  },
  /** Onglet Défis : deux groupes — invitations reçues (deck de tri) et défis envoyés. */
  challenges: {
    receivedGroup: "Défis reçus ({{count}})",
    sentGroup: "Défis envoyés ({{count}})",
    deckAria: "Défis reçus à traiter",
    emptyReceived: "Aucun défi reçu",
    emptyReceivedDescription:
      "Un défi lancé depuis une fiche joueur ou un sujet apparaîtra ici.",
    emptySent: "Aucun défi envoyé",
    emptySentDescription:
      "Défie un joueur depuis sa fiche ou depuis la popup « Lancer un duel » d'un sujet.",
    deckDoneTitle: "Tous les défis reçus sont réglés",
    deckDoneDescription:
      "Les prochaines invitations apparaîtront ici, et dans tes notifications.",
  },
  /** Onglet Salons : salles ouvertes en attente de joueurs. */
  rooms: {
    empty: "Aucun salon en attente",
    emptyDescription:
      "Crée une salle depuis un sujet pour défier un joueur ou partager un lien d'invitation.",
    create: "Explorer les sujets",
  },
  /** Cartes défis/salons + libellés du deck de tri. */
  pending: {
    somePlayer: "un joueur",
    playerFallback: "Joueur",
    received: "Défi reçu de {{name}}",
    sent: "Défi envoyé à {{name}}",
    room: "Salon ouvert · {{name}}",
    roomWaiting: "Salon ouvert · en attente",
    rematch: "Revanche",
    viewProfile: "Voir le profil de {{name}}",
    expiresIn: "Expire dans",
    challengeExpiresIn: "Défi expire dans",
    expired: "Expiré",
    decline: "Refuser",
    accept: "Accepter",
    openRoom: "Ouvrir la salle",
    cancel: "Annuler",
    goneTitle: "Ce défi n'est plus disponible",
    goneDescription: "Il a été annulé ou déjà résolu.",
    /** Passés utilisés dans les annonces du deck (aria-live). */
    declinedOutcome: "refusé",
    acceptedOutcome: "accepté",
    cancelledOutcome: "annulé",
  },
}
