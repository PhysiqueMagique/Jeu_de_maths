/* ==========================================================
   Division avec reste — affichage et déroulement (moteur : defis-moteur.js)
   Division posée avec le crochet : le dividende à gauche, le diviseur à droite,
   le quotient sous le diviseur. Chaque étape : divise (chiffre du quotient),
   multiplie (sous le nombre), soustrais (le reste), puis on abaisse le chiffre suivant.
   S.k : l'étape en cours; S.champ : 'q' | 'produit' | 'reste'; S.saisie : ce qui est tapé.
   Sur papier (émeraude) : on écrit seulement le quotient et le reste (S.pq, S.pr, S.zone).
   ========================================================== */
'use strict';

(() => {
  const D = Division;
  const UN = { chiffres: [2, 2], diviseur: [5, 9] };       // 47 ÷ 6 : une seule étape
  const DEUX = { chiffres: [2, 2], diviseur: [2, 4] };     // 87 ÷ 4 : deux étapes
  const TROIS = { chiffres: [3, 3], diviseur: [3, 9] };
  const QUATRE = { chiffres: [4, 4], diviseur: [3, 9] };
  const ZERO = { chiffres: [4, 4], diviseur: [3, 9], zero: true }; // un 0 au milieu du quotient
  const GEANT = { chiffres: [3, 4], diviseur: [11, 25] };
  const CHRONO_RUBIS = 300;

  const CHAMPS = ['q', 'produit', 'reste'];

  ActiviteDefis({
    id: 'division-reste',
    titre: 'Division avec reste',
    sousTitre: 'La division posée : divise, multiplie, soustrais, abaisse… et ce qui reste, c’est le reste!',
    tutoTexte: 'Trois exemples pour apprendre la division posée, une étape à la fois.',
    finTutoTexte: 'Tu connais la méthode : <b>divise, multiplie, soustrais, abaisse</b>, et on recommence jusqu’au dernier chiffre. Ce qui reste à la fin, c’est le reste!',
    mot: 'Division',
    indiceDirect: true,

    niveaux: {
      bronze: { titre: 'Défi bronze', desc: 'Un nombre de 2 chiffres divisé par 2 à 9 (ex. 87 ÷ 4)', requis: null, formes: [UN, DEUX, UN, DEUX, DEUX] },
      argent: { titre: 'Défi argent', desc: 'Un nombre de 3 chiffres (ex. 742 ÷ 6)', requis: 'bronze', formes: [TROIS, TROIS, TROIS, TROIS] },
      or: { titre: 'Défi or', desc: 'Un nombre de 4 chiffres, parfois avec un 0 au quotient', requis: 'argent', formes: [QUATRE, ZERO, QUATRE] },
      rubis: {
        titre: 'Défi vitesse', pierre: 'rubis', formes: [QUATRE, ZERO, QUATRE], chrono: CHRONO_RUBIS,
        desc: `3 divisions de niveau or en moins de ${CHRONO_RUBIS / 60} minutes!`,
        intro: `Défi vitesse! Tu as ${CHRONO_RUBIS / 60} minutes pour 3 divisions de 4 chiffres. Le chrono part maintenant!`,
      },
      emeraude: {
        titre: 'Défi sur papier', pierre: 'emeraude', formes: [DEUX, TROIS, TROIS, QUATRE, ZERO], papier: true, maxErreurs: 1,
        desc: 'Divise sur une feuille, écris seulement le quotient et le reste. Une seule erreur permise!',
        intro: 'Défi sur papier! Prends une feuille et un crayon. Fais la division sur la feuille, puis écris seulement le <b>quotient</b> et le <b>reste</b> ici. <b>Attention : une seule erreur est permise</b> pour gagner l’émeraude.',
      },
      saphir: { titre: 'Sans faute', pierre: 'saphir', desc: 'Réussis les défis bronze, argent et or sans aucune erreur.' },
      diamant: {
        titre: 'Défi diamant', pierre: 'diamant', formes: [GEANT, GEANT, GEANT],
        desc: 'Diviser par un nombre de 2 chiffres (ex. 844 ÷ 21)!',
        intro: 'Défi diamant! Le diviseur a <b>2 chiffres</b>. Même méthode : pour savoir combien de fois il entre, essaie avec la multiplication (21 × 3 = 63, 21 × 4 = 84…).',
      },
    },

    tuto: [
      {
        titre: 'Tutoriel : la division posée', probleme: [87, 4], mode: 'tuto',
        intro: [
          'On va calculer <b>87 ÷ 4</b>. On écrit le nombre à partager (le <b>dividende</b>, 87) à gauche, et le <b>diviseur</b> (4) à droite, dans le crochet. La réponse, le <b>quotient</b>, s’écrit sous le diviseur.',
          'On avance un chiffre à la fois, toujours avec les mêmes 4 étapes : <b>divise</b>, <b>multiplie</b>, <b>soustrais</b>, <b>abaisse</b>. Ce qui reste à la fin, c’est le <b>reste</b>.',
        ],
      },
      {
        titre: 'Tutoriel : trois chiffres', probleme: [742, 6], mode: 'tuto',
        intro: ['Maintenant <b>742 ÷ 6</b> : trois chiffres, donc trois tours de divise, multiplie, soustrais, abaisse.'],
      },
      {
        titre: 'Tutoriel : à toi!', probleme: [538, 7], mode: 'semi',
        intro: [
          'À toi : <b>538 ÷ 7</b>. Attention : 7 n’entre pas dans 5! Quand le premier chiffre est trop petit, on prend <b>deux chiffres</b> : on commence avec <b>53</b>.',
        ],
      },
    ],

    generer: (N) => D.generer(N.formes),

    charger(S, [a, d]) {
      S.P = D.creer(a, d);
      S.k = 0;
      S.champ = 'q';
      S.saisie = '';
      S.pq = '';
      S.pr = '';
      S.zone = 'q';
    },

    consigne(S) {
      if (S.papier) return 'Divise sur ta feuille, puis écris le <b>quotient</b> et le <b>reste</b>.';
      return D.explication(S.P, S.k, S.champ, S.mode === 'tuto');
    },

    verifierVisible: (S) => S.papier || S.champ !== 'q', // le chiffre du quotient se vérifie tout seul

    entrer(S, t) {
      if (S.papier) {
        const cle = S.zone === 'q' ? 'pq' : 'pr';
        if (S[cle].length >= 6) return false;
        S[cle] = S[cle] === '0' ? t : S[cle] + t;
        return true;
      }
      if (S.champ === 'q') {
        S.saisie = t;
        return 'verifier';
      }
      const max = String(S.P.etapes[S.k].partiel).length + 1;
      if (S.saisie.length >= max) return false;
      S.saisie = S.saisie === '0' ? t : S.saisie + t;
      return true;
    },

    effacer(S) {
      if (S.papier) {
        const cle = S.zone === 'q' ? 'pq' : 'pr';
        if (!S[cle]) {
          if (S.zone === 'r') { S.zone = 'q'; return true; }
          return false;
        }
        S[cle] = S[cle].slice(0, -1);
        return true;
      }
      if (!S.saisie) return false;
      S.saisie = S.saisie.slice(0, -1);
      return true;
    },

    clic(S, ev) {
      const c = ev.target.closest('[data-zone]');
      if (!c || !S.papier) return false;
      S.zone = c.dataset.zone;
      return true;
    },

    fleche(S, touche) {
      if (!S.papier) return false;
      if (touche === 'Tab' || touche === 'ArrowRight') S.zone = 'r';
      else if (touche === 'ArrowLeft') S.zone = 'q';
      else return false;
      return true;
    },

    verifier(S) {
      const P = S.P;
      if (S.papier) {
        if (!S.pq) { S.zone = 'q'; return { vide: 'Écris d’abord le quotient.' }; }
        if (S.pr === '') { S.zone = 'r'; this.H.rendre(); return { vide: 'Écris aussi le reste (0 s’il n’en reste pas).' }; }
        const q = Number(S.pq);
        const r = Number(S.pr);
        if (q === P.quotient && r === P.reste) return { ok: true };
        return { faux: true, cle: `${q}r${r}`, indice: D.indiceReponse(P, q, r) };
      }
      if (S.saisie === '') return { vide: 'Écris d’abord ta réponse.' };
      const e = P.etapes[S.k];
      const attendu = { q: e.q, produit: e.produit, reste: e.reste }[S.champ];
      const tape = Number(S.saisie);
      if (tape !== attendu) {
        const r = {
          faux: true,
          cle: `${S.k}${S.champ}${tape}`,
          indice: S.mode === 'tuto' ? D.explication(P, S.k, S.champ, true) : D.indice(P, S.k, S.champ, tape),
        };
        if (S.champ === 'q') S.saisie = '';
        return r;
      }
      // Bonne réponse : étape suivante
      S.saisie = '';
      const i = CHAMPS.indexOf(S.champ);
      if (i < 2) {
        S.champ = CHAMPS[i + 1];
        return { etape: `✓ ${this.consigne(S)}` };
      }
      const apres = D.apresReste(P, S.k);
      S.k++;
      S.champ = 'q';
      if (S.k >= P.etapes.length) return { ok: true };
      return { etape: `✓ ${apres} ${this.consigne(S)}` };
    },

    aide(S) {
      if (S.statut === 'faux' && S.indice) return S.indice;
      return `Rappelle-toi : <b>divise, multiplie, soustrais, abaisse</b>. ${D.explication(S.P, S.k, S.champ, false)}`;
    },

    reussite(S) {
      const P = S.P;
      const verif = P.reste
        ? `${P.quotient} × ${P.diviseur} + ${P.reste} = ${P.dividende}`
        : `${P.quotient} × ${P.diviseur} = ${P.dividende}`;
      return `<b>${P.dividende} ÷ ${P.diviseur} = ${P.quotient}</b>, reste <b>${P.reste}</b>.<br><span class="verif">Vérification : ${verif} ✔</span>`;
    },

    rendre(S) {
      return S.papier ? rendrePapier(S) : rendrePotence(S);
    },
  });

  // ---------- Sur papier : « 742 ÷ 6 = [quotient] reste [reste] » ----------
  function rendrePapier(S) {
    const P = S.P;
    const champ = (z, val) => {
      const cls = ['champ-papier'];
      if (S.zone === z && !S.fini) cls.push('curseur');
      if (S.statut === 'faux') cls.push('faux');
      if (S.fini) cls.push('ok');
      return `<button type="button" class="${cls.join(' ')}" data-zone="${z}">${val || '&nbsp;'}</button>`;
    };
    const q = S.fini ? P.quotient : S.pq;
    const r = S.fini ? P.reste : S.pr;
    return `<div class="division-papier">
        <span>${P.dividende} ÷ ${P.diviseur} =</span> ${champ('q', q)} <span class="mot">reste</span> ${champ('r', r)}
      </div>
      ${S.fini ? '' : '<p class="papier-note">✏️ Fais la division sur ta feuille. Clique sur une case (ou Tab) pour passer du quotient au reste.</p>'}`;
  }

  // ---------- La division posée ----------
  // Une grille : une colonne pour le signe −, puis une colonne par chiffre du dividende.
  function rendrePotence(S) {
    const P = S.P;
    const n = P.n;
    const k = S.fini ? P.etapes.length : S.k;
    const lignes = []; // chaque ligne : tableau de n cases { t, c } + signe

    const vide = () => Array.from({ length: n }, () => ({ t: '', c: '' }));
    // place un nombre aligné à droite sur la colonne « fin »
    const placer = (cases, nombre, fin, classe) => {
      const s = String(nombre);
      for (let i = 0; i < s.length; i++) cases[fin - (s.length - 1 - i)] = { t: s[i], c: classe };
    };
    const largeur = (j) => String(P.etapes[j].partiel).length;

    // 1. le dividende (les chiffres du nombre en cours sont en couleur)
    const l0 = P.chiffres.map((ch, i) => ({ t: String(ch), c: k === 0 && !S.fini && i <= P.debut ? 'actif' : '' }));
    lignes.push({ signe: '', cases: l0 });

    // 2. les étapes
    for (let j = 0; j <= Math.min(k, P.etapes.length - 1); j++) {
      const e = P.etapes[j];
      const enCours = j === k && !S.fini;
      if (enCours && S.champ === 'q') break;
      // produit
      const lp = vide();
      if (enCours && S.champ === 'produit') {
        boite(lp, e.pos, largeur(j), S.saisie, S.statut === 'faux');
      } else placer(lp, e.produit, e.pos, 'fait');
      lignes.push({ signe: '−', cases: lp });
      if (enCours && S.champ === 'produit') break; // le trait et le reste viennent après le produit
      // trait sous le produit
      lignes.push({ trait: [e.pos - largeur(j) + 1, e.pos] });
      // reste (+ le chiffre abaissé)
      const lr = vide();
      if (enCours && S.champ === 'reste') {
        boite(lr, e.pos, largeur(j), S.saisie, S.statut === 'faux');
      } else {
        const actif = j === k - 1 && !S.fini;
        placer(lr, e.reste, e.pos, actif ? 'actif' : 'fait');
        if (e.abaisse !== null) lr[e.pos + 1] = { t: String(e.abaisse), c: `abaisse${actif ? ' actif' : ''}` };
        // si le reste vaut 0 et qu'on abaisse : le 0 reste visible, en pâle
        if (e.reste === 0 && e.abaisse !== null) lr[e.pos] = { t: '0', c: `zero-pale${actif ? ' actif' : ''}` };
      }
      lignes.push({ signe: '', cases: lr });
    }

    let g = `<div class="grille-division" style="--n:${n}">`;
    for (const l of lignes) {
      if (l.trait) {
        g += '<span class="d-signe"></span>';
        for (let c = 0; c < n; c++) {
          const plein = c >= l.trait[0] && c <= l.trait[1];
          g += `<span class="d-trait${plein ? ' plein' : ''}${c === l.trait[0] ? ' t-deb' : ''}${c === l.trait[1] ? ' t-fin' : ''}"></span>`;
        }
        continue;
      }
      g += `<span class="d-signe">${l.signe}</span>`;
      for (const c of l.cases) g += `<span class="d-case ${c.c}">${c.t}</span>`;
    }
    g += '</div>';

    // 3. le crochet : diviseur et quotient
    let q = '';
    for (let j = 0; j < P.etapes.length; j++) {
      if (j < k || (j === k && S.champ !== 'q' && !S.fini) || S.fini) q += `<span class="d-q fait">${P.etapes[j].q}</span>`;
      else if (j === k) q += `<span class="d-q boite curseur${S.statut === 'faux' ? ' faux' : ''}">${S.saisie}</span>`;
    }
    const reste = S.fini ? `<div class="reste-final">reste <b>${P.reste}</b></div>` : '';
    const potence = `<div class="potence"><div class="d-diviseur">${P.diviseur}</div><div class="d-quotient">${q}</div>${reste}</div>`;
    return `<div class="division">${g}${potence}</div>`;
  }

  // Une boîte de saisie qui couvre « larg » cases et finit à la colonne « fin »; le nombre tapé y est aligné à droite.
  function boite(cases, fin, larg, saisie, faux) {
    const debut = Math.max(0, fin - larg + 1);
    for (let c = debut; c <= fin; c++) {
      const i = saisie.length - 1 - (fin - c);
      cases[c] = { t: i >= 0 ? saisie[i] : '', c: `boite${c === debut ? ' b-deb' : ''}${c === fin ? ' b-fin' : ''}${faux ? ' faux' : ''}` };
    }
    // si on tape plus de chiffres que la boîte, on les met à gauche
    const extra = saisie.length - (fin - debut + 1);
    for (let x = 0; x < extra && debut - 1 - x >= 0; x++) {
      cases[debut - 1 - x] = { t: saisie[extra - 1 - x], c: `boite${faux ? ' faux' : ''}` };
    }
  }
})();
