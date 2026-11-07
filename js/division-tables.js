/* ==========================================================
   Tables de division (sans reste, jusqu'à 10)
   Le déroulement (tutoriel, défis, pierres) est dans tables-moteur.js.
   ========================================================== */
'use strict';

ActiviteTables({
  id: 'division-tables',
  titre: 'Tables de division',
  sousTitre: 'Diviser, c’est faire des groupes égaux. Le truc : la multiplication à l’envers!',
  texteCarteTuto: 'D’abord des jetons à placer en groupes, puis le truc de la multiplication.',
  texteFinTuto: 'Tu sais maintenant diviser : faire des groupes égaux, ou chercher le nombre qui manque dans la multiplication.',
  symbole: '÷',
  motOperation: 'divisé par',
  nomSingulier: 'division',
  nomSingulierMaj: 'Division',
  nomPluriel: 'divisions',
  chiffresMax: 3,

  // Réglages faciles à changer
  nbDefis: 10,
  chronoRubis: 90, // secondes pour le défi vitesse
  maxErreursEmeraude: 1,

  facteurs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // quotients possibles
  toutes: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  niveaux: {
    bronze: { desc: 'Tables de 1, 2, 5 et 10', tables: [1, 2, 5, 10] },
    argent: { desc: 'Tables de 3, 4 et 6', tables: [3, 4, 6] },
    or: { desc: 'Tables de 7, 8 et 9', tables: [7, 8, 9] },
  },

  // a ÷ b = q : on fait des groupes de b avec a jetons, et on compte les groupes.
  probleme(b, q, zero = false) {
    const f = zero ? 10 : 1;
    const a = b * q * f;
    return { gauche: a, droite: b, reponse: q * f, nbGroupes: q, taille: b, total: b * q, zero, cle: `${a}:${b}` };
  },
  reserve: true, // on voit les jetons pas encore placés
  texteCompteur: (groupes, taille) => `Groupes de ${taille} : ${groupes}`,
  messageGroupesFinis: (pb) => `Plus de jetons! Combien de groupes de ${pb.droite} as-tu faits? C’est la réponse de ${pb.gauche} ÷ ${pb.droite}.`,
  rappel: (pb) => `Pense à : <b>${pb.droite} × ? = ${pb.gauche}</b>`,
  pourquoi: (pb) => `, parce que ${pb.droite} × ${pb.reponse} = ${pb.gauche}`,
  indice(pb) {
    const { gauche: a, droite: b, zero } = pb;
    if (zero) return `Cache le 0 : <b>${a / 10} ÷ ${b} = ?</b> Puis remets le 0 à la fin.`;
    const bonds = [1, 2, 3].map((k) => k * b).join(', ');
    return `Pense à la table de ${b} : <b>${b} × ? = ${a}</b>. Ou compte par bonds de ${b} : ${bonds}… jusqu’à ${a}. Combien de bonds?`;
  },

  tuto: {
    titre: 'Tutoriel : faire des groupes',
    exemple: [3, 4], // 12 ÷ 3
    indiceEtape: 'Compte les groupes que tu as faits.',
    etapes: [
      {
        texte: 'Voici <b>12 jetons</b>. Calculer <b>12 ÷ 3</b>, c’est chercher combien de <b>groupes de 3</b> on peut faire avec 12 jetons.',
        attente: 'suivant',
      },
      {
        texte: 'Clique sur <b>« Faire un groupe de 3 »</b> pour former un premier groupe.',
        consigne: 'Clique sur « Faire un groupe de 3 ».',
        attente: 'groupe',
      },
      {
        texte: 'Bien! Continue à faire des groupes de 3 jusqu’à ce qu’il ne reste plus de jetons.',
        consigne: 'Continue à faire des groupes de 3.',
        attente: 'tous-les-groupes',
      },
      {
        texte: 'Il ne reste plus de jetons : on a fait <b>4 groupes de 3</b>. Donc <b>12 ÷ 3 = 4</b>! Écris 4 dans la case, puis clique sur <b>Vérifier</b>.',
        consigne: 'Écris 4 dans la case, puis clique sur Vérifier.',
        attente: 'reponse',
      },
      {
        texte: 'Bravo! Voici le truc des grands : <b>la division, c’est la multiplication à l’envers</b>. Pour trouver 12 ÷ 3, demande-toi : <b>3 × ? = 12</b>. Comme 3 × 4 = 12, alors 12 ÷ 3 = 4.',
        attente: 'suivant',
        bravo: true,
      },
    ],
    parties: [
      {
        titre: 'Tutoriel : à toi, avec des jetons',
        exemple: [5, 4], // 20 ÷ 5
        jetons: true,
        message: 'À ton tour : <b>20 ÷ 5</b>. Pense à la table de 5 : <b>5 × ? = 20</b>. Si tu veux, fais des groupes avec les jetons.',
      },
      {
        titre: 'Tutoriel : le truc de la multiplication',
        exemple: [7, 6], // 42 ÷ 7
        jetons: false,
        message: 'Dernier exemple, sans jetons : <b>42 ÷ 7</b>. Demande-toi : <b>7 × ? = 42</b>. Pense à ta table de 7!',
      },
    ],
  },

  diamant: {
    desc: 'Les tables avec un zéro de plus : 720 ÷ 9 = 80!',
    exemple: [9, 8], // 720 ÷ 9
    texte: `<b>Le truc du zéro!</b> 720, c’est 72 dizaines. Cache le 0 : <b>72 ÷ 9 = 8</b>. Puis remets le 0 : <b>720 ÷ 9 = 80</b>.
      On peut vérifier avec la multiplication : 9 × 80 = 720 ✔`,
    demo: `<div class="demo-zero">
        <div class="ligne">720 ÷ 9 = ?</div>
        <div class="ligne"><span class="fleche">cache le 0 →</span> <span>72<span class="zero-cache">0</span></span> ÷ 9 = 8</div>
        <div class="ligne"><span class="fleche">remets le 0 →</span> <span>8<span class="zero-remis">0</span></span></div>
        <div class="legende">72 dizaines ÷ 9 = 8 dizaines = 80</div>
      </div>`,
  },
});
