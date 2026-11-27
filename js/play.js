/* DimiBot – Παιχνίδια: Εργαστήρι (προγραμματισμός με κάρτες), Λαβύρινθος (βελάκια), Μνήμη */
window.DB = window.DB || {};
(function () {
  const $ = s => document.querySelector(s);
  const R = () => DB.robot, V = DB.voice, S = DB.settings, PR = DB.progress, C = DB.content;
  const run = fn => DB.app.run(fn);
  const capped = (type, max) => DB.log.count(type) <= max;

  /* Κάρτες εντολών (χρώμα ανά είδος, όπως στο Scratch: κίνηση = μπλε, ήχος = ροζ, έλεγχος = πορτοκαλί) */
  const MOVE = ['#4FA8FF', '#0B3D91'], TALK = ['#FF86C8', '#7A1050'], CTRL = ['#FFB547', '#6B3A00'];
  const CARDS = {
    hello: { e: '👋', label: 'Γεια', col: TALK, go: async () => { const s = R().say(`Γεια σου ${S.childName}!`); await R().run('HELLO'); await s; } },
    right: { e: '✋', label: 'Δεξί χέρι', col: MOVE, go: () => R().run('WAVE_R') },
    left: { e: '🤚', label: 'Αριστερό χέρι', col: MOVE, go: () => R().run('WAVE_L') },
    head: { e: '🙃', label: 'Κεφάλι', col: MOVE, go: () => R().run('HEAD') },
    jump: { e: '🦘', label: 'Άλμα', col: MOVE, go: () => R().run('JUMP') },
    spin: { e: '🌀', label: 'Σβούρα', col: MOVE, go: () => R().run('SPIN') },
    dunk: { e: '🏀', label: 'Κάρφωμα', col: MOVE, go: () => R().run('DUNK') },
    dance: { e: '🕺', label: 'Χορός', col: MOVE, go: () => R().run('DANCE') },
    joke: { e: '😂', label: 'Αστείο', col: TALK, go: async () => { R().eyes('happy'); await R().say(C.JOKES[Math.floor(Math.random() * C.JOKES.length)]); R().eyes('normal'); DB.log.add('joke'); } },
    heart: { e: '💖', label: 'Καρδούλες', col: TALK, go: () => R().run('HEART') },
    think: { e: '🤔', label: 'Σκέψου', col: TALK, go: () => R().run('THINK') },
    wait: { e: '⏱️', label: 'Περίμενε', col: CTRL, go: async () => { R().setBubble('Περιμένω… 1… 2…'); await R().sleep(2000); } },
    sleep: { e: '😴', label: 'Νάνι', col: CTRL, go: () => R().run('SLEEP') }
  };
  const cardBtn = (k, cls = 'act', attr = '') => `<button class="${cls}" ${attr} style="--c1:${CARDS[k].col[0]};--c2:${CARDS[k].col[1]}"><span class="emo">${CARDS[k].e}</span><span>${CARDS[k].label}</span></button>`;

  /* ---------- Εργαστήρι ---------- */
  let train = ['hello', 'jump', 'dance'];
  function drawTrain(active = -1) {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const k = train[i];
      out.push(k ? cardBtn(k, 'slot full' + (i === active ? ' on' : ''), `data-i="${i}" aria-label="${CARDS[k].label}, πάτα για να βγει"`) : `<div class="slot" aria-hidden="true">${i + 1}</div>`);
    }
    $('#train').innerHTML = out.join('');
  }
  function initWorkshop() {
    $('#cards').innerHTML = Object.keys(CARDS).map(k => cardBtn(k, 'act', `data-k="${k}"`)).join('');
    $('#cards').addEventListener('click', e => { const b = e.target.closest('.act'); if (!b || DB.app.busy || train.length >= 8) return; train.push(b.dataset.k); V.sfx.pop(); drawTrain(); });
    $('#train').addEventListener('click', e => { const b = e.target.closest('.slot.full'); if (!b || DB.app.busy) return; train.splice(+b.dataset.i, 1); V.sfx.tap(); drawTrain(); });
    $('#trainClear').addEventListener('click', () => { if (!DB.app.busy) { train = []; drawTrain(); } });
    $('#trainGo').addEventListener('click', () => run(async () => {
      if (!train.length) { await R().say('Το πρόγραμμα είναι άδειο! Βάλε μου κάρτες!'); return; }
      for (let i = 0; i < train.length; i++) { drawTrain(i); await CARDS[train[i]].go(); await R().sleep(200); }
      drawTrain(); DB.log.add('workshop');
      if (train.length >= 4 && capped('workshop', 3)) { PR.addStars(1, 'workshop'); DB.ui.flyStar($('#trainGo')); }
      await R().celebrate(); await R().say(train.length >= 4 ? 'Τι πρόγραμμα! Είσαι αληθινός προγραμματιστής!' : 'Δούλεψε! Δοκίμασε ένα μεγαλύτερο πρόγραμμα!');
    }).finally(() => drawTrain()));
    drawTrain();
  }

  /* ---------- Λαβύρινθος ---------- */
  const LEVELS = [
    { s: [0, 2], g: [3, 2], r: [] }, { s: [2, 4], g: [2, 0], r: [] }, { s: [0, 4], g: [4, 4], r: [[2, 4]] },
    { s: [0, 0], g: [4, 4], r: [[1, 1], [2, 2], [3, 3]] }, { s: [0, 2], g: [4, 2], r: [[2, 1], [2, 2], [2, 3]] },
    { s: [4, 4], g: [0, 0], r: [[1, 0], [1, 1], [3, 3], [3, 4], [2, 1]] }, { s: [0, 0], g: [4, 0], r: [[1, 0], [1, 1], [3, 0], [3, 1], [3, 2]] },
    { s: [2, 2], g: [0, 4], r: [[1, 2], [1, 3], [2, 3], [0, 2]] }, { s: [0, 4], g: [4, 0], r: [[0, 2], [1, 2], [2, 2], [3, 0], [3, 1], [4, 3]] },
    { s: [2, 0], g: [2, 4], r: [[1, 1], [2, 1], [3, 1], [1, 3], [2, 3], [3, 3], [0, 2]] }, { s: [0, 0], g: [4, 4], r: [[0, 1], [1, 1], [2, 1], [3, 3], [4, 3], [2, 3], [1, 3]] },
    { s: [4, 2], g: [0, 2], r: [[3, 1], [3, 2], [3, 3], [1, 0], [1, 1], [1, 2], [1, 4]] }
  ];
  const DIRS = { up: [0, -1, '⬆️', 'Πάνω'], down: [0, 1, '⬇️', 'Κάτω'], left: [-1, 0, '⬅️', 'Αριστερά'], right: [1, 0, '➡️', 'Δεξιά'] };
  const BOT_T = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="6" r="4" fill="#5CF2FF"/><path d="M20 9v5" stroke="#9FB0C4" stroke-width="3"/><rect x="5" y="13" width="30" height="24" rx="11" fill="#fff"/><rect x="9" y="17" width="22" height="15" rx="7" fill="#121A3A"/><rect x="13" y="20" width="5" height="8" rx="2.5" fill="#5CF2FF"/><rect x="22" y="20" width="5" height="8" rx="2.5" fill="#5CF2FF"/></svg>';
  let lv = 0, prog = [], pos = null, active = -1;
  const mazeLv = () => Math.min(PR.data.maze || 0, LEVELS.length - 1);
  function drawBoard() {
    const L = LEVELS[lv], t = [];
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      let c = '';
      if (pos[0] === x && pos[1] === y) c = BOT_T; else if (L.g[0] === x && L.g[1] === y) c = '<span class="emo">🔋</span>'; else if (L.r.some(r => r[0] === x && r[1] === y)) c = '<span class="emo">☄️</span>';
      t.push(`<div class="tile">${c}</div>`);
    }
    $('#board').innerHTML = t.join('');
    $('#lvlTxt').textContent = 'Πίστα ' + (lv + 1) + ' / ' + LEVELS.length;
  }
  function drawProg() { $('#prog').innerHTML = prog.length ? prog.map((d, i) => `<span class="step${i === active ? ' on' : ''}">${DIRS[d][2]}</span>`).join('') : '<span class="note">Πάτα βελάκια για να φτιάξεις τον δρόμο!</span>'; }
  function startLevel() { pos = LEVELS[lv].s.slice(); prog = []; active = -1; drawBoard(); drawProg(); }
  function initMaze() {
    lv = mazeLv();
    $('#arrows').innerHTML = ['left', 'up', 'down', 'right'].map(d => `<button class="arrow" data-d="${d}" aria-label="${DIRS[d][3]}">${DIRS[d][2]}</button>`).join('');
    $('#arrows').addEventListener('click', e => { const b = e.target.closest('.arrow'); if (!b || DB.app.busy || prog.length >= 16) return; prog.push(b.dataset.d); V.sfx.tap(); drawProg(); });
    $('#mazeUndo').addEventListener('click', () => { if (!DB.app.busy) { prog.pop(); drawProg(); } });
    $('#mazeReset').addEventListener('click', () => { if (!DB.app.busy) startLevel(); });
    $('#mazeRun').addEventListener('click', () => run(async () => {
      if (!prog.length) { await R().say('Βάλε μου πρώτα βελάκια!'); return; }
      const L = LEVELS[lv]; pos = L.s.slice(); drawBoard(); let ok = true;
      for (let i = 0; i < prog.length; i++) {
        active = i; drawProg();
        const [dx, dy] = DIRS[prog[i]], nx = pos[0] + dx, ny = pos[1] + dy;
        R().lookAt(dx * 9, dy * 7);
        if (nx < 0 || ny < 0 || nx > 4 || ny > 4) { ok = false; R().eyes('surprise'); V.sfx.wrong(); await R().say('Ωπ! Εκεί τελειώνει ο χάρτης!'); break; }
        if (L.r.some(r => r[0] === nx && r[1] === ny)) { ok = false; R().eyes('sad'); V.sfx.wrong(); await R().say('Μπουμ! Μετεωρίτης! Ας διορθώσουμε το πρόγραμμα.'); break; }
        pos = [nx, ny]; drawBoard(); V.tone(440 + i * 40, .12); await R().sleep(420);
        if (nx === L.g[0] && ny === L.g[1]) break;
      }
      active = -1; drawProg(); R().lookAt(0, 0);
      if (ok && pos[0] === L.g[0] && pos[1] === L.g[1]) {
        DB.log.add('maze');
        if (lv >= mazeLv()) { PR.addStars(1, 'maze'); DB.ui.flyStar($('#board')); }
        await R().celebrate();
        await R().say(lv < LEVELS.length - 1 ? 'Βρήκα την μπαταρία! Γεμίζω ενέργεια! Πάμε στην επόμενη πίστα!' : 'Τα κατάφερες όλα! Είσαι μάστορας του κώδικα!');
        if (lv < LEVELS.length - 1) { lv++; if (lv > (PR.data.maze || 0)) { PR.data.maze = lv; PR.save(); } }
        startLevel();
      } else {
        if (ok) await R().say('Δεν έφτασα ακόμα. Πρόσθεσε κι άλλα βελάκια!');
        pos = L.s.slice(); drawBoard(); R().eyes('normal');
      }
    }));
    startLevel();
  }

  /* ---------- Μνήμη: κάνε ό,τι κάνω ---------- */
  const PADS = [
    { e: '✋', label: 'Δεξί χέρι', col: '#FFB547', f: 392, go: async () => { R().set('armR', 'rotate(-150deg)'); await R().sleep(380); R().set('armR', ''); } },
    { e: '🤚', label: 'Αριστερό χέρι', col: '#4FA8FF', f: 494, go: async () => { R().set('armL', 'rotate(150deg)'); await R().sleep(380); R().set('armL', ''); } },
    { e: '🙃', label: 'Κεφάλι', col: '#FF86C8', f: 587, go: async () => { R().set('head', 'rotate(-14deg)'); await R().sleep(380); R().set('head', ''); } },
    { e: '🦘', label: 'Άλμα', col: '#4ADE80', f: 698, go: async () => { R().set('bot', 'translateY(-30px)'); await R().sleep(380); R().set('bot', ''); } }
  ];
  let seq = [], idx = 0, turn = false, padEls = [];
  async function flash(i) { padEls[i].classList.add('lit'); V.tone(PADS[i].f, .3, 'triangle', .2); await PADS[i].go(); padEls[i].classList.remove('lit'); await R().sleep(150); }
  async function robotTurn() {
    turn = false; padEls.forEach(b => b.disabled = true);
    seq.push(Math.floor(Math.random() * 4)); $('#simonLvl').textContent = 'Γύρος ' + seq.length;
    await R().say(seq.length === 1 ? 'Κοίτα με καλά!' : 'Και τώρα, άλλη μία!');
    for (const i of seq) await flash(i);
    idx = 0; turn = true; padEls.forEach(b => b.disabled = false); R().setBubble('Σειρά σου!');
  }
  function initSimon() {
    $('#pads').innerHTML = PADS.map((p, i) => `<button class="pad" data-i="${i}" style="--pc:${p.col}" disabled><span class="emo">${p.e}</span>${p.label}</button>`).join('');
    padEls = [...document.querySelectorAll('.pad')];
    const best = () => { $('#simonBest').textContent = 'Ρεκόρ: ' + (PR.data.simon || 0); };
    best();
    $('#simonGo').addEventListener('click', () => { if (DB.app.busy) return; seq = []; run(robotTurn); });
    $('#pads').addEventListener('click', e => {
      const b = e.target.closest('.pad'); if (!b || !turn || DB.app.busy) return;
      const i = +b.dataset.i; turn = false;
      run(async () => {
        padEls.forEach(x => x.disabled = true); await flash(i);
        if (i !== seq[idx]) {
          R().eyes('sad'); V.sfx.wrong();
          const got = seq.length - 1; if (got > (PR.data.simon || 0)) { PR.data.simon = got; PR.save(); best(); }
          await R().say(got > 0 ? `Θυμήθηκες ${got === 1 ? 'μία κίνηση' : C.NUM[Math.min(10, got)] + ' κινήσεις'}! Πάμε για ρεκόρ;` : 'Ουπς! Πάμε πάλι;');
          R().eyes('normal'); seq = []; $('#simonLvl').textContent = 'Πάτα «Ξεκίνα»'; return;
        }
        idx++;
        if (idx === seq.length) {
          DB.log.add('simon'); R().eyes('happy');
          if (seq.length > (PR.data.simon || 0)) { PR.data.simon = seq.length; PR.save(); best(); }
          if (seq.length % 3 === 0) { if (capped('simon', 30)) { PR.addStars(1, 'simon'); DB.ui.flyStar($('#pads')); } await R().celebrate(); }
          await R().say(['Μπράβο!', 'Τέλεια!', 'Τι μνήμη!', 'Σαν υπολογιστής!'][seq.length % 4]);
          await robotTurn();
        } else { turn = true; padEls.forEach(x => x.disabled = false); }
      });
    });
  }

  /* ---------- ελεύθερο παιχνίδι με τα μίνι παιχνίδια της αποστολής ---------- */
  let freeTok = 0;
  async function freePlay(g) {
    const my = ++freeTok, alive = () => my === freeTok && !$('#g-' + g).hidden && DB.app.view === 'games';
    const el = $('#g-' + g), A = DB.arcade, P = PR.data;
    el.innerHTML = '<div class="mArea free"></div>';
    const area = el.firstChild;
    let r = null;
    if (g === 'pairs') r = await A.pairs(area, alive, Math.random() < .5 ? 'english' : 'letters', P.lv.english, Object.keys(P.words).slice(-4));
    if (g === 'whack') r = await A.whack(area, alive, Math.random() < .5 ? 'letters' : 'numbers', P.lv.letters);
    if (g === 'sortg') r = await A.sort(area, alive, P.lv.world, Math.floor(Math.random() * 8));
    if (g === 'hoopg') r = await A.hoop(area, alive, P.lv.numbers);
    if (!r || !alive()) return;
    DB.log.add('freeplay');
    if (capped('freeplay', 5)) { PR.addStars(1, 'free'); DB.ui.flyStar(area); }
    el.innerHTML = '<div class="again"><span class="emo">🏆</span><button class="go big" data-again>🔁 Ξανά!</button></div>';
    el.querySelector('[data-again]').onclick = () => freePlay(g);
    R().say(['Τέλεια! Ξανά;', 'Είσαι αστέρι! Πάμε άλλο ένα;', 'Μπαμ! Άλλη μία;'][Math.floor(Math.random() * 3)]);
  }

  const INTRO = { maze: 'Βοήθησέ με να βρω την μπαταρία! Πρόσεχε τους μετεωρίτες!', simon: 'Θα κάνω κινήσεις. Μπορείς να τις θυμηθείς;', workshop: 'Βάλε κάρτες στη σειρά και πάτα Πάμε. Εσύ με προγραμματίζεις!', pairs: '', whack: '', sortg: '', hoopg: '' };
  function initModes() {
    document.querySelectorAll('.mode').forEach(m => m.addEventListener('click', () => {
      if (DB.app.busy) return;
      document.querySelectorAll('.mode').forEach(x => x.setAttribute('aria-pressed', x === m));
      const g = m.dataset.g;
      ['workshop', 'maze', 'simon', 'pairs', 'whack', 'sortg', 'hoopg'].forEach(x => { $('#g-' + x).hidden = x !== g; });
      V.sfx.tap(); freeTok++;
      if (['pairs', 'whack', 'sortg', 'hoopg'].includes(g)) freePlay(g); else R().say(INTRO[g]);
    }));
  }

  DB.play = { CARDS, init() { initWorkshop(); initMaze(); initSimon(); initModes(); } };
})();
