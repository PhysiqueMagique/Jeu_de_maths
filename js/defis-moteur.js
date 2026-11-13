/* ==========================================================
   Moteur commun des activités « à défis » (0.14.0)
   ----------------------------------------------------------
   Il s'occupe de tout ce qui est pareil d'une activité à l'autre :
   menu (tutoriel facultatif, défis bronze → argent → or, pierres secrètes),
   bulle de consignes, clavier, bouton Suivant / Vérifier / Indice,
   chrono du rubis, compteur d'erreurs de l'émeraude, saphir, écrans de fin, confettis.

   L'activité ne fournit que son problème : ActiviteDefis(config), où config contient
     id, titre, sousTitre, tutoTexte, finTutoTexte, mot ('Division' → « Division 2 : … »)
     niveaux : { bronze, argent, or, rubis, emeraude, saphir, diamant } (titre, desc, requis, pierre,
               chrono, papier, maxErreurs, intro, nb… : l'activité y met ce dont son générateur a besoin)
     tuto : [{ titre, probleme, mode: 'tuto' | 'semi', intro: [messages] }]
     generer(N, niveau) → liste de problèmes
     charger(S, probleme)       prépare S (S.P, saisie…) pour ce problème
     rendre(S) → html           le calcul (dans #calcul)
     consigne(S) → html         le message de l'étape en cours
     entrer(S, touche)          une touche du clavier ('0'…'9', ou une touche de config.clavier / config.touches);
                                renvoie 'verifier' pour vérifier tout de suite
     effacer(S), clic(S, ev) → true si l'activité a réagi, fleche(S, touche) → true
     verifier(S) → { vide: msg } | { etape: msg } | { ok: true } | { faux: true, cle, indice }
     aide(S) → html (bouton Indice), reussite(S) → html (« 742 ÷ 6 = 123 reste 4 »)
     verifierVisible(S) → false pour cacher le bouton Vérifier (étape vérifiée autrement)
     indiceDirect : true = en défi, l'indice s'affiche tout de suite après une erreur
   S (l'état) : type 'tuto' | 'defi', mode 'tuto' | 'semi' | 'defi', niveau, papier, liste, index, erreurs, fini…
   ========================================================== */
'use strict';

function ActiviteDefis(cfg) {
  return Jeu.demarrer().then(() => {
    const ACT = cfg.id;
    const NIVEAUX = cfg.niveaux;
    const ORDRE = ['bronze', 'argent', 'or'];
    const ORDRE_PIERRES = ['rubis', 'emeraude', 'saphir', 'diamant'];
    const BRAVOS = ['Bravo!', 'Super!', 'Wow!', 'Excellent!', 'Tu l’as!', 'Parfait!', 'Génial!'];
    const MOT = cfg.mot || 'Problème';
    const TUTO = cfg.tuto;

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
      h += `<header class="entete-activite"><h1>${cfg.titre}</h1><p>${cfg.sousTitre}</p></header>`;
      if (!p.tutorielFait) {
        h += `<div class="carte carte-tuto">
            <div class="texte"><h2>Commence ici!</h2><p>${cfg.tutoTexte} Tu peux aussi le sauter et aller directement aux défis.</p></div>
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
        Jeu.majProgres(joueur.id, ACT, (q) => { q.tutorielFait = true; });
        afficherMenu();
      } else if (a === 'defi') demarrerDefi(b.dataset.niveau);
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

    function charger(probleme) {
      S.fini = false;
      S.derniereFausse = null;
      S.statut = null;
      cfg.charger(S, probleme);
    }

    function demarrerTutoriel() {
      arreterChrono();
      S = { type: 'tuto', erreurs: 0 };
      demarrerPartie(0);
      montrer('jeu');
    }

    function demarrerPartie(k) {
      const T = TUTO[k];
      S.partie = k;
      S.mode = T.mode;
      S.papier = false;
      S.niveau = null;
      charger(T.probleme);
      S.intro = [...T.intro];
      el.titre.textContent = T.titre;
      el.progression.textContent = `Partie ${k + 1} sur ${TUTO.length}`;
      rendre();
      dire(S.intro[0]);
    }

    function demarrerDefi(niveau) {
      const N = NIVEAUX[niveau];
      arreterChrono();
      S = { type: 'defi', mode: 'defi', niveau, papier: !!N.papier, liste: cfg.generer(N, niveau), index: 0, erreurs: 0, intro: [] };
      chargerDefi();
      if (N.chrono) demarrerChrono(N.chrono);
    }

    function chargerDefi() {
      const N = NIVEAUX[S.niveau];
      charger(S.liste[S.index]);
      el.titre.textContent = N.titre;
      el.progression.innerHTML = S.liste.map((_, k) =>
        `<span class="point${k < S.index ? ' fait' : k === S.index ? ' actuel' : ''}"></span>`).join('')
        + `<span>&nbsp;${S.index + 1}/${S.liste.length}</span>`;
      majCompteurErreurs();
      montrer('jeu');
      rendre();
      if (S.index === 0 && N.intro) dire(N.intro);
      else dire(`${MOT} ${S.index + 1} : ${cfg.consigne(S)}`);
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

    const enIntro = () => !!(S && S.intro && S.intro.length > 0);
    const actif = () => !!S && !S.fini && !enIntro();

    function rendre() {
      if (!S) return;
      el.calcul.innerHTML = cfg.rendre(S);
      rendreControles();
    }

    function rendreControles() {
      const saisie = actif();
      el.clavier.hidden = !saisie || cfg.clavierVisible === false || (cfg.clavierVisible && !cfg.clavierVisible(S));
      el.verifier.hidden = !saisie || (cfg.verifierVisible ? !cfg.verifierVisible(S) : false);
      const N = S.niveau ? NIVEAUX[S.niveau] : null;
      el.aide.hidden = !(S.mode === 'defi' && saisie && !(N && N.papier) && cfg.aide);
      el.suivant.hidden = !(enIntro() || S.fini);
      el.actions.hidden = el.verifier.hidden && el.aide.hidden && el.suivant.hidden;
    }

    const TOUCHES = cfg.clavier || ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    el.clavier.innerHTML = TOUCHES
      .map((d) => `<button type="button" class="touche" data-touche="${d}">${d}</button>`).join('')
      + '<button type="button" class="touche effacer" data-effacer aria-label="Effacer">⌫</button>';

    // Les fonctions que l'activité peut appeler
    const H = {
      dire, rendre, son, secouer, choisir, BRAVOS,
      reussite: () => reussite(),
      mauvais: (msg) => mauvais(msg),
      calcul: el.calcul,
      joueur,
    };
    cfg.H = H;

    // ==========================================================
    //  Actions de l'élève
    // ==========================================================

    function entrer(t) {
      if (!actif()) return;
      const r = cfg.entrer(S, t);
      if (r === false) return;
      son('chiffre');
      rendre();
      if (r === 'verifier') verifier();
    }

    function effacer() {
      if (!actif()) return;
      if (cfg.effacer(S) === false) return;
      S.statut = null;
      son('clic');
      rendre();
    }

    function verifier() {
      if (!actif()) return;
      const r = cfg.verifier(S);
      if (!r) return;
      if (r.vide) {
        son('oups');
        dire(r.vide, 'oups');
        return;
      }
      if (r.etape) {
        S.derniereFausse = null;
        S.statut = null;
        son('bon');
        rendre();
        dire(r.etape, r.ton || 'info');
        return;
      }
      if (r.ok) {
        S.derniereFausse = null;
        S.statut = null;
        reussite();
        return;
      }
      // Mauvaise réponse
      S.statut = 'faux';
      rendre();
      secouer(el.calcul);
      if (S.mode !== 'defi') {
        // tutoriel : on explique, sans compter d'erreur
        son('erreur');
        dire(`Pas tout à fait… ${r.indice || ''}`, 'oups');
        return;
      }
      // Vérifier deux fois la même réponse ne compte qu'une seule erreur.
      if (S.derniereFausse === r.cle) {
        son('oups');
        dire('Ta réponse n’a pas changé : corrige-la et essaie autre chose.', 'oups');
        return;
      }
      S.derniereFausse = r.cle;
      S.indice = r.indice;
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
      if (cfg.indiceDirect && r.indice && !N.papier) dire(`Pas tout à fait!${compte} ${r.indice}`, 'oups');
      else {
        const lien = N.papier || !cfg.aide ? '' : ' <button type="button" class="lien-tuto" data-action="aide">Un indice?</button>';
        dire(`Pas tout à fait! Essaie encore.${compte}${lien}`, 'oups');
      }
    }

    // L'activité signale une erreur dans une étape guidée (sans passer par Vérifier)
    function mauvais(msg) {
      son('erreur');
      secouer(el.calcul);
      dire(`Pas tout à fait… ${msg}`, 'oups');
    }

    function aide() {
      if (!S || S.fini || S.mode !== 'defi' || !cfg.aide) return;
      dire(`${cfg.aide(S)}<br><button type="button" class="lien-tuto" data-action="revoir">📖 Revoir le tutoriel</button>`);
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
      const texte = cfg.reussite(S);
      if (S.type === 'tuto') {
        const suite = S.partie < TUTO.length - 1 ? 'Clique sur Suivant pour l’exemple suivant.' : 'Tu connais la méthode!';
        dire(`Bravo! ${texte} ${suite}`, 'bravo');
      } else {
        dire(`${choisir(BRAVOS)} ${texte}${dernier ? '<br>C’était le dernier…' : ''}`, 'bravo');
      }
    }

    function suivant() {
      if (!S) return;
      if (enIntro()) {
        S.intro.shift();
        dire(enIntro() ? S.intro[0] : cfg.consigne(S));
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
      const total = S.liste.length;
      arreterChrono();
      S = null;
      son('oups');
      ecrans.fin.innerHTML = `<div class="carte fin">
          <div class="grande-medaille" style="font-size:90px" aria-hidden="true">⏱</div>
          <h1>Temps écoulé!</h1>
          <p>Tu en as réussi ${reussis} sur ${total}. Essaie encore, tu vas y arriver!</p>
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
          <p>${cfg.finTutoTexte}</p>
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
            <p>Prends ton temps, une étape à la fois!</p>
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
        c.style.left = `${Math.random() * 100}%`;
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
      else entrer(t.dataset.touche);
    });
    el.calcul.addEventListener('click', (ev) => {
      if (!actif() || !cfg.clic) return;
      const r = cfg.clic(S, ev);
      if (r) {
        if (r !== 'muet') son('clic');
        rendre();
        if (r === 'verifier') verifier();
      }
    });
    el.verifier.addEventListener('click', verifier);
    el.suivant.addEventListener('click', () => { son('nav'); suivant(); });
    el.aide.addEventListener('click', () => { son('clic'); aide(); });

    const TOUCHES_PHYSIQUES = cfg.touches || {};
    document.addEventListener('keydown', (ev) => {
      if (!S || ecrans.jeu.hidden || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (/^[0-9]$/.test(ev.key)) {
        ev.preventDefault();
        entrer(ev.key);
      } else if (TOUCHES_PHYSIQUES[ev.key]) {
        ev.preventDefault();
        entrer(TOUCHES_PHYSIQUES[ev.key]);
      } else if (ev.key === 'Backspace' || ev.key === 'Delete') {
        ev.preventDefault();
        effacer();
      } else if (ev.key.startsWith('Arrow') || ev.key === 'Tab') {
        if (actif() && cfg.fleche && cfg.fleche(S, ev.key)) {
          ev.preventDefault();
          son('clic');
          rendre();
        }
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
}
