/* DimiBot – ο χαρακτήρας στην οθόνη.
   Εκτελεί ΜΟΝΟ τις εντολές της λίστας COMMANDS. Το ίδιο σύνολο εντολών θα σταλεί αργότερα
   στο αληθινό ρομπότ (ESP32) μέσω Bluetooth. Τα μάτια σχεδιάζονται έτσι ώστε να μπορούν να
   εμφανιστούν και στην οθόνη TFT του αληθινού ρομπότ. */
window.DB = window.DB || {};
(function () {
  const V = DB.voice, PR = DB.progress;
  const COMMANDS = ['HELLO', 'WAVE_R', 'WAVE_L', 'HEAD', 'DANCE', 'HAPPY', 'HEART', 'SURPRISE', 'SLEEP', 'THINK', 'CHEER', 'SPIN', 'JUMP', 'DUNK', 'STOP'];

  /* ---------- μάτια και στόμα ---------- */
  const HL = '<circle cx="-7" cy="-13" r="7" fill="#fff" opacity=".9"/><circle cx="8" cy="11" r="3.2" fill="#fff" opacity=".55"/>';
  const EYE = {
    normal: () => `<rect class="ef" x="-21" y="-30" width="42" height="60" rx="21"/>${HL}`,
    blink: () => '<rect class="ef" x="-21" y="-4" width="42" height="8" rx="4"/>',
    happy: () => '<path class="es" d="M-22 9 Q0 -24 22 9" stroke-width="11" stroke-linecap="round"/>',
    heart: () => '<path class="ef" d="M0 24 C-34 2 -28 -26 -11 -26 C-4 -26 0 -20 0 -15 C0 -20 4 -26 11 -26 C28 -26 34 2 0 24Z"/><circle cx="-12" cy="-14" r="5" fill="#fff" opacity=".85"/>',
    star: () => '<path class="ef" d="M0-30l8.8 17.8 19.7 2.9-14.3 13.9 3.4 19.6L0 15 -17.6 24.2l3.4-19.6L-28.5-9.3l19.7-2.9z" stroke-linejoin="round"/>',
    surprise: () => `<circle class="ef" r="28"/><circle cx="-9" cy="-11" r="8" fill="#fff" opacity=".9"/><circle cx="10" cy="12" r="3.5" fill="#fff" opacity=".55"/>`,
    sad: s => `<rect class="ef" x="-21" y="-30" width="42" height="60" rx="21"/>${HL}<polygon class="lid" points="${s === 'L' ? '-24,-36 24,-36 24,-28 -24,-6' : '-24,-36 24,-36 24,-6 -24,-28'}"/>`,
    sleepy: () => '<rect class="ef" x="-21" y="0" width="42" height="13" rx="6.5"/>',
    focus: () => `<rect class="ef" x="-21" y="-30" width="42" height="60" rx="21"/>${HL}<polygon class="lid" points="-24,-36 24,-36 24,-13 -24,-13"/>`,
    x: () => '<path class="es" d="M-16-16L16 16M16-16L-16 16" stroke-width="9" stroke-linecap="round"/>',
    wink: s => s === 'R' ? '<path class="es" d="M-20 4 Q0 -10 20 4" stroke-width="10" stroke-linecap="round"/>' : `<rect class="ef" x="-21" y="-30" width="42" height="60" rx="21"/>${HL}`
  };
  const MOUTH = {
    smile: '<path class="es" d="M-17 -3 Q0 13 17 -3" stroke-width="6" stroke-linecap="round"/>',
    grin: '<path class="ef" d="M-20 -5 Q0 24 20 -5 Z"/>',
    o: '<ellipse class="ef" rx="9" ry="10"/>',
    flat: '<path class="es" d="M-12 2 H12" stroke-width="6" stroke-linecap="round"/>',
    sad: '<path class="es" d="M-15 7 Q0 -6 15 7" stroke-width="6" stroke-linecap="round"/>',
    sleep: '<path class="es" d="M-8 2 Q0 6 8 2" stroke-width="5" stroke-linecap="round"/>'
  };
  const MOOD_MOUTH = { normal: 'smile', happy: 'grin', heart: 'grin', star: 'grin', surprise: 'o', sad: 'sad', sleepy: 'sleep', focus: 'flat', x: 'flat', wink: 'grin', blink: 'smile' };

  /* ---------- αξεσουάρ ---------- */
  const HATS = {
    none: '',
    cap: `<path class="af" d="M112 122 Q110 40 200 38 Q290 40 288 122 Q200 98 112 122Z"/>
      <path class="af2" d="M196 108 Q268 96 322 120 Q306 138 252 128 Q222 120 196 120Z"/>
      <path d="M140 70 Q170 52 200 50" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".35"/>
      <circle class="af2" cx="200" cy="40" r="9"/>`,
    headphones: `<path class="as" d="M90 150 Q92 34 200 34 Q308 34 310 150" stroke-width="14" fill="none" stroke-linecap="round"/>
      <rect x="66" y="120" width="40" height="72" rx="18" fill="#263052"/><rect x="294" y="120" width="40" height="72" rx="18" fill="#263052"/>
      <rect class="af" x="74" y="132" width="24" height="48" rx="12"/><rect class="af" x="302" y="132" width="24" height="48" rx="12"/>`,
    pirate: `<path d="M98 100 Q112 30 200 44 Q288 30 302 100 Q200 78 98 100Z" fill="#23262F"/>
      <path d="M98 100 Q200 78 302 100" stroke="#C9A227" stroke-width="5" fill="none"/>
      <circle cx="200" cy="64" r="10" fill="#fff"/><path d="M186 80 L214 92 M214 80 L186 92" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    astro: `<ellipse cx="200" cy="276" rx="100" ry="18" fill="#DFE7F1" stroke="#9FB0C4" stroke-width="4"/>
      <circle cx="200" cy="156" r="134" fill="rgba(170,215,255,.14)" stroke="rgba(255,255,255,.8)" stroke-width="5"/>
      <path d="M110 80 Q150 40 210 34" stroke="#fff" stroke-width="10" stroke-linecap="round" fill="none" opacity=".55"/>
      <circle cx="96" cy="112" r="6" fill="#fff" opacity=".6"/>`,
    wizard: `<path d="M124 84 Q200 66 276 84 L208 -30 Q200 -40 192 -28Z" fill="#5B3BB0"/>
      <path d="M150 40 l5 10 11 2 -8 8 2 11 -10-5 -10 5 2-11 -8-8 11-2z" fill="#FFD84D"/>
      <circle cx="222" cy="10" r="5" fill="#FFD84D"/><circle cx="186" cy="64" r="4" fill="#FFD84D"/>
      <ellipse cx="200" cy="86" rx="112" ry="18" fill="#6D4BD0"/>`,
    band: `<path d="M104 112 Q200 70 296 112 L296 132 Q200 92 104 132Z" class="af"/><path d="M104 120 Q200 80 296 120" stroke="#fff" stroke-width="5" fill="none" opacity=".9"/>`,
    crown: `<path d="M126 86 L136 30 L168 62 L200 18 L232 62 L264 30 L274 86 Z" fill="#FFC93C" stroke="#D99A00" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="200" cy="66" r="9" fill="#FF4D6D"/><circle cx="160" cy="74" r="7" fill="#4FA8FF"/><circle cx="240" cy="74" r="7" fill="#4ADE80"/>
      <circle cx="136" cy="30" r="6" fill="#FFE58A"/><circle cx="200" cy="18" r="6" fill="#FFE58A"/><circle cx="264" cy="30" r="6" fill="#FFE58A"/>`
  };
  const HIDE_ANT = { pirate: 1, astro: 1, wizard: 1, crown: 1, cap: 0 };
  const BACKS = {
    none: '',
    cape: `<path d="M138 268 Q200 292 262 268 L312 452 Q200 480 88 452 Z" fill="url(#gCape)"/>`,
    wings: `<g class="wing wl"><path d="M132 300 Q70 220 26 268 Q44 286 58 292 Q30 306 46 324 Q64 324 76 322 Q60 344 86 352 Q110 342 136 330Z" fill="#fff" stroke="#C7D3E3" stroke-width="4"/></g>
      <g class="wing wr"><path d="M268 300 Q330 220 374 268 Q356 286 342 292 Q370 306 354 324 Q336 324 324 322 Q340 344 314 352 Q290 342 264 330Z" fill="#fff" stroke="#C7D3E3" stroke-width="4"/></g>`,
    jetpack: `<g class="jet"><path class="flame" d="M74 362 Q88 420 102 362Z" fill="#FFB020"/><path class="flame" d="M298 362 Q312 420 326 362Z" fill="#FFB020"/>
      <path class="flame f2" d="M80 362 Q88 398 96 362Z" fill="#FFF1A8"/><path class="flame f2" d="M304 362 Q312 398 320 362Z" fill="#FFF1A8"/>
      <rect x="68" y="262" width="40" height="104" rx="20" fill="#CBD5E1" stroke="#8B9BB0" stroke-width="4"/><rect x="292" y="262" width="40" height="104" rx="20" fill="#CBD5E1" stroke="#8B9BB0" stroke-width="4"/>
      <rect class="af" x="68" y="300" width="40" height="14"/><rect class="af" x="292" y="300" width="40" height="14"/></g>`
  };

  /* φανέλα μπάσκετ: χρώμα, δεύτερο χρώμα (ρέλι/αριθμός), αριθμός */
  function shirtSvg(c1, c2, n) {
    return `<clipPath id="torsoClip"><ellipse cx="200" cy="338" rx="82" ry="80"/></clipPath>
      <g clip-path="url(#torsoClip)">
        <path d="M118 270 L150 262 Q162 300 200 304 Q238 300 250 262 L282 270 L290 420 L110 420Z" fill="${c1}"/>
        <path d="M150 262 Q162 300 200 304 Q238 300 250 262" stroke="${c2}" stroke-width="8" fill="none"/>
        <path d="M118 270 Q130 300 132 330 M282 270 Q270 300 268 330" stroke="${c2}" stroke-width="7" fill="none"/>
        <path d="M110 392 H290" stroke="${c2}" stroke-width="6" opacity=".6"/>
        <ellipse cx="170" cy="300" rx="24" ry="10" fill="#fff" opacity=".25"/>
      </g>
      <text x="200" y="368" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="52" fill="${c2}" stroke="#fff" stroke-width="3" paint-order="stroke">${n}</text>`;
  }

  /* ---------- σχέδιο ---------- */
  const wrap = document.createElement('div');
  wrap.className = 'botWrap';
  wrap.innerHTML = `
  <div class="bubble" aria-live="polite"></div>
  <svg class="bot" viewBox="0 -44 400 540" role="img" aria-label="Ο DimiBot">
    <defs>
      <radialGradient id="gBody" cx=".34" cy=".28" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#EEF3F9"/><stop offset="1" stop-color="#B4C2D4"/></radialGradient>
      <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sa1"/><stop offset="1" class="sa2"/></linearGradient>
      <linearGradient id="gVisor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26335F"/><stop offset="1" stop-color="#080C20"/></linearGradient>
      <linearGradient id="gCape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF4D5E"/><stop offset="1" stop-color="#B5172F"/></linearGradient>
      <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse class="shadow" cx="200" cy="476" rx="112" ry="14" fill="rgba(0,0,0,.28)"/>
    <g class="floaty"><g class="part p-bot" style="transform-origin:200px 470px">
      <g class="part p-legL" style="transform-origin:172px 386px"><rect x="154" y="376" width="36" height="66" rx="18" fill="url(#gBody)"/><rect x="144" y="428" width="54" height="32" rx="16" fill="url(#gAcc)"/><ellipse cx="160" cy="436" rx="8" ry="4" fill="#fff" opacity=".45"/></g>
      <g class="part p-legR" style="transform-origin:228px 386px"><rect x="210" y="376" width="36" height="66" rx="18" fill="url(#gBody)"/><rect x="202" y="428" width="54" height="32" rx="16" fill="url(#gAcc)"/><ellipse cx="218" cy="436" rx="8" ry="4" fill="#fff" opacity=".45"/></g>
      <g class="part p-upper" style="transform-origin:200px 420px">
        <g class="accBack"></g>
        <rect x="182" y="240" width="36" height="30" rx="10" fill="#A9B8CA"/>
        <ellipse cx="200" cy="338" rx="82" ry="80" fill="url(#gBody)"/>
        <ellipse cx="168" cy="292" rx="30" ry="15" fill="#fff" opacity=".75"/>
        <g class="chest"><rect x="158" y="304" width="84" height="64" rx="22" fill="url(#gAcc)"/>
        <rect x="166" y="310" width="68" height="14" rx="7" fill="#fff" opacity=".22"/>
        <circle class="core ef" cx="200" cy="340" r="13" filter="url(#glow)"/></g>
        <g class="accShirt"></g>
        <g class="part p-armL" style="transform-origin:128px 292px"><rect x="96" y="290" width="32" height="84" rx="16" fill="url(#gBody)"/><rect x="96" y="326" width="32" height="10" fill="url(#gAcc)"/><circle cx="112" cy="380" r="20" fill="url(#gAcc)"/><circle cx="105" cy="373" r="6" fill="#fff" opacity=".45"/><circle cx="128" cy="292" r="19" fill="url(#gAcc)"/><circle cx="121" cy="285" r="6" fill="#fff" opacity=".45"/></g>
        <g class="part p-armR" style="transform-origin:272px 292px"><rect x="272" y="290" width="32" height="84" rx="16" fill="url(#gBody)"/><rect x="272" y="326" width="32" height="10" fill="url(#gAcc)"/><circle cx="288" cy="380" r="20" fill="url(#gAcc)"/><circle cx="281" cy="373" r="6" fill="#fff" opacity=".45"/><circle cx="272" cy="292" r="19" fill="url(#gAcc)"/><circle cx="265" cy="285" r="6" fill="#fff" opacity=".45"/></g>
        <g class="part p-head" style="transform-origin:200px 256px">
          <g class="ant"><path d="M200 64 V30" stroke="#9FB0C4" stroke-width="7" stroke-linecap="round"/><circle class="bulb ef" cx="200" cy="24" r="12" filter="url(#glow)"/></g>
          <circle cx="92" cy="160" r="25" fill="url(#gAcc)"/><circle cx="308" cy="160" r="25" fill="url(#gAcc)"/>
          <rect x="94" y="62" width="212" height="192" rx="88" fill="url(#gBody)"/>
          <rect x="116" y="96" width="168" height="126" rx="58" fill="url(#gVisor)"/>
          <path d="M134 134 Q142 108 176 103" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".28"/>
          <g transform="translate(164 154)"><g class="eyeIn eyeL" filter="url(#glow)"></g></g>
          <g transform="translate(236 154)"><g class="eyeIn eyeR" filter="url(#glow)"></g></g>
          <ellipse class="cheek" cx="140" cy="192" rx="14" ry="7"/><ellipse class="cheek" cx="260" cy="192" rx="14" ry="7"/>
          <g transform="translate(200 198)"><g class="mouth" filter="url(#glow)"></g></g>
          <g class="accHat"></g>
        </g>
      </g>
    </g></g>
  </svg>
  <canvas class="fx"></canvas>`;
  const q = s => wrap.querySelector(s);
  const bubble = q('.bubble'), eyeL = q('.eyeL'), eyeR = q('.eyeR'), mouth = q('.mouth');

  /* ---------- εμφάνιση από τις αναβαθμίσεις ---------- */
  function applyLook() {
    const L = PR.look();
    const col = PR.find('color', L.color) || PR.ITEMS.color[0], eye = PR.find('eyes', L.eyes) || PR.ITEMS.eyes[0];
    wrap.style.setProperty('--acc1', col.c[0]); wrap.style.setProperty('--acc2', col.c[1]); wrap.style.setProperty('--eye', eye.c);
    q('.accHat').innerHTML = HATS[L.hat] || '';
    q('.accBack').innerHTML = BACKS[L.back] || '';
    q('.ant').style.display = HIDE_ANT[L.hat] ? 'none' : '';
    const sh = L.shirt && L.shirt !== 'none' ? PR.find('shirt', L.shirt) : null;
    q('.chest').style.display = sh ? 'none' : '';
    q('.accShirt').innerHTML = sh ? shirtSvg(sh.c[0], sh.c[1], String(DB.settings.jersey || 7).slice(0, 2)) : '';
    const stage = wrap.closest('.stage'); if (stage) stage.dataset.scene = L.scene;
    document.documentElement.dataset.scene = L.scene;
  }
  PR.on(t => { if (t === 'look') applyLook(); });

  /* ---------- διάθεση ---------- */
  let mood = 'normal', talkingNow = false, look = [0, 0];
  function drawEyes(m) {
    const f = EYE[m] || EYE.normal;
    eyeL.innerHTML = f('L'); eyeR.innerHTML = f('R');
    eyeL.style.transform = eyeR.style.transform = `translate(${look[0]}px,${look[1]}px)`;
    if (!talkingNow) mouth.innerHTML = MOUTH[MOOD_MOUTH[m] || 'smile'];
  }
  function eyes(m) { mood = m; drawEyes(m); }
  function lookAt(x, y) { look = [x, y]; eyeL.style.transform = eyeR.style.transform = `translate(${x}px,${y}px)`; }

  /* στόμα που κινείται όταν μιλάει */
  let mt = null;
  V.onTalking(on => {
    talkingNow = on; clearInterval(mt);
    q('.ant').classList.toggle('talk', on);
    if (on) mt = setInterval(() => { const h = 3 + Math.random() * 9; mouth.innerHTML = `<ellipse class="ef" rx="${10 + Math.random() * 4}" ry="${h}"/>`; }, 110);
    else drawEyes(mood);
  });

  /* ---------- κινήσεις (διακόπτονται αμέσως με STOP) ---------- */
  let gen = 0;
  const sleep = ms => { const g = gen; return new Promise((res, rej) => setTimeout(() => g === gen ? res() : rej('stop'), ms)); };
  const set = (part, t) => { const el = q('.p-' + part); if (el) el.style.transform = t; };
  const PARTS = ['armL', 'armR', 'head', 'upper', 'legL', 'legR', 'bot'];
  const rest = () => { PARTS.forEach(p => set(p, '')); lookAt(0, 0); };
  const speed = ms => { wrap.style.setProperty('--spd', ms + 'ms'); };

  async function waveR(n = 3) { for (let i = 0; i < n; i++) { set('armR', 'rotate(-155deg)'); await sleep(260); set('armR', 'rotate(-120deg)'); await sleep(260); } set('armR', ''); await sleep(250); }
  async function waveL(n = 3) { for (let i = 0; i < n; i++) { set('armL', 'rotate(155deg)'); await sleep(260); set('armL', 'rotate(120deg)'); await sleep(260); } set('armL', ''); await sleep(250); }
  async function jump(n = 1) {
    for (let i = 0; i < n; i++) {
      set('legL', 'scaleY(.85)'); set('legR', 'scaleY(.85)'); set('upper', 'translateY(12px)'); await sleep(150);
      set('legL', ''); set('legR', ''); set('upper', ''); set('bot', 'translateY(-46px)'); set('armL', 'rotate(40deg)'); set('armR', 'rotate(-40deg)'); await sleep(260);
      set('bot', ''); set('armL', ''); set('armR', ''); await sleep(240);
    }
  }
  async function head() { set('head', 'rotate(-12deg)'); lookAt(-9, 0); await sleep(480); set('head', 'rotate(12deg)'); lookAt(9, 0); await sleep(560); set('head', ''); lookAt(0, 0); await sleep(300); }
  async function spin() { set('armL', 'rotate(80deg)'); set('armR', 'rotate(-80deg)'); for (const s of [.2, -1, .2, 1]) { set('bot', `scaleX(${s})`); await sleep(170); } set('bot', ''); set('armL', ''); set('armR', ''); await sleep(200); }

  const DANCES = {
    async robot() {
      const P = [['rotate(90deg)', 'rotate(0deg)', 'rotate(-8deg)'], ['rotate(0deg)', 'rotate(-90deg)', 'rotate(8deg)'], ['rotate(170deg)', 'rotate(-90deg)', 'rotate(-8deg)'], ['rotate(90deg)', 'rotate(-170deg)', 'rotate(8deg)']];
      for (let i = 0; i < 16; i++) { const p = P[i % 4]; set('armL', p[0]); set('armR', p[1]); set('head', p[2]); lookAt(i % 2 ? 8 : -8, 0); if (i % 4 === 3) { set('bot', 'translateY(-14px)'); } else set('bot', ''); await sleep(220); }
    },
    async disco() {
      for (let i = 0; i < 16; i++) { const up = i % 2 === 0; set('armR', up ? 'rotate(-160deg)' : 'rotate(-30deg)'); set('armL', up ? 'rotate(20deg)' : 'rotate(40deg)'); set('upper', `rotate(${up ? -7 : 7}deg)`); set('legL', `rotate(${up ? 8 : -4}deg)`); set('legR', `rotate(${up ? 4 : -8}deg)`); set('head', `rotate(${up ? 6 : -6}deg)`); await sleep(220); }
    },
    async wave() {
      for (let i = 0; i < 4; i++) {
        set('armL', 'rotate(150deg)'); set('upper', 'rotate(-6deg) translateY(-4px)'); await sleep(220);
        set('armL', 'rotate(60deg)'); set('head', 'rotate(-8deg)'); await sleep(220);
        set('armL', ''); set('armR', 'rotate(-60deg)'); set('head', 'rotate(8deg)'); set('upper', 'rotate(6deg) translateY(-4px)'); await sleep(220);
        set('armR', 'rotate(-150deg)'); await sleep(220); set('armR', ''); set('upper', '');
      }
    },
    async spin() { for (let i = 0; i < 3; i++) { await spin(); await jump(1); } }
  };
  async function dance() {
    const d = PR.look().dance || 'robot';
    eyes('happy');
    let song = null;
    if (DB.settings.songs !== false && DB.music) { try { song = await DB.music.play(14); } catch (e) { song = null; } }
    if (!song) V.song(d);
    try {
      if (song) {
        // με αληθινό τραγούδι: χορεύει όσο παίζει, ανακατεύοντας τους χορούς που έχει ξεκλειδώσει
        const mine = (PR.data.owned.dance || ['robot']).filter(k => DANCES[k]);
        const t0 = Date.now(); let i = 0;
        while (Date.now() - t0 < 13500 && DB.music.playing()) { await DANCES[i++ === 0 ? d : mine[Math.floor(Math.random() * mine.length)]](); }
      } else await DANCES[d]();
    } finally { rest(); if (song) DB.music.stop(); }
    await sleep(200); eyes('normal'); DB.log.add('dance');
  }

  /* Εκτελεί μία εντολή της λίστας. Ό,τι δεν είναι στη λίστα αγνοείται. */
  async function run(cmd) {
    if (!COMMANDS.includes(cmd)) return;
    if (cmd === 'STOP') return stopAll();
    try {
      switch (cmd) {
        case 'HELLO': eyes('happy'); await waveR(3); eyes('normal'); break;
        case 'WAVE_R': await waveR(2); break;
        case 'WAVE_L': await waveL(2); break;
        case 'HEAD': await head(); break;
        case 'DANCE': await dance(); break;
        case 'HAPPY': eyes('happy'); await jump(1); eyes('normal'); break;
        case 'JUMP': await jump(2); break;
        case 'DUNK': eyes('star'); set('armR', 'rotate(-170deg)'); set('armL', 'rotate(40deg)'); set('legL', 'scaleY(.85)'); set('legR', 'scaleY(.85)'); await sleep(160); set('legL', ''); set('legR', ''); set('bot', 'translateY(-60px)'); await sleep(320); set('armR', 'rotate(-120deg)'); set('bot', 'translateY(-50px)'); await sleep(120); set('bot', ''); await sleep(280); rest(); eyes('normal'); break;
        case 'SPIN': eyes('happy'); await spin(); eyes('normal'); break;
        case 'HEART': eyes('heart'); set('armL', 'rotate(30deg)'); set('armR', 'rotate(-30deg)'); await sleep(1400); rest(); eyes('normal'); break;
        case 'SURPRISE': eyes('surprise'); V.sfx.boing(); set('bot', 'translateY(-18px)'); set('armL', 'rotate(60deg)'); set('armR', 'rotate(-60deg)'); await sleep(380); rest(); await sleep(600); eyes('normal'); break;
        case 'SLEEP': eyes('sleepy'); set('head', 'rotate(10deg)'); set('upper', 'translateY(6px)'); await sleep(1800); rest(); eyes('normal'); break;
        case 'THINK': eyes('focus'); lookAt(6, -8); set('head', 'rotate(-8deg)'); set('armR', 'rotate(-115deg)'); await sleep(1200); rest(); eyes('normal'); break;
        case 'CHEER': eyes('star'); set('armL', 'rotate(160deg)'); set('armR', 'rotate(-160deg)'); await jump(1); set('armL', 'rotate(160deg)'); set('armR', 'rotate(-160deg)'); await sleep(300); rest(); eyes('normal'); break;
      }
    } catch (e) { /* διακόπηκε από STOP */ }
  }

  /* ---------- κομφετί ---------- */
  const cv = q('.fx'); let parts = [], raf = 0;
  function confetti(n = 90, x = .5, y = .45) {
    const r = wrap.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    const cols = ['#FFD84D', '#FF6B7A', '#4FA8FF', '#4ADE80', '#B48CFF', '#5CF2FF', '#FFA24C'];
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9; parts.push({ x: x * cv.width, y: y * cv.height, vx: Math.cos(a) * s * dpr, vy: (Math.sin(a) * s - 7) * dpr, r: (4 + Math.random() * 5) * dpr, c: cols[i % cols.length], t: 0, rot: Math.random() * 6, star: Math.random() < .25 }); }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.t < 110 && p.y < cv.height + 40);
    parts.forEach(p => {
      p.t++; p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += .15;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.max(0, 1 - p.t / 110); c.fillStyle = p.c;
      if (p.star) { c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? p.r * .45 : p.r * 1.2, a = i * Math.PI / 5; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.fill(); }
      else c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      c.restore();
    });
    raf = parts.length ? requestAnimationFrame(tick) : 0;
  }

  async function celebrate(big) { confetti(big ? 160 : 80); big ? V.sfx.level() : V.sfx.right(); await run('CHEER'); }

  /* Μιλάει: συννεφάκι + φωνή + στόμα που κινείται */
  async function say(text, opts = {}) {
    bubble.textContent = String(text).replace(/[{}]/g, '');
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    await V.speak(text);
  }
  function stopAll(soft) { gen++; rest(); V.stop(); V.stopSong(); if (DB.music) DB.music.stop(); if (soft) { eyes('normal'); return; } eyes('x'); setTimeout(() => { if (mood === 'x') eyes('normal'); }, 1400); }
  function mount(el) { if (el && wrap.parentNode !== el) { el.appendChild(wrap); applyLook(); } }

  /* ---------- ζωντάνια όταν δεν κάνει τίποτα ---------- */
  (function idle() {
    setTimeout(async () => {
      try {
        if (mood === 'normal' && !talkingNow && !(DB.app && DB.app.busy)) {
          const r = Math.random();
          if (r < .65) { drawEyes('blink'); await new Promise(z => setTimeout(z, 130)); if (mood === 'normal') drawEyes('normal'); }
          else if (r < .85) { const d = Math.random() < .5 ? -8 : 8; lookAt(d, -2); await new Promise(z => setTimeout(z, 900)); lookAt(0, 0); }
          else { set('head', 'rotate(-6deg)'); await new Promise(z => setTimeout(z, 700)); set('head', ''); }
        }
      } catch (e) {}
      idle();
    }, 2600 + Math.random() * 3200);
  })();

  /* γαργαλητό */
  const TICKLE = ['Χαχα! Γαργαλιέμαι στα κυκλώματα!', 'Εδώ είμαι, καπετάνιε!', 'Μπιπ μπουπ! Έτοιμος για δράση!', 'Ωχ! Αυτό ήταν το κουμπί του γέλιου μου!', 'Πάμε για αποστολή;'];
  let tk = 0;
  q('.bot').addEventListener('click', () => {
    if (DB.app && DB.app.busy) return;
    DB.app.run(async () => { const t = TICKLE[tk++ % TICKLE.length]; const m = run(tk % 2 ? 'HAPPY' : 'SPIN'); await Promise.all([say(t), m]); });
  });

  applyLook(); eyes('normal');
  DB.robot = {
    COMMANDS, mount, run, say, eyes, lookAt, celebrate, confetti, stopAll, applyLook, sleep, set, rest,
    getMood: () => mood, setBubble(t) { bubble.textContent = t; }, el: wrap
  };
})();
