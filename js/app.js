/* DimiBot – κεντρική λογική: οθόνες, HUD, μικρόφωνο, κάμερα, γονικός χώρος, χρόνος */
window.DB = window.DB || {};
(function () {
  const $ = s => document.querySelector(s);
  const S = DB.settings, R = DB.robot, V = DB.voice, A = DB.ai, PR = DB.progress, C = DB.content, MI = DB.mission;
  const P = PR.data;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Μία ενέργεια τη φορά. Το STOP τη διακόπτει. */
  const app = DB.app = { busy: false, view: 'home',
    async run(fn) { if (app.busy) return; app.busy = true; lastTouch = Date.now();
      try { await fn(); } catch (e) { if (e !== 'stop') console.warn(e); } finally { app.busy = false; setMic('idle'); } } };

  /* ---------- Οθόνες ---------- */
  function show(v) {
    if (DB.usage.over() && v !== 'parent') v = 'lock';
    if (app.view === 'mission' && v !== 'mission') MI.pause();
    if (app.view === 'match' && v !== 'match') DB.career.pause();
    app.view = v;
    document.querySelectorAll('.view').forEach(s => { s.hidden = s.id !== 'v-' + v; });
    const tab = { mission: 'home', routines: 'home', match: 'home', league: 'home' }[v] || v;
    document.querySelectorAll('.tabs button[data-v]').forEach(b => b.toggleAttribute('aria-current', b.dataset.v === tab));
    document.body.dataset.view = v;
    if (v === 'camera') camStart(); else camStop();
    if (v === 'home') { drawHome(); DB.career.drawHomeCard(); }
    if (v === 'league') DB.career.drawLeague();
    if (v === 'routines') { const box = $('#rBoxHome'); MI.drawChecklist(box, false); }
    if (v === 'garage') DB.garage.draw();
    if (v === 'parent') fillParent();
    if (v === 'lock') { R.eyes('sleepy'); R.setBubble('Φορτίζω μπαταρίες… Τα λέμε αύριο!'); }
  }
  app.show = show;
  document.querySelectorAll('.tabs button[data-v]').forEach(b => b.addEventListener('click', () => { V.stop(); app.busy = false; V.sfx.tap(); show(b.dataset.v); }));
  document.querySelectorAll('[data-open-parent]').forEach(b => b.addEventListener('click', () => askPin(() => show('parent'))));
  document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => show('home')));
  MI.bindChecklist($('#rBoxHome'), false);

  /* ---------- STOP ---------- */
  $('#stopBtn').addEventListener('click', () => { MI.pause(); R.stopAll(); app.busy = false; setMic('idle'); });

  /* ---------- HUD: επίπεδο, αστέρια, σερί ---------- */
  function hud() {
    const L = PR.levelInfo();
    $('#hudLvlN').textContent = L.level;
    const c = 2 * Math.PI * 20; $('#hudRing').style.strokeDasharray = `${c * L.cur / L.need} ${c}`;
    $('#hudStarsN').textContent = P.stars; $('#gStars').textContent = P.stars;
    $('#hudStreakN').textContent = P.streak;
  }
  PR.on((t, d) => {
    hud();
    if (t === 'level') levelUp(d.level);
    if (t === 'skill' && d.change > 0) setTimeout(() => R.setBubble('Η δυσκολία ανέβηκε! Γίνεσαι όλο και πιο έξυπνος!'), 2500);
  });

  /* αστεράκι που πετάει προς τον μετρητή */
  DB.ui = {
    flyStar(el, n = 1) {
      const to = $('#hudStars').getBoundingClientRect(), from = (el && el.getBoundingClientRect && el.getBoundingClientRect()) || to;
      for (let i = 0; i < Math.min(n, 5); i++) {
        const s = document.createElement('span'); s.className = 'flyStar emo'; s.textContent = '⭐'; document.body.appendChild(s);
        const x0 = from.left + from.width / 2, y0 = from.top + from.height / 2, x1 = to.left + 14, y1 = to.top + to.height / 2;
        const a = s.animate([{ transform: `translate(${x0}px,${y0}px) scale(1.6)`, opacity: 1 }, { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 120}px) scale(1.2)`, opacity: 1 }, { transform: `translate(${x1}px,${y1}px) scale(.6)`, opacity: .9 }],
          { duration: 900, delay: i * 140, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
        a.onfinish = () => { s.remove(); V.sfx.coin(); const h = $('#hudStars'); h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump'); };
      }
    }
  };

  /* νέο επίπεδο */
  function levelUp(l) {
    const un = [];
    Object.keys(PR.ITEMS).forEach(k => PR.ITEMS[k].forEach(it => { if (it.lvl === l) un.push(it.name); }));
    $('#lvlBig').textContent = l;
    $('#lvlUnlocks').textContent = un.length ? 'Ξεκλείδωσαν στο Γκαράζ: ' + un.join(', ') : 'Ο DimiBot έγινε πιο δυνατός!';
    setTimeout(() => {
      $('#lvlModal').hidden = false; V.sfx.level(); R.confetti(200);
      R.say(`Νέο επίπεδο! Επίπεδο ${C.NUM[l] || l}!${un.length ? ' Ξεκλείδωσαν καινούργια πράγματα στο γκαράζ!' : ''}`);
    }, 1200);
  }
  $('#lvlOk').addEventListener('click', () => { $('#lvlModal').hidden = true; });

  /* ---------- Βάση ---------- */
  function drawHome() {
    const h = new Date().getHours();
    $('#hello').textContent = `${h < 12 ? 'Καλημέρα' : h < 18 ? 'Γεια σου' : 'Καλησπέρα'}, ${S.childName.replace(/η$/, 'η')}!`;
    const m = MI.today(), cats = Object.keys(MI.CATS).filter(k => S.cats[k]);
    const active = m && !m.done && !m.practice ? m : null;
    const n = PR.doneToday(), max = Math.max(1, Math.min(5, +S.maxMissions || 5));
    const showCats = active ? active.steps.map(s => s.cat) : cats.filter(k => k !== 'routine' || n === 0);
    $('#homePlanets').innerHTML = showCats.map((k, i) => { const c = MI.CATS[k], done = active && i < active.si; return `<div class="planet sm ${done ? 'done' : ''}" style="--pc:${c.col}"><span>${done ? '✓' : c.e}</span><small>${c.short}</small></div>`; }).join('<i class="orbit"></i>')
      + `<i class="orbit"></i><div class="planet sm chest"><span>🎁</span><small>Δώρο</small></div>`;
    const go = $('#homeGo'), pr = $('#homePractice');
    const dots = Array.from({ length: max }, (_, i) => i < n ? '🟡' : '⚪').join('');
    if (active) { go.textContent = '🚀 Συνέχισε την αποστολή'; go.disabled = false; pr.hidden = true; $('#homeMNote').textContent = `σταθμός ${Math.min(active.si + 1, active.steps.length)} από ${active.steps.length}`; }
    else if (n >= max) { go.textContent = `✓ Έκανες ${max} αποστολές σήμερα! Τα λέμε αύριο`; go.disabled = true; pr.hidden = false; $('#homeMNote').textContent = `🔥 ${P.streak} ${P.streak === 1 ? 'μέρα' : 'μέρες'} στη σειρά`; }
    else { go.textContent = n === 0 ? '🚀 Ξεκίνα την αποστολή' : `🚀 Νέα αποστολή (${n + 1} από ${max})`; go.disabled = false; pr.hidden = true; $('#homeMNote').textContent = n ? 'Αποστολές σήμερα ' + dots : '5–8 λεπτά'; }
    const rst = PR.rday(), rl = MI.routineList();
    $('#homeRIcons').innerHTML = rl.map(r => `<span class="ri ${rst[r.id] || ''}" title="${esc(r.label)}"><span class="emo">${r.e}</span>${rst[r.id] === 'ok' ? '<i>⭐</i>' : rst[r.id] === 'wait' ? '<i>⏳</i>' : ''}</span>`).join('');
    const g = S.goal;
    if (g && g.text) { $('#goal').hidden = false; const n = Math.min(P.real, g.stars); $('#goalTxt').textContent = `${g.text}: ${n} / ${g.stars} αστέρια`; $('#goalBar').style.width = (100 * n / g.stars) + '%'; }
    else $('#goal').hidden = true;
  }
  $('#homeGo').addEventListener('click', () => { V.stop(); app.busy = false; V.sfx.whoosh(); MI.resume(); });
  $('#homePractice').addEventListener('click', () => { V.stop(); MI.start(true); });
  $('#homeRoutines').addEventListener('click', () => { V.sfx.tap(); show('routines'); R.say('Πάτα ό,τι έκανες σήμερα!'); });
  $('#mAgain').addEventListener('click', () => MI.again());
  $('#cAgain').addEventListener('click', () => { const t = document.querySelector('.bubble').textContent; if (t) R.say(t); });
  $('#cPause').addEventListener('click', () => { DB.career.pause(); show('home'); R.say('Τάιμ άουτ! Ο αγώνας μάς περιμένει.'); });
  $('#mPause').addEventListener('click', () => { MI.pause(); show('home'); R.say('Διάλειμμα! Η αποστολή σε περιμένει όπου σταματήσαμε.'); });

  /* διασκέδαση */
  let riddle = null;
  const FUN = [
    ['joke', '😂', 'Αστείο', async () => { const j = C.JOKES[Math.floor(Math.random() * C.JOKES.length)]; await R.say(j); R.run('HAPPY'); DB.log.add('joke'); }],
    ['riddle', '🧩', 'Γρίφος', async () => {
      if (riddle) { const r = riddle; riddle = null; funLabel('riddle', 'Γρίφος'); R.confetti(50); await R.say('Η λύση είναι… ' + r[1]); return; }
      riddle = C.RIDDLES[Math.floor(Math.random() * C.RIDDLES.length)]; funLabel('riddle', 'Λύση!'); R.eyes('focus'); await R.say(riddle[0] + ' Σκέψου… και πάτα «Λύση»!'); R.eyes('normal'); DB.log.add('riddle'); }],
    ['dance', '🕺', 'Χορός', () => R.run('DANCE')],
    ['lesson', '🧠', 'Μαθήματα', async () => { MI.resume(); }],
    ['dunk', '🏀', 'Κάρφωμα', async () => { const s = R.say(['Πάμε Περιστέρι!', 'Κάρφωμααα!', 'Τριπλή άμυνα… και καλάθι!'][Math.floor(Math.random() * 3)]); await R.run('DUNK'); await s; }],
    ['fact', '🔭', 'Ήξερες ότι;', async () => { const f = C.FACTS[Math.floor(Math.random() * C.FACTS.length)]; R.eyes('focus'); await R.say('Ήξερες ότι… ' + f[1]); R.eyes('normal'); }],
    ['story', '📖', 'Ιστορία', () => converse(`Πες μου μια πολύ μικρή, αστεία ιστορία-περιπέτεια στο διάστημα σε 4 σύντομες προτάσεις, με πρωταγωνιστές εσένα και τον ${S.childName}.`)]
  ];
  function funLabel(k, t) { const b = document.querySelector(`#fun [data-k="${k}"] .fl`); if (b) b.textContent = t; }
  $('#fun').innerHTML = FUN.map(([k, e, l]) => `<button class="funBtn" data-k="${k}"><span class="emo">${e}</span><span class="fl">${l}</span></button>`).join('');
  $('#fun').addEventListener('click', e => { const b = e.target.closest('.funBtn'); if (!b) return; V.sfx.tap(); app.run(FUN.find(f => f[0] === b.dataset.k)[3]); });

  /* ---------- Μικρόφωνο ---------- */
  function setMic(state) {
    const b = $('#micBtn'); b.classList.toggle('listen', state === 'listen'); b.classList.toggle('think', state === 'think');
    $('#micLabel').textContent = { listen: 'Σε ακούω…', think: 'Σκέφτομαι…', idle: 'Μίλα μου' }[state];
  }
  async function talk(r) { const act = r.action ? R.run(r.action) : Promise.resolve(); await Promise.all([R.say(r.text), act]); }
  /* Ρωτάει το AI και μιλάει πρόταση-πρόταση όσο έρχεται η απάντηση (πολύ πιο γρήγορο). */
  const FILLERS = ['Χμμ, για να σκεφτώ!', 'Ωραία ερώτηση!', 'Ψάχνω στα κυκλώματά μου…', 'Μισό λεπτό, υπολογίζω!'];
  let fi = 0;
  async function converse(text) {
    setMic('think'); R.eyes('focus');
    const q = []; let done = false, wake = null, said = '', spoke = false;
    let filler = setTimeout(() => { if (!spoke) { R.setBubble(FILLERS[fi % FILLERS.length]); V.speak(FILLERS[fi++ % FILLERS.length], { chat: true }); } }, 1200);
    const speaker = (async () => {
      for (;;) {
        if (q.length) { const s = q.shift(); if (!spoke) { spoke = true; clearTimeout(filler); setMic('idle'); R.eyes('normal'); } said += (said ? ' ' : '') + s; R.setBubble(said.replace(/[{}]/g, '')); await V.speak(s, { chat: true }); continue; }
        if (done) return; await new Promise(r => { wake = r; });
      }
    })();
    const r = await A.chat(text, s => { q.push(s); V.prefetch(s, true); if (wake) { const w = wake; wake = null; w(); } });
    clearTimeout(filler); done = true; if (wake) { const w = wake; wake = null; w(); }
    setMic('idle'); R.eyes('normal');
    const act = r.action ? R.run(r.action) : Promise.resolve();
    if (r.streamed && spoke) await Promise.all([speaker, act]);
    else { await speaker; await Promise.all([R.say(r.text, { chat: true }), act]); }
    hudAi();
  }
  $('#micBtn').addEventListener('click', () => {
    if (app.view === 'mission') { MI.pause(); }
    app.busy = false;
    app.run(async () => {
      if (!V.canListen) { await R.say('Αυτός ο browser δεν μπορεί να με κάνει να ακούω. Άνοιξέ με στον Chrome.'); return; }
      if (!S.aiOn) { await R.say('Η κουβεντούλα είναι κλειστή τώρα. Πάμε για αποστολή;'); return; }
      V.stop(); setMic('listen'); R.eyes('surprise'); R.setBubble('Σε ακούω…');
      let text = '';
      try { text = await V.listen(); } catch (e) { setMic('idle'); R.eyes('normal'); await R.say(e.message === 'not-allowed' ? 'Πρέπει να μου δώσεις άδεια για το μικρόφωνο.' : 'Δεν μπόρεσα να ακούσω. Ξαναδοκιμάζουμε;'); return; }
      text = text.split(' | ')[0]; R.eyes('normal');
      if (!text.trim()) { setMic('idle'); await R.say('Δεν σε άκουσα καλά. Πάτα το κουμπί και μίλα μου πιο δυνατά!'); return; }
      R.setBubble('«' + text + '»');
      if (/^(σταμάτα|στοπ|stop)\b/i.test(text.trim())) { R.stopAll(); return; }
      DB.log.add('talk'); await converse(text);
    });
  });

  /* ---------- Κάμερα ---------- */
  let stream = null, facing = 'environment';
  async function camStart() {
    if (!S.camOn) { $('#camOff').hidden = false; $('#camOff').textContent = 'Η κάμερα είναι κλειστή από τον γονέα'; return; }
    if (stream || !navigator.mediaDevices) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } }, audio: false });
      const v = $('#video'); v.srcObject = stream; await v.play(); $('#camOff').hidden = true;
    } catch (e) { $('#camOff').hidden = false; $('#camOff').textContent = 'Δεν έχω άδεια για την κάμερα'; }
  }
  function camStop() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } $('#camOff').hidden = false; }
  $('#camFlip').addEventListener('click', () => { facing = facing === 'environment' ? 'user' : 'environment'; camStop(); camStart(); });
  $('#camShot').addEventListener('click', () => app.run(async () => {
    if (!S.camOn || !stream) { await R.say('Η κάμερα δεν είναι ανοιχτή.'); return; }
    const v = $('#video'), c = $('#snap'), w = 640, h = Math.round(640 * (v.videoHeight || 480) / (v.videoWidth || 640));
    c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h);
    const b64 = c.toDataURL('image/jpeg', 0.7).split(',')[1];
    V.sfx.pop(); R.eyes('focus'); R.setBubble('Σαρώνω… σαρώνω…');
    const r = await A.see(b64); DB.log.add('camera');
    R.eyes('normal'); await talk(r);
  }));

  /* ---------- PIN γονέα ---------- */
  let pinMode = 'check', pinThen = null;
  function askPin(then) {
    pinThen = then; pinMode = S.pin ? 'check' : 'new';
    $('#pinTitle').textContent = S.pin ? 'PIN γονέα' : 'Όρισε PIN γονέα (4–6 ψηφία)';
    $('#pinMsg').textContent = ''; $('#pinInput').value = ''; $('#pinModal').hidden = false; $('#pinInput').focus();
  }
  app.askPin = askPin;
  $('#pinCancel').addEventListener('click', () => { $('#pinModal').hidden = true; });
  $('#pinOk').addEventListener('click', pinOk);
  $('#pinInput').addEventListener('keydown', e => { if (e.key === 'Enter') pinOk(); });
  function pinOk() {
    const v = $('#pinInput').value.trim();
    if (pinMode === 'new') { if (!/^\d{4,6}$/.test(v)) { $('#pinMsg').textContent = 'Βάλε 4 έως 6 αριθμούς.'; return; } S.pin = v; S.save(); }
    else if (v !== S.pin) { $('#pinMsg').textContent = 'Λάθος PIN.'; $('#pinInput').value = ''; return; }
    $('#pinModal').hidden = true; const f = pinThen; pinThen = null; if (f) f();
  }

  /* ---------- Γονικός χώρος ---------- */
  const bindVal = (id, key, conv = x => x, after) => $(id).addEventListener('change', e => { S[key] = conv(e.target.type === 'checkbox' ? e.target.checked : e.target.value); S.save(); after && after(); });
  bindVal('#pProvider', 'provider', x => x, chips); bindVal('#pKey', 'apiKey', x => x.trim(), chips); bindVal('#pModel', 'model', x => x.trim() || 'gemini-3.8-flash');
  bindVal('#pAi', 'aiOn', x => x, chips); bindVal('#pCam', 'camOn'); bindVal('#pPitch', 'pitch', Number); bindVal('#pRate', 'rate', Number);
  bindVal('#pName', 'childName', x => x.trim() || 'Δημήτρη'); bindVal('#pMinutes', 'dailyMinutes', x => Math.max(5, +x || 45));
  bindVal('#pApprove', 'approve'); bindVal('#pTeam', 'teamName', x => x.trim() || 'DimiBots'); bindVal('#pJersey', 'jersey', x => Math.max(0, Math.min(99, parseInt(x) || 0)), () => R.applyLook()); bindVal('#pSongs', 'songs'); bindVal('#pMaxM', 'maxMissions', x => Math.max(1, Math.min(5, +x || 5)));
  $('#pKeep').addEventListener('change', e => { S.keepAlive = e.target.checked; S.save(); V.keepAlive(S.keepAlive); });
  $('#pVoiceTest').addEventListener('click', () => R.say(`Γεια σου ${S.childName}! Είμαι ο DimiBot! Πάμε για αποστολή; And my English: {Hello, my friend!}`, { chat: true }).then(fillVoice));
  bindVal('#pTtsEngine', 'ttsEngine', x => x, fillVoice); bindVal('#pTtsRate', 'ttsRate', Number); bindVal('#pTtsRobot', 'ttsRobot'); bindVal('#pTtsScope', 'ttsScope');
  bindVal('#pDevVoice', 'deviceVoice', x => x, () => V.repick());
  $('#pTtsVoices').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; S.ttsVoice = b.dataset.v; S.save(); fillVoice(); R.say(`Γεια! Αυτή είναι η φωνή «${b.dataset.n}». Σου αρέσει;`, { chat: true }).then(fillVoice); });
  $('#pTtsClear').addEventListener('click', () => { V.clearCache(); $('#pTtsInfo').textContent = 'Οι αποθηκευμένες φράσεις σβήστηκαν.'; });
  function fillVoice() {
    $('#pTtsEngine').value = S.ttsEngine || 'gemini'; $('#pTtsRate').value = S.ttsRate || 1.08; $('#pTtsRobot').checked = !!S.ttsRobot; $('#pTtsScope').value = S.ttsScope || 'all';
    $('#pTtsVoices').innerHTML = V.VOICES.map(([v, n]) => `<button class="ghost sm${(S.ttsVoice || 'Leda') === v ? ' sel' : ''}" data-v="${v}" data-n="${n}">${n}</button>`).join('');
    $('#pGemVoice').hidden = S.ttsEngine === 'device';
    const dv = V.greekVoices(); $('#pDevVoice').innerHTML = '<option value="">Αυτόματα</option>' + dv.map(n => `<option ${n === S.deviceVoice ? 'selected' : ''}>${esc(n)}</option>`).join('');
    const st = DB.tts_stats || {};
    $('#pTtsInfo').textContent = S.ttsEngine === 'device' ? 'Μιλάει με τη φωνή του tablet.' : !S.apiKey ? 'Χρειάζεται κλειδί Gemini (κάρτα «Τεχνητή νοημοσύνη»). Μέχρι τότε μιλάει με τη φωνή του tablet.'
      : st.off === DB.store.today() ? 'Τελείωσε το σημερινό δωρεάν όριο φωνής· μέχρι αύριο μιλάει με τη φωνή του tablet.' : st.err ? 'Τελευταίο πρόβλημα: ' + st.err : st.n ? `Φωνή Gemini: OK (τελευταία φράση σε ${(st.ms / 1000).toFixed(1)} δευτ.)` : 'Πάτα «Άκου τη φωνή» για δοκιμή.';
  }
  $('#pTest').addEventListener('click', async () => {
    $('#pTestOut').textContent = 'Δοκιμή…';
    try { const t = await A.test(); $('#pTestOut').textContent = 'Λειτουργεί: «' + t + '»'; }
    catch (e) { $('#pTestOut').textContent = 'Σφάλμα: ' + e.message; }
  });
  $('#pResetToday').addEventListener('click', () => { DB.usage.reset(); fillParent(); });
  $('#pNewPin').addEventListener('click', () => { S.pin = ''; S.save(); askPin(() => show('parent')); });
  $('#pLock').addEventListener('click', () => show('home'));
  $('#pResetAll').addEventListener('click', () => { if (confirm('Σίγουρα; Θα χαθούν αστέρια, επίπεδα και αναβαθμίσεις.')) { PR.reset(); fillParent(); hud(); } });
  $('#pGoalN').addEventListener('change', e => { S.goal.stars = Math.max(5, +e.target.value || 50); S.save(); });
  $('#pGoalT').addEventListener('change', e => { S.goal.text = e.target.value.trim(); S.save(); });
  $('#pGoalReset').addEventListener('click', () => { P.real = 0; PR.save(); fillParent(); });

  /* φάκελος */
  const profInfo = () => { $('#pProfInfo').textContent = `${(S.profile || '').length} χαρακτήρες`; };
  $('#pProfile').addEventListener('change', e => { S.profile = e.target.value.slice(0, 20000); S.save(); profInfo(); });
  $('#pGoals').addEventListener('change', e => { S.goals = e.target.value.slice(0, 3000); S.save(); });
  $('#pToday').addEventListener('change', e => { S.todayNote = { d: DB.store.today(), t: e.target.value.trim() }; S.save(); });
  $('#pProfFile').addEventListener('change', async e => {
    const files = [...e.target.files]; e.target.value = '';
    for (const f of files) { if (f.size > 2 * 1048576) { alert(f.name + ': πολύ μεγάλο αρχείο'); continue; } const t = await f.text(); S.profile = ((S.profile || '') + '\n\n' + t).trim(); }
    S.save(); $('#pProfile').value = S.profile; profInfo();
    if (S.profile.length > 6000) $('#pProfInfo').textContent += ' – πολύ μεγάλο: πάτα «Σύνοψη με AI»';
  });
  $('#pProfSum').addEventListener('click', async () => {
    const t = $('#pProfile').value.trim(); if (!t) return;
    $('#pProfInfo').textContent = 'Γράφω σύνοψη…';
    try { const out = await A.summarizeProfile(t); if (confirm('Να αντικαταστήσω τον φάκελο με τη σύνοψη;\n\n' + out.slice(0, 900) + (out.length > 900 ? '…' : ''))) { S.profile = out; S.save(); $('#pProfile').value = out; } profInfo(); }
    catch (er) { $('#pProfInfo').textContent = 'Σφάλμα: ' + er.message; }
  });

  /* τραγούδια */
  async function fillSongs() {
    const l = await DB.music.list().catch(() => []);
    $('#pSongList').innerHTML = l.length ? l.map(s => `<div class="mem"><span class="emo">🎵</span><b>${esc(s.name)}</b><span>${(s.size / 1048576).toFixed(1)} MB</span><button class="ghost sm" data-sdel="${s.id}">Διαγραφή</button></div>`).join('') : '<p class="note">Δεν έχεις προσθέσει τραγούδια ακόμα. Χωρίς τραγούδια, χορεύει με το δικό του μουσικό κομμάτι.</p>';
  }
  $('#pSongAdd').addEventListener('change', async e => {
    const files = [...e.target.files]; e.target.value = '';
    for (const f of files) { if (f.size > 25 * 1048576) { alert(f.name + ': πολύ μεγάλο αρχείο (πάνω από 25 MB).'); continue; } try { await DB.music.add(f); } catch (er) { alert('Δεν αποθηκεύτηκε: ' + f.name); } }
    fillSongs();
  });
  $('#pSongList').addEventListener('click', async e => { const b = e.target.closest('[data-sdel]'); if (b) { await DB.music.remove(b.dataset.sdel); fillSongs(); } });
  $('#pSongTest').addEventListener('click', () => app.run(() => R.run('DANCE')));

  /* ρουτίνες */
  $('#pRAdd').addEventListener('click', () => {
    const label = $('#pRLabel').value.trim(); if (!label) return;
    S.routines.push({ id: 'c' + Date.now(), e: $('#pREmoji').value.trim() || '⭐', label, when: $('#pRWhen').value, on: true }); S.save();
    $('#pRLabel').value = $('#pREmoji').value = ''; fillRoutines();
  });
  $('#pRoutines').addEventListener('change', e => { const i = e.target.dataset.on; if (i != null) { S.routines[+i].on = e.target.checked; S.save(); } });
  $('#pRoutines').addEventListener('click', e => { const b = e.target.closest('[data-rdel]'); if (b) { S.routines.splice(+b.dataset.rdel, 1); S.save(); fillRoutines(); } });
  $('#pPendR').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.rok) PR.routineApprove(b.dataset.rok);
    if (b.dataset.rno) PR.routineUndo(b.dataset.rno);
    if (b.dataset.rall) MI.routineList().forEach(r => PR.routineApprove(r.id));
    fillRoutines();
  });
  const WHEN = { morning: 'Πρωί', day: 'Μέρα', evening: 'Βράδυ' };
  function fillRoutines() {
    const st = PR.rday();
    const pend = S.routines.filter(r => st[r.id] === 'wait');
    $('#pPendR').innerHTML = pend.length ? `<div class="pending"><b>Περιμένουν επιβεβαίωση:</b> ${pend.map(r => `<span class="pr">${r.e} ${esc(r.label)} <button class="ghost sm" data-rok="${r.id}">✓</button><button class="ghost sm" data-rno="${r.id}">✕</button></span>`).join('')}<button class="go sm" data-rall="1">Επιβεβαίωση όλων</button></div>` : '';
    $('#pRoutines').innerHTML = S.routines.map((r, i) => `<div class="mem"><label class="sw2"><input type="checkbox" data-on="${i}" ${r.on ? 'checked' : ''}> <span class="emo">${r.e}</span> ${esc(r.label)} <small class="note">(${WHEN[r.when]})</small></label>${st[r.id] === 'ok' ? '<span>⭐ σήμερα</span>' : ''}<button class="ghost sm" data-rdel="${i}" aria-label="Διαγραφή">Διαγραφή</button></div>`).join('');
  }
  function fillProgress() {
    const L = PR.levelInfo(), lv = P.lv, st = P.stat;
    const pct = k => st[k] && st[k][1] ? Math.round(100 * st[k][0] / st[k][1]) + '%' : '–';
    const words = Object.keys(P.words);
    $('#pProgress').innerHTML = `<div class="stats">
      <div><b>${L.level}</b><span>επίπεδο</span></div><div><b>${P.stars}</b><span>αστέρια τώρα</span></div><div><b>${P.total}</b><span>αστέρια συνολικά</span></div>
      <div><b>${P.streak}</b><span>σερί ημερών (ρεκόρ ${P.best})</span></div><div><b>${P.missions}</b><span>αποστολές</span></div></div>
      <table class="tbl"><tr><th>Δεξιότητα</th><th>Δυσκολία</th><th>Σωστά με την 1η</th></tr>
      <tr><td>Γράμματα</td><td>${lv.letters}/5</td><td>${pct('letters')}</td></tr><tr><td>Αριθμοί</td><td>${lv.numbers}/5</td><td>${pct('numbers')}</td></tr>
      <tr><td>Αγγλικά</td><td>${lv.english}/5</td><td>${pct('english')}</td></tr><tr><td>Κόσμος & σκέψη</td><td>${lv.world}/5</td><td>${pct('world')}</td></tr>
      <tr><td>Ρουτίνες (σειρά)</td><td>–</td><td>${pct('routine')}</td></tr></table>
      <p class="note"><b>Αγγλικές λέξεις (${words.length}):</b> ${words.map(esc).join(', ') || '—'}</p>
      <p class="note">Η δυσκολία προσαρμόζεται μόνη της: ανεβαίνει μετά από 7 στα 8 σωστά και κατεβαίνει αν δυσκολεύεται.</p>`;
  }
  function fillMemory() {
    const M = DB.memory;
    $('#pPending').innerHTML = M.pending.map((t, i) => `<div class="pending"><span>Ο DimiBot θέλει να θυμάται: «${esc(t)}»</span><button class="ghost sm" data-ok="${i}">Έγκριση</button><button class="ghost sm" data-no="${i}">Απόρριψη</button></div>`).join('');
    $('#pMem').innerHTML = `<div class="mem"><b>Όνομα</b><span>${esc(S.childName)}</span></div>` + M.items.map((m, i) => `<div class="mem"><b>${esc(m.k)}</b><span>${esc(m.v)}</span><button class="ghost sm" data-del="${i}">Διαγραφή</button></div>`).join('');
  }
  $('#pPending').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.ok) DB.memory.approve(+b.dataset.ok); else DB.memory.reject(+b.dataset.no); fillMemory(); });
  $('#pMem').addEventListener('click', e => { const b = e.target.closest('button[data-del]'); if (b) { DB.memory.remove(+b.dataset.del); fillMemory(); } });
  $('#pMemAdd').addEventListener('click', () => { const k = $('#pMemK').value.trim(), v = $('#pMemV').value.trim(); if (!k || !v) return; DB.memory.add(k, v); $('#pMemK').value = $('#pMemV').value = ''; fillMemory(); });
  const CAT_N = { routine: 'Ρουτίνες', letters: 'Γράμματα & αριθμοί', english: 'Αγγλικά', world: 'Κόσμος & σκέψη' };
  $('#pCats').addEventListener('change', e => { const k = e.target.dataset.cat; if (k) { S.cats[k] = e.target.checked; S.save(); } });
  function fillParent() {
    $('#pProvider').value = S.provider; $('#pKey').value = S.apiKey; $('#pModel').value = S.model;
    $('#pAi').checked = S.aiOn; $('#pCam').checked = S.camOn; $('#pPitch').value = S.pitch; $('#pRate').value = S.rate; $('#pKeep').checked = S.keepAlive;
    $('#pName').value = S.childName; $('#pMinutes').value = S.dailyMinutes; $('#pApprove').checked = S.approve;
    $('#pGoalN').value = S.goal.stars; $('#pProfile').value = S.profile || ''; $('#pGoals').value = S.goals || ''; $('#pToday').value = S.todayNote && S.todayNote.d === DB.store.today() ? S.todayNote.t : ''; profInfo(); $('#pTeam').value = S.teamName || 'DimiBots'; $('#pJersey').value = S.jersey == null ? 7 : S.jersey; $('#pSongs').checked = S.songs !== false; fillSongs(); $('#pMaxM').value = S.maxMissions || 5; $('#pGoalT').value = S.goal.text || '';
    $('#pCats').innerHTML = Object.keys(CAT_N).map(k => `<label class="sw2"><input type="checkbox" data-cat="${k}" ${S.cats[k] ? 'checked' : ''}> ${CAT_N[k]}</label>`).join('');
    $('#pUsed').textContent = `Σήμερα: ${DB.usage.minutes()} από ${S.dailyMinutes} λεπτά.`;
    $('#pVoiceName').textContent = 'Φωνές tablet: ' + V.voiceName(); fillVoice();
    const lines = DB.log.todayLines(); $('#pLog').innerHTML = lines.length ? lines.map(esc).join('<br>') : 'Τίποτα ακόμα σήμερα.';
    const st = DB.ai_stats || {};
    if (st.last) $('#pLog').innerHTML += `<br><span class="note">Τελευταία απάντηση AI: ${esc(st.last)}, πρώτη λέξη σε ${(st.ms / 1000).toFixed(1)} δευτ.</span>`;
    if (A.lastError) $('#pLog').innerHTML += `<br><span class="note">Τελευταίο σφάλμα AI: ${esc(A.lastError)}</span>`;
    fillProgress(); fillRoutines(); fillMemory();
  }

  /* ---------- Χρόνος οθόνης ---------- */
  let lastTouch = Date.now();
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { lastTouch = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (document.hidden || app.view === 'parent' || app.view === 'lock') return;
    if (Date.now() - lastTouch > 120000) return;
    DB.usage.tick(15);
    if (DB.usage.over()) { MI.pause(); R.stopAll(); show('lock'); R.say('Οι μπαταρίες μου άδειασαν για σήμερα! Πάω για φόρτιση. Τα λέμε αύριο!'); }
  }, 15000);

  /* ---------- Ενδείξεις ---------- */
  function hudAi() { chips(); }
  function chips() {
    const p = A.current(), el = $('#chipAi');
    const ok = p.name === 'Google Gemini';
    const st = DB.ai_stats || {};
    el.textContent = ok ? (st.err ? 'AI ⚠️' : 'AI ✓' + (st.ms ? ' ' + (st.ms / 1000).toFixed(1) + 'δ' : '')) : (S.provider === 'gemini' && !S.apiKey ? 'AI: χωρίς κλειδί' : 'AI: offline');
    el.className = 'chip ' + (ok && !st.err ? 'ok' : 'warn');
  }
  window.addEventListener('online', chips); window.addEventListener('offline', chips);

  /* ---------- Ξεκίνημα ---------- */
  R.mount($('#stage'));
  DB.garage.init(); DB.play.init();
  hud(); chips(); show('home');
  if (S.keepAlive) document.addEventListener('pointerdown', () => V.keepAlive(true), { once: true });
  setTimeout(() => R.setBubble(`Γεια σου ${S.childName}, συμπαίκτη! Έτοιμος για αγώνα;`), 300);
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|anthropic/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
