/* ==========================================================
   Priorité des opérations — affichage et déroulement (moteur : defis-moteur.js)
   On clique sur l'opération à faire en premier, on écrit son résultat,
   et l'expression se raccourcit d'une ligne à l'autre, comme sur une feuille :
       2 × (9 − 4) + 12 ÷ 3
     = 2 × 5 + 12 ÷ 3
     = 10 + 12 ÷ 3  …
   S.jetons : l'expression en cours; S.lignes : les lignes précédentes;
   S.choisi : l'opérateur choisi (index) ou null; S.clicOp : le clic à vérifier.
   De tête (émeraude) : on écrit seulement la réponse.
   ========================================================== */
'use strict';

(() => {
  const PR = Priorite;
  const CHRONO_RUBIS = 180;

  const BRONZE = ['a + b × c', 'a × b + c', 'a − b × c', 'a + b ÷ c', 'a ÷ b + c', 'a × b − c', 'a − b ÷ c', 'a ÷ b − c'];
  const ARGENT = ['(a + b) × c', 'a × (b + c)', '(a − b) × c', '(a + b) ÷ c', 'a − (b + c)', '(a + b) × c − d', 'a × (b − c) + d', 'a + (b − c) × d'];
  const OR = ['a ÷ b × c', 'a − b + c', 'a + b × c − d ÷ e', '(a + b) × c ÷ d', 'a × b − c × d', 'a − b + c × d', '(a − b) ÷ c + d × e', 'a × b ÷ c'];
  const DIAMANT = ['a × (b + (c − d) ÷ e)', '(a + b × (c − d)) ÷ e', 'a + b × (c + d) − e ÷ f', '(a × b − c) ÷ (d + e)', 'a − (b + c × (d − e))'];

  const gen = (gabarits, n, opts) => PR.generer(PR.tirer(gabarits, n), opts);

  ActiviteDefis({
    id: 'priorite-operations',
    titre: 'Priorité des opérations',
    sousTitre: 'Parenthèses, puis × et ÷, puis + et − : dans quel ordre calculer?',
    tutoTexte: 'Quatre exemples pour apprendre dans quel ordre faire les opérations.',
    finTutoTexte: 'Tu connais l’ordre : <b>1.</b> les parenthèses, <b>2.</b> × et ÷, <b>3.</b> + et −. Et quand c’est le même niveau, de gauche à droite!',
    mot: 'Expression',
    indiceDirect: true,

    niveaux: {
      bronze: { titre: 'Défi bronze', desc: 'Trois nombres, sans parenthèses (ex. 3 + 4 × 2)', requis: null, gen: () => gen(BRONZE, 6, { max: 12 }) },
      argent: { titre: 'Défi argent', desc: 'Avec des parenthèses (ex. (8 − 3) × 4)', requis: 'bronze', gen: () => gen(ARGENT, 5, { max: 15 }) },
      or: { titre: 'Défi or', desc: 'Plus long, et des pièges de gauche à droite', requis: 'argent', gen: () => gen(OR, 4, { max: 20 }) },
      rubis: {
        titre: 'Défi vitesse', pierre: 'rubis', chrono: CHRONO_RUBIS, gen: () => gen(OR, 5, { max: 20 }),
        desc: `5 expressions de niveau or en moins de ${CHRONO_RUBIS / 60} minutes!`,
        intro: `Défi vitesse! Tu as ${CHRONO_RUBIS / 60} minutes pour 5 expressions. Le chrono part maintenant!`,
      },
      emeraude: {
        titre: 'Défi de tête', pierre: 'emeraude', papier: true, maxErreurs: 1,
        gen: () => [...gen(ARGENT, 2, { max: 12 }), ...gen(OR, 3, { max: 15 })],
        desc: 'Calcule de tête (ou sur une feuille) et écris seulement la réponse. Une seule erreur permise!',
        intro: 'Défi de tête! Cette fois, pas de clics : calcule dans ta tête (ou sur une feuille) et écris seulement la réponse. <b>Attention : une seule erreur est permise</b> pour gagner l’émeraude.',
      },
      saphir: { titre: 'Sans faute', pierre: 'saphir', desc: 'Réussis les défis bronze, argent et or sans aucune erreur.' },
      diamant: {
        titre: 'Défi diamant', pierre: 'diamant', gen: () => gen(DIAMANT, 3, { max: 15, maxRes: 120 }),
        desc: 'Des parenthèses dans des parenthèses!',
        intro: 'Défi diamant! Il y a des <b>parenthèses dans des parenthèses</b> : commence toujours par celles qui sont <b>le plus à l’intérieur</b>.',
      },
    },

    tuto: [
      {
        titre: 'Tutoriel : × avant +', probleme: '3 + 4 × 2', mode: 'tuto',
        intro: [
          'Quand il y a plusieurs opérations, on ne les fait pas dans n’importe quel ordre! C’est la <b>priorité des opérations</b> : <b>1.</b> les parenthèses, <b>2.</b> × et ÷, <b>3.</b> + et −.',
          'Clique sur l’opération à faire <b>en premier</b>, puis écris sa réponse. L’expression se raccourcit à chaque étape, comme sur une feuille.',
        ],
      },
      {
        titre: 'Tutoriel : les parenthèses', probleme: '(3 + 4) × 2', mode: 'tuto',
        intro: ['Les mêmes nombres, mais avec des <b>parenthèses</b>! Ce qui est entre parenthèses se calcule <b>toujours en premier</b>. Tu vas voir : la réponse change!'],
      },
      {
        titre: 'Tutoriel : de gauche à droite', probleme: '18 − 6 + 2', mode: 'tuto',
        intro: ['Et quand les opérations sont du <b>même niveau</b> (+ et −, ou × et ÷)? On les fait de <b>gauche à droite</b>, comme quand on lit.'],
      },
      {
        titre: 'Tutoriel : à toi!', probleme: '2 × (9 − 4) + 12 ÷ 3', mode: 'semi',
        intro: ['À toi! Utilise les trois règles pour choisir l’ordre. Si tu te trompes, je te dirai quelle règle regarder.'],
      },
    ],

    generer: (N) => N.gen(),

    charger(S, expr) {
      S.P = PR.creer(expr);
      S.jetons = S.P.jetons;
      S.lignes = [];
      S.choisi = null;
      S.clicOp = null;
      S.saisie = '';
    },

    consigne(S) {
      if (S.papier) return 'Calcule de tête (ou sur une feuille), puis écris seulement la réponse.';
      if (S.choisi === null) {
        return S.mode === 'tuto' ? PR.explicationChoix(S.jetons) : 'Clique sur l’opération à faire <b>en premier</b>.';
      }
      const { a, op, b, r } = operation(S);
      return S.mode === 'tuto' ? `Calcule : ${a} ${op} ${b} = <b>${r}</b>. Écris ${r}.` : `Calcule : <b>${a} ${op} ${b}</b> = ?`;
    },

    clavierVisible: (S) => S.papier || S.choisi !== null,
    verifierVisible: (S) => S.papier || S.choisi !== null,

    entrer(S, t) {
      if (!S.papier && S.choisi === null) {
        this.H.dire('Clique d’abord sur l’opération à faire en premier.', 'oups');
        return false;
      }
      if (S.saisie.length >= 4) return false;
      S.saisie = S.saisie === '0' ? t : S.saisie + t;
      return true;
    },

    effacer(S) {
      if (!S.saisie) return false;
      S.saisie = S.saisie.slice(0, -1);
      return true;
    },

    clic(S, ev) {
      const b = ev.target.closest('.pdo-op');
      if (!b || S.papier || S.choisi !== null) return false;
      S.clicOp = Number(b.dataset.i);
      return 'verifier';
    },

    verifier(S) {
      if (S.papier) {
        if (!S.saisie) return { vide: 'Écris d’abord ta réponse.' };
        if (Number(S.saisie) === S.P.valeur) return { ok: true };
        return { faux: true, cle: S.saisie };
      }
      // 1. le choix de l'opération (après un clic)
      if (S.clicOp !== null) {
        const i = S.clicOp;
        S.clicOp = null;
        if (i === PR.prochaine(S.jetons)) {
          S.choisi = i;
          return { etape: `✓ ${this.consigne(S)}` };
        }
        return { faux: true, cle: `c${S.lignes.length}-${i}`, indice: PR.pourquoi(S.jetons, i) };
      }
      if (S.choisi === null) return { vide: 'Clique d’abord sur l’opération à faire en premier.' };
      // 2. le résultat de l'opération
      if (!S.saisie) return { vide: 'Écris d’abord le résultat.' };
      const { a, op, b, r } = operation(S);
      if (Number(S.saisie) !== r) {
        return {
          faux: true,
          cle: `r${S.lignes.length}-${S.saisie}`,
          indice: S.mode === 'tuto' ? `${a} ${op} ${b} = <b>${r}</b>.` : `Vérifie ton calcul : ${a} ${op} ${b}.`,
        };
      }
      S.lignes.push(S.jetons);
      S.jetons = PR.reduire(S.jetons, S.choisi).jetons;
      S.choisi = null;
      S.saisie = '';
      if (S.jetons.length === 1) return { ok: true };
      return { etape: `✓ ${this.consigne(S)}` };
    },

    aide(S) {
      if (S.statut === 'faux' && S.indice) return S.indice;
      if (S.choisi !== null) { const { a, op, b } = operation(S); return `Calcule ${a} ${op} ${b}.`; }
      return 'Rappelle-toi l’ordre : <b>1.</b> les parenthèses, <b>2.</b> × et ÷, <b>3.</b> + et −. Même niveau : de gauche à droite.';
    },

    reussite: (S) => `<b>${S.P.expr} = ${S.P.valeur}</b>`,

    rendre(S) {
      let h = '<div class="pdo">';
      if (S.papier) {
        h += `<div class="pdo-ligne actuelle">${jetonsHTML(S.P.jetons, null)}</div>
          <div class="pdo-ligne resultat">= ${boite(S, S.fini ? S.P.valeur : S.saisie)}</div>`;
        if (!S.fini) h += '<p class="papier-note">🧠 De tête, ou sur une feuille : écris seulement la réponse.</p>';
        return `${h}</div>`;
      }
      // les lignes déjà faites
      S.lignes.forEach((l, k) => {
        h += `<div class="pdo-ligne passee">${k ? '<span class="egal">=</span>' : ''}${jetonsHTML(l, null)}</div>`;
      });
      const egal = S.lignes.length ? '<span class="egal">=</span>' : '';
      if (S.fini) {
        h += `<div class="pdo-ligne actuelle finie">${egal}${jetonsHTML(S.jetons, null)}</div>`;
      } else {
        const guide = S.mode === 'tuto' && S.choisi === null ? PR.prochaine(S.jetons) : -1;
        h += `<div class="pdo-ligne actuelle">${egal}${jetonsHTML(S.jetons, S, guide)}</div>`;
        if (S.choisi !== null) {
          const { a, op, b } = operation(S);
          h += `<div class="pdo-calcul">${a} ${op} ${b} = ${boite(S, S.saisie)}</div>`;
        }
      }
      if (!S.fini && S.niveau !== 'rubis') {
        h += '<div class="pdo-regles"><span><b>1</b> ( )</span><span><b>2</b> × ÷</span><span><b>3</b> + −</span><span class="gd">même niveau : de gauche à droite ➜</span></div>';
      }
      return `${h}</div>`;
    },
  });

  function operation(S) {
    const j = S.jetons;
    const i = S.choisi;
    const a = j[i - 1].v;
    const b = j[i + 1].v;
    return { a, op: j[i].v, b, r: PR.calculer(a, j[i].v, b) };
  }

  function boite(S, val) {
    return `<span class="pdo-boite${S.statut === 'faux' ? ' faux' : ''}${S.fini ? ' ok' : ''}">${val === '' ? '&nbsp;' : val}</span>`;
  }

  // Les jetons d'une ligne. Dans la ligne en cours, les opérateurs sont des boutons;
  // l'opération choisie est encadrée; « guide » = l'opérateur à montrer (tutoriel).
  function jetonsHTML(jetons, S, guide = -1) {
    const choisi = S ? S.choisi : null;
    let h = '';
    jetons.forEach((j, k) => {
      const dansChoix = choisi !== null && k >= choisi - 1 && k <= choisi + 1;
      if (dansChoix && k === choisi - 1) h += '<span class="pdo-choix">';
      if (j.t === 'n') h += `<span class="pdo-n${j.nouveau ? ' nouveau' : ''}">${j.v}</span>`;
      else if (j.t === 'op') {
        if (S && choisi === null) h += `<button type="button" class="pdo-op${k === guide ? ' guide' : ''}" data-i="${k}" aria-label="Faire ce ${j.v} en premier">${j.v}</button>`;
        else h += `<span class="pdo-o">${j.v}</span>`;
      } else h += `<span class="pdo-p">${j.t}</span>`;
      if (dansChoix && k === choisi + 1) h += '</span>';
    });
    return h;
  }
})();
