/** Textes de la fiche sujet : bannière, progression, onglets, classement, historique et partage. */
export const topic = {
  detail: {
    loading: "Chargement du sujet…",
    notFound: "Sujet introuvable",
    backToCatalog: "Retour au catalogue",
    play: "Lancer un duel",
    edit: "Éditer le thème",
    follow: "Suivre",
    following: "Suivi",
    share: "Partager",
    progress: "Questions complétées",
    stats: {
      level: "Ton niveau",
      followers: "Abonnés",
      questions: "Questions",
    },
    mastery: "Maîtrise · {{grade}}",
    titles: {
      playFirst: "Joue une première partie pour le débloquer",
      tab: "Titres",
      subtitle:
        "Grimpe les grades de ce sujet pour débloquer ses titres thématiques et en porter un sur ton profil.",
      xpRequired: "{{xp}} XP",
      remaining: "Plus que {{xp}} XP",
      xpProgress: "{{progress}} / {{target}} XP",
      percent: "{{percent}} %",
      maxGrade: "Grade maximal atteint",
    },
    tabs: {
      leaderboard: "Classement",
      progression: "Parties",
    },
    emptyTitle: "Pas encore de duel sur ce sujet",
    emptyDescription:
      "Lance-toi : sept tours suffisent à te placer au classement.",
  },
  leaderboard: {
    title: "Classement",
    periodTitle: "Période",
    period: {
      allTime: "Général",
      monthly: "Mensuel",
    },
    periodCaption: {
      allTime: "de tous les temps",
      monthly: "ce mois-ci",
    },
    monthTitle: "Mois",
    monthAria: "Choisir le mois",
    scopeTitle: "Portée",
    scope: {
      world: "Monde",
      following: "Abonnés",
      country: "Pays",
    },
    filtersTitle: "Filtres du classement",
    view: "Voir le classement",
    level: "Niveau {{level}}",
    playerFallback: "Joueur",
    loading: "Chargement…",
    error: "Classement indisponible.",
    empty: "Aucun joueur classé pour l'instant.",
  },
  matchList: {
    outcomes: {
      win: "Victoire",
      loss: "Défaite",
      draw: "Égalité",
      waiting: "En attente",
      inProgress: "En cours",
      cancelled: "Annulé",
    },
    bot: "Bot",
    opponent: "Adversaire",
    against: "contre {{name}}",
    openAria: "Voir le résultat du duel contre {{name}}",
  },
  share: {
    title: "Partager ce thème",
    sub: "Envoie le lien : ton invité crée son compte s'il n'en a pas et arrive directement sur le thème.",
    message: "Découvre le thème « {{name}} » sur QuizUp !",
  },
}
