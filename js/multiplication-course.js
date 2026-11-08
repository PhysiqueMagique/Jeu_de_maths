/* ==========================================================
   Course des multiplications — vitesse et mémorisation
   1. Échauffement : remplir une table trouée (les tables du niveau)
   2. Course : une barre de temps diminue; chaque bonne réponse fait
      avancer l'avatar d'un pas, chaque erreur le fait reculer d'un pas.
      On gagne si l'avatar atteint l'arrivée avant la fin du temps.
   ========================================================== */
'use strict';

Jeu.demarrer().then(() => {
  const ACT = 'multiplication-course';

  // ---------- Réglages (faciles à changer) ----------
  const DE = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
  const F10 = DE(2, 10); // pas de « × 1 » : trop facile
  const F12 = DE(2, 12);
  const PROPORTION_TROUS = 0.4; // part des cases à remplir dans l'échauffement (si pas précisé)

  const NIVEAUX = {
    // nouvelles : les lignes à remplir dans l'échauffement (les autres sont déjà écrites)
    bronze: {
      titre: 'Course bronze', desc: 'Tables de 2, 3 et 5', tables: [2, 3, 5], nouvelles: [2, 3, 5], proportionTrous: 0.4,
      facteurs: F10, pas: 14, temps: 60, requis: null,
    },
    argent: {
      titre: 'Course argent', desc: 'Tables de 2 à 7', tables: DE(2, 7), nouvelles: [4, 6, 7], proportionTrous: 1,
      facteurs: F10, pas: 17, temps: 70, requis: 'bronze',
    },
    or: {
      titre: 'Course or', desc: 'Tables de 2 à 10', tables: DE(2, 10), nouvelles: [8, 9, 10], proportionTrous: 1,
      facteurs: F10, pas: 22, temps: 80, requis: 'argent',
    },
    // Accomplissements secrets (pierres précieuses), visibles après la médaille d'or
    rubis: {
      titre: 'Course éclair', pierre: 'rubis', tables: DE(2, 10), facteurs: F10, pas: 22, temps: 50,
      desc: 'La course or… en 50 secondes seulement!',
    },
    emeraude: {
      titre: 'La grande table trouée', pierre: 'emeraude', type: 'table', tables: DE(2, 10), facteurs: F10,
      proportionTrous: 0.5, maxErreurs: 1,
      desc: 'Remplis la moitié de la grande table de 2 à 10, de mémoire. Une seule erreur permise!',
    },
    saphir: { titre: 'Courses parfaites', pierre: 'saphir', desc: 'Gagne les courses bronze, argent et or sans aucune erreur.' },
    diamant: {
      titre: 'Course des géants', pierre: 'diamant', tables: DE(2, 12), facteurs: F12, pas: 22, temps: 100,
      desc: 'Les tables jusqu’à 12 × 12 : 22 pas en 100 secondes!',
    },
  };
  const ORDRE = ['bronze', 'argent', 'or'];
  const ORDRE_PIERRES = ['rubis', 'emeraude', 'saphir', 'diamant'];
  const BRAVOS = ['Bien!', 'Oui!', 'Vite!', 'Bravo!', 'Super!', 'Go!'];

  const joueur = Jeu.joueurCourant();
  if (!joueur) {
    location.replace('../index.html');
    return;
  }

  const $ = (s) => document.querySelector(s);
  const ecrans = { menu: $('#ecran-menu'), table: $('#ecran-table'), course: $('#ecran-course'), fin: $('#ecran-fin') };
  const el = {
    retour: $('#btn-retour'), badge: $('#badge-joueur'), son: $('#btn-son'),
    titreTable: $('#titre-table'), compteurTable: $('#compteur-table'), table: $('#table'), bulleTable: $('#bulle-table'), clavierTable: $('#clavier-table'),
    titreCourse: $('#titre-course'), pasCourse: $('#pas-course'), tempsRempli: $('#temps-rempli'), tempsTexte: $('#temps-texte'),
    piste: $('#piste'), rebours: $('#compte-rebours'), equation: $('#equation-course'), bulleCourse: $('#bulle-course'), clavierCourse: $('#clavier-course'),
  };
  el.badge.innerHTML = `<span class="avatar petit" style="--couleur:${joueur.couleur}" aria-hidden="true">${joueur.emoji}</span>${Jeu.echapper(joueur.nom)}`;

  const son = (nom) => Jeu.jouer(nom);
  const choisir = (liste) => liste[Math.floor(Math.random() * liste.length)];
  const melanger = (t) => {
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  };
  const formaterTemps = (sec) => {
    const s = Math.max(0, Math.round(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let T = null; // échauffement en cours (table trouée)
  let C = null; // course en cours

  // ---------- Son ----------
  function rendreSon() {
    el.son.textContent = Jeu.sonActif() ? '🔊' : '🔇';
    el.son.setAttribute('aria-pressed', String(Jeu.sonActif()));
    el.son.title = Jeu.sonActif() ? 'Couper le son' : 'Remettre le son';
  }
  el.son.addEventListener('click', () => { Jeu.basculerSon(); rendreSon(); });
  rendreSon();
  Jeu.brancherSonsNavigation();

  // ---------- Claviers ----------
  const htmlClavier = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    .map((d) => `<button type="button" class="touche" data-chiffre="${d}">${d}</button>`).join('')
    + '<button type="button" class="touche effacer" data-effacer aria-label="Effacer">⌫</button>';
  el.clavierTable.innerHTML = htmlClavier;
  el.clavierCourse.innerHTML = htmlClavier;

  function dire(bulle, html, ton = 'info') {
    const icone = { info: '✏️', oups: '🤔', bravo: '🎉' }[ton];
    bulle.className = `carte bulle ${ton}`;
    bulle.innerHTML = `<span class="icone" aria-hidden="true">${icone}</span><div>${html}</div>`;
  }

  function secouer(e) {
    if (!e) return;
    e.classList.remove('secoue');
    void e.offsetWidth;
    e.classList.add('secoue');
  }

  // ==========================================================
  //  Écrans et menu
  // ==========================================================

  function montrer(nom) {
    for (const [k, e] of Object.entries(ecrans)) e.hidden = k !== nom;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    if (nom !== 'course') arreterCourse();
    if (nom !== 'table') T = null;
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

  const progres = () => {
    const p = Jeu.progres(joueur.id, ACT);
    if (!p.echauffements || typeof p.echauffements !== 'object') p.echauffements = {};
    return p;
  };
  const sansFaute = (p) => ORDRE.map((niv) => !!(p.records[niv] && p.records[niv].erreurs === 0));

  function afficherMenu() {
    montrer('menu');
    let p = progres();
    let saphirRetroactif = false;
    if (!p.pierres.saphir && sansFaute(p).every(Boolean)) {
      Jeu.majProgres(joueur.id, ACT, (q) => { q.pierres.saphir = true; });
      p = progres();
      saphirRetroactif = true;
    }
    let h = '';
    if (saphirRetroactif) {
      h += `<div class="carte bonus annonce">${Jeu.pierreSVG('saphir', true, 64)}
        <div>Accomplissement secret débloqué : <b>le saphir!</b><br>Tu avais déjà gagné les trois courses sans aucune erreur.</div></div>`;
    }
    h += `<header class="entete-activite">
        <h1>Course des multiplications</h1>
        <p>Vite et de mémoire! Chaque bonne réponse fait avancer ${joueur.emoji} d’un pas, chaque erreur le fait reculer.</p>
      </header>
      <h2>Les courses</h2><div class="liste-niveaux">`;
    for (const niv of ORDRE) {
      const N = NIVEAUX[niv];
      const gagnee = p.medailles[niv];
      const verrouNiveau = N.requis && !p.medailles[N.requis] ? `Gagne d’abord la médaille ${Jeu.NOM_MEDAILLE[N.requis]}` : null;
      const echauffe = !!p.echauffements[niv];
      const rec = p.records[niv];
      const record = rec ? `⏱ Meilleur temps : ${formaterTemps(rec.temps)}${rec.erreurs === 0 ? ' · ⭐ sans faute' : ''}` : '';
      let boutons;
      if (verrouNiveau) {
        boutons = `<span class="verrou">🔒 ${verrouNiveau}</span>`;
      } else {
        boutons = `<div class="boutons-niveau">
            <button class="bouton secondaire" type="button" data-action="table" data-niveau="${niv}">🔥 Échauffement</button>
            ${echauffe
              ? `<button class="bouton" type="button" data-action="course" data-niveau="${niv}">🏁 ${gagnee ? 'Recourir' : 'Course'}</button>`
              : '<span class="verrou">🔒 Fais d’abord l’échauffement</span>'}
          </div>`;
      }
      h += `<article class="carte carte-niveau${verrouNiveau ? ' bloque' : ''}">
          ${Jeu.medailleSVG(niv, gagnee, 58)}
          <div><h3>${N.titre}</h3><p>${N.desc}</p>
            <div class="details">${N.pas} pas en ${N.temps} secondes</div>
            <div class="record">${record}</div></div>
          ${boutons}
        </article>`;
    }
    h += '</div>';
    if (p.medailles.or) h += htmlSecrets(p);
    ecrans.menu.innerHTML = h;
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
        const type = N.type === 'table' ? 'table' : 'course';
        action = `<button class="bouton${gagnee ? ' secondaire' : ''}" type="button" data-action="${type}" data-niveau="${pierre}">${gagnee ? 'Rejouer' : 'Jouer ▸'}</button>`;
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
    if (a !== 'continuer') son(a === 'menu' ? 'retour' : 'nav');
    if (a === 'table') demarrerTable(b.dataset.niveau);
    else if (a === 'course') demarrerCourse(b.dataset.niveau);
    else if (a === 'menu') afficherMenu();
    else if (a === 'recommencer' && T) demarrerTable(T.niv);
    else if (a === 'voir-pierre' && T && T.resultat) afficherPierre(T.resultat);
    else if (a === 'continuer') dire(el.bulleTable, 'D’accord, on continue pour pratiquer!');
  }
  ecrans.menu.addEventListener('click', actionBouton);
  ecrans.fin.addEventListener('click', actionBouton);
  el.bulleTable.addEventListener('click', actionBouton);

  // ==========================================================
  //  Échauffement : la table trouée
  // ==========================================================

  const cle = (t, f) => `${t}x${f}`;

  function demarrerTable(niv) {
    const N = NIVEAUX[niv];
    const lignes = N.nouvelles || N.tables;
    const candidates = [];
    for (const t of lignes) for (const f of N.facteurs) candidates.push(cle(t, f));
    const nbTrous = Math.max(1, Math.round(candidates.length * (N.proportionTrous || PROPORTION_TROUS)));
    const trous = new Set(melanger([...candidates]).slice(0, nbTrous));
    const ordre = [];
    for (const t of N.tables) for (const f of N.facteurs) if (trous.has(cle(t, f))) ordre.push(cle(t, f)); // ligne par ligne
    T = { niv, N, trous, ordre, saisie: {}, statut: {}, sel: ordre[0], erreurs: 0, derniereFausse: {}, termine: false };
    montrer('table');
    el.titreTable.textContent = N.type === 'table' ? N.titre : `Échauffement — ${N.desc}`;
    rendreTable();
    const consigne = N.maxErreurs !== undefined
      ? `Remplis les cases vides de mémoire. <b>Attention : une seule erreur est permise</b> pour gagner ${Jeu.NOM_PIERRE[N.pierre]}.`
      : N.nouvelles && N.nouvelles.length < N.tables.length
        ? `Nouvelles tables : <b>${N.nouvelles.join(', ')}</b>! Remplis leurs lignes. Chaque case = le nombre de la ligne × celui de la colonne. Tape la réponse, la case suivante se choisit toute seule!`
        : 'Remplis les cases vides de la table. Chaque case = le nombre de la ligne × celui de la colonne. Tape la réponse, la case suivante se choisit toute seule!';
    dire(el.bulleTable, consigne);
  }

  function reponseDe(k) {
    const [t, f] = k.split('x').map(Number);
    return t * f;
  }

  function rendreTable() {
    const { N } = T;
    const [ligneActive, colonneActive] = T.sel ? T.sel.split('x').map(Number) : [null, null];
    let h = `<table class="table-trouee${N.facteurs.length > 10 ? ' grande' : ''}"><thead><tr><th class="coin">×</th>`;
    for (const f of N.facteurs) h += `<th class="${f === colonneActive ? 'actif' : ''}">${f}</th>`;
    h += '</tr></thead><tbody>';
    for (const t of N.tables) {
      const nouvelle = (N.nouvelles || N.tables).includes(t) ? ' nouvelle' : '';
      h += `<tr class="${t === ligneActive ? 'ligne-active' : ''}${nouvelle}"><th class="${t === ligneActive ? 'actif' : ''}">${t}</th>`;
      for (const f of N.facteurs) {
        const k = cle(t, f);
        if (!T.trous.has(k)) {
          h += `<td class="connu">${t * f}</td>`;
        } else {
          const cls = ['trou'];
          if (T.sel === k) cls.push('choisi');
          if (T.statut[k]) cls.push(T.statut[k]);
          // Dans la case choisie et encore vide, la multiplication à faire est écrite en gris pâle.
          const contenu = T.saisie[k] || (T.sel === k ? `<span class="indice-case">${t} × ${f}</span>` : '');
          h += `<td><button type="button" class="${cls.join(' ')}" data-cle="${k}" aria-label="${t} fois ${f}">${contenu}</button></td>`;
        }
      }
      h += '</tr>';
    }
    h += '</tbody></table>';
    el.table.innerHTML = h;
    const remplis = T.ordre.filter((k) => T.statut[k] === 'ok').length;
    let compteur = `✔ ${remplis} / ${T.ordre.length}`;
    if (N.maxErreurs !== undefined) compteur += ` · ❌ ${T.erreurs} / ${N.maxErreurs}`;
    el.compteurTable.textContent = compteur;
  }

  el.table.addEventListener('click', (ev) => {
    const b = ev.target.closest('.trou');
    if (!b || !T || T.termine || T.statut[b.dataset.cle] === 'ok') return;
    T.sel = b.dataset.cle;
    son('clic');
    rendreTable();
  });

  function entrerTable(d) {
    if (!T || T.termine || !T.sel) return;
    const k = T.sel;
    if (T.statut[k] === 'faux') T.saisie[k] = ''; // on recommence la case
    T.statut[k] = null;
    const rep = String(reponseDe(k));
    if ((T.saisie[k] || '').length >= rep.length) T.saisie[k] = '';
    T.saisie[k] = (T.saisie[k] || '') + d;
    son('chiffre');
    if (T.saisie[k].length === rep.length) verifierCase(k);
    else rendreTable();
  }

  function effacerTable() {
    if (!T || T.termine || !T.sel || T.statut[T.sel] === 'ok') return;
    T.saisie[T.sel] = (T.saisie[T.sel] || '').slice(0, -1);
    T.statut[T.sel] = null;
    son('clic');
    rendreTable();
  }

  function verifierCase(k) {
    const [t, f] = k.split('x').map(Number);
    if (Number(T.saisie[k]) === t * f) {
      T.statut[k] = 'ok';
      son('bon');
      const reste = T.ordre.filter((x) => T.statut[x] !== 'ok');
      if (!reste.length) { finTable(); return; }
      // Case suivante : la prochaine non remplie après celle-ci
      const i = T.ordre.indexOf(k);
      T.sel = T.ordre.slice(i + 1).find((x) => T.statut[x] !== 'ok') || reste[0];
      rendreTable();
      dire(el.bulleTable, `${choisir(BRAVOS)} ${t} × ${f} = ${t * f}`, 'bravo');
      return;
    }
    T.statut[k] = 'faux';
    rendreTable();
    secouer(el.table.querySelector(`[data-cle="${k}"]`));
    // La même mauvaise réponse dans la même case ne compte qu'une fois.
    const memeErreur = T.derniereFausse[k] === T.saisie[k];
    T.derniereFausse[k] = T.saisie[k];
    if (!memeErreur) T.erreurs++;
    son('erreur');
    rendreTable();
    const N = T.N;
    if (N.maxErreurs !== undefined && !memeErreur && T.erreurs === N.maxErreurs + 1) {
      dire(el.bulleTable, `Oups! C’est ta ${T.erreurs}<sup>e</sup> erreur, et une seule est permise pour gagner ${Jeu.NOM_PIERRE[N.pierre]}.
        <div class="choix-bulle">
          <button type="button" class="bouton orange" data-action="recommencer">↻ Recommencer</button>
          <button type="button" class="bouton secondaire" data-action="continuer">Continuer pour pratiquer</button>
        </div>`, 'oups');
      return;
    }
    dire(el.bulleTable, `Pas tout à fait : ${t} × ${f} n’égale pas ${T.saisie[k]}. Réessaie!`, 'oups');
  }

  // La table réussie reste affichée : le message et les boutons apparaissent dans la bulle.
  function finTable() {
    const { niv, N, erreurs } = T;
    T.termine = true;
    T.sel = null;
    rendreTable();
    if (N.pierre) { finPierreTable(niv, N, erreurs); return; }
    Jeu.majProgres(joueur.id, ACT, (q) => {
      if (!q.echauffements || typeof q.echauffements !== 'object') q.echauffements = {};
      q.echauffements[niv] = true;
    });
    Jeu.demanderPersistance();
    dire(el.bulleTable, `<b>Échauffement réussi!</b> ${erreurs === 0 ? 'Aucune erreur, tu es en feu! 🔥' : `Tu as corrigé ${erreurs} erreur${erreurs > 1 ? 's' : ''}.`}
      Regarde ta table, puis lance la course quand tu es prêt.
      <div class="choix-bulle">
        <button class="bouton" type="button" data-action="course" data-niveau="${niv}">🏁 Lancer la course ▸</button>
        <button class="bouton secondaire" type="button" data-action="table" data-niveau="${niv}">Refaire l’échauffement</button>
        <button class="bouton secondaire" type="button" data-action="menu">Menu</button>
      </div>`, 'bravo');
    confettis(50);
    son('reussite');
  }

  function finPierreTable(niv, N, erreurs) {
    const pierre = N.pierre;
    if (erreurs > N.maxErreurs) {
      son('oups');
      dire(el.bulleTable, `<b>Presque!</b> Tu as rempli toute la table avec ${erreurs} erreurs. Pour ${Jeu.NOM_PIERRE[pierre]}, une seule erreur est permise.
        <div class="choix-bulle">
          <button class="bouton orange" type="button" data-action="table" data-niveau="${niv}">↻ Réessayer</button>
          <button class="bouton secondaire" type="button" data-action="menu">Menu</button>
        </div>`, 'oups');
      return;
    }
    const resultat = enregistrerPierre(pierre, erreurs, null);
    T.resultat = { niv, pierre, erreurs, ...resultat };
    dire(el.bulleTable, `<b>Bravo!</b> La grande table est complète${erreurs === 0 ? ', sans aucune erreur' : ''}! Tu as trouvé ${Jeu.NOM_PIERRE[pierre]} 💎
      <div class="choix-bulle">
        <button class="bouton" type="button" data-action="voir-pierre">Voir ma pierre ▸</button>
        <button class="bouton secondaire" type="button" data-action="menu">Menu</button>
      </div>`, 'bravo');
    confettis(80);
    son('pierre');
  }

  // ==========================================================
  //  La course
  // ==========================================================

  function demarrerCourse(niv) {
    const N = NIVEAUX[niv];
    C = {
      niv, N, pos: 0, erreurs: 0, saisie: '', q: null, suivante: null, faites: [], rates: [],
      verrou: true, debut: null, fin: null, termine: false, minuteries: [], raf: null, dernierTic: null,
    };
    montrer('course');
    el.titreCourse.textContent = N.titre;
    construirePiste();
    majPiste();
    majTemps(N.temps, N.temps);
    el.equation.innerHTML = '<div class="equation"><span>?</span><span class="signe-op">×</span><span>?</span></div>';
    dire(el.bulleCourse, `Atteins le drapeau 🏁 en ${N.pas} pas avant la fin du temps! Une erreur te fait reculer d’un pas.`);
    compteARebours();
  }

  // Les minuteries de la course sont annulées si on quitte la course.
  function plusTard(fn, ms) {
    const course = C;
    const id = setTimeout(() => { if (C === course && !course.termine) fn(); }, ms);
    C.minuteries.push(id);
  }

  function arreterCourse() {
    if (!C) return;
    C.termine = true;
    C.minuteries.forEach(clearTimeout);
    if (C.raf) cancelAnimationFrame(C.raf);
  }

  function compteARebours() {
    const etapes = ['3', '2', '1', 'Partez!'];
    el.rebours.hidden = false;
    etapes.forEach((t, k) => plusTard(() => {
      el.rebours.innerHTML = `<span>${t}</span>`;
      son(k < 3 ? 'tic' : 'nav');
    }, k * 700));
    plusTard(() => {
      el.rebours.hidden = true;
      C.debut = Date.now();
      C.fin = C.debut + C.N.temps * 1000;
      C.verrou = false;
      nouvelleQuestion();
      boucle();
    }, etapes.length * 700);
  }

  function boucle() {
    if (!C || C.termine) return;
    const reste = Math.max(0, (C.fin - Date.now()) / 1000);
    majTemps(reste, C.N.temps);
    const sec = Math.ceil(reste);
    if (sec <= 5 && sec > 0 && sec !== C.dernierTic) { son('tic'); C.dernierTic = sec; }
    if (reste <= 0) { perdu(); return; }
    C.raf = requestAnimationFrame(boucle);
  }

  function majTemps(reste, total) {
    const f = Math.max(0, reste / total);
    el.tempsRempli.style.width = `${f * 100}%`;
    el.tempsRempli.classList.toggle('moyen', f <= 0.5 && f > 0.25);
    el.tempsRempli.classList.toggle('presse', f <= 0.25);
    el.tempsTexte.textContent = `⏱ ${Math.ceil(reste)} s`;
  }

  function construirePiste() {
    const marques = Array.from({ length: C.N.pas + 1 }, (_, k) => `<span class="marque" data-k="${k}"></span>`).join('');
    el.piste.innerHTML = `
      <div class="chemin">${marques}</div>
      <span class="arrivee" aria-hidden="true">🏁</span>
      <div class="coureur" style="--couleur:${joueur.couleur}" aria-label="${Jeu.echapper(joueur.nom)}">${joueur.emoji}</div>`;
  }

  function majPiste(effet) {
    const coureur = el.piste.querySelector('.coureur');
    const f = C.pos / C.N.pas;
    coureur.style.left = `calc(${f} * (100% - 64px))`;
    el.piste.querySelectorAll('.marque').forEach((m) => m.classList.toggle('passee', Number(m.dataset.k) <= C.pos && C.pos > 0));
    if (effet) {
      coureur.classList.remove('avance', 'recule');
      void coureur.offsetWidth;
      coureur.classList.add(effet);
    }
    el.pasCourse.textContent = `🏁 ${C.pos} / ${C.N.pas}`;
  }

  const cleQ = (q) => (q ? `${q.a}x${q.b}` : '');

  function choisirQuestion() {
    // D'abord les multiplications ratées, qui reviennent quelques questions plus tard
    for (const r of C.rates) r.dans--;
    const i = C.rates.findIndex((r) => r.dans <= 0 && cleQ(r.q) !== cleQ(C.q) && cleQ(r.q) !== cleQ(C.suivante));
    if (i >= 0) return C.rates.splice(i, 1)[0].q;
    let q;
    for (let essai = 0; essai < 30; essai++) {
      const t = choisir(C.N.tables);
      const f = choisir(C.N.facteurs);
      q = Math.random() < 0.5 ? { a: t, b: f } : { a: f, b: t };
      if (cleQ(q) !== cleQ(C.q) && cleQ(q) !== cleQ(C.suivante)) break;
    }
    return q;
  }

  // La question suivante est tirée d'avance : on la voit sous la question actuelle.
  function nouvelleQuestion() {
    C.q = C.suivante || choisirQuestion();
    C.suivante = choisirQuestion();
    C.saisie = '';
    C.statut = null;
    C.tape = null;
    rendreQuestion(true);
  }

  // Le ruban : les 2 derniers calculs, le calcul actuel (en gros), puis le suivant.
  function rendreQuestion(defile = false) {
    const { a, b } = C.q;
    const passes = C.faites.slice(-2).map((f) => {
      const r = f.q.a * f.q.b;
      return f.ok
        ? `<div class="item passe ok">${f.q.a} × ${f.q.b} = ${r} <span class="marque">✓</span></div>`
        : `<div class="item passe faux">${f.q.a} × ${f.q.b} = <s>${f.tape}</s> <span class="bonne">${r}</span> <span class="marque">✗</span></div>`;
    }).join('');
    let caseReponse;
    if (C.statut === 'faux') {
      // Erreur : ta réponse barrée, puis la bonne réponse
      caseReponse = `<span class="case-quotient faux"><s>${C.tape}</s></span><span class="fleche-correction">→</span><span class="case-quotient ok">${a * b}</span>`;
    } else {
      caseReponse = `<span class="case-quotient${C.saisie ? '' : ' vide'}">${C.saisie}</span>`;
    }
    const suivante = C.suivante ? `<div class="item suivant"><span class="etiquette-suivant">ensuite</span> ${C.suivante.a} × ${C.suivante.b}</div>` : '';
    el.equation.innerHTML = `<div class="ruban${defile ? ' defile' : ''}">
        ${passes}
        <div class="item actuel"><div class="equation" aria-label="${a} fois ${b}">
          <span>${a}</span><span class="signe-op">×</span><span>${b}</span><span class="signe-op">=</span>${caseReponse}
        </div></div>
        ${suivante}
      </div>`;
  }

  function entrerCourse(d) {
    if (!C || C.verrou || C.termine) return;
    const rep = String(C.q.a * C.q.b);
    if (C.saisie.length >= 3) return;
    C.saisie += String(d);
    son('chiffre');
    rendreQuestion();
    if (C.saisie.length === rep.length) verifierCourse();
  }

  function effacerCourse() {
    if (!C || C.verrou || C.termine || !C.saisie) return;
    C.saisie = C.saisie.slice(0, -1);
    son('clic');
    rendreQuestion();
  }

  function verifierCourse() {
    if (!C || C.verrou || C.termine || !C.saisie) return;
    const { a, b } = C.q;
    if (Number(C.saisie) === a * b) {
      C.pos++;
      son('bon');
      majPiste('avance');
      if (C.pos >= C.N.pas) { gagne(); return; }
      dire(el.bulleCourse, `${choisir(BRAVOS)} ${a} × ${b} = ${a * b}`, 'bravo');
      C.faites.push({ q: C.q, ok: true });
      nouvelleQuestion();
      return;
    }
    // Erreur : on recule d'un pas, on montre la bonne réponse, elle reviendra plus tard.
    C.erreurs++;
    C.pos = Math.max(0, C.pos - 1);
    son('erreur');
    majPiste('recule');
    C.rates.push({ q: C.q, dans: 3 });
    C.statut = 'faux';
    C.tape = C.saisie;
    rendreQuestion();
    dire(el.bulleCourse, `Tu as écrit <b>${C.tape}</b>, mais <span class="correction">${a} × ${b} = <span class="vert">${a * b}</span></span>. Retiens-la, elle va revenir!`, 'oups');
    C.verrou = true;
    const rate = { q: C.q, ok: false, tape: C.tape };
    plusTard(() => { C.verrou = false; C.faites.push(rate); nouvelleQuestion(); }, 1400);
  }

  function gagne() {
    const { niv, N, erreurs } = C;
    const temps = (Date.now() - C.debut) / 1000;
    arreterCourse();
    C = null;
    if (N.pierre) { gagnerPierre(niv, N.pierre, erreurs, temps); return; }
    const avant = progres();
    const deja = avant.medailles[niv];
    const ancien = avant.records[niv];
    let nouveauSaphir = false;
    Jeu.majProgres(joueur.id, ACT, (q) => {
      q.medailles[niv] = true;
      const r = q.records[niv] || {};
      q.records[niv] = {
        erreurs: r.erreurs === undefined ? erreurs : Math.min(r.erreurs, erreurs),
        temps: r.temps === undefined ? Math.round(temps) : Math.min(r.temps, Math.round(temps)),
        date: new Date().toISOString().slice(0, 10),
      };
      if (!q.pierres.saphir && sansFaute(q).every(Boolean)) {
        q.pierres.saphir = true;
        nouveauSaphir = true;
      }
    });
    Jeu.demanderPersistance();
    const record = ancien && ancien.temps !== undefined && Math.round(temps) < ancien.temps;
    const nomMed = Jeu.NOM_MEDAILLE[niv];
    const prochain = ORDRE[ORDRE.indexOf(niv) + 1];
    const premierOr = niv === 'or' && !deja;
    let bonus = '';
    if (nouveauSaphir) {
      bonus += `<div class="bonus">${Jeu.pierreSVG('saphir', true, 64)}
        <div>Accomplissement secret : <b>le saphir!</b><br>Tu as gagné les trois courses sans aucune erreur.</div></div>`;
    }
    if (premierOr) bonus += '<p class="indice-secret">🤫 Psst… des accomplissements secrets viennent d’apparaître dans le menu de l’activité!</p>';
    ecrans.fin.innerHTML = `<div class="carte fin">
        <div class="grande-medaille">${Jeu.medailleSVG(niv, true, 120)}</div>
        <h1>${deja ? 'Course gagnée encore!' : `Médaille ${nomMed}!`}</h1>
        <p>${deja ? `Tu avais déjà la médaille ${nomMed}.` : `${Jeu.echapper(joueur.nom)}, tu as gagné la médaille ${nomMed}!`}</p>
        <p>⏱ Ton temps : <b>${formaterTemps(temps)}</b>${record ? ' — nouveau record!' : ''}<br>
          ${erreurs === 0 ? '⭐ Sans aucune erreur!' : `${erreurs} erreur${erreurs > 1 ? 's' : ''} en chemin.`}</p>
        ${bonus}
        <div class="rangee">
          ${prochain ? `<button class="bouton gros" type="button" data-action="table" data-niveau="${prochain}">🔥 Échauffement ${prochain} ▸</button>` : ''}
          ${premierOr ? '<button class="bouton gros" type="button" data-action="menu">Voir les secrets 💎</button>' : ''}
          <button class="bouton secondaire" type="button" data-action="course" data-niveau="${niv}">Recourir pour battre mon temps</button>
          ${premierOr ? '' : '<button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>'}
        </div>
      </div>`;
    montrer('fin');
    confettis(90);
    son(nouveauSaphir ? 'pierre' : 'medaille');
    if (nouveauSaphir) setTimeout(() => son('medaille'), 900);
  }

  function perdu() {
    const { niv, N, pos } = C;
    arreterCourse();
    C = null;
    son('oups');
    ecrans.fin.innerHTML = `<div class="carte fin">
        <div class="grande-medaille" style="font-size:90px" aria-hidden="true">⏱</div>
        <h1>Temps écoulé!</h1>
        <p>${joueur.emoji} est arrivé à ${pos} pas sur ${N.pas}. Encore un peu de pratique et tu vas l’avoir!</p>
        <div class="rangee">
          <button class="bouton gros" type="button" data-action="course" data-niveau="${niv}">↻ Recommencer la course</button>
          ${N.pierre ? '' : `<button class="bouton secondaire" type="button" data-action="table" data-niveau="${niv}">🔥 S’échauffer d’abord</button>`}
          <button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>
        </div>
      </div>`;
    montrer('fin');
  }

  // ==========================================================
  //  Pierres précieuses
  // ==========================================================

  function enregistrerPierre(pierre, erreurs, temps) {
    const deja = progres().pierres[pierre];
    let nouveauRecord = false;
    Jeu.majProgres(joueur.id, ACT, (q) => {
      q.pierres[pierre] = true;
      const r = q.records[pierre];
      const meilleur = !r || (temps !== null ? Math.round(temps) < (r.temps || Infinity) : erreurs < r.erreurs);
      if (meilleur) {
        q.records[pierre] = { erreurs, date: new Date().toISOString().slice(0, 10) };
        if (temps !== null) q.records[pierre].temps = Math.round(temps);
        nouveauRecord = !!r;
      }
    });
    Jeu.demanderPersistance();
    return { deja, nouveauRecord };
  }

  function gagnerPierre(niv, pierre, erreurs, temps) {
    afficherPierre({ niv, pierre, erreurs, temps, ...enregistrerPierre(pierre, erreurs, temps) });
    son('pierre');
  }

  function afficherPierre({ niv, pierre, erreurs, temps = null, deja, nouveauRecord }) {
    const nom = Jeu.NOM_PIERRE[pierre];
    let details = erreurs === 0 ? '⭐ Sans aucune erreur!' : `${erreurs} erreur${erreurs > 1 ? 's' : ''} en chemin.`;
    if (temps !== null) details = `⏱ Ton temps : ${formaterTemps(temps)}${nouveauRecord ? ' — nouveau record!' : ''}<br>${details}`;
    const type = NIVEAUX[niv].type === 'table' ? 'table' : 'course';
    ecrans.fin.innerHTML = `<div class="carte fin">
        <div class="grande-medaille">${Jeu.pierreSVG(pierre, true, 130)}</div>
        <h1>${deja ? 'Défi secret réussi encore!' : `Tu as trouvé ${nom}!`}</h1>
        <p>${deja ? 'Tu l’avais déjà, mais quelle pratique!' : `${Jeu.echapper(joueur.nom)}, ${nom} brille maintenant sur la page d’accueil.`}</p>
        <p>${details}</p>
        <div class="rangee">
          <button class="bouton secondaire" type="button" data-action="${type}" data-niveau="${niv}">Rejouer ce défi</button>
          <button class="bouton secondaire" type="button" data-action="menu">Menu de l’activité</button>
          <a class="bouton secondaire" href="../index.html">Page d’accueil</a>
        </div>
      </div>`;
    montrer('fin');
    confettis(110);
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

  function clicClavier(ev, entrer, effacer) {
    const t = ev.target.closest('.touche');
    if (!t) return;
    if (t.hasAttribute('data-effacer')) effacer();
    else entrer(Number(t.dataset.chiffre));
  }
  el.clavierTable.addEventListener('click', (ev) => clicClavier(ev, entrerTable, effacerTable));
  el.clavierCourse.addEventListener('click', (ev) => clicClavier(ev, entrerCourse, effacerCourse));

  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const enTable = !ecrans.table.hidden && T;
    const enCourse = !ecrans.course.hidden && C;
    if (!enTable && !enCourse) return;
    if (/^[0-9]$/.test(ev.key)) {
      ev.preventDefault();
      if (enTable) entrerTable(Number(ev.key)); else entrerCourse(Number(ev.key));
    } else if (ev.key === 'Backspace' || ev.key === 'Delete') {
      ev.preventDefault();
      if (enTable) effacerTable(); else effacerCourse();
    } else if (ev.key === 'Enter') {
      const bouton = ev.target.closest && ev.target.closest('button, a');
      if (bouton && bouton.offsetParent !== null && (el.bulleTable.contains(bouton) || el.bulleCourse.contains(bouton))) return;
      ev.preventDefault();
      if (enCourse) verifierCourse();
      else if (T && T.sel && T.saisie[T.sel]) verifierCase(T.sel);
    }
  });

  afficherMenu();
});
