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
  disparu, base réinitialisée) termine la session avec une **raison**
  (`expired`/`unknownUser`/`suspended`) affichée en bandeau sur `/login`. Un `403`
  `urn:quizup:authorization:accountSuspended` termine aussi la session (`suspended`) : le compte
  est bloqué côté identity/BFF, même avec un access token encore valide.
  - Login OTP web : `POST /api/auth/web/request-login-code` puis
    `POST /api/auth/web/login-with-code` (cookie `AUTH_TX`) ; Google :
    `GET /api/auth/web/start-google-login` ; Facebook :
    `GET /api/auth/web/start-facebook-login` (redirections vers le flux OAuth2 navigateur) ;
    logout : `POST /api/auth/web/logout`.
  - Pages légales **publiques** : `/privacy`, `/terms`, `/data-deletion` (feature `legal`), avec
    miroirs statiques `public/privacy.html`, `public/terms.html`, `public/data-deletion.html`
    pour les consoles Meta/Google (URLs exigées à la publication). Les endpoints `/oauth2/**` restent standard et
    ne sont pas préfixés.
- **Accueil** : « Tes sujets suivis » n'est **rendue que si l'utilisateur suit au moins un sujet**
  ; « Nouveaux thèmes » = tri theme `RECENT` (`updatedAt desc`, mis à jour par les éditions de
  sujet **et de questions**) ; « **Top 10 du moment** » = parties des **24 h** de
  **toute la communauté** (via `game`, aucun filtre joueur), **complétée par le classement
  all-time** (`MOST_PLAYED`) pour garantir **10 cartes**, section **masquée** quand aucune carte
  n'est disponible, et dont « Explorer le catalogue » ouvre le tri `MOST_PLAYED`. **Ordre des
  rails : Top 10 du moment d'abord, puis Tes sujets suivis, puis Nouveaux thèmes.** Cartes façon
  FranceTV (`TopicMediaCard`) : **même largeur** pour tous les rails. Le Top 10 utilise une **carte
  5:8 à toutes les tailles** (affiche + **pied intégré** titre/catégorie) ; les autres sections
  utilisent le **paysage 16:9** avec le même pied intégré (hauteur 64 px, même espacement
  titre/catégorie). Rang 1 → 10 : **SVG officiels FranceTV** dans une gouttière de 42 px,
  largeurs intrinsèques (le chevauchement par la carte varie donc par chiffre, comme la
  référence) et hauteur commune ; le SVG du 1 est recadré à gauche pour que son glyphe démarre
  au bord du rail (gouttière de page en tactile, bord du contenu en desktop), et **la première
  carte suit ce recadrage** (gouttière de 25,3 px au lieu de 42, chevauchement de 2 px
  conservé) ; les SVG sont **inversés en thème clair**
  (`invert dark:invert-0`) ; **rayon 10 px, bordure 1 px `--border`, aucune ombre de carte en
  clair**, ombre thémée `--qu-home-card-shadow` en sombre. Les actions de section (« Tout voir »,
  « Explorer le catalogue ») restent **visibles en compact** avec un libellé réduit
  (`SectionHeader.compactActionLabel`), par exemple « Catalogue » pour le Top 10. Le libellé de
  catégorie du pied de carte prend la **couleur éditoriale de sa catégorie**
  (`categoryTextColor`, mélange 70 % avec `--foreground` pour rester lisible dans les deux thèmes).
- Coquille : sidebar, **topbar collante en verre dépoli** (le contenu défile dessous), palette ⌘K,
  **navigation basse mobile fixe par défaut** (option flottante dans Réglages ; 5 onglets — Accueil, Sujets, Social, **Défis** (pastille
  du nombre de défis/salons en attente), Profil ; framer-motion, masquée en éditeur d'avatar et en
  duel), thème Clair/Sombre/Système. **Notifications n'est plus dans la nav basse** : la cloche de
  la topbar reste l'entrée (panneau + « Voir tout » vers `/notifications`) ; la sidebar desktop
  conserve l'entrée Notifications avec son badge non-lues.
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
  « Filtres » → bottom sheet Arc UI** (Sujets, Social, classement de sujet) ; elles suivent la
  topbar via `--qu-topbar-offset` (piloté par `AppShell`) et restent donc visibles quand elle se
  replie ; les sections du sheet sont **repliables (accordéon)**.
  Le catalogue Sujets passe en **scroll infini** (sentinelle `IntersectionObserver`).
- **Accueil** (rails **Top 10 du moment / suivis / nouveaux thèmes**, formats **carte 5:8** pour le
  Top 10 et **paysage 16:9** — plus aucun bandeau d'action : les défis et salons en attente vivent
  dans
  l'espace **Social** ; actions d'en-tête visibles en compact avec libellé réduit), **Sujets**
  (recherche/filtres/tri
  `POPULAR|MOST_PLAYED|ALPHA|RECENT` — « Les plus suivis », « Les plus joués » (compteur
  communautaire de parties, theme), « Ordre alphabétique », « Nouveautés » —, scroll
  infini), **Fiche sujet** (suivi, classement, **maîtrise du sujet dans le bandeau** sous les
  statistiques — même emplacement que la barre V/N/D du profil — et **historique complet** dans
  l'onglet « Parties », partage social du thème avec QR).
- **Social** (`/social`, ex-page Personnes — `/people` redirigé) : **annuaire des personnes**, sans
  onglets. Les directions **Abonnements / Abonnés** (URL `?tab=following|followers` ou
  `?tab=following,followers`, `following` par défaut) sont des **filtres multi-sélection** de la
  barre de recherche — puces sur desktop, section « Afficher » dans la bottom sheet de filtres en
  tactile — avec recherche, tri et grille de tuiles (ex-page Personnes ; voyant de présence **gris
  hors ligne, vert en ligne, jaune suspendu**, même palette que la fiche via `presence-tone`).
  Quand les deux sont actives, la grille affiche leur **union dédupliquée** (un joueur mutuel
  n'apparaît qu'une fois ; `LEVEL`/`ALPHA` trient l'ensemble, `RECENT` conserve Abonnements puis
  Abonnés faute d'horodatage exposé). Au moins une direction reste sélectionnée. Les anciens liens
  `?tab=challenges|rooms` sont **redirigés** vers `/challenges` en conservant leurs filtres.
- **Défis & Salons** (`/challenges`) : page dédiée, entrée **Défis** de la nav basse et de la
  sidebar desktop. Défis **reçus** et **envoyés** + salons ouverts en cartes côte à côte dans un
  **rail horizontal** (type + sujet + joueur, bandeau d'échéance, pied d'actions — accepter/refuser
  inline pour les reçus, annuler en rouge pour les envoyés, **fermer le salon** (destructif) pour
  l'initiateur ; chaque groupe est un rail **horizontal** (`HorizontalRail` : Arc `ScrollArea` en
  desktop, scroller natif **full-bleed** en compact/tablette).
  Les **avatars de sujet** des cartes ouvrent la fiche du sujet (`/topics/:id`), comme l'avatar
  joueur ouvre le profil. Une **barre de filtres unique** — **toujours visible**, y compris pendant
  le chargement ou quand la page est vide — couvre la page : recherche par sujet ou joueur, types
  **multi-sélection** (`Tous`, Reçus, Envoyés, Salons combinables ; `?type=received,sent`) et tri
  par échéance (bientôt / plus tard). La pastille de la navigation **Défis** compte **tout le
  pending** (défis reçus + envoyés + salons ouverts), rafraîchie en direct (STOMP).
- **Fiche joueur** (identité complète, suivre/ne plus suivre,
  compteur **« Parties »** = total toutes parties du joueur ; **face-à-face viewer ↔ joueur** :
  V/N/D et historique de leurs duels communs, **du point de vue du viewer**, sous le titre
  « Tes duels contre X » ; aucun onglet Statistiques/Badges ; **Signaler** un joueur et badge
  public « Compte suspendu »). Le compte
  système bot réduit la fiche à l'**avatar et au nom** (ni niveau, titre, présence, pays, stats,
  onglets, historique, ni actions). Le signalement ouvre `ReportUserDialog`
  (`features/moderation`, motifs HARASSMENT/HATE_SPEECH/INAPPROPRIATE_CONTENT/CHEATING/SPAM/
  OTHER + commentaire) et appelle `POST /api/profiles/{id}/reports` ; la page résultat expose
  aussi « Signaler l'adversaire » avec le `gameId`, en bouton d'action jaune. Le badge suspendu est affiché partout où un
  joueur apparaît (fiche, listes, ⌘K, salons, défis, historique, résultat, classement,
  notifications) ; il ne révèle ni motif ni échéance. Le BFF renvoie
  `403 urn:quizup:authorization:accountSuspended` et le web termine la session avec la raison
  `suspended` (bandeau dédié sur `/login`).
- **Défis** : défi nominatif créé depuis la fiche joueur **ou** depuis la popup « Lancer un duel »
  d'un sujet (mode « Défier un joueur » → parcours en 3 étapes : **qui** défier, **où** chercher
  (tes abonnements `/api/profiles/{id}/following`, tes abonnés `.../followers`, ou la **recherche
  universelle** `/api/suggestions`), puis recherche/sélection — sans rappel du sujet dans la popup)
  via
  `POST /api/challenges` : l'état du défi envoyé (TTL 1 h, annulation) vit sur la page
  **Défis & Salons** (`/challenges`) — le toast « Défi envoyé » est **cliquable** et ouvre cette
  page filtrée sur les défis **envoyés** (`?type=sent`) — et l'invité reçoit un **toast « Nouveau
  défi »** (`CHALLENGE_RECEIVED`) qui ouvre la carte du défi sur la page **Défis & Salons** filtrée
  sur les **reçus** (`?type=received&challenge={id}`, carte scrollée et surlignée quelques
  secondes) : accepter/refuser se fait **sur la carte**, plus aucune modale. Une **revanche** est un défi nominatif portant
  le `gameId` de la **partie
  terminée d'origine** (envoyé depuis la page résultat, validé côté BFF) : badge « Revanche » sur
  les cartes ; l'acceptation mène toujours à la salle (jamais à la partie passée). Sa **durée de
  vie est de 10 s** : le bouton « Revanche » affiche un compte à rebours, et l'invité reçoit une
  **popup dédiée** (Accepter/Refuser, compte à rebours serveur) au lieu du toast « Nouveau défi ».
  La popup est différée sur les écrans immersifs (autorisée sur la page résultat) et supprimée si
  l'échéance est dépassée.
  **Anti-spam** : un défi ne peut pas être dupliqué entre les mêmes deux joueurs sur le même
  sujet (dans les deux sens) ; le joueur est limité à **5 défis PENDING créés** (quota gratuit,
  extension premium côté BFF). Un joueur ne peut avoir qu'**un salon privé/partagé WAITING créé
  par sujet**, et **5 salons privés/partagés ouverts créés** (même quota/extensions). Les salons
  **bot** ont leur propre quota et restent disponibles même si un salon privé est ouvert (un
  salon privé ne bloque jamais l'entraînement, et inversement). Le `PlayModeDialog` désactive les
  joueurs déjà en défi sur le sujet et le choix **salon privé** quand un salon est déjà ouvert,
  mais **jamais le bot** ; le serveur reste l'arbitre (`409`/`429` avec toasts dédiés). Un défi **expiré** disparaît immédiatement
  des cartes et de la pastille Défis (filtre à l'horloge serveur + read model purgé).
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
  l'inbox ou la page **Défis & Salons**) ; seul l'initiateur peut **fermer** le salon — action
  directe proposée sur les cartes **Salons** de la page **Défis & Salons** (bouton rouge, visible
  du seul initiateur via `RoomView.canCancel`).
  Tant que l'adversaire **nommé** n'est pas là (salle de défi/appariement, jamais le bot), un bouton
  **« Wizzer »** (Zap) relance l'attente « façon MSN » — en **pied de salle, au-dessus de
  l'annulation**, en **action primaire (bleu)**, pleine largeur 380 px, visible par les deux
  joueurs : `POST /rooms/{id}/wizz` (cadence **10 s par
  joueur**, bouton grisé avec compte à rebours dérivé du fold `ROOM_WIZZED`, cadence optimiste dès
  l'envoi), confirmation locale (secousse de sa propre fenêtre + motif `WIZZ_CHIME`) ; le
  destinataire reçoit un **toast cliquable → la salle**, le **motif « wizz »** et une **secousse
  plein écran** (`qu-nudge`, `prefers-reduced-motion` respecté) **hors écrans immersifs** — sinon
  notification d'inbox `WIZZ` (une seule par salle, remplacée à chaque relance, expirée quand il
  rejoint ou à la fin de la salle) et Web Push. Le refus de cadence/relance impossible est toasté
  (`urn:quizup:room:wizzCooldown|wizzUnavailable`).
- **Notifications** : page `/notifications` (sidebar desktop + cloche de topbar ; pas d'onglet
  dans la nav basse compacte) : inbox complète
  (filtre **non lues par défaut** / toutes, pagination, lu/tout lire, tout supprimer). Les types
  incluent les follows, défis, salons, relances, **`QUESTION_REPORTED`** (un signalement sur une
  question d'un sujet du joueur ; cible `/topics/{topicId}`, catégorie de préférence `QUESTION`,
  une entrée par signalement) et **`ACCOUNT_SUSPENDED`** (suspension du compte, catégorie
  obligatoire, lisible après réactivation). Les lignes
  sont **informatives** : le texte vaut lecture et navigue vers la cible (profil, duel/salon,
  carte Défis pour une invitation), le swipe propose « Marquer comme lue/non lue » (vers la
  gauche) et « Supprimer » (vers la droite), reflétés dans le menu « … » desktop (≥ 1024) — les
  actions Accepter/Refuser vivent **uniquement** sur les cartes **Défis reçus** de la page
  Défis & Salons. Chaque notification temps réel déclenche un **toast cliquable** (`notificationToast`,
  ton coloré selon l'issue — succès pour « défi accepté », danger pour « défi refusé ») dont le
  clic **vaut lecture** et navigue vers sa cible : le marquage est **optimiste** (toutes les vues
  inbox + compteur) et inconditionnel, sans invalidation susceptible d'être écrasée par une
  projection en retard. Une **demande de revanche** (`CHALLENGE_RECEIVED` + `gameId`) ne produit
  pas de toast : elle est portée par la popup dédiée. Une revanche envoyée ne double pas le toast
  d'inbox « défi refusé » (le bouton d'écran résultat porte l'issue). **Aucun toast sur les écrans immersifs**
  (duel/salle/recherche) : ils sont **mis en file** (`usePendingNotificationToastStore`) et
  rejoués à la sortie, ou dès l'arrivée sur la **page résultat d'un duel** (seul écran immersif
  autorisé). Un défi reçu produit le toast « Nouveau défi » → carte Défis filtrée sur les reçus
  (`/challenges?type=received&challenge={id}`), scrollée et surlignée quelques secondes.
  **Tous les toasts** (confirmations, erreurs, notifications cliquables,
  présence) partagent le **gabarit unique** `ToastCard` via `showToast`
  (`shared/utils/toast.tsx`) : visuel de tête **toujours présent** (pastille de l'icône du ton,
  ou avatar de l'acteur), titre 16 px semibold (obligatoire) et description 14 px
  **optionnelle**, tous deux affichés **en entier** : la hauteur de la carte suit son contenu,
  sans ligne tronquée (les messages de quota sont intégralement lisibles). **Largeur toujours
  constante** :
  la largeur de colonne du `Toaster` (520 px desktop, pleine largeur mobile) est imposée aux
  toasts custom de sonner dans `src/index.css` (`[data-styled="false"]`) et la pile est
  **toujours déployée** (`expand` : aucune carte arrière réduite) ; `sonner` n'est importé que
  par le `Toaster` et cet utilitaire (garde-fou ESLint). Une invitation **supprimée en temps réel** (`NOTIFICATION_DELETED`, ex. défi
  annulé par le lanceur) ferme son toast, la retire de la file et fait disparaître la carte
  Social ; accepter un défi **re-vérifie son statut** avant la commande (annulé/expiré/déjà
  tranché ⇒ message dédié, aucune commande ni navigation erronée). Un **toast éphémère « X est en ligne »** est aussi poussé aux abonnés d'un
  joueur qui se connecte (`/topic/follow-presence/{userId}`, avatar inclus, clic = fermeture,
  jamais persisté). Préférences persistées dans Réglages, complétées d'un **système de sons**
  synthétisés WebAudio (moteur partagé `shared/audio/`, motifs « style iOS » sans fichier audio) :
  la notification reçue joue un motif **selon son type** (générique pour les suivis et défis
  reçus, montée pour un défi accepté, descente douce pour un refus, double « nudge » pour une
  relance — accompagnée d'une **secousse d'écran** `qu-nudge`) **hors écrans immersifs** et
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
  (défi reçu → carte Social, défi accepté → `/game/{gameId}` ou `/rooms/{sourceId}`,
  follow → `/players/{actorId}`, sinon `/notifications`) et
  **supprime la notification OS si une fenêtre de l'app est visible et focalisée** (`visible && focused` :
  un écran verrouillé laisse la visibilité « visible » mais pas le focus). Le SW **relaie le payload à
  tous les onglets ouverts** (`postMessage QUIZUP_PUSH`) ; `usePushMessages` rejoue alors les
  invalidations React Query (inbox + badge, vues défi/salon, `games.active` pour un défi accepté)
  et affiche le toast de la notification — ou le met en file en immersif — même quand le STOMP
  est en veille. Abonnement géré dans
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
  **expire** et une popup propose _Refaire une recherche_, _S'entraîner contre un robot_
  (choix de difficulté) ou _Annuler_ (retour **natif**, cf. `useGoBack`) — **aucun repli bot
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
  **aucun WebSocket, aucune horloge, aucun calcul d'arène**). Le résultat est **privé** : un
  non-participant reçoit `403` et la page affiche « Accès refusé » ; la revue n'est chargée
  qu'après le succès du résultat (`useGameReview { enabled }`), donc un tiers ne déclenche jamais
  `GET /api/games/{id}/notifications`. La page déclenche les invalidations de
  fin de partie (me/home/games.active/topics/profiles, seconde passe à 2,5 s pour la projection).
  **Desktop = deux colonnes dans le cadre immersif élargi** (seulement s'il y a des questions
  à revoir — sinon pile seule centrée, sans carousel vide) : à gauche la pile bilan identique au
  mobile (largeur bornée 560 px, avatars alignés sur les colonnes de noms — plus d'avatars aux
  bords) ;
  à droite le **carousel de revue shadcn** (`ReviewDeck`, shadcn/embla) : une question par vue —
  le **même contenu que la bottom sheet tactile** — navigation par glisser, flèches clavier ou
  **boutons libellés « Précédent » / « Suivant »** (même hauteur, rayon et typographie que les
  `ActionButton` du résultat), pied avec **bouton de signalement jaune pleine largeur** et
  **dots de pagination centrés** (le compteur texte a été remplacé par ces pastilles).
  **Tactile** : pile plein écran + chevron **DETAILS** qui ouvre la **bottom sheet** de revue
  (`QuestionReviewDialog`, élargie à `min(100%, 52rem)` quand la place le permet) qui accueille le
  **même `ReviewDeck`** — le chevron
  est **toujours rendu** (invisible et hors flux desktop) pour que la pile garde la même
  disposition en compact même sans question à revoir.
  Le **signalement tactile** ouvre un **second BottomSheet Arc** au-dessus de la revue
  (`sheetLayer=60`). Les deux feuilles restent **modales** : Radix empile les layers et les focus
  scopes imbriqués. Ne jamais basculer `modal` à `false` sur la feuille hôte pendant qu'elle est
  ouverte : Radix remplace alors `DialogContentModal` par `DialogContentNonModal`, ce qui
  **remonte tout le contenu** (perte du premier clic sur le signalement et flash à la fermeture).
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
  (matchmaking). Le **signalement de l'adversaire** est un **bouton d'action jaune**
  (`TOKEN.gauge`, la teinte de la boîte « Score du match ») pleine largeur sous les deux
  actions. Le chevron **DETAILS** (tactile) reste collé au bas de l'écran : le contenu résultat
  au-dessus est le conteneur `flex-1` qui le pousse. La **revanche** passe par un **défi nominatif
  à TTL 10 s** (`POST /api/challenges`, flux défi existant) : le bouton affiche
  « En attente · N s » ; à l'expiration il **revient à « Revanche »** (toast « Revanche
  expirée ») pour autoriser une nouvelle demande. Seul un **refus explicite** verrouille le
  bouton (« Revanche refusée »). L'invité répond dans une popup dédiée, et la game ne possède
  plus la revanche.
  Plus de partage depuis cet écran. En revanche, chaque question de la revue expose un bouton
  **Signaler** jaune pleine largeur (même style que le signalement du joueur) dans le pied du
  carousel, au-dessus de la navigation : il ouvre un dialogue à motifs multiples
  (`QUESTION`/`IMAGE`/`ANSWERS`) + commentaire optionnel, puis `POST /api/questions/{id}/reports`.
  Le signalement est idempotent tant qu'il est ouvert ; l'icône passe en coche après envoi.
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
  vers `/players/{userId}` ; sous les informations du joueur (**Elo, pays, présence**), le
  **ruban du rang** du titre porté (`TitleRibbon` :
  bannière métallique `src/assets/ruban/ruban-{fer..diamant}.svg` — copies de `product/ruban/*`
  avec le texte baké retiré —, titre **centré** sur le bandeau droit, ajusté en corps puis
  comprimé s'il déborde ; **échelle calée sur l'interface** : 14 rem de large ≈ 57 px de haut,
  bandeau ~26 px, titre ~14 px, police **Inter** (police d'interface, graisse 800) — le rendu
  gravé a été abandonné au profit de la lisibilité) quand un titre thématique est équipé —
  la ligne d'info ne le reprend pas ; dans le
  bandeau, la
  **jauge Elo** (`ProgressBanner` : progression vers le palier suivant, paliers Fer → Diamant) et
  **anneau d'avatar teinté par le palier Elo** (bordure de profil) **au-dessus** des stats (Parties / Abonnés / Abonné à) et **sans divider** avec
  l'en-tête. La bordure Elo des avatars est proportionnelle à leur taille réelle
  (`clamp(1px, 5cqw, 4px)`) ; elle est masquée dans la topbar, la sidebar et l'éditeur d'avatar.
  Puis la section
  **« Sujets joués »** — **titre hors carte**, donut **maison** **posé dans une carte**
  (`TopicsPlayedDonut`, à l'image de
  `product/images/img_9.png` : anneau de parts colorées, **compteur au centre de chaque part**,
  libellés extérieurs reliés par une pastille + un tracé pointé qui **s'arrête à 2,5 unités** du
  texte, **respirant** l'anneau (ancres 83/17, ~8,5 unités d'écart) ; géométrie pure dans
  `account/domain/topics-played-chart.ts`) de répartition des **parties humaines** par sujet
  (couleurs éditoriales, 6 parts + « Autres »), alimenté par `GET /api/profiles/{id}/topics` et
  masqué sans
  partie. Dimensions **par paliers d'écran** (32/36/44 rem, boîte `@container`) avec libellés
  **fluides** (`cqw`, 12 → 16 px, césure automatique — l'anneau reste plein cadre dans la carte,
  dont le padding intérieur est resserré à 8 px — et **0 en compact** — pour libérer les
  colonnes de libellés et les tracés d'attachement)
  et **reveal à
  l'ouverture de l'onglet** (`useDonutReveal` : arcs dessinés, compteurs posés quand leur arc les
  couvre, fondu des libellés — `DONUT_REVEAL_MS`, une fois par affichage, reduced-motion → état
  final) ; **édition d'avatar** en page dédiée `/settings/avatar` (aperçu live dans
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
  **titres thématiques** — **tous les grades atteints** d'un sujet avec **au moins une partie
  humaine terminée** (abandon inclus ; l'entraînement bot, à 0 XP, ne débloque rien), grade
  d'entrée **Novice** compris même à 0 XP ; un grade dépassé reste sélectionnable et la vue
  `/titles` l'expose ; le joueur choisit le **titre
  porté** **uniquement depuis l'onglet Titres d'une fiche sujet** ; les Réglages ne proposent que
  le **retrait** du titre affiché (avec un lien vers le catalogue) ; seul le **libellé** est
  composé côté client (grade traduit + nom du sujet dans sa langue), le serveur ne persiste que
  la clé `topicId:GRADE` — et la
  **collection de badges** (tout le catalogue, une **section par famille** `VOLUME · 3 sur 7
débloqués`, **une famille = une échelle**) — **sept paliers** rendus par `BadgeMedallion` :
  **sceau métallique SVG** par palier (`src/assets/badge/badge-{fer..diamant}.svg`, copies de
  `product/badge` — emplacement central vide), portant l'emblème de l'**échelle** (13 familles
  distinctes + 4 exploits ayant chacun le leur, `badgeIcon`) dans le carré central 104 × 104,
  avec l'encre sombre du métal ; **toujours en couleur**, l'état verrouillé étant porté par un
  **voile sombre sur toute la tuile**. La palette `TIER_COLORS` est
  alignée sur les métaux des SVG (Fer `#3F444C`, Bronze `#B86A32`, Argent `#8C95A3`, Or `#D9A826`, Platine `#8C9FC9`,
  Émeraude `#2FBF77`, Diamant `#5DB4E2`) et pilote aussi les **pastilles de rang**, les
  **points et barres de titre** et les disques de célébration. Les **tuiles** (`BadgeTile`)
  portent le sceau et le libellé (2 lignes réservées) : **aucun pied d'état** — le palier n'est
  plus écrit (le métal du sceau le porte), ni coche/cadenas (la **bordure et le fond verts**
  `success-600` de la carte signalent seuls un palier acquis ; verrouillé = voile sombre sur la
  tuile). **Aucune progression** (ni compteur ni barre) — elle vit dans la **fiche**. Le
  **mot du palier** reste posé dans sa teinte (`TierColor.text` =
  `color-mix(in oklab, fill 70%, var(--foreground))` — lisible AA dans les deux thèmes, le `fill`
  brut échouant en clair pour Or/Platine/Argent/Diamant) dans la **fiche modale** (coche verte sur
  l'objectif) et les titres. La fiche affiche d'abord la **rareté** (« Rareté : Bronze ») dans
  `TierColor.text` ; les cartes dépliables de l'onglet **Titres** font de même avec le rang du
  titre (« Rareté : Fer » … « Rareté : Diamant »). La fiche distingue ensuite l'**objectif** du
  palier et, tant qu'il est verrouillé,
  **ce qu'il reste à faire** (`metricRemaining`, ex. « Encore 1 victoire d'affilée »), sans
  « Débloqué ». Les cartes de badge ont une **taille fixe
  carrée** (156 px à partir de la tablette ; en compact, **1/3 de la largeur du rail** plafonnée
  à 156 px pour afficher **3 cartes**) et vivent dans un **rail horizontal scrollable à toutes
  les tailles**, comme les carrousels de l'Accueil (`HorizontalRail` : Arc `ScrollArea` en desktop
  avec barre en surimpression et fondus ; scroller natif full-bleed en compact/tablette, sans
  chrome et sans masque) ;
  `EXPLOIT` (quatre paliers) garde exactement la même taille de carte que les
  autres ; les paliers verrouillés gardent un **sceau en couleur** et reçoivent un **voile sombre
  sur toute la carte** (`bg-black/35`) ; **le bandeau de
  filtres précède l'en-tête** « Badges » et filtre **côté client** (recherche sur le libellé +
  état `Tous|Acquis|À débloquer`, persisté dans l'URL) ; la **fiche** d'un badge (critère
  d'obtention — **les exploits ont leur propre condition**, `ONE_SHOT_CONDITION_KEYS` — et
  progression chiffrée) s'ouvre dans une **modale unique** (`AppDialog`, bottom sheet Arc en
  tactile). **Les titres** : dans Réglages, le titre affiché s'affiche en **ligne d'état**
  (`SelectRow` statique — visuel de son sujet + libellé composé) avec seulement
  « Retirer le titre » (destructif, visible seulement si un titre est porté) et un lien
  « Parcourir les sujets » ; le **choix** se fait exclusivement dans l'onglet Titres d'une fiche
  sujet. Cet onglet garde sa carte **dépliable** (`ExpandableCard`) avec
  le **même code vert** pour un grade atteint (`TITLE_CARD_ACCENT`, fond plein) ; la carte repliée
  ne porte **que le titre et sa pastille d'état** —
  disque vert à **coche blanche** (`TITLE_CARD_ACCENT.acquiredCheck`) pour un grade atteint, rond
  neutre à cadenas sinon, et un **point de rang** (Fer → Diamant) — la progression XP vivant dans le
  panneau déplié des **grades verrouillés**, à l'image de la fiche d'un badge : critère +
  `XP / seuil` + pourcentage + barre à la couleur du rang ; les grades atteints n'affichent que
  leur état et l'action (la marche vers le grade suivant vit dans la jauge de maîtrise du bandeau).
  L'action « Utiliser ce titre » patche
  `me.equippedTitle` (lu par l'onglet Titres) et `profiles.titles`, puis affiche le toast
  « Titre utilisé » : le titre passe immédiatement à « Affiché ». Chaque titre porte un **rang
  dérivé de son grade** (`TITLE_RANK_BY_GRADE`, miroir de `MasteryGrade.rank()` ; le BFF l'expose
  dans `TitlesView.TitleView.rank`, avec repli local pour un ancien BFF), affiché en pastille dans
  les Réglages et l'onglet Titres ; le panneau déplié de l'onglet Titres ne le rappelle plus
  (seul le point de rang de la carte repliée subsiste). Le bandeau de profil et la
  fiche joueur affichent le titre porté en **ruban teinté par son rang sous les informations du
  joueur** (`TitleRibbon` : bannière métallique du rang, titre centré sur le bandeau droit, à l'image de
  la maquette `img_11.png` — la ligne d'info ne le reprend pas ; repli sur le
  titre de compte transitoire quand aucun titre n'est porté). La **popup de célébration d'un
  titre** en affiche le même ruban en aperçu (libellé du titre dedans), à la place de la
  médaille à couronne et de la pastille de rang. Les codes de
  badge inconnus du web s'affichent avec le libellé renvoyé par le serveur (pas de release
  nécessaire pour un nouveau badge) ; un palier inconnu retombe sur la teinte du bronze.
- **Atelier sujet** (`features/topic-authoring`) — **désactivé pour les joueurs**, activé pour
  les comptes `ROLE_ADMIN` en accès anticipé via `useFeatureFlag("topicAuthoring")`
  (`shared/hooks/use-feature-flag.ts`, flag de base `shared/feature-flags.ts`) : entrées UI
  masquées et routes `/topics/new` / `/topics/:id/manage` remplacées par l'écran « Bientôt
  disponible » (`ComingSoonPage`) pour les autres. Description de la feature (état à sa
  réactivation) : intégré à la page
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
  question FR + EN optionnelle, publication à 7 questions approuvées) pour la gestion. Chaque
  question porte ses compteurs de signalements et un dialogue **Signalements** (snapshot de la
  version signalée, motifs, commentaire, résolution/ignorance) ; le créateur ne voit pas
  l'identité du signalant et ne peut ni réactiver une question suspendue ni la restaurer. Les
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
`social` (espace Social : annuaire Abonnements/Abonnés avec filtres, page Défis & Salons
`/challenges`, cartes défis/salons, barre de filtres, compteur de navigation),
`player` (fiche joueur + domaine profil + historique), `notifications` (inbox + push + toasts différés par l'immersion),
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
| Fiche sujet            | `GET /api/topics/{id}/overview` ; `PUT                                                                                                                                                                                                                                                                                                                                                                                                                               | DELETE /api/topics/{id}/follow`;`GET /api/topics/{id}/leaderboard?period=&scope=&page=&size=`                                                                                                                                                            |
| Atelier sujet (auteur) | `POST /api/topics` (`{ names: { fr, en? }, … }`) ; `GET /api/topics?mine=true&page=&size=` ; `GET /api/topics/{id}/questions?page=&size=` ; `POST /api/topics/{id}/questions` ; `PUT /api/topics/{id}/name` (`{ language, name }`) \| `description\|category\|emoji\|color\|image-url\|banner-url` ; `POST /api/topics/{id}/publish` ; `POST /api/questions/{id}/translations\|approve\|reject` ; `PUT /api/questions/{id}/text\|answers\|correct-answer\|image-url` |
| Médias                 | `POST /api/media` (multipart `file`, JPEG/PNG ≤ 5 Mo) → `{ id, url, … }` ; `DELETE /api/media/{id}` ; `PUT /api/profiles/{id}/banner` (`{ bannerUrl }`)                                                                                                                                                                                                                                                                                                              |
| Personnes (Social)     | `GET /api/profiles/{id}/following?q=&sort=&page=&size=` ; `.../followers?...`                                                                                                                                                                                                                                                                                                                                                                                        |
| Fiche joueur           | `GET /api/profiles/{id}` (`bot=true` ⇒ avatar/nom seulement) ; `GET /api/profiles/{id}/head-to-head?against={id}` (**viewer** en `{id}`, V/N/D viewer ↔ joueur) ; `PUT \| DELETE /api/profiles/{id}/follow` ; `GET /api/profiles/{id}/titles` ; `PUT /api/profiles/{id}/title` (`{ titleKey }`, `null` efface — titre porté, sujet joué + grade exigés) |
| Signalement joueur     | `POST /api/profiles/{id}/reports` (`{ reasons[], comment?, gameId? }`, `201`/`200`) ; le BFF expose `suspended` sur les vues joueur et refuse les comptes suspendus (`403 accountSuspended`)                                                                                                                                                                                                                                                                         |
| Historique             | `GET /api/profiles/{id}/games?topicId=&opponentId=&opponentType=&outcome=&sort=&page=&size=` — **historique complet** (scroll infini) : fiche sujet (`topicId`) ; son propre profil (filtres issue + type d'adversaire + tri) ; fiche d'un autre joueur = **historique du viewer** avec `opponentId = joueur consulté` (filtres issue + tri seuls, **viewer-centric**). Filtres et tri **appliqués côté serveur** (pagination exacte), état persisté dans l'URL (`?outcome=&opponentType=&sort=`) |
| Défis nominatifs       | `POST /api/challenges` (`{topicId, opponentId, gameId?}` — `gameId` = revanche) ; `GET /api/challenges/{id}` ; `GET /api/challenges/mine` ; `POST .../{id}/accept\|decline\|cancel`                                                                                                                                                                                                                                                                                  |
| Salles                 | `POST /api/rooms` (`{topicId}`) ; `POST /api/rooms/bot` (`{topicId, difficulty?}`, bot joint automatiquement) ; `GET /api/rooms/mine` ; `GET /api/rooms/{id}` ; `POST .../{id}/join\|leave\|cancel\|wizz` ; `GET .../{id}/notifications`                                                                                                                                                                                                                             |
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
  `scroll-area`, `swipe-actions`, `stepper`, `countdown`, `donut-chart`, `expandable-card`
  (CLI `npx shadcn@latest add @uiarc/...` ; ne pas passer `--overwrite` sur
  `arc/motion-tokens.ts`/`arc/lib/motion-tokens.ts`, partagés — la CLI le propose à chaque ajout,
  répondre non).
  - **Scroll area** (`@/components/arc/scroll-area/scroll-area`) : rail horizontal à barre en
    surimpression et fondus d'extrémité ; **`wheelToHorizontal` est désactivé par défaut** (la
    molette verticale fait défiler la page, pas le rail) — le passer à `true` pour un rail qui
    doit capter la molette. Patch local à reporter après une réinstallation CLI.
    Les rails de cartes passent par **`HorizontalRail`** (`@/shared/components/horizontal-rail`) :
    **desktop ≥ 1024 px** = cet Arc `ScrollArea` (contenu borné, barre + fondus) ; **compact/
    tablette** = scroller natif **full-bleed** (marges négatives sur `--page-gutter-x`, padding
    interne + safe-areas, `overflow-x-auto`, snap natif) **sans barre ni masque** — le swipe et
    la molette restent natifs et aucune carte ne passe sous un chrome. Ne pas remettre un
    `ScrollArea` brut dans un rail de page. La barre native est masquée par la classe app
    **`qu-hide-scrollbar`** (`index.css`, unlayered) et non par les utilitaires Tailwind : la
    règle globale `.qu-root *` (barre thémée de page) est elle aussi unlayered et gagnerait le
    conflit de couches. Même classe sur les autres scrollers horizontaux (onglets `motion/tabs`,
    puces de facettes) pour qu'aucune barre horizontale n'apparaisse en compact.
  - **Expandable card** (`@/components/arc/expandable-card/expandable-card`) : carte qui
    **grandit sur place** (largeur + hauteur, `inert` repliée) — support des **titres thématiques**
    (onglet Titres d'une fiche sujet) ; un badge en rail ne peut pas s'y déplier (le rail d'un `ScrollArea`
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
- **Boutons destructifs — le rouge est réservé à la destruction** (`variant="destructive"`, ou
  `buttonVariants({ variant: "destructive" })` pour les boutons stylés) : **supprimer / vider /
  retirer** (notifications, image, titre, emoji), **abandonner** une partie (arène + confirmation),
  **refuser un défi** (commande `decline` : suppression de l'invitation en attente côté backend,
  carte « Défis reçus ») et **se déconnecter**. Restent **neutres**
  (`outline`, `ghost`, `secondary` ou primaire) :
  **annuler / fermer / continuer / retour / plus tard** (dialogue, formulaire, recherche, salon,
  défi, duel), **effacer / réinitialiser** des filtres ou un brouillon,
  les rejets de bandeau (installation PWA, mise à jour) et les bascules non destructives
  (suivre / se désabonner). Dans une confirmation destructive, le bouton d'annulation est neutre
  et **seul** le bouton de suppression est rouge. **Exception** : « Tout effacer » dans le footer
  d'une **bottom sheet de filtres** est `destructive` ; les resets hors popup restent neutres.
- **Ordre des actions en compact** : dans le footer d'une popup, le bouton de **confirmation**
  (dernier enfant) est **au-dessus**, l'**annulation en dessous** (`flex-col-reverse` dans les
  bottom sheets et `DialogFooter`). Ne pas réintroduire `compact:flex-row` sur un footer à deux
  actions ; les actions secondaires (précédent, effacer) suivent la même colonne. **Dimension** :
  dans une colonne, ne jamais mettre `flex-1` sur les boutons (cela écrase leur hauteur sur
  `flex-basis: 0`) ; utiliser `w-full` / le stretch du flex. `flex-1` reste réservé aux rangées
  et aux spacers de footer desktop (masqués en `compact`/`touch` selon la surface).

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
  tablette/paysage). Largeur : **100 % en compact et tablette** (standard natif) ; à partir du
  desktop, largeur de lecture bornée à **36rem** et centrée. Le
  prop `footer` est **épinglé** sous le body scrollable (donc toujours visible) ; les sheets
  filtres (`SHEET_DETENTS.filters`/`leaderboard`) sont **non réductibles** (detent unique quasi
  plein cadre) pour que l'action « Voir les résultats » ne puisse jamais être masquée par un
  scroll ou une réduction de la feuille — même comportement que les sheets de défi/review.
  `BottomSheet` expose aussi `layer` (overlay à `layer`, feuille à `layer + 1`) : deux sheets
  **modaux** peuvent ainsi s'empiler (signalement au-dessus de la revue) — Radix gère les layers
  et les focus scopes imbriqués. Ne pas rendre un `AppDialog` Base UI à l'intérieur d'une bottom
  sheet Radix. La fondation `src/components/arc/foundation.css` est importée **avant** `index.css`
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
  `useDeleteNotification` (patche toutes les vues + compteur non-lus), écho WS
  `NOTIFICATION_DELETED` ; lecture/non-lecture via `useMarkNotificationRead` /
  `useMarkNotificationUnread`.
- **Contrat device (responsive)** : 3 classes, source unique `src/shared/theme/tokens.ts`
  (`DEVICE`) ↔ variants CSS `compact` / `tablet` / `desktop` / `touch` / `tablet-up`
  (`src/index.css`).
  `compact` (< 640 px) = nav basse + modales plein écran + bottom sheets ; `tablet` (640–1023 px) =
  sidebar en rail replié, sheets conservés, cibles ≥ 44 px ; `desktop` (≥ 1024 px) = sidebar étendue,
  densité compacte. Les cibles tactiles vivent dans les **primitives** via `--control-h-*`
  (44 px sous `touch`), jamais en patch de page ; gouttières via `--page-gutter-x`, topbar via
  `--topbar-h` (64 px en compact, **gouttière dédiée `--topbar-gutter-x`** = max 20 px, +
  safe-areas horizontales `--qu-safe-left/right` ; offset des bandes collantes inclus) ; typo =
  échelle Tailwind + `text-2xs`
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
  et disparaît. **Plus aucune modale d'invitation de défi** : un défi reçu est un toast cliquable
  vers sa carte Social, où l'acceptation/le refus se font inline. **Exception ciblée** : une
  **demande de revanche** (TTL 10 s) ouvre une popup globale `RematchRequestDialog` (Accepter /
  Refuser, compte à rebours serveur), différée sur les écrans immersifs. Les champs de recherche en modale
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
  notifications (résolution d'invitation : marquer lu) restent dans `notifications` — sens
  unique `notifications → challenges`.
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
  Social `?tab=following,followers&q=&sort=`, Défis `?q=&type=received,sent&sort=&challenge=`,
  Notifications
  `?filter=&page=` — absent = non lues, `all` = toutes,
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
  tablette/desktop ont été retirées) : grilles Sujets sur **3 colonnes par défaut** (4
  sélectionnable) en compact (réglage « Grille des sujets », `useTopicGridStore`,
  `topicGridClass`), puis **auto-fill**
  dès 640 px (`minmax(6rem, 1fr)` — tuiles ~98-110 px, elles ne s'étirent pas sur grand écran
  et les pistes vides d'une grille presque vide sont conservées, `auto-fill` et non `auto-fit`)
  — espacement resserré en compact (`gap-x-1 gap-y-2`) puis `gap-3` —, Personnes sur
  **3 colonnes** puis le même auto-fill. **Exception — Accueil façon FranceTV** : les trois rails
  utilisent `TopicMediaCard`, pas les tuiles springboard, avec une **largeur unique**
  (`w-[58vw]` plafonné à 230 px puis `w-48`/`w-52`) : **carte 5:8 à toutes les tailles**
  (affiche + pied titre/catégorie intégré) pour « Top 10 du moment » ; **paysage 16:9** pour les
  autres sections. Le Top 10 ajoute une gouttière de **42 px**, un écart de **16 px** et les
  **SVG de rang officiels FranceTV** (1 → 10) : largeurs intrinsèques variables, hauteur commune
  (~76 px), `top: 16 px`, donc un chevauchement par la carte identique à la référence pour chaque
  chiffre. Le voyant de présence est ancré en pourcentage
  (`right-[6%] bottom-[6%]`) et les visuels couvrent leur conteneur en positionnement absolu
  (`absolute inset-0`) **sans fond forcé** : les zones transparentes laissent voir la surface
  porteuse, sans liseré blanc.
  **`TopicIcon` porte la forme springboard** (rayon `22 %` + `shadow-md`) sur **toutes** les
  surfaces (fiche sujet — plus de cercle —, historique, défis, ⌘K, duel/attente, création et
  gestion).
  L'**historique de duels** est une **liste de cartes** (`MatchList`) — sujet, adversaire et
  issue des parties terminées en **pastille à icône blanche** sur un **disque assombri**
  (80 % de la teinte + noir, comme la coche d'un titre atteint) ; une carte terminée porte la
  **bordure 40 % / fond 8 %** de la carte de titre débloquée, à la teinte de son issue —
  **victoire `--success-600`** (le vert des titres), **défaite `--loss`**, **nul `--draw`** — et
  le score suit cette teinte. Au survol, seule la **bordure** s'accentue (teinte de l'issue à
  70 %, comme la tuile de badge) : le fond ne change pas ; libellé texte conservé pour les autres
  statuts (carte neutre, bordure `foreground/20` au survol). Le score
  revient seulement à partir de la tablette, pour les parties terminées ; ni date ni XP, pas de
  barre d'accent — portée par `GameHistorySection` : **barre de filtres/tri** sur le chrome partagé de
  `SearchToolbar` (bande collante en tablette/desktop, bouton « Filtres » → bottom sheet Arc en
  tactile **sans** champ de recherche), **scroll infini** (page de 20, sentinelle) et état vide
  propre aux filtres (« Effacer les filtres ») distinct de l'état vide de l'écran. Sur la **fiche
  d'un autre joueur**, la section « Tes duels contre X » interroge l'historique **du viewer**
  (`userId = viewer`, `opponentId = joueur consulté`) et **impose** le scope : le filtre « type
  d'adversaire » et l'ancienne bascule « Contre moi » sont masqués, seuls **Issue** et **Tri**
  restent. Ordre visuel : titre → **barre V/N/D du face-à-face** → barre de filtres → cartes ;
  le titre et la barre vivent dans un **`PageHeaderBar`** (`bg-background` + bordure basse),
  tandis que la barre de filtres et les **cartes restent hors du fond plein**, sur le fond de
  page comme les onglets du profil / de la fiche sujet. Les cartes de cette section masquent
  l'avatar et la ligne « contre X » (`MatchList showOpponent={false}`), redondants avec le
  titre. Son propre profil et la fiche sujet gardent l'adversaire et le filtre de type
  d'adversaire.
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
- **Sidebar — état actif** : les tokens clair sont ceux du preset shadcn **natif**
  (`--sidebar: oklch(0.985 0 0)`, `--sidebar-primary: oklch(0.205 0 0)`,
  `--sidebar-accent: oklch(0.97 0 0)`, etc.). La **surface** active est celle du composant
  natif (`bg-sidebar-accent`, `#f5f5f5`) ; son **libellé et son icône** prennent le bleu
  `--primary` en clair (AA, 4,8:1) au lieu du noir `sidebar-accent-foreground` — règle hors
  layer dans `index.css`, stable au survol et à l'appui. Le survol d'un item inactif reste
  sur `sidebar-accent` ; `aria-current="page"` est posé par `AppSidebar`. En **sombre**,
  l'actif conserve l'accent gris WhatsApp (`#2a2a2a`) et son texte clair.
- **Scrollbar opaque sur le motif de fond** : piste `--background` (12 px), pouce contrasté (hover
  renforcé), Firefox `scrollbar-width`/`scrollbar-color`, `scrollbar-gutter: stable` sur le
  scroller principal. Les bordures des surfaces sont **opaques** (`--border`/`--input` =
  `#2e2e2e` en sombre, ≈ `#e5e5e5` en clair), avec la pile de surfaces neutres (`#121212` →
  `#1f1f1f` → `#2e2e2e`) : c'est cet étagement qui les fait lire. **Toutes les surfaces** (cartes,
  modales, popovers, menus) portent `border border-border` dans les deux thèmes — le
  comportement des tuiles badges (`BadgeTile`) ; pas de ring translucide
  (`ring-foreground/5|10` proscrit, le ring restant réservé aux états sélection/focus).
  **Exception — menus déroulants `<Select>`** : rendu shadcn standard
  (`ring-1 ring-foreground/5` + `shadow-lg`, sans bordure) dans `src/components/ui/select.tsx`.
  La palette ⌘K, plein écran en compact, neutralise sa bordure (`compact:border-0`).
- **Cartes — recette unique, à plat** (`components/ui/card.tsx`, alignée sur la carte de titre
  Arc `ExpandableCard`) : fond `--card`, bordure `1px --border`, rayon `--radius-surface`
  (`rounded-card`, 34 px) et **aucune ombre au repos** (`shadow-none`). En-tête `CardHeader` =
  rangée de 64 px avec visuel de tête 36 px (`CardMedia`), copie (`CardHeading` : titre 14 px
  medium + description 12 px muted) et action à droite (`CardAction`). **Survol d'une carte
  cliquable** (`Card interactive`, `SelectRow`, lignes de classement) : fond **plein**
  `--surface-muted` (classe `CARD_INTERACTIVE_CLASS`), **bordure `--border` inchangée** et même
  retour à l'appui (`active`) en tactile ; **jamais `hover:bg-muted/N`** (fond translucide qui
  laisse passer le motif de page). Le focus clavier reste porté par l'élément interactif parent
  (lien/bouton). Les ombres restent réservées aux **overlays** (dialogs, menus, popovers,
  toasts, panneaux flottants — `--shadow-floating`), aux visuels springboard (`TopicIcon`), aux
  célébrations et aux **cartes de l'Accueil en sombre** (`--qu-home-card-shadow`) ; les tuiles de badge
  restent **sans ombre**. Les tuiles springboard
  Sujets/Personnes et les écrans immersifs (arène, résultat, salle, recherche, join) gardent leur
  langage propre.
  **Exception — issue d'un duel terminé** : les cartes de `MatchList` portent la teinte de
  l'issue (recette de la carte de titre débloquée : bordure 40 %, fond 8 % mélangé à `--card`,
  victoire `--success-600`, défaite `--loss`, nul `--draw`) et une pastille à disque assombri
  (80 % + noir). Elles ne suivent **pas** le survol `--surface-muted` : seule la bordure
  s'accentue (teinte de l'issue à 70 %, comme la tuile de badge acquise ; `foreground/20` pour
  une carte neutre), le fond reste inchangé.
  **Exception — sélection compacte** : les lignes `SelectRow` (popups joueur/thème/titre, ligne
  d'état du titre) et les `ChoiceCard` du wizard restent des **lignes compactes de style shadcn**
  (`rounded-lg border p-2.5` / `p-3`, visuel 34 px) — elles ne suivent pas la recette des cartes
  `rounded-card`.
  **Exception — cartes de l'Accueil** : `TopicMediaCard` (carte 5:8 du Top 10 ou paysage 16:9 ;
  pied titre + catégorie intégré à toutes les tailles, hauteur 64 px ; rang SVG FranceTV inversé
  en thème clair) ne suit pas la recette `Card` : **rayon 10 px (`rounded-lg`), bordure 1 px
  `--border`, ombre thémée `--qu-home-card-shadow` en sombre uniquement** (exception assumée à la carte à
  plat). Le visuel est rendu par `TopicIcon` en mode `fill` (chargement/fondu/repli partagés) ;
  seul le focus clavier porte un `ring`. Les actions de section restent visibles en compact
  (libellé réduit). Le libellé de catégorie est teinté par `categoryTextColor` (couleur de la
  catégorie mélangée à `--foreground`).

---

## 6. État d'avancement

### Découpage des features (refactor)

- L'**espace Social** remplace la page Personnes : feature `social` (annuaire Abonnements/Abonnés
  avec direction en filtre, page dédiée **Défis & Salons** `/challenges` avec rails horizontaux,
  invitations reçues, défis envoyés et salons au même format, barre de filtres unique), `/people`
  redirigé vers `/social`, sections « défis/salons en attente » retirées de l'Accueil, pastille de
  navigation **Défis** = tout le pending.
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
  capsule **`h-4` + `rounded-full`** alignée sur la barre V/N/D via `ProgressTrack`, couleurs
  shadcn ; même gabarit pour les barres de badge et de titre — la barre d'étape du wizard
  reste un élément shadcn standard plus fin, pas une barre de progression),
  `SHEET_DETENTS` (detents de bottom sheet centralisés), `PageContainer` sur `--page-gutter-x`.
- **Contenu** : grilles de **tuiles springboard partout** (Sujets 3 colonnes par défaut, 4
  sélectionnable, en compact — réglage « Grille des sujets » — puis **auto-fill**
  `minmax(6rem, 1fr)` dès 640 px (~98-110 px) ;
  Personnes 3 puis auto-fill ; skeleton Sujets = carré fluide + 2 lignes ; espacement
  `gap-x-1 gap-y-2` puis `gap-3`), rails de cartes de l'Accueil d'une **largeur unique**
  `58vw` (max 230 px) → `w-48` → `w-52`, carte 5:8 (Top 10) ou paysage 16:9 (autres sections),
  actions d'en-tête visibles en compact avec libellé réduit, cartes PendingDuels,
  `StatStrip` compact (3 colonnes à 320 px), leaderboard responsive + `ui/select`.
- **Écrans immersifs desktop** : toutes les pages (`duel`, `résultat`, `salons`, `matchmaking`,
  `join`) partagent le même cadre paysage (`AppShell`, `data-slot="game-frame"`) — **3:2**,
  largeur `min(dispo, hauteur×3/2)` plafonnée **1320px**, cadre arrondi bordure + ombre centré
  sur fond `#050506` ; en tactile, plein écran natif sans cadre. La **page résultat** exploite
  ce cadre avec une grille deux colonnes **1240px** et une pile bilan **560px** en desktop. Le
  contenu garde les **tailles tablette natives** (seule `--duel-stage-w` borne la composition
  dans le cadre) ; sidebar **retirée** pendant le duel ; **page résultat en deux colonnes** (pile
  bilan bornée à gauche, **carousel de revue shadcn** (`ReviewDeck`, embla) à droite — une
  question par vue, boutons **« Précédent » / « Suivant »**) ; en tactile, pile plein écran +
  **bottom sheet de revue** (`QuestionReviewDialog` élargie à `min(100%, 52rem)`) qui accueille
  le **même `ReviewDeck`** — plus d'overlay desktop `review-overlay`.
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
  `GameHistorySection` porte la **barre de filtres/tri** — _issue_ (`ALL|WIN|LOSS|DRAW|
IN_PROGRESS|CANCELLED`, relative au joueur consulté), _type d'adversaire_ (`TOUS|HUMAN|BOT`) et
  _tri_ (`RECENT|OLDEST|SCORE`) — appliqués **côté serveur** (`GET /api/profiles/{id}/games`,
  requête `game` filtrable), état persisté dans l'URL. `SearchToolbar` accepte désormais une barre
  **sans recherche** (la place du champ porte le compteur).
- **Badges** : `BadgeTile` (tuile **à plat** : sceau métallique SVG du palier, picto central,
  libellé seul — **aucun pied d'état** : la bordure et le fond verts `success-600` (mélangé à la
  surface) marquent un palier acquis, sans palier écrit ni coche/cadenas —, **aucune
  progression**) remplace la carte dépliée `BadgeCard` ;
  `BadgeRail` (rail `HorizontalRail` horizontal à toutes les tailles, cartes carrées 156 px),
  `BadgeFilterBar`
  (**avant l'en-tête** ; filtre **client** — recherche + état, persisté en URL — sur le chrome de
  `SearchToolbar`) et `BadgeDetail` servi par une **modale unique** `AppDialog` (`sheetOnTouch`,
  detent `SHEET_DETENTS.badge`) : objectif du palier + reste à faire (`metricRemaining`), sans
  palier ni « Débloqué » en texte. `BadgeMedallion` porte le **sceau SVG du palier** (copie de
  `product/badge`) et l'emblème dans l'emplacement central 104 × 104, **toujours en couleur** ;
  verrouillé, un voile sombre couvre l'intégralité de la tuile. Emblèmes : **une échelle = un
  emblème** (`FAMILY_ICONS` corrigé du doublon EXPLOIT/SERIES + `ONE_SHOT_ICONS` pour les 4
  exploits), les conditions d'exploit sont explicitées (`ONE_SHOT_CONDITION_KEYS`). Famille **`VICTORY`** (duels gagnés) séparée de `VOLUME`
  (duels joués) — côté `quizup-profile` : **le web doit être déployé avant `quizup-profile`**, une
  famille inconnue n'étant pas affichée. La palette `TIER_COLORS` suit les métaux des
  sceaux/rubans : pastilles de rang, points et barres de titre et disques de célébration changent
  avec elle. Les **titres** (fiche sujet, Réglages) restent des cartes
  dépliables avec le même code vert (`TITLE_CARD_ACCENT`) — l'inline y fonctionne (pas de rail) ;
  l'onglet Titres de la fiche sujet marque les grades atteints d'une **coche blanche sur pastille
  verte** (`acquiredCheck`), ne montre l'XP que dans le panneau déplié, et le titre porté s'affiche
  en **ruban teinté par son rang** (`TitleRibbon`) sous les informations du joueur dans le bandeau
  de profil.
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
- `rematch.spec.ts` — 2 joueurs, fin de duel → Revanche (défi nominatif à TTL 10 s) → bouton avec countdown → popup reçue par l'adversaire → acceptation → salle ;
- `resume.spec.ts` — bannière « Partie en cours — Rejoindre » et retour dans l'arène ;
- `pwa.spec.ts` — manifest/icônes servis, SW enregistré avec handlers `push`. <br>
  (Le push lui-même se teste manuellement : navigation réelle, stack complète, permission accordée.)
