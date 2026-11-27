/* DimiBot – φωνή και ήχοι. Ακούει ΜΟΝΟ όταν πατηθεί κουμπί. */
window.DB = window.DB || {};
(function () {
  const S = DB.settings;
  let greek = null, english = null;
  const hasTTS = 'speechSynthesis' in window;
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;

  function pickVoices() {
    if (!hasTTS) return;
    const list = speechSynthesis.getVoices() || [];
    greek = (S.deviceVoice && list.find(v => v.name === S.deviceVoice)) || list.find(v => /^el/i.test(v.lang) && /google/i.test(v.name)) || list.find(v => /^el/i.test(v.lang)) || null;
    english = list.find(v => /^en-US/i.test(v.lang) && /google/i.test(v.name)) || list.find(v => /^en-GB/i.test(v.lang)) || list.find(v => /^en/i.test(v.lang)) || null;
  }
  if (hasTTS) { pickVoices(); speechSynthesis.onvoiceschanged = pickVoices; }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  let talking = null; // callback(on) για το στόμα του ρομπότ

  /* ================= Φωνή Gemini (πιο ζωντανή, παιδική) =================
     Κάθε φράση γίνεται ήχος από το Gemini TTS. Οι φράσεις που επαναλαμβάνονται (γράμματα, αριθμοί,
     «Μπράβο!») αποθηκεύονται στο tablet, ώστε να μην ξαναζητηθούν και να ακούγονται αμέσως.
     Αν κάτι πάει στραβά (χωρίς internet, όριο, αργή απάντηση) γυρίζει μόνο του στη φωνή του tablet. */
  const VOICES = [['Leda', 'Νεανική'], ['Puck', 'Χαρούμενη'], ['Fenrir', 'Ενθουσιώδης'], ['Zephyr', 'Φωτεινή'], ['Sadachbia', 'Ζωηρή'], ['Laomedeia', 'Γλυκιά & κεφάτη'], ['Aoede', 'Ανάλαφρη'], ['Achird', 'Φιλική']];
  const STYLE = 'Παιδική, χαρούμενη, παιχνιδιάρικη φωνή ενός μικρού ρομπότ-ήρωα από ταινία κινουμένων σχεδίων. Μιλάει με ενέργεια, χαμόγελο και εκφραστικότητα, σαν να παίζει με τον καλύτερό του φίλο. Λίγο γρήγορα.';
  const TTS_MODELS = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-3.1-flash-tts-preview'];
  const cloud = DB.tts_stats = { err: '', off: '', ms: 0, n: 0 };
  let modelIdx = 0, useLegacy = false;
  const mem = new Map();
  let cdb = null;
  function cacheDb() {
    if (cdb) return cdb;
    cdb = new Promise(res => { try { const r = indexedDB.open('dimibot-voice', 1); r.onupgradeneeded = () => r.result.createObjectStore('a'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); } });
    return cdb;
  }
  async function cacheGet(k) { if (mem.has(k)) return mem.get(k); const d = await cacheDb(); if (!d) return null; return new Promise(res => { try { const q = d.transaction('a').objectStore('a').get(k); q.onsuccess = () => { if (q.result) mem.set(k, q.result); res(q.result || null); }; q.onerror = () => res(null); } catch (e) { res(null); } }); }
  async function cachePut(k, buf) { mem.set(k, buf); if (k.length > 120) return; const d = await cacheDb(); if (!d) return; try { d.transaction('a', 'readwrite').objectStore('a').put(buf, k); } catch (e) {} }
  const b64 = s => { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
  function findAudio(o) { // ψάχνει το base64 του ήχου μέσα στην απάντηση, όπου κι αν βρίσκεται
    if (!o || typeof o !== 'object') return null;
    if (typeof o.data === 'string' && o.data.length > 200) return o.data;
    for (const k in o) { const r = findAudio(o[k]); if (r) return r; }
    return null;
  }
  async function fetchAudio(text, signal) {
    const key = S.apiKey, voice = S.ttsVoice || 'Leda';
    for (;;) {
      const model = TTS_MODELS[modelIdx];
      let url, body;
      if (!useLegacy) {
        url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
        body = { model, input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: STYLE }] }] }], response_format: { type: 'audio' }, generation_config: { speech_config: [{ voice }] } };
      } else {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        body = { contents: [{ parts: [{ text: STYLE + '\n\nΠες ακριβώς: ' + text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } };
      }
      const r = await fetch(url, { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
      const data = await r.json().catch(() => ({}));
      if (r.ok) { const a = findAudio(data); if (!a) throw new Error('Δεν ήρθε ήχος'); return b64(a); }
      const msg = (data.error && data.error.message) || ('HTTP ' + r.status);
      if (r.status === 429) { if (modelIdx < TTS_MODELS.length - 1) { modelIdx++; useLegacy = false; continue; } cloud.off = Date.now() + 60 * 60000; modelIdx = 0; throw new Error('Τελείωσε το δωρεάν όριο φωνής Gemini για τώρα (429). Ξαναδοκιμάζω σε μία ώρα· το όριο μηδενίζεται κάθε μέρα γύρω στις 10:00 το πρωί.'); }
      if ((r.status === 404 || r.status === 400) && !useLegacy) { useLegacy = true; continue; }
      if ((r.status === 404 || r.status === 400 || r.status === 503 || r.status === 500 || /high demand|overloaded/i.test(msg)) && modelIdx < TTS_MODELS.length - 1) { modelIdx++; useLegacy = false; continue; }
      throw new Error(msg);
    }
  }
  async function toBuffer(ab) {
    const a = ctx(); const u = new Uint8Array(ab);
    if (u[0] === 0x52 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x46) return a.decodeAudioData(ab.slice(0));
    const n = Math.floor(u.length / 2), buf = a.createBuffer(1, n, 24000), ch = buf.getChannelData(0), dv = new DataView(ab);
    for (let i = 0; i < n; i++) ch[i] = dv.getInt16(i * 2, true) / 32768;
    return buf;
  }
  const keyOf = t => (S.ttsVoice || 'Leda') + '|' + t;
  const inflight = new Map();
  function getAudio(text) {
    const k = keyOf(text);
    if (inflight.has(k)) return inflight.get(k);
    const p = (async () => {
      const c = await cacheGet(k); if (c) return c;
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000); const t0 = performance.now();
      try { const ab = await fetchAudio(text, ctl.signal); cloud.ms = Math.round(performance.now() - t0); cloud.n++; cloud.err = ''; cachePut(k, ab); return ab; }
      finally { clearTimeout(t); }
    })();
    inflight.set(k, p); p.finally(() => inflight.delete(k)).catch(() => {});
    return p;
  }
  const cloudOn = (chat) => S.ttsEngine === 'gemini' && (S.ttsScope !== 'chat' || chat) && !!S.apiKey && navigator.onLine !== false && !(cloud.off && Date.now() < cloud.off);
  const plain = t => String(t).replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  let src = null, playTok = 0;
  async function cloudSpeak(text) {
    const my = ++playTok;
    const ab = await getAudio(text);
    if (my !== playTok) return;
    const a = ctx(); if (a.state === 'suspended') await a.resume().catch(() => {});
    const buf = await toBuffer(ab);
    if (my !== playTok) return;
    await new Promise(res => {
      const s = a.createBufferSource(); s.buffer = buf; s.playbackRate.value = +S.ttsRate || 1.08;
      let out = s;
      if (S.ttsRobot) { // ελαφρύ «ρομποτικό» χρώμα: λίγη διαμόρφωση πάνω στη φωνή
        const g = a.createGain(), mod = a.createOscillator(), mg = a.createGain();
        mod.frequency.value = 38; mg.gain.value = .35; g.gain.value = .75; mod.connect(mg).connect(g.gain); mod.start(); s.connect(g); out = g; s.onended0 = () => mod.stop();
      }
      out.connect(a.destination);
      s.onended = () => { if (s.onended0) s.onended0(); if (src === s) src = null; res(); };
      src = s; s.start();
    });
  }
  function cloudStop() { playTok++; if (src) { try { src.stop(); } catch (e) {} src = null; } }
  function prefetch(text, chat) { if (cloudOn(chat)) { const t = plain(text); if (t && /[\p{L}\p{N}]/u.test(t)) getAudio(t).catch(() => {}); } }

  /* Μιλάει. Το κείμενο μπορεί να έχει κομμάτια στα αγγλικά μέσα σε {…}: «Η γάτα λέγεται {cat}!» */
  /* Γρήγορη λειτουργία: στα παιχνίδια, αν μια φράση δεν είναι ακόμα αποθηκευμένη, μιλάει ΑΜΕΣΩΣ με τη φωνή
     του tablet και κατεβάζει τη φωνή Gemini στο παρασκήνιο για την επόμενη φορά. Στη συζήτηση περιμένει το Gemini. */
  const bgQueue = []; let bgBusy = false;
  function bgFetch(t) {
    if (bgQueue.includes(t) || bgQueue.length > 40) return;
    bgQueue.push(t); if (!bgBusy) pump();
  }
  async function pump() {
    bgBusy = true;
    while (bgQueue.length && cloudOn(true)) { const t = bgQueue.shift(); try { await getAudio(t); } catch (e) {} await wait(400); }
    bgBusy = false;
  }
  async function isCached(t) { const k = keyOf(t); if (mem.has(k)) return true; return !!(await Promise.race([cacheGet(k), wait(120).then(() => null)])); }
  async function speak(text, opts) {
    const chat = !!(opts && opts.chat);
    if (cloudOn(chat)) {
      const t = plain(text);
      if (!t || !/[\p{L}\p{N}]/u.test(t)) return;
      const fast = !chat && S.ttsWait !== true;
      if (fast && !(await isCached(t))) { bgFetch(t); return deviceSpeak(text); }
      cloudStop(); if (hasTTS) try { speechSynthesis.cancel(); } catch (e) {}
      talking && talking(true);
      try { await cloudSpeak(t); return; }
      catch (e) { cloud.err = e.name === 'AbortError' ? 'Η φωνή Gemini άργησε· μίλησα με τη φωνή του tablet.' : e.message; }
      finally { talking && talking(false); }
    }
    return deviceSpeak(text);
  }

  async function deviceSpeak(text) {
    const parts = String(text).split(/(\{[^}]+\})/).filter(Boolean);
    if (hasTTS) try { speechSynthesis.cancel(); } catch (e) {}
    talking && talking(true);
    try {
      for (const p of parts) {
        const en = p[0] === '{';
        await one(en ? p.slice(1, -1) : p, en);
      }
    } finally { talking && talking(false); }
  }
  function one(text, en) {
    text = text.trim(); if (!text || !/[\p{L}\p{N}]/u.test(text)) return Promise.resolve();
    const guess = Math.max(900, text.length * 75);
    if (!hasTTS) return wait(guess);
    return new Promise(res => {
      let done = false; const end = () => { if (!done) { done = true; res(); } };
      try {
        const u = new SpeechSynthesisUtterance(text);
        if (en) { u.lang = 'en-US'; if (english) u.voice = english; u.rate = 0.85; u.pitch = Math.min(1.4, +S.pitch || 1.4); }
        else { u.lang = 'el-GR'; if (greek) u.voice = greek; u.pitch = +S.pitch || 1.5; u.rate = +S.rate || 1; }
        u.onend = end; u.onerror = end;
        speechSynthesis.speak(u);
      } catch (e) { end(); }
      setTimeout(end, guess + 6000);
    });
  }
  function stop() { cloudStop(); if (hasTTS) speechSynthesis.cancel(); if (current) try { current.abort(); } catch (e) {} talking && talking(false); }

  /* Ακούει μία φράση. lang: 'el-GR' ή 'en-US'. Επιστρέφει το κείμενο ή '' */
  let current = null;
  function listen(lang = 'el-GR') {
    return new Promise((res, rej) => {
      if (!Rec) return rej(new Error('no-stt'));
      const r = new Rec(); current = r;
      r.lang = lang; r.interimResults = false; r.maxAlternatives = 3; r.continuous = false;
      let text = '';
      r.onresult = e => { const alts = e.results[0] ? [...e.results[0]].map(a => a.transcript) : []; text = alts.join(' | '); };
      r.onerror = e => { current = null; if (e.error === 'no-speech' || e.error === 'aborted') res(''); else rej(new Error(e.error)); };
      r.onend = () => { current = null; res(text); };
      try { r.start(); setTimeout(() => { try { r.stop(); } catch (e) {} }, 8000); } catch (e) { rej(e); }
    });
  }

  /* Κρατάει ξύπνιο το Bluetooth ηχείο με σχεδόν αθόρυβο σήμα */
  let ac = null, osc = null;
  const ctx = () => (ac = ac || new (window.AudioContext || window.webkitAudioContext)());
  function keepAlive(on) {
    try {
      if (on && !osc) { osc = ctx().createOscillator(); const g = ac.createGain(); osc.frequency.value = 30; g.gain.value = 0.0015; osc.connect(g).connect(ac.destination); osc.start(); }
      else if (!on && osc) { osc.stop(); osc = null; }
    } catch (e) {}
  }

  /* Ηχητικά εφέ (συντίθενται, δεν χρειάζονται αρχεία) */
  function tone(f, d = .2, type = 'triangle', vol = .18, delay = 0, slide = 0) {
    try {
      const a = ctx(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + delay;
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .03);
    } catch (e) {}
  }
  const sfx = {
    tap: () => tone(660, .08, 'sine', .14),
    pop: () => tone(420, .12, 'sine', .2, 0, 900),
    right: () => { tone(784, .12, 'triangle'); tone(1175, .22, 'triangle', .18, .1); },
    wrong: () => { tone(300, .18, 'sawtooth', .07); tone(220, .26, 'sawtooth', .07, .12); },
    coin: () => { tone(988, .08, 'square', .08); tone(1319, .28, 'square', .08, .07); },
    level: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .25, 'triangle', .16, i * .1)),
    chest: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .3, 'triangle', .14, i * .09)); tone(1568, .6, 'sine', .1, .5); },
    whoosh: () => tone(200, .35, 'sine', .12, 0, 1200),
    boing: () => tone(180, .35, 'sine', .2, 0, 520),
    whistle: () => { tone(2600, .5, 'sine', .12); tone(2750, .5, 'sine', .06); },
    buzzer: () => tone(140, .9, 'square', .1),
    crowd: (sec = 1.6) => { // «κερκίδα»: φιλτραρισμένος θόρυβος που φουσκώνει και σβήνει
      try { const a = ctx(), n = a.sampleRate * sec, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
        const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .6; g.gain.value = .35;
        s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start(); } catch (e) {} }
  };
  const SONGS = {
    robot: [523, 523, 784, 784, 659, 659, 523, 0, 587, 587, 880, 880, 784, 659, 587, 0],
    disco: [440, 0, 554, 0, 659, 554, 440, 0, 494, 0, 587, 0, 740, 587, 494, 0],
    spin: [784, 880, 988, 1047, 988, 880, 784, 659, 784, 880, 988, 1175, 1047, 988, 880, 784],
    wave: [392, 440, 494, 523, 587, 523, 494, 440, 392, 440, 494, 587, 659, 587, 523, 494]
  };
  let songTimers = [];
  function song(name, step = 220) {
    songTimers.forEach(clearTimeout); songTimers = [];
    (SONGS[name] || SONGS.robot).forEach((f, i) => { if (f) songTimers.push(setTimeout(() => { tone(f, step / 1000 * .9, 'triangle', .14); tone(f / 2, .06, 'square', .05); }, i * step)); });
  }
  function stopSong() { songTimers.forEach(clearTimeout); songTimers = []; }

  DB.voice = { speak, stop, prefetch, VOICES, cloudOn, clearCache() { mem.clear(); cacheDb().then(d => { if (d) try { d.transaction('a', 'readwrite').objectStore('a').clear(); } catch (e) {} }); }, listen, keepAlive, sfx, song, stopSong, tone,
    onTalking(fn) { talking = fn; },
    greekVoices: () => (hasTTS ? speechSynthesis.getVoices() : []).filter(v => /^el/i.test(v.lang)).map(v => v.name), repick: pickVoices,
    canListen: !!Rec, canSpeak: hasTTS,
    voiceName: () => (greek ? greek.name : 'καμία ελληνική φωνή') + ' / ' + (english ? english.name : 'καμία αγγλική φωνή') };
})();
