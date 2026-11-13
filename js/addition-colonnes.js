/* ==========================================================
   Addition en colonnes — affichage et déroulement
   Deux, trois ou quatre nombres d'au moins trois chiffres, colonne par colonne,
   avec de petites cases pour noter les retenues au-dessus de chaque colonne.
   Façons de jouer (S.mode) :
     'tuto' : guidé colonne par colonne, avec la réponse
     'semi' : guidé colonne par colonne, l'élève calcule
     'defi' : l'élève écrit toute la somme (case par case) puis vérifie
   ========================================================== */
'use strict';

Jeu.demarrer().then(() => {
  const A = Addition;
  const ACT = 'addition-colonnes';

  // ---------- Réglages (faciles à changer) ----------
  const CHRONO_RUBIS = 240; // secondes pour les 3 additions du défi vitesse
  const MAX_ERREURS_EMERAUDE = 1;

  // formes : { n : combien de nombres, chiffres : [min, max], retenues : minimum de colonnes avec une retenue }
  const F2 = { n: 2, chiffres: [3, 3], retenues: 2 };
  const F3 = { n: 3, chiffres: [3, 3], retenues: 2 };
  const F4 = { n: 4, chiffres: [3, 4], retenues: 3 };
  const NIVEAUX = {
    bronze: { titre: 'Défi bronze', desc: 'Deux nombres de 3 chiffres (ex. 368 + 275)', requis: null, formes: [F2, F2, F2, F2, F2] },
    argent: { titre: 'Défi argent', desc: 'Trois nombres de 3 chiffres', requis: 'bronze', formes: [F3, F3, F3, F3] },
    or: { titre: 'Défi or', desc: 'Quatre nombres de 3 ou 4 chiffres', requis: 'argent', formes: [F4, F4, F4] },
    rubis: {
      titre: 'Défi vitesse', pierre: 'rubis', formes: [F4, F4, F4], chrono: CHRONO_RUBIS,
      desc: `3 additions de niveau or en moins de ${CHRONO_RUBIS / 60} minutes!`,
      intro: `Défi vitesse! Tu as ${CHRONO_RUBIS / 60} minutes pour 3 additions de quatre nombres. Le chrono part maintenant!`,
    },
    emeraude: {
      titre: 'Défi sur papier', pierre: 'emeraude', formes: [F2, F3, F3, F4, F4], papier: true, maxErreurs: MAX_ERREURS_EMERAUDE,
      desc: 'Calcule sur une feuille, écris seulement la réponse. Une seule erreur permise!',
      intro: 'Défi sur papier! Prends une feuille et un crayon. Recopie les nombres en colonnes, additionne sur la feuille, puis écris seulement la réponse ici. <b>Attention : une seule erreur est permise</b> pour gagner l’émeraude.',
    },
    saphir: { titre: 'Sans faute', pierre: 'saphir', desc: 'Réussis les défis bronze, argent et or sans aucune erreur.' },
    diamant: {
      titre: 'Défi diamant', pierre: 'diamant', formes: [{ n: 4, chiffres: [5, 6], retenues: 4 }, { n: 4, chiffres: [5, 6], retenues: 4 }, { n: 4, chiffres: [5, 6], retenues: 4 }],
      desc: 'Quatre nombres géants, jusqu’aux centaines de mille!',
      intro: 'Défi diamant! Quatre nombres de 5 ou 6 chiffres. Même méthode : une colonne à la fois, et n’oublie pas tes retenues!',
    },
  };
  const ORDRE = ['bronze', 'argent', 'or'];
  const ORDRE_PIERRES = ['rubis', 'emeraude', 'saphir', 'diamant'];
  const BRAVOS = ['Bravo!', 'Super!', 'Wow!', 'Excellent!', 'Tu l’as!', 'Parfait!', 'Génial!'];

  // Tutoriel en 3 parties : 254 + 138 (expliqué), 456 + 278 + 139 (expliqué), quatre nombres (l'élève calcule)
  const TUTO = [
    {
      titre: 'Tutoriel : colonne par colonne', nombres: [254, 138], mode: 'tuto',
      intro: [
        'On va calculer <b>254 + 138</b> en colonnes. Les nombres sont placés l’un sous l’autre : les unités sous les unités, les dizaines sous les dizaines… On additionne <b>une colonne à la fois</b>, en commençant par les <b>unités</b> (à droite).',
        'Si une colonne donne <b>10 ou plus</b>, on écrit seulement le chiffre des unités en bas, et on <b>retient</b> le reste : on l’écrit dans la <b>petite case</b> au-dessus de la colonne suivante, pour ne pas l’oublier!',
      ],
    },
    {
      titre: 'Tutoriel : trois nombres', nombres: [456, 278, 139], mode: 'tuto',
      intro: [
        'Maintenant, <b>trois nombres</b>! C’est pareil : on additionne tous les chiffres de la colonne. Avec plusieurs nombres, la retenue peut être <b>2</b> ou même <b>3</b>!',
      ],
    },
    {
      titre: 'Tutoriel : à toi!', nombres: [2709, 1347, 586, 465], mode: 'semi',
      intro: [
        'À toi : <b>quatre nombres</b>! La colonne en couleur te montre quoi additionner. C’est toi qui calcules… et qui écris les retenues!',
      ],
    },
  ];

  const joueur = Jeu.joueurCourant();
  if (!joueur) {
    location.replace('../index.html');
    return;
  }

  const $ = (s) => document.querySelector(s);
  const ecrans = { menu: $('#ecran-menu'), jeu: $('#ecran-jeu'), fin: $('#ecran-fin') };
  const el = {
    retour: $('#btn-retour'), badge: $('#badge-joueur'), son: $('#btn-son'),
    titre: $('#titre-phase'), progression: $('#progression'), chrono: $('#chrono'), compteur: $('#compteur-erreurs'),
    calcul: $('#calcul'), bulle: $('#bulle'), clavier: $('#clavier'), actions: $('.actions'),
    verifier: $('#btn-verifier'), suivant: $('#btn-suivant'), aide: $('#btn-aide'),
  };
  el.badge.innerHTML = `<span class="avatar petit" style="--couleur:${joueur.couleur}" aria-hidden="true">${joueur.emoji}</span>${Jeu.echapper(joueur.nom)}`;

  let S = null;
  const son = (nom) => Jeu.jouer(nom);
  const choisir = (liste) => liste[Math.floor(Math.random() * liste.length)];
  const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const formaterTemps = (sec) => {
    const s = Math.max(0, Math.round(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const enTexte = (P) => `${P.nombres.join(' + ')} = ${P.total}`;

  // ---------- Son ----------
  function rendreSon() {
    el.son.textContent = Jeu.sonActif() ? '🔊' : '🔇';
    el.son.setAttribute('aria-pressed', String(Jeu.sonActif()));
    el.son.title = Jeu.sonActif() ? 'Couper le son' : 'Remettre le son';
  }
  el.son.addEventListener('click', () => { Jeu.basculerSon(); rendreSon(); });
  rendreSon();
  Jeu.brancherSonsNavigation();

  // ==========================================================
  //  Écrans et menu
  // ==========================================================

  function montrer(nom) {
    for (const [k, e] of Object.entries(ecrans)) e.hidden = k !== nom;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    if (nom !== 'jeu') { arreterChrono(); el.compteur.hidden = true; }
    document.querySelectorAll('.confetti').forEach((c) => c.remove());
    if (nom === 'menu') {
      el.retour.textContent = '← Accueil';
      el.retour.setAttribute('href', '../index.html');
    } else {
      el.retour.textContent = '← Menu de l’activité';
      el.retour.setAttribute('href', '#');
    }
    window.scrollTo(0, 0);
  }

  el.retour.addEventListener('click', (ev) => {
    if (ecrans.menu.hidden) {
      ev.preventDefault();
      son('retour');
      afficherMenu();
    }
  });

  const sansFaute = (p) => ORDRE.map((niv) => !!(p.records[niv] && p.records[niv].erreurs === 0));

  function afficherMenu() {
    arreterChrono();
    S = null;
    let p = Jeu.progres(joueur.id, ACT);
    let saphirRetroactif = false;
    if (!p.pierres.saphir && sansFaute(p).every(Boolean)) {
      p = Jeu.majProgres(joueur.id, ACT, (q) => { q.pierres.saphir = true; });
      saphirRetroactif = true;
    }
    let h = '';
    if (saphirRetroactif) {
      h += `<div class="carte bonus annonce">${Jeu.pierreSVG('saphir', true, 64)}
        <div>Accomplissement secret débloqué : <b>le saphir!</b><br>Tu avais déjà réussi les trois médailles sans aucune erreur.</div></div>`;
    }
    h += `<header class="entete-activite">
        <h1>Addition en colonnes</h1>
        <p>Deux, trois ou quatre grands nombres, une colonne à la fois… sans oublier les retenues!</p>
      </header>`;
    if (!p.tutorielFait) {
      h += `<div class="carte carte-tuto">
          <div class="texte"><h2>Commence ici!</h2>
            <p>Trois exemples pour apprendre à additionner colonne par colonne et à noter les retenues. Tu peux aussi le sauter et aller directement aux défis.</p></div>
          <div class="boutons-tuto">
            <button class="bouton orange gros" type="button" data-action="tuto">Commencer le tutoriel ▸</button>
            <button class="bouton secondaire" type="button" data-action="sauter-tuto">Sauter le tutoriel</button>
          </div>
        </div>`;
    }
    h += '<h2>Les défis</h2><div class="liste-niveaux">';
    for (const niv of ORDRE) {
      const N = NIVEAUX[niv];
      const gagnee = p.medailles[niv];
      let bloque = null;
      if (N.requis && !p.medailles[N.requis]) bloque = `Gagne d’abord la médaille ${Jeu.NOM_MEDAILLE[N.requis]}`;
      const rec = p.records[niv];
      const record = rec ? (rec.erreurs === 0 ? '⭐ Sans faute!' : `Meilleur : ${rec.erreurs} erreur${rec.erreurs > 1 ? 's' : ''}`) : '';
      h += `<article class="carte carte-niveau${bloque ? ' bloque' : ''}">
          ${Jeu.medailleSVG(niv, gagnee, 58)}
          <div><h3>${N.titre}</h3><p>${N.desc}</p><div class="record">${record}</div></div>
          ${bloque
            ? `<span class="verrou">🔒 ${bloque}</span>`
            : `<button class="bouton${gagnee ? ' secondaire' : ''}" type="button" data-action="defi" data-niveau="${niv}">${gagnee ? 'Rejouer' : 'Jouer ▸'}</button>`}
        </article>`;
    }
    h += '</div>';
    if (p.medailles.or) h += htmlSecrets(p);
    if (p.tutorielFait) {
      h += '<div class="revoir"><button class="bouton secondaire" type="button" data-action="tuto">📖 Revoir le tutoriel</button></div>';
    }
    ecrans.menu.innerHTML = h;
    montrer('menu');
    if (saphirRetroactif) { confettis(80); setTimeout(() => son('pierre'), 200); }
  }

  function htmlSecrets(p) {
    let h = `<section class="secrets"><h2>💎 Accomplissements secrets</h2>
      <p>Tu as la médaille d’or! Voici des défis cachés pour gagner des pierres précieuses.</p>
      <div class="liste-pierres">`;
    for (const pierre of ORDRE_PIERRES) {
      const N = NIVEAUX[pierre];
      const gagnee = p.pierres[pierre];
      const rec = p.records[pierre];
      let detail = '';
      if (rec && rec.temps) detail = `Meilleur temps : ${formaterTemps(rec.temps)}`;
      else if (gagnee) detail = '✔ Trouvé!';
      let action;
      if (pierre === 'saphir') {
        const ok = sansFaute(p);
        action = `<div class="coches">${ORDRE.map((niv, k) =>
          `<span class="${ok[k] ? 'oui' : ''}">${ok[k] ? '✔' : '✗'} ${niv}</span>`).join(' · ')}</div>`;
      } else {
        action = `<button class="bouton${gagnee ? ' secondaire' : ''}" type="button" data-action="defi" data-niveau="${pierre}">${gagnee ? 'Rejouer' : 'Jouer ▸'}</button>`;
      }
      h += `<article class="carte carte-pierre">
          ${Jeu.pierreSVG(pierre, gagnee, 54)}
          <h3>${Jeu.TITRE_PIERRE[pierre]} — ${N.titre}</h3>
          <p>${N.desc}</p>
          <div class="record">${detail}</div>
          ${action}
        </article>`;
    }
    return h + '</div></section>';
  }

  function actionBouton(ev) {
    const b = ev.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    if (!['aide', 'continuer'].includes(a)) son(a === 'menu' ? 'retour' : 'nav');
    if (a === 'tuto' || a === 'revoir') demarrerTutoriel();
    else if (a === 'sauter-tuto') {
      // Le tutoriel n'est pas obligatoire : on peut le sauter (il reste offert avec « Revoir le tutoriel »).
      Jeu.majProgres(joueur.id, ACT, (q) => { q.tutorielFait = true; });
      afficherMenu();
    }
    else if (a === 'defi') demarrerDefi(b.dataset.niveau);
    else if (a === 'menu') afficherMenu();
    else if (a === 'aide') aide();
    else if (a === 'recommencer' && S) demarrerDefi(S.niveau);
    else if (a === 'continuer') dire('D’accord, on continue pour pratiquer! Corrige ta réponse, puis vérifie.');
  }
  ecrans.menu.addEventListener('click', actionBouton);
  ecrans.fin.addEventListener('click', actionBouton);
  el.bulle.addEventListener('click', actionBouton);

  // ==========================================================
  //  Démarrer
  // ==========================================================

  const guide = () => S.mode === 'tuto' || S.mode === 'semi';

  function chargerProbleme(nombres) {
    const P = A.creer(nombres);
    Object.assign(S, {
      P, statut: null, fini: false, derniereFausse: null,
      cases: Array(P.largeur).fill(null), retenues: Array(P.largeur).fill(null),
      curseur: 0, zone: 'ligne', chiffres: '',
      col: 0, attendRetenue: false, // mode guidé : la colonne en cours, et si on attend sa retenue
    });
  }

  function demarrerTutoriel() {
    arreterChrono();
    S = { type: 'tuto' };
    demarrerPartie(0);
    montrer('jeu');
  }

  function demarrerPartie(k) {
    const T = TUTO[k];
    S.partie = k;
    S.mode = T.mode;
    S.papier = false;
    chargerProbleme(T.nombres);
    S.intro = [...T.intro]; // les messages d'introduction, un à la fois (bouton Suivant)
    el.titre.textContent = T.titre;
    el.progression.textContent = `Partie ${k + 1} sur ${TUTO.length}`;
    rendre();
    dire(S.intro[0]);
  }

  function demarrerDefi(niveau) {
    const N = NIVEAUX[niveau];
    arreterChrono();
    S = { type: 'defi', mode: 'defi', niveau, papier: !!N.papier, liste: A.generer(N.formes), index: 0, erreurs: 0, intro: [] };
    chargerDefi();
    if (N.chrono) demarrerChrono(N.chrono);
  }

  function chargerDefi() {
    const N = NIVEAUX[S.niveau];
    chargerProbleme(S.liste[S.index]);
    el.titre.textContent = N.titre;
    el.progression.innerHTML = S.liste.map((_, k) =>
      `<span class="point${k < S.index ? ' fait' : k === S.index ? ' actuel' : ''}"></span>`).join('')
      + `<span>&nbsp;${S.index + 1}/${S.liste.length}</span>`;
    majCompteurErreurs();
    montrer('jeu');
    rendre();
    if (S.index === 0 && N.intro) dire(N.intro);
    else if (S.papier) dire(`Addition ${S.index + 1} : calcule sur ta feuille, puis écris seulement la réponse.`);
    else if (S.index === 0) dire(consigne());
    else dire(`Addition ${S.index + 1} : une colonne à la fois, en commençant par les unités!`);
  }

  // ==========================================================
  //  Affichage
  // ==========================================================

  function dire(html, ton = 'info') {
    const icone = { info: '✏️', oups: '🤔', bravo: '🎉' }[ton];
    el.bulle.className = `carte bulle ${ton}`;
    el.bulle.innerHTML = `<span class="icone" aria-hidden="true">${icone}</span><div>${html}</div>`;
  }

  function secouer(e) {
    if (!e) return;
    e.classList.remove('secoue');
    void e.offsetWidth;
    e.classList.add('secoue');
  }

  const enIntro = () => S.intro && S.intro.length > 0;
  const actif = () => !S.fini && !enIntro();
  // En mode guidé, la colonne en couleur
  const colonneActive = () => (guide() && actif() ? S.col : -1);

  // Une rangée : un signe, puis le nombre aligné à droite sur la largeur du calcul.
  function rangee(signe, texte, classesChiffre = () => '', etiquette = '', classeEtiquette = '') {
    const w = S.P.largeur;
    const t = String(texte);
    let h = `<span class="signe">${signe}</span>`;
    for (let c = w - 1; c >= 0; c--) { // c = rang de la colonne (0 = unités)
      const ch = c < t.length ? t[t.length - 1 - c] : '';
      h += `<span class="chiffre ${classesChiffre(c, ch)}">${ch}</span>`;
    }
    return h + `<span class="etiquette-ligne ${classeEtiquette}">${etiquette}</span>`;
  }

  // ---------- La saisie ----------
  // Somme : case par case, de droite à gauche, avec les retenues :
  //   S.cases[c] : le chiffre écrit dans la colonne c (0 = unités), ou null.
  //   S.zone : 'ligne' (la somme) ou 'retenue' (les petites cases au-dessus des nombres).
  //   S.curseur : la colonne où ira le prochain chiffre (après un chiffre, on passe à gauche).
  // Réponse sur papier : on tape le nombre de gauche à droite (S.chiffres, les chiffres glissent vers la gauche).

  function lireSaisie() {
    if (S.papier) return { vide: !S.chiffres, trou: false, texte: S.chiffres ? String(Number(S.chiffres)) : '' };
    const cs = S.cases;
    let haut = -1;
    for (let c = cs.length - 1; c >= 0; c--) if (cs[c] !== null) { haut = c; break; }
    if (haut < 0) return { vide: true, trou: false, texte: '' };
    let texte = '';
    let trou = false;
    for (let c = haut; c >= 0; c--) {
      if (cs[c] === null) trou = true;
      else texte += cs[c];
    }
    return { vide: false, trou, texte: String(Number(texte)) };
  }

  function rangeeTapee(signe, etiquette) {
    return rangee(signe, S.chiffres, (c, ch) => `saisie${S.statut === 'faux' ? ' faux' : ''}${ch ? '' : ' vide-saisie'}`, etiquette, 'active');
  }

  function rangeeSaisie(signe, etiquette) {
    const w = S.P.largeur;
    let h = `<span class="signe">${signe}</span>`;
    for (let c = w - 1; c >= 0; c--) {
      const d = S.cases[c];
      const cls = ['chiffre', 'saisie', 'case-saisie'];
      if (S.statut === 'faux') cls.push('faux');
      if (d === null) cls.push('vide-saisie');
      else if (guide()) cls.push('bonne');
      if (S.zone === 'ligne' && S.curseur === c) cls.push('curseur');
      if (c === colonneActive()) cls.push('col-active');
      h += `<button type="button" class="${cls.join(' ')}" data-c="${c}" aria-label="Case des ${A.NOMS[c]}">${d === null ? '' : d}</button>`;
    }
    return h + `<span class="etiquette-ligne active">${etiquette}</span>`;
  }

  // Les petites cases des retenues, au-dessus des nombres (pas de retenue dans les unités).
  function rangeeRetenues(modifiable) {
    const w = S.P.largeur;
    let h = '<span class="signe"></span>';
    for (let c = w - 1; c >= 0; c--) {
      const d = S.retenues[c];
      if (c === 0) h += '<span class="case-retenue-vide"></span>';
      else if (modifiable) {
        const cur = S.zone === 'retenue' && S.curseur === c ? ' curseur' : '';
        const colActive = c === colonneActive() ? ' col-active' : '';
        h += `<button type="button" class="retenue${cur}${colActive}${d === null ? ' vide' : ''}" data-r="${c}" aria-label="Retenue dans les ${A.NOMS[c]}">${d === null ? '' : d}</button>`;
      } else h += `<span class="retenue fixe">${d === null ? '' : d}</span>`;
    }
    return h + `<span class="etiquette-ligne etiquette-retenues">${modifiable ? 'retenues' : ''}</span>`;
  }

  function rendre() {
    const { P } = S;
    const ca = colonneActive();
    let h = `<div class="grille-mult grille-addition" style="--w:${P.largeur}">`;
    if (!S.papier) h += rangeeRetenues(!S.fini);
    P.nombres.forEach((n, k) => {
      const signe = k === P.nombres.length - 1 ? '+' : '';
      h += rangee(signe, n, (c) => (c === ca ? 'col-active' : ''));
    });
    h += '<span class="trait fin"></span>';
    const etiquette = S.papier ? 'Réponse' : 'Somme';
    if (S.fini) h += rangee('=', P.total, () => 'faite ok', etiquette);
    else if (S.papier) h += rangeeTapee('=', etiquette);
    else h += rangeeSaisie('=', etiquette);
    h += '</div>';
    if (S.papier && !S.fini) h += '<p class="papier-note">✏️ Recopie les nombres et additionne sur ta feuille.</p>';
    el.calcul.innerHTML = h;
    rendreControles();
  }

  function rendreControles() {
    const saisie = actif();
    el.clavier.hidden = !saisie;
    el.verifier.hidden = !saisie || guide(); // en mode guidé, chaque chiffre est vérifié tout de suite
    const N = S.niveau ? NIVEAUX[S.niveau] : null;
    el.aide.hidden = !(S.mode === 'defi' && saisie && !(N && N.papier));
    el.suivant.hidden = !(enIntro() || S.fini);
    el.actions.hidden = el.verifier.hidden && el.aide.hidden && el.suivant.hidden;
  }

  el.clavier.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    .map((d) => `<button type="button" class="touche" data-chiffre="${d}">${d}</button>`).join('')
    + '<button type="button" class="touche effacer" data-effacer aria-label="Effacer">⌫</button>';

  // Le message qui accompagne l'étape en cours
  function consigne() {
    if (guide()) {
      if (S.attendRetenue) {
        const col = S.P.colonnes[S.col];
        return `Écris la retenue <b class="c-retenue">${col.retenueSuivante}</b> dans la petite case au-dessus des ${A.NOMS[S.col + 1]}.`;
      }
      return A.explication(S.P, S.col, S.mode === 'tuto');
    }
    if (S.papier) return 'Écris ta réponse.';
    return 'Additionne colonne par colonne, en commençant par les unités (à droite). Pour noter une retenue, clique sur la petite case au-dessus de la colonne suivante (ou flèche ↑), puis tape le chiffre.';
  }

  // ==========================================================
  //  Actions de l'élève
  // ==========================================================

  function entrer(d) {
    if (!S || !actif()) return;
    if (guide()) { entrerGuide(d); return; }
    if (S.papier) {
      if (S.chiffres.length >= S.P.largeur + 1) return;
      if (S.chiffres === '0') S.chiffres = '';
      S.chiffres += String(d);
      S.statut = null;
    } else if (S.zone === 'retenue') {
      // La retenue est notée : on revient écrire le chiffre de la somme dans cette colonne.
      S.retenues[S.curseur] = d;
      S.zone = 'ligne';
    } else {
      S.cases[S.curseur] = d;
      if (S.curseur < S.P.largeur - 1) S.curseur++;
      S.statut = null;
    }
    son('chiffre');
    rendre();
  }

  // Mode guidé : chaque chiffre (et chaque retenue) est vérifié tout de suite.
  function entrerGuide(d) {
    const col = S.P.colonnes[S.col];
    if (S.attendRetenue) {
      if (d === col.retenueSuivante) {
        S.retenues[S.col + 1] = d;
        S.attendRetenue = false;
        avancerColonne();
      } else {
        mauvaisGuide(`La retenue, c’est ce qu’on n’a pas pu écrire en bas : ${col.somme} ${A.NOMS[S.col]}, c’est ${A.quantite(col.retenueSuivante, S.col + 1)} et ${A.quantite(col.ecrit, S.col)}. Écris <b class="c-retenue">${col.retenueSuivante}</b> dans la petite case.`);
      }
      return;
    }
    if (d !== col.ecrit) {
      mauvaisGuide(A.explication(S.P, S.col, true));
      return;
    }
    S.cases[S.col] = d;
    if (col.retenueSuivante) {
      S.attendRetenue = true;
      S.zone = 'retenue';
      S.curseur = S.col + 1;
      son('bon');
      rendre();
      dire(`${choisir(BRAVOS)} ${col.somme} ${A.NOMS[S.col]}, c’est ${A.quantite(col.retenueSuivante, S.col + 1)} et ${A.quantite(col.ecrit, S.col)}. ${consigne()}`, 'bravo');
      return;
    }
    avancerColonne();
  }

  function avancerColonne() {
    S.col++;
    if (S.col >= S.P.largeur) { reussite(); return; }
    S.zone = 'ligne';
    S.curseur = S.col;
    son('bon');
    rendre();
    dire(`${choisir(BRAVOS)} ${consigne()}`, 'info');
  }

  function mauvaisGuide(explication) {
    son('erreur');
    secouer(el.calcul);
    dire(`Pas tout à fait… ${explication}`, 'oups');
  }

  function effacer() {
    if (!S || !actif() || guide()) return;
    if (S.papier) {
      if (!S.chiffres) return;
      S.chiffres = S.chiffres.slice(0, -1);
    } else if (S.zone === 'retenue') {
      if (S.retenues[S.curseur] === null) return;
      S.retenues[S.curseur] = null;
    } else if (S.cases[S.curseur] !== null) {
      S.cases[S.curseur] = null;
    } else if (S.curseur > 0 && S.cases[S.curseur - 1] !== null) {
      // comme un retour arrière : on revient à droite et on efface ce chiffre
      S.curseur--;
      S.cases[S.curseur] = null;
    } else return;
    S.statut = null;
    son('clic');
    rendre();
  }

  // Choisir une case avec la souris (ou les flèches) — seulement dans les défis
  function choisirCase(zone, c) {
    if (!S || !actif() || guide() || S.papier) return;
    if (zone === 'retenue' && (c < 1 || c >= S.P.largeur)) return;
    if (c < 0 || c >= S.P.largeur) return;
    S.zone = zone;
    S.curseur = c;
    son('clic');
    rendre();
  }

  function verifier() {
    if (!S || !actif() || guide()) return;
    const lu = lireSaisie();
    if (lu.vide) {
      son('oups');
      dire('Écris d’abord ta réponse avec les chiffres.', 'oups');
      return;
    }
    if (lu.trou) {
      // Pas une erreur : il manque seulement un chiffre à droite ou au milieu.
      son('oups');
      dire('Il reste une case vide à droite de ton nombre. Chaque colonne doit avoir un chiffre, même un <b>0</b>!', 'oups');
      return;
    }
    const saisie = lu.texte;
    if (Number(saisie) === S.P.total) {
      S.statut = null;
      S.derniereFausse = null;
      reussite();
      return;
    }

    // Mauvaise réponse
    S.statut = 'faux';
    rendre();
    secouer(el.calcul);
    // Vérifier deux fois la même réponse ne compte qu'une seule erreur.
    if (S.derniereFausse === saisie) {
      son('oups');
      dire('Ta réponse n’a pas changé : corrige-la et essaie autre chose.', 'oups');
      return;
    }
    S.derniereFausse = saisie;
    S.erreurs++;
    son('erreur');
    majCompteurErreurs();
    const N = NIVEAUX[S.niveau];
    if (N.maxErreurs !== undefined && S.erreurs === N.maxErreurs + 1) {
      dire(`Oups! C’est ta ${S.erreurs}<sup>e</sup> erreur, et une seule est permise pour gagner ${Jeu.NOM_PIERRE[N.pierre]}.
        <div class="choix-bulle">
          <button type="button" class="bouton orange" data-action="recommencer">↻ Recommencer le défi</button>
          <button type="button" class="bouton secondaire" data-action="continuer">Continuer pour pratiquer</button>
        </div>`, 'oups');
      return;
    }
    let compte = '';
    if (N.maxErreurs !== undefined) {
      compte = S.erreurs > N.maxErreurs
        ? ` (${S.erreurs} erreurs : cette fois, c’est pour pratiquer)`
        : ` (${S.erreurs} erreur sur ${N.maxErreurs} permise)`;
    }
    const lien = N.papier ? '' : ' <button type="button" class="lien-tuto" data-action="aide">Un indice?</button>';
    dire(`Pas tout à fait! Essaie encore.${compte}${lien}`, 'oups');
  }

  function aide() {
    if (!S || S.fini || S.mode !== 'defi') return;
    const lu = lireSaisie();
    const fausse = S.statut === 'faux' && !lu.vide && !lu.trou;
    const texte = fausse
      ? A.indice(S.P, lu.texte, false)
      : 'Commence par la colonne des unités (à droite). Si une colonne donne 10 ou plus, écris seulement le chiffre des unités et note la retenue dans la petite case au-dessus de la colonne suivante.';
    dire(`${texte}<br><button type="button" class="lien-tuto" data-action="revoir">📖 Revoir le tutoriel</button>`);
  }

  function reussite() {
    S.fini = true;
    S.zone = 'ligne';
    const dernier = S.type === 'defi' && S.index === S.liste.length - 1;
    if (dernier && S.chrono) {
      S.tempsFinal = S.chrono.total - resteChrono();
      arreterChrono();
    }
    rendre();
    son('reussite');
    confettis();
    if (S.type === 'tuto') {
      const suite = S.partie < TUTO.length - 1 ? 'Clique sur Suivant pour l’exemple suivant.' : 'Tu connais la méthode!';
      dire(`Bravo! <b>${enTexte(S.P)}</b>. ${suite}`, 'bravo');
    } else {
      dire(`${choisir(BRAVOS)} <b>${enTexte(S.P)}</b>${dernier ? '<br>C’était la dernière…' : ''}`, 'bravo');
    }
  }

  function suivant() {
    if (!S) return;
    if (enIntro()) {
      S.intro.shift();
      dire(enIntro() ? S.intro[0] : consigne());
      rendre();
      return;
    }
    if (!S.fini) return;
    if (S.type === 'tuto') {
      if (S.partie < TUTO.length - 1) demarrerPartie(S.partie + 1);
      else finTutoriel();
      return;
    }
    S.index++;
    if (S.index >= S.liste.length) finNiveau();
    else chargerDefi();
  }

  // ==========================================================
  //  Chrono et compteur d'erreurs
  // ==========================================================

  let minuterie = null;
  function demarrerChrono(secondes) {
    arreterChrono();
    S.chrono = { fin: Date.now() + secondes * 1000, total: secondes, dernier: null };
    el.chrono.hidden = false;
    minuterie = setInterval(tic, 200);
    tic();
  }
  function resteChrono() {
    return S && S.chrono ? Math.max(0, (S.chrono.fin - Date.now()) / 1000) : 0;
  }
  function tic() {
    if (!S || !S.chrono) { arreterChrono(); return; }
    const reste = resteChrono();
    const sec = Math.ceil(reste);
    el.chrono.textContent = `⏱ ${formaterTemps(sec)}`;
    el.chrono.classList.toggle('presse', sec <= 30);
    if (sec <= 10 && sec !== S.chrono.dernier && sec > 0) son('tic');
    S.chrono.dernier = sec;
    if (reste <= 0) tempsEcoule();
  }
  function arreterChrono() {
    if (minuterie) clearInterval(minuterie);
    minuterie = null;
    el.chrono.hidden = true;
  }

  function majCompteurErreurs() {
    const N = S && S.niveau ? NIVEAUX[S.niveau] : null;
    if (!N || N.maxErreurs === undefined) { el.compteur.hidden = true; return; }
    el.compteur.hidden = false;
    el.compteur.textContent = `❌ ${S.erreurs} / ${N.maxErreurs}`;
    el.compteur.title = `Erreurs : ${S.erreurs} (une seule permise)`;
    el.compteur.classList.toggle('presse', S.erreurs > N.maxErreurs);
  }

  function tempsEcoule() {
    const reussis = S.index + (S.fini ? 1 : 0);
    const niv = S.niveau;
    arreterChrono();
    S = null;
    son('oups');
    ecrans.fin.innerHTML = `<div class="carte fin">
        <div class="grande-medaille" style="font-size:90px" aria-hidden="true">⏱</div>
        <h1>Temps écoulé!</h1>
        <p>Tu as réussi ${reussis} addition${reussis > 1 ? 's' : ''} sur ${NIVEAUX[niv].formes.length}. Essaie encore, tu vas y arriver!</p>
        <div class="rangee">
          <button class="bouton gros" type="button" data-action="defi" data-niveau="${niv}">Réessayer ▸</button>
          <button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>
        </div>
      </div>`;
    montrer('fin');
  }

  // ==========================================================
  //  Fins : tutoriel, médaille, pierre
  // ==========================================================

  function finTutoriel() {
    Jeu.majProgres(joueur.id, ACT, (p) => { p.tutorielFait = true; });
    Jeu.demanderPersistance();
    ecrans.fin.innerHTML = `<div class="carte fin">
        <div class="grande-medaille" style="font-size:90px" aria-hidden="true">📖</div>
        <h1>Tutoriel terminé!</h1>
        <p>Tu connais la méthode : une colonne à la fois en commençant par les unités, et quand ça donne 10 ou plus, on note la retenue au-dessus de la colonne suivante. Les défis t’attendent!</p>
        <div class="rangee">
          <button class="bouton gros" type="button" data-action="defi" data-niveau="bronze">Défi bronze ▸</button>
          <button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>
        </div>
      </div>`;
    S = null;
    montrer('fin');
    confettis(60);
    son('medaille');
  }

  function finNiveau() {
    if (NIVEAUX[S.niveau].pierre) { finPierre(); return; }
    const niv = S.niveau;
    const erreurs = S.erreurs;
    const deja = Jeu.progres(joueur.id, ACT).medailles[niv];
    let nouveauSaphir = false;
    Jeu.majProgres(joueur.id, ACT, (q) => {
      q.medailles[niv] = true;
      const r = q.records[niv];
      if (!r || erreurs < r.erreurs) q.records[niv] = { erreurs, date: new Date().toISOString().slice(0, 10) };
      if (!q.pierres.saphir && sansFaute(q).every(Boolean)) {
        q.pierres.saphir = true;
        nouveauSaphir = true;
      }
    });
    Jeu.demanderPersistance();
    const nomMed = Jeu.NOM_MEDAILLE[niv];
    const prochain = ORDRE[ORDRE.indexOf(niv) + 1];
    const premierOr = niv === 'or' && !deja;
    let bonus = '';
    if (nouveauSaphir) {
      bonus += `<div class="bonus">${Jeu.pierreSVG('saphir', true, 64)}
        <div>Accomplissement secret : <b>le saphir!</b><br>Tu as réussi les trois médailles sans aucune erreur.</div></div>`;
    }
    if (premierOr) bonus += '<p class="indice-secret">🤫 Psst… des accomplissements secrets viennent d’apparaître dans le menu de l’activité!</p>';
    ecrans.fin.innerHTML = `<div class="carte fin">
        <div class="grande-medaille">${Jeu.medailleSVG(niv, true, 120)}</div>
        <h1>${deja ? 'Défi réussi encore une fois!' : `Médaille ${nomMed}!`}</h1>
        <p>${deja
          ? `Tu avais déjà la médaille ${nomMed}. Bravo pour la pratique!`
          : `${Jeu.echapper(joueur.nom)}, tu as gagné la médaille ${nomMed}! Elle est maintenant sur la page d’accueil.`}</p>
        <p>${erreurs === 0 ? '⭐ Sans aucune erreur, wow!' : `Tu as corrigé ${erreurs} erreur${erreurs > 1 ? 's' : ''} en chemin.`}</p>
        ${bonus}
        <div class="rangee">
          ${prochain ? `<button class="bouton gros" type="button" data-action="defi" data-niveau="${prochain}">${NIVEAUX[prochain].titre} ▸</button>` : ''}
          ${premierOr ? '<button class="bouton gros" type="button" data-action="menu">Voir les secrets 💎</button>' : ''}
          <button class="bouton secondaire" type="button" data-action="defi" data-niveau="${niv}">Rejouer ce défi</button>
          ${premierOr ? '' : '<button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>'}
        </div>
      </div>`;
    S = null;
    montrer('fin');
    confettis(90);
    son(nouveauSaphir ? 'pierre' : 'medaille');
    if (nouveauSaphir) setTimeout(() => son('medaille'), 900);
  }

  function finPierre() {
    const niv = S.niveau;
    const N = NIVEAUX[niv];
    const pierre = N.pierre;
    const erreurs = S.erreurs;
    const temps = N.chrono ? (S.tempsFinal !== undefined ? S.tempsFinal : N.chrono - resteChrono()) : null;
    arreterChrono();
    if (N.maxErreurs !== undefined && erreurs > N.maxErreurs) {
      S = null;
      son('oups');
      ecrans.fin.innerHTML = `<div class="carte fin">
          <div class="grande-medaille">${Jeu.pierreSVG(pierre, false, 110)}</div>
          <h1>Presque!</h1>
          <p>Tu as fini avec ${erreurs} erreurs. Pour ${Jeu.NOM_PIERRE[pierre]}, une seule erreur est permise.</p>
          <p>Prends ton temps sur ta feuille, une colonne à la fois!</p>
          <div class="rangee">
            <button class="bouton gros" type="button" data-action="defi" data-niveau="${niv}">Réessayer ▸</button>
            <button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>
          </div>
        </div>`;
      montrer('fin');
      return;
    }
    const deja = Jeu.progres(joueur.id, ACT).pierres[pierre];
    let nouveauRecord = false;
    Jeu.majProgres(joueur.id, ACT, (q) => {
      q.pierres[pierre] = true;
      const r = q.records[pierre];
      const meilleur = !r || (temps !== null ? temps < (r.temps || Infinity) : erreurs < r.erreurs);
      if (meilleur) {
        q.records[pierre] = { erreurs, date: new Date().toISOString().slice(0, 10) };
        if (temps !== null) q.records[pierre].temps = Math.round(temps);
        nouveauRecord = !!r;
      }
    });
    Jeu.demanderPersistance();
    const nom = Jeu.NOM_PIERRE[pierre];
    let details = erreurs === 0 ? '⭐ Sans aucune erreur!' : `Tu as corrigé ${erreurs} erreur${erreurs > 1 ? 's' : ''} en chemin.`;
    if (temps !== null) details = `⏱ Ton temps : ${formaterTemps(temps)}${nouveauRecord ? ' — nouveau record!' : ''}<br>${details}`;
    ecrans.fin.innerHTML = `<div class="carte fin">
        <div class="grande-medaille">${Jeu.pierreSVG(pierre, true, 130)}</div>
        <h1>${deja ? 'Défi secret réussi encore!' : `Tu as trouvé ${nom}!`}</h1>
        <p>${deja ? 'Tu l’avais déjà, mais quelle pratique!' : `${Jeu.echapper(joueur.nom)}, ${nom} brille maintenant sur la page d’accueil.`}</p>
        <p>${details}</p>
        <div class="rangee">
          <button class="bouton secondaire" type="button" data-action="defi" data-niveau="${niv}">Rejouer ce défi</button>
          <button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>
          <a class="bouton secondaire" href="../index.html">Page d’accueil</a>
        </div>
      </div>`;
    S = null;
    montrer('fin');
    confettis(110);
    son('pierre');
  }

  // ==========================================================
  //  Confettis
  // ==========================================================

  function confettis(nb = 50) {
    if (mouvementReduit()) return;
    const couleurs = ['#3a6fe0', '#ff8a3d', '#2fa866', '#ffd23f', '#e0577f'];
    for (let k = 0; k < nb; k++) {
      const c = document.createElement('span');
      c.className = 'confetti';
      c.style.left = `${Math.random() * 100}vw`;
      c.style.background = choisir(couleurs);
      c.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
      c.style.animationDelay = `${Math.random() * 0.4}s`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  }

  // ==========================================================
  //  Événements
  // ==========================================================

  el.clavier.addEventListener('click', (ev) => {
    const t = ev.target.closest('.touche');
    if (!t) return;
    if (t.hasAttribute('data-effacer')) effacer();
    else entrer(Number(t.dataset.chiffre));
  });
  el.calcul.addEventListener('click', (ev) => {
    const c = ev.target.closest('.case-saisie');
    if (c) { choisirCase('ligne', Number(c.dataset.c)); return; }
    const r = ev.target.closest('button.retenue');
    if (r) choisirCase('retenue', Number(r.dataset.r));
  });
  el.verifier.addEventListener('click', verifier);
  el.suivant.addEventListener('click', () => { son('nav'); suivant(); });
  el.aide.addEventListener('click', () => { son('clic'); aide(); });

  document.addEventListener('keydown', (ev) => {
    if (!S || ecrans.jeu.hidden || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (/^[0-9]$/.test(ev.key)) {
      ev.preventDefault();
      entrer(Number(ev.key));
    } else if (ev.key === 'Backspace' || ev.key === 'Delete') {
      ev.preventDefault();
      effacer();
    } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      choisirCase(S.zone, S.curseur + (ev.key === 'ArrowLeft' ? 1 : -1));
    } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
      ev.preventDefault();
      choisirCase(ev.key === 'ArrowUp' ? 'retenue' : 'ligne', Math.max(ev.key === 'ArrowUp' ? 1 : 0, S.curseur));
    } else if (ev.key === 'Enter') {
      const bouton = ev.target.closest && ev.target.closest('button, a');
      if (bouton && bouton.offsetParent !== null && el.bulle.contains(bouton)) return;
      ev.preventDefault();
      if (!el.verifier.hidden) verifier();
      else if (!el.suivant.hidden) suivant();
    }
  });

  afficherMenu();
});
