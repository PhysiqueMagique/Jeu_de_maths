/* ==========================================================
   Fractions — logique (sans affichage)
   ----------------------------------------------------------
   Types de questions (q.type) :
     'lire'      quelle fraction est coloriée?             → [num, den]
     'colorier'  colorie 3/5 (clic sur les parts)          → nombre de parts coloriées
     'equiv'     2/3 = ?/6  (ou 2/3 = 4/?)                 → le nombre manquant
     'comparer'  3/4 ? 2/3                                  → '<' | '=' | '>'
     'operation' 2/7 + 3/7 = ?   (même dénominateur, ou un multiple de l'autre au diamant) → [num, den]
   Une fraction : [numérateur, dénominateur].
   ========================================================== */
'use strict';

const Fractions = (() => {
  const NOMS = { 2: 'demis', 3: 'tiers', 4: 'quarts', 5: 'cinquièmes', 6: 'sixièmes', 7: 'septièmes', 8: 'huitièmes', 9: 'neuvièmes', 10: 'dixièmes', 11: 'onzièmes', 12: 'douzièmes', 16: 'seizièmes', 15: 'quinzièmes', 20: 'vingtièmes', 18: 'dix-huitièmes', 14: 'quatorzièmes' };
  const nom = (d) => NOMS[d] || `${d}<sup>e</sup>`;
  const valeur = ([n, d]) => n / d;
  const egales = (a, b) => a[0] * b[1] === b[0] * a[1];
  const comparer = (a, b) => (egales(a, b) ? '=' : valeur(a) < valeur(b) ? '<' : '>');

  // Le résultat d'une opération (dans le plus grand des deux dénominateurs)
  function resultat(q) {
    const D = Math.max(q.a[1], q.b[1]);
    const na = q.a[0] * (D / q.a[1]);
    const nb = q.b[0] * (D / q.b[1]);
    return [q.op === '+' ? na + nb : na - nb, D];
  }

  // La réponse attendue
  function attendu(q) {
    if (q.type === 'lire') return q.f;
    if (q.type === 'colorier') return q.f[0];
    if (q.type === 'equiv') return q.manque === 'num' ? q.a[0] * (q.d2 / q.a[1]) : q.a[1] * (q.n2 / q.a[0]);
    if (q.type === 'comparer') return comparer(q.a, q.b);
    return resultat(q);
  }

  // ---------- Indices ----------
  function indice(q, rep) {
    const f = (x) => `${x[0]}/${x[1]}`;
    if (q.type === 'lire') {
      const [n, d] = q.f;
      if (rep[0] === d && rep[1] === n) return 'Attention : <b>en haut</b>, les parts coloriées; <b>en bas</b>, toutes les parts.';
      if (rep[1] !== d) return `Le <b>dénominateur</b> (en bas), c’est le nombre de parts <b>en tout</b>, coloriées ou non. Compte-les toutes!`;
      return 'Le <b>numérateur</b> (en haut), c’est le nombre de parts <b>coloriées</b>. Compte-les!';
    }
    if (q.type === 'colorier') {
      return `Tu as colorié <b>${rep}</b> part${rep > 1 ? 's' : ''}. Pour ${f(q.f)}, il en faut <b>${q.f[0]}</b> sur ${q.f[1]}.`;
    }
    if (q.type === 'equiv') {
      if (q.manque === 'num') {
        const k = q.d2 / q.a[1];
        return `Le dénominateur a été multiplié par <b>${k}</b> (${q.a[1]} × ${k} = ${q.d2}) : fais la même chose au numérateur!`;
      }
      const k = q.n2 / q.a[0];
      return `Le numérateur a été multiplié par <b>${k}</b> (${q.a[0]} × ${k} = ${q.n2}) : fais la même chose au dénominateur!`;
    }
    if (q.type === 'comparer') {
      const [a, b] = [q.a, q.b];
      if (a[1] === b[1]) return `Même dénominateur : les parts sont de la même grosseur. Compare les numérateurs (${a[0]} et ${b[0]}).`;
      if (a[0] === b[0]) return `Même numérateur : plus le dénominateur est grand, plus les parts sont <b>petites</b>! Des ${nom(a[1])} ou des ${nom(b[1])}?`;
      const D = Math.max(a[1], b[1]);
      const p = a[1] === D ? b : a;
      return `Transforme ${f(p)} en ${nom(D)} : ${f(p)} = ?/${D}. Ensuite, compare les numérateurs.`;
    }
    // opération
    const [n, d] = resultat(q);
    const memeDen = q.a[1] === q.b[1];
    if (memeDen && q.op === '+' && rep[1] === q.a[1] + q.b[1]) return `On n’additionne pas les dénominateurs! Des ${nom(d)} + des ${nom(d)}, ça donne des ${nom(d)} : le dénominateur reste <b>${d}</b>.`;
    if (memeDen && q.op === '−' && rep[1] === 0) return `On ne soustrait pas les dénominateurs! Des ${nom(d)} − des ${nom(d)}, ça donne des ${nom(d)} : le dénominateur reste <b>${d}</b>.`;
    if (memeDen && rep[1] !== d) return `Le dénominateur ne change pas : on ${q.op === '+' ? 'ajoute' : 'enlève'} des ${nom(d)}, alors la réponse est en ${nom(d)}.`;
    if (memeDen) return `${q.op === '+' ? 'Additionne' : 'Soustrais'} les numérateurs : ${q.a[0]} ${q.op} ${q.b[0]}.`;
    const petit = q.a[1] < q.b[1] ? q.a : q.b;
    const k = d / petit[1];
    return `Transforme d’abord ${f(petit)} en ${nom(d)} : multiplie en haut et en bas par ${k} (${f(petit)} = ${petit[0] * k}/${d}).`;
  }

  // Explication complète (tutoriel)
  function explication(q) {
    const f = (x) => `${x[0]}/${x[1]}`;
    if (q.type === 'lire') return `La pizza est coupée en <b>${q.f[1]}</b> parts égales (le dénominateur, en bas) et <b>${q.f[0]}</b> sont coloriées (le numérateur, en haut) : c’est <b>${f(q.f)}</b>.`;
    if (q.type === 'colorier') return `Pour ${f(q.f)}, colorie <b>${q.f[0]}</b> parts sur ${q.f[1]}.`;
    if (q.type === 'equiv') {
      const k = q.d2 / q.a[1];
      return `${q.a[1]} × ${k} = ${q.d2} : on multiplie aussi le numérateur par ${k}, ${q.a[0]} × ${k} = <b>${q.a[0] * k}</b>. Regarde : les deux barres sont coloriées jusqu’au même endroit!`;
    }
    if (q.type === 'comparer') return `${indice(q)} Donc ${f(q.a)} <b>${comparer(q.a, q.b)}</b> ${f(q.b)}.`;
    const [n, d] = resultat(q);
    return `Les parts sont des ${nom(d)} : on ${q.op === '+' ? 'additionne' : 'soustrait'} les numérateurs, ${q.a[0]} ${q.op} ${q.b[0]} = <b>${n}</b>, et le dénominateur reste <b>${d}</b>. Réponse : <b>${n}/${d}</b>.`;
  }

  // ---------- Génération ----------
  const alea = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const choisir = (l) => l[Math.floor(Math.random() * l.length)];

  const fabrique = {
    lire: () => { const d = alea(2, 8); return { type: 'lire', f: [alea(1, d - 1), d], forme: choisir(['pizza', 'barre']) }; },
    colorier: () => { const d = alea(3, 10); return { type: 'colorier', f: [alea(1, d - 1), d], forme: choisir(['pizza', 'barre']) }; },
    equiv: (o = {}) => {
      const d = alea(2, 6);
      const n = alea(1, d - 1);
      const k = alea(2, o.grand ? 5 : 3);
      return Math.random() < (o.den ? 1 : 0.7) && !o.num
        ? { type: 'equiv', manque: 'num', a: [n, d], d2: d * k }
        : { type: 'equiv', manque: 'den', a: [n, d], n2: n * k };
    },
    // comparer : 'den' (même dénominateur), 'num' (même numérateur), 'multiple' (un dénominateur multiple de l'autre)
    comparer: (genre) => {
      for (let essai = 0; essai < 50; essai++) {
        let a;
        let b;
        if (genre === 'den') { const d = alea(3, 10); a = [alea(1, d - 1), d]; b = [alea(1, d - 1), d]; }
        else if (genre === 'num') { const n = alea(1, 4); a = [n, alea(n + 1, 10)]; b = [n, alea(n + 1, 10)]; }
        else { const d = alea(2, 5); const k = alea(2, 3); a = [alea(1, d - 1), d]; b = [alea(1, d * k - 1), d * k]; if (Math.random() < 0.5) [a, b] = [b, a]; }
        if (a[0] !== b[0] || a[1] !== b[1]) return { type: 'comparer', a, b };
      }
      return { type: 'comparer', a: [1, 2], b: [1, 3] };
    },
    // opération : même dénominateur (résultat entre 0 et 1), ou diamant (un dénominateur multiple de l'autre)
    operation: (op, multiple) => {
      for (let essai = 0; essai < 100; essai++) {
        const d = multiple ? alea(2, 5) : alea(4, 12);
        const d2 = multiple ? d * alea(2, 3) : d;
        const a = [alea(1, d - 1), d];
        const b = [alea(1, d2 - 1), d2];
        const q = Math.random() < 0.5 && multiple ? { type: 'operation', op, a: b, b: a } : { type: 'operation', op, a, b };
        const [n, D] = resultat(q);
        if (n > 0 && n < D) return q;
      }
      return { type: 'operation', op, a: [1, 4], b: [2, 4] };
    },
  };

  // recette : liste de [type, options…]
  function generer(recette, sansDessin) {
    return recette.map(([type, ...opts]) => {
      const q = fabrique[type](...opts);
      if (sansDessin) q.sansDessin = true;
      return q;
    });
  }

  return { NOMS, nom, valeur, egales, comparer, resultat, attendu, indice, explication, generer };
})();

if (typeof module !== 'undefined') module.exports = Fractions;
