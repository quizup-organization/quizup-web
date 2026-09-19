/**
 * Catégories de sujets : libellés FR + couleur éditoriale.
 * Le backend renvoie `{ category, label }` (enum `TopicCategory`) mais pas de couleur ;
 * on garde une table locale alignée sur la maquette (`product/maquettes`).
 */
const CATEGORY_LABELS: Record<string, string> = {
  ARTS: "Arts & lettres",
  BUSINESS: "Économie & business",
  EDUCATION: "Éducation",
  ENTERTAINMENT: "Divertissement",
  FOOD_AND_DRINK: "Cuisine & boissons",
  GAMES: "Jeux",
  GENERAL: "Général",
  HISTORY: "Histoire",
  LITERATURE: "Littérature",
  MOVIES: "Cinéma",
  MUSIC: "Musique",
  NATURE: "Nature & animaux",
  SCIENCE: "Sciences",
  SPORTS: "Sport",
  TELEVISION: "Séries & TV",
  TECHNOLOGY: "Technologie",
  WORLD: "Monde & géographie",
};

const CATEGORY_COLORS: Record<string, string> = {
  ARTS: "#f97316",
  BUSINESS: "#eab308",
  EDUCATION: "#0ea5e9",
  ENTERTAINMENT: "#ef4444",
  FOOD_AND_DRINK: "#f43f5e",
  GAMES: "#22c55e",
  GENERAL: "#8b5cf6",
  HISTORY: "#a855f7",
  LITERATURE: "#f97316",
  MOVIES: "#ef4444",
  MUSIC: "#ec4899",
  NATURE: "#22c55e",
  SCIENCE: "#06b6d4",
  SPORTS: "#14b8a6",
  TELEVISION: "#f59e0b",
  TECHNOLOGY: "#06b6d4",
  WORLD: "#8b5cf6",
};

function normalize(code: string): string {
  return code?.toUpperCase() ?? "";
}

export function categoryColor(code: string): string {
  return CATEGORY_COLORS[normalize(code)] ?? "#8b5cf6";
}

export function categoryLabel(code: string, fallback?: string): string {
  return CATEGORY_LABELS[normalize(code)] ?? fallback ?? code;
}

const CATEGORY_TAGLINES: Record<string, string> = {
  ARTS: "Des questions pour les esprits créatifs.",
  BUSINESS: "Économie, entreprises et grands marchés.",
  EDUCATION: "Apprendre en s'amusant, un duel à la fois.",
  ENTERTAINMENT: "People, humour et culture pop.",
  FOOD_AND_DRINK: "Cuisine, saveurs et spécialités du monde.",
  GAMES: "Jeux vidéo, jeux de société et culture ludique.",
  GENERAL: "Un peu de tout, pour ne jamais s'ennuyer.",
  HISTORY: "Dates, figures et tournants de l'Histoire.",
  LITERATURE: "Livres, auteurs et grands classiques.",
  MOVIES: "Répliques culte et chefs-d'œuvre du cinéma.",
  MUSIC: "Tubes, artistes et histoires de sons.",
  NATURE: "Animaux, plantes et merveilles du vivant.",
  SCIENCE: "Découvertes, physique et grands mystères.",
  SPORTS: "Exploits, équipes et légendes du sport.",
  TELEVISION: "Séries, émissions et personnages marquants.",
  TECHNOLOGY: "Code, réseaux et innovations.",
  WORLD: "Pays, capitales et géographie du globe.",
};

/** Tagline éditoriale par catégorie (repli quand le sujet n'a pas de description). */
export function categoryTagline(code: string): string {
  return (
    CATEGORY_TAGLINES[normalize(code)] ??
    "Sept tours, dix secondes par question."
  );
}

