# AGENTS.md — quizup-web

> Interface **web React** de QuizUp (Vite + React 19 + TypeScript + Tailwind v4 + **HeroUI v3**).
> Source de vérité design : `product/maquettes` (iso shadcn — la maquette reste la référence
> fonctionnelle mais n'est plus iso-rendu : le web utilise le **look HeroUI par défaut**).
> Conventions : `best-practices/.frontend/`.
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

- Vite 8, React 19, TypeScript strict, Tailwind v4 + HeroUI v3 (`@heroui/react`, React Aria — pas
  de Provider), React Query, Zustand, Zod + React Hook Form, `oidc-client-ts`, `@stomp/stompjs`
  (temps réel). Les composants viennent **directement de `@heroui/react`** (pas de couche vendored) ;
  les tokens de couleur sont ceux du thème HeroUI (`bg-surface`, `text-muted`, `bg-accent`, `text-danger`…),
  plus les tokens custom `--duel-*` / `--rank-*` / animations `qu-*` conservés dans `index.css`.
  Le thème clair/sombre est piloté par `ThemeProvider` (Zustand + anti-FOUC) qui synchronise
  `.dark` **et** `data-theme` sur `<html>` (mécanisme lu par HeroUI).
- Structure (cf. `best-practices/.frontend/folder-structure.md`) :

```
src/
  routes/            # react-router (couche mince) + lazy par page
  features/<nom>/    # domain/ (contrat partagé : modèles + règles pures, import direct cross-feature)
                     # lib/ (services de la feature)  hooks/  components/  pages/  stores/  application/ (duel)
                     # index.ts  = API publique (hooks/services/composants)
                     # pages.ts  = point d'entrée des routes (lazy)
  shared/{components,hooks,stores,types,utils,theme}/   # cross-feature (types api/notifications, primitives)
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
npm run dev            # http://localhost:5173 (stack locale, .env.development)
npm run dev:prod-local # https://app.quizup.cnadjim.fr (services de PROD, voir ci-dessous)
npm run typecheck      # tsc -b (solution tsconfig)
npm run lint
npm run build
npm run test           # Vitest
npm run e2e            # Playwright : duel bot, matchmaking, async (record→replay), forfait, présence (stack complète)
```

Variables (`.env.development`) : `VITE_API_URL`, `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_REDIRECT_URI`.

### Dev sur l'origine prod mimée (`prod-local`)

L'IdP de prod n'accepte que l'origine `https://app.quizup.cnadjim.fr` (redirect URI, CORS, cookie
`AUTH_TX` SameSite=Lax). Pour valider une UI contre les services de prod sans stack locale, on sert
Vite en HTTPS **sur cette origine exacte** (config `mode === "prod-local"` dans `vite.config.ts`).
Fichier d'env local (ignoré par git, `*.local`) : `.env.prod-local.local` (URLs prod).

Setup machine (une fois) :
```bash
brew install mkcert && mkcert -install          # CA locale (Keychain)
mkdir -p .certs && mkcert -cert-file .certs/app.pem -key-file .certs/app-key.pem app.quizup.cnadjim.fr
echo "127.0.0.1 app.quizup.cnadjim.fr" | sudo tee -a /etc/hosts
# Port 443 → 8443 sans root pour node (pf ; `sudo pfctl -d` pour couper) :
echo "rdr pass on lo0 inet proto tcp from any to 127.0.0.1 port 443 -> 127.0.0.1 port 8443" | sudo pfctl -ef -
```
Puis `npm run dev:prod-local` et ouvrir `https://app.quizup.cnadjim.fr`. ⚠️ Données réelles :
l'OTP envoie de vrais emails et les mutations tapent la prod.

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
| Défis | `GET /api/challenges?box=&status=&page=&size=` ; `GET .../pending-count` ; `GET .../{id}` ; `POST /api/challenges` ; `POST .../{id}/accept|decline|cancel` ; `POST .../{id}/runs` |
| Arène | `POST /api/games` (`BOT|ASYNC`) ; `POST .../{id}/answer` ; `POST .../{id}/abandon` (toujours valide) ; `POST .../{id}/cancel` ; `GET .../{id}/notifications` |
| Matchmaking | `POST /api/matchmaking/tickets` ; `GET|POST .../{ticketId}[/cancel]` ; `GET .../{ticketId}/notifications` |
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
- Fichiers `src/components/animate-ui/**` = vendored (fast-refresh désactivé dans `eslint.config.js`).
- **UI = HeroUI v3** : boutons en `onPress` (pas `onClick`), `isDisabled`/`isPending`, composés
  (`Card.Header`, `Modal.Dialog`, `Select.Trigger`…). Le rendu suit le thème HeroUI par défaut
  (pas de palette shadcn).

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

### Migration shadcn → HeroUI v3 (big-bang)

- **Plus aucun primitif vendored** : `src/components/ui/**` supprimé ; tous les écrans importent
  `@heroui/react` (Button, Card, Select, Tabs, Modal, Drawer, Toast, InputOTP, Chip, ToggleButton…).
- Composites métier relocalisés : `AuthOtpVerify` → `features/auth/components/`,
  `Leaderboard{Card,Podium,Rankings}` → `features/topic/components/`.
- Dépendances retirées : `@base-ui/react`, `cmdk` (+ pile Radix), `input-otp`, `sonner`, `shadcn`,
  `components.json`. Le thème duel (`--duel-*`, styles inline `TOKEN`) et les animations `qu-*`
  sont conservés.
- Toasts : `Toast.Provider` (HeroUI) + `ErrorToasterBridge` (`toast.danger`).

### Vérifié

- `typecheck` / `lint` / `build` / `test` (Vitest) verts.
- E2E Playwright à rejouer sur stack complète (`npm run e2e`) — sélecteurs à ajuster si besoin
  (les composants custom `qu-*` / `data-slot` sont conservés).

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
