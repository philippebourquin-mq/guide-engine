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
- `engine.css` — styles partagés (album, cartes, animations).
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

## Patterns album

`_ALB_PAT` : 12 patterns cyclés (duo / trio / quad / portrait vertical, style Cheerz/Lalalab).
`_CLS_PAT` : `_ALB_PAT` filtré sans `bigFirst`/`bigLast` (sections classiques — CSS incompatible avec ces variantes).

Fallbacks indépendants du tableau (résistants aux réordres) :
- `_PAT_SOLO` — 1 photo pleine largeur
- `_PAT_DUO`  — 2 photos égales
- `_PAT_TRIO` — 3 photos égales

**Ne jamais référencer `_ALB_PAT[i]` par indice hardcodé** — utiliser ces constantes.

### `_albSz(photo)` — catégories de layout forcé

| `photo.layout` | Catégorie | Comportement |
|----------------|-----------|--------------|
| `null`, `'1x1'`, `'default'` | `null` (auto) | Intégré dans le cycle |
| `'1x3'`, `'2x3'` | `'solo'` | Pleine largeur isolé |
| `'2x1'` | `'tall'` | Portrait vertical, groupé avec 1–2 autos suivantes |
| `'1x2'`, `'2x2'` | `'large'` | Grand format, groupé avec 1 auto suivante |

### Anti-orphelin (look-ahead)

Si prendre `n` photos laisserait exactement 1 orphelin : ajuster `n` (élargir si ≤3, rétrécir sinon).

### Auto isolé avant un bloc forcé

Une photo auto seule dans son run (`remAuto === 1`) juste avant un bloc `'large'` (1x2/2x2) est regroupée avec lui en duo `3fr 5fr` plutôt que forcée en solo pleine largeur. Sans photo `'large'` suivante (fin de section, ou suivante `'tall'`/`'solo'`), le solo reste inévitable — c'est la seule option sensée. Sans cette règle, une telle photo n'a aucun format plus petit vers lequel la redimensionner depuis l'admin (`auto`/`1x1` est déjà le plancher).

## Sections

### Types

- `classic` — blocs texte/photo avec layout CSS grid (`block-col-2`, `block-row-2`)
- `album`   — galerie photo avec patterns Cheerz/Lalalab

### Rendu classique hybride (`renderClassicSection`)

- Section **tout auto** (`layout` absent ou `1x1`) → cycling album avec `_CLS_PAT`
- Section **mixte** (au moins un layout forcé) → CSS grid `repeat(3,1fr)` natif

Les classes `block-col-2` (span 2 colonnes) et `block-row-2` (span 2 rangées) ne fonctionnent qu'en mode mixte (grid natif).

## Admin — comptes et destinations

`admin.html` sépare deux niveaux de stockage (localStorage) :

| Clé | Contenu |
|-----|---------|
| `mtq-gh-account` | `{password, token, unsplashKey}` — compte GitHub unique |
| `mtq-gh-sites` | `[{id, label, owner, repo}, …]` — destinations enregistrées |
| `mtq-gh-active` | id de la destination actuellement sélectionnée |
| `mtq-admin-session` | session (connecté/déconnecté) |
| `mtq-admin-cache-<siteId>` | cache local du contenu de chaque destination (confort admin uniquement — n'a aucun rôle dans la protection anti-périmé, qui est gérée par `engine.js` sur l'origine de chaque destination) |

`effectiveCfg()` fusionne le compte (token) et la destination active (owner/repo) pour les appels GitHub — c'est ce qui est passé à `ghFetch`/`loadFromGitHub`/`saveToGitHub`.

### Ajouter une destination

Deux voies dans le modal « Nouvelle destination » :
1. **Créer automatiquement** — appelle l'API GitHub `POST /repos/{owner}/guide-site-template/generate` puis active Pages (`POST /repos/{owner}/{repo}/pages`). Nécessite un token avec les droits d'administration sur les repos.
2. **Enregistrer un dépôt existant** — pour un repo déjà créé manuellement (bouton GitHub « Use this template », ou après échec de la voie 1) : ajoute juste `{label, owner, repo}` à la liste, sans appel API.

Le repo `guide-site-template` doit être marqué **Template repository** dans ses paramètres GitHub pour que la génération automatique fonctionne.

## Format des photos/blocs

6 formats possibles pour les photos album ET les blocs classiques : `1x1` / `1x2` / `1x3` / `2x1` / `2x2` / `2x3` (rangées × colonnes). `1x1` = pas de `layout` sur l'objet (supprimé/vide). Se règlent par **redimensionnement direct** (voir ci-dessous), pas par picker.

## Admin — éditeur miroir (WYSIWYG)

`admin.html` n'édite plus via des formulaires : il **réutilise le vrai moteur de rendu** (`GuideEngine.renderItem`/`renderAlbumSection`/`_albumGroups`, exposés sur `window.GuideEngine` — voir plus haut) pour afficher le contenu exactement comme sur le site, puis superpose une couche d'édition par-dessus le DOM obtenu. Inspiration : écran d'accueil iPhone en mode modification.

### Modèle de données par section

- Section classique : `card._items` — tableau d'objets item (copie profonde de `section.items`, source de vérité pendant l'édition).
- Section album : `card._albumPhotos` — tableau d'objets photo (inchangé depuis avant ce chantier).
- Chaque carte de section expose `card._rerender()` : réinjecte le HTML via `classicMirrorHtml()`/`GuideEngine.renderAlbumSection()` à partir du tableau, puis redécore. Appelé après tout ajout/suppression/déplacement/redimensionnement.
- `collectData()` lit `card._items`/`card._albumPhotos` directement (plus de lecture du DOM pour les champs).

### Mode « Modifier »

Bouton dans le header (`#edit-mode-btn`) bascule la classe `admin-edit-on` sur `#sections-container`. Hors de ce mode, la zone est un pur miroir + le texte reste éditable au tap (non destructif). En mode Modifier apparaissent : poignée de drag (coin haut-gauche), badge suppression (haut-droite, rouge), badge photo (bas-gauche), badge options (haut-centre, sections classiques uniquement), poignée de redimensionnement (bas-droite), et une tuile « + » en fin de grille pour ajouter.

### Édition inline

- Titre (`h3`) et texte (`p`) rendus par `renderItem()` sont rendus `contenteditable` directement dans `decorateClassicItem()` — pas de re-rendu à chaque frappe, juste mise à jour de `item.title`/`item.text` sur l'event `input`.
- Légende de photo d'album : même principe, `div contenteditable` superposé en bas de la vignette (`decorateAlbumCell()`).
- Style de texte (`pullquote` n'a pas de `<h3>` — cas non couvert par l'édition inline du titre pour ce style précis), lien (URL) et focus de photo (`objectPosition`) : pas d'équivalent visuel direct sur la carte → modale légère `#item-options-modal` (badge « options »), plutôt qu'un vrai contrôle inline.

### Redimensionnement (drag du coin)

`attachResize(handle, getEl, getRowsCols, onCommit)` — mesure la taille actuellement rendue du bloc comme unité (1 colonne = largeur/cols actuelles, 1 rangée = hauteur/rows actuelles), affiche un contour de snap (`.admin-resize-ghost`) pendant le drag, commit au relâchement (`item.layout` mis à jour, puis `rerender()`). Un item qui passe de `1x1` à un format forcé peut faire basculer toute la section « tout auto » vers le mode grille mixte (comportement natif de `renderClassicSection`, inchangé).

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
