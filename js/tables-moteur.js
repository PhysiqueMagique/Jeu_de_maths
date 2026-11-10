/* ==========================================================
   Moteur commun des activités « tables » (division, multiplication)
   ----------------------------------------------------------
   Chaque activité appelle ActiviteTables(config) avec :
   - ses textes (titre, tutoriel, fin du tutoriel…);
   - ses niveaux (quelles tables pour bronze, argent, or);
   - probleme(table, facteur, zero) qui fabrique un problème :
       { gauche, droite, reponse, nbGroupes, taille, total, zero, cle }
     « nbGroupes » groupes de « taille » jetons = « total » jetons;
   - indice(pb), rappel(pb), pourquoi(pb) pour les aides.

   Façons de jouer un problème (S.mode) :
     'tuto' : exemple expliqué, chaque étape est imposée
     'semi' : l'élève répond, l'indice s'affiche tout seul
     'defi' : l'élève répond et vérifie (aide sur demande)
   ========================================================== */
'use strict';

function ActiviteTables(cfg) {
  Jeu.demarrer().then(() => demarrerActivite(cfg));
}

function demarrerActivite(cfg) {
  const ACT = cfg.id;
  const NB_DEFIS = cfg.nbDefis || 10;
  const CHRONO_RUBIS = cfg.chronoRubis || 90;
  const MAX_ERREURS_EMERAUDE = cfg.maxErreursEmeraude === undefined ? 1 : cfg.maxErreursEmeraude;
  const MAX_JETONS = 144; // au-delà, pas de jetons à l'écran
  const ORDRE = ['bronze', 'argent', 'or'];
  const ORDRE_PIERRES = ['rubis', 'emeraude', 'saphir', 'diamant'];
  const SYMBOLE = cfg.symbole;

  const NIVEAUX = {
    bronze: { titre: 'Défi bronze', requis: null, ...cfg.niveaux.bronze },
    argent: { titre: 'Défi argent', requis: 'bronze', ...cfg.niveaux.argent },
    or: { titre: 'Défi or', requis: 'argent', ...cfg.niveaux.or },
    // Accomplissements secrets (pierres précieuses), visibles après la médaille d'or
    rubis: {
      titre: 'Défi vitesse', pierre: 'rubis', tables: cfg.toutes, chrono: CHRONO_RUBIS,
      desc: `${NB_DEFIS} ${cfg.nomPluriel}, toutes les tables, en moins de ${duree(CHRONO_RUBIS)}!`,
      intro: `Défi vitesse! Tu as ${duree(CHRONO_RUBIS)} pour réussir ${NB_DEFIS} ${cfg.nomPluriel}. Le chrono part maintenant!`,
    },
    emeraude: {
      titre: 'Défi de tête', pierre: 'emeraude', tables: cfg.toutes, sansAide: true, maxErreurs: MAX_ERREURS_EMERAUDE,
      desc: 'Pas de jetons ni d’indices : tu réponds de mémoire. Une seule erreur permise!',
      intro: 'Défi de tête! Pas de jetons, pas d’indices : seulement ta mémoire des tables. <b>Attention : une seule erreur est permise</b> pour gagner l’émeraude.',
    },
    saphir: {
      titre: 'Sans faute', pierre: 'saphir',
      desc: 'Réussis les défis bronze, argent et or sans aucune erreur.',
    },
    diamant: {
      titre: 'Défi diamant', pierre: 'diamant', tables: cfg.toutes, zero: true,
      desc: cfg.diamant.desc,
    },
  };

  const BRAVOS = ['Bravo!', 'Super!', 'Wow!', 'Excellent!', 'Tu l’as!', 'Parfait!', 'Génial!'];
  const COULEURS_GROUPES = ['#3a6fe0', '#2fa866', '#e0577f', '#8a5cf0', '#14a3b8', '#ff8a3d', '#b8860b', '#e5484d', '#5a6b8c', '#1f9e8f', '#c2410c', '#7c3aed'];
  const ETAPES_TUTO = cfg.tuto.etapes;

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
  const pasTouteDeSuite = () => `Pas tout de suite! ${etape().consigne || 'Lis la consigne, puis clique sur un bouton.'}`;

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

  // NB_DEFIS problèmes différents tirés des tables du niveau.
  // Un seul problème « trop facile » (table de 1 ou facteur 1) par défi.
  function generer(N) {
    const paires = [];
    for (const t of N.tables) for (const k of cfg.facteurs) paires.push([t, k]);
    melanger(paires);
    const liste = [];
    const vus = new Set();
    let faciles = 0;
    for (const [t, k] of paires) {
      if (liste.length >= NB_DEFIS) break;
      // Multiplication : on mélange l'ordre (7 × 8 ou 8 × 7) pour varier.
      const [x, y] = cfg.ordreAleatoire && Math.random() < 0.5 ? [k, t] : [t, k];
      const pb = cfg.probleme(x, y, !!N.zero);
      if (vus.has(pb.cle)) continue;
      const facile = t === 1 || k === 1;
      if (facile && faciles >= 1) continue;
      if (facile) faciles++;
      vus.add(pb.cle);
      liste.push(pb);
    }
    // Petit filet de sécurité (si les tables du niveau ne suffisent pas)
    let k = 0;
    while (liste.length < NB_DEFIS) liste.push(cfg.probleme(...paires[k++ % paires.length], !!N.zero));
    return liste;
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
        <h1>${cfg.titre}</h1>
        <p>${cfg.sousTitre}</p>
      </header>`;
    if (!p.tutorielFait) {
      h += `<div class="carte carte-tuto">
          <div class="texte"><h2>Commence ici!</h2>
            <p>${cfg.texteCarteTuto} Tu peux aussi le sauter et aller directement aux défis.</p></div>
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
    if (!['aide', 'continuer', 'grouper'].includes(a)) son(a === 'menu' ? 'retour' : 'nav');
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
      derniereFausse: null, visuel: false, explication: false, nouveauGroupe: false,
    });
  }

  function demarrerTutoriel() {
    arreterChrono();
    S = { type: 'tuto', partie: 1, mode: 'tuto', etape: 0 };
    nouveauProbleme(cfg.probleme(...cfg.tuto.exemple));
    S.visuel = true;
    el.titre.textContent = cfg.tuto.titre;
    el.progression.textContent = `Partie 1 sur ${cfg.tuto.parties.length + 1}`;
    montrer('jeu');
    rendre();
    dire(etape().texte);
  }

  function demarrerPartie(n) {
    const partie = cfg.tuto.parties[n - 2];
    S = { type: 'tuto', partie: n, mode: 'semi' };
    nouveauProbleme(cfg.probleme(...partie.exemple));
    S.visuel = !!partie.jetons;
    el.titre.textContent = partie.titre;
    el.progression.textContent = `Partie ${n} sur ${cfg.tuto.parties.length + 1}`;
    rendre();
    dire(partie.message);
  }

  function demarrerDefi(niveau) {
    const N = NIVEAUX[niveau];
    arreterChrono();
    S = { type: 'defi', mode: 'defi', niveau, liste: generer(N), index: 0, erreurs: 0 };
    if (N.zero) {
      // Défi diamant : une petite explication avant de commencer
      nouveauProbleme(cfg.probleme(...cfg.diamant.exemple, true));
      S.explication = true;
      el.titre.textContent = N.titre;
      el.progression.innerHTML = '';
      montrer('jeu');
      rendre();
      dire(cfg.diamant.texte);
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
    else dire(`${cfg.nomSingulierMaj} ${S.index + 1} : à toi!`);
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
    const { gauche, droite } = S.pb;
    if (S.explication) {
      el.equation.innerHTML = cfg.diamant.demo;
      return;
    }
    const classe = ['case-quotient'];
    if (!S.saisie) classe.push('vide');
    if (S.statut) classe.push(S.statut);
    const montrerRappel = S.mode === 'semi' || (S.type === 'tuto' && S.etape >= ETAPES_TUTO.length - 1);
    const rappel = montrerRappel && cfg.rappel ? `<div class="rappel-multiplication">${cfg.rappel(S.pb)}</div>` : '';
    el.equation.innerHTML = `<div class="equation" aria-label="${gauche} ${cfg.motOperation} ${droite}">
        <span>${gauche}</span><span class="signe-op">${SYMBOLE}</span><span>${droite}</span><span class="signe-op">=</span>
        <span class="${classe.join(' ')}">${S.saisie}</span>
      </div>${rappel}`;
  }

  function rendreVisuel() {
    const { nbGroupes, taille, total, zero } = S.pb;
    const visible = S.visuel && !S.explication && !zero && total <= MAX_JETONS;
    el.visuel.hidden = !visible;
    if (!visible) return;
    let groupes = '';
    for (let g = 0; g < S.groupes; g++) {
      const nouveau = S.nouveauGroupe && g === S.groupes - 1 ? ' nouveau' : '';
      groupes += `<div class="groupe${nouveau}" style="--couleur:${COULEURS_GROUPES[g % COULEURS_GROUPES.length]}">
          <span class="numero">${g + 1}</span>${'<span class="jeton-rond"></span>'.repeat(taille)}</div>`;
    }
    const reste = cfg.reserve ? total - S.groupes * taille : 0;
    el.visuel.innerHTML = `
      <div class="entete-visuel">
        <span>${cfg.texteCompteur(S.groupes, taille)}</span>
        <button type="button" class="bouton" data-action="grouper" ${S.groupes >= nbGroupes ? 'disabled' : ''}>Faire un groupe de ${taille}</button>
      </div>
      <div class="groupes">${groupes}</div>
      ${cfg.reserve ? `<div class="reserve" aria-label="${reste} jetons pas encore placés">${'<span class="jeton-rond"></span>'.repeat(reste)}</div>` : ''}`;
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
    if (S.mode === 'tuto' && !['groupe', 'tous-les-groupes'].includes(etape().attente)) {
      son('oups');
      dire(pasTouteDeSuite(), 'oups');
      return;
    }
    if (S.groupes >= S.pb.nbGroupes) return;
    S.groupes++;
    S.nouveauGroupe = true;
    son('depot');
    const fini = S.groupes === S.pb.nbGroupes;
    if (S.mode === 'tuto') {
      if (etape().attente === 'groupe') S.etape++;
      if (fini && etape().attente === 'tous-les-groupes') S.etape++;
      rendre();
      dire(fini || S.groupes === 1 ? etape().texte : `${etape().texte} (${cfg.texteCompteur(S.groupes, S.pb.taille)})`);
      return;
    }
    rendre();
    if (fini) dire(cfg.messageGroupesFinis(S.pb));
  }

  function entrer(d) {
    if (!S || S.fini || S.enAttente || S.explication) return;
    if (S.mode === 'tuto' && etape().attente !== 'reponse') {
      son('oups');
      dire(pasTouteDeSuite(), 'oups');
      return;
    }
    if (S.saisie.length >= (cfg.chiffresMax || 3)) return;
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

  function verifier() {
    if (!S || S.fini || S.enAttente || S.explication) return;
    if (S.mode === 'tuto' && etape().attente !== 'reponse') return;
    if (!S.saisie) {
      son('oups');
      dire('Écris d’abord ta réponse avec les chiffres.', 'oups');
      return;
    }
    if (Number(S.saisie) === S.pb.reponse) {
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
      dire(`Pas tout à fait… ${S.mode === 'tuto' ? cfg.tuto.indiceEtape : cfg.indice(S.pb)}`, 'oups');
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
    if (S.pb.total <= MAX_JETONS && !S.pb.zero) S.visuel = true;
    rendre();
    dire(`${cfg.indice(S.pb)}<br><button type="button" class="lien-tuto" data-action="revoir">📖 Revoir le tutoriel</button>`);
  }

  function reussiteTuto() {
    S.fini = true;
    son('reussite');
    confettis();
    rendre();
    const { gauche, droite, reponse } = S.pb;
    dire(`Bravo! <b>${gauche} ${SYMBOLE} ${droite} = ${reponse}</b>${cfg.pourquoi ? cfg.pourquoi(S.pb) : ''}.`, 'bravo');
    el.suivant.focus();
  }

  // Une bonne réponse en défi : on enchaîne tout seul avec le problème suivant.
  function reussiteDefi() {
    S.enAttente = true;
    son('bon');
    rendre();
    const { gauche, droite, reponse } = S.pb;
    const dernier = S.index === S.liste.length - 1;
    if (dernier && S.chrono) {
      S.tempsFinal = S.chrono.total - resteChrono();
      arreterChrono();
    }
    dire(`${choisir(BRAVOS)} <b>${gauche} ${SYMBOLE} ${droite} = ${reponse}</b>`, 'bravo');
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
      if (S.partie <= cfg.tuto.parties.length) demarrerPartie(S.partie + 1);
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
        <p>Tu as réussi ${reussis} ${reussis > 1 ? cfg.nomPluriel : cfg.nomSingulier} sur ${NB_DEFIS}. Essaie encore, tu vas y arriver!</p>
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
        <p>${cfg.texteFinTuto} Les défis t’attendent!</p>
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
          <p>Tu as fini les ${NB_DEFIS} ${cfg.nomPluriel} avec ${erreurs} erreurs. Pour ${Jeu.NOM_PIERRE[pierre]}, une seule erreur est permise.</p>
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
}
