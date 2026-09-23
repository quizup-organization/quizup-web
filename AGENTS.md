# AGENTS.md — quizup-web

> Interface **web React** de QuizUp (Vite + React 19 + TypeScript + Tailwind v4 + shadcn).
> Source de vérité design : `product/maquettes` (iso shadcn). Conventions : `best-practices/.frontend/`.

---

## 1. Rôle

Application web de QuizUp. **Lot 1 = Fondations + catalogue** :

- Auth OIDC (Authorization Code + PKCE) — `oidc-client-ts`, client public `web`.
- Coquille : sidebar, topbar, palette ⌘K, navigation basse mobile, thème Clair/Sombre/Système.
- **Accueil**, **Sujets** (recherche/filtres/tri/pagination), **Fiche sujet** (suivi, classement, historique).
- **Personnes** (Abonnements / Abonnés) + **Fiche joueur** (suivre/ne plus suivre, stats V/N/D).
- **Défis** : liste reçus + envoyés, accept/refus (reçus) et annulation (envoyés), création depuis la
  fiche joueur (sélecteur de thème) ; un défi accepté propose **Jouer** (ouvre l'arène).
- **Duel** : bot (difficulté au choix) **ou humain** (matchmaking). Arène `/duel/:gameId` commune ;
  recherche d'adversaire `/duel/search/:ticketId` (polling du ticket → `MATCHED` + `gameId`).
- Profil & Réglages (minimaux).

Hors Lot 1 : duel humain (matchmaking + WebSocket), création de sujets/questions.

---

## 2. Stack & structure

- Vite 8, React 19, TypeScript strict, Tailwind v4 + shadcn (preset `b1aIcEacC`), React Query, Zustand, Zod + React Hook
  Form, `oidc-client-ts`, `@stomp/stompjs` (temps réel).
- Structure (cf. `best-practices/.frontend/folder-structure.md`) :

```
src/
  routes/            # react-router (couche mince) + lazy par page
  features/<nom>/    # domain/ (contrat partagé : modèles + règles pures, import direct cross-feature)
                     # lib/ (services de la feature)  hooks/  components/  pages/  stores/  application/ (duel)
                     # index.ts  = API publique (hooks/services/composants)
                     # pages.ts  = point d'entrée des routes (lazy)
  shared/{components,hooks,stores,types,utils,theme}/   # cross-feature (types api/search/notifications, primitives)
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
`features/<nom>/domain/*` (contrat), jamais du reste d'une feature ; pour la session elle consomme
le `SessionGateway` enregistré au bootstrap (`lib/session.ts`).

---

## 3. Commandes

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc -b (solution tsconfig)
npm run lint
npm run build
npm run e2e        # Playwright : duel bot, async (record→replay), forfait (stack complète requise)
```

Variables (`.env.development`) : `VITE_API_URL`, `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_REDIRECT_URI`.

**CI/CD** : `.github/workflows/ci.yml` (lint + build) et `release.yml` (image GHCR + dispatch deploy)
via `quizup-organization/quizup-reusable-workflows` (`frontend-ci.yml` / `frontend-release.yml`).

---

## 4. Mapping backend (via gateway `:8080`)

| Usage                   | Endpoint                                                                                                                                                                         |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Connexion / inscription | `POST {identity}/api/auth/login-codes` (demande OTP) → `POST {identity}/api/auth/sessions` (vérif) ; `DELETE {identity}/api/auth/sessions/current` (logout) — direct issuer `:8085` |
| Sujets                  | `POST /theme-service/api/topics/search`, `GET .../categories`, `GET .../{id}`                                                                                                    |
| Suivi sujet             | `POST /social-service/api/topic-follows`, `GET|DELETE .../{followId}` (`followId = userId:topicId`), `POST .../search`                                                           |
| Classement              | `GET /leaderboard-service/api/leaderboard/topics/{id}?period=&scope=world                                                                                                        |following|country` |
| Profil / progression    | `GET                                                                                                                                                                             |PUT /profile-service/api/profiles/{id}`, `GET .../progress[/{topicId}]` |
| Présence joueur         | `GET /profile-service/api/presence/{userId}`, `POST .../search` ; STOMP `/topic/presence/{userId}` (session persistante = signal, plus de heartbeat)                             |
| Activité journalière    | `GET /profile-service/api/profiles/{userId}/activity` (streak + graphe)                                                                                                          |
| Historique              | `POST /game-service/api/games/search` (filtres `player1Id`/`player2Id`)                                                                                                          |
| Arène                   | `POST /game-service/api/games/{id}/answer`, `POST .../abandon` (forfait), `POST .../cancel` (annulation) ; question complète (libellés, `imageUrl`, `difficulty`) portée par `ROUND_STARTED` |
| Duel asynchrone         | `POST /game-service/api/games/async` (run solo sans `ghostGameId`, replay avec) ; `POST /social-service/api/challenges/{id}/runs` (enregistrer son run) |
| Défis                   | `POST /social-service/api/challenges/search`, `GET .../{id}`, `POST` (créer), `POST .../{id}/accept|decline|cancel`, `DELETE .../{id}` (suppression réelle)                                         |
| Suivre un joueur        | `POST /social-service/api/user-follows` + `GET|DELETE .../{followId}` (`followId = followerId:followedId`) + `POST .../search` (abonnements/abonnés/compteurs **calculés côté client**) |

`SearchRequest` : `{ filters, sorts, page }` → `PageResponse<T>`.

---

## 5. Conventions

- 1 composant = 1 fichier, export nommé, `interface` pour les props, **jamais `any`**.
- Server state = React Query ; UI state = Zustand ; local = `useState`. Pas de fetch dans `useEffect`.
- **Lecture by-id, pas de search pour une entité** : afficher une ressource = `GET /{id}`
  (clé `[feature, "detail", id]`) ; une recherche ne sert qu'aux listes/filtres. Les règles métier
  pures vivent dans `features/<nom>/domain/`. Détail :
  [`best-practices/.frontend/server-state.md`](../../best-practices/.frontend/server-state.md).
- **Mutations optimistes** (recette TanStack Query) : `onMutate` simule (cancel + snapshot + patch de
  **toutes** les vues), `onError` restaure, `onSettled` réconcilie **après un délai** (projection
  Axon en lecture différée) — ne jamais invalider immédiatement la clé qu'on vient de patcher.
- Fichiers `src/components/**` = vendored (shadcn/maquette) : règles fast-refresh désactivées dans `eslint.config.js`.

---

## 6. État d'avancement — Lot 1 (Fondations + catalogue)

### Livré

- **Shell** : sidebar (shadcn), topbar avec titre + **palette de recherche ⌘K**, nav basse mobile,
  thème Clair/Sombre/Système (Zustand persisté), menu profil.
  Le déclencheur de recherche de la topbar est le **pattern natif shadcn** (`Button variant="outline"`
    + `<kbd>⌘K</kbd>`, cf. doc `Command`), et le canvas de contenu est `bg-sidebar dark:bg-background`
      (gris subtil en clair pour faire ressortir les cartes blanches ; sombre en mode sombre car
      `--sidebar` y vaut `--card`). Les tokens `:root`/`.dark` sont **iso** au preset `b1aIcEacC`.
- **Auth** : passwordless (Zod + RHF) — e-mail → `POST /api/auth/request-code` → code OTP (`/login/code`) →
  `POST /api/auth/verify-code` → **PKCE `oidc-client-ts`** (client public `web`)
  → `/callback` → session Zustand. Google conservé en login social.
  - **Session = store Zustand** (`features/auth/stores/useSessionStore.ts`, même pattern que le
    thème : store source unique + `SessionBootstrap` d'effets, plus de `createContext`). Les tokens
    restent persistés par `oidc-client-ts` ; le store n'est pas persisté.
  - **Refresh robuste** : sur `401`, `api-client` tente un `signinSilent` **single-flight**
    (verrou `navigator.locks` inter-onglets) puis **rejoue** la requête. `clearSession()` purge
    localement (sans révoquer le refresh token) ; seul le logout **volontaire** appelle
    `POST /api/auth/logout`. `automaticSilentRenew` + resync multi-onglets (`storage`).
  - **Anti-FOUC** : script inline dans `index.html` (lit `quizup-theme` avant le premier paint).
- **Accueil** : bandeaux « sujets suivis » + « les plus joués » (carrousels scroll natif, sans fondu
  d'extrémité).
- **Sujets** : recherche debouncée, facettes catégories (17, libellés FR + couleurs), tri, filtre
  « Suivis », pagination serveur (`POST /topics/search`), skeleton/empty/error.
- **Fiche sujet** : bandeau hero (icône, catégorie, tagline, **rang réel** via `/leaderboard/.../me`),
  « Questions complétées », stats `Niveau | Abonnés | Questions`, onglets **Classement** (période/portée) / **Ta
  progression** (historique des duels), suivi du sujet.
- **Profil / Réglages** : identité + progression, barre V/N/D (profil), édition du profil, thème, déconnexion.
- **Personnes / Fiche joueur** : onglets Abonnements/Abonnés (résolution des noms via `profile`),
  recherche + tri, fiche publique (bandeau `ProfileBanner`, suivre/ne plus suivre, compteurs,
  stats V/N/D, duels communs). Suivi en **mise à jour optimiste** (projection `user-follows` différée).
- **Défis** : `/challenges` (liste unique reçus+envoyés), accept/refus/annulation en **mise à jour
  optimiste** du statut ; création via `POST /api/challenges` depuis la fiche joueur (sélecteur de
  thème serveur).
- **Palette ⌘K** : suggestions de sujets via `POST /topics/search` (filtré) + navigation.
- **Aucun endpoint dérivé** : facettes (compteurs par catégorie), suggestions et historique de
  parties sont calculés côté client à partir de `POST /…/search` (`totalElements`, filtres
  `player1Id`/`player2Id`).
- **Qualité** : `ErrorBoundary` (pas d'écran blanc), toasts d'erreur API (sonner, alimentés par un
  bus `lib/error-bus` découplé de l'UI ; 404 ignorés ; **401 → purge de session + redirection
  `/login`**), a11y de l'arène (`role=timer`, `radiogroup`/`radio`, `aria-live` sur le score).
- **Temps réel (STOMP)** : connexions WebSocket via la gateway
  (`ws://…/{game|social|matchmaking|profile}-service/ws/websocket`) **mutualisées par service** (`lib/ws.ts` :
  `subscribeStomp` / `retainStompConnection`) :
    - `/topic/games/{gameId}` → alimente le read model `GameState` (fold) ;
    - `/topic/lobbies/{ticketId}` → alimente le read model `Lobby` ;
    - `/topic/social/{userId}` → rafraîchit les queries (défis, badge, follows) ;
    - `/topic/presence/{userId}` → transitions en ligne/hors ligne.
      La présence est pilotée par la **session STOMP `profile` persistante** (`PresenceConnection`, JWT en `CONNECT`).
      **Aucun polling** (matchmaking, arène).
- **Read model client (`domain/`)** : les notifications game/lobby sont enveloppées (`NotificationEnvelope` :
  `notificationId`, `aggregateId`, `sequenceNumber`, `occurredAt`, `payload`) et **identiques** en REST
  d'historique (`GET /…/{id}/notifications`) et en WS. `features/duel/domain/` porte les read models (`Lobby`,
  `GameState`) et un **fold pur** (garde `default` + exhaustivité TS) ;
  `features/duel/application/notification-stream.ts` valide l'enveloppe, ignore le malformé, ne corrompt
  jamais l'état (`undefined`), fait le bootstrap REST puis l'abonnement WS avec **dédup par `sequenceNumber`**
  (rejeu à chaque `onConnect`). Hooks `useLobby` / `useGameState` via `useSyncExternalStore` (fallback).
- **Duel (bot ou humain)** : `PlayModeDialog` (adversaire en direct via matchmaking, bot + difficulté,
  ou joueur suivi). L'arène `/duel/:gameId` et `MatchmakingPage` sont **entièrement dérivées des read
  models** `GameState` / `Lobby` — plus de lecture de projection, plus de polling. `POST /{id}/answer`, **récapitulatif
  tour par tour** au résultat + **Rejouer**. **Timing serveur** : le round a deux phases (`QUESTION_SHOWN` puis
  `ANSWERABLE`) ; la saisie n'est
  ouverte qu'à `QUESTION_REVEALED` et le chrono est dérivé de `answerDeadlineAt` via `useServerClock`
  (`GET /api/games/time`) — aucune durée d'animation client ne pilote le chrono. Le chrono affiché (barre + numéro, même
  source) est **plein à l'intro**, **décompte à `ANSWERABLE`**, puis **gelé au
  temps de clôture** pendant la révélation (`frozenTimeLeft` = `answerDeadlineAt − closedAt` côté
  serveur, plus de saut à 0). **Intro de tour** : `RoundIntro` (`ROUND_INTRO_MS = 1900`) est affichée avant **chaque**
  question,
  pendant la fin de `ROUND_TRANSITION_MS` (révélation du round clos puis intro du suivant) — elle
  annonce `TOUR x/7` et le badge bonus du dernier tour. Le tour 1 est couvert par `MATCH_INTRO_MS`.
  Recherche d'adversaire `/duel/search/:ticketId` (`POST /api/matchmaking/queue`, `GET .../{ticketId}`, `POST .../{ticketId}/cancel`), bascule sur
  `COMPLETED` + `gameId`. Badge de nav = défis reçus en attente (`search` + `totalElements`). **Question illustrée** :
  si `imageUrl` est présente, l'image s'affiche au-dessus des réponses en **grille 2×2** (cartes compactes) ; sinon
  réponses en colonne. `difficulty`
  (`EASY`/`MEDIUM`/`HARD`/`EXPERT`, `null` si inconnue) est affichée en pastille discrète. **Abandon** : bouton «
  Abandonner » (dialog) → `POST /{id}/abandon` (forfait) avec repli
  `POST /{id}/cancel` si la partie n'a pas démarré.
- **Coquille en duel** : les routes `/duel/:gameId`, `/duel/search/:ticketId` et
  `/challenges/:challengeId` sont rendues **dans** `AppShell` : la sidebar reste visible mais estompée (`inMatch` →
  `pointer-events-none opacity-50`), la topbar et la nav basse mobile sont masquées.

### Vérifié (Playwright, backend réel)

| Contrôle                                                                                       | Résultat |
|------------------------------------------------------------------------------------------------|----------|
| Inscription → PKCE → `/callback` → app                                                         | ✅       |
| Accueil : sujets réels (`Pokémon 1G`, `Histoire Mondiale`…) + libellés FR                      | ✅       |
| Onglet Sujets : recherche + 17 facettes + cartes                                               | ✅       |
| Fiche sujet : `Suivre` / `Classement` / progression                                            | ✅       |
| Palette ⌘K : ouverture, recherche « Pok », navigation fiche                                    | ✅       |
| Réglages : bascule Clair / Sombre                                                              | ✅       |
| Social : suivre un joueur → bouton « Abonné » immédiat + présent dans Personnes/Abonnements    | ✅       |
| Défis : créer depuis la fiche joueur, B voit le défi, accepte → « Accepté » (A et B)           | ✅       |
| Défi accepté → **Jouer** ouvre l'arène (`/duel/{gameId}`)                                      | ✅       |
| Duel bot : lancer depuis un sujet, répondre aux 7 rounds, écran de résultat                    | ✅       |
| Duel : choix de difficulté (dialog) + **Rejouer** (2 duels enchaînés)                          | ✅       |
| Duel **humain** : A et B en file sur le même sujet → match commun → partie 7 rounds → résultat | ✅       |
| **Temps réel** : notifications STOMP (arène, lobby, social) sans erreur console                | ✅       |
| Recherche **insensible aux accents** : « poke » → Pokémon (`nameNormalized`)                   | ✅       |
| Qualité : ErrorBoundary + toasts d'erreur API, a11y arène — sans erreur console                | ✅       |
| Duel : **récapitulatif tour par tour** au résultat                                             | ✅       |
| `typecheck` / `lint` / `build`                                                                 | ✅       |
| Erreurs console durant les parcours                                                            | **0**    |

### Limites connues (Lot 1)

- Duel asynchrone (fantôme) : run solo puis replay depuis le lobby privé (`Jouer mon run` /
  `Rejouer le run de X`), XP attribuée au replay. E2E Playwright à rejouer.
- Duel : bot **et humain**, notifications **WebSocket** (STOMP) via la gateway. L'arène et le
  matchmaking sont pilotés par le **read model de notifications** (fold `GameState`/`Lobby`) :
  **aucun polling**. Le match humain bascule sur `COMPLETED` + `gameId`.
- Création de sujets/questions : hors périmètre (retirée de la maquette).

### E2E Playwright (stack complète requise)

`npm run e2e` — chaque parcours assert **0 erreur console** (`attachErrorCapture` +
`assertNoConsoleErrors`) :

- `bot-duel.spec.ts` — 7 rounds puis résultat ;
- `matchmaking.spec.ts` — 2 joueurs, appariement en direct puis arène (fold WS, sans polling) ;
- `async-challenge.spec.ts` — record puis replay ;
- `forfait.spec.ts` — déconnexion → forfait ;
- `presence.spec.ts` — `En ligne` → `Vu il y a …` ;
- inscription/PKCE et sujets via les helpers communs (`e2e/helpers.ts`).
