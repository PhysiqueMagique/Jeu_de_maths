/* ==========================================================
   Nombres décimaux — logique (sans affichage)
   ----------------------------------------------------------
   Un nombre décimal : { v, p } = v ÷ 10^p   (ex. 4,70 → { v: 470, p: 2 }); on l'écrit avec une virgule.
   Types de questions (q.type) :
     'lire'      sur la droite numérique, quel nombre montre la flèche?   → le nombre (tapé)
     'placer'    clique sur le trait qui montre 2,34                       → l'index du trait
     'valeur'    dans 3,472, quel chiffre est aux centièmes?               → un chiffre
     'comparer'  0,7 ? 0,65                                                → '<' | '=' | '>'
     'operation' 4,7 + 2,35 (en alignant les virgules)                     → le nombre
   ========================================================== */
'use strict';

const Decimaux = (() => {
  const RANGS = ['unités', 'dixièmes', 'centièmes', 'millièmes'];
  const RANG_UN = ['unité', 'dixième', 'centième', 'millième'];

  // { v: 470, p: 2 } → « 4,70 »
  function ecrire({ v, p }) {
    const s = String(Math.abs(v)).padStart(p + 1, '0');
    const ent = s.slice(0, s.length - p);
    const dec = s.slice(s.length - p);
    return (v < 0 ? '−' : '') + (p ? `${ent},${dec}` : ent);
  }
  // sans les zéros inutiles à la fin : 4,70 → 4,7
  function simplifier(x) {
    let { v, p } = x;
    while (p > 0 && v % 10 === 0) { v /= 10; p--; }
    return { v, p };
  }
  const court = (x) => ecrire(simplifier(x));
  const milliemes = ({ v, p }) => v * 10 ** (3 - p);
  // « 4,7 » (tapé) → { v, p } ou null
  function lire(texte) {
    const t = String(texte).replace('.', ',');
    if (!/^\d*,?\d*$/.test(t) || !/\d/.test(t)) return null;
    const [ent, dec = ''] = t.split(',');
    if (dec.length > 3) return null;
    return { v: Number((ent || '0') + dec), p: dec.length };
  }
  const egaux = (a, b) => milliemes(a) === milliemes(b);
  const comparer = (a, b) => (milliemes(a) === milliemes(b) ? '=' : milliemes(a) < milliemes(b) ? '<' : '>');
  // même nombre de décimales (on ajoute des zéros) : 4,7 et 2,35 → 4,70 et 2,35
  const etendre = (x, p) => ({ v: x.v * 10 ** (p - x.p), p });

  function resultat(q) {
    const p = Math.max(q.a.p, q.b.p);
    const a = etendre(q.a, p);
    const b = etendre(q.b, p);
    return { v: q.op === '+' ? a.v + b.v : a.v - b.v, p };
  }

  // Les traits de la droite numérique : depuis q.debut, n intervalles de q.pas (en unités de 10^-p)
  const valeurTrait = (q, i) => ({ v: q.debut + i * q.pas, p: q.p });

  // Le chiffre d'un rang (0 = unités, 1 = dixièmes, …)
  function chiffre(x, rang) {
    const s = ecrire(x).replace('−', '');
    const [ent, dec = ''] = s.split(',');
    return rang === 0 ? Number(ent[ent.length - 1]) : Number(dec[rang - 1] || 0);
  }

  function attendu(q) {
    if (q.type === 'lire') return valeurTrait(q, q.cible);
    if (q.type === 'placer') return q.cible;
    if (q.type === 'valeur') return chiffre(q.nombre, q.rang);
    if (q.type === 'comparer') return comparer(q.a, q.b);
    return resultat(q);
  }

  // ---------- Explications et indices ----------
  const nomPas = (q) => {
    const pas = { v: q.pas, p: q.p };
    return `${court(pas)} (${q.pas === 1 ? `un ${RANG_UN[q.p]}` : `${q.pas} ${RANGS[q.p]}`})`;
  };

  function explication(q) {
    if (q.type === 'lire' || q.type === 'placer') {
      const x = valeurTrait(q, q.cible);
      return `De ${court(valeurTrait(q, 0))} à ${court(valeurTrait(q, q.n))}, la droite est coupée en ${q.n} : chaque petit trait vaut <b>${nomPas(q)}</b>. On compte ${q.cible} trait${q.cible > 1 ? 's' : ''} à partir de ${court(valeurTrait(q, 0))} : c’est <b>${court(x)}</b>.`;
    }
    if (q.type === 'valeur') {
      return `Après la virgule : le 1<sup>er</sup> chiffre, ce sont les <b>dixièmes</b>, le 2<sup>e</sup>, les <b>centièmes</b>, le 3<sup>e</sup>, les <b>millièmes</b>. Dans ${ecrire(q.nombre)}, le chiffre des ${RANGS[q.rang]} est <b>${attendu(q)}</b>.`;
    }
    if (q.type === 'comparer') {
      const p = Math.max(q.a.p, q.b.p);
      const a = etendre(q.a, p);
      const b = etendre(q.b, p);
      const pad = q.a.p !== q.b.p ? `On ajoute un zéro pour avoir autant de chiffres : ${ecrire(a)} et ${ecrire(b)}. ` : '';
      return `${pad}On compare chiffre par chiffre, de gauche à droite : ${ecrire(a)} <b>${comparer(q.a, q.b).replace('<', '&lt;').replace('>', '&gt;')}</b> ${ecrire(b)}.`;
    }
    const r = resultat(q);
    const zero = q.a.p !== q.b.p ? ` On ajoute un 0 pour que les deux nombres aient le même nombre de décimales (${ecrire(etendre(q.a.p < q.b.p ? q.a : q.b, r.p))}).` : '';
    return `On <b>aligne les virgules</b>, les unités sous les unités, les dixièmes sous les dixièmes…${zero} On calcule comme d’habitude, de droite à gauche, et la virgule descend à la même place : <b>${court(r)}</b>.`;
  }

  function indice(q, rep) {
    if (q.type === 'lire' || q.type === 'placer') {
      return `Chaque petit trait vaut <b>${nomPas(q)}</b>. Compte les traits à partir de ${court(valeurTrait(q, 0))}.`;
    }
    if (q.type === 'valeur') return 'Après la virgule : 1<sup>er</sup> chiffre = <b>dixièmes</b>, 2<sup>e</sup> = <b>centièmes</b>, 3<sup>e</sup> = <b>millièmes</b>. Avant la virgule : les unités.';
    if (q.type === 'comparer') {
      const p = Math.max(q.a.p, q.b.p);
      if (q.a.p !== q.b.p) {
        const [court1, long1] = q.a.p < q.b.p ? [q.a, q.b] : [q.b, q.a];
        const piege = comparer(long1, court1) === '<' ? 'Le plus long n’est pas toujours le plus grand! ' : '';
        return `${piege}Ajoute un zéro pour avoir autant de chiffres après la virgule : ${ecrire(court1)} = ${ecrire(etendre(court1, p))}. Compare ensuite ${ecrire(etendre(q.a, p))} et ${ecrire(etendre(q.b, p))}.`;
      }
      return 'Compare chiffre par chiffre, de gauche à droite : les unités, puis les dixièmes, puis les centièmes.';
    }
    // opération : a-t-il aligné les derniers chiffres au lieu des virgules?
    if (rep && q.a.p !== q.b.p) {
      const sa = Number(ecrire(q.a).replace(',', ''));
      const sb = Number(ecrire(q.b).replace(',', ''));
      const p = Math.max(q.a.p, q.b.p);
      const mal = { v: q.op === '+' ? sa + sb : Math.abs(sa - sb), p };
      if (egaux(rep, mal)) return `Attention : on aligne les <b>virgules</b>, pas les derniers chiffres! ${ecrire(q.a.p < q.b.p ? q.a : q.b)} = ${ecrire(etendre(q.a.p < q.b.p ? q.a : q.b, p))}.`;
    }
    const r = resultat(q);
    if (rep && rep.v === r.v * 10 ** (rep.p - r.p) * 10) return 'Vérifie où tu as mis la virgule : elle descend à la même place que dans les nombres.';
    return 'Calcule colonne par colonne, de droite à gauche, sans oublier les retenues. La virgule descend à la même place.';
  }

  // ---------- Génération ----------
  const alea = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const choisir = (l) => l[Math.floor(Math.random() * l.length)];

  const fabrique = {
    // droite numérique : p = 1 (dixièmes, de 0 à 1 ou d'un entier au suivant), 2 (centièmes), 3 (millièmes)
    droite: (type, p) => {
      const n = 10;
      const debut = p === 1 ? alea(0, 4) * 10 : p === 2 ? alea(1, 59) * 10 : alea(100, 999) * 10;
      return { type, p, debut, pas: 1, n, cible: alea(1, n - 1) };
    },
    valeur: (p) => {
      const nombre = { v: alea(10 ** p + 1, 10 ** (p + 1) * 3 - 1), p };
      // des chiffres tous différents si possible, pour qu'on ne devine pas
      for (let essai = 0; essai < 30 && new Set(ecrire(nombre).replace(',', '')).size < p + 1; essai++) nombre.v = alea(10 ** p + 1, 10 ** (p + 1) * 3 - 1);
      return { type: 'valeur', nombre, rang: alea(Math.random() < 0.2 ? 0 : 1, p) };
    },
    // comparer : avec un piège (le plus long est le plus petit), ou deux nombres égaux écrits autrement
    comparer: (pmax = 2) => {
      const ent = alea(0, 9);
      const genre = choisir(['piege', 'piege', 'egal', 'simple']);
      if (genre === 'egal') { const d = alea(1, 9); return { type: 'comparer', a: { v: ent * 10 + d, p: 1 }, b: { v: ent * 100 + d * 10, p: 2 } }; }
      if (genre === 'piege') {
        // 0,7 et 0,65 : moins de chiffres, mais plus grand
        const d = alea(2, 9);
        let x;
        do x = alea((d - 1) * 10 ** (pmax - 1) + 1, d * 10 ** (pmax - 1) - 1); while (x % 10 === 0); // pas de 0 à la fin (0,650)
        const long = { v: ent * 10 ** pmax + x, p: pmax };
        const a = { v: ent * 10 + d, p: 1 };
        return Math.random() < 0.5 ? { type: 'comparer', a, b: long } : { type: 'comparer', a: long, b: a };
      }
      const cent = () => { let x; do x = alea(1, 99); while (x % 10 === 0); return { v: ent * 100 + x, p: 2 }; };
      const a = cent();
      let b = cent();
      while (b.v === a.v) b = cent();
      return { type: 'comparer', a, b };
    },
    operation: (op, pmax = 2) => {
      for (let essai = 0; essai < 50; essai++) {
        const pa = alea(1, pmax);
        const pb = alea(1, pmax);
        const a = { v: alea(10 ** pa, 30 * 10 ** pa), p: pa };
        const b = { v: alea(10 ** pb, 20 * 10 ** pb), p: pb };
        if (a.v % 10 === 0 || b.v % 10 === 0) continue; // pas de zéro inutile à la fin (4,50)
        const q = { type: 'operation', op, a, b };
        if (op === '−' && milliemes(a) <= milliemes(b)) { q.a = b; q.b = a; }
        if (milliemes(resultat(q)) > 0) return q;
      }
      return { type: 'operation', op, a: { v: 47, p: 1 }, b: { v: 235, p: 2 } };
    },
  };

  function generer(recette) {
    return recette.map(([type, ...opts]) => fabrique[type](...opts));
  }

  return { RANGS, ecrire, simplifier, court, lire, egaux, comparer, etendre, resultat, valeurTrait, chiffre, attendu, explication, indice, generer, milliemes };
})();

if (typeof module !== 'undefined') module.exports = Decimaux;
