/* ==========================================================
   Division avec reste — logique (sans affichage)
   ----------------------------------------------------------
   Division posée, un chiffre du dividende à la fois :
   divise (combien de fois?), multiplie, soustrais, abaisse.
     742 ÷ 6 :  7 → 1 fois (6), reste 1; on abaisse 4 → 14
                14 → 2 fois (12), reste 2; on abaisse 2 → 22
                22 → 3 fois (18), reste 4                  = 123 reste 4
   ========================================================== */
'use strict';

const Division = (() => {
  // Les étapes de la division : une par chiffre du quotient.
  function creer(dividende, diviseur) {
    const chiffres = String(dividende).split('').map(Number);
    const n = chiffres.length;
    // On commence avec assez de chiffres pour que le diviseur « entre » au moins une fois.
    let debut = 0;
    let partiel = chiffres[0];
    while (partiel < diviseur && debut < n - 1) {
      debut++;
      partiel = partiel * 10 + chiffres[debut];
    }
    const etapes = [];
    for (let pos = debut; pos < n; pos++) {
      const q = Math.floor(partiel / diviseur);
      const produit = q * diviseur;
      const reste = partiel - produit;
      const abaisse = pos < n - 1 ? chiffres[pos + 1] : null;
      etapes.push({ pos, partiel, q, produit, reste, abaisse });
      if (abaisse !== null) partiel = reste * 10 + abaisse;
    }
    return {
      dividende, diviseur, chiffres, n, debut, etapes,
      quotient: Math.floor(dividende / diviseur),
      reste: dividende % diviseur,
    };
  }

  // ---------- Les explications de chaque étape ----------
  // champ : 'q' (chiffre du quotient), 'produit', 'reste'; complet = on donne la réponse (tutoriel)
  function explication(P, k, champ, complet) {
    const e = P.etapes[k];
    const d = P.diviseur;
    if (champ === 'q') {
      if (!complet) return `<b>Divise</b> : combien de fois <b>${d}</b> entre dans <b>${e.partiel}</b>?`;
      if (e.q === 0) return `<b>Divise</b> : ${d} n’entre pas dans ${e.partiel} (c’est trop petit), alors on écrit <b>0</b> au quotient.`;
      const suivant = e.q < 9 ? `, et ${d} × ${e.q + 1} = ${(e.q + 1) * d}, c’est trop` : '';
      return `<b>Divise</b> : combien de fois ${d} entre dans ${e.partiel}? ${d} × ${e.q} = ${e.produit}${suivant}. On écrit <b>${e.q}</b> au quotient.`;
    }
    if (champ === 'produit') {
      if (!complet) return `<b>Multiplie</b> : ${e.q} × ${d} = ? Écris-le sous ${e.partiel}.`;
      return `<b>Multiplie</b> : ${e.q} × ${d} = <b>${e.produit}</b>. On l’écrit sous ${e.partiel}.`;
    }
    // reste
    if (!complet) return `<b>Soustrais</b> : ${e.partiel} − ${e.produit} = ?`;
    return `<b>Soustrais</b> : ${e.partiel} − ${e.produit} = <b>${e.reste}</b>.`;
  }

  // Ce qu'on dit après une étape réussie (on abaisse le chiffre suivant, ou c'est fini)
  function apresReste(P, k) {
    const e = P.etapes[k];
    if (e.abaisse === null) return `Il n’y a plus de chiffre à abaisser : le <b>reste</b> est ${e.reste}.`;
    return `<b>Abaisse</b> le ${e.abaisse} : ça fait <b>${e.reste * 10 + e.abaisse}</b>.`;
  }

  // Indice pour une réponse fausse à une étape
  function indice(P, k, champ, tape) {
    const e = P.etapes[k];
    const d = P.diviseur;
    const t = Number(tape);
    if (champ === 'q') {
      if (t > e.q) return `${d} × ${t} = ${t * d}, c’est plus que ${e.partiel} : c’est trop!`;
      return `${d} × ${t} = ${t * d}, et il resterait ${e.partiel - t * d} : c’est ${d} ou plus, donc ${d} entre encore une fois!`;
    }
    if (champ === 'produit') return `Vérifie ta multiplication : ${e.q} × ${d}.`;
    if (t >= d && t === e.partiel - e.produit) return `Ta soustraction est bonne… mais il reste ${t}, c’est plus que ${d}!`;
    return `Vérifie ta soustraction : ${e.partiel} − ${e.produit}.`;
  }

  // Pour la réponse sur papier : quotient et reste
  function indiceReponse(P, q, r) {
    if (q === P.quotient && r !== P.reste) return 'Ton quotient est bon, mais vérifie le reste.';
    if (r >= P.diviseur) return `Un reste doit toujours être plus petit que le diviseur (${P.diviseur}).`;
    return 'Vérifie ton quotient sur ta feuille.';
  }

  // ---------- Génération ----------
  const alea = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  // forme : { chiffres: [min, max] (du dividende), diviseur: [min, max], zero: true = un 0 au milieu du quotient }
  function generer(formes) {
    const vus = new Set();
    return formes.map((f) => {
      let a = 0;
      let d = 0;
      for (let essai = 0; essai < 400; essai++) {
        const nc = alea(f.chiffres[0], f.chiffres[1]);
        a = alea(10 ** (nc - 1), 10 ** nc - 1);
        d = alea(f.diviseur[0], f.diviseur[1]);
        const P = creer(a, d);
        const q = String(P.quotient);
        if (P.quotient < 2) continue;
        if (f.zero && !q.slice(1).includes('0')) continue;
        if (!f.zero && q.slice(1).includes('0') && essai < 300) continue; // le 0 au quotient : surtout au niveau or
        if (P.reste === 0 && Math.random() < 0.75) continue; // presque toujours un reste
        if (vus.has(`${a}/${d}`)) continue;
        break;
      }
      vus.add(`${a}/${d}`);
      return [a, d];
    });
  }

  return { creer, explication, apresReste, indice, indiceReponse, generer };
})();

if (typeof module !== 'undefined') module.exports = Division;
