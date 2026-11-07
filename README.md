# Jeu de maths

Petit jeu en HTML pour pratiquer des notions de mathématiques du primaire, en famille.
Aucune installation : des pages HTML, du CSS et du JavaScript, sans librairie ni serveur.

## Jouer

- **Sur l'ordi** : télécharger le dépôt et ouvrir `index.html` dans le fureteur.
- Une application Windows (`.exe`) avec mise à jour intégrée est en préparation.

## Ce qu'il y a dedans

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'accueil : profils (création, choix, modification), activités et médailles |
| `js/commun.js` | Profils, liste des activités, sauvegarde du progrès, dessin des médailles |
| `css/style.css` | Styles communs |
| `activites/soustraction-emprunt.html` | Activité 1 : soustraction avec emprunt |
| `js/soustraction-modele.js` | Logique de l'activité (emprunts, indices, génération des défis), sans affichage |
| `js/soustraction-emprunt.js` | Affichage et déroulement : tutoriel, défis, médailles |
| `css/soustraction.css` | Styles de l'activité |

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

Dans le fureteur, ce JSON est gardé dans le `localStorage` (clé `jeuDeMaths.v1`).
En bas de l'accueil, **Copie de sauvegarde** permet de le télécharger et de le restaurer.

## Modifier

- **Avatars et couleurs proposés** : tableaux `AVATARS` et `COULEURS` dans `js/commun.js`.
- **Ajouter une activité** : une entrée dans `ACTIVITES` (`js/commun.js`) et une page dans `activites/`.
  La page lit le joueur avec `Jeu.joueurCourant()` et enregistre avec `Jeu.majProgres(joueurId, activiteId, p => { ... })`.
