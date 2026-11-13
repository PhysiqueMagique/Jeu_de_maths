/* ==========================================================
   La garde-robe du renard : acheter des accessoires avec ses
   médailles et ses pierres, puis choisir ce que le renard porte.
   ========================================================== */
'use strict';

Jeu.demarrer().then(() => {
  const $ = (s) => document.getElementById(s);
  const joueur = Jeu.joueurCourant();
  if (!joueur) { location.href = 'index.html'; return; }
  const ech = Jeu.echapper;

  $('badge-joueur').innerHTML = `<span class="avatar petit" style="--couleur:${joueur.couleur}" aria-hidden="true">${joueur.emoji}</span>${ech(joueur.nom)}`;

  // Le personnage choisi (on le refait quand on change de personnage)
  let renard = null;
  function creerPersonnage() {
    if (renard) renard.detruire();
    const m = Jeu.mascotte(joueur.id);
    renard = Mascotte.creer($('scene'), { porte: m.porte, espece: m.espece, taille: 'grand' });
  }
  creerPersonnage();
  setTimeout(() => renard.dire(Mascotte.personnage(Jeu.mascotte(joueur.id).espece).salut), 400);

  // ---------- Monnaies ----------

  const NOMS = {
    bronze: ['médaille de bronze', 'médailles de bronze'],
    argent: ["médaille d'argent", "médailles d'argent"],
    or: ["médaille d'or", "médailles d'or"],
    rubis: ['rubis', 'rubis'],
    emeraude: ['émeraude', 'émeraudes'],
    saphir: ['saphir', 'saphirs'],
    diamant: ['diamant', 'diamants'],
  };
  const nomMonnaie = (k, n) => `${n} ${NOMS[k][n > 1 ? 1 : 0]}`;
  const icone = (k, taille = 22) => (Jeu.NIVEAUX.includes(k)
    ? Jeu.medailleSVG(k, true, Math.round(taille * 0.78))
    : Jeu.pierreSVG(k, true, taille));
  const texteprix = (prix) => {
    const parts = Object.entries(prix).map(([k, n]) => nomMonnaie(k, n));
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0];
  };
  const pastillesPrix = (prix) => Object.entries(prix)
    .map(([k, n]) => `<span class="pastille" title="${nomMonnaie(k, n)}">${icone(k)}${n > 1 ? `<b>×${n}</b>` : ''}</span>`).join('');

  function manque(prix) {
    const t = Jeu.tresor(joueur.id);
    const m = {};
    for (const [k, n] of Object.entries(prix)) if (t[k] < n) m[k] = n - t[k];
    return m;
  }

  // ---------- Affichage ----------

  function rendreTresor() {
    const t = Jeu.tresor(joueur.id);
    $('tresor').innerHTML = Jeu.MONNAIES.map((k) =>
      `<div class="piece${t[k] ? '' : ' vide'}" title="${t[k] ? nomMonnaie(k, t[k]) : `Aucune ${NOMS[k][0]}`}">${icone(k, 28)}<b>${t[k]}</b></div>`).join('');
  }

  // Les rayons sont des onglets : un par emplacement, plus les objets spéciaux (un par personnage).
  const ONGLETS = [
    ...Mascotte.EMPLACEMENTS.map((e) => ({ id: e.id, titre: e.titre, icone: { tete: '🎩', yeux: '👓', cou: '🎀', main: '✋' }[e.id] || '•' })),
    { id: 'special', titre: 'Spéciaux', icone: '⭐' },
  ];
  let onglet = 'tete';
  const especeActuelle = () => Mascotte.personnage(Jeu.mascotte(joueur.id).espece).id;
  const articlesDe = (o) => (o === 'special'
    ? Mascotte.PERSONNAGES.ORDRE.map((esp) => Mascotte.CATALOGUE.find((a) => a.espece === esp)).filter(Boolean)
    : Mascotte.CATALOGUE.filter((a) => a.emplacement === o && !a.espece));
  const pourAutre = (a) => a.espece && a.espece !== especeActuelle();

  function htmlArticle(a, m) {
    const achete = m.achats.includes(a.id);
    const porte = m.porte[a.emplacement] === a.id;
    const abordable = !achete && Jeu.peutAcheter(joueur.id, a.prix);
    const autre = pourAutre(a);
    const perso = a.espece ? Mascotte.personnage(a.espece) : null;
    let etat = porte ? 'porte' : achete ? 'achete' : abordable ? 'abordable' : 'verrouille';
    if (autre) etat += ' autre';
    let bas;
    if (autre) bas = achete ? '<span class="etat">À toi!</span>' : `<span class="prix">${pastillesPrix(a.prix)}</span>`;
    else if (porte) bas = '<span class="etat oui">✓ Porté</span>';
    else if (achete) bas = '<span class="etat">Mettre</span>';
    else bas = `<span class="prix">${pastillesPrix(a.prix)}</span>${abordable ? '<span class="etat acheter">Acheter</span>' : ''}`;
    let etiquette = porte ? `${a.nom} : porté. Clique pour l'enlever.`
      : achete ? `${a.nom} : clique pour le mettre.`
      : `${a.nom} : coûte ${texteprix(a.prix)}.`;
    if (autre) etiquette = `${a.nom} : objet spécial pour ${perso.le}.`;
    const pour = perso ? `<span class="pour">⭐ Pour ${perso.le}</span>` : '';
    return `<button type="button" class="article ${etat}" data-id="${a.id}" aria-label="${etiquette}">
              <span class="image">${Mascotte.vignette(a.id)}</span>
              <span class="nom">${a.nom}${pour}</span>
              <span class="bas">${bas}</span>
            </button>`;
  }

  function rendreRayons() {
    const m = Jeu.mascotte(joueur.id);
    const onglets = ONGLETS.map((o) => {
      // pastille : combien d'objets on peut acheter dans cet onglet
      const n = articlesDe(o.id).filter((a) => !m.achats.includes(a.id) && Jeu.peutAcheter(joueur.id, a.prix)).length;
      const actif = o.id === onglet;
      return `<button type="button" class="onglet${actif ? ' actif' : ''}" data-onglet="${o.id}" role="tab" aria-selected="${actif}">
                <span aria-hidden="true">${o.icone}</span> ${o.titre}${n ? `<span class="pastille-nb" title="${n} à acheter">${n}</span>` : ''}</button>`;
    }).join('');
    const note = onglet === 'special'
      ? '<p class="note-speciaux">Chaque personnage a son objet spécial, plus rare. Seul ce personnage peut le porter!</p>' : '';
    $('rayons').innerHTML = `<div class="onglets" role="tablist">${onglets}</div>${note}
      <div class="articles">${articlesDe(onglet).map((a) => htmlArticle(a, m)).join('')}</div>`;
  }

  // Choix du personnage : gratuit; chaque vignette porte la tenue actuelle.
  let vignettes = [];
  function rendrePersonnages() {
    vignettes.forEach((v) => v.detruire());
    vignettes = [];
    const m = Jeu.mascotte(joueur.id);
    const zone = $('personnages');
    zone.innerHTML = Mascotte.PERSONNAGES.ORDRE.map((id) => {
      const e = Mascotte.personnage(id);
      const choisi = e.id === Mascotte.personnage(m.espece).id;
      return `<button type="button" class="choix-perso${choisi ? ' choisi' : ''}" data-espece="${id}" aria-pressed="${choisi}" aria-label="${e.nom}">
                <span class="image"></span><span class="nom">${e.nom}</span></button>`;
    }).join('');
    zone.querySelectorAll('.choix-perso').forEach((b) => {
      vignettes.push(Mascotte.creer(b.querySelector('.image'), { espece: b.dataset.espece, porte: m.porte, taille: 'mini', statique: true }));
    });
  }

  $('personnages').addEventListener('click', (ev) => {
    const b = ev.target.closest('.choix-perso');
    if (!b) return;
    if (b.dataset.espece === Mascotte.personnage(Jeu.mascotte(joueur.id).espece).id) return;
    Jeu.choisirPersonnage(joueur.id, b.dataset.espece);
    Jeu.jouer('clic');
    creerPersonnage();
    renard.reagir('bon');
    renard.dire(Mascotte.personnage(b.dataset.espece).salut);
    rendrePersonnages();
  });

  function rendre() {
    rendreTresor();
    rendreRayons();
    rendrePersonnages();
  }

  // ---------- Essayer (survol), mettre, acheter ----------

  const porteActuel = () => Jeu.mascotte(joueur.id).porte;
  function essayer(a) {
    if (pourAutre(a)) return;
    renard.habiller({ ...porteActuel(), [a.emplacement]: a.id });
  }
  const remettre = () => renard.habiller(porteActuel());

  $('rayons').addEventListener('mouseover', (ev) => {
    const b = ev.target.closest('.article');
    if (b) essayer(Mascotte.PAR_ID[b.dataset.id]);
  });
  $('rayons').addEventListener('mouseleave', remettre);
  $('rayons').addEventListener('focusin', (ev) => {
    const b = ev.target.closest('.article');
    if (b) essayer(Mascotte.PAR_ID[b.dataset.id]);
  });
  $('rayons').addEventListener('focusout', (ev) => {
    if (!$('rayons').contains(ev.relatedTarget)) remettre();
  });

  let aAcheter = null;
  const fenetre = $('fenetre');

  function ouvrirAchat(a) {
    aAcheter = a;
    $('image-fenetre').innerHTML = Mascotte.vignette(a.id);
    $('titre-fenetre').textContent = `Acheter : ${a.nom}?`;
    $('texte-fenetre').innerHTML = `Ça coûte ${pastillesPrix(a.prix)} <span>(${texteprix(a.prix)}).</span>`;
    fenetre.hidden = false;
    $('btn-acheter').focus();
  }
  function fermerAchat() {
    fenetre.hidden = true;
    aAcheter = null;
    remettre();
  }

  $('btn-acheter').addEventListener('click', () => {
    const a = aAcheter;
    if (!a) return;
    const ok = Jeu.acheter(joueur.id, a.id, a.emplacement, a.prix);
    fermerAchat();
    if (ok) {
      Jeu.jouer('pierre'); // clochettes… et le renard danse
      renard.habiller(porteActuel());
      renard.dire(`Merci! J’adore ${a.article} ${a.nom.toLowerCase()}!`);
    }
    rendre();
  });
  $('btn-pas-maintenant').addEventListener('click', fermerAchat);
  fenetre.addEventListener('click', (ev) => { if (ev.target === fenetre) fermerAchat(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !fenetre.hidden) fermerAchat(); });

  $('rayons').addEventListener('click', (ev) => {
    const o = ev.target.closest('.onglet');
    if (o) {
      if (o.dataset.onglet !== onglet) { onglet = o.dataset.onglet; Jeu.jouer('clic'); rendreRayons(); }
      return;
    }
    const b = ev.target.closest('.article');
    if (!b) return;
    const a = Mascotte.PAR_ID[b.dataset.id];
    const m = Jeu.mascotte(joueur.id);
    if (pourAutre(a)) {
      const le = Mascotte.personnage(a.espece).le;
      Jeu.jouer('oups');
      renard.dire(`C’est l’objet spécial pour ${le}! Choisis ${le} plus haut pour ${m.achats.includes(a.id) ? 'le mettre' : 'l’acheter'}.`, 3800);
      return;
    }
    if (m.achats.includes(a.id)) {
      const enlever = m.porte[a.emplacement] === a.id;
      Jeu.porter(joueur.id, a.emplacement, enlever ? null : a.id);
      Jeu.jouer(enlever ? 'clic' : 'bon');
      renard.habiller(porteActuel());
      renard.dire(enlever ? 'Hop, enlevé!' : 'Tadam! Je suis beau?');
      rendre();
    } else if (Jeu.peutAcheter(joueur.id, a.prix)) {
      Jeu.jouer('clic');
      ouvrirAchat(a);
    } else {
      Jeu.jouer('oups');
      renard.dire(`Il te manque ${texteprix(manque(a.prix))}. Continue à jouer, tu vas l’avoir!`, 3800);
    }
  });

  // ---------- Son ----------

  function rendreSon() {
    const b = $('btn-son');
    b.textContent = Jeu.sonActif() ? '🔊' : '🔇';
    b.setAttribute('aria-pressed', String(Jeu.sonActif()));
    b.title = Jeu.sonActif() ? 'Couper le son' : 'Remettre le son';
  }
  $('btn-son').addEventListener('click', () => { Jeu.basculerSon(); rendreSon(); });
  rendreSon();
  Jeu.brancherSonsNavigation();

  rendre();
});
