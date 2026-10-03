# AGENTS.md — quizup-web

> Interface **web React** de QuizUp (Vite + React 19 + TypeScript + Tailwind v4 + shadcn).
> Source de vérité design : `product/maquettes` (iso shadcn). Conventions : `best-practices/.frontend/`.
> **Contrat backend normatif** : [`services/quizup-bff/AGENTS.md`](../../services/quizup-bff/AGENTS.md) § 3.

---

## 1. Rôle

Application web de QuizUp (Lot 1) :

- Auth OIDC (Authorization Code + PKCE) — `oidc-client-ts`, client public `web`.
- Coquille : sidebar, **topbar collante en verre dépoli** (le contenu défile dessous), palette ⌘K,
  **navigation basse mobile flottante** (5 onglets — Accueil, Sujets, Personnes, Notifications avec
  badge non-lues, Profil ; framer-motion, masquée en éditeur d'avatar et en duel), thème
  Clair/Sombre/Système.
- **Accueil**, **Sujets** (recherche/filtres/tri/pagination), **Fiche sujet** (suivi, classement, historique).
- **Personnes** (Abonnements / Abonnés) + **Fiche joueur** (suivre/ne plus suivre, stats V/N/D).
- **Défis** : défi nominatif créé depuis la fiche joueur **ou** depuis la popup « Lancer un duel »
  d'un sujet (mode « Défier un joueur » → sélection via `/api/suggestions`). La popup propose
  aussi appariement public, bot et salon privé à partager (lien `/join/{id}`, QR, partage social
  WhatsApp/X/Facebook/Telegram + partage natif). Le défié reçoit une **invitation live** dans
  l'inbox (accepter/refuser), la salle d'attente redirige vers l'arène dès que la partie est créée.
- **Notifications** : page `/notifications` (nav top-level) + cloche de topbar : inbox complète
  (filtre toutes/non lues, pagination, lu/tout lire, accepter/refuser une invitation), poussée sur
  `/topic/notifications/{userId}` ; préférences persistées dans Réglages. L'appariement public n'est
  **pas** notifié : l'écran de recherche bascule en direct vers l'arène et **annule le ticket** si on
  le quitte. Les salons éphémères ne sont pas consultables : leur trace durable (invitation, issue)
  vit dans l'inbox.
- **Images externes** (visuels de sujets et questions, Wikimedia) : préchargées dès que les
  données sont disponibles (`shared/hooks/usePreloadImages` + `shared/utils/image-preload`, priorité
  basse pour les listes, haute pour un écran imminent) et **mises en cache client** par le Service
  Worker `public/sw.js` (cache-first, contourne les redirections `Special:FilePath` non
  cacheables). `TopicIcon` expose `loading`/`fetchPriority` (bannière en `eager`/`high`).
- **Duel** : bot (difficulté au choix) **ou humain** (matchmaking). Arène `/duel/:gameId` commune ;
  recherche d'adversaire `/duel/search/:ticketId` (read model **ticket** alimenté par STOMP).
  Les images de questions sont préchargées dès `GAME_CREATED` (`questionImageUrls`) pour ne pas
  pénaliser les connexions faibles au moment du reveal.
- Profil & Réglages ; **édition d'avatar** en page dédiée `/settings/avatar` (aperçu live dans
  un bandeau collant, onglets par groupe, sections en cards, enregistrement explicite
  Valider/Annuler — confirmation par toast). Les champs du profil sont sauvegardés **par champ**
  (texte au blur après validation, selects immédiatement) — plus de bouton Enregistrer global.
- **Atelier sujet** (`features/topic-authoring`) : entrée dédiée **Mes sujets** dans la sidebar
  (et menu profil mobile) — **découplé du catalogue** ; `/topics/mine` (bandeau d'onglets
  **Publiés / Brouillons** avec compteurs et bouton « Créer un sujet » à droite,
  même présentation que l'inbox de notifications ; progression `x/7` sur les brouillons),
  `/topics/new` (nom ≤ 25, description, catégorie, emoji, couleur, illustration URL, aperçu live),
  `/topics/:id/manage` (édition du sujet **champ par champ**, liste des questions tous statuts,
  approbation/rejet, ajout/édition de question FR + EN optionnelle, publication à 7 questions
  approuvées). Le propriétaire est signalé par `canManage` sur la fiche ; les questions passent par
  une garde propriétaire côté BFF (403).

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
| Atelier sujet (auteur) | `POST /api/topics` ; `GET /api/topics?mine=true&page=&size=` ; `GET /api/topics/{id}/questions?page=&size=` ; `POST /api/topics/{id}/questions` ; `PUT /api/topics/{id}/name\|description\|category\|emoji\|color\|image-url` ; `POST /api/topics/{id}/publish` ; `POST /api/questions/{id}/translations\|approve\|reject` ; `PUT /api/questions/{id}/text\|answers\|correct-answer\|image-url` |
| Personnes | `GET /api/profiles/{id}/following?q=&sort=&page=&size=` ; `.../followers?...` |
| Fiche joueur | `GET /api/profiles/{id}` ; `PUT|DELETE /api/profiles/{id}/follow` ; `GET .../head-to-head?against=` |
| Historique / activité | `GET /api/profiles/{id}/games?topicId=&opponentId=&page=&size=` ; `GET .../activity?from=&to=` |
| Salons | `POST /api/lobbies` (`{topicId, opponentId?}`) ; `GET /api/lobbies/{id}` ; `POST .../{id}/join|decline|leave|cancel` ; `GET .../{id}/notifications` |
| Notifications | `GET /api/notifications?unreadOnly=&page=&size=` ; `GET /api/notifications/unread-count` ; `POST /api/notifications/{id}/read` ; `POST /api/notifications/read-all` ; `GET /api/notification-preferences` ; `PUT /api/notification-preferences/{category}` |
| Arène | `POST /api/games` (bot) ; `POST .../{id}/join` ; `POST .../{id}/leave` ; `POST .../{id}/answer` ; `POST .../{id}/abandon` ; `POST .../{id}/cancel` ; `GET .../{id}/notifications` |
| Présence | `GET /api/presence/{id}` (`404` = jamais connecté) |

**WebSocket** (`/ws/websocket`, une connexion BFF) :
`/topic/games/{gameId}` (`EventEnvelopeResponse<GameNotification>`),
`/topic/lobbies/{lobbyId}` (`EventEnvelopeResponse<LobbyNotification>`),
`/topic/matchmaking/tickets/{ticketId}` (`EventEnvelopeResponse<MatchmakingNotification>`),
`/topic/notifications/{userId}` (`EventEnvelopeResponse<NotificationView>`),
`/topic/presence/{userId}` (`PresenceView`, sans enveloppe).

---

## 5. Conventions

- 1 composant = 1 fichier, export nommé, `interface` pour les props, **jamais `any`**.
- **Formulaires** : disposition unique « Réglages » via `shared/components/form-section.tsx`
  (`FormSection` = Card titrée, `FormRow` = libellé + description à gauche, contrôle à droite
  sur 360 px, `stacked` pour un contrôle pleine largeur). Utilisée par Réglages, la création de
  sujet et l'édition du sujet ; à reprendre pour tout nouveau formulaire.
- **Modales mobiles** : `DialogContent` passe plein écran sous `sm` (plafonné au `--vvh` du
  `visualViewport`, clavier virtuel compris) ; les champs de recherche en modale sont collants et
  replient le clavier à la sélection. Les bandes de filtre de pages (`SearchToolbar`) sont collantes
  sous la topbar ; **Entrée** dans une recherche replie le clavier mobile. La nav basse est
  **masquée tant qu'un champ texte a le focus** (clavier ouvert).
- Server state = React Query ; UI state = Zustand ; local = `useState`. Pas de fetch dans `useEffect`.
- **Vues explicites** : afficher un écran = une vue BFF (`overview`, `me`, page enrichie) ; jamais de
  fan-out, `.find()` sur une liste, compteur dérivé de `totalElements`, ni de recherche générique.
  Détail : [`best-practices/.frontend/server-state.md`](../../best-practices/.frontend/server-state.md).
- **Mutations optimistes** (recette TanStack Query) : `onMutate` patche **toutes** les vues observables,
  `onError` restaure, `onSettled` réconcilie **après un délai** (projection Axon différée, 2 s).
- **Temps réel** : les read models `GameState` et `Ticket` sont des **folds purs** de
  `EventEnvelopeResponse` (REST d'historique + push STOMP, dédup par `sequenceNumber`).
- **Cartes de sujet** : `shared/components/entity-card.tsx` (bordure/dégradé teintés par la
  couleur du sujet, visuel 46 px, nom display, catégorie en surtitre) — le survol ne joue que sur
  la couleur de bordure.   Instancié par `TopicListCard` (grilles, carrousels, sélecteur de thème).
  Les cartes de profil sont des `Card` shadcn **horizontales** (avatar, nom, niveau, présence) ;
  l'historique de duels garde son style dédié.
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
- `forfait.spec.ts` — déconnexion → forfait ;
- `presence.spec.ts` — `En ligne` → `Vu il y a …`.
