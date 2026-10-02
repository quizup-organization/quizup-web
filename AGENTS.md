# AGENTS.md — quizup-web

> Interface **web React** de QuizUp (Vite + React 19 + TypeScript + Tailwind v4 + shadcn).
> Source de vérité design : `product/maquettes` (iso shadcn). Conventions : `best-practices/.frontend/`.
> **Contrat backend normatif** : [`services/quizup-bff/AGENTS.md`](../../services/quizup-bff/AGENTS.md) § 3.

---

## 1. Rôle

Application web de QuizUp (Lot 1) :

- Auth OIDC (Authorization Code + PKCE) — `oidc-client-ts`, client public `web`.
- Coquille : sidebar, topbar, palette ⌘K, navigation basse mobile, thème Clair/Sombre/Système.
- **Accueil**, **Sujets** (recherche/filtres/tri/pagination), **Fiche sujet** (suivi, classement, historique).
- **Personnes** (Abonnements / Abonnés) + **Fiche joueur** (suivre/ne plus suivre, stats V/N/D).
- **Défis** : liste reçus + envoyés, accept/refus/annulation, création depuis la fiche joueur ;
  un défi accepté propose **Jouer** (ouvre l'arène).
- **Duel** : bot (difficulté au choix) **ou humain** (matchmaking). Arène `/duel/:gameId` commune ;
  recherche d'adversaire `/duel/search/:ticketId` (read model **ticket** alimenté par STOMP).
- Profil & Réglages.

Hors Lot 1 : création de sujets/questions.

---

## 2. Stack & structure

- Vite 8, React 19, TypeScript strict, Tailwind v4 + shadcn (preset `b1aIcEacC`), React Query, Zustand, Zod +
  React Hook Form, `oidc-client-ts`, `@stomp/stompjs` (temps réel).
- Structure (cf. `best-practices/.frontend/folder-structure.md`) :

```
src/
  routes/            # react-router (couche mince) + lazy par page
  features/<nom>/    # domain/ (contrat partagé : modèles + règles pures, import direct cross-feature)
                     # lib/ (services de la feature)  hooks/  components/  pages/  stores/  application/ (duel)
                     # index.ts  = API publique (hooks/services/composants)
                     # pages.ts  = point d'entrée des routes (lazy)
  shared/{components,hooks,stores,types,utils,theme}/   # cross-feature (types api/notifications, primitives)
  components/ui/      # primitifs shadcn (vendored)
  components/animate-ui/ # primitifs animate-ui (vendored)
  lib/{api-client,api,endpoints,config,query-client,query-keys,session,error-bus,ws}/   # infra uniquement
```

Chaîne imposée : **widget → hook React Query → service (`features/<nom>/lib/`) → API client**.
`features/<nom>/domain/*` est un **contrat partagé** (analogue backend `*-domain`) importable par les
autres features ; le reste d'une feature passe par son barrel `@/features/<nom>`.

**Conventions d'import (ESLint `no-restricted-imports`)** : on n'importe jamais l'implémentation
interne d'une feature — uniquement `@/features/<nom>` (barrel), `@/features/<nom>/pages` (route
lazy), ou `@/features/<nom>/domain/*` (**contrat partagé**). La couche `lib/` peut dépendre d'un
`features/<nom>/domain/*` (contrat), jamais du reste d'une feature.

---

## 3. Commandes

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc -b (solution tsconfig)
npm run lint
npm run build
npm run test       # Vitest
npm run e2e        # Playwright : duel bot, matchmaking, async (record→replay), forfait, présence (stack complète)
```

Variables (`.env.development`) : `VITE_API_URL`, `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_REDIRECT_URI`.

**CI/CD** : `.github/workflows/ci.yml` (lint + build) et `release.yml` (image GHCR + dispatch deploy)
via `quizup-organization/quizup-reusable-workflows`.

---

## 4. Surface BFF (via `VITE_API_URL`, BFF unique)

> Détail normatif : [`services/quizup-bff/AGENTS.md`](../../services/quizup-bff/AGENTS.md) § 3.
> **Aucun `POST /search`** : les lectures sont des vues explicites ou des listes à query params.
> Enrichissements (noms, niveaux, présences, compteurs, avatars) composés par le BFF.

| Écran | Endpoints |
|---|---|
| Coquille | `GET /api/me` ; `GET /api/suggestions?q=&limit=` (⌘K) ; `GET /api/clock` |
| Accueil | `GET /api/home` (`followedTopics`, `trendingTopics`) |
| Sujets | `GET /api/topics?q=&category=&followed=&sort=&page=&size=` ; `GET /api/topics/facets?q=&followed=` ; `GET /api/topic-categories` |
| Fiche sujet | `GET /api/topics/{id}/overview` ; `PUT|DELETE /api/topics/{id}/follow` ; `GET /api/topics/{id}/leaderboard?period=&scope=&page=&size=` |
| Personnes | `GET /api/profiles/{id}/following?q=&sort=&page=&size=` ; `.../followers?...` |
| Fiche joueur | `GET /api/profiles/{id}` ; `PUT|DELETE /api/profiles/{id}/follow` ; `GET .../head-to-head?against=` |
| Historique / activité | `GET /api/profiles/{id}/games?topicId=&opponentId=&page=&size=` ; `GET .../activity?from=&to=` |
| Salons | `POST /api/lobbies` (`{topicId, kind: PUBLIC\|PRIVATE}`) ; `GET /api/lobbies/mine` ; `POST /api/lobbies/join` (`{code}`) ; `GET /api/lobbies/{id}` ; `POST .../{id}/enter|leave|cancel` ; `GET .../{id}/notifications` |
| Arène | `POST /api/games` (bot) ; `POST .../{id}/join` ; `POST .../{id}/leave` ; `POST .../{id}/answer` ; `POST .../{id}/abandon` ; `POST .../{id}/cancel` ; `GET .../{id}/notifications` |
| Présence | `GET /api/presence/{id}` (`404` = jamais connecté) |

**WebSocket** (`/ws/websocket`, une connexion BFF) :
`/topic/games/{gameId}` (`EventEnvelopeResponse<GameNotification>`),
`/topic/matchmaking/tickets/{ticketId}` (`EventEnvelopeResponse<TicketNotification>`),
`/topic/social/{userId}` (`EventEnvelopeResponse<SocialNotification>`),
`/topic/presence/{userId}` (`PresenceView`, sans enveloppe).

---

## 5. Conventions

- 1 composant = 1 fichier, export nommé, `interface` pour les props, **jamais `any`**.
- Server state = React Query ; UI state = Zustand ; local = `useState`. Pas de fetch dans `useEffect`.
- **Vues explicites** : afficher un écran = une vue BFF (`overview`, `me`, page enrichie) ; jamais de
  fan-out, `.find()` sur une liste, compteur dérivé de `totalElements`, ni de recherche générique.
  Détail : [`best-practices/.frontend/server-state.md`](../../best-practices/.frontend/server-state.md).
- **Mutations optimistes** (recette TanStack Query) : `onMutate` patche **toutes** les vues observables,
  `onError` restaure, `onSettled` réconcilie **après un délai** (projection Axon différée, 2 s).
- **Temps réel** : les read models `GameState` et `Ticket` sont des **folds purs** de
  `EventEnvelopeResponse` (REST d'historique + push STOMP, dédup par `sequenceNumber`).
- Fichiers `src/components/**` = vendored (shadcn/maquette) : règles fast-refresh désactivées dans `eslint.config.js`.

---

## 6. État d'avancement

### Refonte des contrats BFF ↔ web (big-bang)

- **Surface migrée** : plus aucun `POST /search` ; vues dédiées (`/api/me`, `/api/home`,
  `/api/topics/{id}/overview`, `/api/profiles/{id}`, listes enrichies, `/api/matchmaking/tickets`,
  `TicketNotification`).
- **Calculs client supprimés** : facettes catégories, compteurs d'abonnements, badge de défis,
  historique de duels mergé, résolution des noms/avatars, estimation d'XP — tous composés par le BFF.
- **Matchmaking** : read model `Ticket` (`SEARCHING → MATCHED(gameId) | CANCELLED`) sur
  `/topic/matchmaking/tickets/{id}` ; bascule automatique vers l'arène.
- **Duel** : `POST /{id}/abandon` gère aussi les parties non démarrées (plus de repli client).

### Vérifié

- `typecheck` / `lint` / `build` / `test` (Vitest) verts.
- E2E Playwright à rejouer sur stack complète (`npm run e2e`).

### Limites connues

- Lots C backend (ticket matchmaking dédié, complétion des défis asynchrones, historique leaderboard
  profond) : voir plan de refonte BFF.
- `quizup-mobile` n'est pas aligné sur cette surface (migration dédiée).

---

## 7. E2E Playwright (stack complète requise)

`npm run e2e` — chaque parcours assert **0 erreur console** :

- `bot-duel.spec.ts` — 7 rounds puis résultat ;
- `matchmaking.spec.ts` — 2 joueurs, appariement en direct puis arène (fold ticket, sans polling) ;
- `async-challenge.spec.ts` — record puis replay ;
- `forfait.spec.ts` — déconnexion → forfait ;
- `presence.spec.ts` — `En ligne` → `Vu il y a …`.
