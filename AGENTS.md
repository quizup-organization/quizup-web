# AGENTS.md — quizup-web

> Interface **web React** de QuizUp (Vite + React 19 + TypeScript + Tailwind v4 + shadcn).
> Source de vérité design : `product/maquettes` (iso shadcn). Conventions : `best-practices/.frontend/`.
> **Contrat backend normatif** : [`services/quizup-bff/AGENTS.md`](../../services/quizup-bff/AGENTS.md) § 3.

---

## 1. Rôle

Application web de QuizUp (Lot 1) :

- Auth OIDC (Authorization Code + PKCE) — `oidc-client-ts`, client public `web`. **Renouvellement
  piloté** (`automaticSilentRenew` désactivé) : `useSessionRefresh` vérifie l'échéance chaque
  minute + à la reprise d'onglet/réseau, le client HTTP rejoue sur `401` (single-flight
  `navigator.locks`). Un échec **transitoire** (réseau/5xx) ne purge jamais la session ; un échec
  **définitif** (`invalid_grant`) ou un `401` `urn:quizup:authentification:unknownUser` (compte
  disparu, base réinitialisée) termine la session avec une **raison** (`expired`/`unknownUser`)
  affichée en bandeau sur `/login`.
- **Accueil** : « Tes sujets suivis » n'est **rendue que si l'utilisateur suit au moins un sujet**
  ; « Nouveaux thèmes » = tri theme `RECENT` (`updatedAt desc`, mis à jour par les éditions de
  sujet **et de questions**) ; « **Les plus joués en ce moment** » = parties des **24 h** de
  **toute la communauté** (via `game`, aucun filtre joueur), section **masquée** quand la fenêtre
  est vide, et dont « Explorer le catalogue » ouvre le tri `MOST_PLAYED`.
- Coquille : sidebar, **topbar collante en verre dépoli** (le contenu défile dessous), palette ⌘K,
  **navigation basse mobile flottante** (5 onglets — Accueil, Sujets, Personnes, Notifications avec
  badge non-lues, Profil ; framer-motion, masquée en éditeur d'avatar et en duel), thème
  Clair/Sombre/Système.
- **UX mobile native** : sur mobile, topbar et nav basse se **masquent au scroll vers le bas** et
  réapparaissent dès que l'on remonte. Un **contenu remis en page** (changement d'onglet, filtrage,
  liste plus courte, page de résultats ajoutée) fait émettre au navigateur un `scroll` de rognage /
  ré-ancrage qui **n'est pas un geste** : il ne bascule pas le chrome (`isRelayout`,
  `shared/utils/scroll-direction.ts`) — un clic sur un onglet ne doit jamais faire apparaître la
  topbar et la nav basse. Exceptions : routes immersives (ni l'une ni l'autre) et
  `/settings/avatar` (topbar et nav basse masquées en mobile au profit des bandeaux collants
  preview/onglets/actions). Le scroll
  applicatif est **mémorisé par entrée d'historique** (retour = position restaurée, navigation =
  haut de page — le chrome est recalé **visible**, jamais laissé masqué par le scroll de la page
  quittée ; un changement de **query seule** — onglet, filtre — reste, lui, strictement
  geste-driven). Les bandes de filtres deviennent une ligne compacte **collante en verre dépoli**
  (même `backdrop-blur` que la topbar et la nav basse), composée de la **recherche + bouton
  « Filtres » → bottom sheet Arc UI** (Sujets, Personnes, classement de sujet) ; elles suivent la
  topbar via `--qu-topbar-offset` (piloté par `AppShell`) et restent donc visibles quand elle se
  replie ; les sections du sheet sont **repliables (accordéon)**.
  Le catalogue Sujets passe en **scroll infini** (sentinelle `IntersectionObserver`).
- **Accueil** (carrousels **suivis / nouveaux thèmes / les plus joués** + sections horizontales
  **« Tes défis en attente »** (reçus/envoyés) et **« Tes salons en attente »** (salons ouverts),
  dissociées — à la place de l'ancienne carte unique), **Sujets** (recherche/filtres/tri
  `POPULAR|MOST_PLAYED|ALPHA|RECENT` — « Les plus suivis », « Les plus joués » (compteur
  communautaire de parties, theme), « Ordre alphabétique », « Nouveautés » —, scroll
  infini), **Fiche sujet** (suivi, classement, **maîtrise du sujet dans le bandeau** sous les
  statistiques — même emplacement que la barre V/N/D du profil — et **historique complet** dans
  l'onglet « Parties », partage social du thème avec QR).
- **Personnes** (Abonnements / Abonnés) + **Fiche joueur** (suivre/ne plus suivre, **stats V/N/D
  globales du joueur consulté** dans le bandeau — plus de face-à-face).
- **Défis** : défi nominatif créé depuis la fiche joueur **ou** depuis la popup « Lancer un duel »
  d'un sujet (mode « Défier un joueur » → parcours en 3 étapes : **qui** défier, **où** chercher
  (tes abonnements `/api/profiles/{id}/following`, tes abonnés `.../followers`, ou la **recherche
  universelle** `/api/suggestions`), puis recherche/sélection — sans rappel du sujet dans la popup)
  via
  `POST /api/challenges` : l'état du défi envoyé (TTL 1 h, annulation) vit dans la section d'accueil
  **« Tes défis en attente »** et l'invité reçoit une **invitation live** `CHALLENGE_RECEIVED`
  (accepter/refuser). Une **revanche** est un défi nominatif portant le `gameId` de la **partie
  terminée d'origine** (envoyé depuis la page résultat, validé côté BFF) : badge « Revanche » sur
  les cartes d'accueil et titraison « Revanche » de l'invitation ; l'acceptation mène toujours à la
  salle (jamais à la partie passée).
  À l'acceptation, la salle est créée et l'écran de défi bascule vers `/rooms/{roomId}`.
  Un visiteur non connecté ouvrant un lien de salon `/join/{id}` est renvoyé vers `/login` puis
  restauré sur le salon après authentification (cible mémorisée `quizup.returnTo`, portée par le
  `state` OIDC et rejouée par `/callback` ; filet au montage de `AppShell`).
  Un client tiers (Grafana/ArgoCD/mobile) arrivant via identity transmet `?continue=<authorize>` :
  la cible est mémorisée (`quizup.continue`) et reprise après login (OTP et social) au lieu du flux
  SPA, pour rejoindre le client d'origine.
  La popup propose aussi appariement public, bot et salle privée à partager (lien `/join/{id}`, QR,
  partage social WhatsApp/X/Facebook/Telegram + partage natif). La salle est **temps réel** :
  chaque joueur y **apparaît** (`POST /rooms/{id}/join`, commande unique client-driven : présence
  et, pour le second humain, enregistrement) ; le **stepper** d'avancement (Joueurs → Profils →
  Questions → Lancement) est **wrappé en jaune** puis passe **au vert dès la fin de la préparation**
  (la partie est **créée immédiatement** : plus de compte à rebours de départ, l'expiration du
  salon reste visible), puis la salle
  redirige vers l'arène ; un joueur **hors ligne ne ferme plus le salon** (la présence n'entre pas
  en jeu) et un salon jamais lancé **expire après 1 jour**. « **Retour** » quitte l'écran
  **sans fermer le salon** (l'invité est notifié quand l'autre rejoint et peut y revenir via
  l'inbox ou la section « Tes défis en attente ») ; seul l'initiateur peut **annuler** le salon —
  action directe proposée sur les cartes « Tes salons en attente » de l'accueil (bouton rouge,
  visible du seul initiateur via `RoomView.canCancel`).
- **Notifications** : page `/notifications` (nav top-level) + cloche de topbar : inbox complète
  (filtre **non lues par défaut** / toutes, pagination, lu/tout lire, tout supprimer). Les lignes
  sont **informatives** : le texte vaut lecture et navigue vers la cible (profil, duel/salon, accueil
  pour une invitation), le swipe propose « Marquer comme lue/non lue » (vers la gauche) et
  « Supprimer » (vers la droite), reflétés dans le menu « … » desktop (≥ 1024) — les actions
  Accepter/Refuser vivent
  sur les cartes « défis en attente » de l'accueil (et dans la modale live), poussée sur
  `/topic/notifications/{userId}`. Chaque notification temps réel déclenche un **toast
  cliquable** (`notificationToast`, ton coloré selon l'issue — succès pour « défi accepté »,
  danger pour « défi refusé ») dont le clic **vaut lecture** et navigue vers sa cible,
  **sauf sur les écrans immersifs** (duel/salons) ; les invitations de défi restent couvertes par
  leur modale live. Une invitation **supprimée en temps réel** (`NOTIFICATION_DELETED`, ex. défi
  annulé par le lanceur) ferme la modale et retire la carte d'accueil ; accepter un défi
  **re-vérifie son statut** avant la commande (annulé/expiré/déjà tranché ⇒ message dédié, aucune
  commande ni navigation erronée). Un **toast éphémère « X est en ligne »** est aussi poussé aux abonnés d'un
  joueur qui se connecte (`/topic/follow-presence/{userId}`, avatar inclus, clic = fermeture,
  jamais persisté). Préférences persistées dans Réglages, complétées d'un **système de sons**
  synthétisés WebAudio (moteur partagé `shared/audio/`, motifs « style iOS » sans fichier audio) :
  la notification reçue joue un motif **selon son type** (générique pour les suivis et défis
  reçus, montée pour un défi accepté, descente douce pour un refus) **hors écrans immersifs** et
  sur push relayé quand l'onglet est masqué (best-effort autoplay). Un **interrupteur unique**
  (section « Sons » des Réglages, `useSoundStore`) coupe tous les sons de l'app (notifications,
  duel — réponses **et** accumulation de points —, résultat, tic-tac des countdowns, confirmations
  de succès) ; les
  **gestes de gestion de l'inbox** (marquer
  lue/non lue, supprimer, tout marquer lu, tout supprimer) jouent le ding discret de succès —
  ouvrir une notification reste silencieux. **Quitter un écran coupe ses sons** : chaque
  changement de route appelle `stopChimes` (`useStopSoundsOnNavigate`, monté dans `AppShell`) et
  chaque hook sonore le rappelle à son **démontage** — les notes déjà planifiées (jingle, salve,
  tic-tac continu) s'arrêtent net, jamais de son orphelin après une navigation.
  L'appariement public n'est
  **pas** notifié : l'écran de recherche bascule en direct vers l'arène et **annule le ticket** si on
  le quitte. Les salons éphémères ne sont pas consultables : leur trace durable (invitation, issue)
  vit dans l'inbox.
- **PWA installable** : `public/manifest.json` (+ icônes `public/icons/`), `theme-color` et metas
  `apple-mobile-web-app-*`. `beforeinstallprompt` n'étant émis qu'une fois tôt, il est capté **au
  boot** (`initInstallPromptCapture` dans `main.tsx` → store partagé `shared/stores/useInstallStore`)
  puis rejoué par le bouton. Un **bandeau d'incitation** (`InstallBanner`) s'affiche en tête de
  coquille (hors écrans immersifs), masquable définitivement (`bannerDismissed` persisté) ; la
  section « Application » (`InstallAppSection`) reste disponible dans Réglages. Les deux sont
  **masquées** si l'app est installée ou si le navigateur ne permet pas l'installation (Firefox,
  Safari macOS…) — règle pure `shouldOfferInstall` ; elles n'apparaissent que pour le bouton natif
  (Chrome/Edge) ou les consignes iOS (Partager → écran d'accueil, prérequis du push). Badge
  d'icône via la Badging API (`useAppBadge`, compteur non-lus).
- **Mise à jour de l'app** : `vite.config.ts` émet `dist/version.json` (`{ version, buildId }`) et
  injecte `__APP_BUILD_ID__` ; `useAppVersion` compare le build distant (`fetch` `no-store`, au
  montage + toutes les 5 min + focus/visibilité) et `UpdateBanner` — épinglé hors scroll sous
  « Partie en cours », hors écrans immersifs — propose « Recharger » (`location.reload()`).
  Fermeture mémorisée par `buildId` (`quizup.updateBanner.dismissedBuild`). Silencieux en dev.
- **Notifications push** : canal appareil en complément du STOMP — le SW (`public/sw.js`) reçoit
  les push (payload structuré `type`/`actorPseudonym`/`path`), compose le texte FR, route le clic
  (invitation → `/rooms/{sourceId}`, défi accepté → `/game/{gameId}` ou `/rooms/{sourceId}`,
  follow → `/players/{actorId}`, sinon `/notifications`) et
  **supprime la notification OS si une fenêtre de l'app est visible et focalisée** (`visible && focused` :
  un écran verrouillé laisse la visibilité « visible » mais pas le focus). Le SW **relaie le payload à
  tous les onglets ouverts** (`postMessage QUIZUP_PUSH`) ; `usePushMessages` rejoue alors les
  invalidations React Query (inbox + badge, vues défi/salon, `games.active` pour un défi accepté)
  et ré-affiche la modale live pour une invitation — même quand le STOMP est en veille. Abonnement géré dans
  Réglages (`PushNotificationSetting`) et resynchronisé à chaque session (`usePushSubscriptionSync` :
  re-souscription silencieuse, rebind au login, retrait au logout). **Première ouverture de la PWA
  installée** : demande de permission automatique une seule fois (`useFirstRunPushPrompt`, flag
  `quizup.push.firstRunAsked`) — iOS exige un geste, la tentative y est silencieuse et Réglages
  reste la voie d'activation (iOS ≥ 16.4 : PWA installée obligatoire).
- **Images** (visuels de sujets, questions, bannières de sujet/profil) : préchargées dès que les
  données sont disponibles (`shared/hooks/usePreloadImages` + `shared/utils/image-preload`, priorité
  basse pour les listes, haute pour un écran imminent) et **mises en cache client** par le Service
  Worker `public/sw.js` (cache-first, hôtes `commons.wikimedia.org` — seed miroré — **et**
  `media.quizup.cnadjim.fr`). `TopicIcon` expose `loading`/`fetchPriority` (bannière en
  `eager`/`high`).
- **Upload d'images** : composant partagé `shared/components/media-upload.tsx` (aperçu,
  pré-redimensionnement canvas 1600 px, retrait, repli « coller une URL ») → hook
  `features/media/hooks/useUploadMedia` → `POST /api/media` (multipart, cf. BFF AGENTS). Intégré à
  la création de sujet (couverture), la gestion du sujet (couverture + **bannière de fiche**),
  l'éditeur de question (image) et les Réglages (bannière de profil) ; affichage derrière l'avatar
  (`ProfileBanner`) et en tête de fiche sujet (`TopicDetailPage`).
- **Duel** : **entraînement contre bot** (« S'entraîner avec un robot », difficulté au choix —
  **aucune XP**, et **aucun badge ni titre** : l'acquisition est réservée aux parties contre des
  humains) **ou humain** (matchmaking, XP pleine). Arène `/game/:gameId` commune ;
  recherche d'adversaire `/matchmaking/:ticketId` (read model **ticket** alimenté par STOMP) :
  fenêtre de recherche de **10 s** (compte à rebours + tic-tac), à l'échéance le ticket
  **expire** et une popup propose *Refaire une recherche*, *S'entraîner contre un robot*
  (choix de difficulté) ou *Annuler* (retour **natif**, cf. `useGoBack`) — **aucun repli bot
  automatique** ; la
  recherche comme le duel bot passent par la **salle** (`/rooms/:roomId`), unique point d'entrée de
  préparation (le bot la rejoint automatiquement).
  La partie **démarre immédiatement à sa création** (présence garantie par la salle) :
  plus de salle d'attente côté arène — l'écran ouvre directement sur l'intro, le temps que la trame
  `GAME_STARTED` (`firstRoundAt`) arrive. Les images de questions sont préchargées dès
  `GAME_CREATED` (`questionImageUrls`) pour ne pas pénaliser les connexions faibles au moment du reveal.
  **Synchronisation de l'arène** : `domain/arena-timeline.ts` projette le fold en une **scène
  unique** (`sceneAt(game, now)`) à partir des seuls instants serveur (`firstRoundAt`,
  `shownAt`/`revealAt`, `answerDeadlineAt`, `closedAt`/`nextRoundAt`) — une animation n'est jouée
  que si sa fenêtre serveur est active et reprend à son point exact (`elapsedMs`), jamais de rejeu
  d'une fenêtre écoulée ni d'écran figé (`overdue` ⇒ rejeu de l'historique REST). L'horloge
  (`lib/server-clock.ts`) est ré-ancrée sur chaque trame live **et** à la reprise d'onglet
  (`visibilitychange`/`focus`/`pageshow`/`online`) ; la saisie suit la phase serveur `ANSWERABLE`
  sans verrou dépendant d'une horloge cliente périmée. `GamePage` est montée avec `key={gameId}`
  pour qu'un changement de partie (rejouer) reparte d'un état local vierge.
  **Sons de l'arène** (`useDuelSounds`) : une réaction par round — bonne réponse dès l'écho
  `PLAYER_ANSWERED` (le clic de réponse débloque l'autoplay), mauvaise réponse, son neutre au
  reveal quand je n'ai pas répondu, et **blip discret quand l'adversaire répond** (humain ou bot,
  en phase de réponse uniquement — silencieux si l'écho tombe au reveal) ; à une bonne réponse, le
  « ding » est suivi de la **salve d'accumulation de points** (`playAccumulationChime`, ticks
  montants dont le nombre suit le gain — `features/game/domain/accumulation.ts`, décalage
  `ANSWER_REVEAL_STAGGER_MS`, annulée si l'on quitte l'arène) ; la jauge **et** le compteur de
  score montent ensemble sur `SCORE_REVEAL_MS` (0,9 s, **progression linéaire** : transition CSS
  `.qu-gauge` et compteur piloté par `requestAnimationFrame` qui suivent le même rythme), la
  salve de tics **couvre toute la montée**, grimpe **toujours d'une octave** (même identité sonore
  quelle que soit la quantité) — densité de ticks selon le gain, espacement régulier sur les 0,9 s
  de jauge, après le « ding » ; jamais
  rejoué au
  rechargement ou à la reconnexion (dédup par round, état terminal au montage ignoré), muet en
  revue. Le **chrono de réponse** sonorise aussi ses dernières secondes : même tic-tac que les
  écrans à countdown (`useCountdownTicks`, l'échéance étant `arena.answerDeadlineAt` — instant
  serveur du round) — il **s'estompe dès que j'ai répondu** (réponse envoyée ou écho reçu : plus
  rien à chronométrer de mon côté) et **reprend au round suivant**, quand le timer redémarre ;
  muet onglet masqué.
  **Page résultat dédiée `/game/:gameId/result`** : à `FINISHED`, l'arène redirige (`replace`) vers
  cette page **une fois la révélation du dernier round achevée** (`RESULT_DELAY_MS`, même durée
  qu'une transition de round normale — les animations de score/jauge se terminent avant la
  bascule) (les parties `CANCELED` — no-show/expirée — restent gérées par l'arène ; une ouverture
  directe sur une partie `IN_PROGRESS` renvoie vers l'arène). Cette page joue **une fois** le
  **son du bilan** — `useResultSound`, **dès l'ouverture** (il en tient lieu) : victoire/défaite/
  égalité, forfait compris ; muet pour une partie annulée. Le **donut d'XP** (`LevelRing`) suit le
  même tempo : **aucun état transitoire** (ni `···` ni anneau vide) — sa place est réservée, il est
  invisible tant que la récompense n'est pas projetée, puis il **entre** immédiatement avec
  l'animation d'ouverture de page (`qu-pop`, comme le reste de l'écran), l'arc se remplit et
  « XP gagnée » compte de 0 à sa valeur sur `RING_REVEAL_MS` (1,6 s, **progression linéaire** —
  même rythme que les jauges du duel), **une fois par affichage**. La récompense
  étant le plus souvent déjà projetée à l'ouverture, le donut s'anime **dès l'entrée dans la
  page**, en même temps que le jingle. Le
  **même motif d'accumulation** que l'arène accompagne ce reveal (`useRingAccumulationSound`
  : salve d'XP **synchrone du visuel et couvrant tout le reveal**, grimpant **toujours d'une
  octave** — densité de ticks selon l'XP gagnée (jusqu'à 22), espacement régulier —, une fois par
  affichage, motif court en `prefers-reduced-motion`).
  Elle s'appuie sur
  `GET /api/games/{id}/result` (bilan autoritaire + sujet, adversaire et `botDifficulty` enrichis)
  et sur **un seul** chargement REST de l'historique pour la revue (`useGameReview`, fold local,
  **aucun WebSocket, aucune horloge, aucun calcul d'arène**) ; elle déclenche les invalidations de
  fin de partie (me/home/games.active/topics/profiles, seconde passe à 2,5 s pour la projection).
  **Desktop = deux colonnes dans le mockup tablette** (seulement s'il y a des questions à
  revoir — sinon pile seule centrée, sans carousel vide) : à gauche la pile bilan identique au
  mobile
  (largeur bornée 460 px, avatars alignés sur les colonnes de noms — plus d'avatars aux bords) ;
  à droite le **carousel de revue shadcn** (`ReviewDeck`, shadcn/embla) : une question par vue —
  le **même contenu que la bottom sheet tactile** — navigation par glisser, flèches clavier ou
  **boutons libellés « Précédent » / « Suivant »**, pied à barre de progression et compteur.
  **Tactile** : pile plein écran + chevron **DETAILS** qui ouvre la **bottom sheet** de revue
  (`QuestionReviewDialog`, élargie à `min(100%, 52rem)` quand la place le permet) qui accueille le
  **même `ReviewDeck`** — le chevron
  est **toujours rendu** (invisible et hors flux desktop) pour que la pile garde la même
  disposition en compact même sans question à revoir.
  Bilan : issue colorée (victoire cyan / défaite rose / égalité orange) avec **mention du
  forfait** (« Ton adversaire a abandonné » / « Tu as abandonné » — `forfeiterId` du fold de revue),
  avatars à anneaux colorés + scores animés hors avatars, titres + niveaux **figés à l'instant de la
  partie** (vue `/result`), boîtes **Score du match / Bonus rapidité (inclus) / Bonus victoire / XP
  totale** (`reward` rempli dès l'attribution asynchrone — polling court, jamais d'estimation
  client), **anneau de niveau fidèle à `../../product/images/img_6.png`** (`LevelRing` : corail =
  XP gagnée sur le duel, blanc = XP restante avant le niveau suivant, rouge dérivé du bouton
  Rejouer ; remplissage de l'arc + **deux compteurs solidaires** animés au reveal de la récompense
  — `useRingReveal` : « XP gagnée » monte de 0 à sa valeur pendant que « XP pour le niveau X »
  **décompte** du restant d'avant le duel à celui d'après, la somme des deux restant égale au total
  de l'anneau ; les callouts sont ancrés au conteneur pleine largeur (position absolue
  `shrink-to-fit`), donc le libellé replie au lieu de déborder de l'écran).
  **Variant entraînement** (duel bot, `botGame` du bilan) : les boîtes de récompense n'ont pas de
  sens — `StatBoxes` passe à **3 boîtes** (score du match, bonus rapidité, bonnes réponses
  `correctAnswers/totalRounds`) et `TrainingNote` remplace le `LevelRing` (annonce « Entraînement —
  pas d'expérience », **sans repère de niveau**, texte lisible) ; la salve d'accumulation est muette d'elle-même
  (XP nulle).
  sortie par icône **X**
  (`useGoBack`), boutons **Revanche** (duel humain, défi portant le `gameId` de la partie
  terminée) / **Rejouer** (bot) + **Nouvel adversaire** — **empilés en compact**
  (`tablet-up:grid-cols-2`), côte à côte à partir de la tablette
  (matchmaking). La **revanche** passe par un **défi nominatif** (`POST /api/challenges`, flux défi
  existant : inbox + invitation live → room → partie) : la game ne possède plus la revanche.
  Plus de partage ni de signalement depuis cet écran.
  **Review des questions** (`ReviewQuestion`, une seule source pour le `ReviewDeck` — carousel
  shadcn desktop **et** bottom sheet tactile) : fond sombre duel, rejoue **exactement la
  composition de l'arène** figée en reveal (même
  `MatchHeader`, mêmes jauges et `QuestionBody`), **état figé sans animation**, avec le **repère
  « premier à répondre »** et le **temps de réponse de chaque joueur** sous son avatar ;
  navigation par glisser/flèches/boutons **« Précédent » / « Suivant »**. Le flux immersif complet
  (arène, VS, résultat, room, recherche, join) vit dans le cadre `data-slot="game-frame"` posé
  par `AppShell`.
- Profil & Réglages (sur `/profile` : **« Modifier le profil »** en action primaire → `/settings`,
  **badge crayon sur l'avatar** → `/settings/avatar`, et **« Partager »** → dialogue social avec QR
  vers `/players/{userId}` ; dans le bandeau, la **jauge de niveau** (`ProgressBanner` : % du niveau
  courant + XP restante avant le suivant, à l'image de la barre « questions complétées » des
  fiches thème) **au-dessus** des stats (Parties / Abonnés / Abonné à) et **sans divider** avec
  l'en-tête, puis la section
  **« Sujets joués »** — **titre hors carte**, donut **maison** **posé dans une carte**
  (`TopicsPlayedDonut`, à l'image de
  `product/images/img_9.png` : anneau de parts colorées, **compteur au centre de chaque part**,
  libellés extérieurs reliés par une pastille + un tracé pointé ; géométrie pure dans
  `account/domain/topics-played-chart.ts`) de répartition des **parties humaines** par sujet
  (couleurs éditoriales, 6 parts + « Autres »), alimenté par `GET /api/profiles/{id}/topics` et
  masqué sans
  partie ; **édition d'avatar** en page dédiée `/settings/avatar` (aperçu live dans
  un bandeau collant **en verre dépoli**, onglet « Style » + onglets par groupe collants, sections en
  cards, enregistrement explicite Valider/Annuler — confirmation par toast). Seul le style DiceBear
  **Micah** est actif pour le moment (`AVATAR_STYLE_IDS` ; `lorelei`/`notionists` conservés dans le
  registry mais désactivés, onglet « Style » masqué tant qu'un seul style est actif) ; les
  définitions sont **chargées à la demande** (seul `micah` est embarqué au boot ; `lorelei`/
  `notionists` sont des chunks dynamiques rendus par `UserAvatar` avec repli initiales — ne pas
  réintroduire d'import statique) ; le changement
  de style repart de l'avatar dérivé du seed dans ce style. Le fond **transparent est retiré** du
  nuancier et tout avatar sans fond explicite prend le fond par défaut du style (blanc Micah).
  Les anneaux d'avatar (fiche sujet, bandeau profil) sont portés par un **wrapper bordé externe**
  (jamais de `border` sur le visuel, qui rognerait l'image). L'éditeur **démarre de
  l'avatar courant** (options persistées, sinon options résolues du seed via `seedAvatarOptions`)
  et « Réinitialiser » remet le preset par défaut du style. Sur mobile, la topbar est masquée sur cette
  page (le bandeau preview + les onglets la remplacent, ancrés à `--qu-topbar-offset`). Les champs
  du profil sont sauvegardés **par champ** (texte au blur après validation, selects immédiatement)
  — plus de bouton Enregistrer global.
- **Progression** : les
  **titres thématiques** — le joueur choisit le **titre porté** parmi ceux qu'il a débloqués
  (grade atteint dans un sujet) ; seul le **libellé** est composé côté client (grade traduit +
  nom du sujet dans sa langue), le serveur ne persiste que la clé `topicId:GRADE` — et la
  **collection de badges** (tout le catalogue, une **section par famille** `VOLUME · 3 sur 6
  débloqués`, **une famille = une échelle**) — **six paliers** rendus par `BadgeMedallion` :
  **aplat uni d'une teinte par palier** (`TIER_COLORS` — `#B4723C` bronze, `#8E9AA6` argent,
  `#D8A62B` or, **`#5BB8CE` platine**, `#12876F` émeraude, **`#9B8CF0` diamant** ; plein quand le
  palier est acquis, **teinté opaque** quand il est verrouillé), emblème de l'**échelle** (13
  familles distinctes + 4 exploits ayant chacun le leur, `badgeIcon`) — aucun dégradé, aucune
  ombre, aucun fond translucide. Les **tuiles** (`BadgeTile`) portent le libellé (2 lignes
  réservées) et le **pied d'état** `Bronze · 🔒` / `Bronze · ✓ vert` : **aucune progression**
  (ni compteur ni barre) — elle vit dans la **fiche**. Un palier acquis passe en **vert
  `success-600`** (bordure + fond plein mélangé à la surface, coche verte) — le palier garde sa
  couleur (rareté), le vert porte l'état. Les six paliers d'une famille sont un **rail
  horizontal** en compact et une **grille de six colonnes** dès la tablette ; **le bandeau de
  filtres précède l'en-tête** « Badges » et filtre **côté client** (recherche sur le libellé +
  état `Tous|Acquis|À débloquer`, persisté dans l'URL) ; la **fiche** d'un badge (critère
  d'obtention — **les exploits ont leur propre condition**, `ONE_SHOT_CONDITION_KEYS` — et
  progression chiffrée) s'ouvre dans une **modale unique** (`AppDialog`, bottom sheet Arc en
  tactile). **Les titres** gardent leur carte **dépliable**
  (`ExpandableCard`, action « Afficher ce titre » / « Retirer le titre » dans le panneau) avec le
  **même code vert** pour un grade atteint (`TITLE_CARD_ACCENT`, fond plein), la pastille gardant
  la couleur du grade et le titre porté l'accent primaire. Le bandeau de profil et la
  fiche joueur affichent le titre porté (repli sur le
  titre de compte transitoire). Les codes de
  badge inconnus du web s'affichent avec le libellé renvoyé par le serveur (pas de release
  nécessaire pour un nouveau badge).
- **Atelier sujet** (`features/topic-authoring`) — **désactivé pour le MVP**, réactivable via
  `FEATURE_FLAGS.topicAuthoring` (`shared/feature-flags.ts`) : entrées UI masquées et routes
  `/topics/new` / `/topics/:id/manage` remplacées par l'écran « Bientôt disponible »
  (`ComingSoonPage`). Description de la feature (état à sa réactivation) : intégré à la page
  **Sujets** via le **filtre** `?mine=true` (« Mes sujets », à côté de « Suivis ») + bouton
  « Créer un sujet » dans l'en-tête —
  pas d'entrée de nav dédiée ; le filtre affiche la **grille standard** (le bandeau de gestion a
  été retiré) avec un badge « Brouillon »/« Archivé » sur les sujets non publiés ; `mine` est
  **exclusif** de `q`/`category`/`followed`/`sort` côté BFF (activer un autre filtre ou saisir
  une recherche quitte « Mes sujets »).
  L'**édition** d'un thème se fait depuis sa **fiche** (`/topics/:id`) via le bouton
  « **Éditer le thème** » sous « Lancer un duel », rendu **uniquement au créateur** (`canManage`)
  et pointant vers
  `/topics/new` (nom FR ≤ 255 obligatoire + nom EN optionnel, description, catégorie, emoji,
  couleur, illustration URL, aperçu live) pour la création et `/topics/:id/manage` (édition du
  sujet **champ par champ**, liste des questions tous statuts, approbation/rejet, ajout/édition de
  question FR + EN optionnelle, publication à 7 questions approuvées) pour la gestion. Les
  questions passent par une garde propriétaire côté BFF (403).

---

## 2. Stack & structure

- Vite 8, React 19, TypeScript strict, Tailwind v4 + shadcn (preset `b1aIcEacC`), React Query, Zustand, Zod +
  React Hook Form, `oidc-client-ts`, `@stomp/stompjs` (temps réel). Les utilitaires Tailwind du
  package `shadcn` sont **vendored** dans `src/styles/shadcn-tailwind.css` (le package npm a été
  retiré du lockfile : vulnérabilité transitive `braces` sans correctif amont ; la CLI reste
  utilisable via `npx shadcn@latest`).
- Structure (cf. `best-practices/.frontend/folder-structure.md`) :

```
src/
  routes/            # react-router (couche mince) + lazy par page
  features/<nom>/    # domain/ (contrat partagé : modèles + règles pures, import direct cross-feature)
                     # lib/ (services de la feature)  hooks/  components/  pages/  stores/  application/ (game)
                     # index.ts  = API publique (hooks/services/composants)
                     # pages.ts  = point d'entrée des routes (lazy)
  shared/{components,hooks,stores,types,utils,theme}/   # cross-feature (types api/notifications, primitives)
  shared/realtime/    # moteur de stream STOMP (fold idempotent, replay REST, trous de séquence)
  shared/clock/       # horloge serveur (offset ré-ancré sur les trames live, échéances fiables)
  components/ui/      # primitifs shadcn (vendored)
  components/animate-ui/ # primitifs animate-ui (vendored)
  lib/{api-client,api,endpoints,config,query-client,query-keys,session,error-bus,ws}/   # infra uniquement
  test/               # setup Vitest (matchers DOM) + garde-fous statiques d'architecture
```

**Features** (une par contexte métier) : `auth`, `shell` (coquille : nav, topbar, ⌘K, thème,
bannières PWA/version), `account` (Mon profil, Réglages, éditeur d'avatar), `home`, `topics`
(catalogue), `topic-detail` (fiche sujet), `topic-authoring`, `follows` (listes Abonnements/Abonnés),
`player` (fiche joueur + domaine profil + historique), `notifications` (inbox + push + invitations),
`challenges` (défis nominatifs), `rooms` (salles), `matchmaking` (appariement public), `game`
(duel : arène, résultat, revue **et** lancement play-mode), `progression` (titres thématiques +
collection de badges), `media` (upload).

Les **contrats de notification temps réel** vivent dans le `domain/` de leur feature
(`game-notification.ts`, `room-notification.ts`, `matchmaking-notification.ts`) ;
`shared/types/notifications.ts` ne porte que l'enveloppe `EventEnvelopeResponse` et l'inbox.

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
npm run lint       # ESLint (dont règles type-aware sur les sources applicatives)
npm run format     # Prettier (non gardé en CI — relancer avant release)
npm run build
npm run test       # Vitest (node pour domain/lib, jsdom pour composants/hooks)
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

| Écran                  | Endpoints                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coquille               | `GET /api/me` ; `GET /api/suggestions?q=&limit=` (⌘K) ; `GET /api/clock`                                                                                                                                                                                                                                                                                                                                                                                             |
| Accueil                | `GET /api/home` (`followedTopics`, `trendingTopics`)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Sujets                 | `GET /api/topics?q=&category=&followed=&sort=&page=&size=` ; `GET /api/topics/facets?q=&followed=` ; `GET /api/topic-categories`                                                                                                                                                                                                                                                                                                                                     |
| Fiche sujet            | `GET /api/topics/{id}/overview` ; `PUT                                                                                                                                                                                                                                                                                                                                                                                                                               | DELETE /api/topics/{id}/follow`;`GET /api/topics/{id}/leaderboard?period=&scope=&page=&size=` |
| Atelier sujet (auteur) | `POST /api/topics` (`{ names: { fr, en? }, … }`) ; `GET /api/topics?mine=true&page=&size=` ; `GET /api/topics/{id}/questions?page=&size=` ; `POST /api/topics/{id}/questions` ; `PUT /api/topics/{id}/name` (`{ language, name }`) \| `description\|category\|emoji\|color\|image-url\|banner-url` ; `POST /api/topics/{id}/publish` ; `POST /api/questions/{id}/translations\|approve\|reject` ; `PUT /api/questions/{id}/text\|answers\|correct-answer\|image-url` |
| Médias                 | `POST /api/media` (multipart `file`, JPEG/PNG ≤ 5 Mo) → `{ id, url, … }` ; `DELETE /api/media/{id}` ; `PUT /api/profiles/{id}/banner` (`{ bannerUrl }`)                                                                                                                                                                                                                                                                                                              |
| Personnes              | `GET /api/profiles/{id}/following?q=&sort=&page=&size=` ; `.../followers?...`                                                                                                                                                                                                                                                                                                                                                                                        |
| Fiche joueur           | `GET /api/profiles/{id}` ; `PUT                                                                                                                                                                                                                                                                                                                                                                                                                                      | DELETE /api/profiles/{id}/follow` ; `GET /api/profiles/{id}/badges` (collection : catalogue complet + progression) ; `GET /api/profiles/{id}/titles` ; `PUT /api/profiles/{id}/title` (`{ titleKey }`, `null` efface — titre porté, grade exigé) |
| Historique             | `GET /api/profiles/{id}/games?topicId=&opponentId=&opponentType=&outcome=&sort=&page=&size=` — **historique complet** (scroll infini) des onglets « Parties » (fiche sujet, scope `topicId` ; **premier onglet des profils** — avant « Statistiques » —, scope `opponentId` sur la fiche joueur), filtres *issue* + *type d'adversaire* et tri, **appliqués côté serveur** (pagination exacte) ; état persisté dans l'URL (`?outcome=&opponentType=&sort=`) |
| Défis nominatifs       | `POST /api/challenges` (`{topicId, opponentId, gameId?}` — `gameId` = revanche) ; `GET /api/challenges/{id}` ; `GET /api/challenges/mine` ; `POST .../{id}/accept\|decline\|cancel`                                                                                                                                                                                                                                                                                  |
| Salles                 | `POST /api/rooms` (`{topicId}`) ; `POST /api/rooms/bot` (`{topicId, difficulty?}`, bot joint automatiquement) ; `GET /api/rooms/mine` ; `GET /api/rooms/{id}` ; `POST .../{id}/join\|leave\|cancel` ; `GET .../{id}/notifications`                                                                                                                                                                                                                                   |
| Notifications          | `GET /api/notifications?unreadOnly=&page=&size=` ; `GET /api/notifications/unread-count` ; `POST /api/notifications/{id}/read` ; `POST /api/notifications/read-all` ; `DELETE /api/notifications/{id}` ; `DELETE /api/notifications` (vider l'inbox) ; `GET /api/notification-preferences` ; `PUT /api/notification-preferences/{category}`                                                                                                                          |
| Arène                  | `GET /api/games?active=true` (reprise, liste, vide si aucune) ; `POST .../{id}/join` ; `POST .../{id}/leave` ; `POST .../{id}/answer` ; `POST .../{id}/abandon` ; `POST .../{id}/cancel` ; `GET .../{id}/notifications`                                                                                                                                                                                                                                              |
| Présence               | `GET /api/presence/{id}` (`404` = jamais connecté)                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Web Push               | `GET /api/push/vapid-public-key` (`404` si non configuré) ; `PUT /api/push/subscriptions` (`{ endpoint, keys: { p256dh, auth } }`, idempotent) ; `DELETE /api/push/subscriptions?endpoint=`                                                                                                                                                                                                                                                                          |

**WebSocket** (`/ws/websocket`, une connexion BFF) :
`/topic/games/{gameId}` (`EventEnvelopeResponse<GameNotification>`),
`/topic/rooms/{roomId}` (`EventEnvelopeResponse<RoomNotification>`),
`/topic/matchmaking/tickets/{ticketId}` (`EventEnvelopeResponse<MatchmakingNotification>`),
`/topic/notifications/{userId}` (`EventEnvelopeResponse<NotificationView>`, plus l'événement
`NOTIFICATION_DELETED` poussé à la suppression),
`/topic/presence/{userId}` (`PresenceView`, sans enveloppe).

---

## 5. Conventions

- 1 composant = 1 fichier, export nommé, `interface` pour les props, **jamais `any`**.
- **Carousel de revue** : le **carousel shadcn natif** (`src/components/ui/carousel`,
  `embla-carousel-react`) remplace l'Arc UI `carousel` sur la page résultat — une question par
  vue, boutons libellés « Précédent » / « Suivant ». (L'Arc UI `carousel` reste vendored mais
  n'est plus utilisé.)
- **Composants Arc UI vendored** (`src/components/arc/`) : `bottom-sheet`, `carousel`,
  `scroll-area`, `swipe-actions`, `stepper`, `countdown`, `donut-chart`, `expandable-card` (CLI
  `npx shadcn@latest add @uiarc/...` ; ne pas passer `--overwrite` sur
  `arc/motion-tokens.ts`/`arc/lib/motion-tokens.ts`, partagés — la CLI le propose à chaque ajout,
  répondre non).
  - **Expandable card** (`@/components/arc/expandable-card/expandable-card`) : carte qui
    **grandit sur place** (largeur + hauteur, `inert` repliée) — support des **titres thématiques**
    (fiche sujet et Réglages) ; un badge en rail ne peut pas s'y déplier (le rail d'un `ScrollArea`
    horizontal est un conteneur de scroll : le panneau serait rogné) — d'où la modal unique
    `AppDialog`. **Patch local** : prop
    `media` (visuel de tête, médaillon ou pastille de grade) rendue dans le trigger **et** garde
    `typeof ResizeObserver === "undefined"` (jsdom) — ne pas réinstaller via la CLI sans les
    reporter.
  - **Donut chart** (`@/components/arc/donut-chart/donut-chart`) : donut animé (parts, légende
    synchronisée, groupement « Autres », masquage, a11y) avec libellés localisés via la prop
    `labels` et formats via `locale` (défauts anglais `en-US` du registry) — **plus utilisé** :
    la section « Sujets joués » du profil rend un donut maison (`TopicsPlayedDonut`).
  - **Countdown** (`@/components/arc/countdown/countdown`) : expiration d'une salle (1 j), TTL des
    défis en attente et échéance de recherche du
    matchmaking (`SEARCHING.deadlineAt`). Toujours brancher `clock={serverNow}`
    (`useServerClock`) pour une échéance serveur fiable ; l'état complet des expirations passe en
    danger via `className="[--countdown-complete:var(--danger)]"` (défaut succès). En `compact`,
    la pastille affiche **toujours heures/minute/secondes** (zéros compris, ex. matchmaking),
    **une seule ligne** (aucune légende) ; hauteur alignée sur les boutons du contexte via `size`
    (`md` par défaut en immersif, `sm` sur les cartes) et largeur étirée par `fullWidth`
    (plafonnée par `max-w-[380px]` sur les écrans immersifs). **Tic-tac** : tout écran affichant
    un countdown sonorise ses **10 dernières secondes** via `useCountdownTicks`
    (`shared/hooks/` : tic/tac alterné chaque seconde, tension — un demi-ton par seconde — sur les
    3 dernières ; muet si l'onglet est masqué, si l'interrupteur « Sons » est coupé ou après
    l'échéance). Les tics tombent **exactement quand la seconde affichée change**
    (`displaySeconds` : `floor` pour le `Countdown` Arc UI — défaut —, `ceil` pour le chrono de
    manche de l'arène) ; en mode **continu** (salon), la cadence est elle aussi calée sur ces
    frontières d'échéance, donc sur le compteur visible. Le **salon** (`RoomWaitingScreen`) passe `continuous` : tic-tac **dès l'entrée**
    dans la salle d'attente (son expiration est à 1 jour, la fenêtre ne sonnerait jamais), sans
    tension tant que l'échéance est loin — elle revient si elle approche vraiment. **Une seule
    échéance par écran** (`nearestDeadline`) : plusieurs countdowns ne superposent jamais leurs
    tics — `PendingDuelsSection` n'arme que la plus proche des deux bandeaux.
  - **Stepper** (`@/components/arc/stepper/stepper`) : progression d'une salle dans
    `RoomWaitingScreen`, wrappé dans un conteneur jaune (`TOKEN.score`) qui passe au vert
    (`TOKEN.correctAccent`) dès `preparationComplete(room.status)` ;
    `current={preparationStep(room.status)}` (read-only, `details="current"`), la description de
    l'étape « Joueurs » reprend le libellé d'attente dynamique (`waitingStatusLabel`).
- **Boutons destructifs — toujours rouges** (`variant="destructive"`, ou `buttonVariants({
  variant: "destructive" })` pour les boutons stylés) : **annuler** (recherche, salon, défi, duel,
  dialogue, formulaire), **abandonner** (arène + confirmation), **effacer / réinitialiser** les
  filtres et l'avatar, **supprimer / vider / retirer** (notifications, image, titre, emoji),
  **se désabonner** et **se déconnecter**. Règle appliquée sans exception, y compris aux
  fermetures de dialogues et aux actions de confirmation. Restent **neutres** : les rejets de
  bandeau (installation PWA, mise à jour) et les bascules non destructives (suivre un joueur).

- **Interrupteurs on/off** : uniquement le composant SpectrumUI `AnimatedSwitch`
  (`@/components/spectrumui/animated-switch`) — `@/components/ui/switch` est supprimé et son
  import bloqué par ESLint. Les composants SpectrumUI vendored vivent dans
  `src/components/spectrumui/` (`animated-switch`) et suivent les tokens du thème. Les gestes de
  liste (swipe actions) viennent d'Arc UI
  (`@/components/arc/swipe-actions/swipe-actions`, `SwipeActions`/`SwipeActionsRow`).
- **Onglets** : uniquement les `Tabs` beui (`@/components/motion/tabs`, variante `pill` adaptée
  aux tokens de l'app) — `@/components/ui/tabs` est supprimé et son import bloqué par ESLint.
  Le composant gère lui-même le scroll horizontal (flèches + masque) : ne pas l'envelopper dans
  un conteneur `overflow-x-auto`.
- **Palettes de couleurs** : `ColorSelector` beui (`@/components/motion/color-selector`) pour les
  choix fermés (éditeur d'avatar, anneau de sélection animé + radio accessible) ; le champ libre
  `<input type="color">` reste réservé à la couleur d'accent d'un sujet (valeur arbitraire).
- **Accordéons** : `@/components/ui/accordion` (shadcn/Base UI) — pour les drawers de filtres,
  passer par `FilterSections`/`FilterSection` (`shared/components/filter-section.tsx`,
  ouverture unique).
- **Bottom sheets mobiles** : composant `@uiarc/bottom-sheet` (Arc UI, drag/peek `detents`)
  vendored dans `src/components/arc/` — remplace `Sheet side="bottom"` pour les filtres
  (`SearchToolbar`, `TopicLeaderboard`), l'emoji picker (`EmojiPickerField`) et la review de fin de
  duel (`QuestionReviewDialog`, fond sombre duel via `surfaceStyle`/`bodyStyle`/`footerStyle`,
  **élargie à `min(100%, 52rem)`** quand la place le permet — replay d'arène plus lisible en
  tablette/paysage). Le
  prop `footer` est **épinglé** sous le body scrollable (donc toujours visible) ; les sheets
  filtres (`SHEET_DETENTS.filters`/`leaderboard`) sont **non réductibles** (detent unique quasi
  plein cadre) pour que l'action « Voir les résultats » ne puisse jamais être masquée par un
  scroll ou une réduction de la feuille — même comportement que les sheets de défi/review. La fondation `src/components/arc/foundation.css` est importée **avant** `index.css`
  (`main.tsx`) ; le thème sombre est exposé par `data-theme="dark"` (posé par `ThemeProvider`, en
  plus de `.dark`) ; les tokens de l'app restent prioritaires via `:root.dark` (garde de
  spécificité) et `--focus-outline` est aligné sur `--ring`. Ne pas réinstaller via la CLI shadcn
  (style Base UI) : elle réécrit `asChild` en `render`, incompatible avec le Dialog Radix d'Arc.
- **Safe areas PWA** : `--qu-safe-top`/`--qu-safe-bottom` (tokens `env(safe-area-inset-*)`,
  0 hors mode installé) ; topbar en `pt-[env(safe-area-inset-top)]`, bandes collantes calées sur
  `--qu-topbar-offset` (inclut l'encoche), nav basse décalée de `--bottom-nav-offset`, modales
  plein écran et sheets bottom avec padding bas — rendu natif iOS/Android installé.
- **Barres système** : `display: standalone` (infos système visibles ; la barre de navigation
  Android reste gérée par l'OS) ; `theme-color` est **dynamique** (mis à jour par l'anti-FOUC puis
  `ThemeProvider`) pour suivre le thème résolu, y compris l'immersion duel sombre.
- **Pull-to-refresh** : le scroller principal de `AppShell` garde l'`overscroll` par défaut pour
  laisser le **PTR natif** du navigateur ; `overscroll-y-contain` est réservé aux routes
  immersives (duel/salons) et aux scrollers d'overlays (dialogs, sheets, menus) pour ne jamais
  rafraîchir la page depuis un overlay.
- **Actions de notifications** : swipe actions Arc UI (`SwipeActions` / `SwipeActionsRow`,
  « Marquer comme lue/non lue » en `leading` avec `keepRow`, « Supprimer » en `trailing`) sur la
  page `/notifications` et dans le panneau de la cloche (variante `framed={false}` : la liste ne
  double pas le cadre du panneau), plus le **menu « … » desktop** (≥ 1024,
  `@radix-ui/react-dropdown-menu`) qui miroite les mêmes actions ; suppression optimiste
  `useDeleteNotification` (patche toutes les vues + compteur non-lus + store d'invitations),
  écho WS `NOTIFICATION_DELETED` ; lecture/non-lecture via `useMarkNotificationRead` /
  `useMarkNotificationUnread`.
- **Contrat device (responsive)** : 3 classes, source unique `src/shared/theme/tokens.ts`
  (`DEVICE`) ↔ variants CSS `compact` / `tablet` / `desktop` / `touch` / `tablet-up`
  (`src/index.css`).
  `compact` (< 640 px) = nav basse + modales plein écran + bottom sheets ; `tablet` (640–1023 px) =
  sidebar en rail replié, sheets conservés, cibles ≥ 44 px ; `desktop` (≥ 1024 px) = sidebar étendue,
  densité compacte. Les cibles tactiles vivent dans les **primitives** via `--control-h-*`
  (44 px sous `touch`), jamais en patch de page ; gouttières via `--page-gutter-x`, topbar via
  `--topbar-h` (**gouttière dédiée `--topbar-gutter-x`** = max 18 px, + safe-areas horizontales
  `--qu-safe-left/right` ; offset des bandes collantes inclus) ; typo = échelle Tailwind + `text-2xs`
  (plancher badges), **jamais** `text-[Npx]`. Détail :
  [`best-practices/.frontend/responsive-sizing.md`](../../best-practices/.frontend/responsive-sizing.md).
- **Garde-fous responsive** : `src/shared/theme/responsive-guard.test.ts` (Vitest statique :
  classes arbitraires, anciens breakpoints, `matchMedia` hors hook device) + `e2e/responsive.spec.ts`
  (matrice 320/393/768/1280 : aucun débordement horizontal, cibles ≥ 44 px et champs ≥ 16 px sous
  1024, chrome par classe, bandes collantes calées).
- **Formulaires** : disposition unique « Réglages » via `shared/components/form-section.tsx`
  (`FormSection` = Card titrée, `FormRow` = libellé + description à gauche, contrôle à droite
  sur 360 px, `stacked` pour un contrôle pleine largeur). Utilisée par Réglages, la création de
  sujet et l'édition du sujet ; à reprendre pour tout nouveau formulaire.
- **Modales mobiles** : `DialogContent` reste une **modale centrée ajustée au contenu**
  (`max-w-[calc(100%-2rem)]`, coins arrondis), plafonnée au `--vvh` du `visualViewport` (clavier
  virtuel compris) — jamais plein écran avec un vide central ; seule la palette ⌘K est explicitement
  plein écran en compact (liste scrollable). Le bouton de fermeture (44 px tactile) impose un
  `compact:min-h-16` sur l'en-tête d'`AppDialog` (sinon il chevauche le séparateur). Les modales de
  **défi/duel** (`PlayModeDialog`, `ThemePickerDialog`) passent en **bottom sheet Arc** en tactile
  via `AppDialog sheetOnTouch`. Ces sheets sont **non réductibles** (`AppDialog` ne garde que le
  plus haut detent) : sinon, à un detent plus petit, le footer d'actions défile sous le viewport
  et disparaît. La modale d'invitation de défi (`ChallengeInvitationDialog`) reste, elle, une **modale
  centrée sur tous les devices** (`AppDialog dismissible={false} showCloseButton={false}`) : réponse
  obligatoire (Refuser/Accepter), ni clic extérieur, ni Échap, ni croix. Les champs de recherche en modale
  sont collants et replient le clavier à la sélection. Les bandes de filtre de pages (`SearchToolbar`) sont collantes
  sous la topbar sur desktop ; sur mobile elles deviennent une ligne compacte **collante** dont le
  bouton « Filtres » ouvre un **bottom sheet Arc UI** (`@uiarc/bottom-sheet`, sections
  `FilterSection` repliables — accordéon à ouverture unique, tri ouvert par défaut — avec
  `FilterOption`). L'offset mobile (`--qu-topbar-offset`) est piloté
  par `AppShell` : la bande suit la topbar quand elle se masque. Le sélecteur d'emoji
  (`EmojiPickerField`) suit le même schéma : popover sur desktop, bottom sheet Arc UI
  quasi plein cadre sur mobile (`autoFocusSearch` désactivé). La palette ⌘K est plein écran
  mobile avec un **bandeau de sortie dédié** (croix mobile seulement ; `showCloseButton={false}`,
  fermeture desktop par Échap / clic extérieur). **Entrée** dans une recherche replie
  le clavier mobile. La nav basse est **masquée tant qu'un champ texte a le focus** (clavier ouvert).
- Server state = React Query ; UI state = Zustand ; local = `useState`. Pas de fetch dans `useEffect`.
- **Commandes par agrégat** : chaque feature possède les commandes de son contexte (`rooms` :
  créer une salle partagée/bot, apparaître, quitter, annuler ; `challenges` : créer, accepter,
  refuser, annuler, revanche ; `matchmaking` : enfiler, annuler ; `game` : répondre, abandonner).
  Les pages **composent** ces briques (ex. `TopicDetailPage` enchaîne `useStartMatchmaking`,
  `useCreateSharedRoom`, `useCreateChallenge`). Les surfaces qui ne font que réagir aux
  notifications (résolution d'invitation : marquer lu, retirer du store live) restent dans
  `notifications` — sens unique `notifications → challenges`.
- **Tests (Vitest)** : les tests de `domain/` et `lib/` purs tournent en environnement `node` ;
  les tests de **composants/hooks** déclarent `// @vitest-environment jsdom` en tête de fichier
  (Testing Library + `jest-dom`, setup `src/test/setup.ts`, `src/test/architecture-guard.test.ts`).
  La chaîne hook → service se teste en mockant `features/<nom>/lib/*` et en fournissant un
  `QueryClientProvider` (cache réel), avec `vi.useFakeTimers()` pour les réconciliations différées.
  `npx eslint .` applique des règles **type-aware** aux sources applicatives
  (`no-floating-promises`, `no-misused-promises`, `await-thenable`) : toute promesse ignorée est
  marquée `void` explicitement (le code vendored `src/components/**` en est exclu).
- **Garde-fou d'architecture** : `src/test/architecture-guard.test.ts` vérifie que chaque
  `features/*/domain/**` reste un contrat pur — aucun import React, `@/lib/*` ni couche interne
  de feature (la seule dépendance admise hors types partagés est le `domain/` d'une autre feature).
  Les constantes/règles pures d'une feature vivent donc **dans son `domain/`** (ex.
  `game/domain/game-constants.ts`), jamais dans `lib/`.
- **État d'URL** : onglets et filtres de navigation (Sujets `?q=&category=&sort=&followed=&mine=`,
  Personnes `?tab=&q=&sort=`, Notifications `?filter=&page=` — absent = non lues, `all` = toutes,
  fiche sujet
  `?tab=&period=&scope=&month=`) sont persistés dans l'URL via `useUrlParam`/`useUrlParamBool`/
  `useUrlParamNumber` (`shared/hooks/useUrlParam.ts`, `replace` par défaut) : un retour restaure
  l'écran à l'identique et les liens sont partageables. La valeur par défaut est retirée de l'URL.
- **Vues explicites** : afficher un écran = une vue BFF (`overview`, `me`, page enrichie) ; jamais de
  fan-out, `.find()` sur une liste, compteur dérivé de `totalElements`, ni de recherche générique.
  Détail : [`best-practices/.frontend/server-state.md`](../../best-practices/.frontend/server-state.md).
- **Mutations optimistes** : `onMutate` patche **toutes** les vues observables (vue propriétaire,
  compteurs, listes dérivées), `onError` restaure, `onSettled` **converge** via
  `shared/utils/optimistic-reconcile.ts` — `reconcileUntil` (boucle bornée lecture par le
  **service**, jamais `fetchQuery`, jusqu'à ce que le serveur reflète l'intention, puis
  `setQueryData` + invalidation des vues satellites ; timeout → invalidation de secours) et
  `removeMatchingFromList` (retrait optimiste). **Jamais** d'invalidation différée one-shot
  (`setTimeout` + `invalidateQueries`) comme seule réconciliation — une relecture périmée
  (projection Axon, cache BFF répliqué) écraserait le patch et le figerait pour le `staleTime`.
  Exception assumée : les mutations sans état prédictible à relire (atelier sujet) utilisent
  `scheduleInvalidate` (différée ~2 s), documentée.

- **Temps réel** : les read models `GameState` et `Ticket` sont des **folds purs** de
  `EventEnvelopeResponse` (REST d'historique + push STOMP, dédup par `sequenceNumber`). Le flux
  (`NotificationStream`) bufferise les trames arrivées dans le désordre, détecte les trous de
  séquence et rejoue l'historique REST (rechargement en file si un chargement est en vol) : plus
  aucune trame de phase perdue silencieusement.
- **Sujets & Personnes — tuiles springboard uniquement** (`shared/components/entity-tile.tsx`,
  style iOS) : visuel **fluide** — carré dont la largeur remplit la tuile, égale à la largeur du
  nom — + nom seul, sans carte, `p-1.5`/`gap-1.5` pour maximiser le visuel ; instancié par
  `TopicTile`/`PersonTile` (`TopicIcon`/`UserAvatar` en `fluid`, initiales et emoji mis à
  l'échelle en `cqw` via `@container`, nom réservé sur **2 lignes** `min-h-8` → hauteur homogène
  des rangées). **Présentation unique, à toutes les tailles** (les cartes sujet/profil
  tablette/desktop ont été retirées) : grilles Sujets sur **3 ou 4 colonnes** en compact
  (réglage « Grille des sujets », `useTopicGridStore`, `topicGridClass`), **5 en tablette, 7 en
  desktop** — espacement resserré en compact (`gap-x-1 gap-y-2`) puis `gap-3` —, Personnes sur
  **3 colonnes** puis 5/7, et carrousels de l'Accueil en tuiles également (`w-[30vw]` en
  compact, `w-36` tablette, `w-40` desktop). Le voyant de présence est ancré en pourcentage
  (`right-[6%] bottom-[6%]`) et les visuels couvrent leur conteneur en positionnement absolu
  (`absolute inset-0`, pas de fond forcé sous l'image).
  **`TopicIcon` porte la forme springboard** (rayon `22 %` + `shadow-md`) sur **toutes** les
  surfaces (fiche sujet — plus de cercle —, historique, défis, ⌘K, duel/attente, création et
  gestion).
  L'**historique de duels** est une **liste de cartes** (`MatchList`) — sujet, adversaire et
  issue colorée (le score revient
  seulement à partir de la tablette, pour les parties terminées ; ni date ni XP, pas de barre
  d'accent) — portée par `GameHistorySection` : **barre de filtres/tri** sur le chrome partagé de
  `SearchToolbar` (bande collante en tablette/desktop, bouton « Filtres » → bottom sheet Arc en
  tactile **sans** champ de recherche), **scroll infini** (page de 20, sentinelle) et état vide
  propre aux filtres (« Effacer les filtres ») distinct de l'état vide de l'écran.
  Tant que l'image réseau n'est pas chargée, `TopicIcon` affiche un **skeleton pulsé**
  (`animate-pulse bg-muted/50`, `motion-reduce` respecté) puis l'image apparaît en fondu
  (`onError` = état chargé, ref `complete` pour les images en cache).
- Fichiers `src/components/**` = vendored (shadcn/maquette) : règles fast-refresh désactivées dans `eslint.config.js`.
- **Banners** (profil + fiche sujet) : `BannerGlow` (`shared/components/banner-glow.tsx`) — halo
  radial `125% 125% at 50% -50%` à 22 %. Fiche sujet : couleur éditoriale du sujet, **repli
  couleur de sa catégorie** (`categoryColor`) ; profil : `--primary` fixe. **`BackgroundBeams` est
  actuellement désactivé** (usages retirés, composant conservé dans `components/ui/` avec ses
  réglages `--beams-web-opacity` / `--beams-gradient-opacity`). Le motif de fond de page
  (`PagePattern`, `assets/background.svg` — le **papier peint doodle officiel de WhatsApp**,
  planche de 374 × 666) est
  carrelé en **masque** : tuile `--qu-pattern-size` (**280 px** — gribouillis ~36 px, la maille
  d'une conversation WhatsApp) et opacité `--qu-pattern-opacity` (`0.05` en clair, **`0.07` en
  sombre** pour atteindre le ton des doodles WhatsApp). Le
  fichier **n'est pas un motif raccord** (tracés coupés au bord de la planche) : ce sont ces deux
  tokens, et eux seuls, qui règlent le rendu.
- **Thème sombre « WhatsApp »** (`:root.dark`, version **neutre** de la capture) : gris **étagés**
  — fond `#121212`, surfaces `#1f1f1f` (cartes/popovers), champs et bordures `#2e2e2e`
  (**opaques** : c'est la pile de surfaces qui les fait lire), textes `#e9e9e9` / `#a0a0a0`,
  destructif `#f15c6d`, sidebar `#161616`, toasts alignés. **Aucune teinte froide** (la première
  passe bleutée `#0B141A`/`#202C33` a été écartée : trop bleue par rapport à WhatsApp).
  **L'accent de marque est inchangé** (primaire, charts, V/N/D, paliers de badges). La scène du
  duel suit : `--duel-bg` et le fond du mockup desktop passent à `#0b0b0b` (neutre).
- **Scrollbar opaque sur le motif de fond** : piste `--background` (12 px), pouce contrasté (hover
  renforcé), Firefox `scrollbar-width`/`scrollbar-color`, `scrollbar-gutter: stable` sur le
  scroller principal. Les bordures des surfaces sont **opaques** (`--border`/`--input` =
  `#2e2e2e` en sombre, ≈ `#e5e5e5` en clair), avec la pile de surfaces neutres (`#121212` →
  `#1f1f1f` → `#2e2e2e`) : c'est cet étagement qui les fait lire. **Toutes les surfaces** (cartes,
  modales, popovers, menus, selects) portent `border border-border` dans les deux thèmes — le
  comportement des tuiles badges (`BadgeTile`) ; pas de ring translucide
  (`ring-foreground/5|10` proscrit, le ring restant réservé aux états sélection/focus). La
  palette ⌘K, plein écran en compact, neutralise sa bordure (`compact:border-0`).

---

## 6. État d'avancement

### Découpage des features (refactor)

- `game` n'héberge plus que le **duel** (arène, résultat, revue) et le **lancement** (wizard
  play-mode, sélecteur de thème) ; **`rooms`**, **`matchmaking`** et **`challenges`** sont des
  features dédiées, avec les contrats temps réel dans leur `domain/`.
- L'infra transverse est sortie : **`shared/realtime`** (moteur de stream STOMP) et
  **`shared/clock`** (horloge serveur).
- **`shell`** ne porte plus le profil : **`account`** (Mon profil, Réglages, éditeur d'avatar) ;
  `useMe` reste dans `shell` (cache viewer partagé — évite le cycle shell ↔ account).
- Renommages : `topic` → `topic-detail`, `people` → `follows`, `MatchList` → `player` ;
  `person-color`, `waiting-topic`, `waiting-status-pill` → `shared/`.
- Découpes internes : `DuelArenaView`, `useQuestionFit`, `useReviewQuestion`,
  `MatchPlayerScore`, `result/*`, `room/*`, fold `game-fold.ts`, `useGameResultSettlement`.

### Qualité & outillage

- **Formatage** : normalisé avec la config Prettier déclarée (`semi:false`, printWidth 80) — la
  garde `prettier --check` **n'est pas branchée en CI** (décision) : relancer `npm run format`
  avant une release pour éviter la dérive.
- **Tests** : `domain/`/`lib/` purs en `node` ; composants/hooks en `jsdom` (Testing Library,
  mocking des services + `QueryClientProvider` réel) ; garde-fous statiques `responsive-guard`
  et `architecture-guard` (pureté des `domain/`).
- **Lint** : règles type-aware (promesses) sur les sources applicatives ; `jsx-a11y` non installé
  (peer deps incompatibles avec ESLint 10).
- **Bundle** : styles d'avatar non embarqués chargés à la demande — le chunk de boot perd
  ~150 Ko gzip.

### Refonte des contrats BFF ↔ web (big-bang)

- **Surface migrée** : plus aucun `POST /search` ; vues dédiées (`/api/me`, `/api/home`,
  `/api/topics/{id}/overview`, `/api/profiles/{id}`, listes enrichies, `/api/matchmaking/tickets`,
  `TicketNotification`).
- **Calculs client supprimés** : facettes catégories, compteurs d'abonnements, badge de défis,
  historique de duels mergé, résolution des noms/avatars, estimation d'XP — tous composés par le BFF.
  **Exception** : les noms de sujet sont exposés en `names` (`Map<Language,String>`) et résolus
  côté client par `topicName(names, me.language)` (repli FR) via le hook `useTopicName`.
- **Matchmaking** : read model `Ticket` (`SEARCHING → MATCHED(roomId) | CANCELLED`) sur
  `/topic/matchmaking/tickets/{id}` ; l'écran de recherche affiche un **Countdown Arc** vers
  l'échéance serveur `SEARCHING.deadlineAt` (« Appariement dans X s ») ; bascule automatique vers
  la **salle** (le bot y est joint automatiquement, les humains y apparaissent via
  `POST /rooms/{id}/join`).
- **Historique d'immersion & transitions** : les écrans immersifs restent des routes (deep links
  push/`/join`), mais la navigation est **canonisée** (`useImmersiveNavigate` : depuis une route
  immersive, toute entrée dans l'immersion **remplace** l'entrée courante) — la pile reste bornée
  à `[écran d'origine, immersion]` même après plusieurs revanches, et la sortie (`useGoBack`)
  revient à l'origine. Les entrées/transitions de phase utilisent `viewTransition` (fondu +
  morph du cadre, désactivé en `prefers-reduced-motion`).
- **Duel** : `POST /{id}/abandon` = forfait (l'adversaire gagne) ; l'auteur de l'abandon reste
  dans l'arène et voit l'**écran de résultat** (défaite) avec la mention « Tu as abandonné », au
  lieu d'une sortie sèche vers la fiche du sujet.

### UX mobile native

- **Masquage au scroll** : hooks `useScrollHeader` (direction, util pur `scroll-direction`) et
  `useScrollRestoration` (mémoire par `location.key`), état partagé dans `AppShell` ;
  `BottomNavBar`/topbar animés par framer-motion.
- **Filtres en bottom sheet Arc UI** : `SearchToolbar` responsive (`useIsMobile`) et
  `TopicLeaderboard` — composant `@uiarc/bottom-sheet` (drag/peek `detents`) ; `FilterSections` /
  `FilterSection` repliables — accordéon Base UI (`/components/ui/accordion`) à **ouverture
  unique**, seule la section tri ouverte par défaut — `FilterOption` (`shared/components`)
  et `FacetOptionList` partagé avec `FacetCombobox` ; bandes collantes mobiles calées sur
  `--qu-topbar-offset`.
- **Scroll infini Sujets** : `useTopicsList` en `useInfiniteQuery` + `useLoadMoreOnIntersect`
  (sentinelle, root = conteneur de scroll via `ScrollContainerProvider`) ; la mutation optimiste de
  suivi (`useTopicDetail`) patche `InfiniteData<Page<TopicCard>>`.
- **Emoji picker** : `EmojiPickerField` en bottom sheet Arc UI mobile (`.qu-emoji-picker`,
  `detents` quasi plein cadre), popover desktop inchangé ; cibles tactiles ≥44 px (topbar,
  nav basse, triggers).
- **Éditeur d'avatar** : seul le style DiceBear `micah` est actif (`AVATAR_STYLE_IDS` ; `lorelei`
  et `notionists` désactivés, définitions conservées) — registry
  `shared/avatar/styles/` (définitions, variantes, palettes, groupes d'édition par style) ; démarre
  de l'avatar courant (`seedAvatarOptions` — options résolues du seed remappées vers `AvatarOptions`,
  test de parité SVG par style) ; fond transparent retiré du nuancier (fond par défaut appliqué à
  tout avatar sans fond explicite, y compris dérivé du seed) ; topbar mobile absente et bandeaux
  preview/onglets/actions collants en verre dépoli (`--qu-topbar-offset`). Le chunk `avatar` pèse
  ~675 Ko brut / ~185 Ko gzip (3 styles importés statiquement) — lazy-load possible si le poids
  devient gênant.

### Dimensionnement responsive (contrat device)

- **Contrat** : `DEVICE` (640/1024) + variants `compact`/`tablet`/`desktop`/`touch`/`tablet-up` ; hook `useDevice`/`useIsTouchLayout` (l'ancien `use-mobile` 768 est supprimé).
- **Tokens** (`index.css`) : `--control-h-xs/sm/md/lg` (tactile 36/44/44/48, desktop 24/32/36/40),
  `--page-gutter-x` (14/20/24), `--topbar-gutter-x` (max 18 px, topbar), `--topbar-h` (56/64),
  `--bottom-nav-h`, `--qu-safe-left/right` ; `--qu-topbar-offset`
  dérivé et consommé par toutes les bandes collantes (mobile **et** desktop) ; `text-2xs` = 11 px.
- **Primitives** : button/input/textarea/select/input-group/input-otp/accordion/menus/tabs/toggle/
  sidebar/fermetures portent le tactile (≥ 44 px sous `touch`) ; les patchs `max-md:size-11` de page
  sont supprimés ; iOS ≥ 16 px sur tous les champs (`desktop:text-sm`).
- **Layout partagé** : `PageHeaderBar` (en-têtes de page, 4 copies), `EmptyState` (8 copies),
  `ProgressBanner` (libellé + détail + % + barre, fiches thème **et** jauge de niveau du profil ;
  épaisseur et arrondis alignés sur la capsule V/N/D via `ProgressTrack`, couleurs shadcn),
  `SHEET_DETENTS` (detents de bottom sheet centralisés), `PageContainer` sur `--page-gutter-x`.
- **Contenu** : grilles de **tuiles springboard partout** (Sujets 3/4 colonnes en compact —
  réglage « Grille des sujets » — puis **5/7** tablette/desktop ; Personnes 3 puis **5/7** ;
  skeleton Sujets = carré fluide + 2 lignes ; espacement `gap-x-1 gap-y-2` puis `gap-3`),
  carrousels de tuiles `30vw` → `w-36` → `w-40` (Accueil), cartes PendingDuels,
  `StatStrip` compact (3 colonnes à 320 px), leaderboard responsive + `ui/select`.
- **Duel desktop** : le flux immersif vit dans un **mockup tablette paysage** (`AppShell`,
  `data-slot="game-frame"`) — 4:3, largeur `min(dispo, hauteur×4/3)` plafonnée 1112px, cadre
  arrondi bordure + ombre centré sur fond `#050506` ; en tactile, plein écran natif sans cadre.
  Le contenu garde les **tailles tablette natives** (seule `--duel-stage-w` borne la composition
  dans le cadre) ; sidebar **retirée** pendant le duel ; **page résultat en deux colonnes** (pile
  bilan bornée à gauche, **carousel de revue shadcn** (`ReviewDeck`, embla) à droite — une
  question par vue, boutons **« Précédent » / « Suivant »**) ; en tactile, pile plein écran +
  **bottom sheet de revue** (`QuestionReviewDialog` élargie à `min(100%, 52rem)`) qui accueille le
  **même `ReviewDeck`** — plus d'overlay desktop
  `review-overlay`.
- **Vérifié** : `typecheck` / `lint` / `test` (dont garde-fou statique) / `build` verts ;
  `e2e/responsive.spec.ts` à rejouer sur stack complète.

### PWA + Web Push

- **Manifest & installation** : `public/manifest.json`, icônes générées (`public/icons/`, sources
  SVG commitées), metas iOS ; `useInstallPrompt` (bouton natif / consignes iOS) dans Réglages.
- **Service Worker** : `public/sw.js` garde le cache images (`quizup-images-v3`) et ajoute `push`
  (suppression si client `visible && focused`) + `notificationclick` (focus/route).
- **Abonnement** : `features/notifications/domain/push.ts` (helpers purs), `lib/push-client.ts`
  (souscription navigateur + binding local anti-fuite inter-comptes), `useWebPush` (Réglages,
  geste utilisateur) et `usePushSubscriptionSync` (monté dans `AppShell`).
- **Badge** : `useAppBadge` (Badging API) sur le compteur non-lus.
- **BFF** : `push_subscription` + `PUT /api/push/subscriptions` (cf. `services/quizup-bff/AGENTS.md`) ;
  clés VAPID locales dans `application-local.yml` (paire jetable), prod via GitOps scellé.

### Historique des parties, badges & maîtrise (harmonisation du display)

- **Historique complet** (onglet « Parties » — **premier onglet des profils**, avant « Statistiques »
  — et onglet « Parties » de la fiche sujet) :
  `useGameHistory` passe en `useInfiniteQuery` (page de 20, `HISTORY_PAGE_SIZE`) et
  `GameHistorySection` porte la **barre de filtres/tri** — *issue* (`ALL|WIN|LOSS|DRAW|
  IN_PROGRESS|CANCELLED`, relative au joueur consulté), *type d'adversaire* (`TOUS|HUMAN|BOT`) et
  *tri* (`RECENT|OLDEST|SCORE`) — appliqués **côté serveur** (`GET /api/profiles/{id}/games`,
  requête `game` filtrable), état persisté dans l'URL. `SearchToolbar` accepte désormais une barre
  **sans recherche** (la place du champ porte le compteur).
- **Badges** : `BadgeTile` (tuile **à plat** : une teinte de palier `TIER_COLORS`, aucun dégradé ni
  ombre, **fond plein** — le vert `success-600` mélangé à la surface marque un palier acquis —,
  pied `palier · 🔒/✓`, **aucune progression**) remplace la carte dépliée `BadgeCard` ;
  `BadgeRail` (rail `ScrollArea` en compact / grille 6 colonnes tablet-up), `BadgeFilterBar`
  (**avant l'en-tête** ; filtre **client** — recherche + état, persisté en URL — sur le chrome de
  `SearchToolbar`) et `BadgeDetail` servi par une **modale unique** `AppDialog` (`sheetOnTouch`,
  detent `SHEET_DETENTS.badge`). Emblèmes : **une échelle = un emblème** (`FAMILY_ICONS` corrigé du
  doublon EXPLOIT/SERIES + `ONE_SHOT_ICONS` pour les 4 exploits), les conditions d'exploit sont
  explicitées (`ONE_SHOT_CONDITION_KEYS`). Famille **`VICTORY`** (duels gagnés) séparée de `VOLUME`
  (duels joués) — côté `quizup-profile` : **le web doit être déployé avant `quizup-profile`**, une
  famille inconnue n'étant pas affichée. Les **titres** (fiche sujet, Réglages) restent des cartes
  dépliables avec le même code vert (`TITLE_CARD_ACCENT`) — l'inline y fonctionne (pas de rail).
- **Barre de maîtrise** de la fiche sujet déplacée **dans le bandeau**, sous les statistiques
  (miroir de la barre V/N/D du profil) — plus d'élément orphelin entre le bandeau et les onglets.

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

- `bot-game.spec.ts` — duel bot via la salle (join automatique du bot) → 7 rounds puis page résultat `/game/{id}/result` ;
- `matchmaking.spec.ts` — 2 joueurs, appariement en direct → salle partagée → arène (folds ticket/salle, sans polling) ;
- `forfait.spec.ts` — déconnexion → forfait ;
- `presence.spec.ts` — `En ligne` → `Vu il y a …` ;
- `room-ready.spec.ts` — salon partagé : présence des deux joueurs puis arène (création immédiate) ;
- `game-review.spec.ts` — fin de duel → page résultat → carousel shadcn desktop (boutons « Précédent » / « Suivant ») / bottom sheet tactile (même carousel) ;
- `rematch.spec.ts` — 2 joueurs, fin de duel → Revanche (défi nominatif) → invitation acceptée → salle ;
- `resume.spec.ts` — bannière « Partie en cours — Rejoindre » et retour dans l'arène ;
- `pwa.spec.ts` — manifest/icônes servis, SW enregistré avec handlers `push`. <br>
  (Le push lui-même se teste manuellement : navigation réelle, stack complète, permission accordée.)
