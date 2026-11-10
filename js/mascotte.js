/* ==========================================================
   Le renard : mascotte animée et sa garde-robe
   ----------------------------------------------------------
   Le renard est une « marionnette » SVG : chaque partie (tête,
   oreilles, bras, queue…) pivote autour de son propre point.
   Les animations utilisent element.animate(). Les animations de
   repos tournent en boucle; une réaction est créée par-dessus et
   les remplace le temps qu'elle dure.

   Les accessoires sont placés DANS la partie qui les porte (tête,
   corps, bras droit) : ils suivent donc tous les mouvements.

   Utilisation :
     const r = Mascotte.creer(conteneur, { porte, taille: 'petit' | 'grand' | 'mini' });
     r.reagir('bon' | 'erreur' | 'medaille' | 'hmm');
     r.habiller({ tete: 'casquette', yeux: null, cou: 'cravate', main: null });
   Dans les activités : Mascotte.brancherActivite() (fait tout seul au chargement).
   ========================================================== */
'use strict';

const Mascotte = (() => {
  // ==========================================================
  //  Catalogue des accessoires (prix en médailles et en pierres)
  //  Monnaies : bronze, argent, or, rubis, emeraude, saphir, diamant
  // ==========================================================

  const EMPLACEMENTS = [
    { id: 'tete', titre: 'Sur la tête' },
    { id: 'yeux', titre: 'Sur les yeux' },
    { id: 'cou',  titre: 'Au cou' },
    { id: 'main', titre: 'Dans la main' },
  ];

  // Étoile à 5 pointes (chemin SVG)
  function etoile(cx, cy, R, r, rotation = -90) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (rotation + i * 36) * Math.PI / 180;
      const rr = i % 2 ? r : R;
      pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join(' L')} Z`;
  }

  const CATALOGUE = [
    // ---------- Tête ----------
    {
      id: 'casquette', article: 'ma', nom: 'Casquette', emplacement: 'tete', prix: { bronze: 1 }, vue: '82 76 76 46',
      svg: `<path d="M89 109 C88 82 152 82 151 109 Z" fill="url(#@g-bleu)" stroke="#1d3f8a" stroke-width="2.4"/>
        <path d="M120 84 L120 108" stroke="#1d3f8a" stroke-width="1.4" opacity=".5"/>
        <path d="M100 90 C96 96 94 102 94 108 M140 90 C144 96 146 102 146 108" stroke="#1d3f8a" stroke-width="1.2" fill="none" opacity=".4"/>
        <path d="M84 110 C100 120 140 120 156 110 C150 104 90 104 84 110 Z" fill="#2851b8" stroke="#1d3f8a" stroke-width="2.4"/>
        <circle cx="120" cy="84" r="3.4" fill="#2851b8" stroke="#1d3f8a" stroke-width="1.6"/>
        <path d="M120 93 V103 M115 98 H125" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <path d="M97 98 C99 91 106 87 112 86" stroke="#fff" stroke-width="2.4" fill="none" opacity=".45"/>`,
    },
    {
      id: 'magicien', article: 'mon', nom: 'Chapeau de magicien', emplacement: 'tete', prix: { or: 1, saphir: 1 }, vue: '80 24 84 90',
      svg: `<g transform="rotate(7 120 104)">
        <path d="M93 104 L121 36 L149 104 Z" fill="url(#@g-violet)" stroke="#3b1f73" stroke-width="2.4"/>
        <path d="M121 36 L110 104" stroke="#fff" stroke-width="2" opacity=".2"/>
        <path d="${etoile(114, 72, 6, 2.6)}" fill="url(#@g-or)" stroke="#a87408" stroke-width="1"/>
        <path d="${etoile(132, 88, 4.5, 2)}" fill="url(#@g-or)" stroke="#a87408" stroke-width="1"/>
        <path d="${etoile(126, 56, 3.6, 1.6)}" fill="#fff6c2"/>
        <path d="M95 96 C110 101 132 101 147 96 L148 104 C132 109 110 109 94 104 Z" fill="#f6c433" stroke="#8a5d04" stroke-width="1.8"/>
        <ellipse cx="121" cy="106" rx="38" ry="7" fill="url(#@g-violet)" stroke="#3b1f73" stroke-width="2.4"/>
        <path d="${etoile(121, 34, 6.5, 2.8)}" fill="url(#@g-or)" stroke="#a87408" stroke-width="1.2"/>
      </g>`,
    },
    {
      id: 'couronne', article: 'ma', nom: 'Couronne', emplacement: 'tete', prix: { or: 1, diamant: 1 }, vue: '88 60 64 50',
      svg: `<g transform="rotate(-8 120 92)">
        <path d="M100 103 L97 79 L110 90 L120 70 L130 90 L143 79 L140 103 Z" fill="url(#@g-or)" stroke="#8a5d04" stroke-width="2.4"/>
        <path d="M100 98 L140 98" stroke="#8a5d04" stroke-width="1.6" opacity=".6"/>
        <circle cx="120" cy="96" r="3.8" fill="#e0245e" stroke="#7a0d2e" stroke-width="1.2"/>
        <circle cx="108" cy="97" r="2.6" fill="#3b7dd8" stroke="#163e80" stroke-width="1"/>
        <circle cx="132" cy="97" r="2.6" fill="#3b7dd8" stroke="#163e80" stroke-width="1"/>
        <circle cx="97" cy="78" r="2.6" fill="url(#@g-or)" stroke="#8a5d04" stroke-width="1.2"/>
        <circle cx="120" cy="69" r="3" fill="url(#@g-or)" stroke="#8a5d04" stroke-width="1.2"/>
        <circle cx="143" cy="78" r="2.6" fill="url(#@g-or)" stroke="#8a5d04" stroke-width="1.2"/>
        <path d="M104 86 L104 96" stroke="#fff" stroke-width="2" opacity=".7"/>
        <circle cx="119" cy="95" r="1.1" fill="#fff"/>
      </g>`,
    },

    // ---------- Yeux ----------
    {
      id: 'lunettes', article: 'mes', nom: 'Lunettes rondes', emplacement: 'yeux', prix: { bronze: 1 }, vue: '60 120 120 42',
      svg: `<circle cx="98" cy="141" r="15.5" fill="url(#@g-verre)" stroke="#2d2d3a" stroke-width="3.4"/>
        <circle cx="142" cy="141" r="15.5" fill="url(#@g-verre)" stroke="#2d2d3a" stroke-width="3.4"/>
        <path d="M89 133 L95 128 M133 133 L139 128" stroke="#fff" stroke-width="2.2" opacity=".75"/>
        <path d="M113 140 Q120 134 127 140" stroke="#2d2d3a" stroke-width="3.2" fill="none"/>
        <path d="M82 138 L64 133 M158 138 L176 133" stroke="#2d2d3a" stroke-width="3"/>`,
    },
    {
      id: 'soleil', article: 'mes', nom: 'Lunettes de soleil', emplacement: 'yeux', prix: { argent: 1 }, vue: '60 122 120 36',
      svg: `<path d="M82 130 H114 Q115 146 107 152 Q99 157 90 152 Q81 146 82 130 Z" fill="url(#@g-fume)" stroke="#111" stroke-width="3"/>
        <path d="M126 130 H158 Q159 146 151 152 Q143 157 134 152 Q125 146 126 130 Z" fill="url(#@g-fume)" stroke="#111" stroke-width="3"/>
        <path d="M114 133 Q120 129 126 133" stroke="#111" stroke-width="3.4" fill="none"/>
        <path d="M82 132 L64 129 M158 132 L176 129" stroke="#111" stroke-width="3"/>
        <path d="M88 136 L96 134 M90 143 L101 138 M132 136 L140 134 M134 143 L145 138" stroke="#fff" stroke-width="2.2" opacity=".55"/>`,
    },
    {
      id: 'etoiles', article: 'mes', nom: 'Lunettes étoiles', emplacement: 'yeux', prix: { or: 1, rubis: 1 }, vue: '60 116 120 52',
      svg: `<path d="${etoile(98, 142, 20, 11)}" fill="url(#@g-rose-verre)" stroke="#d6246e" stroke-width="3" stroke-linejoin="round"/>
        <path d="${etoile(142, 142, 20, 11)}" fill="url(#@g-rose-verre)" stroke="#d6246e" stroke-width="3" stroke-linejoin="round"/>
        <path d="M114 138 Q120 133 126 138" stroke="#d6246e" stroke-width="3.2" fill="none"/>
        <path d="M80 136 L64 131 M160 136 L176 131" stroke="#d6246e" stroke-width="3"/>
        <circle cx="90" cy="131" r="2" fill="#fff" opacity=".85"/><circle cx="134" cy="131" r="2" fill="#fff" opacity=".85"/>`,
    },

    // ---------- Cou ----------
    {
      id: 'noeud', article: 'mon', nom: 'Nœud papillon', emplacement: 'cou', prix: { bronze: 1 }, vue: '96 194 48 30',
      svg: `<g transform="translate(0 6)"><path d="M120 203 L101 193 Q96 203 101 213 Z" fill="url(#@g-rouge)" stroke="#7a1418" stroke-width="2"/>
        <path d="M120 203 L139 193 Q144 203 139 213 Z" fill="url(#@g-rouge)" stroke="#7a1418" stroke-width="2"/>
        <circle cx="105" cy="199" r="1.6" fill="#fff"/><circle cx="104" cy="207" r="1.6" fill="#fff"/><circle cx="110" cy="203" r="1.6" fill="#fff"/>
        <circle cx="135" cy="199" r="1.6" fill="#fff"/><circle cx="136" cy="207" r="1.6" fill="#fff"/><circle cx="130" cy="203" r="1.6" fill="#fff"/>
        <rect x="115" y="197" width="10" height="12" rx="4" fill="url(#@g-rouge)" stroke="#7a1418" stroke-width="2"/></g>`,
    },
    {
      id: 'cravate', article: 'ma', nom: 'Cravate', emplacement: 'cou', prix: { argent: 1 }, vue: '100 194 40 56',
      svg: `<clipPath id="@clip-cravate"><path d="M116 208 L124 208 L129 236 L120 246 L111 236 Z"/></clipPath>
        <path d="M116 208 L124 208 L129 236 L120 246 L111 236 Z" fill="url(#@g-bleu)" stroke="#1d4384" stroke-width="2"/>
        <g clip-path="url(#@clip-cravate)" stroke="#cfe3ff" stroke-width="2.6" opacity=".85">
          <path d="M108 219 L132 207 M108 228 L132 216 M108 237 L132 225 M108 246 L132 234"/>
        </g>
        <path d="M113 199 L127 199 L124.5 209 L115.5 209 Z" fill="url(#@g-bleu)" stroke="#1d4384" stroke-width="2"/>
        <path d="M116 201 L118 207" stroke="#fff" stroke-width="1.6" opacity=".6"/>`,
    },
    {
      id: 'bandana', article: 'mon', nom: 'Bandana', emplacement: 'cou', prix: { argent: 1 }, vue: '96 190 48 46',
      svg: `<path d="M101 195 Q120 205 139 195 L120 232 Z" fill="url(#@g-rouge)" stroke="#7a1418" stroke-width="2.2"/>
        <path d="M104 199 Q120 207 136 199" stroke="#7a1418" stroke-width="1.4" fill="none" opacity=".5"/>
        <circle cx="113" cy="206" r="2" fill="#fff"/><circle cx="127" cy="206" r="2" fill="#fff"/>
        <circle cx="120" cy="214" r="2" fill="#fff"/><circle cx="114" cy="219" r="1.6" fill="#fff"/>
        <circle cx="126" cy="219" r="1.6" fill="#fff"/><circle cx="120" cy="225" r="1.6" fill="#fff"/>`,
    },

    // ---------- Main (dans la main droite : coordonnées du bras au repos) ----------
    {
      id: 'crayon', article: 'mon', nom: 'Crayon géant', emplacement: 'main', prix: { bronze: 1 }, vue: '136 180 58 72',
      svg: `<g transform="translate(152 239) rotate(32)">
        <rect x="-5" y="-42" width="10" height="42" fill="url(#@g-jaune)" stroke="#9a6a00" stroke-width="1.8"/>
        <path d="M-1.7 -42 V0 M1.7 -42 V0" stroke="#d99a00" stroke-width="1"/>
        <path d="M-5 -42 L5 -42 L0 -55 Z" fill="#f3d2a2" stroke="#9a6a00" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M-1.9 -50 L1.9 -50 L0 -55 Z" fill="#333"/>
        <rect x="-5.5" y="0" width="11" height="5" fill="#c9ccd2" stroke="#777" stroke-width="1.4"/>
        <rect x="-5" y="5" width="10" height="7" rx="2.5" fill="#f58aa8" stroke="#b5476a" stroke-width="1.6"/>
      </g>`,
    },
    {
      id: 'loupe', article: 'ma', nom: 'Loupe', emplacement: 'main', prix: { argent: 1 }, vue: '136 172 62 76',
      svg: `<g transform="translate(152 239) rotate(26)">
        <rect x="-3.5" y="-26" width="7" height="32" rx="3.5" fill="url(#@g-bois)" stroke="#3a240f" stroke-width="1.8"/>
        <circle cx="0" cy="-40" r="14" fill="url(#@g-verre)" stroke="url(#@g-or)" stroke-width="5"/>
        <circle cx="0" cy="-40" r="14" fill="none" stroke="#8a5d04" stroke-width="1.2" opacity=".7"/>
        <path d="M-7 -45 Q-5 -50 0 -51" stroke="#fff" stroke-width="2.4" fill="none" opacity=".85"/>
      </g>`,
    },
    {
      id: 'baguette', article: 'ma', nom: 'Baguette magique', emplacement: 'main', prix: { or: 1, emeraude: 1 }, vue: '142 186 56 64',
      svg: `<circle cx="173" cy="207" r="17" fill="url(#@g-lueur)"/>
        <path d="M150 242 L172 210" stroke="#3a240f" stroke-width="6"/>
        <path d="M150 242 L172 210" stroke="url(#@g-bois)" stroke-width="3.6"/>
        <path d="${etoile(173, 207, 10, 4.3)}" fill="url(#@g-or)" stroke="#a87408" stroke-width="1.6" stroke-linejoin="round"/>
        <g class="etincelles" fill="#fff6c2">
          <path d="M188 196 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z"/>
          <path d="M160 194 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z"/>
          <path d="M184 220 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1 -2.5 -2.5 -1 2.5 -1 Z"/>
        </g>`,
    },
  ];
  const PAR_ID = Object.fromEntries(CATALOGUE.map((a) => [a.id, a]));

  // ==========================================================
  //  Dessin (les « @ » deviennent un préfixe unique par renard)
  // ==========================================================

  const DEFS = `
    <radialGradient id="@g-tete" cx="42%" cy="34%" r="70%"><stop offset="0" stop-color="#ffad5c"/><stop offset=".55" stop-color="#f07f2c"/><stop offset="1" stop-color="#c9561a"/></radialGradient>
    <linearGradient id="@g-corps" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#cf5c1c"/><stop offset=".35" stop-color="#f58a36"/><stop offset=".7" stop-color="#ee7a2a"/><stop offset="1" stop-color="#c4521a"/></linearGradient>
    <linearGradient id="@g-oreille" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e06f26"/><stop offset="1" stop-color="#f7934a"/></linearGradient>
    <linearGradient id="@g-oreille-int" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9a08a"/><stop offset="1" stop-color="#fbd9c4"/></linearGradient>
    <linearGradient id="@g-creme" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fffaf2"/><stop offset="1" stop-color="#f1d6b8"/></linearGradient>
    <linearGradient id="@g-sombre" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6a4129"/><stop offset="1" stop-color="#2f1a10"/></linearGradient>
    <radialGradient id="@g-iris" cx="50%" cy="78%" r="70%"><stop offset="0" stop-color="#d08a3c"/><stop offset=".45" stop-color="#7a3d17"/><stop offset="1" stop-color="#1e0e06"/></radialGradient>
    <radialGradient id="@g-nez" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#6b4433"/><stop offset="1" stop-color="#140905"/></radialGradient>
    <radialGradient id="@g-joue"><stop offset="0" stop-color="#ff7d6b" stop-opacity=".6"/><stop offset="1" stop-color="#ff7d6b" stop-opacity="0"/></radialGradient>
    <radialGradient id="@g-ombre"><stop offset="0" stop-color="#5a2e10" stop-opacity=".32"/><stop offset="1" stop-color="#5a2e10" stop-opacity="0"/></radialGradient>
    <linearGradient id="@g-queue" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stop-color="#c9561a"/><stop offset=".5" stop-color="#f58a36"/><stop offset="1" stop-color="#ffa556"/></linearGradient>
    <linearGradient id="@g-or" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".45" stop-color="#f6c433"/><stop offset="1" stop-color="#c98a0c"/></linearGradient>
    <linearGradient id="@g-bleu" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5a9cf0"/><stop offset="1" stop-color="#2b5fb4"/></linearGradient>
    <linearGradient id="@g-rouge" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#c8262c"/></linearGradient>
    <linearGradient id="@g-violet" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#5b33a8"/><stop offset=".5" stop-color="#8a5cf0"/><stop offset="1" stop-color="#4a2890"/></linearGradient>
    <linearGradient id="@g-jaune" x1="0" x2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#f2b705"/></linearGradient>
    <linearGradient id="@g-bois" x1="0" x2="1"><stop offset="0" stop-color="#9a6a3c"/><stop offset="1" stop-color="#5c3a1c"/></linearGradient>
    <radialGradient id="@g-lueur"><stop offset="0" stop-color="#fff3a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe066" stop-opacity="0"/></radialGradient>
    <linearGradient id="@g-verre" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#e6f4ff" stop-opacity=".55"/><stop offset="1" stop-color="#9ccbf0" stop-opacity=".2"/></linearGradient>
    <linearGradient id="@g-rose-verre" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffd6ea" stop-opacity=".6"/><stop offset="1" stop-color="#ff7ab8" stop-opacity=".3"/></linearGradient>
    <linearGradient id="@g-fume" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4a4f5c"/><stop offset="1" stop-color="#14161c"/></linearGradient>`;

  const TETE_CONTOUR = 'M131 97 C154 99 173 112 179 134 L193 146 L184 152 L198 164 L176 167 C163 183 143 194 120 194 C97 194 77 183 64 167 L42 164 L56 152 L47 146 L61 134 C67 112 86 99 108 98 L113 87 L119 96 L125 85 Z';

  function accessoires(emplacement) {
    return CATALOGUE.filter((a) => a.emplacement === emplacement)
      .map((a) => `<g class="accessoire" data-acc="${a.id}" style="display:none">${a.svg}</g>`).join('');
  }

  const CORPS_SVG = () => `
    <ellipse data-p="ombre" cx="120" cy="287" rx="50" ry="8" fill="url(#@g-ombre)" style="transform-origin:120px 287px"/>
    <g data-p="perso" style="transform-origin:120px 285px" stroke-linejoin="round" stroke-linecap="round">
      <g data-p="queue" style="transform-origin:136px 250px">
        <path d="M134 254 C162 267 203 254 210 216 L214 209 L209 205 C211 186 202 166 186 150 C192 178 186 206 162 226 C152 234 142 240 134 246 Z" fill="url(#@g-queue)" stroke="#6b3416" stroke-width="2.6"/>
        <path d="M186 150 C198 160 207 174 209 192 L203 188 L199 196 L193 187 L187 191 C190 177 189 163 186 150 Z" fill="url(#@g-creme)" stroke="#6b3416" stroke-width="2.2"/>
        <path d="M148 238 C170 228 186 212 194 194 M156 247 C178 242 196 230 204 214" fill="none" stroke="#b9501a" stroke-width="1.6" opacity=".55"/>
        <path d="M156 226 C174 212 184 198 188 184" fill="none" stroke="#fff" stroke-width="2" opacity=".3"/>
      </g>
      <g>
        <rect x="101" y="249" width="15" height="29" rx="7" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2"/>
        <ellipse cx="107" cy="280" rx="12.5" ry="6.8" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2"/>
        <path d="M102 278 L102 283 M107 277 L107 284 M112 278 L112 283" stroke="#7d5238" stroke-width="1.3"/>
        <rect x="124" y="249" width="15" height="29" rx="7" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2"/>
        <ellipse cx="133" cy="280" rx="12.5" ry="6.8" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2"/>
        <path d="M128 278 L128 283 M133 277 L133 284 M138 278 L138 283" stroke="#7d5238" stroke-width="1.3"/>
      </g>
      <g data-p="corps" style="transform-origin:120px 262px">
        <path d="M97 196 C91 214 91 244 100 258 C110 268 130 268 140 258 C149 244 149 214 143 196 C134 189 106 189 97 196 Z" fill="url(#@g-corps)" stroke="#6b3416" stroke-width="2.6"/>
        <path d="M104 197 L109 206 L114 199 L120 208 L126 199 L131 206 L136 197 C141 216 139 248 120 256 C101 248 99 216 104 197 Z" fill="url(#@g-creme)"/>
        <path d="M112 226 L116 232 M124 232 L128 226 M114 242 L118 247 M122 247 L126 242" stroke="#e2bc96" stroke-width="1.4"/>
        <ellipse cx="120" cy="199" rx="24" ry="7" fill="#6b2c0a" opacity=".22"/>
        <path d="M98 208 C95 224 95 240 100 251" fill="none" stroke="#fff" stroke-width="2.2" opacity=".3"/>
        ${accessoires('cou')}
      </g>
      <g data-p="tete" style="transform-origin:120px 192px">
        <g data-p="oreille-g" style="transform-origin:92px 108px">
          <path d="M80 119 L65 58 L111 102 Z" fill="url(#@g-oreille)" stroke="#6b3416" stroke-width="2.6"/>
          <path d="M86 111 L74 74 L102 102 Z" fill="url(#@g-oreille-int)"/>
          <path d="M84 108 L80 94 M89 107 L86 92 M94 106 L92 96" stroke="#fffaf2" stroke-width="1.8"/>
          <path d="M70 78 L65 58 L83 74 Z" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2.2"/>
        </g>
        <g data-p="oreille-d" style="transform-origin:148px 108px">
          <path d="M160 119 L175 58 L129 102 Z" fill="url(#@g-oreille)" stroke="#6b3416" stroke-width="2.6"/>
          <path d="M154 111 L166 74 L138 102 Z" fill="url(#@g-oreille-int)"/>
          <path d="M156 108 L160 94 M151 107 L154 92 M146 106 L148 96" stroke="#fffaf2" stroke-width="1.8"/>
          <path d="M170 78 L175 58 L157 74 Z" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2.2"/>
        </g>
        <path d="${TETE_CONTOUR}" fill="url(#@g-tete)"/>
        <path d="M179 134 L193 146 L184 152 L198 164 L176 167 C178 156 180 145 179 134 Z" fill="url(#@g-creme)"/>
        <path d="M61 134 L47 146 L56 152 L42 164 L64 167 C62 156 60 145 61 134 Z" fill="url(#@g-creme)"/>
        <path d="M82 157 C92 147 108 149 120 159 C132 149 148 147 158 157 C152 179 137 192 120 192 C103 192 88 179 82 157 Z" fill="url(#@g-creme)"/>
        <path d="${TETE_CONTOUR}" fill="none" stroke="#6b3416" stroke-width="2.8"/>
        <path d="M68 130 C73 115 88 104 104 101" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>
        <path d="M114 104 L117 112 M124 103 L122 111" stroke="#c9561a" stroke-width="1.6" opacity=".6"/>
        <ellipse cx="85" cy="164" rx="11" ry="7" fill="url(#@g-joue)"/>
        <ellipse cx="155" cy="164" rx="11" ry="7" fill="url(#@g-joue)"/>
        <g data-p="regard">
          <g data-p="yeux" data-e="yeux-normaux" style="transform-origin:120px 141px">
            <ellipse cx="98" cy="141" rx="11" ry="13.5" fill="url(#@g-iris)" stroke="#1e0e06" stroke-width="1.5"/>
            <ellipse cx="142" cy="141" rx="11" ry="13.5" fill="url(#@g-iris)" stroke="#1e0e06" stroke-width="1.5"/>
            <ellipse cx="98" cy="142" rx="5.4" ry="7" fill="#120804"/>
            <ellipse cx="142" cy="142" rx="5.4" ry="7" fill="#120804"/>
            <circle cx="102" cy="135.5" r="4.2" fill="#fff"/>
            <circle cx="146" cy="135.5" r="4.2" fill="#fff"/>
            <circle cx="94.5" cy="147" r="1.9" fill="#fff" opacity=".9"/>
            <circle cx="138.5" cy="147" r="1.9" fill="#fff" opacity=".9"/>
          </g>
        </g>
        <g data-e="yeux-heureux" style="display:none">
          <path d="M87 145 Q98 129 109 145" stroke="#2a1206" stroke-width="5" fill="none"/>
          <path d="M131 145 Q142 129 153 145" stroke="#2a1206" stroke-width="5" fill="none"/>
        </g>
        <g data-e="sourcils" style="display:none">
          <path d="M86 120 Q96 119 106 123" fill="none" stroke="#5a2e14" stroke-width="4"/>
          <path d="M154 120 Q144 119 134 123" fill="none" stroke="#5a2e14" stroke-width="4"/>
        </g>
        <path d="M111 158 Q120 152 129 158 Q126 167 120 168 Q114 167 111 158 Z" fill="url(#@g-nez)"/>
        <ellipse cx="116.5" cy="157.5" rx="3" ry="1.5" fill="#fff" opacity=".55"/>
        <circle cx="105" cy="168" r="1.3" fill="#c29372"/><circle cx="101" cy="164" r="1.3" fill="#c29372"/>
        <circle cx="135" cy="168" r="1.3" fill="#c29372"/><circle cx="139" cy="164" r="1.3" fill="#c29372"/>
        <path data-e="bouche-normale" d="M111 172 Q115.5 177 120 172 Q124.5 177 129 172" stroke="#2a1206" stroke-width="2.6" fill="none"/>
        <g data-e="bouche-ouverte" style="display:none">
          <path d="M108 170 Q120 174 132 170 Q130 188 120 188 Q110 188 108 170 Z" fill="#5e1f1f" stroke="#2a1206" stroke-width="2"/>
          <path d="M113 182 Q120 177 127 182 Q125 187 120 187 Q115 187 113 182 Z" fill="#f28b8b"/>
        </g>
        <g data-e="bouche-confiante" style="display:none">
          <path d="M108 171 Q120 174 132 171 Q128 184 120 184 Q112 184 108 171 Z" fill="#5e1f1f" stroke="#2a1206" stroke-width="2.2"/>
          <path d="M114 180.5 Q120 177 126 180.5 Q124 183.5 120 183.5 Q116 183.5 114 180.5 Z" fill="#f28b8b"/>
        </g>
        ${accessoires('yeux')}
        ${accessoires('tete')}
      </g>
      <g data-p="bras-g" style="transform-origin:100px 204px">
        <path d="M100 204 L88 238" stroke="#6b3416" stroke-width="16.5"/>
        <path d="M100 204 L88 238" stroke="#ee7a2a" stroke-width="11.5"/>
        <path d="M97 207 L90 228" stroke="#ffb06a" stroke-width="3" opacity=".7"/>
        <circle cx="88" cy="239" r="8" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2"/>
        <circle cx="86" cy="236.5" r="2" fill="#fff" opacity=".22"/>
      </g>
      <g data-p="bras-d" style="transform-origin:140px 204px">
        ${accessoires('main')}
        <path d="M140 204 L152 238" stroke="#6b3416" stroke-width="16.5"/>
        <path d="M140 204 L152 238" stroke="#ee7a2a" stroke-width="11.5"/>
        <path d="M143 207 L150 228" stroke="#ffb06a" stroke-width="3" opacity=".5"/>
        <circle cx="152" cy="239" r="8" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2"/>
        <circle cx="150" cy="236.5" r="2" fill="#fff" opacity=".22"/>
      </g>
    </g>`;

  let compteur = 0;
  const avecPrefixe = (texte, p) => texte.replace(/@/g, p);

  function svgRenard(p) {
    return avecPrefixe(`<svg class="renard" viewBox="0 0 240 300" role="img" aria-label="Le renard" style="overflow:visible">
      <defs>${DEFS}</defs>${CORPS_SVG()}</svg>`, p);
  }

  // Petite image d'un accessoire seul (pour la garde-robe)
  function vignette(id) {
    const a = PAR_ID[id];
    if (!a) return '';
    const p = `mv${++compteur}-`;
    return avecPrefixe(`<svg class="vignette-acc" viewBox="${a.vue}" role="img" aria-label="${a.nom}">
      <defs>${DEFS}</defs><g stroke-linejoin="round" stroke-linecap="round">${a.svg}</g></svg>`, p);
  }

  // ==========================================================
  //  Animations
  // ==========================================================

  const T = (s) => ({ transform: s });
  const hasard = (a, b) => a + Math.random() * (b - a);

  const EXPRESSIONS = {
    normal:    { 'yeux-normaux': 1, 'yeux-heureux': 0, sourcils: 0, 'bouche-normale': 1, 'bouche-ouverte': 0, 'bouche-confiante': 0 },
    joie:      { 'yeux-normaux': 0, 'yeux-heureux': 1, sourcils: 0, 'bouche-normale': 0, 'bouche-ouverte': 1, 'bouche-confiante': 0 },
    determine: { 'yeux-normaux': 1, 'yeux-heureux': 0, sourcils: 1, 'bouche-normale': 0, 'bouche-ouverte': 0, 'bouche-confiante': 1 },
  };

  // Chaque réaction reçoit { P, jouer, expression } et ne bloque jamais le jeu.
  const BANQUE = {
    bon: {
      saut({ P, jouer, expression }) {
        expression('joie', 1000);
        jouer(P.perso, [
          { transform: 'translateY(0) scale(1,1)', offset: 0 },
          { transform: 'translateY(0) scale(1.08,.9)', offset: 0.15 },
          { transform: 'translateY(-48px) scale(.95,1.07)', offset: 0.45 },
          { transform: 'translateY(0) scale(1.07,.93)', offset: 0.75 },
          { transform: 'translateY(0) scale(1,1)', offset: 1 },
        ], 750);
        jouer(P.ombre, [T('scale(1)'), T('scale(1)'), T('scale(.6)'), T('scale(1)'), T('scale(1)')], 750);
        jouer(P['bras-g'], [T('rotate(0)'), T('rotate(100deg)'), T('rotate(100deg)'), T('rotate(0)')], 900);
        jouer(P['bras-d'], [T('rotate(0)'), T('rotate(-100deg)'), T('rotate(-100deg)'), T('rotate(0)')], 900);
        jouer(P.queue, [T('rotate(0)'), T('rotate(18deg)'), T('rotate(-8deg)'), T('rotate(0)')], 750);
      },
      salut({ P, jouer, expression }) {
        expression('joie', 1300);
        jouer(P['bras-d'], [T('rotate(0)'), T('rotate(-118deg)'), T('rotate(-95deg)'), T('rotate(-118deg)'),
          T('rotate(-95deg)'), T('rotate(-118deg)'), T('rotate(0)')], 1300);
        jouer(P.tete, [T('rotate(0)'), T('rotate(7deg)'), T('rotate(7deg)'), T('rotate(0)')], 1300);
        jouer(P.perso, [T('translateY(0)'), T('translateY(-6px)'), T('translateY(0)'), T('translateY(-6px)'), T('translateY(0)')], 900);
      },
      pirouette({ P, jouer, expression }) {
        expression('joie', 1100);
        jouer(P.perso, [T('translateY(0) scaleX(1)'), T('translateY(-28px) scaleX(-1)'), T('translateY(-20px) scaleX(1)'), T('translateY(0) scaleX(1)')], 900, { easing: 'ease-out' });
        jouer(P.ombre, [T('scale(1)'), T('scale(.7)'), T('scale(.8)'), T('scale(1)')], 900);
        jouer(P['bras-g'], [T('rotate(0)'), T('rotate(105deg)'), T('rotate(105deg)'), T('rotate(0)')], 1000);
        jouer(P['bras-d'], [T('rotate(0)'), T('rotate(-105deg)'), T('rotate(-105deg)'), T('rotate(0)')], 1000);
      },
      victoire({ P, jouer, expression }) {
        expression('joie', 1300);
        jouer(P['bras-g'], [T('rotate(0)'), T('rotate(120deg)'), T('rotate(102deg)'), T('rotate(120deg)'), T('rotate(102deg)'), T('rotate(0)')], 1300);
        jouer(P['bras-d'], [T('rotate(0)'), T('rotate(-120deg)'), T('rotate(-102deg)'), T('rotate(-120deg)'), T('rotate(-102deg)'), T('rotate(0)')], 1300);
        jouer(P.perso, [T('translateY(0)'), T('translateY(-14px)'), T('translateY(0)'), T('translateY(-14px)'), T('translateY(0)')], 800);
        jouer(P.queue, [T('rotate(-15deg)'), T('rotate(20deg)'), T('rotate(-15deg)'), T('rotate(20deg)'), T('rotate(0)')], 900);
      },
    },
    // Erreurs : encouragement et détermination (« Lâche pas! »)
    erreur: {
      poing({ P, jouer, expression }) {
        expression('determine', 1500);
        jouer(P['bras-d'], [T('rotate(0)'), T('rotate(-112deg)'), T('rotate(-80deg)'), T('rotate(-112deg)'),
          T('rotate(-80deg)'), T('rotate(-112deg)'), T('rotate(0)')], 1500);
        jouer(P.perso, [T('translateY(0)'), T('translateY(-8px)'), T('translateY(0)'), T('translateY(-8px)'), T('translateY(0)'), T('translateY(0)')], 1300);
        jouer(P.tete, [T('rotate(0)'), T('rotate(-5deg)'), T('rotate(0)'), T('rotate(-5deg)'), T('rotate(0)')], 1300);
        jouer(P.queue, [T('rotate(0)'), T('rotate(16deg)'), T('rotate(-6deg)'), T('rotate(16deg)'), T('rotate(0)')], 1300);
      },
      prets({ P, jouer, expression }) {
        expression('determine', 1500);
        jouer(P['bras-g'], [T('rotate(0)'), T('rotate(-42deg)'), T('rotate(-42deg)'), T('rotate(-42deg)'), T('rotate(0)')], 1500);
        jouer(P['bras-d'], [T('rotate(0)'), T('rotate(42deg)'), T('rotate(42deg)'), T('rotate(42deg)'), T('rotate(0)')], 1500);
        jouer(P.perso, [
          { transform: 'translateY(0) scale(1,1)', offset: 0 },
          { transform: 'translateY(0) scale(1.05,.95)', offset: 0.2 },
          { transform: 'translateY(-12px) scale(.98,1.03)', offset: 0.35 },
          { transform: 'translateY(0) scale(1.05,.95)', offset: 0.5 },
          { transform: 'translateY(-12px) scale(.98,1.03)', offset: 0.65 },
          { transform: 'translateY(0) scale(1,1)', offset: 0.8 },
          { transform: 'translateY(0) scale(1,1)', offset: 1 },
        ], 1500);
        jouer(P.tete, [T('rotate(0)'), T('rotate(4deg)'), T('rotate(-4deg)'), T('rotate(4deg)'), T('rotate(0)')], 1500);
      },
      pointe({ P, jouer, expression }) {
        expression('determine', 1600);
        jouer(P['bras-g'], [T('rotate(0)'), T('rotate(78deg)'), T('rotate(70deg)'), T('rotate(78deg)'), T('rotate(78deg)'), T('rotate(0)')], 1600);
        jouer(P.tete, [
          { transform: 'rotate(0) translateY(0)', offset: 0 },
          { transform: 'rotate(-7deg) translateY(0)', offset: 0.25 },
          { transform: 'rotate(-7deg) translateY(3px)', offset: 0.5 },
          { transform: 'rotate(-7deg) translateY(0)', offset: 0.62 },
          { transform: 'rotate(-7deg) translateY(3px)', offset: 0.74 },
          { transform: 'rotate(0) translateY(0)', offset: 1 },
        ], 1600);
        jouer(P.regard, [T('translateX(0)'), T('translateX(-4px)'), T('translateX(-4px)'), T('translateX(0)')], 1600);
        jouer(P.queue, [T('rotate(0)'), T('rotate(12deg)'), T('rotate(12deg)'), T('rotate(0)')], 1600);
      },
    },
    medaille: {
      danse({ P, jouer, expression }) {
        expression('joie', 2100);
        jouer(P.perso, [
          T('rotate(0) translateY(0)'), T('rotate(-10deg) translateY(-12px)'), T('rotate(0) translateY(0)'),
          T('rotate(10deg) translateY(-12px)'), T('rotate(0) translateY(0)'), T('rotate(-10deg) translateY(-12px)'),
          T('rotate(0) translateY(0)'), T('rotate(10deg) translateY(-12px)'), T('rotate(0) translateY(0)'),
          T('rotate(0) translateY(-40px)'), T('rotate(0) translateY(0)'),
        ], 2100);
        jouer(P['bras-g'], [T('rotate(0)'), T('rotate(100deg)'), T('rotate(20deg)'), T('rotate(100deg)'), T('rotate(20deg)'),
          T('rotate(100deg)'), T('rotate(120deg)'), T('rotate(0)')], 2100);
        jouer(P['bras-d'], [T('rotate(0)'), T('rotate(-20deg)'), T('rotate(-100deg)'), T('rotate(-20deg)'), T('rotate(-100deg)'),
          T('rotate(-20deg)'), T('rotate(-120deg)'), T('rotate(0)')], 2100);
        jouer(P.queue, [T('rotate(-15deg)'), T('rotate(20deg)'), T('rotate(-15deg)'), T('rotate(20deg)'),
          T('rotate(-15deg)'), T('rotate(20deg)'), T('rotate(0)')], 2100);
        jouer(P.ombre, [T('scale(1)'), T('scale(1)'), T('scale(1)'), T('scale(1)'), T('scale(.55)'), T('scale(1)')], 2100);
      },
    },
    // Un petit « hmm » (action pas encore permise, défi raté…) : il regarde autour, sans rien dire.
    hmm: {
      autour({ P, jouer }) {
        jouer(P.regard, [T('translateX(0)'), T('translateX(-4px)'), T('translateX(-4px)'), T('translateX(4px)'), T('translateX(4px)'), T('translateX(0)')], 1800);
        jouer(P.tete, [T('rotate(0)'), T('rotate(-5deg)'), T('rotate(-5deg)'), T('rotate(5deg)'), T('rotate(5deg)'), T('rotate(0)')], 1800);
      },
    },
  };

  const MESSAGES = {
    bon: ['Bravo!', 'Super!', 'Wow, bien joué!', 'Excellent!', 'Tu l’as eu!', 'Yé!', 'Bien vu!'],
    erreur: ['Lâche pas, tu vas l’avoir!', 'Continue, t’es capable!', 'Allez, on réessaie!', 'Regarde encore, tu vas trouver!',
      'Je crois en toi!', 'Presque! Encore un petit effort!'],
    medaille: ['Youpi! On danse!', 'Wow! Tu es une vedette!', 'Champion! Champion!'],
    hmm: [],
  };

  // ==========================================================
  //  Un renard
  // ==========================================================

  function creer(conteneur, options = {}) {
    const p = `m${++compteur}-`;
    const racine = document.createElement('div');
    racine.className = `mascotte ${['grand', 'mini'].includes(options.taille) ? options.taille : 'petit'}`;
    racine.innerHTML = `<div class="mascotte-bulle" aria-live="polite"></div>${svgRenard(p)}`;
    conteneur.appendChild(racine);
    const svg = racine.querySelector('svg');
    const bulle = racine.querySelector('.mascotte-bulle');
    const P = {};
    svg.querySelectorAll('[data-p]').forEach((el) => { P[el.dataset.p] = el; });

    const boucles = [];
    const minuteries = new Set();
    const vivant = () => racine.isConnected;
    function plusTard(fn, ms) {
      const t = setTimeout(() => { minuteries.delete(t); if (vivant()) fn(); }, ms);
      minuteries.add(t);
    }

    // ---------- Repos ----------
    const boucle = { iterations: Infinity, easing: 'ease-in-out' };
    boucles.push(
      P.corps.animate([T('scaleY(1)'), T('scaleY(1.025)'), T('scaleY(1)')], { ...boucle, duration: 3000 }),
      P.tete.animate([T('translateY(0)'), T('translateY(1.6px)'), T('translateY(0)')], { ...boucle, duration: 3000 }),
      P.queue.animate([T('rotate(-5deg)'), T('rotate(7deg)'), T('rotate(-5deg)')], { ...boucle, duration: 2600 }),
      P['bras-g'].animate([T('rotate(0deg)'), T('rotate(3deg)'), T('rotate(0deg)')], { ...boucle, duration: 3000 }),
      P['bras-d'].animate([T('rotate(0deg)'), T('rotate(-3deg)'), T('rotate(0deg)')], { ...boucle, duration: 3000 }),
    );
    svg.querySelectorAll('.etincelles path').forEach((e, i) => {
      e.style.transformBox = 'fill-box';
      e.style.transformOrigin = 'center';
      boucles.push(e.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.3)' }],
        { duration: 1400, delay: i * 450, iterations: Infinity }));
    });

    let expressionCourante = 'normal';
    function montrerExpression(nom) {
      expressionCourante = nom;
      for (const [cle, visible] of Object.entries(EXPRESSIONS[nom])) {
        const el = svg.querySelector(`[data-e="${cle}"]`);
        if (el) el.style.display = visible ? '' : 'none';
      }
    }

    function cligner() {
      if (expressionCourante !== 'joie') {
        P.yeux.animate([T('scaleY(1)'), T('scaleY(.08)'), T('scaleY(1)')], { duration: 170 });
      }
      plusTard(cligner, hasard(2200, 5200));
    }
    plusTard(cligner, hasard(800, 2500));

    function bougerOreille() {
      const [el, angle] = Math.random() < 0.5 ? [P['oreille-g'], -16] : [P['oreille-d'], 16];
      el.animate([T('rotate(0)'), T(`rotate(${angle}deg)`), T('rotate(0)')], { duration: 320, easing: 'ease-out' });
      plusTard(bougerOreille, hasard(4000, 9000));
    }
    plusTard(bougerOreille, hasard(2000, 5000));

    // ---------- Réactions ----------
    let enCours = [];
    let finExpression = null;
    let finBulle = null;
    const derniers = {};

    function choisir(liste, cle) {
      if (!liste.length) return null;
      if (liste.length === 1) return liste[0];
      let x;
      do { x = liste[Math.floor(Math.random() * liste.length)]; } while (x === derniers[cle]);
      derniers[cle] = x;
      return x;
    }

    function dire(texte, duree = 2600) {
      clearTimeout(finBulle);
      if (!texte) { bulle.classList.remove('visible'); return; }
      bulle.textContent = texte;
      bulle.classList.remove('visible', 'pop');
      void bulle.offsetWidth;
      bulle.classList.add('visible', 'pop');
      finBulle = setTimeout(() => bulle.classList.remove('visible'), duree);
    }

    function reagir(type) {
      const banque = BANQUE[type];
      if (!banque || !vivant()) return;
      enCours.forEach((a) => a.cancel());
      enCours = [];
      clearTimeout(finExpression);
      const outils = {
        P,
        jouer(el, images, duree, opts = {}) {
          const a = el.animate(images, { duration: duree, easing: 'ease-in-out', ...opts });
          enCours.push(a);
          return a;
        },
        expression(nom, duree) {
          montrerExpression(nom);
          finExpression = setTimeout(() => montrerExpression('normal'), duree);
        },
      };
      banque[choisir(Object.keys(banque), `a-${type}`)](outils);
      if (type !== 'hmm') dire(choisir(MESSAGES[type], `m-${type}`));
    }

    function habiller(porte = {}) {
      svg.querySelectorAll('.accessoire').forEach((g) => { g.style.display = 'none'; });
      for (const id of Object.values(porte || {})) {
        const g = id && svg.querySelector(`.accessoire[data-acc="${id}"]`);
        if (g) g.style.display = '';
      }
    }

    function detruire() {
      boucles.forEach((a) => a.cancel());
      minuteries.forEach(clearTimeout);
      racine.remove();
    }

    habiller(options.porte);
    const instance = { el: racine, reagir, habiller, dire, detruire };
    tous.add(instance);
    return instance;
  }

  // ==========================================================
  //  Dans les activités : un renard dans chaque panneau de droite
  //  et sur l'écran de fin; il réagit aux sons du jeu.
  // ==========================================================

  const tous = new Set();
  const HAUTEUR_MAX = 150; // hauteur du petit renard dans le panneau (px)
  const HAUTEUR_MIN = 76;
  const REACTION = { bon: 'bon', reussite: 'bon', erreur: 'erreur', oups: 'hmm', medaille: 'medaille', pierre: 'medaille' };
  let dernier = { type: null, quand: 0 };

  function porteCourant() {
    try {
      const j = typeof Jeu !== 'undefined' && Jeu.joueurCourant();
      return j ? Jeu.mascotte(j.id).porte : {};
    } catch (err) {
      return {};
    }
  }

  const estVisible = (el) => el.isConnected && el.getClientRects().length > 0;

  function surEvenement(ev) {
    const type = REACTION[ev.detail];
    if (!type) return;
    dernier = { type, quand: Date.now() };
    for (const r of tous) {
      if (!r.el.isConnected) { tous.delete(r); continue; }
      if (estVisible(r.el)) r.reagir(type);
    }
  }

  let branche = false;
  function brancherActivite() {
    if (branche) return;
    branche = true;
    const porte = porteCourant();
    const zones = [];
    document.querySelectorAll('.panneau').forEach((panneau) => {
      const zone = document.createElement('div');
      zone.className = 'zone-mascotte';
      panneau.appendChild(zone);
      creer(zone, { porte });
      zones.push(zone);
    });
    // Le renard prend la place qui reste sous le panneau, sans jamais faire défiler la page :
    // il rapetisse s'il manque de place, et se cache s'il en manque trop.
    const ajuster = () => {
      for (const zone of zones) {
        if (!estVisible(zone.parentElement)) continue;
        const z = (typeof Jeu !== 'undefined' && Jeu.zoom) ? Jeu.zoom() : 1;
        const haut = zone.getBoundingClientRect().top + window.scrollY;
        const place = Math.floor((window.innerHeight - haut) / z - 10);
        const h = Math.min(HAUTEUR_MAX, place);
        const voulu = h >= HAUTEUR_MIN ? h : 0;
        if (Math.abs((zone._h || 0) - voulu) > 1) {
          zone._h = voulu;
          zone.style.height = `${voulu}px`;
          zone.classList.toggle('cachee', voulu === 0);
        }
      }
    };
    ajuster();
    setInterval(ajuster, 300);
    window.addEventListener('resize', ajuster);

    // Écran de fin : son contenu est refait chaque fois; on y remet un renard qui fête (ou encourage).
    const fin = document.getElementById('ecran-fin');
    if (fin) {
      let renardFin = null;
      const verifier = () => {
        if (fin.hidden || !fin.firstElementChild) return;
        if (renardFin && renardFin.el.isConnected) return;
        const zone = document.createElement('div');
        zone.className = 'zone-mascotte-fin';
        fin.appendChild(zone);
        renardFin = creer(zone, { porte: porteCourant(), taille: 'grand' });
        // Le son de la fin a pu jouer juste avant l'affichage : on le rejoue pour ce renard.
        if (dernier.type && Date.now() - dernier.quand < 1500) {
          const type = dernier.type === 'hmm' ? 'erreur' : dernier.type;
          setTimeout(() => renardFin.reagir(type), 120);
        }
      };
      new MutationObserver(verifier).observe(fin, { attributes: true, attributeFilter: ['hidden'], childList: true });
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('jeu:evenement', surEvenement);
    const auto = () => {
      if (!document.body || !document.body.hasAttribute('data-mascotte')) return;
      const go = () => brancherActivite();
      if (typeof Jeu !== 'undefined' && Jeu.demarrer) Jeu.demarrer().then(go, go); else go();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  }

  return { CATALOGUE, EMPLACEMENTS, PAR_ID, creer, vignette, brancherActivite };
})();

if (typeof module !== 'undefined') module.exports = Mascotte;
