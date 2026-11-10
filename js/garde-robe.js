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

  const renard = Mascotte.creer($('scene'), { porte: Jeu.mascotte(joueur.id).porte, taille: 'grand' });
  setTimeout(() => renard.dire('Salut! On se fait beau?'), 400);

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

  function rendreRayons() {
    const m = Jeu.mascotte(joueur.id);
    $('rayons').innerHTML = Mascotte.EMPLACEMENTS.map((e) => {
      const articles = Mascotte.CATALOGUE.filter((a) => a.emplacement === e.id).map((a) => {
        const achete = m.achats.includes(a.id);
        const porte = m.porte[e.id] === a.id;
        const abordable = !achete && Jeu.peutAcheter(joueur.id, a.prix);
        const etat = porte ? 'porte' : achete ? 'achete' : abordable ? 'abordable' : 'verrouille';
        const bas = porte ? '<span class="etat oui">✓ Porté</span>'
          : achete ? '<span class="etat">Mettre</span>'
          : `<span class="prix">${pastillesPrix(a.prix)}</span>${abordable ? '<span class="etat acheter">Acheter</span>' : ''}`;
        const etiquette = porte ? `${a.nom} : porté. Clique pour l'enlever.`
          : achete ? `${a.nom} : clique pour le mettre.`
          : `${a.nom} : coûte ${texteprix(a.prix)}.`;
        return `<button type="button" class="article ${etat}" data-id="${a.id}" aria-label="${etiquette}">
                  <span class="image">${Mascotte.vignette(a.id)}</span>
                  <span class="nom">${a.nom}</span>
                  <span class="bas">${bas}</span>
                </button>`;
      }).join('');
      return `<div class="rayon"><h2>${e.titre}</h2><div class="articles">${articles}</div></div>`;
    }).join('');
  }

  function rendre() {
    rendreTresor();
    rendreRayons();
  }

  // ---------- Essayer (survol), mettre, acheter ----------

  const porteActuel = () => Jeu.mascotte(joueur.id).porte;
  function essayer(a) {
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
    const b = ev.target.closest('.article');
    if (!b) return;
    const a = Mascotte.PAR_ID[b.dataset.id];
    const m = Jeu.mascotte(joueur.id);
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
