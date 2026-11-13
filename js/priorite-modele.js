/* ==========================================================
   Priorité des opérations — logique (sans affichage)
   ----------------------------------------------------------
   Règles :  1. les parenthèses d'abord (les plus à l'intérieur);
             2. ensuite × et ÷, de gauche à droite;
             3. enfin + et −, de gauche à droite.
   Une expression = une liste de jetons :
     { t: 'n', v: 12 } (nombre), { t: 'op', v: '×' }, { t: '(' }, { t: ')' }
   ========================================================== */
'use strict';

const Priorite = (() => {
  const OPS = ['+', '−', '×', '÷'];
  const fort = (o) => o === '×' || o === '÷';

  // « 3 + 4 × (8 − 5) » → jetons
  function lire(texte) {
    const jetons = [];
    const s = texte.replace(/\s+/g, '');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (/\d/.test(c)) {
        let n = c;
        while (i + 1 < s.length && /\d/.test(s[i + 1])) n += s[++i];
        jetons.push({ t: 'n', v: Number(n) });
      } else if (c === '(' || c === ')') jetons.push({ t: c });
      else {
        const o = { '*': '×', x: '×', '/': '÷', '-': '−' }[c] || c;
        jetons.push({ t: 'op', v: o });
      }
    }
    return jetons;
  }

  const texte = (jetons) => jetons.map((j) => (j.t === 'n' ? j.v : j.t === 'op' ? ` ${j.v} ` : j.t)).join('').replace(/\( /g, '(').replace(/ \)/g, ')');

  // La zone où chercher : l'intérieur des parenthèses les plus profondes (ou toute l'expression)
  function zone(jetons) {
    const fermante = jetons.findIndex((j) => j.t === ')');
    if (fermante < 0) return [0, jetons.length - 1, false];
    let ouvrante = fermante;
    while (ouvrante >= 0 && jetons[ouvrante].t !== '(') ouvrante--;
    return [ouvrante + 1, fermante - 1, true];
  }

  // L'opération à faire maintenant (index du jeton opérateur), ou -1 si c'est fini
  function prochaine(jetons) {
    const [a, b] = zone(jetons);
    let premier = -1;
    for (let i = a; i <= b; i++) {
      if (jetons[i].t !== 'op') continue;
      if (fort(jetons[i].v)) return i;
      if (premier < 0) premier = i;
    }
    return premier;
  }

  function calculer(x, o, y) {
    if (o === '+') return x + y;
    if (o === '−') return x - y;
    if (o === '×') return x * y;
    return x / y;
  }

  // Fait l'opération i : remplace « a op b » par le résultat, enlève les parenthèses inutiles.
  // Renvoie { jetons, resultat, pos } (pos = index du résultat dans la nouvelle liste)
  function reduire(jetons, i) {
    const a = jetons[i - 1].v;
    const b = jetons[i + 1].v;
    const r = calculer(a, jetons[i].v, b);
    let j = [...jetons.slice(0, i - 1), { t: 'n', v: r, nouveau: true }, ...jetons.slice(i + 2)];
    let pos = i - 1;
    // ( 7 ) → 7
    while (pos > 0 && j[pos - 1].t === '(' && j[pos + 1] && j[pos + 1].t === ')') {
      j = [...j.slice(0, pos - 1), j[pos], ...j.slice(pos + 2)];
      pos--;
    }
    j = j.map((x, k) => (k === pos ? x : { ...x, nouveau: false }));
    return { jetons: j, resultat: r, pos };
  }

  // Toutes les étapes d'une expression
  function etapes(jetons) {
    const res = [];
    let j = jetons;
    let i = prochaine(j);
    while (i >= 0) {
      const { jetons: suite, resultat } = reduire(j, i);
      res.push({ jetons: j, i, a: j[i - 1].v, op: j[i].v, b: j[i + 1].v, resultat });
      j = suite;
      i = prochaine(j);
    }
    return { etapes: res, valeur: j.length === 1 ? j[0].v : NaN };
  }

  function creer(expr) {
    const jetons = lire(expr);
    const { etapes: e, valeur } = etapes(jetons);
    return { expr, jetons, etapes: e, valeur };
  }

  // Pourquoi l'opération cliquée n'est pas la bonne?
  function pourquoi(jetons, clique) {
    const bon = prochaine(jetons);
    const [a, b, dansParentheses] = zone(jetons);
    const dedans = clique >= a && clique <= b;
    if (dansParentheses && !dedans) {
      // l'opération cliquée est-elle dans d'autres parenthèses?
      let profondeur = 0;
      for (let k = 0; k < clique; k++) {
        if (jetons[k].t === '(') profondeur++;
        if (jetons[k].t === ')') profondeur--;
      }
      if (profondeur > 0) return 'Commence par les parenthèses <b>les plus à l’intérieur</b>!';
      return 'Les <b>parenthèses</b> d’abord! Ce qui est entre parenthèses se calcule en premier.';
    }
    const o = jetons[clique].v;
    const ob = jetons[bon].v;
    if (!fort(o) && fort(ob)) return `<b>×</b> et <b>÷</b> passent avant <b>+</b> et <b>−</b>! Fais d’abord le ${ob}.`;
    return 'Quand les opérations sont du même niveau, on va de <b>gauche à droite</b>!';
  }

  // L'explication du choix (tutoriel)
  function explicationChoix(jetons) {
    const i = prochaine(jetons);
    const [a, b, dansParentheses] = zone(jetons);
    const o = jetons[i].v;
    const ops = jetons.slice(a, b + 1).filter((x) => x.t === 'op');
    if (dansParentheses) {
      return ops.length > 1
        ? `On commence par les <b>parenthèses</b>. À l’intérieur, ${fort(o) ? '× et ÷ passent avant + et −' : 'on va de gauche à droite'} : clique sur le <b>${o}</b>.`
        : `On commence par les <b>parenthèses</b> : clique sur le <b>${o}</b>.`;
    }
    const tous = jetons.filter((x) => x.t === 'op');
    if (fort(o) && tous.some((x) => !fort(x.v))) return `<b>×</b> et <b>÷</b> passent avant <b>+</b> et <b>−</b> : clique sur le <b>${o}</b>.`;
    if (tous.length > 1) return `Les opérations sont du même niveau : on va de <b>gauche à droite</b>. Clique sur le <b>${o}</b>.`;
    return `Il reste une seule opération : clique sur le <b>${o}</b>.`;
  }

  // ---------- Génération ----------
  // Un gabarit (« a + b × c ») dont on tire les lettres au hasard, en vérifiant que tous les calculs restent
  // faciles à faire de tête : pas de nombres négatifs, divisions exactes, tables jusqu'à 10, résultats ≤ 100.
  const alea = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  function convenable(P, maxRes) {
    if (!Number.isInteger(P.valeur)) return false;
    for (const e of P.etapes) {
      const r = e.resultat;
      if (!Number.isInteger(r) || r < 0 || r > maxRes) return false;
      if (e.op === '×' && (Math.min(e.a, e.b) > 10 || Math.min(e.a, e.b) < 2 || Math.max(e.a, e.b) > 12)) return false;
      if (e.op === '÷' && (e.b < 2 || e.b > 10 || r > 12 || r < 2)) return false;
      if ((e.op === '+' || e.op === '−') && (e.b === 0 || r === 0)) return false;
    }
    return true;
  }

  function remplir(gabarit, max) {
    return gabarit.replace(/[a-h]/g, () => String(alea(2, max)));
  }

  function generer(gabarits, { max = 20, maxRes = 100 } = {}) {
    const vus = new Set();
    return gabarits.map((g) => {
      for (let essai = 0; essai < 4000; essai++) {
        const e = remplir(g, max);
        if (vus.has(e)) continue;
        const P = creer(e);
        if (convenable(P, maxRes)) { vus.add(e); return e; }
      }
      return g.replace(/[a-h]/g, '2'); // ne devrait pas arriver
    });
  }

  // Mélange sans répéter le même gabarit deux fois de suite
  function tirer(gabarits, n) {
    const res = [];
    while (res.length < n) {
      const g = gabarits[Math.floor(Math.random() * gabarits.length)];
      if (res[res.length - 1] !== g || gabarits.length === 1) res.push(g);
    }
    return res;
  }

  return { OPS, lire, texte, zone, prochaine, reduire, etapes, creer, pourquoi, explicationChoix, generer, tirer, calculer };
})();

if (typeof module !== 'undefined') module.exports = Priorite;
