/* ==========================================================
   Soustraction avec emprunt — affichage et déroulement
   Trois façons de jouer un problème (S.mode) :
     'tuto' : exemple expliqué, chaque étape est imposée
     'semi' : l'élève fait tout, l'indice s'affiche tout seul
     'defi' : l'élève fait tout, il vérifie lui-même (aide sur demande)
   ========================================================== */
'use strict';

Jeu.demarrer().then(() => {
  const M = Modele;
  const ACT = 'soustraction-emprunt';
  const NB_DEFIS = 5;
  const ORDRE = ['bronze', 'argent', 'or'];
  // Réglages des accomplissements secrets (faciles à changer)
  const CHRONO_RUBIS = 120; // secondes pour réussir les 5 problèmes du défi vitesse
  const MAX_ERREURS_EMERAUDE = 1; // erreurs permises dans le défi sur papier

  const NIVEAUX = {
    bronze: {
      titre: 'Défi bronze', desc: 'Nombres à 2 chiffres', requis: null, generer: 'bronze',
      intro: '',
    },
    argent: {
      titre: 'Défi argent', desc: 'Nombres à 3 chiffres, parfois 2 emprunts', requis: 'bronze', generer: 'argent', coupDePouce: true,
      intro: 'Maintenant avec des centaines! Ça marche pareil : une colonne à la fois, de droite à gauche. Je t’aide pour ce premier problème.',
    },
    or: {
      titre: 'Défi or', desc: 'Des zéros qui compliquent tout… et des unités de mille!', requis: 'argent', generer: 'or', coupDePouce: true,
      intro: 'Nouveau truc : parfois, la colonne voisine vaut 0 et n’a rien à prêter. Je t’aide pour ce premier problème.',
    },
    // Accomplissements secrets (pierres précieuses), visibles après la médaille d'or
    rubis: {
      titre: 'Défi vitesse', pierre: 'rubis', generer: 'or', chrono: CHRONO_RUBIS,
      desc: `5 problèmes de niveau or en moins de ${CHRONO_RUBIS / 60} minutes!`,
      intro: `Défi vitesse! Tu as ${CHRONO_RUBIS / 60} minutes pour réussir les 5 problèmes. Le chrono part maintenant!`,
    },
    emeraude: {
      titre: 'Défi sur papier', pierre: 'emeraude', generer: 'papier', papier: true, maxErreurs: MAX_ERREURS_EMERAUDE,
      desc: `Fais tes emprunts sur une feuille : ici, tu écris seulement la réponse. Une seule erreur permise!`,
      intro: `Défi sur papier! Prends une feuille et un crayon. Recopie la soustraction, fais tes emprunts sur ta feuille, puis écris seulement la réponse ici. <b>Attention : une seule erreur est permise</b> pour gagner l’émeraude.`,
    },
    saphir: {
      titre: 'Sans faute', pierre: 'saphir',
      desc: 'Réussis les défis bronze, argent et or sans aucune erreur.',
    },
    diamant: {
      titre: 'Défi diamant', pierre: 'diamant', generer: 'diamant',
      desc: 'Des nombres géants, jusqu’aux millions!',
      intro: 'Défi diamant! Des nombres géants… mais la méthode est toujours la même : une colonne à la fois, de droite à gauche.',
    },
  };
  const ORDRE_PIERRES = ['rubis', 'emeraude', 'saphir', 'diamant'];
  const BRAVOS = ['Bravo!', 'Super!', 'Wow, bien joué!', 'Excellent!', 'Tu l’as!', 'Parfait!', 'Génial!'];
  const PETITS_BRAVOS = ['Oui!', 'Exact!', 'Bien!', 'Bravo!'];

  const ETAPES_TUTO = [
    {
      texte: 'Voici la soustraction <b>52 − 28</b>, écrite en colonnes : les dizaines (D) à gauche, les unités (U) à droite. À côté, les blocs montrent 52 : 5 barres de dix et 2 petits cubes.',
      attente: { type: 'suivant' },
    },
    {
      texte: 'On commence toujours par la droite, avec les unités : <b>2 − 8</b>. Est-ce qu’on peut enlever 8 cubes quand on en a seulement 2?',
      attente: {
        type: 'choix',
        options: [
          { texte: 'Oui', bon: false, msg: 'Regarde les cubes orange : il y en a seulement 2. Peut-on vraiment en enlever 8?' },
          { texte: 'Non, 2 c’est trop petit!', bon: true },
        ],
      },
    },
    {
      texte: 'Exact! Il nous manque des unités. On va <b>emprunter à la dizaine</b> : <b>clique sur le 5</b> pour le barrer.',
      attente: { type: 'preter', col: 0 },
      consigne: 'Clique sur le <b>5</b> des dizaines pour le barrer.',
    },
    {
      texte: 'Le 5 est barré : il reste <b>4 dizaines</b>. La dizaine empruntée vaut 10 unités. <b>Clique sur le 2</b> des unités pour lui donner cette dizaine.',
      attente: { type: 'recevoir', col: 1 },
      consigne: 'Clique sur le <b>2</b> des unités pour lui donner la dizaine.',
    },
    {
      texte: 'Le 2 est devenu <b>12</b>! (Regarde les blocs : la barre s’est changée en 10 petits cubes.) Maintenant, calcule <b>12 − 8</b> et écris la réponse sous les unités.',
      attente: { type: 'reponse', col: 1 },
      consigne: 'Calcule <b>12 − 8</b> avec les touches de chiffres.',
    },
    {
      texte: 'Bravo! Passons aux dizaines. Attention : le 5 est barré, il reste seulement <b>4</b> dizaines. Calcule <b>4 − 2</b>.',
      attente: { type: 'reponse', col: 0 },
      consigne: 'Calcule <b>4 − 2</b> avec les touches de chiffres.',
    },
    {
      texte: 'Super! <b>52 − 28 = 24</b>. Pour vérifier, on peut faire l’addition : 24 + 28 = 52 ✔',
      attente: { type: 'suivant' },
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
    retour: $('#btn-retour'), badge: $('#badge-joueur'),
    titre: $('#titre-phase'), progression: $('#progression'),
    probleme: $('#probleme'), blocs: $('#blocs'), bulle: $('#bulle'), choix: $('#choix'),
    clavier: $('#clavier'), actions: $('.actions'), chrono: $('#chrono'), compteur: $('#compteur-erreurs'), son: $('#btn-son'), verifier: $('#btn-verifier'), suivant: $('#btn-suivant'), aide: $('#btn-aide'),
  };

  el.badge.innerHTML = `<span class="avatar petit" style="--couleur:${joueur.couleur}" aria-hidden="true">${joueur.emoji}</span>${Jeu.echapper(joueur.nom)}`;

  let S = null; // la partie en cours

  function rendreSon() {
    el.son.textContent = Jeu.sonActif() ? '🔊' : '🔇';
    el.son.setAttribute('aria-pressed', String(Jeu.sonActif()));
    el.son.title = Jeu.sonActif() ? 'Couper le son' : 'Remettre le son';
  }
  el.son.addEventListener('click', () => { Jeu.basculerSon(); rendreSon(); });
  rendreSon();
  const son = (nom) => Jeu.jouer(nom);
  Jeu.brancherSonsNavigation();

  const choisir = (liste) => liste[Math.floor(Math.random() * liste.length)];
  const etape = () => ETAPES_TUTO[S.etape];
  const pasTouteDeSuite = () => `Pas tout de suite! ${etape().consigne || 'Lis la consigne, puis clique sur un bouton.'}`;
  const caseHaut = (i) => el.probleme.querySelector(`.case-haut[data-col="${i}"]`);
  const caseReponse = (i) => el.probleme.querySelector(`.case-reponse[data-col="${i}"]`);
  const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================
  //  Écrans
  // ==========================================================

  function montrer(nom) {
    for (const [k, e] of Object.entries(ecrans)) e.hidden = k !== nom;
    // Le bouton cliqué est maintenant caché : on lui retire le focus, sinon Entrée le « recliquerait ».
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    if (nom !== 'jeu') { arreterChrono(); el.compteur.hidden = true; }
    document.querySelectorAll('.confetti, .jeton-volant').forEach((c) => c.remove());
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

  function afficherMenu() {
    arreterChrono();
    S = null;
    let p = Jeu.progres(joueur.id, ACT);
    // Saphir mérité avant l'apparition des pierres (bronze, argent et or déjà sans faute) : on le donne maintenant.
    let saphirRetroactif = false;
    if (!p.pierres.saphir && sansFaute(p).every(Boolean)) {
      p = Jeu.majProgres(joueur.id, ACT, (q) => { q.pierres.saphir = true; });
      saphirRetroactif = true;
    }
    let h = `<header class="entete-activite">
        <h1>Soustraction avec emprunt</h1>
        <p>Quand le chiffre du haut est trop petit, on emprunte à la dizaine (ou à la centaine).</p>
      </header>`;
    if (!p.tutorielFait) {
      h += `<div class="carte carte-tuto">
          <div class="texte"><h2>Commence ici!</h2>
            <p>D’abord un exemple expliqué pas à pas, puis un exemple où tu essaies avec des indices. Ensuite, les défis seront débloqués.</p></div>
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
    if (saphirRetroactif) {
      h = `<div class="carte bonus annonce">${Jeu.pierreSVG('saphir', true, 64)}
        <div>Accomplissement secret débloqué : <b>le saphir!</b><br>Tu avais déjà réussi les trois médailles sans aucune erreur.</div></div>` + h;
    }
    ecrans.menu.innerHTML = h;
    montrer('menu');
    if (saphirRetroactif) { confettis(80); setTimeout(() => son('pierre'), 200); }
  }

  function sansFaute(p) {
    return ORDRE.map((niv) => !!(p.records[niv] && p.records[niv].erreurs === 0));
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

  function formaterTemps(sec) {
    const s = Math.max(0, Math.round(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // ---------- Chrono (défi vitesse) ----------

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

  // Compteur d'erreurs (défis où le nombre d'erreurs est limité)
  function majCompteurErreurs() {
    const N = S && S.niveau ? NIVEAUX[S.niveau] : null;
    if (!N || N.maxErreurs === undefined) { el.compteur.hidden = true; return; }
    el.compteur.hidden = false;
    el.compteur.textContent = `❌ ${S.erreurs} / ${N.maxErreurs}`;
    el.compteur.title = `Erreurs : ${S.erreurs} (une seule permise)`;
    el.compteur.classList.toggle('presse', S.erreurs > N.maxErreurs);
  }

  function arreterChrono() {
    if (minuterie) clearInterval(minuterie);
    minuterie = null;
    el.chrono.hidden = true;
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
        <p>Tu as réussi ${reussis} problème${reussis > 1 ? 's' : ''} sur ${NB_DEFIS}. Essaie encore, tu vas y arriver!</p>
        <div class="rangee">
          <button class="bouton gros" type="button" data-action="defi" data-niveau="${niv}">Réessayer ▸</button>
          <button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>
        </div>
      </div>`;
    montrer('fin');
  }

  function actionBouton(ev) {
    const b = ev.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    if (a !== 'aide') son(a === 'menu' ? 'retour' : 'nav');
    if (a === 'tuto' || a === 'revoir') demarrerTutoriel();
    else if (a === 'defi') demarrerDefi(b.dataset.niveau);
    else if (a === 'menu') afficherMenu();
    else if (a === 'aide') aide();
    else if (a === 'recommencer' && S) demarrerDefi(S.niveau);
    else if (a === 'continuer') dire('D’accord, on continue pour pratiquer! Corrige la case en rouge, puis vérifie.');
  }
  ecrans.menu.addEventListener('click', actionBouton);
  ecrans.fin.addEventListener('click', actionBouton);
  el.bulle.addEventListener('click', actionBouton);

  // ==========================================================
  //  Démarrer une partie
  // ==========================================================

  function nouvellePartie(extra) {
    S = Object.assign({ fini: false, sel: null, cible: null, aideVisible: false, dernierRecu: null, dernierPrete: null }, extra);
  }

  function demarrerTutoriel() {
    arreterChrono();
    nouvellePartie({ type: 'tuto', partie: 1, mode: 'tuto', etape: 0, P: M.creer(52, 28) });
    el.titre.textContent = 'Tutoriel : un exemple expliqué';
    el.progression.textContent = 'Partie 1 sur 2';
    majCibleEtSelection();
    montrer('jeu');
    rendre();
    dire(etape().texte);
  }

  function demarrerPartie2() {
    nouvellePartie({ type: 'tuto', partie: 2, mode: 'semi', P: M.creer(73, 46) });
    el.titre.textContent = 'Tutoriel : à toi, avec des indices';
    el.progression.textContent = 'Partie 2 sur 2';
    majCibleEtSelection();
    rendre();
    dire(`À ton tour! Voici <b>73 − 46</b>. Je te donne des indices, mais c’est toi qui fais tout.<br>${M.conseil(S.P).texte}`);
  }

  function demarrerDefi(niveau) {
    const N = NIVEAUX[niveau];
    nouvellePartie({ type: 'defi', niveau, papier: !!N.papier, liste: M.genererNiveau(N.generer, NB_DEFIS), index: 0, erreurs: 0 });
    chargerDefi();
    if (N.chrono) demarrerChrono(N.chrono);
  }

  function chargerDefi() {
    const [a, b] = S.liste[S.index];
    Object.assign(S, {
      P: M.creer(a, b),
      mode: S.index === 0 && NIVEAUX[S.niveau].coupDePouce ? 'semi' : 'defi',
      fini: false, sel: null, cible: null, aideVisible: false, dernierRecu: null, dernierPrete: null, derniereFausse: null,
    });
    majCompteurErreurs();
    const N = NIVEAUX[S.niveau];
    el.titre.innerHTML = N.titre + (S.mode === 'semi' ? '<span class="etiquette-aide">avec coup de pouce</span>' : '');
    el.progression.innerHTML = S.liste.map((_, k) =>
      `<span class="point${k < S.index ? ' fait' : k === S.index ? ' actuel' : ''}"></span>`).join('')
      + `<span class="sr">&nbsp;${S.index + 1}/${S.liste.length}</span>`;
    majCibleEtSelection();
    montrer('jeu');
    rendre();
    if (S.mode === 'semi') dire(`${N.intro}<br>${M.conseil(S.P).texte}`);
    else if (S.index === 0 && N.intro) dire(N.intro);
    else if (S.index === 0) dire('Problème 1 : à toi de jouer! Clique sur un chiffre du haut pour emprunter, écris ta réponse en bas, puis clique sur <b>Vérifier</b>.');
    else dire(`Problème ${S.index + 1} : à toi de jouer!`);
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
    void e.offsetWidth; // relance l'animation
    e.classList.add('secoue');
  }

  function refuser(e, msg) {
    son('oups');
    dire(msg, 'oups');
    secouer(e);
  }

  function majCibleEtSelection() {
    const P = S.P;
    if (S.fini) { S.cible = null; S.sel = null; return; }
    if (S.mode === 'tuto') {
      const a = etape().attente;
      S.cible = a.type === 'preter' || a.type === 'recevoir' ? a : null;
      S.sel = a.type === 'reponse' ? a.col : null;
      return;
    }
    const c = M.conseil(P);
    const montrerCible = S.mode === 'semi' || S.aideVisible;
    S.cible = montrerCible && (c.type === 'preter' || c.type === 'recevoir') ? c : null;
    if (S.mode === 'semi') {
      S.sel = c.type === 'reponse' ? c.col : S.sel;
    } else if (S.sel === null || P.statut[S.sel] === 'ok') {
      S.sel = c.type === 'reponse' ? c.col : premiereCaseVide(P);
    }
  }

  function premiereCaseVide(P) {
    for (let j = P.n - 1; j >= 0; j--) if (P.reponse[j] === null && !P.optionnel[j]) return j;
    return null;
  }

  function htmlHaut(P, i) {
    const pop = S.dernierRecu === i ? ' pop' : '';
    const un = `<span class="un${pop}">1</span>`;
    const barre = P.prete[i] > 0;
    const dessus = barre ? (P.recuApres[i] ? un : '') + M.valDessus(P, i) : '';
    const chiffre = (P.recuAvant[i] ? un : '') + P.haut[i];
    const jeton = P.enMain === i ? `<span class="jeton" title="${M.unNom(P, i)} empruntée">1</span>` : '';
    const anim = S.dernierPrete === i ? ' anim' : '';
    return `<span class="dessus">${dessus}</span><span class="chiffre${barre ? ' barre' : ''}${anim}">${chiffre}</span>${jeton}`;
  }

  function rendreProbleme(P) {
    const cols = [...Array(P.n).keys()];
    let h = `<div class="grille${S.papier ? ' papier' : ''}" style="--n:${P.n}">`;
    h += '<span></span>' + cols.map((i) => `<span class="etiquette">${M.lettre(P, i)}</span>`).join('');
    h += '<span></span>' + cols.map((i) => {
      const cls = ['case-haut'];
      if (S.cible && S.cible.col === i) cls.push('cible');
      if (P.enMain === i) cls.push('tient');
      return `<button type="button" class="${cls.join(' ')}" data-col="${i}"
                aria-label="${M.val(P, i)}, colonne des ${M.nom(P, i)}">${htmlHaut(P, i)}</button>`;
    }).join('');
    h += '<span class="signe">−</span>' + cols.map((i) => `<span class="case-bas">${P.bas[i] === null ? '' : P.bas[i]}</span>`).join('');
    h += '<span class="trait"></span>';
    h += '<span></span>' + cols.map((i) => {
      const cls = ['case-reponse'];
      if (S.sel === i) cls.push('choisie');
      if (P.statut[i]) cls.push(P.statut[i]);
      if (P.optionnel[i]) cls.push('optionnelle');
      return `<button type="button" class="${cls.join(' ')}" data-col="${i}"
                aria-label="Réponse, colonne des ${M.nom(P, i)}">${P.reponse[i] === null ? '' : P.reponse[i]}</button>`;
    }).join('');
    h += '</div>';
    el.probleme.innerHTML = h;
  }

  // Blocs de base dix (seulement pour les exemples du tutoriel, à 2 chiffres)
  function rendreBlocs(P) {
    const visible = S.type === 'tuto' && P.n === 2;
    el.blocs.hidden = !visible;
    if (!visible) return;
    const d = 0, u = 1;
    const restantes = P.haut[d] - P.prete[d];
    const barresEnlevees = P.statut[d] === 'ok' ? M.bas(P, d) : 0;
    let barres = '';
    for (let k = 0; k < P.haut[d]; k++) {
      if (k >= restantes) {
        if (P.enMain === d) barres += '<div class="barre-dix pretee"></div>';
        continue;
      }
      barres += `<div class="barre-dix${k >= restantes - barresEnlevees ? ' enlevee' : ''}"></div>`;
    }
    const recu = P.recuAvant[u];
    const total = P.haut[u] + (recu ? 10 : 0);
    const cubesEnleves = P.statut[u] === 'ok' ? M.bas(P, u) : 0;
    let cubes = '';
    for (let k = 0; k < total; k++) {
      const cls = ['cube'];
      if (k >= P.haut[u]) cls.push('nouveau');
      if (k >= P.haut[u] && S.dernierRecu === u) cls.push('pop');
      if (k >= total - cubesEnleves) cls.push('enlevee');
      cubes += `<div class="${cls.join(' ')}"></div>`;
    }
    el.blocs.innerHTML = `
      <div class="zone-blocs"><div class="barres">${barres}</div><span class="legende">Dizaines</span></div>
      <div class="zone-blocs"><div class="cubes">${cubes}</div><span class="legende">Unités</span></div>`;
  }

  function rendreChoix() {
    if (S.mode === 'tuto' && etape().attente.type === 'choix') {
      el.choix.innerHTML = etape().attente.options
        .map((o, k) => `<button type="button" class="bouton secondaire gros" data-option="${k}">${o.texte}</button>`).join('');
    } else {
      el.choix.innerHTML = '';
    }
  }

  function rendreControles() {
    const a = S.mode === 'tuto' ? etape().attente : null;
    el.clavier.hidden = a ? a.type !== 'reponse' : S.fini;
    el.verifier.hidden = !(S.mode === 'defi' && !S.fini);
    el.aide.hidden = !(S.mode === 'defi' && !S.fini && !S.papier);
    el.suivant.hidden = !(a ? a.type === 'suivant' : S.fini);
    el.actions.hidden = el.verifier.hidden && el.aide.hidden && el.suivant.hidden;
  }

  function rendre() {
    rendreProbleme(S.P);
    rendreBlocs(S.P);
    rendreChoix();
    rendreControles();
  }

  el.clavier.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    .map((d) => `<button type="button" class="touche" data-chiffre="${d}">${d}</button>`).join('')
    + '<button type="button" class="touche effacer" data-effacer aria-label="Effacer">⌫</button>';

  // ==========================================================
  //  Actions de l'élève
  // ==========================================================

  function clicHaut(i) {
    const P = S.P;
    if (S.fini) return;
    if (S.papier) {
      refuser(caseHaut(i), 'Défi sur papier : fais tes emprunts sur ta feuille, puis écris seulement la réponse en bas.');
      return;
    }
    const type = P.enMain !== null ? 'recevoir' : 'preter';
    if (S.mode === 'tuto') {
      const a = etape().attente;
      if (a.type !== type || a.col !== i) {
        refuser(caseHaut(i), pasTouteDeSuite());
        return;
      }
    } else if (M.peutAnnuler(P, i)) {
      // Recliquer sur un chiffre barré défait l'emprunt.
      const r = M.annuler(P, i);
      if (!r.ok) {
        refuser(caseHaut(i), r.msg);
        return;
      }
      S.dernierRecu = null;
      S.dernierPrete = null;
      S.aideVisible = false;
      majCibleEtSelection();
      rendre();
      son('annuler');
      const note = r.efface ? ` <i>${r.efface}</i>` : '';
      dire(S.mode === 'semi' ? `${r.info} ${M.conseil(P).texte}${note}` : `${r.info}${note}`);
      return;
    }
    const depart = type === 'recevoir' ? caseHaut(P.enMain).getBoundingClientRect() : null;
    const r = type === 'recevoir' ? M.recevoir(P, i) : M.preter(P, i);
    if (!r.ok) {
      refuser(caseHaut(i), r.msg);
      return;
    }
    S.dernierRecu = type === 'recevoir' ? i : null;
    S.dernierPrete = type === 'preter' ? i : null;
    son(type === 'recevoir' ? 'depot' : 'emprunt');
    S.aideVisible = false;
    if (S.mode === 'tuto') S.etape++;
    majCibleEtSelection();
    rendre();
    if (depart) voler(depart, i);

    const note = r.efface ? ` <i>${r.efface}</i>` : '';
    if (S.mode === 'tuto') dire(etape().texte);
    else if (S.mode === 'semi') dire(`${r.info} ${M.conseil(P).texte}${note}`);
    else dire(`${r.info}${type === 'preter' ? ' Où vas-tu la déposer? (Si tu changes d’idée, reclique sur le chiffre barré.)' : ''}${note}`);
  }

  function selectionner(i) {
    if (S.fini) return;
    if (S.mode === 'tuto') {
      const a = etape().attente;
      if (a.type !== 'reponse' || a.col !== i) {
        refuser(caseReponse(i), pasTouteDeSuite());
        return;
      }
    }
    S.sel = i;
    S.dernierRecu = null;
    S.dernierPrete = null;
    son('clic');
    rendre();
  }

  function entrer(d) {
    if (!S || S.fini) return;
    const P = S.P;
    if (S.mode === 'tuto') {
      const a = etape().attente;
      if (a.type !== 'reponse') {
        dire(pasTouteDeSuite(), 'oups');
        return;
      }
      S.sel = a.col;
    }
    const i = S.sel;
    if (i === null) {
      dire(S.mode === 'semi' ? M.conseil(P).texte : 'Clique d’abord sur une case réponse, en bas.', 'oups');
      return;
    }
    if (S.mode !== 'defi' && P.statut[i] === 'ok') return;
    const r = M.poser(P, i, d, S.papier);
    if (!r.ok) {
      refuser(caseReponse(i), r.msg);
      return;
    }
    S.aideVisible = false;
    S.dernierRecu = null;
    S.dernierPrete = null;

    if (S.mode === 'defi') {
      son('chiffre');
      // En défi, on vérifie seulement quand l'élève clique sur « Vérifier ».
      if (i > 0 && P.reponse[i - 1] === null) S.sel = i - 1;
      majCibleEtSelection();
      rendre();
      return;
    }

    // Tutoriel et coup de pouce : on vérifie tout de suite.
    if (d === P.attendu[i]) {
      P.statut[i] = 'ok';
      son('bon');
      if (S.mode === 'tuto') S.etape++;
      if (S.mode === 'semi' && M.resolu(P)) {
        reussite();
        return;
      }
      majCibleEtSelection();
      rendre();
      if (S.mode === 'tuto') {
        dire(etape().texte, etape().bravo ? 'bravo' : 'info');
        if (etape().bravo) confettis();
      } else {
        dire(`${choisir(PETITS_BRAVOS)} ${M.conseil(P).texte}`);
      }
    } else {
      P.statut[i] = 'faux';
      son('erreur');
      rendre();
      secouer(caseReponse(i));
      const indice = S.mode === 'tuto'
        ? `Essaie encore : combien font ${M.val(P, i)} − ${M.bas(P, i)}?`
        : M.conseil(P).texte;
      dire(`Pas tout à fait… ${indice}`, 'oups');
    }
  }

  function effacer() {
    if (!S || S.fini || S.sel === null || S.mode === 'tuto') return;
    const P = S.P;
    if (S.mode === 'semi' && P.statut[S.sel] === 'ok') return;
    P.reponse[S.sel] = null;
    P.statut[S.sel] = null;
    son('clic');
    rendre();
  }

  function choisirOption(k) {
    const a = etape().attente;
    const o = a.options[k];
    if (!o.bon) {
      son('oups');
      dire(o.msg, 'oups');
      return;
    }
    son('bon');
    S.etape++;
    majCibleEtSelection();
    rendre();
    dire(etape().texte);
  }

  function verifier() {
    if (!S || S.fini || S.mode !== 'defi') return;
    const P = S.P;
    if (P.enMain !== null) {
      dire(`Dépose d’abord ce que tu as emprunté dans la colonne des ${M.nom(P, P.enMain + 1)}.`, 'oups');
      return;
    }
    const manquantes = [];
    for (let i = 0; i < P.n; i++) if (P.reponse[i] === null && !P.optionnel[i]) manquantes.push(i);
    if (manquantes.length) {
      S.sel = Math.max(...manquantes);
      rendre();
      dire('Il manque des chiffres dans ta réponse.', 'oups');
      return;
    }
    if (M.resolu(P)) {
      P.statut = P.reponse.map((r) => (r === null ? null : 'ok'));
      reussite();
      return;
    }
    // Vérifier deux fois la même réponse ne compte qu'une seule erreur.
    const signature = P.reponse.join(',');
    if (S.derniereFausse === signature) {
      son('oups');
      dire('Ta réponse n’a pas changé : corrige d’abord la case en rouge, puis vérifie.', 'oups');
      return;
    }
    S.derniereFausse = signature;
    S.erreurs++;
    majCompteurErreurs();
    let premiere = null;
    for (let i = P.n - 1; i >= 0; i--) {
      if (M.estCorrecte(P, i)) P.statut[i] = P.reponse[i] === null ? null : 'ok';
      else {
        P.statut[i] = 'faux';
        if (premiere === null) premiere = i;
      }
    }
    S.sel = premiere;
    son('erreur');
    rendre();
    secouer(el.probleme);
    const indice = S.papier ? '' : ' <button type="button" class="lien-tuto" data-action="aide">Un indice?</button>';
    const limite = NIVEAUX[S.niveau].maxErreurs;
    if (limite !== undefined && S.erreurs === limite + 1) {
      // Trop d'erreurs pour la pierre : on propose de recommencer tout de suite.
      dire(`Oups! C’est ta ${S.erreurs}<sup>e</sup> erreur, et une seule est permise pour gagner ${Jeu.NOM_PIERRE[NIVEAUX[S.niveau].pierre]}.
        <div class="choix-bulle">
          <button type="button" class="bouton orange" data-action="recommencer">↻ Recommencer le défi</button>
          <button type="button" class="bouton secondaire" data-action="continuer">Continuer pour pratiquer</button>
        </div>`, 'oups');
      return;
    }
    let compte = '';
    if (limite !== undefined) {
      compte = S.erreurs > limite
        ? ` (${S.erreurs} erreurs : cette fois, c’est pour pratiquer)`
        : ` (${S.erreurs} erreur sur ${limite} permise)`;
    }
    dire(`Oups! Il y a une erreur (en rouge). Corrige-la, puis vérifie encore.${compte}${indice}`, 'oups');
  }

  function aide() {
    if (!S || S.fini) return;
    const c = M.conseil(S.P);
    S.aideVisible = true;
    if (c.type === 'reponse') S.sel = c.col;
    majCibleEtSelection();
    rendre();
    dire(`${c.texte}<br><button type="button" class="lien-tuto" data-action="revoir">📖 Revoir l’exemple du tutoriel</button>`);
  }

  function reussite() {
    S.fini = true;
    // Défi vitesse : le chrono s'arrête dès que le dernier problème est réussi.
    if (S.chrono && S.index === S.liste.length - 1) {
      S.tempsFinal = S.chrono.total - resteChrono();
      arreterChrono();
    }
    S.cible = null;
    S.sel = null;
    S.dernierRecu = null;
    S.dernierPrete = null;
    rendre();
    confettis();
    son('reussite');
    const P = S.P;
    if (S.type === 'tuto') {
      dire(`Bravo! <b>${P.a} − ${P.b} = ${P.a - P.b}</b>. Tu as compris la soustraction avec emprunt!`, 'bravo');
    } else {
      const dernier = S.index === S.liste.length - 1;
      dire(`${choisir(BRAVOS)} <b>${P.a} − ${P.b} = ${P.a - P.b}</b>${dernier ? '<br>C’était le dernier problème…' : ''}`, 'bravo');
    }
    el.suivant.focus();
  }

  function suivant() {
    if (!S) return;
    if (S.mode === 'tuto') {
      if (etape().attente.type !== 'suivant') return;
      if (S.etape < ETAPES_TUTO.length - 1) {
        S.etape++;
        majCibleEtSelection();
        rendre();
        dire(etape().texte);
      } else {
        demarrerPartie2();
      }
      return;
    }
    if (!S.fini) return;
    if (S.type === 'tuto') {
      finTutoriel();
      return;
    }
    S.index++;
    if (S.index >= S.liste.length) finNiveau();
    else chargerDefi();
  }

  // ==========================================================
  //  Fins : tutoriel terminé, médaille gagnée
  // ==========================================================

  function finTutoriel() {
    Jeu.majProgres(joueur.id, ACT, (p) => { p.tutorielFait = true; });
    Jeu.demanderPersistance();
    const p = Jeu.progres(joueur.id, ACT);
    ecrans.fin.innerHTML = `<div class="carte fin">
        <div class="grande-medaille" style="font-size:90px" aria-hidden="true">📖</div>
        <h1>Tutoriel terminé!</h1>
        <p>Tu sais maintenant emprunter à la dizaine. Les défis t’attendent : gagne les médailles de bronze, d’argent et d’or!</p>
        <div class="rangee">
          <button class="bouton gros" type="button" data-action="defi" data-niveau="bronze">${p.medailles.bronze ? 'Défi bronze' : 'Commencer le défi bronze'} ▸</button>
          <button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>
        </div>
      </div>`;
    S = null;
    montrer('fin');
    confettis(60);
  }

  function finNiveau() {
    if (NIVEAUX[S.niveau].pierre) { finPierre(); return; }
    const niv = S.niveau;
    const erreurs = S.erreurs;
    const avant = Jeu.progres(joueur.id, ACT);
    const deja = avant.medailles[niv];
    let nouveauSaphir = false;
    const p = Jeu.majProgres(joueur.id, ACT, (q) => {
      q.medailles[niv] = true;
      const r = q.records[niv];
      if (!r || erreurs < r.erreurs) q.records[niv] = { erreurs, date: new Date().toISOString().slice(0, 10) };
      // Saphir : les trois médailles réussies sans aucune erreur
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
    return p;
  }

  // Fin d'un défi secret : on gagne (ou pas) une pierre précieuse.
  function finPierre() {
    const niv = S.niveau;
    const N = NIVEAUX[niv];
    const pierre = N.pierre;
    const erreurs = S.erreurs;
    const temps = N.chrono ? (S.tempsFinal !== undefined ? S.tempsFinal : N.chrono - resteChrono()) : null;
    arreterChrono();

    // Défi sur papier : trop d'erreurs, pas d'émeraude cette fois
    if (N.maxErreurs !== undefined && erreurs > N.maxErreurs) {
      S = null;
      son('oups');
      ecrans.fin.innerHTML = `<div class="carte fin">
          <div class="grande-medaille">${Jeu.pierreSVG(pierre, false, 110)}</div>
          <h1>Presque!</h1>
          <p>Tu as fini les ${NB_DEFIS} problèmes avec ${erreurs} erreurs. Pour ${Jeu.NOM_PIERRE[pierre]}, une seule erreur est permise.</p>
          <p>Prends ton temps sur ta feuille, et vérifie avec une addition!</p>
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
      const meilleur = !r || (temps !== null ? temps < r.temps : erreurs < r.erreurs);
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
  //  Petites animations
  // ==========================================================

  // Le « 1 » emprunté vole vers la colonne qui le reçoit.
  function voler(depart, i) {
    if (mouvementReduit()) return;
    const cible = el.probleme.querySelector(`.case-haut[data-col="${i}"] .un.pop`);
    if (!cible) return;
    const arrivee = cible.getBoundingClientRect();
    const x0 = depart.left + depart.width / 2;
    const y0 = depart.top + depart.height * 0.3;
    const j = document.createElement('div');
    j.className = 'jeton-volant';
    j.textContent = '1';
    j.style.fontSize = getComputedStyle(cible).fontSize;
    j.style.left = `${x0}px`;
    j.style.top = `${y0}px`;
    j.style.transform = 'translate(-50%, -50%) scale(1.6)';
    document.body.appendChild(j);
    const dx = arrivee.left + arrivee.width / 2 - x0;
    const dy = arrivee.top + arrivee.height / 2 - y0;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      j.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`;
      j.style.opacity = '0';
    }));
    setTimeout(() => j.remove(), 800);
  }

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

  el.probleme.addEventListener('click', (ev) => {
    if (!S) return;
    const h = ev.target.closest('.case-haut');
    if (h) { clicHaut(Number(h.dataset.col)); return; }
    const r = ev.target.closest('.case-reponse');
    if (r) selectionner(Number(r.dataset.col));
  });

  el.clavier.addEventListener('click', (ev) => {
    const t = ev.target.closest('.touche');
    if (!t) return;
    if (t.hasAttribute('data-effacer')) effacer();
    else entrer(Number(t.dataset.chiffre));
  });

  el.choix.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-option]');
    if (b && S) choisirOption(Number(b.dataset.option));
  });

  el.verifier.addEventListener('click', verifier);
  el.suivant.addEventListener('click', suivant);
  el.aide.addEventListener('click', aide);

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
