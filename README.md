# Jeu de maths

Petit jeu pour pratiquer des notions de mathématiques du primaire, en famille.
Le jeu est fait en HTML, CSS et JavaScript (sans librairie), emballé dans une application Windows avec [Tauri](https://tauri.app).

## Jouer

- **Application Windows** : dans [Releases](../../releases/latest), télécharger `Jeu de maths_…_x64-setup.exe` et l'ouvrir.
  Windows peut afficher « Windows a protégé votre ordinateur » (l'installateur n'est pas signé avec un certificat payant) :
  cliquer sur **Informations complémentaires → Exécuter quand même**.
  Ensuite, le jeu se met à jour lui-même : un bandeau « Nouvelle version disponible » apparaît sur l'accueil.
- **Dans un fureteur** (pour tester) : ouvrir `index.html`. Le progrès est alors gardé dans le fureteur.

## Ce qu'il y a dedans

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'accueil : profils (création, choix, modification), activités et médailles |
| `js/commun.js` | Profils, liste des activités, sauvegarde du progrès, dessin des médailles |
| `css/style.css` | Styles communs |
| `activites/soustraction-emprunt.html` | Activité 1 : soustraction avec emprunt |
| `js/soustraction-modele.js` | Logique de l'activité (emprunts, indices, génération des défis), sans affichage |
| `js/soustraction-emprunt.js` | Affichage et déroulement : tutoriel, défis, médailles |
| `css/activite.css` | Styles communs aux activités (menus, défis, bulles, clavier, fins) et grille de la soustraction |
| `activites/division-tables.html` | Activité 2 : tables de division |
| `js/division-tables.js` | Tables de division : tutoriel, défis, médailles, pierres |
| `css/division.css` | Styles de la division (équation, jetons en groupes) |
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
Pendant un défi, « Besoin d'aide? » donne l'indice de la prochaine étape et un lien pour revoir le tutoriel.
Si on change d'idée, on reclique sur un chiffre barré pour défaire l'emprunt (le plus récent d'abord).

**Accomplissements secrets** (révélés après la médaille d'or), des pierres précieuses :
- 💎 **Rubis**, défi vitesse : 5 problèmes de niveau or en moins de 2 minutes (`CHRONO_RUBIS`);
- 💎 **Émeraude**, défi sur papier : on ne peut plus cliquer pour emprunter, on écrit seulement la réponse; au plus 1 erreur (`MAX_ERREURS_EMERAUDE`);
- 💎 **Saphir** : les médailles bronze, argent et or réussies sans aucune erreur (accordé aussi après coup, si c'était déjà le cas);
- 💎 **Diamant** : des nombres de 5 à 7 chiffres, jusqu'aux millions.

Les réglages entre parenthèses sont au début de `js/soustraction-emprunt.js`.
Les sons sont fabriqués par le fureteur (Web Audio, aucun fichier); le bouton 🔊 les coupe, et ce choix est gardé dans la sauvegarde.

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

## Profils et sauvegarde du progrès

Aucun profil n'est écrit dans le code : au premier lancement, chaque enfant crée le sien (nom ou surnom, avatar, couleur).
Les profils et le progrès restent **sur l'appareil seulement**.

Tout tient dans un seul objet JSON, le même que le fichier de copie de sauvegarde :

```json
{
  "format": "jeu-de-maths",
  "version": 2,
  "joueurCourant": "j-mh3k2x9f",
  "joueurs": {
    "j-mh3k2x9f": {
      "nom": "…", "avatar": "🦊", "couleur": "#3a6fe0",
      "activites": {
        "soustraction-emprunt": { "tutorielFait": true, "medailles": { "bronze": true, "argent": false, "or": false } }
      }
    }
  }
}
```

Pour que les vieilles sauvegardes restent lisibles après une mise à jour :
- chaque activité n'écrit que dans sa propre section de `activites`;
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
