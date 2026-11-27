/* DimiBot – «Η καριέρα μας στο μπάσκετ».
   Ο Δημήτρης και ο DimiBot είναι συμπαίκτες σε ένα πρωτάθλημα.
   Κάθε αγώνας: Ζέσταμα (κίνηση στο σπίτι) → 1η & 2η περίοδος (παιχνίδι στην οθόνη) → Ημίχρονο (κίνηση)
   → 3η & 4η περίοδος → Τελικό σφύριγμα. Μισή ώρα οθόνη, μισή κίνηση. */
window.DB = window.DB || {};
(function () {
  const $ = s => document.querySelector(s);
  const S = DB.settings, PR = DB.progress, C = DB.content, V = DB.voice;
  const R = () => DB.robot, A = () => DB.arcade;
  const P = PR.data;
  const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NUM = C.NUM;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- ομάδες του πρωταθλήματος (φανταστικές) ---------- */
  const TEAMS = [
    { id: 'eagles', name: 'Αετοί', e: '🦅', col: '#B45309' },
    { id: 'sharks', name: 'Καρχαρίες', e: '🦈', col: '#0EA5E9' },
    { id: 'dinos', name: 'Δεινόσαυροι', e: '🦖', col: '#16A34A' },
    { id: 'rockets', name: 'Πύραυλοι', e: '🚀', col: '#DC2626' },
    { id: 'bears', name: 'Αρκούδες', e: '🐻', col: '#92400E' },
    { id: 'dragons', name: 'Δράκοι', e: '🐉', col: '#7C3AED' }
  ];
  /* Οι φανταστικοί συμπαίκτες μας (κίτρινα-μπλε, ίδια νούμερα/θέσεις με την αγαπημένη ομάδα, αστείοι χαρακτήρες).
     Ο Δημήτρης μπορεί να τους δώσει όποιο όνομα θέλει. */
  const SQUAD = [
    { n: 1, nick: 'Σίφουνας', e: '🐆', pos: 'Πλέι-μέικερ', trait: 'κάνει πάσες τόσο γρήγορες που ούτε ο ίδιος τις βλέπει', gag: 'έδωσε πάσα τόσο γρήγορα που η μπάλα γύρισε μόνη της πίσω!' },
    { n: 55, nick: 'Ρολογάς', e: '⏰', pos: 'Πλέι-μέικερ', trait: 'μετράει δυνατά κάθε δευτερόλεπτο του αγώνα', gag: 'φωνάζει: «Ένα, δύο, τρία… πόσα δευτερόλεπτα έμειναν;»' },
    { n: 5, nick: 'Φτερούλης', e: '🪶', pos: 'Σουτέρ', trait: 'είναι τόσο ελαφρύς που φοράει βαριά παπούτσια να μην τον πάρει ο αέρας', gag: 'φύσηξε ο κλιματισμός και πέταξε μέχρι την κερκίδα!' },
    { n: 23, nick: 'Γελαστούλης', e: '😁', pos: 'Σουτέρ', trait: 'χαμογελάει ακόμα κι όταν αστοχεί', gag: 'αστόχησε και γέλασε τόσο δυνατά που γέλασε όλο το γήπεδο!' },
    { n: 15, nick: 'Ματάκιας', e: '🦉', pos: 'Σουτέρ', trait: 'βλέπει όλο το γήπεδο, ακόμα και πίσω από την πλάτη του', gag: 'έκανε πάσα χωρίς να κοιτάξει… και βρήκε τον προπονητή!' },
    { n: 0, nick: 'Μηδενάκιας', e: '🍩', pos: 'Σουτέρ', trait: 'λατρεύει τα ντόνατς γιατί μοιάζουν με το νούμερό του', gag: 'ψάχνει το ντόνατ του στον πάγκο… το έφαγε ο DimiBot! Χαχα, πλάκα κάνω, εγώ τρώω μόνο μπουλόνια!' },
    { n: 32, nick: 'Κανγκουρός', e: '🦘', pos: 'Φόργουορντ', trait: 'πηδάει τόσο ψηλά που χαιρετάει τα πουλιά', gag: 'πήδηξε για ριμπάουντ και κατέβηκε μετά από δέκα δευτερόλεπτα!' },
    { n: 12, nick: 'Βράχος', e: '🧱', pos: 'Πάουερ φόργουορντ', trait: 'δυνατός σαν τοίχος και τρυφερός σαν αρκουδάκι', gag: 'έκανε σκριν τόσο δυνατό που ο αντίπαλος ζήτησε συγγνώμη από τον τοίχο!' },
    { n: 4, nick: 'Ουρανοξύστης', e: '🦒', pos: 'Σέντερ', trait: 'είναι τόσο ψηλός που κουτουλάει στα σύννεφα', gag: 'κάρφωσε τόσο ψηλά που η μπάλα πέρασε από το φεγγάρι!' }
  ];
  const mateName = m => ((S.squadNames || {})[m.n] || m.nick);
  const ME = () => ({ id: 'me', name: S.teamName || 'DimiBots', e: '🤖', col: '#FFD200' });
  const team = id => id === 'me' ? ME() : TEAMS.find(t => t.id === id);
  const photo = () => DB.store.read('photo', '');
  const meIcon = cls => photo() ? `<img class="face ${cls || ''}" src="${photo()}" alt="">` : `<span class="emo ${cls || ''}">🤖</span>`;

  /* ---------- αποθηκευμένη κατάσταση ---------- */
  function car() {
    if (!P.car) P.car = { season: 1, round: 0, table: {}, match: null, stats: { points: 0, dribbles: 0, jumps: 0, homeShots: 0, drills: 0, wins: 0, losses: 0, trophies: 0, games: 0 }, day: { d: '', n: 0 }, order: [] };
    const c = P.car;
    if (!c.order || !c.order.length) c.order = C.shuffle(TEAMS.map(t => t.id));
    ['me', ...TEAMS.map(t => t.id)].forEach(id => { if (!c.table[id]) c.table[id] = { w: 0, l: 0, pf: 0, pa: 0 }; });
    return c;
  }
  const save = () => PR.save();
  const today = () => DB.store.today();
  function playedToday() { const c = car(); return c.day.d === today() ? c.day.n : 0; }
  const maxToday = () => Math.max(1, Math.min(5, +S.maxMissions || 5));
  const isFinal = () => car().round >= TEAMS.length;
  function nextOpp() { const c = car(); if (isFinal()) { return standings().filter(r => r.id !== 'me')[0].id; } return c.order[c.round]; }
  function standings() {
    const c = car();
    return Object.keys(c.table).map(id => Object.assign({ id }, c.table[id], team(id))).sort((a, b) => (b.w - a.w) || ((b.pf - b.pa) - (a.pf - a.pa)));
  }

  /* ---------- ασκήσεις κίνησης ---------- */
  const lvN = () => P.lv.numbers || 1;
  const DRILLS = {
    dribble: () => { const n = Math.min(20, 5 + lvN() * 3); return { kind: 'count', e: '🏀', n, step: 750, stat: 'dribbles', title: 'Ντρίπλες!', say: `Πάρε την μπάλα σου! Κάνε ${NUM[n] || n} ντρίπλες μαζί μου! Αν δεν έχεις μπάλα, χτύπα παλαμάκια.` }; },
    jumps: () => { const n = Math.min(12, 4 + lvN() * 2); return { kind: 'count', e: '🦘', n, step: 1000, stat: 'jumps', title: 'Άλματα για κάρφωμα!', say: `Άλματα σαν να καρφώνεις! ${NUM[n] || n} άλματα! Ψηλά τα χέρια!` }; },
    jacks: () => { const n = Math.min(12, 5 + lvN()); return { kind: 'count', e: '⭐', n, step: 1100, stat: 'jumps', title: 'Αστεράκια!', say: `Αστεράκια! Ανοίγεις χέρια και πόδια… ${NUM[n] || n} φορές!` }; },
    balance: () => ({ kind: 'count', e: '🦩', n: 10, step: 1000, title: 'Ισορροπία!', say: 'Στάσου στο ένα πόδι σαν φλαμίνγκο, όσο μετράω ως το δέκα!' }),
    run: () => ({ kind: 'timer', e: '🏃', secs: 10, title: 'Αντεπίθεση!', say: 'Τρέξε μέχρι την πόρτα και πίσω! Έχεις δέκα δευτερόλεπτα! Έτοιμος;' }),
    slides: () => ({ kind: 'timer', e: '🛡️', secs: 12, title: 'Άμυνα!', say: 'Θέση άμυνας! Χαμηλά, και πλάγια βήματα δεξιά–αριστερά, μέχρι να τελειώσει ο χρόνος!' }),
    freeze: () => ({ kind: 'freeze', e: '🕺', title: 'Χορός και πάγωμα!', say: 'Χόρεψε όσο παίζει η μουσική, και πάγωσε σαν άγαλμα όταν σταματήσει!' }),
    simon: () => ({ kind: 'simon', e: '🗣️', title: 'Ο DimiBot λέει…', say: 'Παιχνίδι! Κάνε ό,τι λέω, μόνο αν πω πρώτα «Ο DimiBot λέει»!' }),
    shots: () => ({ kind: 'makes', e: '🧦', n: 5, title: 'Σουτ στο σπίτι!', say: 'Κάνε μια κάλτσα μπάλα και βάλε για καλάθι ένα κουτί ή καλάθι! Έχεις πέντε σουτ!' }),
    seek: () => {
      const T = [['κάτι κίτρινο, σαν τη φανέλα του Περιστερίου', '🟡'], ['κάτι μπλε', '🔵'], ['κάτι κόκκινο', '🔴'], ['μια μπάλα', '⚽'], ['κάτι στρογγυλό', '⭕'], ['ένα ζωάκι-παιχνίδι', '🧸'], ['κάτι που αρχίζει από το γράμμα Μ', 'Μ'], ['ένα παπούτσι', '👟']];
      const [t, e] = pick(T); return { kind: 'seek', e: e.length === 1 ? e : e, target: t, title: 'Κυνήγι θησαυρού!', say: `Αποστολή! Βρες ${t} μέσα στο σπίτι και δείξ' το στην κάμερα!` };
    }
  };
  const WARM = ['dribble', 'jumps', 'jacks', 'run', 'balance', 'shots'];
  const HALF = ['freeze', 'simon', 'seek', 'slides', 'shots', 'dribble'];

  /* ---------- UI ---------- */
  let M = null, token = 0;
  const area = () => $('#cArea');
  const alive = my => () => my === token && DB.app.view === 'match';
  function board(extra) {
    const me = ME(), op = team(M.opp);
    $('#cBoard').innerHTML = `<div class="sb"><span class="tm">${meIcon()}${esc(me.name)}</span><b class="sc">${M.ts}</b><span class="qtr">${extra || ''}</span><b class="sc">${M.os}</b><span class="tm r">${esc(op.name)}<span class="emo">${op.e}</span></span></div>`;
  }
  async function say(t, cmd) { const a = cmd ? R().run(cmd) : null; await R().say(t); if (a) await a; }

  function start() {
    const c = car();
    if (c.match && c.match.day === today() && !c.match.done) M = c.match;
    else {
      if (playedToday() >= maxToday()) return;
      const subj = C.shuffle(['letters', 'numbers', 'english', 'world']);
      M = c.match = { day: today(), opp: nextOpp(), final: isFinal(), ts: 0, os: 0, si: 0, steps: ['warm', 'q:' + subj[0], 'q:' + subj[1], 'half', 'q:' + subj[2], 'q:' + subj[3], 'end'], drills: [pick(WARM), pick(HALF)], done: false, qs: [] };
      save();
    }
    DB.app.show('match'); next();
  }
  function pause() { token++; V.stop(); R().stopAll(true); stopCam(); }

  async function next() {
    const my = ++token;
    if (!M) return;
    const step = M.steps[M.si];
    const qn = M.steps.slice(0, M.si + 1).filter(s => s.startsWith('q:')).length;
    board(step === 'warm' ? 'Ζέσταμα' : step === 'half' ? 'Ημίχρονο' : step === 'end' ? 'Τέλος' : qn + 'η περ.');
    if (step === 'warm' || step === 'half') {
      if (step === 'warm' && M.si === 0) await intro(my);
      if (my !== token) return;
      const id = M.drills[step === 'warm' ? 0 : 1];
      const ok = await drill(DRILLS[id](), my, step === 'half');
      if (ok === null || my !== token) return;
      M.si++; save(); return next();
    }
    if (step.startsWith('q:')) return quarter(step.slice(2), qn, my);
    if (step === 'end') return finish(my);
  }
  function advance() { M.si++; save(); next(); }

  async function intro(my) {
    const me = ME(), op = team(M.opp);
    area().innerHTML = `<div class="vsCard"><div class="vsT">${meIcon('big')}<b>${esc(me.name)}</b></div><div class="vs">VS</div><div class="vsT"><span class="emo big">${op.e}</span><b>${esc(op.name)}</b></div>
      <p class="note">${M.final ? '🏆 ΤΕΛΙΚΟΣ ΚΥΠΕΛΛΟΥ!' : `Αγωνιστική ${car().round + 1} από ${TEAMS.length} · Σεζόν ${car().season}`}</p></div>`;
    V.sfx.crowd(2.2);
    try { await say(M.final ? `Τελικός κυπέλλου! Εμείς εναντίον των ${op.name}! Πάμε για το τρόπαιο!` : `Σήμερα παίζουμε με τους ${op.name}! Πρώτα, ζέσταμα!`, 'CHEER'); } catch (e) {}
  }

  /* ---------- ασκήσεις κίνησης: UI ---------- */
  async function drill(d, my, half) {
    const live = alive(my);
    area().innerHTML = `<div class="drill"><div class="chip">${half ? 'Ημίχρονο · ' : 'Ζέσταμα · '}${esc(d.title)}</div><div class="dEmo emo">${d.e}</div><div class="dBig" id="dBig"></div><div class="dTxt" id="dTxt"></div><div class="row center" id="dBtns"></div></div>`;
    const big = $('#dBig'), txt = $('#dTxt'), btns = $('#dBtns');
    txt.textContent = d.say;
    const intro = say(d.say, 'HELLO').catch(() => {});   // δεν περιμένουμε να τελειώσει: το κουμπί εμφανίζεται αμέσως
    if (!['count', 'timer', 'freeze', 'simon'].includes(d.kind)) { await intro; if (!live()) return null; }
    const ready = async () => { btns.innerHTML = '<button class="go big" id="dGo">▶ Έτοιμος!</button>'; await new Promise(r => { $('#dGo').onclick = r; }); V.stop(); btns.innerHTML = ''; };
    const countdown = async () => { for (const k of ['3', '2', '1']) { if (!live()) return; big.textContent = k; V.tone(660, .15); await sleep(700); } big.textContent = 'Πάμε!'; V.tone(990, .3); await sleep(400); };
    const st = car().stats;

    if (d.kind === 'count') {
      await ready(); await countdown(); if (!live()) return null;
      for (let i = 1; i <= d.n; i++) {
        if (!live()) return null;
        big.textContent = i; big.classList.remove('beat'); void big.offsetWidth; big.classList.add('beat');
        V.tone(440 + i * 25, .12, 'triangle', .2); V.speak(NUM[i] || String(i));
        R().set('bot', 'translateY(-22px)'); setTimeout(() => R().set('bot', ''), 180);
        await sleep(d.step);
      }
      if (d.stat) st[d.stat] = (st[d.stat] || 0) + d.n;
    } else if (d.kind === 'timer') {
      await ready(); await countdown(); if (!live()) return null;
      for (let s = d.secs; s >= 0; s--) { if (!live()) return null; big.textContent = s; if (s <= 3) V.tone(880, .1); await sleep(1000); }
      V.sfx.buzzer();
    } else if (d.kind === 'freeze') {
      await ready(); if (!live()) return null;
      for (let k = 0; k < 3; k++) {
        if (!live()) return null;
        big.textContent = 'ΧΟΡΟΣ! 🕺'; big.className = 'dBig go2';
        const useSong = S.songs !== false && DB.music && await DB.music.has();
        if (useSong) await DB.music.play(6); else V.song(pick(['robot', 'disco', 'wave']));
        R().set('upper', 'rotate(-8deg)'); const sway = setInterval(() => R().set('upper', `rotate(${Math.random() < .5 ? -8 : 8}deg)`), 300);
        await sleep(3000 + rnd(3500));
        clearInterval(sway); R().rest(); DB.music && DB.music.stop(); V.stopSong();
        big.textContent = 'ΠΑΓΩΜΑ! 🧊'; big.className = 'dBig freeze'; R().eyes('surprise'); V.speak('Πάγωμα!');
        await sleep(2600); R().eyes('normal');
      }
      big.className = 'dBig';
    } else if (d.kind === 'simon') {
      const ACTS = [['🙌', 'σήκωσε τα χέρια ψηλά', 'hands up'], ['👃', 'άγγιξε τη μύτη σου', 'touch your nose'], ['🦘', 'πήδα δύο φορές', 'jump'], ['🌀', 'κάνε μια σβούρα', 'turn around'], ['🏀', 'κάνε πως σουτάρεις', 'shoot'], ['🪑', 'κάτσε κάτω', 'sit down'], ['👏', 'χτύπα παλαμάκια', 'clap'], ['🦶', 'σταθείτε στις μύτες', 'tiptoe']];
      const seq = C.shuffle(ACTS).slice(0, 6);
      await ready();
      for (let k = 0; k < seq.length; k++) {
        if (!live()) return null;
        const [e, gr, en] = seq[k], real = k === 0 || Math.random() < .72, english = (P.lv.english || 1) >= 2 && Math.random() < .35;
        big.textContent = e; big.classList.remove('beat'); void big.offsetWidth; big.classList.add('beat');
        const cmd = english ? `{${en}}!` : `${gr}!`;
        await R().say(real ? `Ο DimiBot λέει… ${cmd}` : cmd.charAt(0).toUpperCase() + cmd.slice(1));
        await sleep(2400);
        if (!real) { R().eyes('wink'); await R().say('Χα! Δεν είπα «Ο DimiBot λέει»! Αν δεν το έκανες, μπράβο σου!'); R().eyes('normal'); }
      }
    } else if (d.kind === 'makes') {
      let made = 0, shots = 0;
      btns.innerHTML = '<button class="go" id="mIn">✅ Μπήκε!</button><button class="ghost" id="mOut">❌ Άουτ</button>';
      big.innerHTML = Array.from({ length: d.n }, () => '<i class="shot"></i>').join('');
      await new Promise(res => {
        const mark = ok => { if (!live()) return res(); const el = big.children[shots]; el.classList.add(ok ? 'in' : 'out'); shots++; if (ok) { made++; V.sfx.right(); DB.arcade.joy(); V.speak(pick(['Καλάθι!', 'Μέσα!', 'Σουίς!'])); } else { V.sfx.boing(); V.speak(pick(['Άουτ! Ξανά!', 'Σχεδόν!'])); } if (shots >= d.n) res(); };
        $('#mIn').onclick = () => mark(true); $('#mOut').onclick = () => mark(false);
      });
      if (!live()) return null;
      btns.innerHTML = '';
      st.homeShots = (st.homeShots || 0) + made;
      await say(`Έβαλες ${NUM[made] || made} στα ${NUM[d.n]}! ${made >= 3 ? 'Σουτέρ!' : 'Με προπόνηση θα μπαίνουν όλα!'}`, made >= 3 ? 'CHEER' : 'HAPPY');
    } else if (d.kind === 'seek') {
      const res = await seek(d, my);
      if (res === null) return null;
    }
    if (!live()) return null;
    st.drills = (st.drills || 0) + 1; save();
    big.textContent = '💪';
    btns.innerHTML = '';
    R().confetti(60); V.sfx.level();
    await say(pick(['Τέλεια προπόνηση!', 'Η ομάδα γέμισε ενέργεια!', 'Αυτό ήταν! Είσαι έτοιμος!']), 'CHEER');
    return true;
  }

  /* κυνήγι θησαυρού με την κάμερα */
  let stream = null;
  function stopCam() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }
  async function seek(d, my) {
    const live = alive(my), btns = $('#dBtns'), big = $('#dBig');
    big.innerHTML = '<div class="cam small"><video id="sVid" playsinline muted></video><canvas id="sSnap" hidden></canvas></div>';
    btns.innerHTML = '<button class="go big" id="sFound">📸 Το βρήκα!</button><button class="ghost" id="sSkip">Δεν το βρίσκω</button>';
    let camOk = false;
    if (S.camOn && navigator.mediaDevices) {
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); const v = $('#sVid'); v.srcObject = stream; await v.play(); camOk = true; } catch (e) { camOk = false; }
    }
    if (!camOk) big.innerHTML = '<div class="dEmo emo">🔎</div>';
    for (let tries = 0; tries < 3; tries++) {
      const act = await new Promise(r => { $('#sFound').onclick = () => r('found'); $('#sSkip').onclick = () => r('skip'); });
      if (!live()) { stopCam(); return null; }
      if (act === 'skip') { stopCam(); await say('Δεν πειράζει! Θα το βρούμε την επόμενη φορά!'); return true; }
      if (!camOk || DB.ai.current().name !== 'Google Gemini') { stopCam(); V.sfx.right(); await say('Τέλεια! Το βρήκες! Είσαι αληθινός εξερευνητής!', 'CHEER'); return true; }
      const v = $('#sVid'), c = $('#sSnap'), w = 512, h = Math.round(512 * (v.videoHeight || 384) / (v.videoWidth || 512));
      c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h);
      R().eyes('focus'); R().setBubble('Σαρώνω… σαρώνω…');
      let yes = true;
      try {
        const r = await DB.ai.see(c.toDataURL('image/jpeg', .7).split(',')[1], `Το παιδί έπρεπε να βρει «${d.target}». Αυτό που φαίνεται ταιριάζει; Ξεκίνα την απάντηση με ΝΑΙ ή ΟΧΙ (κεφαλαία), και μετά πες μία σύντομη, χαρούμενη πρόταση για το αντικείμενο. Να είσαι επιεικής: αν είναι κοντά, πες ΝΑΙ.`);
        yes = !/^\s*ΟΧΙ/i.test(r.raw || r.text); R().eyes('normal');
        const line = (r.text || '').replace(/^\s*(ΝΑΙ|ΟΧΙ)[,.! ]*/i, '');
        if (yes) { stopCam(); V.sfx.right(); await say((line || 'Ναι! Αυτό είναι!') + ' Μπράβο εξερευνητή!', 'CHEER'); return true; }
        V.sfx.wrong(); await say((line ? line + ' ' : '') + `Χμ, ψάξε κι άλλο: ${d.target}!`);
      } catch (e) { stopCam(); await say('Τέλεια! Το βρήκες!', 'CHEER'); return true; }
    }
    stopCam(); await say('Καλή προσπάθεια! Πάμε στο παιχνίδι!'); return true;
  }

  /* ---------- περίοδοι αγώνα (παιχνίδι στην οθόνη) ---------- */
  const QI = {
    letters: ['🛡️ Άμυνα!', 'Κλέψε τις μπάλες με το σωστό γράμμα!'],
    numbers: ['🏀 Σουτ!', 'Βάλε καλάθια και μέτρα τους πόντους!'],
    english: ['🗣️ Πάσες στα αγγλικά!', 'Πάσα στον συμπαίκτη που λέω στα αγγλικά!'],
    world: ['⚡ Αντεπίθεση!', '']
  };
  async function quarter(subj, qn, my) {
    const live = alive(my), lv = P.lv, op = team(M.opp);
    const [title, line] = QI[subj];
    area().innerHTML = `<div class="qIntro"><div class="qN">${qn}η ΠΕΡΙΟΔΟΣ</div><h2>${title}</h2></div>`;
    V.sfx.whistle();
    let gameP, huntLine = '';
    say(`${qn === 1 ? 'Τζάμπολ! ' : ''}${title.replace(/^\S+ /, '')} ${line}`).catch(() => {}); await sleep(1400);
    if (!live()) return;
    if (subj === 'letters') gameP = A().whack(area(), live, 'letters', lv.letters, { hits: 5, skin: '🏀' });
    else if (subj === 'numbers') gameP = A().hoop(area(), live, lv.numbers, { hits: 4, quiet: true });
    else if (subj === 'english') {
      const { fresh, review } = C.englishPlan(P.words, lv.english);
      let words = review.map(w => w[0]);
      if (words.length < 2) { const f = fresh.slice(0, 2).map(w => w[0]); await A().meetWords(area(), live, f); words = words.concat(f); }
      if (!live()) return;
      gameP = A().bubbles(area(), live, words, lv.english, { hits: 5 });
    } else {
      P.seen.hunt = (P.seen.hunt || 0) + 1; save();
      gameP = A().hunt(area(), live, lv.world, P.seen.hunt, { hits: 5 });
    }
    const r = await gameP;
    if (!r || !live()) return;
    const ours = subj === 'numbers' ? r.total + r.first : r.hits * 2 + r.first;
    const strength = Math.min(5, (car().season - 1) + (M.final ? 2 : 0) + TEAMS.findIndex(t => t.id === M.opp) % 3);
    const theirs = 7 + strength + rnd(6);
    // ζωντανός πίνακας: οι πόντοι ανεβαίνουν σιγά σιγά
    for (let i = 0, a = M.ts, b = M.os; i < 10; i++) { M.ts = a + Math.round(ours * (i + 1) / 10); M.os = b + Math.round(theirs * (i + 1) / 10); board(`${qn}η περ.`); await sleep(90); }
    M.qs.push([ours, theirs]); save();
    PR.addStars(1, 'match'); DB.ui.flyStar($('#cBoard'));
    V.sfx.buzzer(); V.sfx.crowd();
    const lead = M.ts - M.os;
    const comment = lead > 8 ? 'Τους έχουμε αφήσει πίσω!' : lead > 0 ? 'Είμαστε μπροστά!' : lead === 0 ? 'Ισοπαλία! Τι αγώνας!' : lead > -6 ? 'Είμαστε λίγο πίσω, αλλά θα γυρίσουμε!' : 'Πάμε δυνατά, μπορούμε να το γυρίσουμε!';
    const mate = pick(SQUAD); M.assists = M.assists || {}; M.assists[mate.n] = (M.assists[mate.n] || 0) + 1;
    try { await say(`Τέλος ${qn}ης περιόδου! ${M.ts} – ${M.os}. ${comment} ${pick([`Ωραίες πάσες έδωσε ο ${mateName(mate)}!`, `Ο ${mateName(mate)} με το νούμερο ${mate.n} σου λέει: «Κόλλα πέντε, ${S.childName}!»`, `Ο ${mateName(mate)} ${mate.gag}`])}`, lead >= 0 ? 'HAPPY' : 'THINK'); } catch (e) {}
    if (live() && qn !== 2 && qn < 4 && Math.random() < .6) await surprise(live);
    if (live()) advance();
  }

  /* ---------- εκπλήξεις στο γήπεδο ---------- */
  async function surprise(live) {
    const name = S.childName || 'Δημήτρη';
    const EV = [
      async () => { const m = pick(SQUAD); area().innerHTML = `<div class="drill"><div class="mate big"><span class="emo">${m.e}</span><b>${m.n}</b></div><h2>Ο ${esc(mateName(m))}!</h2></div>`; await say(`Κοίτα! Ο ${mateName(m)} ${m.gag}`, 'HAPPY'); },
      async () => { const m = pick(SQUAD); area().innerHTML = `<div class="drill"><div class="mate big"><span class="emo">${m.e}</span><b>${m.n}</b></div><h2>Κόλλα πέντε!</h2></div>`; await say(`Ο ${mateName(m)} θέλει να σου κάνει κόλλα πέντε! Σήκωσε το χέρι στην οθόνη… Πλαφ!`); V.sfx.pop(); await R().run('CHEER'); },
      async () => { area().innerHTML = '<div class="drill"><div class="dEmo emo">🦸</div><h2>Η μασκότ μπήκε στο γήπεδο!</h2></div>'; await say('Η μασκότ μας μπήκε στο γήπεδο και χορεύει! Χόρεψε κι εσύ μαζί μας!'); await R().run('DANCE'); },
      async () => { area().innerHTML = '<div class="drill"><div class="dEmo emo">🙌</div><h2>Κύμα στην κερκίδα!</h2></div>'; V.sfx.crowd(3); await say('Κύμα στην κερκίδα! Σήκωσε τα χέρια ψηλά… και κάτω! Ψηλά… και κάτω!'); await R().run('CHEER'); },
      async () => { area().innerHTML = '<div class="drill"><div class="dEmo emo">📣</div><h2>Η κερκίδα φωνάζει!</h2></div>'; const ok = await DB.music.playCheer(); if (!ok) { V.sfx.crowd(2.5); await say(`${name}! ${name}! ${name}!`); } else await sleep(3200); await say('Ακούς; Φωνάζουν για σένα!', 'HAPPY'); },
      async () => { area().innerHTML = '<div class="drill"><div class="dEmo emo">🍿</div><h2>Ώρα για σνακ!</h2></div>'; await say('Ο DimiBot πήγε να φάει ποπκόρν… αλλά τρώει μόνο μπουλόνια! Χαχα!', 'HAPPY'); },
      async () => { area().innerHTML = '<div class="drill"><div class="dEmo emo">📸</div><h2>Κάμερα της κερκίδας!</h2></div>'; await say('Η κάμερα της κερκίδας σε δείχνει στη γιγαντοοθόνη! Κάνε την πιο αστεία φάτσα σου!'); await sleep(2500); await say('Χαχα! Τέλεια φάτσα!', 'SPIN'); }
    ];
    try { await pick(EV)(); } catch (e) {}
  }

  const bestMate = () => { const a = (M && M.assists) || {}; const k = Object.keys(a).sort((x, y) => a[y] - a[x])[0]; return k != null ? SQUAD.find(m => String(m.n) === k) : null; };

  /* ---------- τελικό σφύριγμα ---------- */
  async function finish(my) {
    const live = alive(my), c = car(), op = team(M.opp);
    if (M.ts === M.os) { M.ts += 2; board('Τέλος'); try { await say('Ισοπαλία… και ο DimiBot καρφώνει στη λήξη!', 'DUNK'); } catch (e) {} }
    const win = M.ts > M.os;
    if (!M.done) {
      M.done = true;
      const t = c.table; t.me.pf += M.ts; t.me.pa += M.os; t[M.opp].pf += M.os; t[M.opp].pa += M.ts;
      if (win) { t.me.w++; t[M.opp].l++; c.stats.wins++; } else { t.me.l++; t[M.opp].w++; c.stats.losses++; }
      // οι άλλες ομάδες παίζουν κι αυτές
      const rest = C.shuffle(TEAMS.map(x => x.id).filter(id => id !== M.opp));
      for (let i = 0; i + 1 < rest.length; i += 2) { const a = rest[i], b = rest[i + 1], sa = 40 + rnd(30); let sb = 40 + rnd(30); if (sb === sa) sb++; t[a].pf += sa; t[a].pa += sb; t[b].pf += sb; t[b].pa += sa; if (sa > sb) { t[a].w++; t[b].l++; } else { t[b].w++; t[a].l++; } }
      c.stats.points += M.ts; c.stats.games++;
      if (c.day.d !== today()) c.day = { d: today(), n: 0 }; c.day.n++;
      let trophy = false;
      if (M.final) { if (win) { c.stats.trophies++; trophy = true; } c.season++; c.round = 0; c.order = C.shuffle(TEAMS.map(x => x.id)); Object.keys(t).forEach(k => { t[k] = { w: 0, l: 0, pf: 0, pa: 0 }; }); }
      else c.round++;
      M.trophy = trophy;
      const firstWin = win && c.winDay !== today();
      M.gift = null;
      if (firstWin) { c.winDay = today(); const g = PR.nextGift(); if (g) M.gift = { kind: g.kind, id: g.item.id }; }
      PR.addStars(win ? (trophy ? 15 : 5) : 2, 'match'); PR.addXp(win ? 40 : 20);
      PR.missionDone(); DB.log.add('mission');
      save();
    }
    const g = M.gift ? { kind: M.gift.kind, item: PR.find(M.gift.kind, M.gift.id) } : null;
    V.sfx.buzzer(); setTimeout(() => V.sfx.crowd(2.5), 300);
    if (win) { R().confetti(M.trophy ? 220 : 140); setTimeout(() => DB.music.playCheer(), 900); }
    area().innerHTML = `<div class="endCard ${win ? 'win' : 'lose'}">
      <div class="emo huge">${M.trophy ? '🏆' : win ? '🥇' : '💪'}</div>
      <h2>${M.trophy ? 'ΚΥΠΕΛΛΟΥΧΟΙ!' : win ? 'ΝΙΚΗ!' : 'Καλή προσπάθεια!'}</h2>
      <p class="final">${M.ts} – ${M.os}</p>
      <p class="mvp">⭐ MVP: ${esc(S.childName.replace(/η$/, 'ης'))}${bestMate() ? ` · 🤝 Καλύτερος πασέρ: ${esc(mateName(bestMate()))} #${bestMate().n}` : ''}</p>
      ${g ? `<div class="gift sm">${DB.mission.itemPreview(g.kind, g.item)}</div><p class="note">Δώρο νίκης: ${esc(g.item.name)}</p>` : ''}
      <div class="row center">${g ? '<button class="go" id="eWear">Φόρα το!</button>' : ''}<button class="ghost" id="eTable">📊 Βαθμολογία</button><button class="go" id="eHome">🏠 Τέλος</button></div></div>`;
    if ($('#eWear')) $('#eWear').onclick = () => DB.app.run(async () => { PR.wear(g.kind, g.item.id); await R().run(g.kind === 'dance' ? 'DANCE' : 'SPIN'); });
    $('#eTable').onclick = () => { V.stop(); DB.app.show('league'); };
    $('#eHome').onclick = () => { V.stop(); DB.app.show('home'); };
    try {
      if (M.trophy) await say(`Το κύπελλο είναι δικό μας! ${S.childName}, είσαι πρωταθλητής! Πάμε Περιστέρι!`, 'DANCE');
      else if (win) await say(pick([`Νικήσαμε τους ${op.name}! Τι παιχνίδι, συμπαίκτη!`, `Νίκη! ${M.ts} πόντους βάλαμε! Είσαι φωτιά!`]), 'DUNK');
      else await say(`Χάσαμε από τους ${op.name}, αλλά παίξαμε σαν ομάδα. Στην επόμενη θα τους κερδίσουμε!`, 'HEART');
    } catch (e) {}
  }

  /* ---------- Βάση: κάρτα αγώνα ---------- */
  function drawHomeCard() {
    const c = car(), op = team(nextOpp()), me = ME(), n = playedToday(), max = maxToday();
    const cur = c.match && c.match.day === today() && !c.match.done;
    const dots = Array.from({ length: max }, (_, i) => i < n ? '🏀' : '⚪').join('');
    $('#homeMatch').innerHTML = `<div class="mTop"><span class="chip gold">${isFinal() ? '🏆 Τελικός κυπέλλου' : `Αγωνιστική ${c.round + 1}/${TEAMS.length} · Σεζόν ${c.season}`}</span><span class="note">Σήμερα ${dots}</span></div>
      <div class="vsRow"><div class="vsT">${meIcon()}<b>${esc(me.name)}</b><small>${c.table.me.w}Ν – ${c.table.me.l}Η</small></div><div class="vs">VS</div><div class="vsT"><span class="emo">${op.e}</span><b>${esc(op.name)}</b><small>${c.table[op.id].w}Ν – ${c.table[op.id].l}Η</small></div></div>
      <button class="go big" id="cGo" ${!cur && n >= max ? 'disabled' : ''}>${cur ? '🏀 Συνέχισε τον αγώνα' : n >= max ? `✓ ${max} αγώνες σήμερα! Τα λέμε αύριο` : '🏀 Πάμε για αγώνα!'}</button>
      <div class="row"><button class="ghost" id="cTable">📊 Βαθμολογία & η κάρτα μου</button></div>`;
    $('#cGo').onclick = () => { V.stop(); DB.app.busy = false; V.sfx.whistle(); start(); };
    $('#cTable').onclick = () => { V.sfx.tap(); DB.app.show('league'); };
  }

  /* ---------- Βαθμολογία & κάρτα παίκτη ---------- */
  function drawLeague() {
    const c = car(), st = c.stats, L = PR.levelInfo();
    const rows = standings();
    $('#leagueBox').innerHTML = `<div class="pCard"><div class="pcTop">${photo() ? `<img class="face card" src="${photo()}" alt="">` : ''}<span class="jersey big" style="--j1:#FFD200;--j2:#1D4E9E">${esc(String(S.jersey == null ? 7 : S.jersey))}</span>
        <div><h2>${esc(S.childName.replace(/η$/, 'ης'))}</h2><p class="note">${esc(ME().name)} · Επίπεδο ${L.level}</p></div></div>
        <div class="stats">
          <div><b>${st.points}</b><span>πόντοι σε αγώνες</span></div><div><b>${st.wins}</b><span>νίκες</span></div><div><b>${st.trophies}</b><span>κύπελλα 🏆</span></div>
          <div><b>${st.dribbles}</b><span>ντρίπλες 🏀</span></div><div><b>${st.jumps}</b><span>άλματα 🦘</span></div><div><b>${st.homeShots}</b><span>καλάθια στο σπίτι 🧦</span></div>
        </div>
        <div class="row pcBtns"><button class="ghost" id="lPhoto">📸 ${photo() ? 'Νέα φωτογραφία' : 'Βάλε τη φωτογραφία μου'}</button><button class="ghost" id="lCheer">🎤 Ηχογράφησε την κερκίδα</button><button class="ghost" id="lCheerPlay">🔊 Άκου</button></div>
        <div id="lMedia"></div></div>
      <h3>Οι συμπαίκτες μας</h3>
      <p class="note">Πάτα το ✏️ για να δώσεις στον καθένα όποιο όνομα θέλεις!</p>
      <div class="squad">${SQUAD.map(m => `<div class="mateCard"><div class="mate"><span class="emo">${m.e}</span><b>${m.n}</b></div><div class="mInfo"><b>${esc(mateName(m))}</b><small>${m.pos}</small><span>${esc(m.trait)}</span></div><button class="ghost sm" data-rename="${m.n}" aria-label="Άλλαξε όνομα">✏️</button></div>`).join('')}</div>
      <h3>Βαθμολογία · Σεζόν ${c.season}</h3>
      <table class="tbl league"><tr><th>#</th><th>Ομάδα</th><th>Ν</th><th>Η</th><th>+/-</th></tr>
      ${rows.map((r, i) => `<tr class="${r.id === 'me' ? 'me' : ''}"><td>${i + 1}</td><td><span class="emo">${r.e}</span> ${esc(r.name)}</td><td>${r.w}</td><td>${r.l}</td><td>${r.pf - r.pa > 0 ? '+' : ''}${r.pf - r.pa}</td></tr>`).join('')}</table>
      <p class="note">Μετά από ${TEAMS.length} αγωνιστικές, ο Τελικός Κυπέλλου γίνεται με την ομάδα που είναι πρώτη (εκτός από εμάς).</p>`;
  }

  /* φωτογραφία παίκτη (μένει μόνο στο tablet) */
  let mstream = null;
  const stopM = () => { if (mstream) { mstream.getTracks().forEach(t => t.stop()); mstream = null; } };
  async function takePhoto() {
    const box = $('#lMedia');
    try { mstream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }); }
    catch (e) { box.innerHTML = '<p class="note">Δεν υπάρχει άδεια για την κάμερα.</p>'; return; }
    box.innerHTML = '<div class="cam small round"><video id="pV" playsinline muted></video></div><div class="row center"><button class="go" id="pSnap">📸 Κλικ!</button><button class="ghost" id="pCancel">Άκυρο</button></div>';
    const v = $('#pV'); v.srcObject = mstream; await v.play();
    R().say('Χαμόγελο πρωταθλητή! Πες «Περιστέρι»!');
    $('#pCancel').onclick = () => { stopM(); box.innerHTML = ''; };
    $('#pSnap').onclick = () => {
      const cv = document.createElement('canvas'), sz = 256, vw = v.videoWidth || 640, vh = v.videoHeight || 480, m = Math.min(vw, vh);
      cv.width = cv.height = sz; const g = cv.getContext('2d'); g.translate(sz, 0); g.scale(-1, 1);
      g.drawImage(v, (vw - m) / 2, (vh - m) / 2, m, m, 0, 0, sz, sz);
      DB.store.write('photo', cv.toDataURL('image/jpeg', .8)); stopM(); V.sfx.coin(); R().confetti(60);
      drawLeague(); R().say('Τέλεια! Τώρα είσαι στην κάρτα παίκτη και στον πίνακα του γηπέδου!');
    };
  }
  /* ηχογράφηση «κερκίδας»: το παιδί φωνάζει και ακούγεται στα καλάθια και στις νίκες */
  async function recordCheer() {
    const box = $('#lMedia');
    let st;
    try { st = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { box.innerHTML = '<p class="note">Δεν υπάρχει άδεια για το μικρόφωνο.</p>'; return; }
    const rec = new MediaRecorder(st), chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    await R().say('Φώναξε δυνατά για την ομάδα μας! Π.χ. «Πάμε DimiBots!». Τρία… δύο… ένα…');
    box.innerHTML = '<div class="dBig beat">🎤 ΤΩΡΑ!</div>';
    rec.start(); V.tone(990, .15);
    await sleep(3000); rec.stop(); st.getTracks().forEach(t => t.stop());
    await new Promise(r => { rec.onstop = r; });
    const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
    await DB.music.addCheer(blob, 'Κερκίδα ' + new Date().toLocaleDateString('el-GR'));
    box.innerHTML = '';
    await DB.music.playCheer(); V.sfx.crowd(2);
    R().say('Τι φωνάρα! Θα την ακούς κάθε φορά που βάζουμε καλάθι!');
  }

  document.addEventListener('click', e => {
    if (e.target.closest('#lPhoto')) takePhoto();
    else if (e.target.closest('#lCheer')) recordCheer();
    else if (e.target.closest('[data-rename]')) {
      const n = +e.target.closest('[data-rename]').dataset.rename, m = SQUAD.find(x => x.n === n);
      const v = prompt(`Πώς θα λέγεται ο συμπαίκτης με το νούμερο ${n};`, mateName(m));
      if (v != null) { S.squadNames = Object.assign({}, S.squadNames, { [n]: v.trim().slice(0, 20) || m.nick }); S.save(); drawLeague(); R().say(`Ο ${mateName(m)} με το νούμερο ${n} μπήκε στην ομάδα! Χειροκρότημα!`); }
    }
    else if (e.target.closest('#lCheerPlay')) DB.music.playCheer().then(ok => { if (!ok) R().say('Δεν έχεις ηχογραφήσει ακόμα. Πάτα το μικρόφωνο!'); });
  });

  /* για το AI: σύντομη περίληψη */
  function summary() {
    const c = car(), last = c.match && c.match.done ? `Τελευταίος αγώνας: ${c.match.ts}-${c.match.os} με τους ${team(c.match.opp).name} (${c.match.ts > c.match.os ? 'νίκη' : 'ήττα'}).` : '';
    return `Φανταστικοί συμπαίκτες στην ομάδα (χαρακτήρες της εφαρμογής, όχι αληθινοί παίκτες): ${SQUAD.map(m => `${mateName(m)} #${m.n} (${m.trait})`).join('; ')}. Η ομάδα του με τον DimiBot λέγεται «${ME().name}» και παίζει σε φανταστικό πρωτάθλημα στην εφαρμογή (${c.table.me.w} νίκες, ${c.table.me.l} ήττες, ${c.stats.trophies} κύπελλα). ${last}`;
  }

  DB.career = { start, pause, drawHomeCard, drawLeague, summary, TEAMS, car };
})();
