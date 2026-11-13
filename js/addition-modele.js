/* ==========================================================
   Addition en colonnes — logique (sans affichage)
   ----------------------------------------------------------
   On additionne colonne par colonne, en commençant par les unités.
   Si une colonne donne 10 ou plus, on écrit le chiffre des unités
   en bas et on note la retenue au-dessus de la colonne suivante.
     456 + 278 + 139 :
       unités    6 + 8 + 9     = 23 → on écrit 3, on retient 2
       dizaines  5 + 7 + 3 + 2 = 17 → on écrit 7, on retient 1
       centaines 4 + 2 + 1 + 1 = 8  → on écrit 8         = 873
   ========================================================== */
'use strict';

const Addition = (() => {
  const NOMS = ['unités', 'dizaines', 'centaines', 'unités de mille', 'dizaines de mille', 'centaines de mille', 'millions', 'dizaines de millions'];

  const NOMS_UN = ['unité', 'dizaine', 'centaine', 'unité de mille', 'dizaine de mille', 'centaine de mille', 'million', 'dizaine de millions'];
  // « 2 dizaines », « 1 centaine »
  const quantite = (n, c) => `${n} ${n > 1 ? NOMS[c] : NOMS_UN[c]}`;

  function creer(nombres) {
    const total = nombres.reduce((x, y) => x + y, 0);
    const largeur = String(total).length;
    const P = { nombres: [...nombres], total, largeur };
    P.colonnes = colonnes(P);
    return P;
  }

  // Chaque colonne : les chiffres à additionner, la retenue reçue, la somme, le chiffre écrit et la retenue suivante.
  function colonnes(P) {
    const res = [];
    let retenue = 0;
    for (let c = 0; c < P.largeur; c++) {
      const chiffres = P.nombres.filter((n) => n >= 10 ** c).map((n) => Math.floor(n / 10 ** c) % 10);
      const somme = chiffres.reduce((x, y) => x + y, 0) + retenue;
      res.push({ c, chiffres, retenue, somme, ecrit: somme % 10, retenueSuivante: Math.floor(somme / 10) });
      retenue = Math.floor(somme / 10);
    }
    return res;
  }

  const calculTexte = (col) => {
    const parts = col.chiffres.map(String);
    if (col.retenue) parts.push(`<b class="c-retenue">${col.retenue}</b>`);
    return parts.join(' + ');
  };

  // Explication d'une colonne. complet = on donne la réponse (tutoriel).
  function explication(P, c, complet) {
    const col = P.colonnes[c];
    const nom = NOMS[c];
    const suivante = NOMS[c + 1];
    if (col.chiffres.length === 0) {
      // Dernière colonne : il ne reste que la retenue
      return `Colonne des <b>${nom}</b> : il n’y a plus de chiffres, seulement la retenue <b class="c-retenue">${col.retenue}</b>. On l’écrit en bas.`;
    }
    const avecRetenue = col.retenue ? ' (avec la retenue)' : '';
    if (!complet) {
      return `Colonne des <b>${nom}</b> : additionne ${calculTexte(col)}${avecRetenue}. Combien ça fait?`;
    }
    let texte = `Colonne des <b>${nom}</b> : ${calculTexte(col)} = <b>${col.somme}</b>.`;
    if (col.retenueSuivante) {
      texte += ` On écrit <b>${col.ecrit}</b> en bas, et on retient <b class="c-retenue">${col.retenueSuivante}</b> : on l’écrit dans la petite case au-dessus des ${suivante}.`;
    } else {
      texte += ` On écrit <b>${col.ecrit}</b> en bas.`;
    }
    return texte;
  }

  // Indice pour une réponse fausse : la première colonne (en partant des unités) qui est fausse.
  function indice(P, tape, complet) {
    const t = String(tape);
    const e = String(P.total);
    for (const col of P.colonnes) {
      const chiffreTape = t.length > col.c ? t[t.length - 1 - col.c] : '';
      const chiffreAttendu = e[e.length - 1 - col.c];
      if (chiffreTape !== chiffreAttendu) {
        if (!complet) {
          if (col.chiffres.length === 0) return `Vérifie la colonne des <b>${NOMS[col.c]}</b> : il n’y reste que la retenue.`;
          return `Vérifie la colonne des <b>${NOMS[col.c]}</b> : ${col.chiffres.join(' + ')}${col.retenue ? ', sans oublier la retenue' : ''}.`;
        }
        return explication(P, col.c, true);
      }
    }
    if (t.length > e.length) return 'Ta réponse a trop de chiffres.';
    return 'Additionne colonne par colonne, en commençant par les unités.';
  }

  // ---------- Génération des défis ----------

  const alea = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const nombre = (n) => {
    let s = String(alea(1, 9));
    for (let k = 1; k < n; k++) s += alea(0, 9);
    return Number(s);
  };

  // forme : { n: combien de nombres, chiffres: [min, max], retenues: nombre minimum de colonnes avec une retenue }
  function generer(formes) {
    const vus = new Set();
    return formes.map((f) => {
      let nombres = [];
      for (let essai = 0; essai < 200; essai++) {
        nombres = Array.from({ length: f.n }, () => nombre(alea(f.chiffres[0], f.chiffres[1])));
        nombres.sort((x, y) => y - x); // le plus grand en haut, comme on l'écrit souvent
        const P = creer(nombres);
        const nbRetenues = P.colonnes.filter((col) => col.retenueSuivante > 0).length;
        const cle = nombres.join('+');
        if (nbRetenues >= (f.retenues || 0) && !vus.has(cle)) break;
      }
      vus.add(nombres.join('+'));
      return nombres;
    });
  }

  return { NOMS, NOMS_UN, quantite, creer, colonnes, explication, indice, generer };
})();

if (typeof module !== 'undefined') module.exports = Addition;
