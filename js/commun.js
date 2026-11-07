/* ==========================================================
   Jeu de maths — profils, activités et sauvegarde du progrès
   ----------------------------------------------------------
   Tout le progrès tient dans un seul objet JSON (le même que le
   fichier progres.json) :

   {
     "format": "jeu-de-maths",
     "version": 2,
     "joueurCourant": "j-abc123",
     "joueurs": {
       "j-abc123": {
         "nom": "…", "avatar": "🦊", "couleur": "#3a6fe0",
         "activites": {
           "soustraction-emprunt": { "tutorielFait": true, "medailles": { … }, "records": { … } }
         }
       }
     }
   }

   Règles pour que les vieilles sauvegardes restent lisibles :
   - chaque activité n'écrit que dans sa propre section;
   - on ne supprime jamais une section ou un champ qu'on ne connaît pas;
   - si le format doit changer, on augmente VERSION et on ajoute une
     étape dans migrer().
   ========================================================== */
'use strict';

const Jeu = (() => {
  const FORMAT = 'jeu-de-maths';
  const VERSION = 2;
  const CLE_NAVIGATEUR = 'jeuDeMaths.v1';

  const AVATARS = ['🦊', '🐢', '🦉', '🐼', '🐯', '🦁', '🐸', '🐙', '🦄', '🐲', '🐧', '🐨', '🐰', '🐶', '🐱', '🦖', '🐝', '🦋', '🐬', '🚀'];
  const COULEURS = ['#3a6fe0', '#2fa866', '#e0577f', '#ff8a3d', '#8a5cf0', '#14a3b8', '#e5484d', '#b8860b'];
  const NOM_MAX = 20;

  // Pour ajouter une activité : une nouvelle entrée ici + sa page dans /activites.
  const ACTIVITES = [
    {
      id: 'soustraction-emprunt',
      titre: 'Soustraction avec emprunt',
      description: 'Quand le chiffre du haut est trop petit, on emprunte à la dizaine.',
      page: 'activites/soustraction-emprunt.html',
      vignette: '52 − 28 = <span class="rouge">?</span>',
    },
  ];

  const NIVEAUX = ['bronze', 'argent', 'or'];
  const NOM_MEDAILLE = { bronze: 'de bronze', argent: "d'argent", or: "d'or" };
  // Accomplissements secrets, révélés après la médaille d'or
  const PIERRES = ['rubis', 'emeraude', 'saphir', 'diamant'];
  const NOM_PIERRE = { rubis: 'le rubis', emeraude: "l'émeraude", saphir: 'le saphir', diamant: 'le diamant' };
  const TITRE_PIERRE = { rubis: 'Rubis', emeraude: 'Émeraude', saphir: 'Saphir', diamant: 'Diamant' };

  // ==========================================================
  //  Stockage
  //  - Application Windows : Documents\Jeu de maths\progres.json
  //  - Fureteur (pour tester) : la mémoire du fureteur (localStorage)
  //  Le contenu est le même JSON dans les deux cas.
  // ==========================================================

  const tauri = typeof window !== 'undefined' ? window.__TAURI__ : undefined;
  const estApplication = !!(tauri && tauri.core);
  let avertissement = null; // message à montrer si la sauvegarde était abîmée

  const stockageNavigateur = {
    async lire() {
      const brut = localStorage.getItem(CLE_NAVIGATEUR);
      return brut ? JSON.parse(brut) : null;
    },
    async ecrire(texte) {
      localStorage.setItem(CLE_NAVIGATEUR, texte);
    },
  };

  const stockageFichier = {
    async lire() {
      const texte = await tauri.core.invoke('lire_progres');
      if (!texte) return null;
      try {
        return JSON.parse(texte);
      } catch (err) {
        // On ne l'écrase jamais : il est renommé et gardé à côté.
        const nom = await tauri.core.invoke('mettre_de_cote');
        avertissement = `Le fichier de sauvegarde était abîmé. Il a été gardé sous le nom « ${nom} » et le jeu repart à neuf.`;
        return null;
      }
    },
    async ecrire(texte) {
      await tauri.core.invoke('ecrire_progres', { contenu: texte });
    },
  };

  let stockage = estApplication ? stockageFichier : stockageNavigateur;
  let etat = null; // copie en mémoire, chargée par demarrer()

  const estObjet = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

  function etatVide() {
    return { format: FORMAT, version: VERSION, joueurCourant: null, joueurs: {} };
  }

  // Met une sauvegarde (peut-être ancienne) au format actuel, sans rien perdre.
  function migrer(e) {
    if (!estObjet(e)) return etatVide();
    if (!estObjet(e.joueurs)) e.joueurs = {};
    const v = Number(e.version) || 1;
    if (v < 2) {
      // v1 : les joueurs n'avaient ni nom ni avatar enregistrés.
      let k = 0;
      for (const [id, j] of Object.entries(e.joueurs)) {
        if (!estObjet(j)) { e.joueurs[id] = {}; }
        const jj = e.joueurs[id];
        if (!jj.nom) jj.nom = id.charAt(0).toUpperCase() + id.slice(1);
        if (!jj.avatar) jj.avatar = AVATARS[k % AVATARS.length];
        if (!jj.couleur) jj.couleur = COULEURS[k % COULEURS.length];
        k++;
      }
    }
    // (les prochaines migrations iront ici : if (v < 3) { … })
    e.format = FORMAT;
    if (v < VERSION) e.version = VERSION;
    if (e.joueurCourant && !e.joueurs[e.joueurCourant]) e.joueurCourant = null;
    return e;
  }

  let enregistrementEnCours = Promise.resolve();
  function enregistrer() {
    etat.majLe = new Date().toISOString();
    const texte = JSON.stringify(etat, null, 2);
    enregistrementEnCours = enregistrementEnCours
      .then(() => stockage.ecrire(texte))
      .catch((err) => console.warn('Sauvegarde impossible', err));
    return enregistrementEnCours;
  }

  // À appeler une fois au chargement de chaque page, avant le reste.
  let promesseDemarrage = null;
  function demarrer() {
    if (!promesseDemarrage) {
      promesseDemarrage = (async () => {
        try {
          etat = migrer(await stockage.lire());
        } catch (err) {
          console.warn('Lecture de la sauvegarde impossible', err);
          etat = etatVide();
        }
      })();
    }
    return promesseDemarrage;
  }

  function demanderPersistance() {
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    } catch (err) { /* sans importance */ }
  }

  // ==========================================================
  //  Profils
  // ==========================================================

  function vue(id) {
    const j = etat.joueurs[id];
    if (!estObjet(j)) return null;
    return {
      id,
      nom: String(j.nom || 'Joueur'),
      emoji: j.avatar || AVATARS[0],
      couleur: j.couleur || COULEURS[0],
    };
  }

  function joueurs() {
    return Object.keys(etat.joueurs)
      .map(vue)
      .filter(Boolean)
      .sort((a, b) => (etat.joueurs[a.id].creeLe || '').localeCompare(etat.joueurs[b.id].creeLe || ''));
  }

  const joueur = (id) => (id ? vue(id) : null);
  const joueurCourant = () => joueur(etat.joueurCourant);

  function choisirJoueur(id) {
    if (!etat.joueurs[id]) return;
    etat.joueurCourant = id;
    enregistrer();
  }

  function nettoyerNom(nom) {
    return String(nom || '').replace(/\s+/g, ' ').trim().slice(0, NOM_MAX);
  }

  // Renvoie un message d'erreur, ou null si le nom est correct.
  function verifierNom(nom, idIgnore = null) {
    const n = nettoyerNom(nom);
    if (!n) return 'Écris un nom ou un surnom.';
    const pareil = Object.entries(etat.joueurs).some(([id, j]) =>
      id !== idIgnore && estObjet(j) && String(j.nom || '').toLocaleLowerCase('fr') === n.toLocaleLowerCase('fr'));
    return pareil ? 'Ce nom est déjà pris.' : null;
  }

  function creerJoueur({ nom, avatar, couleur }) {
    const id = `j-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    etat.joueurs[id] = {
      nom: nettoyerNom(nom),
      avatar: avatar || AVATARS[0],
      couleur: couleur || COULEURS[0],
      creeLe: new Date().toISOString(),
      activites: {},
    };
    etat.joueurCourant = id;
    enregistrer();
    return id;
  }

  function modifierJoueur(id, { nom, avatar, couleur }) {
    const j = etat.joueurs[id];
    if (!estObjet(j)) return;
    if (nom !== undefined) j.nom = nettoyerNom(nom);
    if (avatar) j.avatar = avatar;
    if (couleur) j.couleur = couleur;
    enregistrer();
  }

  function supprimerJoueur(id) {
    delete etat.joueurs[id];
    if (etat.joueurCourant === id) etat.joueurCourant = null;
    enregistrer();
  }

  // ==========================================================
  //  Progrès par activité
  // ==========================================================

  // Complète les champs connus sans effacer ceux qu'on ne connaît pas.
  function normaliser(p) {
    const r = estObjet(p) ? { ...p } : {};
    r.tutorielFait = !!r.tutorielFait;
    const m = estObjet(r.medailles) ? r.medailles : {};
    r.medailles = { ...m };
    for (const niv of NIVEAUX) r.medailles[niv] = !!m[niv];
    r.records = estObjet(r.records) ? { ...r.records } : {};
    const g = estObjet(r.pierres) ? r.pierres : {};
    r.pierres = { ...g };
    for (const pierre of PIERRES) r.pierres[pierre] = !!g[pierre];
    return r;
  }

  function progres(joueurId, activiteId) {
    const j = etat.joueurs[joueurId];
    return normaliser(estObjet(j) && estObjet(j.activites) ? j.activites[activiteId] : null);
  }

  function majProgres(joueurId, activiteId, modifier) {
    const j = etat.joueurs[joueurId];
    if (!estObjet(j)) return null;
    if (!estObjet(j.activites)) j.activites = {};
    const p = normaliser(j.activites[activiteId]);
    modifier(p);
    j.activites[activiteId] = p;
    enregistrer();
    return p;
  }

  function nombreMedailles(joueurId) {
    let n = 0;
    for (const a of ACTIVITES) {
      const p = progres(joueurId, a.id);
      for (const niv of NIVEAUX) if (p.medailles[niv]) n++;
    }
    return n;
  }

  function nombrePierres(joueurId) {
    let n = 0;
    for (const a of ACTIVITES) {
      const p = progres(joueurId, a.id);
      for (const pierre of PIERRES) if (p.pierres[pierre]) n++;
    }
    return n;
  }

  // ==========================================================
  //  Sons (fabriqués par le fureteur : aucun fichier audio)
  // ==========================================================

  function sonActif() {
    return !(estObjet(etat && etat.reglages) && etat.reglages.son === false);
  }

  function basculerSon() {
    if (!estObjet(etat.reglages)) etat.reglages = {};
    etat.reglages.son = !sonActif();
    enregistrer();
    if (sonActif()) jouer('clic');
    return sonActif();
  }

  let audio = null;
  function contexteAudio() {
    if (!audio) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      audio = new C();
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }

  // Une note : fréquence (Hz), début (s), durée (s), forme d'onde, volume, glissando vers « vers » Hz
  function note(ctx, freq, debut, duree, forme = 'sine', volume = 0.18, vers = null) {
    const t0 = ctx.currentTime + debut;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = forme;
    osc.frequency.setValueAtTime(freq, t0);
    if (vers) osc.frequency.exponentialRampToValueAtTime(vers, t0 + duree);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duree + 0.02);
  }

  const SONS = {
    clic:     (c) => note(c, 900, 0, 0.05, 'sine', 0.08),
    chiffre:  (c) => note(c, 640, 0, 0.08, 'triangle', 0.16),
    emprunt:  (c) => note(c, 720, 0, 0.16, 'triangle', 0.18, 380),
    depot:    (c) => { note(c, 420, 0, 0.12, 'sine', 0.2, 900); note(c, 1250, 0.1, 0.1, 'sine', 0.1); },
    annuler:  (c) => { note(c, 600, 0, 0.09, 'triangle', 0.14); note(c, 420, 0.08, 0.12, 'triangle', 0.14); },
    oups:     (c) => note(c, 300, 0, 0.18, 'sine', 0.16, 200),
    erreur:   (c) => { note(c, 220, 0, 0.14, 'square', 0.06); note(c, 165, 0.13, 0.22, 'square', 0.06); },
    bon:      (c) => { note(c, 660, 0, 0.1, 'triangle', 0.16); note(c, 990, 0.08, 0.14, 'triangle', 0.16); },
    reussite: (c) => [523, 659, 784, 1047].forEach((f, k) => note(c, f, k * 0.09, 0.22, 'triangle', 0.18)),
    medaille: (c) => {
      [523, 659, 784, 1047, 784, 1047].forEach((f, k) => note(c, f, k * 0.12, 0.25, 'triangle', 0.18));
      note(c, 1319, 0.72, 0.6, 'triangle', 0.18);
    },
    pierre:   (c) => [1568, 2093, 1760, 2349, 2093, 2637, 3136].forEach((f, k) => note(c, f, k * 0.07, 0.35, 'sine', 0.12)),
    tic:      (c) => note(c, 1400, 0, 0.03, 'square', 0.04),
  };

  function jouer(nom) {
    if (!sonActif() || !SONS[nom]) return;
    try {
      const ctx = contexteAudio();
      if (ctx) SONS[nom](ctx);
    } catch (err) { /* pas de son, tant pis */ }
  }

  // ==========================================================
  //  Copie de sauvegarde (exporter / importer le JSON)
  // ==========================================================

  function exporter() {
    const blob = new Blob([JSON.stringify(etat, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progres-jeu-de-maths-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importer(fichier) {
    const e = JSON.parse(await fichier.text());
    if (!estObjet(e) || !estObjet(e.joueurs)) throw new Error("Ce fichier n'est pas une sauvegarde du jeu.");
    etat = migrer(e);
    await enregistrer();
  }

  // ==========================================================
  //  Application Windows : version, emplacement, mises à jour
  // ==========================================================

  async function infosApplication() {
    if (!estApplication) return null;
    try {
      return {
        version: await tauri.app.getVersion(),
        chemin: await tauri.core.invoke('chemin_progres'),
      };
    } catch (err) {
      return null;
    }
  }

  // Renvoie la mise à jour disponible, ou null (pas d'Internet, déjà à jour…).
  async function verifierMiseAJour() {
    if (!estApplication || !tauri.updater) return null;
    try {
      return await tauri.updater.check();
    } catch (err) {
      console.warn('Vérification des mises à jour impossible', err);
      return null;
    }
  }

  // Télécharge, installe, puis relance le jeu. progression(fraction entre 0 et 1, ou null)
  async function installerMiseAJour(maj, progression = () => {}) {
    await enregistrementEnCours; // la sauvegarde d'abord
    let total = 0;
    let recu = 0;
    await maj.downloadAndInstall((ev) => {
      if (ev.event === 'Started') total = ev.data.contentLength || 0;
      else if (ev.event === 'Progress') {
        recu += ev.data.chunkLength;
        progression(total ? recu / total : null);
      }
    });
    await tauri.process.relaunch();
  }

  // ==========================================================
  //  Dessin d'une médaille (SVG)
  // ==========================================================

  let compteur = 0;
  function medailleSVG(niveau, gagnee, taille = 44) {
    const id = `grad-medaille-${++compteur}`;
    const h = Math.round(taille * 1.3);
    const label = `Médaille ${NOM_MEDAILLE[niveau]}${gagnee ? '' : ' (pas encore gagnée)'}`;
    if (!gagnee) {
      return `<svg class="medaille verrouillee" width="${taille}" height="${h}" viewBox="0 0 40 52" role="img" aria-label="${label}">
        <path d="M9 0h9l4 20-9 3z" fill="#d6d1c7"/><path d="M31 0h-9l-4 20 9 3z" fill="#c9c3b8"/>
        <circle cx="20" cy="35" r="15" fill="#efebe3" stroke="#c9c3b8" stroke-width="2.5" stroke-dasharray="4 3"/>
        <text x="20" y="41" text-anchor="middle" font-size="16" font-weight="900" fill="#bdb6a9" font-family="sans-serif">?</text>
      </svg>`;
    }
    const c = {
      bronze: ['#9a5a26', '#e3a066', '#f8d2ab', '#3a6fe0', '#2853b5'],
      argent: ['#7d8996', '#d7dee6', '#ffffff', '#e5484d', '#b8343a'],
      or:     ['#b98500', '#ffd23f', '#fff4b8', '#2fa866', '#23804e'],
    }[niveau];
    return `<svg class="medaille" width="${taille}" height="${h}" viewBox="0 0 40 52" role="img" aria-label="${label}">
      <defs><radialGradient id="${id}" cx="35%" cy="30%" r="75%">
        <stop offset="0" stop-color="${c[2]}"/><stop offset="0.45" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/>
      </radialGradient></defs>
      <path d="M9 0h9l4 20-9 3z" fill="${c[3]}"/><path d="M31 0h-9l-4 20 9 3z" fill="${c[4]}"/>
      <circle cx="20" cy="35" r="15" fill="url(#${id})" stroke="${c[0]}" stroke-width="2"/>
      <path d="M20 26.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="${c[2]}" stroke="${c[0]}" stroke-width="1" opacity="0.95"/>
    </svg>`;
  }

  // Pierres précieuses (SVG) : une gemme taillée, avec ses facettes
  const COULEURS_PIERRE = {
    rubis:    ['#8f0a3a', '#d81b5c', '#ff7aa5', '#ffd0df'],
    emeraude: ['#06603a', '#12a865', '#5fe3a3', '#c9fbe3'],
    saphir:   ['#132f80', '#2457d6', '#7aa2ff', '#d6e3ff'],
    diamant:  ['#6aaed6', '#b9e3fb', '#e9f8ff', '#ffffff'],
  };
  function pierreSVG(pierre, gagnee, taille = 40) {
    const label = `${TITRE_PIERRE[pierre]}${gagnee ? '' : ' (secret)'}`;
    const c = gagnee ? COULEURS_PIERRE[pierre] : ['#b9b2a5', '#d6d0c5', '#e8e3da', '#f4f1eb'];
    const brillance = gagnee
      ? '<path d="M33 3l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="#fff" opacity=".95"/>'
      : '<text x="20" y="27" text-anchor="middle" font-size="12" font-weight="900" fill="#a39b8c" font-family="sans-serif">?</text>';
    return `<svg class="pierre${gagnee ? '' : ' verrouillee'}" width="${taille}" height="${taille}" viewBox="0 0 40 40" role="img" aria-label="${label}">
      <polygon points="6,15 13,6 16,15" fill="${c[2]}"/>
      <polygon points="13,6 27,6 24,15 16,15" fill="${c[3]}"/>
      <polygon points="27,6 34,15 24,15" fill="${c[1]}"/>
      <polygon points="6,15 16,15 20,36" fill="${c[1]}"/>
      <polygon points="16,15 24,15 20,36" fill="${c[2]}"/>
      <polygon points="24,15 34,15 20,36" fill="${c[0]}"/>
      <polygon points="6,15 13,6 27,6 34,15 20,36" fill="none" stroke="${c[0]}" stroke-width="1.4" stroke-linejoin="round"/>
      ${brillance}
    </svg>`;
  }

  // Pour afficher un nom tapé par l'utilisateur dans du HTML sans risque.
  function echapper(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return {
    AVATARS, COULEURS, NOM_MAX, ACTIVITES, NIVEAUX, NOM_MEDAILLE, PIERRES, NOM_PIERRE, TITRE_PIERRE,
    demarrer, demanderPersistance,
    joueurs, joueur, joueurCourant, choisirJoueur,
    verifierNom, creerJoueur, modifierJoueur, supprimerJoueur,
    progres, majProgres, nombreMedailles, nombrePierres,
    jouer, sonActif, basculerSon,
    exporter, importer,
    estApplication, infosApplication, verifierMiseAJour, installerMiseAJour,
    avertissement: () => avertissement,
    medailleSVG, pierreSVG, echapper,
    // pour l'application Windows et les tests
    _migrer: migrer,
    _utiliserStockage(s) { stockage = s; },
  };
})();

if (typeof module !== 'undefined') module.exports = Jeu;
