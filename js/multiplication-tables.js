/* ==========================================================
   Tables de multiplication (de 1 à 12)
   Le déroulement (tutoriel, défis, pierres) est dans tables-moteur.js.
   ========================================================== */
'use strict';

const bondsDe = (b, n) => Array.from({ length: n }, (_, k) => (k + 1) * b).join(', ');

ActiviteTables({
  id: 'multiplication-tables',
  titre: 'Tables de multiplication',
  sousTitre: 'Multiplier, c’est additionner des groupes égaux : 3 × 4, c’est 3 groupes de 4.',
  texteCarteTuto: 'D’abord des jetons à placer en groupes égaux, puis des trucs pour calculer plus vite.',
  texteFinTuto: 'Tu sais maintenant multiplier : faire des groupes égaux, compter par bonds, ou découper en morceaux faciles.',
  symbole: '×',
  motOperation: 'fois',
  nomSingulier: 'multiplication',
  nomSingulierMaj: 'Multiplication',
  nomPluriel: 'multiplications',
  chiffresMax: 4,

  // Réglages faciles à changer
  nbDefis: 10,
  chronoRubis: 90, // secondes pour le défi vitesse
  maxErreursEmeraude: 1,

  facteurs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  toutes: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  ordreAleatoire: true, // 7 × 8 ou 8 × 7
  niveaux: {
    bronze: { desc: 'Tables de 1, 2, 5 et 10', tables: [1, 2, 5, 10] },
    argent: { desc: 'Tables de 3, 4, 6 et 11', tables: [3, 4, 6, 11] },
    or: { desc: 'Tables de 7, 8, 9 et 12', tables: [7, 8, 9, 12] },
  },

  // a × b : a groupes de b jetons. Défi diamant : b a un zéro de plus (7 × 80).
  probleme(a, b, zero = false) {
    const droite = zero ? b * 10 : b;
    return {
      gauche: a, droite, reponse: a * droite,
      nbGroupes: a, taille: b, total: a * b, zero,
      cle: `${Math.min(a, b)}×${Math.max(a, b)}`, // 7 × 8 et 8 × 7 : le même fait
    };
  },
  reserve: false,
  texteCompteur: (groupes, taille) => `${groupes} groupe${groupes > 1 ? 's' : ''} de ${taille} = ${groupes * taille} jetons`,
  messageGroupesFinis: (pb) => `Tous les groupes sont faits! Combien de jetons en tout? C’est la réponse de ${pb.gauche} × ${pb.droite}.`,
  rappel: (pb) => `${pb.gauche} × ${pb.droite}, c’est <b>${pb.gauche} groupe${pb.gauche > 1 ? 's' : ''} de ${pb.droite}</b>`,
  pourquoi: (pb) => `, c’est ${pb.gauche} groupe${pb.gauche > 1 ? 's' : ''} de ${pb.droite}`,
  indice(pb) {
    const { gauche: a, droite: b, zero } = pb;
    if (zero) return `Cache le 0 : <b>${a} × ${b / 10} = ?</b> Puis remets le 0 à la fin.`;
    // On compte par bonds du plus grand nombre, le plus petit nombre de fois.
    const grand = Math.max(a, b);
    const petit = Math.min(a, b);
    let texte = `Compte ${petit} bond${petit > 1 ? 's' : ''} de ${grand} : ${bondsDe(grand, Math.min(petit, 3))}${petit > 3 ? '…' : ''}`;
    if (petit > 5) {
      texte += `<br>Ou découpe en morceaux faciles : <b>${petit} × ${grand} = 5 × ${grand} + ${petit - 5} × ${grand}</b>`;
    }
    return texte;
  },

  tuto: {
    titre: 'Tutoriel : des groupes égaux',
    exemple: [3, 4], // 3 × 4
    indiceEtape: 'Compte tous les jetons : 4, 8, 12…',
    etapes: [
      {
        texte: 'Voici <b>3 × 4</b>. Multiplier, c’est faire des <b>groupes égaux</b> : 3 × 4, c’est <b>3 groupes de 4 jetons</b>.',
        attente: 'suivant',
      },
      {
        texte: 'Clique sur <b>« Faire un groupe de 4 »</b> pour former le premier groupe.',
        consigne: 'Clique sur « Faire un groupe de 4 ».',
        attente: 'groupe',
      },
      {
        texte: 'Bien! Fais <b>3 groupes de 4</b> en tout.',
        consigne: 'Continue à faire des groupes de 4.',
        attente: 'tous-les-groupes',
      },
      {
        texte: 'Voilà 3 groupes de 4! Compte tous les jetons par bonds de 4 : <b>4, 8, 12</b>. Donc <b>3 × 4 = 12</b>. Écris 12 dans la case, puis clique sur <b>Vérifier</b>.',
        consigne: 'Écris 12 dans la case, puis clique sur Vérifier.',
        attente: 'reponse',
      },
      {
        texte: 'Bravo! 3 × 4, c’est 4 + 4 + 4 = 12. Petit truc : <b>l’ordre ne change rien</b>! 4 × 3, c’est 3 + 3 + 3 + 3 = 12 aussi.',
        attente: 'suivant',
        bravo: true,
      },
    ],
    parties: [
      {
        titre: 'Tutoriel : compter par bonds',
        exemple: [5, 6], // 5 × 6
        jetons: true,
        message: 'À ton tour : <b>5 × 6</b>, c’est 5 groupes de 6. Compte par bonds de 6 : <b>6, 12, 18…</b> Si tu veux, fais les groupes avec les jetons.',
      },
      {
        titre: 'Tutoriel : découper en morceaux faciles',
        exemple: [7, 8], // 7 × 8
        jetons: false,
        message: 'Tu ne connais pas encore <b>7 × 8</b>? Découpe en morceaux faciles : <b>5 × 8 = 40</b> et <b>2 × 8 = 16</b>. Ensemble, 40 + 16 = ?',
      },
    ],
  },

  diamant: {
    desc: 'Les tables avec un zéro de plus : 7 × 80 = 560!',
    exemple: [7, 8], // 7 × 80
    texte: `<b>Le truc du zéro!</b> 80, c’est 8 dizaines. Cache le 0 : <b>7 × 8 = 56</b>. Puis remets le 0 : <b>7 × 80 = 560</b>.
      Pourquoi? 7 fois 8 dizaines, ça fait 56 dizaines, donc 560.`,
    demo: `<div class="demo-zero">
        <div class="ligne">7 × 80 = ?</div>
        <div class="ligne"><span class="fleche">cache le 0 →</span> 7 × <span>8<span class="zero-cache">0</span></span> = 56</div>
        <div class="ligne"><span class="fleche">remets le 0 →</span> <span>56<span class="zero-remis">0</span></span></div>
        <div class="legende">7 × 8 dizaines = 56 dizaines = 560</div>
      </div>`,
  },
});
