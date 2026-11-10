/* ==========================================================
   Les personnages (renard, lapin, grenouille, dragon, chat)
   ----------------------------------------------------------
   Tous partagent le même squelette (js/mascotte.js) : mêmes parties,
   mêmes pivots, mêmes animations, mêmes yeux et mêmes bouches.
   Chaque personnage donne seulement :
   - ses couleurs (c) : les dégradés sont fabriqués à partir d'elles;
   - ses morceaux de dessin (SVG, viewBox 240 × 300) : oreilles, tête,
     corps, queue, et au besoin jambes, bouche, ailes;
   - les décalages de ses accessoires (ex. la grenouille a la tête plus basse).
   Repères communs : yeux à (98, 141) et (142, 141); cou vers (120, 194);
   épaules (100, 204) et (140, 204); pieds au sol à y ≈ 287.
   Les « @ » deviennent un préfixe unique (identifiants des dégradés).
   ========================================================== */
'use strict';

const PERSONNAGES = (() => {
  const P = {};

  // ---------------------------------------------------------- Renard
  P.renard = {
    id: 'renard', nom: 'Renard', le: 'le renard', du: 'du renard', salut: 'Salut! On se fait beau?',
    c: {
      fourrure: ['#ffad5c', '#f07f2c', '#c9561a'],
      corps: ['#cf5c1c', '#f58a36', '#ee7a2a', '#c4521a'],
      queue: ['#c9561a', '#f58a36', '#ffa556'],
      oreille: ['#e06f26', '#f7934a'],
      oreilleInt: ['#e9a08a', '#fbd9c4'],
      creme: ['#fffaf2', '#f1d6b8'],
      pattes: ['#6a4129', '#2f1a10'],
      iris: ['#d08a3c', '#7a3d17', '#1e0e06'],
      nez: ['#6b4433', '#140905'],
      contour: '#6b3416', pattesContour: '#2a160c', orteils: '#7d5238',
      bras: '#ee7a2a', refletBras: '#ffb06a', sourcils: '#5a2e14', ombreCou: '#6b2c0a',
    },
    defs: '<linearGradient id="@g-sombre" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6a4129"/><stop offset="1" stop-color="#2f1a10"/></linearGradient>',
    pivots: { og: '92px 108px', od: '148px 108px' },
    oreilleG: `<path d="M80 119 L65 58 L111 102 Z" fill="url(#@g-oreille)" stroke="#6b3416" stroke-width="2.6"/>
      <path d="M86 111 L74 74 L102 102 Z" fill="url(#@g-oreille-int)"/>
      <path d="M84 108 L80 94 M89 107 L86 92 M94 106 L92 96" stroke="#fffaf2" stroke-width="1.8"/>
      <path d="M70 78 L65 58 L83 74 Z" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2.2"/>`,
    oreilleD: `<path d="M160 119 L175 58 L129 102 Z" fill="url(#@g-oreille)" stroke="#6b3416" stroke-width="2.6"/>
      <path d="M154 111 L166 74 L138 102 Z" fill="url(#@g-oreille-int)"/>
      <path d="M156 108 L160 94 M151 107 L154 92 M146 106 L148 96" stroke="#fffaf2" stroke-width="1.8"/>
      <path d="M170 78 L175 58 L157 74 Z" fill="url(#@g-sombre)" stroke="#2a160c" stroke-width="2.2"/>`,
    queue: `<path d="M134 254 C162 267 203 254 210 216 L214 209 L209 205 C211 186 202 166 186 150 C192 178 186 206 162 226 C152 234 142 240 134 246 Z" fill="url(#@g-queue)" stroke="#6b3416" stroke-width="2.6"/>
      <path d="M186 150 C198 160 207 174 209 192 L203 188 L199 196 L193 187 L187 191 C190 177 189 163 186 150 Z" fill="url(#@g-creme)" stroke="#6b3416" stroke-width="2.2"/>
      <path d="M148 238 C170 228 186 212 194 194 M156 247 C178 242 196 230 204 214" fill="none" stroke="#b9501a" stroke-width="1.6" opacity=".55"/>
      <path d="M156 226 C174 212 184 198 188 184" fill="none" stroke="#fff" stroke-width="2" opacity=".3"/>`,
    corps: `<path d="M97 196 C91 214 91 244 100 258 C110 268 130 268 140 258 C149 244 149 214 143 196 C134 189 106 189 97 196 Z" fill="url(#@g-corps)" stroke="#6b3416" stroke-width="2.6"/>
      <path d="M104 197 L109 206 L114 199 L120 208 L126 199 L131 206 L136 197 C141 216 139 248 120 256 C101 248 99 216 104 197 Z" fill="url(#@g-creme)"/>
      <path d="M112 226 L116 232 M124 232 L128 226 M114 242 L118 247 M122 247 L126 242" stroke="#e2bc96" stroke-width="1.4"/>`,
    tete: (() => {
      const T = 'M131 97 C154 99 173 112 179 134 L193 146 L184 152 L198 164 L176 167 C163 183 143 194 120 194 C97 194 77 183 64 167 L42 164 L56 152 L47 146 L61 134 C67 112 86 99 108 98 L113 87 L119 96 L125 85 Z';
      return `<path d="${T}" fill="url(#@g-tete)"/>
        <path d="M179 134 L193 146 L184 152 L198 164 L176 167 C178 156 180 145 179 134 Z" fill="url(#@g-creme)"/>
        <path d="M61 134 L47 146 L56 152 L42 164 L64 167 C62 156 60 145 61 134 Z" fill="url(#@g-creme)"/>
        <path d="M82 157 C92 147 108 149 120 159 C132 149 148 147 158 157 C152 179 137 192 120 192 C103 192 88 179 82 157 Z" fill="url(#@g-creme)"/>
        <path d="${T}" fill="none" stroke="#6b3416" stroke-width="2.8"/>
        <path d="M68 130 C73 115 88 104 104 101" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>
        <path d="M114 104 L117 112 M124 103 L122 111" stroke="#c9561a" stroke-width="1.6" opacity=".6"/>
        <ellipse cx="85" cy="164" rx="11" ry="7" fill="url(#@g-joue)"/>
        <ellipse cx="155" cy="164" rx="11" ry="7" fill="url(#@g-joue)"/>
        <path d="M111 158 Q120 152 129 158 Q126 167 120 168 Q114 167 111 158 Z" fill="url(#@g-nez)"/>
        <ellipse cx="116.5" cy="157.5" rx="3" ry="1.5" fill="#fff" opacity=".55"/>
        <circle cx="105" cy="168" r="1.3" fill="#c29372"/><circle cx="101" cy="164" r="1.3" fill="#c29372"/>
        <circle cx="135" cy="168" r="1.3" fill="#c29372"/><circle cx="139" cy="164" r="1.3" fill="#c29372"/>`;
    })(),
  };

  // ---------------------------------------------------------- Lapin
  P.lapin = {
    id: 'lapin', nom: 'Lapin', le: 'le lapin', du: 'du lapin', salut: 'Salut! On saute dans les maths?',
    c: {
      fourrure: ['#f6dcbc', '#e0b386', '#b98a5d'],
      corps: ['#bf8f61', '#e8c197', '#dfb385', '#b9885a'],
      queue: ['#fffaf3', '#fffaf3', '#f1e2cf'],
      oreille: ['#d7a578', '#ecc59b'],
      oreilleInt: ['#f39ab3', '#fcd8e1'],
      creme: ['#fffaf3', '#f2e2cd'],
      pattes: ['#fffaf3', '#eadbc8'],
      iris: ['#b07448', '#5a2c12', '#160904'],
      nez: ['#ffb8ca', '#e2688c'],
      contour: '#7a5535', pattesContour: '#7a5535', orteils: '#cdb69c',
      bras: '#e3b98d', refletBras: '#f8dcbd', sourcils: '#6b4426', ombreCou: '#7a4a22',
    },
    pivots: { og: '106px 108px', od: '134px 108px' },
    oreilleG: `<g transform="rotate(-7 106 108)">
        <path d="M99 112 C85 88 81 42 91 22 C99 7 114 12 116 32 C119 56 117 86 114 110 Z" fill="url(#@g-oreille)" stroke="#7a5535" stroke-width="2.6"/>
        <path d="M102 103 C93 82 90 47 96 32 C101 23 109 26 110 39 C112 58 111 82 109 101 Z" fill="url(#@g-oreille-int)"/>
        <path d="M93 34 C95 26 100 22 105 22" fill="none" stroke="#fff" stroke-width="2.2" opacity=".5"/>
      </g>`,
    oreilleD: `<g transform="rotate(10 134 108)">
        <path d="M141 112 C155 88 159 42 149 22 C141 7 126 12 124 32 C121 56 123 86 126 110 Z" fill="url(#@g-oreille)" stroke="#7a5535" stroke-width="2.6"/>
        <path d="M138 103 C147 82 150 47 144 32 C139 23 131 26 130 39 C128 58 129 82 131 101 Z" fill="url(#@g-oreille-int)"/>
      </g>`,
    queue: `<circle cx="155" cy="251" r="14" fill="url(#@g-queue)" stroke="#7a5535" stroke-width="2.4"/>
      <path d="M146 246 Q149 240 155 239 M158 259 Q164 257 167 252" fill="none" stroke="#e3cfb5" stroke-width="1.6"/>
      <circle cx="152" cy="246" r="3" fill="#fff" opacity=".8"/>`,
    corps: `<path d="M97 196 C91 214 91 244 100 258 C110 268 130 268 140 258 C149 244 149 214 143 196 C134 189 106 189 97 196 Z" fill="url(#@g-corps)" stroke="#7a5535" stroke-width="2.6"/>
      <path d="M106 199 Q110 206 114 201 Q118 208 122 201 Q126 206 130 200 Q134 205 135 199 C140 216 138 247 120 255 C102 247 100 216 106 199 Z" fill="url(#@g-creme)"/>
      <path d="M113 228 Q116 231 119 228 M121 240 Q124 243 127 240" fill="none" stroke="#e8d2b8" stroke-width="1.4"/>`,
    jambes: `<rect x="101" y="248" width="15" height="28" rx="7" fill="url(#@g-corps)" stroke="#7a5535" stroke-width="2"/>
      <rect x="124" y="248" width="15" height="28" rx="7" fill="url(#@g-corps)" stroke="#7a5535" stroke-width="2"/>
      <ellipse cx="104" cy="281" rx="16" ry="7" fill="url(#@g-pattes)" stroke="#7a5535" stroke-width="2"/>
      <ellipse cx="136" cy="281" rx="16" ry="7" fill="url(#@g-pattes)" stroke="#7a5535" stroke-width="2"/>
      <path d="M93 279 L93 284 M98 278 L98 285 M142 278 L142 285 M147 279 L147 284" stroke="#cdb69c" stroke-width="1.4"/>
      <ellipse cx="100" cy="279" rx="3" ry="1.8" fill="#f7b6c6"/><ellipse cx="140" cy="279" rx="3" ry="1.8" fill="#f7b6c6"/>`,
    tete: (() => {
      const T = 'M120 100 C155 100 180 122 180 150 C180 158 177 165 172 171 C160 186 142 194 120 194 C98 194 80 186 68 171 C63 165 60 158 60 150 C60 122 85 100 120 100 Z';
      return `<path d="${T}" fill="url(#@g-tete)"/>
        <ellipse cx="107" cy="169" rx="15" ry="12" fill="url(#@g-creme)"/>
        <ellipse cx="133" cy="169" rx="15" ry="12" fill="url(#@g-creme)"/>
        <ellipse cx="120" cy="183" rx="12" ry="8" fill="url(#@g-creme)"/>
        <path d="M108 104 C112 110 112 116 108 122 M132 104 C128 110 128 116 132 122" fill="none" stroke="#c79766" stroke-width="1.6" opacity=".55"/>
        <path d="${T}" fill="none" stroke="#7a5535" stroke-width="2.8"/>
        <path d="M70 140 C73 122 88 108 104 104" fill="none" stroke="#fff" stroke-width="3" opacity=".4"/>
        <ellipse cx="80" cy="165" rx="11" ry="7" fill="url(#@g-joue)"/>
        <ellipse cx="160" cy="165" rx="11" ry="7" fill="url(#@g-joue)"/>
        <path d="M113 158 Q120 153 127 158 Q124 164 120 165 Q116 164 113 158 Z" fill="url(#@g-nez)"/>
        <ellipse cx="117.5" cy="157" rx="2.4" ry="1.2" fill="#fff" opacity=".7"/>
        <path d="M95 166 L68 161 M95 171 L70 174 M145 166 L172 161 M145 171 L170 174" stroke="#7a5535" stroke-width="1.4" opacity=".5"/>`;
    })(),
    bouche: `<path d="M115.5 172 L115.5 179 Q115.5 181 117.5 181 L122.5 181 Q124.5 181 124.5 179 L124.5 172 Z" fill="#fff" stroke="#2a1206" stroke-width="1.6"/>
      <path d="M120 172.5 L120 181" stroke="#2a1206" stroke-width="1.2"/>
      <path d="M120 165 L120 170.5 M111 170 Q115.5 175 120 170.5 Q124.5 175 129 170" stroke="#2a1206" stroke-width="2.4" fill="none"/>`,
    decalage: { tete: 'translate(0 3)' },
  };

  // ---------------------------------------------------------- Chat
  P.chat = {
    id: 'chat', nom: 'Chat', le: 'le chat', du: 'du chat', salut: 'Miaou! On joue ensemble?',
    c: {
      fourrure: ['#d2d9e4', '#a3aec0', '#737e93'],
      corps: ['#7a8599', '#a9b4c6', '#9ea9bb', '#727d91'],
      queue: ['#7a8599', '#a9b4c6', '#c3cbd8'],
      oreille: ['#8790a3', '#a9b3c4'],
      oreilleInt: ['#ef9fb2', '#fbd3dc'],
      creme: ['#ffffff', '#e6eaf0'],
      pattes: ['#ffffff', '#dde2e9'],
      iris: ['#d6ef7a', '#5f9e2c', '#173006'],
      nez: ['#ffb4c3', '#e2718e'],
      contour: '#3d4455', pattesContour: '#3d4455', orteils: '#b9c0cb',
      bras: '#a5b0c2', refletBras: '#d7dde7', sourcils: '#3d4455', ombreCou: '#2f3646',
    },
    pupille: { rx: 3, ry: 9.5 },
    pivots: { og: '90px 112px', od: '150px 112px' },
    oreilleG: `<path d="M75 128 L71 68 L113 100 Z" fill="url(#@g-oreille)" stroke="#3d4455" stroke-width="2.6"/>
      <path d="M82 118 L79 83 L104 101 Z" fill="url(#@g-oreille-int)"/>
      <path d="M84 112 L82 100 M89 111 L88 99" stroke="#fff" stroke-width="1.8" opacity=".8"/>`,
    oreilleD: `<path d="M165 128 L169 68 L127 100 Z" fill="url(#@g-oreille)" stroke="#3d4455" stroke-width="2.6"/>
      <path d="M158 118 L161 83 L136 101 Z" fill="url(#@g-oreille-int)"/>
      <path d="M156 112 L158 100 M151 111 L152 99" stroke="#fff" stroke-width="1.8" opacity=".8"/>`,
    queue: `<path d="M134 250 C168 260 192 242 188 214 C185 196 194 180 208 182" fill="none" stroke="#3d4455" stroke-width="16"/>
      <path d="M134 250 C168 260 192 242 188 214 C185 196 194 180 208 182" fill="none" stroke="url(#@g-queue)" stroke-width="11"/>
      <path d="M134 250 C168 260 192 242 188 214 C185 196 194 180 208 182" fill="none" stroke="#5c6578" stroke-width="11" stroke-linecap="butt" stroke-dasharray="5 10" stroke-dashoffset="-8"/>
      <path d="M160 252 C176 248 186 236 186 222" fill="none" stroke="#fff" stroke-width="2" opacity=".35"/>`,
    corps: `<path d="M97 196 C91 214 91 244 100 258 C110 268 130 268 140 258 C149 244 149 214 143 196 C134 189 106 189 97 196 Z" fill="url(#@g-corps)" stroke="#3d4455" stroke-width="2.6"/>
      <path d="M106 198 L110 205 L115 199 L120 207 L125 199 L130 205 L134 198 C140 216 138 247 120 255 C102 247 100 216 106 198 Z" fill="url(#@g-creme)"/>
      <path d="M94 214 Q99 217 103 214 M93 228 Q98 231 102 228 M146 214 Q141 217 137 214 M147 228 Q142 231 138 228" fill="none" stroke="#5c6578" stroke-width="3"/>`,
    tete: (() => {
      const T = 'M120 98 C152 98 176 116 180 142 L193 150 L182 155 L191 165 L174 167 C162 184 143 194 120 194 C97 194 78 184 66 167 L49 165 L58 155 L47 150 L60 142 C64 116 88 98 120 98 Z';
      return `<path d="${T}" fill="url(#@g-tete)"/>
        <path d="M94 162 C100 150 114 152 120 160 C126 152 140 150 146 162 C146 180 134 191 120 191 C106 191 94 180 94 162 Z" fill="url(#@g-creme)"/>
        <path d="M110 101 L113 116 M120 99 L120 118 M130 101 L127 116" stroke="#5c6578" stroke-width="3.6"/>
        <path d="M61 143 L76 146 M61 155 L76 155 M179 143 L164 146 M179 155 L164 155" stroke="#5c6578" stroke-width="3.2"/>
        <path d="${T}" fill="none" stroke="#3d4455" stroke-width="2.8"/>
        <path d="M68 132 C74 116 88 105 104 101" fill="none" stroke="#fff" stroke-width="3" opacity=".4"/>
        <ellipse cx="84" cy="165" rx="11" ry="7" fill="url(#@g-joue)"/>
        <ellipse cx="156" cy="165" rx="11" ry="7" fill="url(#@g-joue)"/>
        <path d="M114 157 Q120 154 126 157 Q123 163 120 164 Q117 163 114 157 Z" fill="url(#@g-nez)"/>
        <ellipse cx="118" cy="156.5" rx="2.2" ry="1.1" fill="#fff" opacity=".7"/>
        <path d="M100 167 L62 160 M100 172 L64 176 M140 167 L178 160 M140 172 L176 176" stroke="#3d4455" stroke-width="1.5" opacity=".55"/>`;
    })(),
    decalage: { tete: 'translate(0 2)' },
  };

  // ---------------------------------------------------------- Grenouille
  P.grenouille = {
    id: 'grenouille', nom: 'Grenouille', le: 'la grenouille', du: 'de la grenouille', salut: 'Coâ! Prête à bondir dans les maths!',
    c: {
      fourrure: ['#b4ef83', '#6fca4a', '#3d962c'],
      corps: ['#48a23a', '#7fd65a', '#74cf52', '#43993a'],
      queue: ['#6fca4a', '#6fca4a', '#6fca4a'],
      oreille: ['#6fca4a', '#6fca4a'],
      oreilleInt: ['#6fca4a', '#6fca4a'],
      creme: ['#fbfde0', '#e0eda6'],
      pattes: ['#86d962', '#4fa83c'],
      iris: ['#ffd55c', '#c47c12', '#3a2004'],
      nez: ['#2b5a1c', '#2b5a1c'],
      contour: '#2b5a1c', pattesContour: '#2b5a1c', orteils: '#3f8a2c',
      bras: '#74cf52', refletBras: '#bdf395', sourcils: '#2b5a1c', ombreCou: '#1f4a14',
    },
    defs: `<radialGradient id="@g-bosse" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#c4f597"/><stop offset=".6" stop-color="#7fd65a"/><stop offset="1" stop-color="#4aa63a"/></radialGradient>`,
    pivots: { og: '98px 120px', od: '142px 120px' },
    oreilleG: '',
    oreilleD: '',
    queue: '',
    corps: `<path d="M95 197 C87 216 87 246 97 260 C108 270 132 270 143 260 C153 246 153 216 145 197 C135 190 105 190 95 197 Z" fill="url(#@g-corps)" stroke="#2b5a1c" stroke-width="2.6"/>
      <ellipse cx="120" cy="235" rx="19" ry="23" fill="url(#@g-creme)"/>
      <circle cx="99" cy="222" r="3.2" fill="#3f962c" opacity=".55"/><circle cx="142" cy="230" r="3.6" fill="#3f962c" opacity=".55"/>
      <circle cx="101" cy="244" r="2.4" fill="#3f962c" opacity=".55"/>`,
    jambes: `<ellipse cx="104" cy="262" rx="13" ry="12" fill="url(#@g-corps)" stroke="#2b5a1c" stroke-width="2"/>
      <ellipse cx="136" cy="262" rx="13" ry="12" fill="url(#@g-corps)" stroke="#2b5a1c" stroke-width="2"/>
      <rect x="99" y="262" width="11" height="18" rx="5" fill="url(#@g-pattes)" stroke="#2b5a1c" stroke-width="2"/>
      <rect x="130" y="262" width="11" height="18" rx="5" fill="url(#@g-pattes)" stroke="#2b5a1c" stroke-width="2"/>
      <path d="M90 284 Q92 278 98 279 Q104 274 110 279 Q116 278 118 284 Z" fill="url(#@g-pattes)" stroke="#2b5a1c" stroke-width="2"/>
      <path d="M122 284 Q124 278 130 279 Q136 274 142 279 Q148 278 150 284 Z" fill="url(#@g-pattes)" stroke="#2b5a1c" stroke-width="2"/>
      <circle cx="91" cy="284" r="2.6" fill="#b5ee8a" stroke="#2b5a1c" stroke-width="1.4"/><circle cx="104" cy="285" r="2.6" fill="#b5ee8a" stroke="#2b5a1c" stroke-width="1.4"/><circle cx="117" cy="284" r="2.6" fill="#b5ee8a" stroke="#2b5a1c" stroke-width="1.4"/>
      <circle cx="123" cy="284" r="2.6" fill="#b5ee8a" stroke="#2b5a1c" stroke-width="1.4"/><circle cx="136" cy="285" r="2.6" fill="#b5ee8a" stroke="#2b5a1c" stroke-width="1.4"/><circle cx="149" cy="284" r="2.6" fill="#b5ee8a" stroke="#2b5a1c" stroke-width="1.4"/>`,
    tete: (() => {
      const T = 'M120 126 C152 124 186 134 191 158 C195 180 160 195 120 195 C80 195 45 180 49 158 C54 134 88 124 120 126 Z';
      return `<circle cx="98" cy="137" r="21" fill="url(#@g-bosse)" stroke="#2b5a1c" stroke-width="2.8"/>
        <circle cx="142" cy="137" r="21" fill="url(#@g-bosse)" stroke="#2b5a1c" stroke-width="2.8"/>
        <path d="${T}" fill="url(#@g-tete)" stroke="#2b5a1c" stroke-width="2.8"/>
        <circle cx="98" cy="137" r="19.6" fill="url(#@g-bosse)"/>
        <circle cx="142" cy="137" r="19.6" fill="url(#@g-bosse)"/>
        <circle cx="98" cy="140" r="15.8" fill="#fff" stroke="#2b5a1c" stroke-width="1.6"/>
        <circle cx="142" cy="140" r="15.8" fill="#fff" stroke="#2b5a1c" stroke-width="1.6"/>
        <path d="M84 125 Q90 118 99 118 M128 125 Q134 118 143 118" fill="none" stroke="#fff" stroke-width="2.6" opacity=".6"/>
        <path d="M60 160 C62 146 74 138 86 136" fill="none" stroke="#fff" stroke-width="2.6" opacity=".3"/>
        <circle cx="72" cy="170" r="3.6" fill="#3f962c" opacity=".5"/><circle cx="168" cy="168" r="3" fill="#3f962c" opacity=".5"/>
        <circle cx="120" cy="134" r="2.6" fill="#3f962c" opacity=".5"/>
        <ellipse cx="82" cy="172" rx="11" ry="7" fill="url(#@g-joue)"/>
        <ellipse cx="158" cy="172" rx="11" ry="7" fill="url(#@g-joue)"/>
        <circle cx="114" cy="162" r="1.8" fill="#2b5a1c"/><circle cx="126" cy="162" r="1.8" fill="#2b5a1c"/>`;
    })(),
    bouche: `<path d="M93 169 Q120 187 147 169" stroke="#2a1206" stroke-width="2.8" fill="none"/>
      <path d="M91 166 Q92 169 94 170 M149 166 Q148 169 146 170" stroke="#2a1206" stroke-width="2.2" fill="none"/>`,
    decalage: { tete: 'translate(0 18)' },
  };

  // ---------------------------------------------------------- Dragon
  P.dragon = {
    id: 'dragon', nom: 'Dragon', le: 'le dragon', du: 'du dragon', salut: 'Grrr… je veux dire : salut! On calcule?',
    c: {
      fourrure: ['#cdb8ff', '#9272f2', '#5f40c2'],
      corps: ['#6345c6', '#9a7bf4', '#8e6cec', '#5b3dba'],
      queue: ['#5b3dba', '#8e6cec', '#a98af6'],
      oreille: ['#a07ef4', '#e0c6ff'],
      oreilleInt: ['#e0c6ff', '#e0c6ff'],
      creme: ['#fff0bf', '#f2bf55'],
      pattes: ['#7d5ade', '#47299a'],
      iris: ['#ffe46a', '#e3861f', '#3a1604'],
      nez: ['#33206e', '#33206e'],
      contour: '#33206e', pattesContour: '#2a1868', orteils: '#fff3cf',
      bras: '#9575f2', refletBras: '#cbb8ff', sourcils: '#33206e', ombreCou: '#22124f',
    },
    pupille: { rx: 3.2, ry: 9 },
    defs: `<linearGradient id="@g-corne" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stop-color="#f2c25c"/><stop offset="1" stop-color="#fff6d6"/></linearGradient>
      <linearGradient id="@g-aile" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#e9dcff"/><stop offset="1" stop-color="#a888f4"/></linearGradient>
      <radialGradient id="@g-museau" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#e2d6ff"/><stop offset="1" stop-color="#b19af6"/></radialGradient>`,
    ailes: {
      g: `<path d="M104 214 C86 194 60 186 42 196 C50 201 52 208 50 215 C59 212 65 217 65 224 C73 219 82 221 90 229 Z" fill="url(#@g-aile)" stroke="#33206e" stroke-width="2.4"/>
          <path d="M104 214 L50 215 M104 214 L65 224" stroke="#33206e" stroke-width="1.5" opacity=".55"/>`,
      d: `<path d="M136 214 C154 194 180 186 198 196 C190 201 188 208 190 215 C181 212 175 217 175 224 C167 219 158 221 150 229 Z" fill="url(#@g-aile)" stroke="#33206e" stroke-width="2.4"/>
          <path d="M136 214 L190 215 M136 214 L175 224" stroke="#33206e" stroke-width="1.5" opacity=".55"/>`,
      pivotG: '104px 214px', pivotD: '136px 214px',
    },
    pivots: { og: '64px 150px', od: '176px 150px' },
    oreilleG: `<path d="M66 144 L41 125 L49 140 L36 146 L51 153 L66 159 Z" fill="url(#@g-oreille)" stroke="#33206e" stroke-width="2.4"/>
      <path d="M64 147 L48 140 M64 153 L50 152" stroke="#33206e" stroke-width="1.3" opacity=".5"/>`,
    oreilleD: `<path d="M174 144 L199 125 L191 140 L204 146 L189 153 L174 159 Z" fill="url(#@g-oreille)" stroke="#33206e" stroke-width="2.4"/>
      <path d="M176 147 L192 140 M176 153 L190 152" stroke="#33206e" stroke-width="1.3" opacity=".5"/>`,
    queue: `<path d="M132 256 C162 268 196 254 204 220 L195 224 C189 242 162 248 136 242 Z" fill="url(#@g-queue)" stroke="#33206e" stroke-width="2.6"/>
      <path d="M192 228 L207 200 L214 230 Z" fill="url(#@g-corne)" stroke="#33206e" stroke-width="2.4"/>
      <path d="M160 246 L164 236 L171 245 Z M180 239 L186 228 L191 238 Z" fill="url(#@g-corne)" stroke="#33206e" stroke-width="2"/>
      <path d="M146 252 C168 256 188 246 196 230" fill="none" stroke="#fff" stroke-width="2" opacity=".3"/>`,
    corps: `<path d="M97 196 C91 214 91 244 100 258 C110 268 130 268 140 258 C149 244 149 214 143 196 C134 189 106 189 97 196 Z" fill="url(#@g-corps)" stroke="#33206e" stroke-width="2.6"/>
      <path d="M106 199 C116 203 124 203 134 199 C140 216 139 248 120 256 C101 248 100 216 106 199 Z" fill="url(#@g-creme)" stroke="#c98d22" stroke-width="1.2"/>
      <path d="M106 214 Q120 219 134 214 M105 227 Q120 232 135 227 M107 240 Q120 245 133 240" fill="none" stroke="#d29a2e" stroke-width="1.6"/>`,
    jambes: `<rect x="101" y="249" width="15" height="29" rx="7" fill="url(#@g-pattes)" stroke="#2a1868" stroke-width="2"/>
      <rect x="124" y="249" width="15" height="29" rx="7" fill="url(#@g-pattes)" stroke="#2a1868" stroke-width="2"/>
      <ellipse cx="107" cy="280" rx="13" ry="7" fill="url(#@g-pattes)" stroke="#2a1868" stroke-width="2"/>
      <ellipse cx="133" cy="280" rx="13" ry="7" fill="url(#@g-pattes)" stroke="#2a1868" stroke-width="2"/>
      <path d="M95 283 L92 287 L99 285 Z M102 285 L100 289 L106 286 Z M109 285 L109 289 L113 285 Z M127 285 L127 289 L131 285 Z M134 286 L140 289 L138 285 Z M141 285 L148 287 L145 283 Z" fill="#fff3cf" stroke="#2a1868" stroke-width="1"/>`,
    tete: (() => {
      const T = 'M120 100 C154 100 178 120 178 146 C178 164 170 180 158 188 C148 194 134 197 120 197 C106 197 92 194 82 188 C70 180 62 164 62 146 C62 120 86 100 120 100 Z';
      return `<path d="M92 112 C86 94 77 82 66 75 C82 75 97 88 105 106 Z" fill="url(#@g-corne)" stroke="#33206e" stroke-width="2.4"/>
        <path d="M148 112 C154 94 163 82 174 75 C158 75 143 88 135 106 Z" fill="url(#@g-corne)" stroke="#33206e" stroke-width="2.4"/>
        <path d="M80 88 L86 94 M154 94 L160 88" stroke="#c98d22" stroke-width="1.6"/>
        <path d="M106 106 L112 88 L119 102 Z M118 101 L125 83 L132 101 Z" fill="url(#@g-creme)" stroke="#33206e" stroke-width="2.2"/>
        <path d="${T}" fill="url(#@g-tete)"/>
        <ellipse cx="120" cy="172" rx="28" ry="19" fill="url(#@g-museau)"/>
        <path d="M106 118 q5 -5 10 0 M124 118 q5 -5 10 0 M115 110 q5 -5 10 0" fill="none" stroke="#b9a2fa" stroke-width="2"/>
        <path d="${T}" fill="none" stroke="#33206e" stroke-width="2.8"/>
        <path d="M70 136 C74 118 88 106 104 103" fill="none" stroke="#fff" stroke-width="3" opacity=".4"/>
        <ellipse cx="80" cy="166" rx="11" ry="7" fill="url(#@g-joue)"/>
        <ellipse cx="160" cy="166" rx="11" ry="7" fill="url(#@g-joue)"/>
        <ellipse cx="112" cy="163" rx="2.6" ry="1.8" fill="#33206e"/><ellipse cx="128" cy="163" rx="2.6" ry="1.8" fill="#33206e"/>`;
    })(),
    bouche: `<path d="M107 175 Q120 184 133 175" stroke="#2a1206" stroke-width="2.6" fill="none"/>
      <path d="M125 179.5 L127.5 185 L130 178" fill="#fff" stroke="#2a1206" stroke-width="1.4"/>`,
    decalage: { tete: 'translate(0 3)' },
  };

  P.ORDRE = ['renard', 'lapin', 'chat', 'grenouille', 'dragon'];
  return P;
})();

if (typeof module !== 'undefined') module.exports = PERSONNAGES;
