/* ==========================================================
   Multiplication en colonnes — logique (sans affichage)
   ----------------------------------------------------------
   137 × 26 se calcule chiffre par chiffre, une ligne par produit :
     6 × 7 = 42          (unités × unités : pas de zéro)
     6 × 3 = 18 → 180    (le 3 est dans les dizaines : 1 zéro)
     6 × 1 = 6  → 600    (le 1 est dans les centaines : 2 zéros)
     2 × 7 = 14 → 140    (le 2 est dans les dizaines : 1 zéro)
     2 × 3 = 6  → 600    (dizaines + dizaines : 2 zéros)
     2 × 1 = 2  → 2000   (dizaines + centaines : 3 zéros)
   puis on additionne toutes les lignes : 3562.
   Nombre de zéros = place du chiffre du haut + place du chiffre du bas
   (unités = 0, dizaines = 1, centaines = 2…).
   ========================================================== */
'use strict';

const Colonnes = (() => {
  const NOMS = ['unités', 'dizaines', 'centaines', 'unités de mille', 'dizaines de mille', 'centaines de mille', 'millions'];

  function creer(a, b) {
    const A = String(a).split('').map(Number);
    const B = String(b).split('').map(Number);
    const lignes = [];
    for (let j = 0; j < B.length; j++) { // chiffre du bas, de droite à gauche
      const db = B[B.length - 1 - j];
      for (let i = 0; i < A.length; i++) { // chiffre du haut, de droite à gauche
        const da = A[A.length - 1 - i];
        const p = da * db;
        const z = i + j;
        lignes.push({ i, j, da, db, p, z, valeur: p * 10 ** z });
      }
    }
    return { a, b, A, B, lignes, total: a * b, largeur: String(a * b).length };
  }

  const zeros = (n) => `${n} zéro${n > 1 ? 's' : ''}`;

  // Explication d'une ligne. complet = on donne la réponse (tutoriel).
  function explication(l, complet) {
    const placeA = l.i === 0 ? 'dans les unités (0 zéro)' : `dans les ${NOMS[l.i]} (${zeros(l.i)})`;
    const placeB = l.j === 0 ? 'dans les unités (0 zéro)' : `dans les ${NOMS[l.j]} (${zeros(l.j)})`;
    let pourquoi;
    if (l.z === 0) pourquoi = 'Les deux chiffres sont dans les unités : <b>pas de zéro</b> à ajouter.';
    else pourquoi = `Le <b>${l.da}</b> est ${placeA}, le <b>${l.db}</b> est ${placeB} : <b>${zeros(l.z)}</b> en tout.`;
    if (complet) {
      return `<b>${l.db} × ${l.da} = ${l.p}</b>. ${pourquoi} Écris <b>${l.valeur}</b>.`;
    }
    return `Multiplie <b>${l.db} × ${l.da}</b>. ${l.z === 0 ? 'Les deux sont dans les unités.' : `Le ${l.da} est ${placeA}, le ${l.db} est ${placeB} : combien de zéros en tout?`}`;
  }

  // Pourquoi une ligne est fausse (sans tout donner).
  function indiceLigne(l, tape) {
    const t = Number(tape);
    if (t === l.p && l.z > 0) {
      return `${l.db} × ${l.da} = ${l.p}, c’est bien ça… mais il manque ${l.z === 1 ? 'le zéro' : `les ${zeros(l.z)}`}!`;
    }
    for (let k = 0; k <= 6; k++) {
      if (k !== l.z && t === l.p * 10 ** k) {
        return `Le calcul ${l.db} × ${l.da} = ${l.p} est bon, mais pas le nombre de zéros : il en faut ${l.z}, pas ${k}. Regarde dans quelles colonnes sont les deux chiffres.`;
      }
    }
    return `Vérifie ${l.db} × ${l.da}${l.z ? `, puis ajoute ${zeros(l.z)}` : ''}.`;
  }

  // Les chiffres à additionner dans la colonne c (0 = unités), et les retenues.
  function colonnesSomme(P) {
    const res = [];
    let retenue = 0;
    for (let c = 0; c < P.largeur; c++) {
      const chiffres = P.lignes.filter((l) => l.valeur >= 10 ** c).map((l) => Math.floor(l.valeur / 10 ** c) % 10);
      const somme = chiffres.reduce((x, y) => x + y, 0) + retenue;
      res.push({ c, chiffres, retenue, somme, ecrit: somme % 10, retenueSuivante: Math.floor(somme / 10) });
      retenue = Math.floor(somme / 10);
    }
    return res;
  }

  // Indice pour la somme : la première colonne (en partant des unités) qui est fausse.
  function indiceSomme(P, tape, complet) {
    const t = String(tape);
    const e = String(P.total);
    for (const col of colonnesSomme(P)) {
      const chiffreTape = t.length > col.c ? t[t.length - 1 - col.c] : '';
      const chiffreAttendu = e.length > col.c ? e[e.length - 1 - col.c] : '';
      if (chiffreTape !== chiffreAttendu) {
        const calcul = `${col.chiffres.join(' + ') || '0'}${col.retenue ? ` + <b>${col.retenue}</b> de retenue` : ''}`;
        if (!complet) return `Vérifie la colonne des <b>${NOMS[col.c]}</b> : ${calcul}.`;
        return `Colonne des <b>${NOMS[col.c]}</b> : ${calcul} = ${col.somme}. On écrit ${col.ecrit}${col.retenueSuivante ? ` et on retient ${col.retenueSuivante}` : ''}.`;
      }
    }
    if (t.length > e.length) return 'Ta réponse a trop de chiffres.';
    return 'Additionne toutes les lignes, colonne par colonne, en commençant par les unités.';
  }

  // ---------- Génération des défis ----------

  const alea = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  // Un nombre de n chiffres sans zéro (les zéros rendraient des lignes « 0 » bizarres)
  const nombre = (n) => Number(Array.from({ length: n }, () => alea(1, 9)).join(''));

  // formes : liste de [chiffres du haut, chiffres du bas] pour chaque problème
  function generer(formes) {
    const vus = new Set();
    return formes.map(([na, nb]) => {
      let a; let b;
      for (let essai = 0; essai < 50; essai++) {
        a = nombre(na);
        b = nombre(nb);
        if (nb === 1 && b === 1) continue; // × 1 : trop facile
        if (!vus.has(`${a}x${b}`)) break;
      }
      vus.add(`${a}x${b}`);
      return [a, b];
    });
  }

  return { NOMS, creer, explication, indiceLigne, colonnesSomme, indiceSomme, generer };
})();

if (typeof module !== 'undefined') module.exports = Colonnes;
