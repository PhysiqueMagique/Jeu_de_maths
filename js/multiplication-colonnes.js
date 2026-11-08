/* ==========================================================
   Multiplication en colonnes — affichage et déroulement
   Une ligne par produit de deux chiffres (avec ses zéros), puis la somme.
   Façons de jouer (S.mode) :
     'tuto' : chaque ligne est expliquée, avec la réponse
     'semi' : l'indice dit quoi multiplier et demande les zéros
     'defi' : l'élève fait tout (aide sur demande)
   ========================================================== */
'use strict';

Jeu.demarrer().then(() => {
  const C = Colonnes;
  const ACT = 'multiplication-colonnes';

  // ---------- Réglages (faciles à changer) ----------
  const CHRONO_RUBIS = 240; // secondes pour les 3 multiplications du défi vitesse
  const MAX_ERREURS_EMERAUDE = 1;

  // formes : [chiffres du nombre du haut, chiffres du nombre du bas] pour chaque problème
  const NIVEAUX = {
    bronze: { titre: 'Défi bronze', desc: '2 chiffres × 1 chiffre (ex. 47 × 6)', requis: null, formes: [[2, 1], [2, 1], [2, 1], [2, 1], [2, 1]] },
    argent: { titre: 'Défi argent', desc: '2 chiffres × 2 chiffres, et 3 chiffres × 1 chiffre', requis: 'bronze', formes: [[2, 2], [3, 1], [2, 2], [3, 1]] },
    or: { titre: 'Défi or', desc: '3 chiffres × 2 chiffres (ex. 137 × 26)', requis: 'argent', formes: [[3, 2], [3, 2], [3, 2]] },
    rubis: {
      titre: 'Défi vitesse', pierre: 'rubis', formes: [[3, 2], [3, 2], [3, 2]], chrono: CHRONO_RUBIS,
      desc: `3 multiplications de niveau or en moins de ${CHRONO_RUBIS / 60} minutes!`,
      intro: `Défi vitesse! Tu as ${CHRONO_RUBIS / 60} minutes pour 3 multiplications. Le chrono part maintenant!`,
    },
    emeraude: {
      titre: 'Défi sur papier', pierre: 'emeraude', formes: [[2, 2], [3, 1], [3, 2], [3, 2], [3, 2]], papier: true, maxErreurs: MAX_ERREURS_EMERAUDE,
      desc: 'Fais tes lignes sur une feuille : ici, tu écris seulement la réponse. Une seule erreur permise!',
      intro: 'Défi sur papier! Prends une feuille et un crayon. Fais toutes tes lignes et ta somme sur la feuille, puis écris seulement la réponse ici. <b>Attention : une seule erreur est permise</b> pour gagner l’émeraude.',
    },
    saphir: { titre: 'Sans faute', pierre: 'saphir', desc: 'Réussis les défis bronze, argent et or sans aucune erreur.' },
    diamant: {
      titre: 'Défi diamant', pierre: 'diamant', formes: [[3, 3], [3, 3], [3, 3]],
      desc: '3 chiffres × 3 chiffres : neuf lignes, jusqu’aux centaines de mille!',
      intro: 'Défi diamant! Trois chiffres en bas : les lignes du chiffre des <b>centaines</b> commencent avec <b>2 zéros</b>. Même méthode, plus de lignes!',
    },
  };
  const ORDRE = ['bronze', 'argent', 'or'];
  const ORDRE_PIERRES = ['rubis', 'emeraude', 'saphir', 'diamant'];
  const BRAVOS = ['Bravo!', 'Super!', 'Wow!', 'Excellent!', 'Tu l’as!', 'Parfait!', 'Génial!'];

  // Tutoriel en 3 parties : 43 × 2 (tout expliqué), 24 × 13 (tout expliqué), 137 × 26 (avec indices)
  const TUTO = [
    {
      titre: 'Tutoriel : chiffre par chiffre', a: 43, b: 2, mode: 'tuto',
      intro: [
        'On va calculer <b>43 × 2</b> en colonnes. Le truc : on multiplie <b>chiffre par chiffre</b>, une ligne à la fois, en commençant par les unités. À la fin, on <b>additionne</b> toutes les lignes.',
        'Pour savoir combien de <b>zéros</b> ajouter au bout d’une ligne : un chiffre dans les unités donne <b>0 zéro</b>, dans les dizaines <b>1 zéro</b>, dans les centaines <b>2 zéros</b>. On additionne les zéros des deux chiffres multipliés!',
        'Pour écrire une ligne : tape le résultat de la multiplication, puis ajoute les zéros avec le bouton <b>+0</b> à côté de la ligne (avant ou après, comme tu veux). Le bouton <b>−0</b> enlève un zéro.',
      ],
    },
    {
      titre: 'Tutoriel : deux chiffres en bas', a: 24, b: 13, mode: 'tuto',
      intro: [
        'Maintenant <b>24 × 13</b> : deux chiffres en bas! On fait d’abord toutes les multiplications avec le <b>3</b>, puis toutes celles avec le <b>1</b>. Attention : le 1 est dans les dizaines, alors ses lignes ont <b>un zéro de plus</b>!',
      ],
    },
    {
      titre: 'Tutoriel : à toi!', a: 137, b: 26, mode: 'semi',
      intro: [
        'À toi : <b>137 × 26</b>. Les chiffres en couleur te montrent quoi multiplier. Je te donne des indices, mais c’est toi qui trouves les zéros!',
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
        <h1>Multiplication en colonnes</h1>
        <p>Les grands nombres, chiffre par chiffre : une ligne par multiplication, les bons zéros, puis la somme!</p>
      </header>`;
    if (!p.tutorielFait) {
      h += `<div class="carte carte-tuto">
          <div class="texte"><h2>Commence ici!</h2>
            <p>Trois exemples pour apprendre la méthode et où placer les zéros. Ensuite, les défis seront débloqués.</p></div>
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
    if (!['aide', 'continuer'].includes(a)) son(a === 'menu' ? 'retour' : 'nav');
    if (a === 'tuto' || a === 'revoir') demarrerTutoriel();
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

  function chargerProbleme(a, b) {
    const P = C.creer(a, b);
    Object.assign(S, {
      P, etape: S.papier ? P.lignes.length : 0, // sur papier : seulement la réponse
      valeurs: [], statut: null, fini: false, derniereFausse: null, aideVisible: false, retenues: null,
    });
    viderSaisie();
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
    chargerProbleme(T.a, T.b);
    S.intro = [...T.intro]; // les messages d'introduction, un à la fois (bouton Suivant)
    el.titre.textContent = T.titre;
    el.progression.textContent = `Partie ${k + 1} sur ${TUTO.length}`;
    rendre();
    dire(S.intro[0]);
  }

  function demarrerDefi(niveau) {
    const N = NIVEAUX[niveau];
    arreterChrono();
    S = { type: 'defi', mode: 'defi', niveau, papier: !!N.papier, liste: C.generer(N.formes), index: 0, erreurs: 0, intro: [] };
    chargerDefi();
    if (N.chrono) demarrerChrono(N.chrono);
  }

  function chargerDefi() {
    const N = NIVEAUX[S.niveau];
    chargerProbleme(...S.liste[S.index]);
    el.titre.textContent = N.titre;
    el.progression.innerHTML = S.liste.map((_, k) =>
      `<span class="point${k < S.index ? ' fait' : k === S.index ? ' actuel' : ''}"></span>`).join('')
      + `<span>&nbsp;${S.index + 1}/${S.liste.length}</span>`;
    majCompteurErreurs();
    montrer('jeu');
    rendre();
    if (S.index === 0 && N.intro) dire(N.intro);
    else if (S.papier) dire(`Multiplication ${S.index + 1} : écris seulement la réponse.`);
    else dire(`Multiplication ${S.index + 1} : multiplie les deux chiffres en couleur, avec les bons zéros!`);
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
  const ligneCourante = () => (S.etape < S.P.lignes.length ? S.P.lignes[S.etape] : null);

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

  function etiquetteLigne(l, faite) {
    const op = `<b class="c-bas">${l.db}</b> × <b class="c-haut">${l.da}</b>`;
    const voirZeros = faite || S.mode === 'tuto';
    const badge = voirZeros && l.z ? `<span class="badge-zeros">+ ${l.z}<span class="mot"> zéro${l.z > 1 ? 's' : ''}</span></span>` : '';
    return op + badge;
  }

  // ---------- La saisie ----------
  // Lignes de multiplication (et réponse sur papier) : on tape le nombre de gauche à droite (les chiffres glissent
  // vers la gauche) dans S.chiffres; les zéros ajoutés au bout se comptent à part (S.zeros, boutons +0 / −0).
  // Somme : case par case, de droite à gauche, avec les retenues :
  //   S.cases[c] : le chiffre écrit dans la colonne c (0 = unités), ou null.
  //   S.zone : 'ligne' (la somme) ou 'retenue' (les petites cases au-dessus de la somme).
  //   S.curseur : la colonne où ira le prochain chiffre (après un chiffre, on passe à gauche).
  const enSomme = () => S.etape >= S.P.lignes.length && !S.papier;

  function viderSaisie() {
    S.chiffres = '';
    S.zeros = 0;
    S.cases = Array(S.P.largeur).fill(null);
    S.curseur = 0;
    S.zone = 'ligne';
    if (!S.retenues || S.etape < S.P.lignes.length) S.retenues = Array(S.P.largeur).fill(null);
  }

  // Le nombre écrit (texte), s'il y a une case vide au milieu ou à droite (trou), ou rien du tout (vide).
  function lireSaisie() {
    if (!enSomme()) {
      if (!S.chiffres) return { vide: S.zeros === 0, seulementZeros: S.zeros > 0, trou: false, texte: '' };
      return { vide: false, trou: false, texte: String(Number(S.chiffres + '0'.repeat(S.zeros))) };
    }
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

  function rangeeTapee(signe, etiquette, avecZeros) {
    const t = S.chiffres + '0'.repeat(S.zeros);
    const boutons = avecZeros
      ? `<span class="boutons-zeros">
           <button type="button" class="bouton-zero" data-zero="1" title="Ajouter un zéro (touche +)">+0</button>
           <button type="button" class="bouton-zero moins" data-zero="-1" title="Enlever un zéro (touche −)"${S.zeros ? '' : ' disabled'}>−0</button>
         </span>`
      : '';
    return rangee(signe, t, (c, ch) => {
      let cls = `saisie${S.statut === 'faux' ? ' faux' : ''}`;
      if (!ch) cls += ' vide-saisie';
      if (ch && c < S.zeros) cls += ' zero-ajoute';
      return cls;
    }, boutons + etiquette, 'active');
  }

  function rangeeSaisie(signe, etiquette) {
    const w = S.P.largeur;
    let h = `<span class="signe">${signe}</span>`;
    for (let c = w - 1; c >= 0; c--) {
      const d = S.cases[c];
      const cls = ['chiffre', 'saisie', 'case-saisie'];
      if (S.statut === 'faux') cls.push('faux');
      if (d === null) cls.push('vide-saisie');
      if (S.zone === 'ligne' && S.curseur === c) cls.push('curseur');
      h += `<button type="button" class="${cls.join(' ')}" data-c="${c}" aria-label="Case des ${C.NOMS[c]}">${d === null ? '' : d}</button>`;
    }
    return h + `<span class="etiquette-ligne active">${etiquette}</span>`;
  }

  // Les petites cases des retenues, au-dessus de la somme (pas de retenue dans les unités).
  function rangeeRetenues(modifiable) {
    const w = S.P.largeur;
    let h = '<span class="signe"></span>';
    for (let c = w - 1; c >= 0; c--) {
      const d = S.retenues[c];
      if (c === 0) h += '<span class="case-retenue-vide"></span>';
      else if (modifiable) {
        const cur = S.zone === 'retenue' && S.curseur === c ? ' curseur' : '';
        h += `<button type="button" class="retenue${cur}${d === null ? ' vide' : ''}" data-r="${c}" aria-label="Retenue dans les ${C.NOMS[c]}">${d === null ? '' : d}</button>`;
      } else h += `<span class="retenue fixe">${d === null ? '' : d}</span>`;
    }
    return h + `<span class="etiquette-ligne etiquette-retenues">${modifiable ? 'retenues' : ''}</span>`;
  }

  function rendre() {
    const { P } = S;
    const l = ligneCourante();
    const actif = !S.fini && !enIntro();
    let h = `<div class="grille-mult" style="--w:${P.largeur}">`;
    // Les deux nombres, avec les chiffres à multiplier en couleur
    h += rangee('', P.a, (c) => (actif && l && c === l.i ? 'actif-haut' : ''));
    h += rangee('×', P.b, (c) => (actif && l && c === l.j ? 'actif-bas' : ''));
    h += '<span class="trait"></span>';
    if (!S.papier) {
      P.lignes.forEach((li, k) => {
        const signe = k === P.lignes.length - 1 ? '+' : '';
        if (k < S.etape) {
          h += rangee(signe, li.valeur, (c) => `faite ok${c < li.z ? ' zero-ajoute' : ''}`, etiquetteLigne(li, true));
        } else if (k === S.etape && actif) {
          h += rangeeTapee(signe, etiquetteLigne(li, false), true);
        } else {
          // Ligne pas encore faite : des pointillés sur toute la largeur (sans dévoiler combien de chiffres elle aura)
          h += rangee(signe, '', () => 'ligne-future pointilles', '');
        }
      });
      h += '<span class="trait fin"></span>';
    }
    // La somme (ou la réponse, sur papier)
    const etiquette = S.papier ? 'Réponse' : 'Somme';
    if (S.etape >= P.lignes.length && (actif || S.fini)) {
      if (!S.papier) h += rangeeRetenues(!S.fini);
      if (S.fini) h += rangee('=', P.total, () => 'faite ok', etiquette);
      else h += S.papier ? rangeeTapee('=', etiquette, false) : rangeeSaisie('=', etiquette);
    } else {
      h += rangee('=', '', () => 'ligne-future', '');
    }
    h += '</div>';
    if (S.papier && !S.fini) h += '<p class="papier-note">✏️ Fais tes lignes et ta somme sur ta feuille.</p>';
    el.calcul.innerHTML = h;
    rendreControles();
  }

  function rendreControles() {
    const saisie = !S.fini && !enIntro();
    el.clavier.hidden = !saisie;
    el.verifier.hidden = !saisie;
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
    const l = ligneCourante();
    if (l) {
      if (S.mode === 'tuto') return C.explication(l, true);
      if (S.mode === 'semi') return C.explication(l, false);
      return `Multiplie les deux chiffres en couleur : <b>${l.db} × ${l.da}</b>, avec les bons zéros.`;
    }
    if (S.papier) return 'Écris ta réponse.';
    if (S.mode === 'tuto' && S.partie === 0) {
      return `Dernière étape : <b>additionne</b> les lignes! ${S.P.lignes.map((x) => x.valeur).join(' + ')} = <b>${S.P.total}</b>. Écris-le dans la ligne de la somme, case par case, en commençant par les unités (à droite).`;
    }
    if (S.mode === 'defi') return 'Maintenant, additionne toutes les lignes, en commençant par les unités! Tu peux écrire tes retenues dans les petites cases.';
    return 'Dernière étape : <b>additionne toutes les lignes</b>, colonne par colonne, en commençant par les unités. Si une colonne donne 10 ou plus, écris la <b>retenue</b> dans la petite case au-dessus de la colonne suivante (clique dessus, puis tape le chiffre).';
  }

  // ==========================================================
  //  Actions de l'élève
  // ==========================================================

  function entrer(d) {
    if (!S || S.fini || enIntro()) return;
    if (!enSomme()) {
      // les chiffres glissent vers la gauche, à gauche des zéros ajoutés
      if (S.chiffres.length + S.zeros >= S.P.largeur) return;
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

  function effacer() {
    if (!S || S.fini || enIntro()) return;
    if (!enSomme()) {
      if (S.chiffres) S.chiffres = S.chiffres.slice(0, -1);
      else if (S.zeros) S.zeros--;
      else return;
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

  // Boutons +0 / −0 : les zéros au bout d'une ligne de multiplication
  function changerZeros(delta) {
    if (!S || S.fini || enIntro() || !ligneCourante() || S.papier) return;
    const n = S.zeros + delta;
    if (n < 0 || n + S.chiffres.length > S.P.largeur) { son('oups'); return; }
    S.zeros = n;
    S.statut = null;
    son(delta > 0 ? 'chiffre' : 'clic');
    rendre();
  }

  // Choisir une case avec la souris (ou les flèches)
  function choisirCase(zone, c) {
    if (!S || S.fini || enIntro()) return;
    if (zone === 'retenue' && (!enSomme() || c < 1 || c >= S.P.largeur)) return;
    if (c < 0 || c >= S.P.largeur) return;
    S.zone = zone;
    S.curseur = c;
    son('clic');
    rendre();
  }

  function verifier() {
    if (!S || S.fini || enIntro()) return;
    const lu = lireSaisie();
    if (lu.vide) {
      son('oups');
      dire('Écris d’abord ta réponse avec les chiffres.', 'oups');
      return;
    }
    if (lu.seulementZeros) {
      son('oups');
      dire('Tu as mis les zéros : tape maintenant le résultat de la multiplication.', 'oups');
      return;
    }
    if (lu.trou) {
      // Pas une erreur : il manque seulement un chiffre à droite ou au milieu.
      son('oups');
      dire('Il reste une case vide à droite de ton nombre. Chaque case doit avoir un chiffre, même un <b>0</b>!', 'oups');
      return;
    }
    const saisie = lu.texte;
    const l = ligneCourante();
    const attendu = l ? l.valeur : S.P.total;
    if (Number(saisie) === attendu) {
      S.statut = null;
      S.derniereFausse = null;
      S.aideVisible = false;
      if (l) {
        S.valeurs.push(l.valeur);
        S.etape++;
        viderSaisie();
        son('bon');
        rendre();
        const fini = S.etape >= S.P.lignes.length;
        dire(`${choisir(BRAVOS)} ${fini ? 'Toutes les lignes sont faites. ' : ''}${consigne()}`, fini ? 'bravo' : 'info');
        return;
      }
      reussite();
      return;
    }

    // Mauvaise réponse
    S.statut = 'faux';
    rendre();
    secouer(el.calcul);
    const indice = l ? C.indiceLigne(l, saisie) : C.indiceSomme(S.P, saisie, S.mode !== 'defi');
    if (S.mode !== 'defi') {
      son('erreur');
      dire(`Pas tout à fait… ${indice}`, 'oups');
      return;
    }
    // Vérifier deux fois la même réponse ne compte qu'une seule erreur.
    if (S.derniereFausse === `${S.etape}:${saisie}`) {
      son('oups');
      dire('Ta réponse n’a pas changé : efface-la (⌫) et essaie autre chose.', 'oups');
      return;
    }
    S.derniereFausse = `${S.etape}:${saisie}`;
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
    const l = ligneCourante();
    let texte;
    const lu = lireSaisie();
    const fausse = S.statut === 'faux' && !lu.vide && !lu.trou;
    if (l) texte = fausse ? C.indiceLigne(l, lu.texte) : C.explication(l, false);
    else texte = fausse ? C.indiceSomme(S.P, lu.texte, false) : 'Additionne toutes les lignes, colonne par colonne, en commençant par les unités. Écris tes retenues dans les petites cases!';
    dire(`${texte}<br><button type="button" class="lien-tuto" data-action="revoir">📖 Revoir le tutoriel</button>`);
  }

  function reussite() {
    S.fini = true;
    const dernier = S.type === 'defi' && S.index === S.liste.length - 1;
    if (dernier && S.chrono) {
      S.tempsFinal = S.chrono.total - resteChrono();
      arreterChrono();
    }
    rendre();
    son('reussite');
    confettis();
    const { a, b, total } = S.P;
    if (S.type === 'tuto') {
      const suite = S.partie < TUTO.length - 1 ? 'Clique sur Suivant pour l’exemple suivant.' : 'Tu connais la méthode!';
      dire(`Bravo! <b>${a} × ${b} = ${total}</b>. ${suite}`, 'bravo');
    } else {
      dire(`${choisir(BRAVOS)} <b>${a} × ${b} = ${total}</b>${dernier ? '<br>C’était la dernière…' : ''}`, 'bravo');
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
        <p>Tu as réussi ${reussis} multiplication${reussis > 1 ? 's' : ''} sur ${NIVEAUX[niv].formes.length}. Essaie encore, tu vas y arriver!</p>
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
        <p>Tu connais la méthode : une ligne par multiplication, un zéro pour chaque dizaine, deux pour chaque centaine… puis la somme! Les défis t’attendent.</p>
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
          <p>Prends ton temps sur ta feuille, ligne par ligne!</p>
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
    const z = ev.target.closest('[data-zero]');
    if (z) { changerZeros(Number(z.dataset.zero)); return; }
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
    } else if (ev.key === '+' || ev.key === '-') {
      ev.preventDefault();
      changerZeros(ev.key === '+' ? 1 : -1);
    } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      if (enSomme()) choisirCase(S.zone, S.curseur + (ev.key === 'ArrowLeft' ? 1 : -1));
    } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (enSomme()) choisirCase(ev.key === 'ArrowUp' ? 'retenue' : 'ligne', Math.max(ev.key === 'ArrowUp' ? 1 : 0, S.curseur));
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
