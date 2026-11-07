/* ==========================================================
   Soustraction avec emprunt — logique (sans affichage)
   ----------------------------------------------------------
   Un problème P garde, pour chaque colonne (0 = la plus à gauche) :
     - haut[i] : le chiffre du haut, tel qu'écrit au départ
     - bas[i]  : le chiffre du bas (null s'il n'y en a pas)
     - prete[i]: combien de fois la colonne a prêté (barré)
     - recuAvant[i] / recuApres[i] : a reçu 10 avant / après avoir prêté
     - reponse[i] : le chiffre écrit par l'élève (ou null)
   La valeur actuelle d'une colonne = haut + 10 × (reçu) − prêté.
   ========================================================== */
'use strict';

const Modele = (() => {
  const NOMS = ['unités', 'dizaines', 'centaines', 'milliers'];
  const UN_NOM = ['une unité', 'une dizaine', 'une centaine', 'un millier'];
  const LE_NOM = ["l'unité", 'la dizaine', 'la centaine', 'le millier'];
  const A_LA = ["à l'unité", 'à la dizaine', 'à la centaine', 'au millier'];
  const LETTRES = ['U', 'D', 'C', 'M'];

  // ---------- Création ----------

  function creer(a, b) {
    const n = String(a).length;
    const haut = String(a).split('').map(Number);
    const bas = String(b).padStart(n, ' ').split('').map((c) => (c === ' ' ? null : Number(c)));
    const attendu = String(a - b).padStart(n, '0').split('').map(Number);
    // Les zéros au début du résultat sont facultatifs (on peut laisser la case vide).
    const optionnel = [];
    let enTete = true;
    for (let i = 0; i < n; i++) {
      if (enTete && attendu[i] === 0 && i < n - 1) optionnel.push(true);
      else { enTete = false; optionnel.push(false); }
    }
    return {
      a, b, n, haut, bas, attendu, optionnel,
      prete: Array(n).fill(0),
      recuAvant: Array(n).fill(false),
      recuApres: Array(n).fill(false),
      enMain: null, // colonne qui vient de prêter (la dizaine est « dans les mains »)
      reponse: Array(n).fill(null),
      statut: Array(n).fill(null), // 'ok' | 'faux' | null
    };
  }

  // ---------- Petites fonctions utiles ----------

  const rang = (P, i) => P.n - 1 - i;
  const nom = (P, i) => NOMS[rang(P, i)];
  const unNom = (P, i) => UN_NOM[rang(P, i)];
  const leNom = (P, i) => LE_NOM[rang(P, i)];
  const aLa = (P, i) => A_LA[rang(P, i)]; // « emprunter à la dizaine »
  const lettre = (P, i) => LETTRES[rang(P, i)];
  const bas = (P, i) => (P.bas[i] === null ? 0 : P.bas[i]);
  const val = (P, i) => P.haut[i] + 10 * ((P.recuAvant[i] ? 1 : 0) + (P.recuApres[i] ? 1 : 0)) - P.prete[i];
  const valDessus = (P, i) => P.haut[i] + (P.recuAvant[i] ? 10 : 0) - P.prete[i];

  // Une colonne a besoin de recevoir 10 si elle est trop petite pour sa soustraction,
  // ou si elle vaut 0 et doit elle-même prêter à sa voisine de droite.
  function besoin(P, i) {
    if (i >= P.n) return false;
    return val(P, i) < bas(P, i) || (val(P, i) === 0 && besoin(P, i + 1));
  }

  function estCorrecte(P, i) {
    return P.reponse[i] === P.attendu[i] || (P.optionnel[i] && P.reponse[i] === null);
  }

  function resolu(P) {
    for (let i = 0; i < P.n; i++) if (!estCorrecte(P, i)) return false;
    return true;
  }

  function effacerSiChange(P, i) {
    if (P.reponse[i] === null) return null;
    P.reponse[i] = null;
    P.statut[i] = null;
    return `(J'ai effacé ta réponse sous les ${nom(P, i)} : cette colonne a changé.)`;
  }

  // ---------- Actions de l'élève ----------

  // Clic sur un chiffre du haut pour qu'il prête 10 à sa voisine de droite.
  function preter(P, i) {
    if (P.enMain !== null) {
      return { ok: false, msg: `Dépose d'abord ce que tu as emprunté : clique sur la colonne des ${nom(P, P.enMain + 1)}.` };
    }
    const droiteABesoin = i < P.n - 1 && besoin(P, i + 1);
    if (!droiteABesoin) {
      if (i > 0 && besoin(P, i)) {
        return { ok: false, msg: `Pour aider la colonne des ${nom(P, i)}, il faut emprunter ${aLa(P, i - 1)} : clique sur le chiffre des ${nom(P, i - 1)}.` };
      }
      if (i === P.n - 1) {
        return { ok: false, msg: "Les unités sont tout à droite : elles n'ont personne à qui prêter." };
      }
      return { ok: false, msg: `Pas besoin d'emprunter ici : dans la colonne des ${nom(P, i + 1)}, ${val(P, i + 1)} − ${bas(P, i + 1)}, ça se fait déjà!` };
    }
    if (val(P, i) === 0) {
      return { ok: false, msg: `Ce 0 n'a rien à prêter! Il doit d'abord emprunter lui-même ${aLa(P, i - 1)}.` };
    }
    const avant = val(P, i);
    P.prete[i] += 1;
    P.enMain = i;
    return {
      ok: true,
      info: `Le ${avant} devient ${val(P, i)}. Tu tiens ${unNom(P, i)} (= 10 ${nom(P, i + 1)}).`,
      efface: effacerSiChange(P, i),
    };
  }

  // Clic sur la colonne qui reçoit les 10 empruntés.
  function recevoir(P, i) {
    if (P.enMain === null) return { ok: false, msg: '' };
    if (i !== P.enMain + 1) {
      return { ok: false, msg: `Ce que tu as emprunté va dans la colonne juste à droite : celle des ${nom(P, P.enMain + 1)}.` };
    }
    const avant = val(P, i);
    if (P.prete[i] > 0) P.recuApres[i] = true;
    else P.recuAvant[i] = true;
    P.enMain = null;
    return {
      ok: true,
      info: `Le ${avant} devient ${val(P, i)}!`,
      efface: effacerSiChange(P, i),
    };
  }

  // L'élève écrit un chiffre dans la case réponse de la colonne i.
  function poser(P, i, d) {
    if (P.enMain !== null) {
      return { ok: false, msg: `Dépose d'abord ce que tu as emprunté dans la colonne des ${nom(P, P.enMain + 1)}.` };
    }
    if (val(P, i) < bas(P, i)) {
      return { ok: false, msg: `${val(P, i)} − ${bas(P, i)}, c'est impossible : ${val(P, i)} est plus petit que ${bas(P, i)}! Il faut d'abord emprunter${i > 0 ? ` ${aLa(P, i - 1)}` : ''}.` };
    }
    P.reponse[i] = d;
    P.statut[i] = null;
    return { ok: true };
  }

  // ---------- L'indice : quelle est la prochaine étape? ----------

  function conseil(P) {
    if (P.enMain !== null) {
      const j = P.enMain + 1;
      return { type: 'recevoir', col: j, texte: `Dépose ${leNom(P, P.enMain)} dans la colonne des ${nom(P, j)} : clique sur le ${val(P, j)}.` };
    }
    for (let j = P.n - 1; j >= 0; j--) {
      if (estCorrecte(P, j)) continue;
      if (val(P, j) < bas(P, j)) {
        let k = j - 1;
        while (k >= 0 && val(P, k) === 0) k--;
        if (k === j - 1) {
          return {
            type: 'preter', col: k,
            texte: `Colonne des ${nom(P, j)} : ${val(P, j)} − ${bas(P, j)}, c'est impossible (${val(P, j)} est plus petit que ${bas(P, j)}). Emprunte ${aLa(P, k)} : clique sur le ${val(P, k)} des ${nom(P, k)}.`,
          };
        }
        return {
          type: 'preter', col: k,
          texte: `Colonne des ${nom(P, j)} : il faut emprunter, mais le chiffre des ${nom(P, j - 1)} vaut 0 : il n'a rien à prêter! Commence par emprunter ${aLa(P, k)} : clique sur le ${val(P, k)}.`,
        };
      }
      let texte;
      if (P.optionnel[j] && val(P, j) - bas(P, j) === 0) {
        texte = `Colonne des ${nom(P, j)} : il reste 0. Un 0 au début d'un nombre, on peut laisser la case vide.`;
      } else if (P.bas[j] === null) {
        texte = `Colonne des ${nom(P, j)} : il n'y a rien en dessous, on enlève 0. Combien font ${val(P, j)} − 0?`;
      } else {
        texte = `Colonne des ${nom(P, j)} : combien font ${val(P, j)} − ${bas(P, j)}?`;
        if (P.prete[j] > 0) texte += ` (Attention : le ${P.haut[j]} est barré, il vaut maintenant ${val(P, j)}.)`;
      }
      return { type: 'reponse', col: j, texte };
    }
    return { type: 'fini', texte: '' };
  }

  // ---------- Génération des défis ----------

  const alea = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  // Décrit les emprunts qu'il faut faire pour a − b.
  function analyse(a, b) {
    const n = String(a).length;
    const A = String(a).split('').map(Number);
    const B = String(b).padStart(n, '0').split('').map(Number);
    let e = 0;
    const cols = [];
    let zero = false; // il faut emprunter « à travers » un 0
    let piege = false; // inverser les chiffres (8 − 3 au lieu de 13 − 8) donnerait la bonne réponse
    for (let i = n - 1; i >= 0; i--) {
      if (e && A[i] === 0) zero = true;
      if (A[i] - e < B[i]) {
        if (e === 0 && B[i] - A[i] === 5) piege = true;
        cols.push(i);
        e = 1;
      } else e = 0;
    }
    return { n, A, B, nb: cols.length, cols, zero, piege };
  }

  function tirer(generer, accepter) {
    for (let t = 0; t < 20000; t++) {
      const [a, b] = generer();
      if (b > 0 && a > b) {
        const an = analyse(a, b);
        if (!an.piege && accepter(an, a, b)) return [a, b];
      }
    }
    return null;
  }

  const unites = (an) => an.n - 1;
  const dizaines = (an) => an.n - 2;

  const RECETTES = {
    // Nombres à 2 chiffres, un seul emprunt (aux unités)
    bronze: (k) => tirer(
      () => [alea(31, 98), k === 3 ? alea(3, 9) : alea(12, 89)],
      (an) => an.nb === 1 && an.cols[0] === unites(an),
    ),
    // Nombres à 3 chiffres : emprunt aux unités, aux dizaines, puis les deux
    argent: (k) => tirer(
      () => [alea(211, 989), k === 0 ? alea(12, 98) : k === 1 ? alea(12, 899) : alea(101, 899)],
      (an) => {
        if (an.zero) return false;
        const u = an.cols.includes(unites(an));
        const d = an.cols.includes(dizaines(an));
        if (k === 0) return u && !d && an.nb === 1;
        if (k === 1) return d && !u && an.nb === 1;
        if (k === 2) return u && d;
        return an.nb >= 1;
      },
    ),
    // Emprunter à travers des zéros, puis des milliers
    or: (k) => {
      if (k <= 1) return tirer(() => [alea(2, 9) * 100 + alea(1, 8), alea(12, 899)], (an) => an.A[1] === 0 && an.zero);
      if (k === 2) return tirer(() => [alea(3, 9) * 100, alea(101, 899)], (an) => an.zero && an.nb >= 2);
      if (k === 3) return tirer(() => [alea(2001, 9899), alea(101, 8999)], (an) => !an.zero && an.nb >= 2);
      return tirer(() => [alea(2, 9) * 1000 + alea(1, 99), alea(101, 8999)], (an) => an.zero && an.nb >= 2);
    },
  };

  const SECOURS = {
    bronze: [[52, 37], [81, 46], [64, 29], [43, 7], [90, 58]],
    argent: [[352, 27], [628, 173], [741, 386], [523, 248], [912, 457]],
    or: [[403, 158], [702, 36], [600, 247], [5234, 1678], [4005, 1327]],
  };

  function genererNiveau(niveau, nb = 5) {
    const liste = [];
    const vus = new Set();
    for (let k = 0; k < nb; k++) {
      let p = null;
      for (let essai = 0; essai < 20 && (!p || vus.has(p.join('-'))); essai++) p = RECETTES[niveau](k);
      if (!p || vus.has(p.join('-'))) p = SECOURS[niveau][k];
      vus.add(p.join('-'));
      liste.push(p);
    }
    return liste;
  }

  return {
    creer, rang, nom, unNom, leNom, aLa, lettre, bas, val, valDessus,
    besoin, estCorrecte, resolu,
    preter, recevoir, poser, conseil,
    analyse, genererNiveau,
  };
})();

if (typeof module !== 'undefined') module.exports = Modele;
