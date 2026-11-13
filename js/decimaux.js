/* ==========================================================
   Nombres décimaux — affichage et déroulement (moteur : defis-moteur.js)
   Questions (voir decimaux-modele.js) : lire / placer sur la droite numérique, valeur de position,
   comparer, additionner / soustraire en alignant les virgules.
   Saisie : S.saisie (chiffres et une virgule), S.choix (trait cliqué ou < = >).
   ========================================================== */
'use strict';

(() => {
  const D = Decimaux;
  const CHRONO_RUBIS = 150;

  const NIVEAUX = {
    bronze: { titre: 'Défi bronze', desc: 'Les dixièmes : la droite et la valeur des chiffres', requis: null,
      recette: [['droite', 'lire', 1], ['droite', 'placer', 1], ['valeur', 1], ['droite', 'lire', 1], ['droite', 'placer', 1], ['valeur', 2]] },
    argent: { titre: 'Défi argent', desc: 'Les centièmes, et comparer (attention aux pièges!)', requis: 'bronze',
      recette: [['comparer'], ['droite', 'placer', 2], ['comparer'], ['valeur', 2], ['droite', 'lire', 2], ['comparer']] },
    or: { titre: 'Défi or', desc: 'Additionner et soustraire en alignant les virgules', requis: 'argent',
      recette: [['operation', '+'], ['operation', '−'], ['comparer'], ['operation', '+'], ['droite', 'lire', 2], ['operation', '−']] },
    rubis: {
      titre: 'Défi vitesse', pierre: 'rubis', chrono: CHRONO_RUBIS,
      recette: [['droite', 'placer', 1], ['comparer'], ['valeur', 2], ['operation', '+'], ['droite', 'lire', 2], ['comparer'], ['operation', '−'], ['valeur', 3]],
      desc: '8 questions de tous les genres en moins de 2 minutes et demie!',
      intro: 'Défi vitesse! Tu as 2 minutes 30 pour 8 questions de tous les genres. Le chrono part maintenant!',
    },
    emeraude: {
      titre: 'Défi sans colonnes', pierre: 'emeraude', papier: true, maxErreurs: 1,
      recette: [['operation', '+'], ['comparer'], ['operation', '−'], ['comparer'], ['operation', '+'], ['operation', '−']],
      desc: 'Calculs en ligne : aligne les virgules sur ta feuille! Une seule erreur permise.',
      intro: 'Défi sans colonnes! Les calculs sont écrits en ligne : recopie-les sur une feuille en <b>alignant les virgules</b>, puis écris seulement la réponse. <b>Attention : une seule erreur est permise</b> pour gagner l’émeraude.',
    },
    saphir: { titre: 'Sans faute', pierre: 'saphir', desc: 'Réussis les défis bronze, argent et or sans aucune erreur.' },
    diamant: {
      titre: 'Défi diamant', pierre: 'diamant',
      recette: [['droite', 'lire', 3], ['comparer', 3], ['operation', '+', 3], ['droite', 'placer', 3], ['operation', '−', 3], ['valeur', 3]],
      desc: 'Les millièmes : trois chiffres après la virgule!',
      intro: 'Défi diamant! On va jusqu’aux <b>millièmes</b>, le 3<sup>e</sup> chiffre après la virgule. Sur la droite, chaque petit trait vaut 0,001!',
    },
  };

  const TUTO = [
    {
      titre: 'Tutoriel : les dixièmes', probleme: { type: 'lire', p: 1, debut: 0, pas: 1, n: 10, cible: 6 }, mode: 'tuto',
      intro: [
        'Entre 0 et 1, il y a des nombres! Si on coupe l’espace entre 0 et 1 en <b>10 parts égales</b>, chaque part est un <b>dixième</b> : 0,1. Le chiffre juste après la virgule compte les dixièmes.',
      ],
    },
    {
      titre: 'Tutoriel : la valeur des chiffres', probleme: { type: 'valeur', nombre: { v: 347, p: 2 }, rang: 2 }, mode: 'tuto',
      intro: ['Dans <b>3,47</b> : 3 unités, 4 <b>dixièmes</b> et 7 <b>centièmes</b>. Après la virgule, chaque chiffre vaut 10 fois moins que celui à sa gauche.'],
    },
    {
      titre: 'Tutoriel : comparer', probleme: { type: 'comparer', a: { v: 7, p: 1 }, b: { v: 65, p: 2 } }, mode: 'tuto',
      intro: ['Le piège! <b>0,65</b> a plus de chiffres que <b>0,7</b>… mais est-il plus grand? Le truc : ajouter un zéro pour avoir autant de chiffres. 0,7 = <b>0,70</b> (70 centièmes).'],
    },
    {
      titre: 'Tutoriel : additionner', probleme: { type: 'operation', op: '+', a: { v: 47, p: 1 }, b: { v: 235, p: 2 } }, mode: 'tuto',
      intro: ['Pour additionner des nombres décimaux, on <b>aligne les virgules</b> : les dixièmes sous les dixièmes, les centièmes sous les centièmes. Le 0 en gris : 4,7 = 4,70!'],
    },
    {
      titre: 'Tutoriel : à toi!', probleme: { type: 'placer', p: 2, debut: 230, pas: 1, n: 10, cible: 4 }, mode: 'semi',
      intro: ['À toi : place <b>2,34</b> sur la droite. Entre 2,3 et 2,4, chaque petit trait vaut un <b>centième</b> (0,01).'],
    },
  ];

  ActiviteDefis({
    id: 'decimaux',
    titre: 'Nombres décimaux',
    sousTitre: 'Dixièmes, centièmes, millièmes : la droite numérique, comparer et calculer avec la virgule!',
    tutoTexte: 'Cinq petits exemples pour apprendre les nombres à virgule.',
    finTutoTexte: 'Après la virgule : les dixièmes, puis les centièmes, puis les millièmes. Pour comparer, on ajoute des zéros; pour calculer, on aligne les virgules!',
    mot: 'Question',
    indiceDirect: true,
    clavier: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ','],
    touches: { ',': ',', '.': ',', '<': '<', '>': '>', '=': '=' },
    niveaux: NIVEAUX,
    tuto: TUTO,

    generer: (N) => D.generer(N.recette),

    charger(S, q) {
      S.q = q;
      S.saisie = '';
      S.choix = null;
    },

    consigne(S) {
      const q = S.q;
      if (S.mode === 'tuto') return D.explication(q);
      if (q.type === 'lire') return 'Quel nombre montre la flèche? Écris-le (avec la virgule).';
      if (q.type === 'placer') return `Clique sur le trait qui montre <b>${D.court(D.valeurTrait(q, q.cible))}</b>.`;
      if (q.type === 'valeur') return `Quel chiffre est à la position des <b>${D.RANGS[q.rang]}</b>?`;
      if (q.type === 'comparer') return 'Quel nombre est le plus grand? Clique sur <b>&lt;</b>, <b>=</b> ou <b>&gt;</b>.';
      return S.papier ? 'Calcule sur ta feuille (aligne les virgules!), puis écris la réponse.' : 'Calcule en colonnes, puis écris la réponse (avec la virgule).';
    },

    clavierVisible: (S) => !['comparer', 'placer'].includes(S.q.type),
    verifierVisible: (S) => !['comparer', 'placer', 'valeur'].includes(S.q.type),

    entrer(S, t) {
      const q = S.q;
      if (q.type === 'comparer') {
        if (!['<', '=', '>'].includes(t)) return false;
        S.choix = t;
        return 'verifier';
      }
      if (q.type === 'placer') return false;
      if (q.type === 'valeur') {
        if (!/^\d$/.test(t)) return false;
        S.saisie = t;
        return 'verifier';
      }
      if (t === ',') {
        if (S.saisie.includes(',')) return false;
        S.saisie = (S.saisie || '0') + ',';
      } else {
        if (!/^\d$/.test(t) || S.saisie.replace(',', '').length >= 7) return false;
        S.saisie = S.saisie === '0' ? t : S.saisie + t;
      }
      S.statut = null;
      return true;
    },

    effacer(S) {
      if (!S.saisie) return false;
      S.saisie = S.saisie.slice(0, -1);
      return true;
    },

    clic(S, ev) {
      const q = S.q;
      const cmp = ev.target.closest('[data-cmp]');
      if (cmp && q.type === 'comparer') { S.choix = cmp.dataset.cmp; return 'verifier'; }
      const t = ev.target.closest('[data-trait]');
      if (t && q.type === 'placer') { S.choix = Number(t.dataset.trait); return 'verifier'; }
      return false;
    },

    verifier(S) {
      const q = S.q;
      const att = D.attendu(q);
      const explique = () => (S.mode === 'tuto' ? D.explication(q) : D.indice(q));
      if (q.type === 'comparer' || q.type === 'placer') {
        if (S.choix === null) return { vide: q.type === 'comparer' ? 'Clique sur <, = ou >.' : 'Clique sur un trait de la droite.' };
        const c = S.choix;
        if (c === att) { S.bonChoix = c; return { ok: true }; }
        S.mauvaisChoix = c;
        S.choix = null;
        return { faux: true, cle: `c${c}`, indice: explique() };
      }
      if (q.type === 'valeur') {
        const c = Number(S.saisie);
        if (c === att) return { ok: true };
        S.saisie = '';
        return { faux: true, cle: `v${c}`, indice: explique() };
      }
      const rep = D.lire(S.saisie);
      if (!rep) return { vide: 'Écris un nombre (avec une virgule si besoin).' };
      if (D.egaux(rep, att)) return { ok: true };
      // un indice qui vise l'erreur faite (virgules mal alignées…) passe avant l'explication générale du tutoriel
      const vise = D.indice(q, rep);
      return { faux: true, cle: S.saisie, indice: S.mode === 'tuto' && vise === D.indice(q) ? D.explication(q) : vise };
    },

    aide(S) {
      if (S.statut === 'faux' && S.indice) return S.indice;
      return D.indice(S.q);
    },

    reussite(S) {
      const q = S.q;
      if (q.type === 'lire' || q.type === 'placer') return `La flèche montre <b>${D.court(D.valeurTrait(q, q.cible))}</b>.`;
      if (q.type === 'valeur') return `Dans ${D.ecrire(q.nombre)}, le chiffre des ${D.RANGS[q.rang]} est <b>${D.attendu(q)}</b>.`;
      if (q.type === 'comparer') return `<b>${D.ecrire(q.a)} ${D.attendu(q).replace('<', '&lt;').replace('>', '&gt;')} ${D.ecrire(q.b)}</b>`;
      return `<b>${D.ecrire(q.a)} ${q.op} ${D.ecrire(q.b)} = ${D.court(D.resultat(q))}</b>`;
    },

    rendre(S) {
      const q = S.q;
      let h = '<div class="dec">';
      if (q.type === 'lire' || q.type === 'placer') {
        h += `<p class="dec-question">${q.type === 'lire' ? 'Quel nombre montre la flèche?' : `Place <b>${D.court(D.valeurTrait(q, q.cible))}</b> sur la droite`}</p>`;
        h += droite(S);
        if (q.type === 'lire') h += `<div class="dec-ligne">${boite(S, S.fini ? D.court(D.attendu(q)) : S.saisie)}</div>`;
      } else if (q.type === 'valeur') {
        h += `<p class="dec-question">Quel chiffre est à la position des <b>${D.RANGS[q.rang]}</b>?</p>`;
        h += nombreEnCases(q.nombre, S.fini ? q.rang : null, S.mode !== 'defi');
        h += `<div class="dec-ligne">${boite(S, S.fini ? String(D.attendu(q)) : S.saisie, 'petite')}</div>`;
      } else if (q.type === 'comparer') {
        const boutons = ['<', '=', '>'].map((c) => {
          const ok = S.fini && S.bonChoix === c;
          return `<button type="button" class="dec-cmp${ok ? ' ok' : ''}" data-cmp="${c}" ${S.fini ? 'disabled' : ''}>${c === '<' ? '&lt;' : c === '>' ? '&gt;' : '='}</button>`;
        }).join('');
        h += `<div class="dec-ligne grande"><span>${D.ecrire(q.a)}</span><span class="dec-cmps">${boutons}</span><span>${D.ecrire(q.b)}</span></div>`;
      } else if (S.papier) {
        h += `<div class="dec-ligne grande"><span>${D.ecrire(q.a)} ${q.op} ${D.ecrire(q.b)} =</span>${boite(S, S.fini ? D.court(D.resultat(q)) : S.saisie)}</div>
          <p class="papier-note">✏️ Recopie le calcul sur ta feuille en alignant les virgules.</p>`;
      } else {
        h += colonnes(S);
      }
      return `${h}</div>`;
    },
  });

  // ---------- Morceaux d'affichage ----------

  function boite(S, val, classe = '') {
    const cls = ['dec-boite', classe];
    if (S.statut === 'faux') cls.push('faux');
    if (S.fini) cls.push('ok');
    return `<span class="${cls.join(' ')}">${val || '&nbsp;'}</span>`;
  }

  // La droite numérique : n intervalles, les traits du bout étiquetés
  function droite(S) {
    const q = S.q;
    const W = 680;
    const x0 = 40;
    const x1 = W - 40;
    const y = 70;
    const xTrait = (i) => x0 + ((x1 - x0) * i) / q.n;
    let svg = `<line x1="${x0 - 18}" y1="${y}" x2="${x1 + 18}" y2="${y}" class="dec-axe"/>`;
    for (let i = 0; i <= q.n; i++) {
      const bout = i === 0 || i === q.n;
      const milieu = i === q.n / 2;
      const haut = bout ? 22 : milieu ? 16 : 11;
      const x = xTrait(i);
      let cls = 'dec-trait';
      if (q.type === 'placer' && S.fini && i === q.cible) cls += ' ok';
      if (q.type === 'placer' && !S.fini && S.statut === 'faux' && i === S.mauvaisChoix) cls += ' faux';
      svg += `<line x1="${x}" y1="${y - haut}" x2="${x}" y2="${y + haut}" class="${cls}"/>`;
      if (bout) svg += `<text x="${x}" y="${y + 50}" class="dec-etiquette">${D.court(D.valeurTrait(q, i))}</text>`;
      if (q.type === 'placer' && !bout && !S.fini) {
        svg += `<rect x="${x - 14}" y="${y - 30}" width="28" height="60" rx="8" class="dec-cible" data-trait="${i}"/>`;
      }
    }
    // la flèche (lire) ou le point placé (placer)
    if (q.type === 'lire' || S.fini) {
      const x = xTrait(q.cible);
      svg += `<path d="M${x} ${y - 16} l-10 -20 h20 Z" class="dec-fleche"/>`;
      svg += `<text x="${x}" y="${y - 44}" class="dec-etiquette fleche">${S.fini ? D.court(D.valeurTrait(q, q.cible)) : '?'}</text>`;
    }
    return `<svg class="dec-droite" viewBox="0 0 ${W} 140" role="img" aria-label="Droite numérique">${svg}</svg>`;
  }

  // Un nombre, un chiffre par case (avec les noms des positions dans le tutoriel)
  function nombreEnCases(x, rangOk, noms) {
    const s = D.ecrire(x);
    const [ent, dec] = s.split(',');
    const cases = [];
    for (let k = 0; k < ent.length; k++) cases.push({ ch: ent[k], rang: k === ent.length - 1 ? 0 : -1 });
    cases.push({ ch: ',', virgule: true });
    for (let k = 0; k < dec.length; k++) cases.push({ ch: dec[k], rang: k + 1 });
    const abr = ['U', 'd', 'c', 'm'];
    return `<div class="dec-cases">${cases.map((c) => (c.virgule
      ? '<span class="dec-virgule">,</span>'
      : `<span class="dec-case${c.rang === rangOk && rangOk !== null ? ' ok' : ''}">${c.ch}${noms && c.rang >= 0 ? `<small>${abr[c.rang]}</small>` : ''}</span>`)).join('')}</div>`;
  }

  // L'addition ou la soustraction en colonnes, virgules alignées (les zéros ajoutés en gris)
  function colonnes(S) {
    const q = S.q;
    const P = Math.max(q.a.p, q.b.p, (S.saisie.split(',')[1] || '').length);
    const r = D.resultat(q);
    const textes = [D.ecrire(q.a), D.ecrire(q.b)];
    const reponse = S.fini ? D.ecrire(r) : S.saisie;
    const entiers = Math.max(...[...textes, reponse || '0'].map((t) => t.split(',')[0].length), 1);
    // une rangée : les chiffres entiers alignés à droite, la virgule, puis les décimales (complétées par des 0 gris)
    const rangee = (t, signe, classe, completer) => {
      const [ent, dec = ''] = t.split(',');
      let h = `<span class="dc-signe">${signe}</span>`;
      for (let k = 0; k < entiers; k++) {
        const ch = ent[ent.length - entiers + k];
        h += `<span class="dc ${classe}">${ch === undefined ? '' : ch}</span>`;
      }
      const aVirgule = t.includes(',') || completer;
      h += `<span class="dc virgule ${classe}">${aVirgule ? ',' : ''}</span>`;
      for (let k = 0; k < P; k++) {
        const ch = dec[k];
        if (ch !== undefined) h += `<span class="dc ${classe}">${ch}</span>`;
        else if (completer) h += `<span class="dc zero-ajoute">0</span>`;
        else h += `<span class="dc ${classe}"></span>`;
      }
      return h;
    };
    let h = `<div class="dec-colonnes" style="--ent:${entiers};--dec:${P}">`;
    h += rangee(textes[0], '', '', true);
    h += rangee(textes[1], q.op, '', true);
    h += '<span class="dc-trait"></span>';
    h += rangee(reponse, '', `saisie${S.statut === 'faux' ? ' faux' : ''}${S.fini ? ' ok' : ''}${reponse ? '' : ' vide'}`, false);
    h += '</div>';
    return h;
  }
})();
