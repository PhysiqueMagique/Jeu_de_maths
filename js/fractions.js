/* ==========================================================
   Fractions — affichage et déroulement (moteur : defis-moteur.js)
   Cinq sortes de questions (voir fractions-modele.js) : lire, colorier, équivalentes, comparer, opération.
   Dessins : pizza (cercle en parts) ou barre (rectangle en parts), en SVG.
   Saisie : une fraction = deux cases (S.vals.num en haut, S.vals.den en bas; S.zone),
            ou une seule case (S.vals.x) pour les équivalentes; boutons < = > pour comparer;
            clics sur les parts pour colorier (S.colories).
   ========================================================== */
'use strict';

(() => {
  const F = Fractions;
  const CHRONO_RUBIS = 150;

  const NIVEAUX = {
    bronze: { titre: 'Défi bronze', desc: 'Lire et colorier des fractions', requis: null,
      recette: [['lire'], ['colorier'], ['lire'], ['colorier'], ['lire'], ['colorier']] },
    argent: { titre: 'Défi argent', desc: 'Fractions équivalentes et comparer', requis: 'bronze',
      recette: [['equiv'], ['comparer', 'den'], ['equiv'], ['comparer', 'num'], ['equiv'], ['comparer', 'num']] },
    or: { titre: 'Défi or', desc: 'Additionner et soustraire des fractions', requis: 'argent',
      recette: [['operation', '+'], ['operation', '−'], ['comparer', 'multiple'], ['operation', '+'], ['equiv', { grand: true }], ['operation', '−']] },
    rubis: {
      titre: 'Défi vitesse', pierre: 'rubis', chrono: CHRONO_RUBIS,
      recette: [['lire'], ['equiv'], ['comparer', 'num'], ['operation', '+'], ['colorier'], ['comparer', 'den'], ['operation', '−'], ['equiv']],
      desc: `8 questions de tous les genres en moins de ${CHRONO_RUBIS / 60} minutes et demie!`,
      intro: `Défi vitesse! Tu as 2 minutes 30 pour 8 questions de tous les genres. Le chrono part maintenant!`,
    },
    emeraude: {
      titre: 'Défi sans dessin', pierre: 'emeraude', papier: true, maxErreurs: 1,
      recette: [['equiv'], ['comparer', 'num'], ['operation', '+'], ['comparer', 'multiple'], ['operation', '−'], ['equiv', { grand: true }]],
      desc: 'Sans pizza ni barre : imagine-les dans ta tête! Une seule erreur permise.',
      intro: 'Défi sans dessin! Cette fois, pas de pizza ni de barre : imagine-les dans ta tête (ou dessine-les sur une feuille). <b>Attention : une seule erreur est permise</b> pour gagner l’émeraude.',
    },
    saphir: { titre: 'Sans faute', pierre: 'saphir', desc: 'Réussis les défis bronze, argent et or sans aucune erreur.' },
    diamant: {
      titre: 'Défi diamant', pierre: 'diamant',
      recette: [['operation', '+', true], ['operation', '−', true], ['comparer', 'multiple'], ['operation', '+', true], ['operation', '−', true]],
      desc: 'Additionner des fractions qui n’ont pas le même dénominateur (ex. 1/2 + 1/4)!',
      intro: 'Défi diamant! Les fractions n’ont <b>pas le même dénominateur</b>. Le truc : transforme d’abord l’une des deux en fraction équivalente (1/2 = 2/4), puis additionne.',
    },
  };

  const TUTO = [
    {
      titre: 'Tutoriel : lire une fraction', probleme: { type: 'lire', f: [3, 4], forme: 'pizza' }, mode: 'tuto',
      intro: [
        'Une <b>fraction</b>, c’est une partie d’un tout coupé en parts <b>égales</b>. Le nombre du bas, le <b>dénominateur</b>, dit en combien de parts on a coupé. Le nombre du haut, le <b>numérateur</b>, dit combien de parts on prend.',
      ],
    },
    {
      titre: 'Tutoriel : colorier', probleme: { type: 'colorier', f: [2, 5], forme: 'barre' }, mode: 'tuto',
      intro: ['À l’envers maintenant : colorie la fraction! Clique sur les parts pour les colorier (reclique pour enlever la couleur).'],
    },
    {
      titre: 'Tutoriel : fractions équivalentes', probleme: { type: 'equiv', manque: 'num', a: [1, 2], d2: 4 }, mode: 'tuto',
      intro: ['Deux fractions peuvent être <b>égales</b> même si elles s’écrivent différemment : la moitié d’une barre, c’est aussi 2 quarts! On les appelle des fractions <b>équivalentes</b>.'],
    },
    {
      titre: 'Tutoriel : comparer', probleme: { type: 'comparer', a: [2, 3], b: [2, 5] }, mode: 'tuto',
      intro: ['Quelle fraction est la plus grande : 2/3 ou 2/5? Attention, le piège : 5 est plus grand que 3, mais des <b>cinquièmes</b> sont <b>plus petits</b> que des tiers (on coupe en plus de parts)!'],
    },
    {
      titre: 'Tutoriel : additionner', probleme: { type: 'operation', op: '+', a: [2, 5], b: [1, 5] }, mode: 'semi',
      intro: ['À toi : <b>2/5 + 1/5</b>. Quand le dénominateur est le même, on additionne les <b>numérateurs</b> (les parts), et le dénominateur <b>ne change pas</b> : des cinquièmes plus des cinquièmes, ça fait des cinquièmes!'],
    },
  ];

  ActiviteDefis({
    id: 'fractions',
    titre: 'Fractions',
    sousTitre: 'Lire, colorier, comparer et additionner des fractions… avec des pizzas et des barres!',
    tutoTexte: 'Cinq petits exemples pour apprendre les fractions.',
    finTutoTexte: 'Le dénominateur (en bas) : en combien de parts égales on coupe. Le numérateur (en haut) : combien de parts on prend. Tu es prêt pour les défis!',
    mot: 'Question',
    indiceDirect: true,
    clavier: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    touches: { '/': 'suivant', '<': '<', '>': '>', '=': '=' },
    niveaux: NIVEAUX,
    tuto: TUTO,

    generer: (N) => F.generer(N.recette, !!N.papier),

    charger(S, q) {
      S.q = { ...q };
      if (S.papier) S.q.sansDessin = true;
      S.vals = { num: '', den: '', x: '' };
      S.zone = S.q.type === 'equiv' ? 'x' : 'num';
      S.colories = [];
      S.choix = null;
    },

    consigne(S) {
      const q = S.q;
      if (S.mode === 'tuto') return F.explication(q);
      if (q.type === 'lire') return 'Quelle fraction est coloriée? Écris le <b>numérateur</b> (en haut), puis le <b>dénominateur</b> (en bas).';
      if (q.type === 'colorier') return `Clique sur les parts pour colorier <b>${q.f[0]}/${q.f[1]}</b>.`;
      if (q.type === 'equiv') return 'Trouve le nombre qui manque pour que les deux fractions soient <b>égales</b>.';
      if (q.type === 'comparer') return 'Quelle fraction est la plus grande? Clique sur <b>&lt;</b>, <b>=</b> ou <b>&gt;</b>.';
      return 'Calcule, puis écris la réponse en fraction (en haut, puis en bas).';
    },

    clavierVisible: (S) => !['comparer', 'colorier'].includes(S.q.type),
    verifierVisible: (S) => S.q.type !== 'comparer',

    entrer(S, t) {
      const q = S.q;
      if (q.type === 'comparer') {
        if (!['<', '=', '>'].includes(t)) return false;
        S.choix = t;
        return 'verifier';
      }
      if (q.type === 'colorier') return false;
      if (t === 'suivant') {
        if (S.zone !== 'num') return false;
        S.zone = 'den';
        return true;
      }
      if (!/^\d$/.test(t)) return false;
      if (S.vals[S.zone].length >= 2) return false;
      S.vals[S.zone] = S.vals[S.zone] === '0' ? t : S.vals[S.zone] + t;
      S.statut = null;
      return true;
    },

    effacer(S) {
      if (S.q.type === 'colorier' || S.q.type === 'comparer') return false;
      if (!S.vals[S.zone]) {
        if (S.zone === 'den') { S.zone = 'num'; return true; }
        return false;
      }
      S.vals[S.zone] = S.vals[S.zone].slice(0, -1);
      return true;
    },

    clic(S, ev) {
      const q = S.q;
      const cmp = ev.target.closest('[data-cmp]');
      if (cmp && q.type === 'comparer') { S.choix = cmp.dataset.cmp; return 'verifier'; }
      const part = ev.target.closest('[data-p]');
      if (part && q.type === 'colorier') {
        const p = Number(part.dataset.p);
        S.colories = S.colories.includes(p) ? S.colories.filter((x) => x !== p) : [...S.colories, p];
        S.statut = null;
        return true;
      }
      const z = ev.target.closest('[data-zone]');
      if (z && S.zone !== z.dataset.zone) { S.zone = z.dataset.zone; return true; }
      return false;
    },

    fleche(S, touche) {
      if (S.zone === 'x' || !['num', 'den'].includes(S.zone)) return false;
      if (touche === 'ArrowDown' || touche === 'Tab') S.zone = 'den';
      else if (touche === 'ArrowUp') S.zone = 'num';
      else return false;
      return true;
    },

    verifier(S) {
      const q = S.q;
      const att = F.attendu(q);
      if (q.type === 'comparer') {
        if (!S.choix) return { vide: 'Clique sur <, = ou >.' };
        const c = S.choix;
        S.choix = null;
        if (c === att) { S.reponseCmp = c; return { ok: true }; }
        return { faux: true, cle: c, indice: S.mode === 'tuto' ? F.explication(q) : F.indice(q) };
      }
      if (q.type === 'colorier') {
        const n = S.colories.length;
        if (!n) return { vide: 'Clique sur des parts pour les colorier.' };
        if (n === att) return { ok: true };
        return { faux: true, cle: `c${n}`, indice: F.indice(q, n) };
      }
      if (q.type === 'equiv') {
        if (!S.vals.x) return { vide: 'Écris le nombre qui manque.' };
        if (Number(S.vals.x) === att) return { ok: true };
        return { faux: true, cle: S.vals.x, indice: S.mode === 'tuto' ? F.explication(q) : F.indice(q) };
      }
      // lire ou opération : une fraction complète
      if (!S.vals.num) { S.zone = 'num'; return { vide: 'Écris d’abord le numérateur (en haut).' }; }
      if (!S.vals.den) { S.zone = 'den'; this.H.rendre(); return { vide: 'Écris aussi le dénominateur (en bas).' }; }
      const rep = [Number(S.vals.num), Number(S.vals.den)];
      const bon = q.type === 'lire' ? rep[0] === att[0] && rep[1] === att[1] : rep[1] > 0 && F.egales(rep, att);
      if (bon) return { ok: true };
      return { faux: true, cle: rep.join('/'), indice: S.mode === 'tuto' ? F.explication(q) : F.indice(q, rep) };
    },

    aide(S) {
      if (S.statut === 'faux' && S.indice) return S.indice;
      const q = S.q;
      if (q.type === 'lire') return 'En bas : le nombre de parts <b>en tout</b>. En haut : le nombre de parts <b>coloriées</b>.';
      if (q.type === 'colorier') return `En bas, ${q.f[1]} : il y a ${q.f[1]} parts. En haut, ${q.f[0]} : colorie-en ${q.f[0]}.`;
      return F.indice(q, [0, 0]);
    },

    reussite(S) {
      const q = S.q;
      const f = (x) => fracTexte(x[0], x[1]);
      if (q.type === 'lire') return `C’est bien ${f(q.f)}!`;
      if (q.type === 'colorier') return `Voilà ${f(q.f)} : ${q.f[0]} part${q.f[0] > 1 ? 's' : ''} sur ${q.f[1]}.`;
      if (q.type === 'equiv') {
        const b = q.manque === 'num' ? [F.attendu(q), q.d2] : [q.n2, F.attendu(q)];
        return `${f(q.a)} = ${f(b)}`;
      }
      if (q.type === 'comparer') return `${f(q.a)} ${F.attendu(q).replace('<', '&lt;').replace('>', '&gt;')} ${f(q.b)}`;
      const r = F.resultat(q);
      return `${f(q.a)} ${q.op} ${f(q.b)} = ${f(r)}`;
    },

    rendre(S) {
      const q = S.q;
      const dessin = !q.sansDessin;
      let h = '<div class="fr">';
      if (q.type === 'lire') {
        h += `<p class="fr-question">Quelle fraction est coloriée?</p>
          <div class="fr-ligne">${dessin ? forme(q.forme, q.f[1], q.f[0]) : ''}<span class="fr-egal">=</span>${saisieFraction(S)}</div>`;
      } else if (q.type === 'colorier') {
        const n = S.colories.length;
        h += `<p class="fr-question">Colorie ${fracHTML(q.f[0], q.f[1], 'petite')}</p>
          <div class="fr-ligne">${forme(q.forme, q.f[1], S.colories, { cliquable: !S.fini, statut: S.statut })}</div>
          <p class="fr-compte">${n} part${n > 1 ? 's' : ''} coloriée${n > 1 ? 's' : ''} sur ${q.f[1]}</p>`;
      } else if (q.type === 'equiv') {
        const val = S.fini ? String(F.attendu(q)) : S.vals.x;
        const b = q.manque === 'num'
          ? fracHTML(caseSaisie(S, 'x', val), q.d2)
          : fracHTML(q.n2, caseSaisie(S, 'x', val));
        h += `<div class="fr-ligne grande">${fracHTML(q.a[0], q.a[1])}<span class="fr-egal">=</span>${b}</div>`;
        if (dessin) {
          const d2 = q.manque === 'num' ? q.d2 : null;
          const n2 = q.manque === 'num' ? (S.mode !== 'defi' || S.fini ? Number(val) || 0 : 0) : null;
          h += `<div class="fr-barres">${barre(q.a[1], q.a[0])}${d2 ? barre(d2, Math.min(n2, d2), { clair: !S.fini && S.mode === 'defi' }) : ''}</div>`;
        }
      } else if (q.type === 'comparer') {
        const boutons = ['<', '=', '>'].map((c) => {
          const choisi = S.fini && S.reponseCmp === c;
          return `<button type="button" class="fr-cmp${choisi ? ' ok' : ''}" data-cmp="${c}" ${S.fini ? 'disabled' : ''}>${c === '<' ? '&lt;' : c === '>' ? '&gt;' : '='}</button>`;
        }).join('');
        h += `<div class="fr-ligne grande">${fracHTML(q.a[0], q.a[1])}<span class="fr-cmps">${boutons}</span>${fracHTML(q.b[0], q.b[1])}</div>`;
        if (dessin) h += `<div class="fr-barres">${barre(q.a[1], q.a[0])}${barre(q.b[1], q.b[0], { couleur: 'b' })}</div>`;
      } else {
        h += `<div class="fr-ligne grande">${fracHTML(q.a[0], q.a[1])}<span class="fr-op">${q.op}</span>${fracHTML(q.b[0], q.b[1])}<span class="fr-egal">=</span>${saisieFraction(S)}</div>`;
        if (dessin) {
          if (q.a[1] === q.b[1]) h += `<div class="fr-barres">${barreOperation(q)}</div>`;
          else h += `<div class="fr-barres">${barre(q.a[1], q.a[0])}${barre(q.b[1], q.b[0], { couleur: 'b' })}</div>`;
        }
      }
      if (q.sansDessin && !S.fini) h += '<p class="papier-note">🧠 Pas de dessin : imagine les parts dans ta tête (ou dessine-les sur une feuille).</p>';
      return `${h}</div>`;
    },
  });

  // ---------- Petits morceaux d'affichage ----------

  const fracTexte = (n, d) => `<span class="frac en-ligne"><span>${n}</span><span>${d}</span></span>`;
  function fracHTML(n, d, classe = '') {
    return `<span class="frac ${classe}"><span class="fr-num">${n}</span><span class="fr-den">${d}</span></span>`;
  }

  function caseSaisie(S, zone, val) {
    const cls = ['fr-case'];
    if (S.zone === zone && !S.fini) cls.push('curseur');
    if (S.statut === 'faux') cls.push('faux');
    if (S.fini) cls.push('ok');
    return `<button type="button" class="${cls.join(' ')}" data-zone="${zone}">${val || '&nbsp;'}</button>`;
  }

  function saisieFraction(S) {
    let num = S.vals.num;
    let den = S.vals.den;
    if (S.fini && S.q.type === 'lire') [num, den] = S.q.f.map(String);
    return `<span class="frac saisie">${caseSaisie(S, 'num', num)}<span class="fr-barre"></span>${caseSaisie(S, 'den', den)}</span>`;
  }

  // Une pizza ou une barre coupée en d parts; « colorie » = un nombre (les premières parts) ou une liste de parts
  function forme(type, d, colorie, opts = {}) {
    return type === 'pizza' ? pizza(d, colorie, opts) : barre(d, colorie, opts);
  }

  const estColoriee = (colorie, p) => (Array.isArray(colorie) ? colorie.includes(p) : p < colorie);

  function pizza(d, colorie, { cliquable = false, statut = null } = {}) {
    const R = 92;
    const c = 100;
    let parts = '';
    for (let p = 0; p < d; p++) {
      const a0 = -Math.PI / 2 + (2 * Math.PI * p) / d;
      const a1 = -Math.PI / 2 + (2 * Math.PI * (p + 1)) / d;
      const x0 = c + R * Math.cos(a0); const y0 = c + R * Math.sin(a0);
      const x1 = c + R * Math.cos(a1); const y1 = c + R * Math.sin(a1);
      const grand = a1 - a0 > Math.PI ? 1 : 0;
      const chemin = d === 1 ? `M${c} ${c - R} A${R} ${R} 0 1 1 ${c - 0.01} ${c - R} Z` : `M${c} ${c} L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${grand} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
      parts += `<path d="${chemin}" class="part${estColoriee(colorie, p) ? ' pleine' : ''}${cliquable ? ' cliquable' : ''}"${cliquable ? ` data-p="${p}"` : ''}/>`;
    }
    return `<svg class="pizza${statut === 'faux' ? ' faux' : ''}" viewBox="0 0 200 200" role="img" aria-label="Une pizza coupée en ${d} parts">
      <circle cx="${c}" cy="${c}" r="${R + 5}" class="croute"/>${parts}</svg>`;
  }

  function barre(d, colorie, { cliquable = false, statut = null, couleur = 'a', clair = false } = {}) {
    const W = 480;
    const H = 54;
    let parts = '';
    for (let p = 0; p < d; p++) {
      const x = (W * p) / d;
      parts += `<rect x="${(x + 1).toFixed(2)}" y="1" width="${(W / d - 2).toFixed(2)}" height="${H - 2}" rx="5" class="part${estColoriee(colorie, p) ? ` pleine ${couleur}` : ''}${cliquable ? ' cliquable' : ''}${clair ? ' clair' : ''}"${cliquable ? ` data-p="${p}"` : ''}/>`;
    }
    return `<svg class="barre${statut === 'faux' ? ' faux' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Une barre coupée en ${d} parts">${parts}</svg>`;
  }

  // Une barre pour une addition ou une soustraction de même dénominateur
  function barreOperation(q) {
    const d = q.a[1];
    const W = 480;
    const H = 54;
    let parts = '';
    for (let p = 0; p < d; p++) {
      const x = (W * p) / d;
      let cls = '';
      if (q.op === '+') cls = p < q.a[0] ? ' pleine a' : p < q.a[0] + q.b[0] ? ' pleine b' : '';
      else cls = p < q.a[0] - q.b[0] ? ' pleine a' : p < q.a[0] ? ' pleine enleve' : '';
      parts += `<rect x="${(x + 1).toFixed(2)}" y="1" width="${(W / d - 2).toFixed(2)}" height="${H - 2}" rx="5" class="part${cls}"/>`;
    }
    return `<svg class="barre" viewBox="0 0 ${W} ${H}">
      <defs><pattern id="hachures" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff"/><line x1="0" y1="0" x2="0" y2="8" stroke="#e5484d" stroke-width="3"/></pattern></defs>${parts}</svg>`;
  }
})();
