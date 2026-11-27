/* DimiBot – πρόοδος: αστέρια, εμπειρία (XP), επίπεδα, σερί ημερών, αναβαθμίσεις, επίπεδα δυσκολίας */
window.DB = window.DB || {};
(function () {
  const { read, write, today } = DB.store;

  /* Όλες οι αναβαθμίσεις του DimiBot. price = αστέρια, lvl = ελάχιστο επίπεδο */
  const ITEMS = {
    color: [
      { id: 'blue', name: 'Γαλάζιο', c: ['#4FA8FF', '#1E62D6'], price: 0 },
      { id: 'green', name: 'Πράσινο', c: ['#4ADE80', '#15803D'], price: 8 },
      { id: 'orange', name: 'Πορτοκαλί', c: ['#FFA24C', '#D9600B'], price: 8 },
      { id: 'purple', name: 'Μωβ', c: ['#B48CFF', '#6D33D6'], price: 10 },
      { id: 'red', name: 'Κόκκινο', c: ['#FF6B7A', '#C81E3A'], price: 10 },
      { id: 'midnight', name: 'Νυχτερινό', c: ['#5B6B92', '#1E2740'], price: 14, lvl: 3 },
      { id: 'gold', name: 'Χρυσό', c: ['#FFD966', '#C98A0B'], price: 25, lvl: 5 }
    ],
    eyes: [
      { id: 'cyan', name: 'Κυανά', c: '#5CF2FF', price: 0 },
      { id: 'lime', name: 'Λάιμ', c: '#A3FF6B', price: 6 },
      { id: 'pink', name: 'Ροζ', c: '#FF86E0', price: 6 },
      { id: 'gold', name: 'Χρυσά', c: '#FFD84D', price: 10 },
      { id: 'fire', name: 'Φωτιά', c: '#FF9B3D', price: 10, lvl: 2 },
      { id: 'white', name: 'Λευκά', c: '#EAF6FF', price: 12, lvl: 3 }
    ],
    hat: [
      { id: 'none', name: 'Τίποτα', e: '🚫', price: 0 },
      { id: 'cap', name: 'Καπέλο', e: '🧢', price: 10 },
      { id: 'headphones', name: 'Ακουστικά', e: '🎧', price: 12 },
      { id: 'pirate', name: 'Πειρατής', e: '🏴‍☠️', price: 14, lvl: 2 },
      { id: 'astro', name: 'Αστροναύτης', e: '🧑‍🚀', price: 18, lvl: 3 },
      { id: 'wizard', name: 'Μάγος', e: '🧙', price: 18, lvl: 4 },
      { id: 'band', name: 'Περιμετώπιο μπάσκετ', e: '🏀', price: 0 },
      { id: 'crown', name: 'Στέμμα', e: '👑', price: 30, lvl: 6 }
    ],
    shirt: [
      { id: 'none', name: 'Χωρίς φανέλα', e: '🚫', price: 0 },
      { id: 'aek', name: 'Κίτρινο-μαύρο (η ομάδα μου)', c: ['#FFD200', '#111111'], price: 0 },
      { id: 'peri', name: 'Κίτρινο-μπλε (Περιστέρι)', c: ['#FFD200', '#1D4E9E'], price: 0 },
      { id: 'white', name: 'Λευκή', c: ['#FFFFFF', '#1D4E9E'], price: 8 },
      { id: 'blue', name: 'Μπλε', c: ['#1D4E9E', '#FFD200'], price: 8 }
    ],
    back: [
      { id: 'none', name: 'Τίποτα', e: '🚫', price: 0 },
      { id: 'cape', name: 'Κάπα ήρωα', e: '🦸', price: 12 },
      { id: 'wings', name: 'Φτερά', e: '🕊️', price: 16, lvl: 2 },
      { id: 'jetpack', name: 'Jetpack', e: '🚀', price: 22, lvl: 3 }
    ],
    dance: [
      { id: 'robot', name: 'Ρομποτικός', e: '🤖', price: 0 },
      { id: 'disco', name: 'Ντίσκο', e: '🕺', price: 8 },
      { id: 'wave', name: 'Κύμα', e: '🌊', price: 10 },
      { id: 'spin', name: 'Σβούρα', e: '🌀', price: 14, lvl: 2 }
    ],
    scene: [
      { id: 'space', name: 'Διάστημα', price: 0 },
      { id: 'sunset', name: 'Ηλιοβασίλεμα', price: 10 },
      { id: 'ocean', name: 'Βυθός', price: 12 },
      { id: 'jungle', name: 'Ζούγκλα', price: 12, lvl: 2 },
      { id: 'candy', name: 'Ζαχαρούπολη', price: 15, lvl: 3 }
    ]
  };
  /* Το «σεντούκι» στο τέλος κάθε αποστολής δίνει δώρο το επόμενο από αυτή τη σειρά */
  const GIFTS = ['hat:cap', 'color:green', 'dance:disco', 'back:cape', 'scene:sunset', 'eyes:lime', 'hat:headphones', 'color:orange', 'dance:wave',
    'back:wings', 'scene:ocean', 'eyes:pink', 'hat:pirate', 'color:purple', 'hat:astro', 'back:jetpack', 'dance:spin', 'eyes:gold', 'scene:jungle',
    'color:red', 'hat:wizard', 'eyes:fire', 'scene:candy', 'color:midnight', 'eyes:white', 'hat:crown', 'color:gold'];

  const BASE = {
    stars: 0, total: 0, xp: 0, streak: 0, best: 0, lastDay: '', missions: 0, gift: 0,
    owned: { color: ['blue'], eyes: ['cyan'], hat: ['none', 'band'], back: ['none'], dance: ['robot'], scene: ['space'], shirt: ['none', 'aek', 'peri'] },
    look: { color: 'blue', eyes: 'cyan', hat: 'none', back: 'none', dance: 'robot', scene: 'space', shirt: 'none' },
    lv: { letters: 1, numbers: 1, english: 1, world: 1 },   // επίπεδο δυσκολίας ανά δεξιότητα (1–5)
    hist: { letters: [], numbers: [], english: [], world: [] },
    stat: { letters: [0, 0], numbers: [0, 0], english: [0, 0], world: [0, 0], routine: [0, 0] }, // [σωστά, προσπάθειες]
    words: {},       // αγγλικές λέξεις: { cat: { n: φορές, ok: σωστά } }
    seen: { fact: 0, lesson: 0, letter: 0 },
    routine: { day: '', st: {} }, // σημερινές ρουτίνες: id -> 'wait' | 'ok'
    mission: null,   // σημερινή αποστολή
    real: 0          // αστέρια από τη στιγμή που ορίστηκε ο στόχος του γονιού
  };
  const P = Object.assign(JSON.parse(JSON.stringify(BASE)), read('progress', {}));
  ['owned', 'look', 'lv', 'hist', 'stat', 'seen'].forEach(k => { P[k] = Object.assign({}, BASE[k], P[k]); });
  /* δώρο καλωσορίσματος μπάσκετ για όσους είχαν ήδη πρόοδο */
  if (!P.bball) { P.bball = 1; ['aek', 'peri'].forEach(i => { if (!P.owned.shirt.includes(i)) P.owned.shirt.push(i); }); if (!P.owned.hat.includes('band')) P.owned.hat.push('band'); P.owned.shirt = P.owned.shirt || ['none']; }
  const save = () => write('progress', P);
  const listeners = [];
  const emit = (type, data) => listeners.forEach(f => { try { f(type, data); } catch (e) {} });

  /* επίπεδο από XP: το επίπεδο L θέλει 60·L XP για να ανέβεις στο επόμενο */
  function levelInfo(xp = P.xp) {
    let L = 1, need = 60, left = xp;
    while (left >= need) { left -= need; L++; need = 60 * L; }
    return { level: L, cur: left, need };
  }

  function addStars(n, why) {
    if (!n) return;
    const before = levelInfo().level;
    P.stars += n; P.total += n; P.real += n; P.xp += n * 10; save();
    emit('stars', { n, why });
    const after = levelInfo().level;
    if (after > before) emit('level', { level: after });
  }
  function addXp(x) { const before = levelInfo().level; P.xp += x; save(); emit('xp', { x }); if (levelInfo().level > before) emit('level', { level: levelInfo().level }); }

  const find = (kind, id) => (ITEMS[kind] || []).find(i => i.id === id);
  const owns = (kind, id) => (P.owned[kind] || []).includes(id);
  function own(kind, id) { if (!owns(kind, id)) { P.owned[kind].push(id); save(); } }
  function buy(kind, id) {
    const it = find(kind, id); if (!it || owns(kind, id)) return false;
    if ((it.lvl || 1) > levelInfo().level || P.stars < it.price) return false;
    P.stars -= it.price; own(kind, id); emit('stars', { n: -it.price }); return true;
  }
  function wear(kind, id) { if (!owns(kind, id)) return; P.look[kind] = id; save(); emit('look', P.look); }
  function nextGift() {
    while (P.gift < GIFTS.length) {
      const [k, id] = GIFTS[P.gift++].split(':');
      if (!owns(k, id)) { own(k, id); save(); return { kind: k, item: find(k, id) }; }
    }
    save(); return null;
  }

  /* προσαρμοστική δυσκολία: πολλά σωστά → ανεβαίνει, πολλά λάθη → κατεβαίνει */
  function result(skill, ok) {
    const st = P.stat[skill] || (P.stat[skill] = [0, 0]); st[1]++; if (ok) st[0]++;
    if (!P.hist[skill]) { save(); return; }
    const h = P.hist[skill]; h.push(ok ? 1 : 0); while (h.length > 10) h.shift();
    const sum = a => a.reduce((x, y) => x + y, 0);
    let change = 0;
    if (h.length >= 8 && sum(h.slice(-8)) >= 7 && P.lv[skill] < 5) { P.lv[skill]++; P.hist[skill] = []; change = 1; }
    else if (h.length >= 6 && sum(h.slice(-6)) <= 2 && P.lv[skill] > 1) { P.lv[skill]--; P.hist[skill] = []; change = -1; }
    save(); if (change) emit('skill', { skill, lv: P.lv[skill], change });
  }

  /* σερί ημερών με ολοκληρωμένη αποστολή */
  function missionDone() {
    const d = today();
    if (P.lastDay !== d) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yd = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
      P.streak = P.lastDay === yd ? P.streak + 1 : 1; P.best = Math.max(P.best, P.streak); P.lastDay = d;
    }
    if (!P.day || P.day.d !== d) P.day = { d, n: 0 };
    P.day.n++; P.missions++; save();
  }

  /* ρουτίνες της ημέρας */
  function doneToday() { const d = DB.store.today(); return P.day && P.day.d === d ? P.day.n : 0; }
  function rday() { if (P.routine.day !== today()) { P.routine = { day: today(), st: {} }; save(); } return P.routine.st; }
  function routineMark(id) { const st = rday(); if (st[id]) return st[id]; st[id] = DB.settings.approve ? 'wait' : 'ok'; save(); if (st[id] === 'ok') addStars(1, 'routine'); P.stat.routine[0]++; P.stat.routine[1]++; DB.log.add('routine'); return st[id]; }
  function routineApprove(id) { const st = rday(); if (st[id] === 'wait') { st[id] = 'ok'; save(); addStars(1, 'routine'); return true; } return false; }
  function routineUndo(id) { const st = rday(); if (st[id] === 'ok') { P.stars = Math.max(0, P.stars - 1); } delete st[id]; save(); emit('stars', { n: 0 }); }

  function wordSeen(w, ok) { const r = P.words[w] || (P.words[w] = { n: 0, ok: 0 }); r.n++; if (ok) r.ok++; save(); }

  DB.progress = {
    ITEMS, GIFTS, data: P, save, levelInfo, addStars, addXp, find, owns, own, buy, wear, nextGift, result, missionDone,
    doneToday, rday, routineMark, routineApprove, routineUndo, wordSeen,
    look: () => P.look,
    on(fn) { listeners.push(fn); },
    reset() { Object.keys(P).forEach(k => delete P[k]); Object.assign(P, JSON.parse(JSON.stringify(BASE))); save(); emit('look', P.look); emit('stars', { n: 0 }); }
  };
})();
