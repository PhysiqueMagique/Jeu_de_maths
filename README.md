# Jeu de maths

Petit jeu pour pratiquer des notions de mathématiques du primaire, en famille.
Le jeu est fait en HTML, CSS et JavaScript (sans librairie), emballé dans une application Windows avec [Tauri](https://tauri.app).

## Jouer

- **Application Windows** : dans [Releases](../../releases/latest), télécharger `Jeu de maths_…_x64-setup.exe` et l'ouvrir.
  Windows peut afficher « Windows a protégé votre ordinateur » (l'installateur n'est pas signé avec un certificat payant) :
  cliquer sur **Informations complémentaires → Exécuter quand même**.
  Ensuite, le jeu se met à jour lui-même : un bandeau « Nouvelle version disponible » apparaît sur l'accueil.
  Le jeu s'ouvre en plein écran : **F11** (ou le bouton ⛶ de l'accueil) pour en sortir, le bouton ✕ de l'accueil pour quitter.
  L'affichage est pensé pour un écran d'ordinateur : il s'agrandit pour remplir l'écran.
- **Dans un fureteur** (pour tester) : ouvrir `index.html`. Le progrès est alors gardé dans le fureteur.

## Ce qu'il y a dedans

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'accueil : profils (création, choix, modification), activités et médailles |
| `js/commun.js` | Profils, liste des activités, sauvegarde du progrès, dessin des médailles |
| `css/style.css` | Styles communs |
| `js/mascotte.js`, `css/mascotte.css` | Le renard : dessin SVG, animations, réactions, catalogue des 12 accessoires |
| `renard.html`, `js/garde-robe.js`, `css/garde-robe.css` | La garde-robe : acheter les accessoires avec ses médailles et ses pierres, les essayer, les porter |
| `activites/soustraction-emprunt.html` | Activité 1 : soustraction avec emprunt |
| `js/soustraction-modele.js` | Logique de l'activité (emprunts, indices, génération des défis), sans affichage |
| `js/soustraction-emprunt.js` | Affichage et déroulement : tutoriel, défis, médailles |
| `css/activite.css` | Styles communs aux activités (menus, défis, bulles, clavier, fins) et grille de la soustraction |
| `js/tables-moteur.js` | Moteur commun des activités « tables » : tutoriel, défis, médailles, pierres |
| `activites/multiplication-course.html`, `js/multiplication-course.js`, `css/course.css` | Activité 2 : course des multiplications (table trouée, course chronométrée) |
| `activites/multiplication-colonnes.html`, `js/multiplication-colonnes.js`, `js/colonnes-modele.js`, `css/colonnes.css` | Activité 3 : multiplication en colonnes des grands nombres |
| `activites/division-tables.html`, `js/division-tables.js` | Activité 4 : tables de division (textes, niveaux, trucs) |
| `activites/multiplication-tables.html`, `js/multiplication-tables.js` | *En banque* : tables de multiplication axées sur la compréhension (pas affichée; voir `ACTIVITES` dans `js/commun.js`) |
| `css/tables.css` | Styles des tables (équation, jetons en groupes, explication du diamant) |
| `src-tauri/` | Application Windows : fenêtre, lecture/écriture de `progres.json`, mises à jour |
| `scripts/preparer-web.mjs` | Copie les fichiers du jeu dans `dist/` avant la construction de l'application |
| `scripts/nouvelle-version.mjs` | Change le numéro de version partout |

### Activité : soustraction avec emprunt

1. **Tutoriel, partie 1** : l'exemple 52 − 28 expliqué pas à pas, avec des blocs de base dix.
   L'élève clique sur le 5 pour le barrer (il devient 4), clique sur le 2 pour lui donner la dizaine (il devient 12),
   puis écrit 12 − 8 et 4 − 2.
2. **Tutoriel, partie 2** : 73 − 46, l'élève fait tout lui-même et les indices s'affichent au fur et à mesure.
3. **Défis** de 5 problèmes générés au hasard :
   - 🥉 **Bronze** : nombres à 2 chiffres;
   - 🥈 **Argent** : nombres à 3 chiffres, un ou deux emprunts (le 1er problème est « avec coup de pouce »);
   - 🥇 **Or** : emprunter à travers un zéro (403 − 158, 600 − 247) et nombres à 4 chiffres (1er problème avec coup de pouce).

Chaque défi réussi donne sa médaille, visible sur la page d'accueil. Argent se débloque avec bronze, or avec argent.
Le tutoriel n'est pas obligatoire (dans toutes les activités) : le défi bronze est ouvert dès le départ, et « Sauter le tutoriel » cache la carte « Commence ici ».
Pendant un défi, « Besoin d'aide? » donne l'indice de la prochaine étape et un lien pour revoir le tutoriel.
Si on change d'idée, on reclique sur un chiffre barré pour défaire l'emprunt (le plus récent d'abord).

**Accomplissements secrets** (révélés après la médaille d'or), des pierres précieuses :
- 💎 **Rubis**, défi vitesse : 5 problèmes de niveau or en moins de 2 minutes (`CHRONO_RUBIS`);
- 💎 **Émeraude**, défi sur papier : on ne peut plus cliquer pour emprunter, on écrit seulement la réponse; au plus 1 erreur (`MAX_ERREURS_EMERAUDE`);
- 💎 **Saphir** : les médailles bronze, argent et or réussies sans aucune erreur (accordé aussi après coup, si c'était déjà le cas);
- 💎 **Diamant** : des nombres de 5 à 7 chiffres, jusqu'aux millions.

Les réglages entre parenthèses sont au début de `js/soustraction-emprunt.js`.
Les sons sont fabriqués par le fureteur (Web Audio, aucun fichier); le bouton 🔊 les coupe, et ce choix est gardé dans la sauvegarde.

### Activité : multiplication en colonnes (grands nombres)

Méthode : une ligne par produit de deux chiffres, avec ses zéros, puis la somme. Pour 137 × 26 :
6 × 7 = 42; 6 × 3 → 180; 6 × 1 → 600; 2 × 7 → 140; 2 × 3 → 600; 2 × 1 → 2000; somme 3562.
Nombre de zéros = place du chiffre du haut + place du chiffre du bas (unités 0, dizaines 1, centaines 2).
Les deux chiffres à multiplier sont en couleur; les zéros ajoutés s'affichent en rouge.

1. **Tutoriel** : 43 × 2 et 24 × 13 tout expliqués (où et pourquoi placer les zéros), puis 137 × 26 avec indices.
2. **Défis** : 🥉 2 chiffres × 1 chiffre (5 problèmes); 🥈 2 × 2 chiffres et 3 × 1 chiffre (4); 🥇 3 × 2 chiffres (3).
   Les indices repèrent l'oubli d'un zéro, un mauvais nombre de zéros, ou la colonne fautive de la somme (avec retenues).
   Lignes : on tape le résultat normalement (les chiffres glissent vers la gauche) et on ajoute les zéros avec les boutons
   **+0 / −0** de la ligne (ou les touches + et −), avant ou après. Somme : **case par case, de droite à gauche**
   (clic ou flèches ← →), avec de petites cases au-dessus de chaque colonne pour les **retenues** (clic, ou flèche ↑).
3. **Pierres** (après l'or) : 💎 rubis, 3 multiplications or en 4 minutes; 💎 émeraude, sur papier (la réponse seulement),
   une seule erreur; 💎 saphir, trois médailles sans faute; 💎 diamant, 3 chiffres × 3 chiffres (neuf lignes).

### Activité en banque : tables de multiplication (de 1 à 12)

1. **Tutoriel** en 3 parties : 3 × 4 avec des jetons (3 groupes de 4, compter par bonds); 5 × 6 en comptant par bonds;
   7 × 8 en découpant en morceaux faciles (5 × 8 + 2 × 8).
2. **Défis** de 10 multiplications (l'ordre des facteurs varie : 7 × 8 ou 8 × 7) : 🥉 tables de 1, 2, 5 et 10;
   🥈 tables de 3, 4, 6 et 11; 🥇 tables de 7, 8, 9 et 12.
3. **Pierres** (après l'or) : comme pour la division; le diamant ajoute un zéro à un facteur (7 × 80 = 560).

Les tables de multiplication et de division partagent le même moteur (`js/tables-moteur.js`);
chaque activité n'est qu'une configuration : textes, niveaux, façon de fabriquer un problème et ses indices.

### Activité : course des multiplications (vitesse et mémorisation)

Pour chaque niveau (sans « × 1 ») : 🥉 tables de 2, 3 et 5 (14 pas en 60 s); 🥈 tables de 2 à 7 (17 pas en 70 s);
🥇 tables de 2 à 10 (22 pas en 80 s).
1. **Échauffement** : une table trouée. Bronze : 40 % des cases des tables de 2, 3 et 5. Argent et or : seulement
   les lignes des nouvelles tables (4, 6, 7 puis 8, 9, 10), en entier. Les deux nombres multipliés (ligne et colonne)
   sont surlignés, et la case choisie montre la multiplication à faire en gris pâle. Une fois la table remplie,
   elle reste affichée avec le message de réussite. Il faut l'avoir faite une fois pour débloquer la course du niveau.
2. **Course** : compte à rebours, puis une barre de temps qui diminue. Chaque bonne réponse fait avancer l'avatar
   de l'enfant d'un pas; une erreur le fait reculer d'un pas, montre la bonne réponse, et la multiplication ratée revient plus tard.
   La réponse est validée dès qu'elle a le bon nombre de chiffres.
3. **Pierres** (après l'or) : 💎 rubis, la course or en 65 s; 💎 émeraude, la grande table trouée de 2 à 10 (moitié des cases),
   une seule erreur; 💎 saphir, les trois courses sans erreur; 💎 diamant, tables jusqu'à 12 × 12 (22 pas en 100 s).

Les temps, nombres de pas et proportions de trous sont au début de `js/multiplication-course.js`.

### Activité : tables de division (sans reste, jusqu'à 10)

1. **Tutoriel** en 3 parties : 12 ÷ 3 avec des jetons à placer en groupes de 3; 20 ÷ 5 avec jetons au choix;
   42 ÷ 7 avec le truc de la multiplication à l'envers (7 × ? = 42).
2. **Défis** de 10 divisions : 🥉 tables de 1, 2, 5 et 10; 🥈 tables de 3, 4 et 6; 🥇 tables de 7, 8 et 9.
   Une bonne réponse passe toute seule à la suivante. « Besoin d'aide? » montre les jetons et la table.
3. **Pierres** (après l'or) : 💎 rubis, 10 divisions en 1 min 30 (`CHRONO_RUBIS`); 💎 émeraude, défi de tête
   sans jetons ni indices, une seule erreur (`MAX_ERREURS_EMERAUDE`); 💎 saphir, trois médailles sans faute;
   💎 diamant, les tables avec un zéro de plus (720 ÷ 9 = 80), avec une explication au début.

Dans les deux activités, vérifier deux fois la même réponse fausse ne compte qu'une erreur, et quand on dépasse
le nombre d'erreurs permis pour l'émeraude, le jeu propose de recommencer le défi tout de suite.

## Le renard et sa garde-robe

Le renard est une « marionnette » SVG (`js/mascotte.js`) : chaque partie (tête, oreilles, bras, queue) pivote autour
de son propre point, et les animations utilisent `element.animate()`. Il cligne des yeux, respire et remue la queue au repos.

- **Dans les activités** (pages avec `<body data-mascotte>`) : un renard s'installe sous le panneau de droite et un autre
  sur l'écran de fin. Il réagit aux sons du jeu : `Jeu.jouer()` envoie aussi l'événement `jeu:evenement`.
  Bonne réponse → saut, salut, pirouette ou victoire; erreur → encouragement (poing levé, poings prêts, il montre le problème);
  médaille ou pierre → danse. Il rapetisse (ou se cache) s'il manque de place : il ne fait jamais défiler la page.
- **Garde-robe** (`renard.html`, carte sur l'accueil) : chaque médaille et chaque pierre gagnée vaut une pièce de sa sorte.
  On l'échange contre un accessoire (on peut l'essayer en le survolant). Les médailles restent gagnées; on ne dépense que leur valeur.

| Emplacement | Accessoires (prix) |
|---|---|
| Tête | casquette (bronze) · chapeau de magicien (2 saphirs + émeraude) · couronne (2 diamants) |
| Yeux | lunettes rondes (bronze) · lunettes de soleil (argent + rubis) · lunettes étoiles (or + 2 rubis) |
| Cou | nœud papillon (bronze + argent) · cravate (argent + or) · bandana (or + émeraude) |
| Main | crayon géant (bronze) · loupe (or + saphir) · baguette magique (émeraude + diamant) |

Les prix sont dans `CATALOGUE` (`js/mascotte.js`). Avec 4 activités, il y a 28 récompenses (4 de chaque sorte);
tout acheter en demande 23 (environ 80 %). Le nœud papillon est dessiné par-dessus les bras (`calque: 'devant'`),
et les objets de la main par-dessus la patte.

## Profils et sauvegarde du progrès

Aucun profil n'est écrit dans le code : au premier lancement, chaque enfant crée le sien (nom ou surnom, avatar, couleur).
Les profils et le progrès restent **sur l'appareil seulement**.

Tout tient dans un seul objet JSON, le même que le fichier de copie de sauvegarde :

```json
{
  "format": "jeu-de-maths",
  "version": 3,
  "joueurCourant": "j-mh3k2x9f",
  "joueurs": {
    "j-mh3k2x9f": {
      "nom": "…", "avatar": "🦊", "couleur": "#3a6fe0",
      "activites": {
        "soustraction-emprunt": { "tutorielFait": true, "medailles": { "bronze": true, "argent": false, "or": false } }
      },
      "mascotte": { "achats": ["casquette"], "porte": { "tete": "casquette" }, "depense": { "bronze": 1 } }
    }
  }
}
```

Pour que les vieilles sauvegardes restent lisibles après une mise à jour :
- chaque activité n'écrit que dans sa propre section de `activites`; la garde-robe écrit seulement dans `mascotte`;
- le jeu ne supprime jamais un champ ou une section qu'il ne connaît pas;
- si le format doit changer, on augmente `version` et on ajoute une étape dans `migrer()` (`js/commun.js`).

Dans l'application Windows, ce JSON est le fichier **`Documents\Jeu de maths\progres.json`**.
Il est écrit d'un coup (fichier temporaire puis renommage), et s'il est un jour illisible, il est renommé
`progres-illisible-….json` plutôt qu'effacé. Dans un fureteur, le même JSON est gardé dans le `localStorage` (clé `jeuDeMaths.v1`).
En bas de l'accueil, **Copie de sauvegarde** permet de le télécharger et de le restaurer.

## Publier une nouvelle version

La publication est automatique (`.github/workflows/publier.yml`) : dès que le numéro de version change sur `main`,
GitHub construit l'installateur sur un Windows virtuel, le signe et le publie dans Releases avec `latest.json`,
le fichier que l'application consulte pour ses mises à jour.

```bash
node scripts/nouvelle-version.mjs 0.2.0
# ajouter une section « ## 0.2.0 » en haut de NOUVEAUTES.md (ce texte s'affiche dans le bandeau du jeu)
git commit -am "Version 0.2.0"
git push
```

La signature des mises à jour demande deux secrets dans **Settings → Secrets and variables → Actions** :
`TAURI_SIGNING_PRIVATE_KEY` et `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. La clé publique correspondante est dans
`src-tauri/tauri.conf.json`. **Ne pas perdre la clé privée** : sans elle, les jeux déjà installés refuseront les mises à jour.

## Modifier

- **Avatars et couleurs proposés** : tableaux `AVATARS` et `COULEURS` dans `js/commun.js`.
- **Ajouter une activité** : une entrée dans `ACTIVITES` (`js/commun.js`) et une page dans `activites/`.
  La page lit le joueur avec `Jeu.joueurCourant()` et enregistre avec `Jeu.majProgres(joueurId, activiteId, p => { ... })`.
