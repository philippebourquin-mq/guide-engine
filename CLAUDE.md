# Guide Engine — moteur partagé multi-destinations

Moteur de rendu + admin **unique**, partagés par toutes les destinations du système "Guide de voyage". Une modification poussée ici (`git push`) se propage automatiquement à tous les sites qui chargent `engine.js`/`engine.css` — pas de copie manuelle.

### Cache-busting — important après chaque modification de `engine.js`/`engine.css`

GitHub Pages sert ces fichiers avec `cache-control: max-age=600` (10 min) — un simple rechargement de page dans les 10 minutes suivant un `git push` peut donc encore servir l'ancienne version depuis le cache du navigateur, et faire croire qu'un correctif ne fonctionne pas.

Les URLs qui chargent `engine.js`/`engine.css` (dans chaque `index.html` de destination, dans `guide-site-template/index.html`, et dans `admin.html`) portent un paramètre `?v=AAAAMMJJ`. **Après toute modification de `engine.js` ou `engine.css`, mettre à jour ce paramètre partout** (nouvelle date, ou incrémenter un suffixe si plusieurs mises à jour le même jour) pour forcer un rechargement immédiat chez tous les visiteurs/admin, au lieu d'attendre l'expiration du cache.

## Architecture globale

```
guide-engine/            ← ce repo : moteur + admin (ce document)
  engine.js               moteur de rendu générique (chargé par chaque destination)
  engine.css               styles génériques
  admin.html               panel admin multi-sites (édition + publication GitHub)

guide-site-template/     ← squelette pour créer une nouvelle destination (repo GitHub "Template repository")
  index.html               coquille statique + <script src=".../guide-engine/engine.js">
  data.json                 skeleton vide {meta:{...}, sections:[]}

<destination>/            ← une destination = un repo (ex: martinique, bali, …)
  index.html               coquille (copiée depuis guide-site-template, quasi jamais modifiée)
  data.json                 contenu de cette destination
```

Chaque destination a son propre repo + son propre GitHub Pages (URL propre, CNAME/domaine perso possible par repo). Aucune destination n'a d'`admin.html` local — tout se pilote depuis l'admin central ici.

## Fichiers

- `engine.js` — tout le rendu : patterns album, `render()`, `renderClassicSection()`, `renderAlbumSection()`, lightbox, favoris. Exposé via `window.GuideEngine.init(config)`.
- `engine.css` — styles partagés (album, cartes, animations). Contient un garde-fou anti-débordement mobile : `html, body { overflow-x: hidden; max-width: 100% }` + `img { max-width: 100% }`, en CSS statique donc actif dès le premier rendu — les destinations chargent Tailwind via CDN (compilation à l'exécution, cf l'avertissement console de Tailwind lui-même), ce qui laisse une fenêtre où une image sans classes encore appliquées peut se rendre à sa largeur intrinsèque et dépasser le viewport ; sur mobile Safari, ce dépassement même bref peut déclencher un dézoom automatique qui reste ensuite « collé » (oblige à re-zoomer manuellement). Ne pas retirer ces deux règles sans une meilleure garantie contre ce cas.
- `admin.html` — admin multi-sites : compte GitHub unique + liste de destinations + sélecteur.

## `GuideEngine.init(config)`

```javascript
GuideEngine.init({
  localStorageKey: 'guide-site-v1',  // même valeur partout : localStorage est scopé par origine, pas de collision entre destinations
  dataUrl: './data.json',            // chemin du data.json de la destination
});
```

Chaque destination appelle ceci dans son propre `index.html`, après avoir chargé `engine.js`.

### Protection contre data.json périmé

`admin.html` (`saveToGitHub()`) injecte `data._ts = Date.now()` avant chaque publication.

`init()` ignore le fetch de `data.json` si :
```javascript
stored && (stored._ts || 0) >= (fetched._ts || 0)
```
**Ne jamais supprimer cette protection.** Le `data.json` local (dev) n'est jamais mis à jour par l'admin (Python http.server sert le fichier local statique). Sans cette règle, un rechargement écrase les formats publiés par l'ancien contenu local.

Cette protection est **entièrement locale à chaque destination** (son propre localStorage vs son propre fetch) — elle ne dépend pas de l'origine de l'admin, même si l'admin est hébergé ailleurs (ce qui est le cas ici : admin sur `guide-engine`, contenu servi sur le repo de chaque destination). localStorage étant scopé par origine, l'admin ne peut de toute façon pas écrire dans le localStorage d'une destination — leur synchronisation passe uniquement par GitHub (`data.json` + `_ts`).

## Patterns album (cycling) — sections classiques « tout auto » uniquement

`_ALB_PAT` : 12 patterns cyclés (duo / trio / quad / portrait vertical, style Cheerz/Lalalab). Utilisé **uniquement** par `renderClassicSection` pour les sections classiques entièrement auto (voir plus bas) — `renderAlbumSection` ne l'utilise plus du tout depuis l'unification des tailles (voir « Album — grille fixe »).

`_CLS_PAT` : `_ALB_PAT` filtré sans `bigFirst`/`bigLast` (CSS incompatible avec le mode mixte).

Fallbacks indépendants du tableau (résistants aux réordres) :
- `_PAT_SOLO` — 1 item pleine largeur
- `_PAT_DUO`  — 2 items égaux
- `_PAT_TRIO` — 3 items égaux

**Ne jamais référencer `_ALB_PAT[i]` par indice hardcodé** — utiliser ces constantes.

### `_albSz(item)` — catégories de layout forcé (cycling classique uniquement)

| `item.layout` | Catégorie | Comportement |
|----------------|-----------|--------------|
| `null`, `'1x1'`, `'default'` | `null` (auto) | Intégré dans le cycle |
| `'1x3'`, `'2x3'` | `'solo'` | Pleine largeur isolé |
| `'2x1'` | `'tall'` | Portrait vertical, groupé avec 1–2 autos suivantes |
| `'1x2'`, `'2x2'` | `'large'` | Grand format, groupé avec 1 auto suivante |

N'entre en jeu que dans `_albumGroups`, donc uniquement pour les sections classiques « tout auto » — jamais pour l'album (grille fixe, pas de catégorisation).

### Anti-orphelin (look-ahead)

Si prendre `n` items laisserait exactement 1 orphelin : ajuster `n` (élargir si ≤3, rétrécir sinon).

### Auto isolé avant un bloc forcé

Un item auto seul dans son run (`remAuto === 1`) juste avant un bloc `'large'` (1x2/2x2) est regroupé avec lui en duo `3fr 5fr` plutôt que forcé en solo pleine largeur. Sans item `'large'` suivant (fin de section, ou suivant `'tall'`/`'solo'`), le solo reste inévitable — c'est la seule option sensée.

## Sections

### Types

- `classic` — blocs texte/photo, deux modes (voir ci-dessous)
- `album`   — galerie photo, grille fixe (voir « Album — grille fixe »)

### Rendu classique hybride (`renderClassicSection`)

- Section **tout auto** (`layout` absent ou `1x1`) → cycling avec `_CLS_PAT` (fractionnaire, tailles variables selon le pattern)
- Section **mixte** (au moins un layout forcé) → CSS grid `repeat(3,1fr)` natif, tailles NxM réelles

Les classes `block-col-2` (span 2 colonnes), `block-col-full` (pleine largeur), `block-row-2`/`block-row-3` (span 2/3 rangées) ne fonctionnent qu'en mode mixte (grid natif) — pas en mode cycling.

## Album — grille fixe (identique au mode mixte classique)

`renderAlbumSection` n'utilise **plus** de cycling/patterns fractionnaires (`_albumGroups`/`_ALB_PAT`) — chaque photo est placée directement dans une grille `repeat(3,1fr)` à `grid-auto-rows:minmax(220px,auto)`, avec les mêmes classes `block-col-2`/`block-col-full`/`block-row-2`/`block-row-3` que les blocs classiques en mode mixte. Une photo `auto` (pas de `layout`) occupe toujours exactement 1×1 — jamais de taille surprise dépendant de sa position dans la séquence.

**Pourquoi ce changement** (vs. l'ancien système à patterns) : une photo auto pouvait se retrouver seule dans son groupe et être rendue en plein format (bien plus grande que les autres), sans qu'on puisse la redimensionner depuis l'admin — `auto`/`1x1` étant déjà le format le plus petit du système, rien de plus petit où « rétrécir ». La grille fixe élimine complètement ce cas : la taille affichée correspond toujours exactement au format NxM choisi, dans les deux sens (agrandir/rétrécir), sans exception.

`_albumGroups`/`_ALB_PAT`/`_albSz` restent utilisés par les sections **classiques tout auto** (cycling, toujours en place) — seul l'album a changé.

## Zoom photo (lightbox) — album ET sections classiques

Le lightbox (`#lightbox`/`openLightbox`/`closeLightbox`, markup dans chaque `index.html` de destination) n'est plus réservé à l'album : `renderItem()` pose les mêmes attributs (`data-idx="0"`, `data-album-photos` avec un tableau d'une seule entrée, `onclick="openLightbox(this)"`) sur toute carte avec photo (classique standard et bannière `highlight`), via l'helper `singlePhotoLightboxAttrs(src, caption)`. Aucune nouvelle fonction JS côté lightbox — il consomme `data-album-photos` de la même façon quel que soit le nombre de photos qu'il contient.

**Admin** : `decorateClassicItem`/`decorateAlbumCell` font déjà `el.removeAttribute('onclick')` en première ligne (nécessaire avant même ce changement, pour l'album) — l'`onclick` hérité de `renderItem` est donc automatiquement neutralisé dans l'éditeur, aucune modification supplémentaire nécessaire côté admin.

Le clic sur le lien d'un item (`mkLink`) fait `event.stopPropagation()` pour ne pas déclencher le lightbox en plus de la navigation.

Fond du lightbox en `#000` opaque (pas `rgba(0,0,0,.97)`) — à cette opacité, un titre héro clair juste derrière restait faiblement visible en transparence sur mobile. Padding latéral du conteneur image réduit à 64px (au lieu de 72px) pour laisser un peu plus de place à l'image sur les écrans étroits, tout en restant au-dessus de la largeur des flèches prev/next (48px + 14px de marge).

## Admin — comptes et destinations

`admin.html` sépare deux niveaux de stockage (localStorage) :

| Clé | Contenu |
|-----|---------|
| `mtq-gh-account` | `{password, token, unsplashKey}` — compte GitHub unique |
| `mtq-gh-sites` | `[{id, label, owner, repo, color}, …]` — destinations enregistrées (`color` = hex de fond de l'icône, voir « Icône par destination ») |
| `mtq-gh-active` | id de la destination actuellement sélectionnée |
| `mtq-admin-session` | session (connecté/déconnecté) |
| `mtq-admin-cache-<siteId>` | cache local du contenu de chaque destination (confort admin uniquement — n'a aucun rôle dans la protection anti-périmé, qui est gérée par `engine.js` sur l'origine de chaque destination) |

`effectiveCfg()` fusionne le compte (token) et la destination active (owner/repo) pour les appels GitHub — c'est ce qui est passé à `ghFetch`/`loadFromGitHub`/`saveToGitHub`.

### Ajouter une destination

Deux voies dans le modal « Nouvelle destination » :
1. **Créer automatiquement** — appelle l'API GitHub `POST /repos/{owner}/guide-site-template/generate` puis active Pages (`POST /repos/{owner}/{repo}/pages`). Nécessite un token avec les droits d'administration sur les repos.
2. **Enregistrer un dépôt existant** — pour un repo déjà créé manuellement (bouton GitHub « Use this template », ou après échec de la voie 1) : ajoute juste `{label, owner, repo}` à la liste, sans appel API.

Le repo `guide-site-template` doit être marqué **Template repository** dans ses paramètres GitHub pour que la génération automatique fonctionne.

**Propriétaire et nom du dépôt** : masqués par défaut derrière « Personnaliser propriétaire / nom du dépôt » — seul le nom de la destination et la couleur sont demandés dans le cas courant. Le propriétaire est préREMPLI depuis la destination active déjà enregistrée (`getActiveSite().owner`), ou sinon récupéré directement via l'API GitHub (`fetchGithubLogin(token)` → `GET /user`) puisqu'un seul compte possède quasiment toujours tous les dépôts. Le nom de dépôt reste dérivé du nom de la destination (`slugify`, préfixe `guide-`) tant que le champ n'a pas été édité manuellement (`_touched`).

### Modale « Destinations » — lister/gérer/supprimer

Icône dédiée dans le header (grille 2×2, entre le sélecteur de destination et l'engrenage Paramètres) → `openManageSitesModal()` → `#manage-sites-modal`. Distincte du modal « Nouvelle destination » (`#sites-modal`, toujours accessible via le petit « + » du sélecteur ou via « + Nouvelle destination » en bas de la modale Destinations) — celui-ci ne gère plus que la création, la liste vit uniquement ici (`renderManageSitesList`, un seul endroit pour éviter deux listes désynchronisées).

Chaque ligne : rond de couleur (clic → nuancier inline, même mécanique que la création — `changeSiteColor`), label + `owner/repo`, icône corbeille.

**Suppression à deux niveaux**, volontairement dissymétriques en friction :
- **« Retirer de la liste seulement »** (`data-unregister-only`) — retire l'entrée de `mtq-gh-sites` uniquement, aucun appel API. Le dépôt GitHub et le site publié restent intacts ; réversible en ré-enregistrant le même `owner/repo`. Un seul clic (pas de confirmation dédiée : c'est déjà la sortie « douce »).
- **« Supprimer le dépôt GitHub »** (`data-delete-confirm-btn`) — appelle `deleteGithubRepo(token, owner, repo)` (`DELETE /repos/{owner}/{repo}`), donc supprime réellement le dépôt (récupérable ~90 jours via la corbeille GitHub, pas plus). Bouton désactivé tant que le champ texte associé ne contient pas exactement `owner/repo` (comparaison stricte, recalculée à chaque frappe) — friction délibérée, pas de double-clic/armed-delete comme ailleurs dans l'admin (section, item…) : une vraie destruction externe irréversible mérite plus qu'un clic répété par erreur. Nécessite un token avec le scope `delete_repo` (classic) ou la permission Administration:Write (fine-grained) — sinon `deleteGithubRepo` remonte l'erreur GitHub telle quelle dans le panneau (`[data-delete-error]`).

**Prévu pour grandir** : cette modale est le point d'entrée annoncé pour la gestion des accès (à venir) — garder la liste/les actions par site ici plutôt que de les redisperser ailleurs.

## Icône par destination (favicon coloré)

Contrairement à `engine.js`/`engine.css` (partagés, un seul exemplaire dans `guide-engine`), **chaque destination héberge son propre `favicon.svg` / `favicon-32.png` / `apple-touch-icon.png` à la racine de son dépôt** — c'est la seule façon d'avoir une couleur différente par site sans backend (un favicon est un fichier statique, pas un endpoint paramétrable). `index.html` de chaque destination référence ces fichiers en **chemin relatif** (`./favicon.svg`, etc.), jamais via l'URL `guide-engine`.

`admin.html` génère ces fichiers à la volée en JS (pas de génération manuelle) :
- `FAVICON_PALETTE` — 16 teintes sobres (sable, sauge, bleu poussière, terracotta, argile rose, olive, bleu nuit, prune, moutarde douce, eucalyptus, ardoise, rouille, lavande grisée, vert bouteille, bordeaux doux, café taupe), volontairement sans le noir utilisé par l'icône de l'admin (voir plus bas).
- `faviconFgFor(bgHex)` — calcule la luminance relative du fond et choisit un trait sombre (`#211d1a`) ou clair (`#f4efe6`) pour rester lisible, quelle que soit la couleur.
- `faviconSvgFor(bgHex)` — construit le SVG (même mark boussole que l'admin) en interpolant fond + trait.
- `svgToPngDataUrl(svg, size)` — rasterise via `<canvas>` (Image + `drawImage` + `toDataURL`), pour produire les tailles PNG (180 = apple-touch-icon, 32 = favicon PNG de repli).
- `publishFaviconToSite(token, owner, repo, bgHex)` — publie les 3 fichiers dans le dépôt de la destination via `ghContentsFetch` (même fonction générique que pour `account.enc.json`).

Dans la modale « Nouvelle destination », un nuancier (`FAVICON_PALETTE`) permet de choisir la couleur avant création — `suggestSiteColor()` propose par défaut une teinte pas encore utilisée par une autre destination enregistrée. `addSiteToList(label, owner, repo, color)` stocke `color` dans `mtq-gh-sites` et appelle `publishFaviconToSite` juste après l'enregistrement du site (échec non bloquant — juste un toast, le site reste utilisable).

**L'icône de l'admin** (`admin.html` lui-même) est un cas à part, fixe : fond noir/anthracite (`favicon-admin.svg` + PNG, fichiers statiques dans `guide-engine`, pas générés dynamiquement) — volontairement distincte de toutes les couleurs de destination pour repérer l'onglet admin d'un coup d'œil.

**Changer la couleur d'une destination déjà créée** : dans la liste « Destinations enregistrées » (modale « Nouvelle destination »), chaque ligne a un petit rond de couleur cliquable (`data-recolor`) — clic → déplie le nuancier complet sous la ligne (`_recolorSiteId` piloté par `renderSitesList()`), clic sur une teinte → `changeSiteColor(siteId, color)` met à jour `color` dans `mtq-gh-sites`, republie les fichiers via `publishFaviconToSite`, puis replie le nuancier.

## Fiabilité de la publication (albums avec beaucoup de photos)

L'import en masse (plusieurs dizaines de photos) est un usage normal de ces sites — `data.json` doit donc rester léger quel que soit le nombre de photos. Deux couches de correctifs, complémentaires :

### Photos = fichiers du dépôt, pas base64 embarqué dans data.json

`resizeImage`/`resizeImageForAlbum` produisent toujours une `data:image/jpeg;base64,…` en local (édition WYSIWYG instantanée, aucun appel réseau tant qu'on n'a pas publié — modèle inchangé). C'est **au moment de publier** que `saveToGitHub` fait la différence :

- `migratePhotosToFiles(data)` parcourt `meta.coverImage`, chaque `item.photo` et chaque `photo.src`, et pour tout ce qui commence par `data:image` : calcule un hash (`sha256Hex`, 20 caractères) du contenu, l'envoie comme fichier séparé `photos/<hash>.jpg`, et remplace la valeur dans `data` par le chemin relatif `./photos/<hash>.jpg`. Les URL déjà externes (Unsplash) ou déjà migrées ne sont pas touchées. Le hash donne une déduplication gratuite (même photo réutilisée = même fichier).
- S'il y a des photos à migrer, `commitPhotosAndData` publie **photos + data.json en un seul commit atomique** via l'API Git Data (`/git/blobs` par photo → `/git/trees` avec `base_tree` → `/git/commits` → `PATCH /git/refs/heads/main`) — pas de N commits séparés, pas de PUT géant sur data.json. Le bouton Publier affiche une progression (« Envoi des photos… X/Y »).
- S'il n'y a **aucune** photo à migrer (juste du texte édité), on garde le chemin rapide historique : simple `PUT` sur `contents/data.json` (`ghFetch`), avec le retry-on-sha-mismatch existant.
- **Aucun changement côté `engine.js`/rendu** : un chemin relatif (`./photos/xxx.jpg`) fonctionne exactement comme une data URI dans un `<img src>` — le moteur ne sait même pas que ça a changé.
- Les photos déjà publiées en base64 avant cette évolution (ex. anciens contenus Martinique/Maroc) se migrent **automatiquement à la prochaine publication** qui les touche — pas de script de migration séparé à lancer.

### Fiabilité de l'encodage (reste valable même hors migration photo)

- **`toBase64` doit rester en version « par blocs »** (`String.fromCharCode.apply` sur des tranches de 32 Ko), jamais octet-par-octet dans une boucle `+=`. La version naïve est devenue **~15× plus lente** au-delà de quelques Mo (mesuré : ~3,6 s de blocage total de l'onglet sur 8 Mo, contre ~250 ms avec les blocs) — comme cet encodage tourne de façon synchrone avant le premier `await`, un blocage long empêche même le spinner de s'afficher : la publication semble n'avoir rien fait, sans erreur ni confirmation. C'est ce qui s'est produit sur Maroc avant que la migration photo n'existe.
- `JSON.stringify(data)` sans indentation (pas de `null, 2`) pour la publication — inutile pour un fichier jamais lu à la main, alourdit le payload.
- `resizeImageForAlbum` reste volontairement contenu (1400 px / qualité 0.76) plutôt que maximal, même si le poids total n'est plus le facteur limitant côté publication — ça reste ce qui est transmis et stocké par photo.

**Ne pas revenir à une version plus simple/lente de `toBase64`**, et ne pas faire dépendre à nouveau la publication d'un unique gros payload — les deux sont des régressions silencieuses (aucune erreur, juste un blocage ou un échec que l'utilisateur interprète à tort comme un bug côté contenu).

## Format des photos/blocs

7 formats possibles, partagés par les photos album ET les blocs classiques : `1x1` / `1x2` / `1x3` / `2x1` / `2x2` / `2x3` / `3x3` (rangées × colonnes, grille 3 colonnes max). `3x3` = pleine largeur, 3 rangées de haut — le plus grand format, ajouté pour un usage « héros ». `1x1` = pas de `layout` sur l'objet (supprimé/vide). Se règlent par **redimensionnement direct** (voir ci-dessous), pas par picker — `attachResize` clampe `cols` à [1,3] et `rows` à [1,3].

## Admin — éditeur miroir (WYSIWYG)

`admin.html` n'édite plus via des formulaires : il **réutilise le vrai moteur de rendu** (`GuideEngine.renderItem`/`renderAlbumSection`/`_albumGroups`, exposés sur `window.GuideEngine` — voir plus haut) pour afficher le contenu exactement comme sur le site, puis superpose une couche d'édition par-dessus le DOM obtenu. Inspiration : écran d'accueil iPhone en mode modification.

### Modèle de données par section

- Section classique : `card._items` — tableau d'objets item (copie profonde de `section.items`, source de vérité pendant l'édition).
- Section album : `card._albumPhotos` — tableau d'objets photo (inchangé depuis avant ce chantier).
- Chaque carte de section expose `card._rerender()` : réinjecte le HTML via `classicMirrorHtml()`/`GuideEngine.renderAlbumSection()` à partir du tableau, puis redécore. Appelé après tout ajout/suppression/déplacement/redimensionnement.
- `collectData()` lit `card._items`/`card._albumPhotos` directement (plus de lecture du DOM pour les champs).

### Un seul mode — pas de bascule « Modifier »

Tout est éditable/déplaçable/redimensionnable en permanence (déjà derrière le login admin — pas besoin d'un mode séparé). Chaque bloc/photo décoré porte 4 badges discrets aux coins (icône seule + ombre portée, pas de pastille pleine — voir `.admin-handle` dans le CSS) : drag (haut-gauche), suppression (haut-droite), options ou photo (bas-gauche — options pour les blocs classiques avec photo/lien/style, photo directe pour l'album), redimensionnement (bas-droite). Une tuile « + » ronde et discrète en fin de grille permet d'ajouter.

### Repli/dépliage d'une section (tap sur l'en-tête)

L'en-tête entier d'une section (`createSectionCard`/`createAlbumSectionCard`) est cliquable pour replier/déplier son corps — pas un petit chevron isolé entre les badges (pénible à viser sur mobile). Le chevron (`[data-chevron]`) reste un simple indicateur visuel, plus un bouton. Les contrôles avec leur propre action (poignée de drag, titre `contenteditable`, changement d'icône, suppression) appellent `e.stopPropagation()` dans leur propre listener pour ne pas déclencher le repli en même temps.

### Réassurance pendant l'upload/la publication

- `setBusy(el, on)` bascule un badge/bouton en spinner (icône remplacée, `pointerEvents:none`, `disabled` si applicable) pendant un `resizeImage`/`resizeImageForAlbum` — sans ça un bouton reste visuellement inerte entre le choix du fichier et le résultat. Câblé sur : badge photo de couverture, badge photo d'une cellule d'album, bouton « Changer » de la modale d'options, tuile « + » d'ajout de photos d'album (avec compteur `X/Y` si plusieurs fichiers).
- Le bouton Publier a un spinner intégré (`setSaveLoading`, structure `<span data-save-spin>` + `<span data-save-label>` plutôt qu'un simple `textContent`, pour ne pas perdre le spinner quand `commitPhotosAndData` met à jour le libellé avec la progression `setSaveLabel`).
- Le toast de succès ne prétend plus un délai fixe (« ~1 min », faux dès que la publication inclut des photos) — `saveToGitHub` retourne le nombre de photos publiées, utilisé pour un message honnête (« Publié · N photo(s) envoyée(s) » vs « le site va se mettre à jour dans quelques instants »).

### Édition inline

- Titre et texte rendus par `renderItem()` sont rendus `contenteditable` dans `decorateClassicItem()` — pas de re-rendu à chaque frappe, juste mise à jour de `item.title`/`item.text` sur l'event `input`. Chaque style de texte range titre/texte dans des éléments DOM différents (h3+p pour la plupart, `.font-black` pour `stat`, deux `<p>` pour `rubrique`/`pullquote`) — `getTitleTextNodes(el, item)` localise le bon nœud par style, pour ne jamais écrire dans le mauvais champ. Un caractère U+200B factice (`withTitlePlaceholder`) force le rendu de l'élément titre même quand `item.title` est vide, pour qu'il reste toujours cliquable. Pour `pullquote`, le préfixe « — » devant l'auteur est retiré automatiquement à la sauvegarde (`dashPrefix`).
- Légende de photo d'album : même principe, `div contenteditable` superposé en bas de la vignette (`decorateAlbumCell()`).
- Lien (URL), style de texte et focus de photo (`objectPosition`) : pas d'équivalent visuel direct sur la carte → modale légère `#item-options-modal` (badge « options »). Le focus se choisit sur une grille 3×3 de points superposée à un aperçu de la vraie photo (pas de clic à coordonnées libres sur la carte — testé peu fiable).

### Redimensionnement (drag du coin)

`attachResize(handle, getEl, getRowsCols, onCommit)` — mesure la taille actuellement rendue du bloc comme unité (1 colonne = largeur/cols actuelles, 1 rangée = hauteur/rows actuelles), affiche un contour de snap (`.admin-resize-ghost`) pendant le drag, commit au relâchement (`item.layout` mis à jour, puis `rerender()`). Clampe `cols` à [1,3] et `rows` à [1,3] (7 formats, voir « Format des photos/blocs »). Pour une section classique, un item qui passe de `1x1` à un format forcé peut faire basculer toute la section « tout auto » vers le mode grille mixte (comportement natif de `renderClassicSection`, inchangé) — l'album n'a plus ce cas de figure, sa grille est toujours fixe.

### Réordonnancement (drag & drop)

IIFE unique (« Drag & Drop ») gère trois cas via `[data-drag-handle]` :
- **Sections** (`[data-section-id]`) : déplacement live du DOM pendant le drag (liste simple, comportement historique inchangé).
- **Tips/photos** (`[data-mirror-item]`, présent sur chaque `<article>`/`.album-cell` décoré, avec `data-idx` = index dans le tableau) : pas de déplacement live (la position dépend d'un pattern calculé) — la cible la plus proche (distance au centre, grille 2D) est surlignée (`.admin-drop-target`) pendant le drag, et le tableau source/destination n'est modifié (`splice`) qu'au relâchement, suivi d'un `rerender()`. Le drag ne traverse jamais classique ↔ album (types de données incompatibles) ; seules les sections du même type que l'élément déplacé sont des cibles valides.

### Fichiers/fonctions clés

`parseLayout`/`layoutFromRowsCols` (conversion format ↔ rows/cols), `mkBadge` + constantes SVG, `pickPhotoFile`/`pickAlbumFiles` (input file détaché, cliqué programmatiquement — nécessaire pour rester fiable sur iOS Safari), `classicMirrorHtml`, `decorateClassicItem`, `decorateAlbumCell`.

## Dev local

```bash
python3 -m http.server 4245
# http://localhost:4245/admin.html
```

Note environnement (Claude Code / sandbox) : le lancement du serveur via `.claude/launch.json` + l'outil de preview peut échouer avec `PermissionError: [Errno 1] Operation not permitted` sur `os.getcwd()`. Contournement : démarrer le serveur manuellement en arrière-plan (`cd guide-engine && python3 -m http.server 4245 &`) puis ouvrir le navigateur sur `http://localhost:4245` directement (sans passer par le nom de la config).
