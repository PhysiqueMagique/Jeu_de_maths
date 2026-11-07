/* ==========================================================
   Tables de division (sans reste) — affichage et déroulement
   Façons de jouer un problème (S.mode) :
     'tuto' : exemple expliqué, chaque étape est imposée
     'semi' : l'élève répond, l'indice s'affiche tout seul
     'defi' : l'élève répond et vérifie (aide sur demande)
   ========================================================== */
'use strict';

Jeu.demarrer().then(() => {
  const ACT = 'division-tables';
  const NB_DEFIS = 10; // problèmes par défi

  // Réglages des accomplissements secrets (faciles à changer)
  const CHRONO_RUBIS = 90; // secondes pour réussir les 10 divisions du défi vitesse
  const MAX_ERREURS_EMERAUDE = 1; // erreurs permises dans le défi de tête

  const TOUTES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const ORDRE = ['bronze', 'argent', 'or'];
  const ORDRE_PIERRES = ['rubis', 'emeraude', 'saphir', 'diamant'];

  const NIVEAUX = {
    bronze: { titre: 'Défi bronze', desc: 'Tables de 1, 2, 5 et 10', requis: null, tables: [1, 2, 5, 10] },
    argent: { titre: 'Défi argent', desc: 'Tables de 3, 4 et 6', requis: 'bronze', tables: [3, 4, 6] },
    or: { titre: 'Défi or', desc: 'Tables de 7, 8 et 9', requis: 'argent', tables: [7, 8, 9] },
    // Accomplissements secrets (pierres précieuses), visibles après la médaille d'or
    rubis: {
      titre: 'Défi vitesse', pierre: 'rubis', tables: TOUTES, chrono: CHRONO_RUBIS,
      desc: `${NB_DEFIS} divisions, toutes les tables, en moins de ${duree(CHRONO_RUBIS)}!`,
      intro: `Défi vitesse! Tu as ${duree(CHRONO_RUBIS)} pour réussir ${NB_DEFIS} divisions. Le chrono part maintenant!`,
    },
    emeraude: {
      titre: 'Défi de tête', pierre: 'emeraude', tables: TOUTES, sansAide: true, maxErreurs: MAX_ERREURS_EMERAUDE,
      desc: 'Pas de jetons ni d’indices : tu réponds de mémoire. Une seule erreur permise!',
      intro: 'Défi de tête! Pas de jetons, pas d’indices : seulement ta mémoire des tables. <b>Attention : une seule erreur est permise</b> pour gagner l’émeraude.',
    },
    saphir: {
      titre: 'Sans faute', pierre: 'saphir',
      desc: 'Réussis les défis bronze, argent et or sans aucune erreur.',
    },
    diamant: {
      titre: 'Défi diamant', pierre: 'diamant', tables: TOUTES, zero: true,
      desc: 'Les tables avec un zéro de plus : 720 ÷ 9 = 80!',
    },
  };

  const BRAVOS = ['Bravo!', 'Super!', 'Wow!', 'Excellent!', 'Tu l’as!', 'Parfait!', 'Génial!'];
  const COULEURS_GROUPES = ['#3a6fe0', '#2fa866', '#e0577f', '#8a5cf0', '#14a3b8', '#ff8a3d', '#b8860b', '#e5484d', '#5a6b8c', '#1f9e8f'];

  const ETAPES_TUTO = [
    {
      texte: 'Voici <b>12 jetons</b>. Calculer <b>12 ÷ 3</b>, c’est chercher combien de <b>groupes de 3</b> on peut faire avec 12 jetons.',
      attente: 'suivant',
    },
    {
      texte: 'Clique sur <b>« Faire un groupe de 3 »</b> pour former un premier groupe.',
      consigne: 'Clique sur « Faire un groupe de 3 ».',
      attente: 'groupe',
    },
    {
      texte: 'Bien! Continue à faire des groupes de 3 jusqu’à ce qu’il ne reste plus de jetons.',
      consigne: 'Continue à faire des groupes de 3.',
      attente: 'tous-les-groupes',
    },
    {
      texte: 'Il ne reste plus de jetons : on a fait <b>4 groupes de 3</b>. Donc <b>12 ÷ 3 = 4</b>! Écris 4 dans la case, puis clique sur <b>Vérifier</b>.',
      consigne: 'Écris 4 dans la case, puis clique sur Vérifier.',
      attente: 'reponse',
    },
    {
      texte: 'Bravo! Voici le truc des grands : <b>la division, c’est la multiplication à l’envers</b>. Pour trouver 12 ÷ 3, demande-toi : <b>3 × ? = 12</b>. Comme 3 × 4 = 12, alors 12 ÷ 3 = 4.',
      attente: 'suivant',
      bravo: true,
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
    equation: $('#equation'), visuel: $('#visuel'), bulle: $('#bulle'),
    clavier: $('#clavier'), actions: $('.actions'),
    verifier: $('#btn-verifier'), suivant: $('#btn-suivant'), aide: $('#btn-aide'),
  };

  el.badge.innerHTML = `<span class="avatar petit" style="--couleur:${joueur.couleur}" aria-hidden="true">${joueur.emoji}</span>${Jeu.echapper(joueur.nom)}`;

  let S = null; // la partie en cours
  const son = (nom) => Jeu.jouer(nom);
  const choisir = (liste) => liste[Math.floor(Math.random() * liste.length)];
  const etape = () => ETAPES_TUTO[S.etape];
  const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function duree(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (!m) return `${s} secondes`;
    return s ? `${m} min ${s} s` : `${m} minute${m > 1 ? 's' : ''}`;
  }

  function formaterTemps(sec) {
    const s = Math.max(0, Math.round(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

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
  //  Problèmes
  // ==========================================================

  const melanger = (t) => {
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  };

  // NB_DEFIS divisions différentes tirées des tables du niveau.
  // Peu de « ÷ 1 » et de quotients de 1, qui sont trop faciles.
  function generer(N) {
    const paires = [];
    for (const b of N.tables) for (let q = 1; q <= 10; q++) paires.push([b, q]);
    melanger(paires);
    const liste = [];
    let faciles = 0;
    for (const [b, q] of paires) {
      if (liste.length >= NB_DEFIS) break;
      const facile = b === 1 || q === 1;
      if (facile && faciles >= 1) continue;
      if (facile) faciles++;
      liste.push(probleme(b, q, N.zero));
    }
    // Petit filet de sécurité (si les tables du niveau ne suffisent pas)
    while (liste.length < NB_DEFIS) liste.push(probleme(...paires[liste.length % paires.length], N.zero));
    return liste;
  }

  function probleme(b, q, zero = false) {
    const f = zero ? 10 : 1;
    return { a: b * q * f, b, q: q * f, zero };
  }

  // ==========================================================
  //  Écrans
  // ==========================================================

  function montrer(nom) {
    for (const [k, e] of Object.entries(ecrans)) e.hidden = k !== nom;
    // Le bouton cliqué est maintenant caché : on lui retire le focus, sinon Entrée le « recliquerait ».
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
        <h1>Tables de division</h1>
        <p>Diviser, c’est faire des groupes égaux. Le truc : la multiplication à l’envers!</p>
      </header>`;
    if (!p.tutorielFait) {
      h += `<div class="carte carte-tuto">
          <div class="texte"><h2>Commence ici!</h2>
            <p>D’abord des jetons à placer en groupes, puis le truc de la multiplication. Ensuite, les défis seront débloqués.</p></div>
          <button class="bouton orange gros" type="button" data-action="tuto">Commencer le tutoriel ▸</button>
        </div>`;
    }
    h += '<h2>Les défis</h2><div class="liste-niveaux">';
    for (const niv of ORDRE) {
      const N = NIVEAUX[niv];
      const gagnee = p.medailles[niv];
      let bloque = null;
      if (!p.tutorielFait) bloque = 'Fais d’abord le tutoriel';
      else if (N.requis && !p.medailles[N.requis]) bloque = `Gagne d’abord la médaille ${Jeu.NOM_MEDAILLE[N.requis]}`;
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
    if (a !== 'aide' && a !== 'continuer') son(a === 'menu' ? 'retour' : 'nav');
    if (a === 'tuto' || a === 'revoir') demarrerTutoriel();
    else if (a === 'defi') demarrerDefi(b.dataset.niveau);
    else if (a === 'menu') afficherMenu();
    else if (a === 'aide') aide();
    else if (a === 'recommencer' && S) demarrerDefi(S.niveau);
    else if (a === 'continuer') dire('D’accord, on continue pour pratiquer! Corrige ta réponse, puis vérifie.');
    else if (a === 'grouper') faireGroupe();
  }
  ecrans.menu.addEventListener('click', actionBouton);
  ecrans.fin.addEventListener('click', actionBouton);
  el.bulle.addEventListener('click', actionBouton);
  el.visuel.addEventListener('click', actionBouton);

  // ==========================================================
  //  Démarrer une partie
  // ==========================================================

  function nouveauProbleme(pb) {
    Object.assign(S, {
      pb, saisie: '', statut: null, groupes: 0, fini: false, enAttente: false,
      derniereFausse: null, visuel: false, explication: false,
    });
  }

  function demarrerTutoriel() {
    arreterChrono();
    S = { type: 'tuto', partie: 1, mode: 'tuto', etape: 0 };
    nouveauProbleme(probleme(3, 4));
    S.visuel = true;
    el.titre.textContent = 'Tutoriel : faire des groupes';
    el.progression.textContent = 'Partie 1 sur 3';
    montrer('jeu');
    rendre();
    dire(etape().texte);
  }

  function demarrerPartie(n) {
    S = { type: 'tuto', partie: n, mode: 'semi' };
    if (n === 2) {
      nouveauProbleme(probleme(5, 4));
      S.visuel = true;
      el.titre.textContent = 'Tutoriel : à toi, avec des jetons';
      dire('À ton tour : <b>20 ÷ 5</b>. Pense à la table de 5 : <b>5 × ? = 20</b>. Si tu veux, fais des groupes avec les jetons.');
    } else {
      nouveauProbleme(probleme(7, 6));
      el.titre.textContent = 'Tutoriel : le truc de la multiplication';
      dire('Dernier exemple, sans jetons : <b>42 ÷ 7</b>. Demande-toi : <b>7 × ? = 42</b>. Pense à ta table de 7!');
    }
    el.progression.textContent = `Partie ${n} sur 3`;
    rendre();
  }

  function demarrerDefi(niveau) {
    const N = NIVEAUX[niveau];
    arreterChrono();
    S = { type: 'defi', mode: 'defi', niveau, liste: generer(N), index: 0, erreurs: 0 };
    if (N.zero) {
      // Défi diamant : une petite explication avant de commencer
      nouveauProbleme(probleme(9, 8, true));
      S.explication = true;
      el.titre.textContent = N.titre;
      el.progression.innerHTML = '';
      montrer('jeu');
      rendre();
      dire(`<b>Le truc du zéro!</b> 720, c’est 72 dizaines. Cache le 0 : <b>72 ÷ 9 = 8</b>. Puis remets le 0 : <b>720 ÷ 9 = 80</b>.
        On peut vérifier avec la multiplication : 9 × 80 = 720 ✔`);
      return;
    }
    chargerDefi();
    if (N.chrono) demarrerChrono(N.chrono);
  }

  function chargerDefi() {
    const N = NIVEAUX[S.niveau];
    nouveauProbleme(S.liste[S.index]);
    el.titre.textContent = N.titre;
    el.progression.innerHTML = S.liste.map((_, k) =>
      `<span class="point${k < S.index ? ' fait' : k === S.index ? ' actuel' : ''}"></span>`).join('')
      + `<span>&nbsp;${S.index + 1}/${S.liste.length}</span>`;
    majCompteurErreurs();
    montrer('jeu');
    rendre();
    if (S.index === 0 && N.intro) dire(N.intro);
    else if (S.index === 0) dire('À toi de jouer! Écris ta réponse, puis clique sur <b>Vérifier</b> (ou appuie sur Entrée).');
    else dire(`Division ${S.index + 1} : à toi!`);
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

  function rendreEquation() {
    const { a, b } = S.pb;
    if (S.explication) {
      el.equation.innerHTML = `<div class="demo-zero">
          <div class="ligne">720 ÷ 9 = ?</div>
          <div class="ligne"><span class="fleche">cache le 0 →</span> <span>72<span class="zero-cache">0</span></span> ÷ 9 = 8</div>
          <div class="ligne"><span class="fleche">remets le 0 →</span> <span>8<span class="zero-remis">0</span></span></div>
          <div class="legende">72 dizaines ÷ 9 = 8 dizaines = 80</div>
        </div>`;
      return;
    }
    const classe = ['case-quotient'];
    if (!S.saisie) classe.push('vide');
    if (S.statut) classe.push(S.statut);
    const rappel = S.mode === 'semi' || (S.type === 'tuto' && S.etape >= 4)
      ? `<div class="rappel-multiplication">Pense à : <b>${b} × ? = ${a}</b></div>`
      : '';
    el.equation.innerHTML = `<div class="equation" aria-label="${a} divisé par ${b}">
        <span>${a}</span><span class="signe-op">÷</span><span>${b}</span><span class="signe-op">=</span>
        <span class="${classe.join(' ')}">${S.saisie}</span>
      </div>${rappel}`;
  }

  function rendreVisuel() {
    const { a, b } = S.pb;
    const visible = S.visuel && !S.explication && a <= 100;
    el.visuel.hidden = !visible;
    if (!visible) return;
    const reste = a - S.groupes * b;
    let groupes = '';
    for (let g = 0; g < S.groupes; g++) {
      const nouveau = S.nouveauGroupe && g === S.groupes - 1 ? ' nouveau' : '';
      groupes += `<div class="groupe${nouveau}" style="--couleur:${COULEURS_GROUPES[g % COULEURS_GROUPES.length]}">
          <span class="numero">${g + 1}</span>${'<span class="jeton-rond"></span>'.repeat(b)}</div>`;
    }
    el.visuel.innerHTML = `
      <div class="entete-visuel">
        <span>Groupes de ${b} : ${S.groupes}</span>
        <button type="button" class="bouton" data-action="grouper" ${reste < b ? 'disabled' : ''}>Faire un groupe de ${b}</button>
      </div>
      <div class="groupes">${groupes}</div>
      <div class="reserve" aria-label="${reste} jetons pas encore placés">${'<span class="jeton-rond"></span>'.repeat(reste)}</div>`;
  }

  function rendreControles() {
    const att = S.mode === 'tuto' ? etape().attente : null;
    const enSaisie = !S.fini && !S.explication && (att ? att === 'reponse' : true);
    el.clavier.hidden = !enSaisie;
    el.verifier.hidden = !enSaisie;
    const N = S.niveau ? NIVEAUX[S.niveau] : null;
    el.aide.hidden = !(S.mode === 'defi' && !S.fini && !S.explication && !(N && N.sansAide));
    el.suivant.hidden = !(att ? att === 'suivant' : (S.fini && S.type === 'tuto') || S.explication);
    el.suivant.textContent = S.explication ? 'J’ai compris, on y va! ▸' : 'Suivant ▸';
    el.actions.hidden = el.verifier.hidden && el.aide.hidden && el.suivant.hidden;
  }

  function rendre() {
    rendreEquation();
    rendreVisuel();
    rendreControles();
    S.nouveauGroupe = false; // l'animation ne joue qu'une fois, pour le groupe qu'on vient de faire
  }

  el.clavier.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    .map((d) => `<button type="button" class="touche" data-chiffre="${d}">${d}</button>`).join('')
    + '<button type="button" class="touche effacer" data-effacer aria-label="Effacer">⌫</button>';

  // ==========================================================
  //  Actions de l'élève
  // ==========================================================

  function faireGroupe() {
    if (!S || S.fini) return;
    const { a, b } = S.pb;
    if (S.mode === 'tuto' && !['groupe', 'tous-les-groupes'].includes(etape().attente)) {
      son('oups');
      dire(`Pas tout de suite! ${etape().consigne || 'Lis la consigne, puis clique sur un bouton.'}`, 'oups');
      return;
    }
    if (a - S.groupes * b < b) return;
    S.groupes++;
    S.nouveauGroupe = true;
    son('depot');
    const fini = S.groupes * b === a;
    if (S.mode === 'tuto') {
      if (etape().attente === 'groupe') S.etape++;
      if (fini && etape().attente === 'tous-les-groupes') S.etape++;
      rendre();
      dire(fini || S.groupes === 1 ? etape().texte : `${etape().texte} (${S.groupes} groupe${S.groupes > 1 ? 's' : ''} jusqu’ici)`);
      return;
    }
    rendre();
    if (fini) dire(`Plus de jetons! Combien de groupes de ${b} as-tu faits? C’est la réponse de ${a} ÷ ${b}.`);
  }

  function entrer(d) {
    if (!S || S.fini || S.enAttente || S.explication) return;
    if (S.mode === 'tuto' && etape().attente !== 'reponse') {
      son('oups');
      dire(`Pas tout de suite! ${etape().consigne || 'Lis la consigne, puis clique sur un bouton.'}`, 'oups');
      return;
    }
    if (S.saisie.length >= 3) return;
    if (S.saisie === '0') S.saisie = '';
    S.saisie += String(d);
    S.statut = null;
    son('chiffre');
    rendre();
  }

  function effacer() {
    if (!S || S.fini || S.enAttente || !S.saisie) return;
    S.saisie = S.saisie.slice(0, -1);
    S.statut = null;
    son('clic');
    rendre();
  }

  function indice() {
    const { a, b, zero } = S.pb;
    if (zero) return `Cache le 0 : <b>${a / 10} ÷ ${b} = ?</b> Puis remets le 0 à la fin.`;
    const bonds = [1, 2, 3].map((k) => k * b).join(', ');
    return `Pense à la table de ${b} : <b>${b} × ? = ${a}</b>. Ou compte par bonds de ${b} : ${bonds}… jusqu’à ${a}. Combien de bonds?`;
  }

  function verifier() {
    if (!S || S.fini || S.enAttente || S.explication) return;
    if (S.mode === 'tuto' && etape().attente !== 'reponse') return;
    if (!S.saisie) {
      son('oups');
      dire('Écris d’abord ta réponse avec les chiffres.', 'oups');
      return;
    }
    const rep = Number(S.saisie);
    if (rep === S.pb.q) {
      S.statut = 'ok';
      if (S.mode === 'tuto') {
        son('bon');
        S.etape++;
        rendre();
        dire(etape().texte, 'bravo');
        confettis();
        return;
      }
      if (S.mode === 'semi') { reussiteTuto(); return; }
      reussiteDefi();
      return;
    }

    // Mauvaise réponse
    S.statut = 'faux';
    rendre();
    secouer(el.equation);
    if (S.mode !== 'defi') {
      son('erreur');
      dire(`Pas tout à fait… ${S.mode === 'tuto' ? 'Compte les groupes que tu as faits.' : indice()}`, 'oups');
      return;
    }
    // Vérifier deux fois la même réponse ne compte qu'une seule erreur.
    if (S.derniereFausse === S.saisie) {
      son('oups');
      dire('Ta réponse n’a pas changé : efface-la (⌫) et essaie un autre nombre.', 'oups');
      return;
    }
    S.derniereFausse = S.saisie;
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
    const lien = N.sansAide ? '' : ' <button type="button" class="lien-tuto" data-action="aide">Un indice?</button>';
    dire(`Pas tout à fait! Essaie encore.${compte}${lien}`, 'oups');
  }

  function aide() {
    if (!S || S.fini || S.mode !== 'defi') return;
    if (S.pb.a <= 100) S.visuel = true;
    rendre();
    dire(`${indice()}<br><button type="button" class="lien-tuto" data-action="revoir">📖 Revoir le tutoriel</button>`);
  }

  function reussiteTuto() {
    S.fini = true;
    son('reussite');
    confettis();
    rendre();
    const { a, b, q } = S.pb;
    dire(`Bravo! <b>${a} ÷ ${b} = ${q}</b>, parce que ${b} × ${q} = ${a}.`, 'bravo');
    el.suivant.focus();
  }

  // Une bonne réponse en défi : on enchaîne tout seul avec la division suivante.
  function reussiteDefi() {
    S.enAttente = true;
    son('bon');
    rendre();
    const { a, b, q } = S.pb;
    const dernier = S.index === S.liste.length - 1;
    if (dernier && S.chrono) {
      S.tempsFinal = S.chrono.total - resteChrono();
      arreterChrono();
    }
    dire(`${choisir(BRAVOS)} <b>${a} ÷ ${b} = ${q}</b>`, 'bravo');
    setTimeout(() => {
      if (!S || S.type !== 'defi' || ecrans.jeu.hidden) return;
      S.index++;
      if (S.index >= S.liste.length) finNiveau();
      else chargerDefi();
    }, 750);
  }

  function suivant() {
    if (!S) return;
    if (S.explication) {
      S.explication = false;
      chargerDefi();
      return;
    }
    if (S.mode === 'tuto') {
      if (etape().attente !== 'suivant') return;
      if (S.etape < ETAPES_TUTO.length - 1) {
        S.etape++;
        rendre();
        dire(etape().texte);
      } else {
        demarrerPartie(2);
      }
      return;
    }
    if (S.type === 'tuto' && S.fini) {
      if (S.partie === 2) demarrerPartie(3);
      else finTutoriel();
    }
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
    el.chrono.classList.toggle('presse', sec <= 20);
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
    const reussis = S.index;
    const niv = S.niveau;
    arreterChrono();
    S = null;
    son('oups');
    ecrans.fin.innerHTML = `<div class="carte fin">
        <div class="grande-medaille" style="font-size:90px" aria-hidden="true">⏱</div>
        <h1>Temps écoulé!</h1>
        <p>Tu as réussi ${reussis} division${reussis > 1 ? 's' : ''} sur ${NB_DEFIS}. Essaie encore, tu vas y arriver!</p>
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
        <p>Tu sais maintenant diviser : faire des groupes égaux, ou chercher le nombre qui manque dans la multiplication. Les défis t’attendent!</p>
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
    if (premierOr) {
      bonus += '<p class="indice-secret">🤫 Psst… des accomplissements secrets viennent d’apparaître dans le menu de l’activité!</p>';
    }
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
          <a class="bouton secondaire" href="../index.html">Page d’accueil</a>
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
          <p>Tu as fini les ${NB_DEFIS} divisions avec ${erreurs} erreurs. Pour ${Jeu.NOM_PIERRE[pierre]}, une seule erreur est permise.</p>
          <p>Révise un peu tes tables, et réessaie!</p>
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
    } else if (ev.key === 'Enter') {
      // Entrée = Vérifier (ou Suivant), même si un autre bouton du jeu a gardé le focus.
      // Seuls les boutons de choix (dans la bulle) gardent leur propre Entrée.
      const bouton = ev.target.closest && ev.target.closest('button, a');
      if (bouton && bouton.offsetParent !== null && el.bulle.contains(bouton)) return;
      ev.preventDefault();
      if (!el.verifier.hidden) verifier();
      else if (!el.suivant.hidden) suivant();
    }
  });

  afficherMenu();
});
