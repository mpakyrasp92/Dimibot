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
    greek = list.find(v => /^el/i.test(v.lang) && /google/i.test(v.name)) || list.find(v => /^el/i.test(v.lang)) || null;
    english = list.find(v => /^en-US/i.test(v.lang) && /google/i.test(v.name)) || list.find(v => /^en-GB/i.test(v.lang)) || list.find(v => /^en/i.test(v.lang)) || null;
  }
  if (hasTTS) { pickVoices(); speechSynthesis.onvoiceschanged = pickVoices; }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  let talking = null; // callback(on) για το στόμα του ρομπότ

  /* Μιλάει. Το κείμενο μπορεί να έχει κομμάτια στα αγγλικά μέσα σε {…}: «Η γάτα λέγεται {cat}!» */
  async function speak(text) {
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
    text = text.trim(); if (!text) return Promise.resolve();
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
  function stop() { if (hasTTS) speechSynthesis.cancel(); if (current) try { current.abort(); } catch (e) {} talking && talking(false); }

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
    boing: () => tone(180, .35, 'sine', .2, 0, 520)
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

  DB.voice = { speak, stop, listen, keepAlive, sfx, song, stopSong, tone,
    onTalking(fn) { talking = fn; },
    canListen: !!Rec, canSpeak: hasTTS,
    voiceName: () => (greek ? greek.name : 'καμία ελληνική φωνή') + ' / ' + (english ? english.name : 'καμία αγγλική φωνή') };
})();
