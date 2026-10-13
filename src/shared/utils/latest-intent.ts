/**
 * Registre d'intentions « la dernière gagne » pour les mutations ré-émises (clics multiples).
 *
 * Chaque mutation optimiste démarre une **génération** sur une clé de cible (`follow:{playerId}`,
 * `profile:{userId}`…). Une réconciliation en cours compare sa génération à la dernière émise :
 * dès qu'une intention plus récente existe, elle s'arrête sans écrire (`reconcileUntil`).
 * Le registre est **module-level** et non un `useRef` : les boucles survivent au démontage du
 * composant, et un remontage (ou un autre composant visant la même cible) doit pouvoir les
 * invalider.
 *
 * Le compteur de générations est **global et monotone** (jamais réutilisé) : après `endIntent`,
 * une ancienne boucle ne peut pas se croire courante parce qu'une nouvelle intention aurait
 * réattribué le même numéro.
 */
const latestByKey = new Map<string, number>();
let counter = 0;

/** Démarre une intention sur `key` et renvoie sa génération. */
export function beginIntent(key: string): number {
  counter += 1;
  latestByKey.set(key, counter);
  return counter;
}

/** Vrai tant qu'aucune intention plus récente n'a remplacé `generation` sur `key`. */
export function isCurrentIntent(key: string, generation: number): boolean {
  return latestByKey.get(key) === generation;
}

/**
 * Libère la clé si `generation` est toujours la dernière (après convergence/timeout). Une boucle
 * périmée n'efface jamais l'intention qui l'a remplacée.
 */
export function endIntent(key: string, generation: number): void {
  if (latestByKey.get(key) === generation) {
    latestByKey.delete(key);
  }
}

/** Réinitialise le registre — réservé aux tests. */
export function resetLatestIntents(): void {
  latestByKey.clear();
  counter = 0;
}
