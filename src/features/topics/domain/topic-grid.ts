/**
 * Grille des sujets en **tuiles springboard**, à toutes les tailles : 3 ou 4 colonnes en
 * compact (réglage « Grille des sujets »), puis 5 en tablette et 7 en desktop — les tuiles
 * gardent ainsi une taille d'icône (~110-160 px) au lieu de s'étirer.
 */
export function topicGridClass(columns: 3 | 4): string {
  return columns === 3
    ? "grid grid-cols-3 tablet:grid-cols-5 desktop:grid-cols-7 gap-x-1 gap-y-2 tablet:gap-3"
    : "grid grid-cols-4 tablet:grid-cols-5 desktop:grid-cols-7 gap-x-1 gap-y-2 tablet:gap-3"
}
