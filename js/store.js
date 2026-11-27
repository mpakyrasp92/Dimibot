/* DimiBot – αποθήκευση ρυθμίσεων, μνήμης, χρόνου και ιστορικού (μόνο τοπικά στο tablet) */
window.DB = window.DB || {};
(function () {
  const PREFIX = 'dimibot2.';
  const read = (k, d) => { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  /* Οι ρουτίνες του σπιτιού. Ο γονιός τις αλλάζει από τον γονικό χώρο. when: morning | day | evening */
  const ROUTINES = [
    { id: 'teethAm', e: '🪥', label: 'Βούρτσισα τα δόντια μου', when: 'morning', on: true },
    { id: 'dress', e: '👕', label: 'Ντύθηκα μόνος μου', when: 'morning', on: true },
    { id: 'breakfast', e: '🥣', label: 'Έφαγα το πρωινό μου', when: 'morning', on: false },
    { id: 'toys', e: '🧸', label: 'Μάζεψα τα παιχνίδια μου', when: 'day', on: true },
    { id: 'hands', e: '🧼', label: 'Έπλυνα τα χέρια πριν το φαγητό', when: 'day', on: true },
    { id: 'help', e: '🤝', label: 'Βοήθησα στο σπίτι', when: 'day', on: false },
    { id: 'teethPm', e: '🪥', label: 'Βούρτσισα τα δόντια πριν τον ύπνο', when: 'evening', on: true },
    { id: 'bath', e: '🛁', label: 'Έκανα μπάνιο', when: 'evening', on: false }
  ];

  const DEFAULTS = {
    provider: 'gemini',
    provider2: '',
    oaPreset: 'groq', oaKey: '', oaModel: '', oaBase: '',
    claudeKey: '', claudeModel: '',
    quickLocal: true,
    apiKey: '',
    model: 'gemini-3.8-flash',
    aiOn: true,
    camOn: true,
    pitch: 1.5,
    rate: 1.1,
    keepAlive: false,
    childName: 'Δημήτρη',
    dailyMinutes: 45,
    maxMissions: 5,
    jersey: 7,
    songs: true,
    ttsEngine: 'gemini',   // 'gemini' = πιο ζωντανή φωνή από το Gemini, 'device' = φωνή του tablet
    ttsVoice: 'Leda',
    ttsRate: 1.08,
    ttsRobot: false,
    ttsScope: 'all',       // 'all' ή 'chat' (μόνο στη συζήτηση)
    deviceVoice: '',
    profile: '',          // «φάκελος» του παιδιού από τους γονείς (ελεύθερο κείμενο)
    goals: '',            // στόχοι συμπεριφοράς
    todayNote: { d: '', t: '' },
    pin: '',
    cats: { routine: true, letters: true, english: true, world: true },
    approve: true,
    goal: { stars: 50, text: '' },
    routines: ROUTINES
  };

  const settings = Object.assign({}, DEFAULTS, read('settings', {}));
  settings.cats = Object.assign({}, DEFAULTS.cats, settings.cats);
  settings.save = () => { const c = Object.assign({}, settings); delete c.save; write('settings', c); };

  /* Μνήμη: μόνο ό,τι εγκρίνει ο γονιός */
  const memory = {
    items: read('memory', []),
    pending: read('pending', []),
    save() { write('memory', this.items); write('pending', this.pending); },
    add(k, v) { this.items.push({ k, v }); this.save(); },
    remove(i) { this.items.splice(i, 1); this.save(); },
    propose(text) {
      text = String(text).trim().slice(0, 140);
      if (!text || this.pending.includes(text) || this.items.some(m => m.v === text)) return;
      this.pending.push(text); this.pending = this.pending.slice(-10); this.save();
    },
    approve(i) { const t = this.pending.splice(i, 1)[0]; if (t) this.items.push({ k: 'Θυμάμαι', v: t }); this.save(); },
    reject(i) { this.pending.splice(i, 1); this.save(); }
  };

  /* Πρώτες γνώσεις για τον Δημήτρη (ο γονιός τις αλλάζει ή τις σβήνει στο «Τετράδιο») */
  if (!read('seed_bball', false)) {
    [['Άθλημα', 'Παίζει μπάσκετ στην ΑΕΚ Περιστερίου'], ['Αγαπημένη ομάδα', 'Το Περιστέρι (ΓΣΠ) – πηγαίνουμε μαζί στο γήπεδο']].forEach(([k, v]) => { if (!memory.items.some(m => m.v === v)) memory.items.push({ k, v }); });
    memory.save(); write('seed_bball', true);
  }

  /* Χρόνος οθόνης ανά ημέρα */
  const usage = {
    data: read('usage', { day: today(), seconds: 0 }),
    tick(sec) { if (this.data.day !== today()) this.data = { day: today(), seconds: 0 }; this.data.seconds += sec; write('usage', this.data); },
    minutes() { if (this.data.day !== today()) return 0; return Math.floor(this.data.seconds / 60); },
    reset() { this.data = { day: today(), seconds: 0 }; write('usage', this.data); },
    over() { return this.minutes() >= settings.dailyMinutes; }
  };

  /* Ιστορικό δραστηριοτήτων (μόνο μετρητές, όχι συζητήσεις) */
  const LABELS = { talk: 'Συζητήσεις', mission: 'Αποστολές', dance: 'Χοροί', joke: 'Αστεία', riddle: 'Γρίφοι', workshop: 'Προγράμματα στο Εργαστήρι', maze: 'Πίστες λαβυρίνθου', simon: 'Γύροι μνήμης', camera: 'Φωτογραφίες «Τι είναι αυτό;»', routine: 'Ρουτίνες', right: 'Σωστές απαντήσεις', wrong: 'Λάθη (και ξαναπροσπάθειες)' };
  const log = {
    data: read('log', {}),
    add(type) { const d = today(); this.data[d] = this.data[d] || {}; this.data[d][type] = (this.data[d][type] || 0) + 1;
      const days = Object.keys(this.data).sort(); while (days.length > 30) delete this.data[days.shift()]; write('log', this.data); },
    count(type) { return ((this.data[today()] || {})[type]) || 0; },
    todayLines() { const t = this.data[today()] || {}; return Object.keys(t).map(k => `${LABELS[k] || k}: ${t[k]}`); }
  };

  DB.store = { read, write, today };
  DB.ROUTINES_DEFAULT = ROUTINES;
  DB.settings = settings;
  DB.memory = memory;
  DB.usage = usage;
  DB.log = log;
})();
