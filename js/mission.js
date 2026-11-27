/* DimiBot – η ημερήσια αποστολή: 4 «πλανήτες» (ρουτίνες, γράμματα & αριθμοί, αγγλικά, εξερεύνηση),
   περίπου 10–15 λεπτά, και σεντούκι με δώρο στο τέλος. */
window.DB = window.DB || {};
(function () {
  const $ = s => document.querySelector(s);
  const S = DB.settings, PR = DB.progress, C = DB.content, V = DB.voice;
  const R = () => DB.robot;
  const P = PR.data;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const CATS = {
    routine: { name: 'Πλανήτης Ρουτίνας', short: 'Ρουτίνες', e: '🏠', col: '#FFB547', intro: 'Πλανήτης Ρουτίνας!' },
    letters: { name: 'Γράμματα & Αριθμοί', short: 'Γράμματα', e: '🔤', col: '#FF6B9A', intro: 'Πλανήτης Γραμμάτων! Προσοχή, μετεωρίτες!' },
    english: { name: 'Planet English', short: 'English', e: '🗣️', col: '#4FA8FF', intro: '{Planet English!}' },
    world: { name: 'Πλανήτης Εξερεύνησης', short: 'Εξερεύνηση', e: '🔭', col: '#4ADE80', intro: 'Πλανήτης Εξερεύνησης!' }
  };
  const PRAISE = ['Μπαμ!', 'Φωτιά!', 'Ναι!', 'Τέλεια!', 'Σούπερ!', 'Ουάου!'];
  const OOPS = ['Χμ, όχι ακριβώς. Δοκίμασε ξανά!', 'Σχεδόν! Ξανακοίτα καλά.', 'Όχι αυτό… αλλά δεν πειράζει, από τα λάθη μαθαίνουμε!', 'Πάμε άλλη μια προσπάθεια, μπορείς!'];
  let pi = 0, oi = 0;
  const praise = () => PRAISE[pi++ % PRAISE.length];
  const oops = () => OOPS[oi++ % OOPS.length];

  /* ---------- σχέδιο της ημέρας ---------- */
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  function plan(practice) {
    const steps = [];
    const num = practice ? 0 : PR.doneToday();   // πόσες αποστολές έχει ήδη κάνει σήμερα
    const cats = Object.keys(CATS).filter(k => S.cats[k]);
    if (!cats.length) cats.push('letters');
    cats.forEach(cat => {
      if (cat === 'routine') { if (num === 0 && !practice) steps.push({ cat, items: ['check', 'lesson'] }); }
      if (cat === 'letters') steps.push({ cat, items: [pickOne(['meteor', 'whackL', 'pairsL']), pickOne(['feed', 'whackN', 'hoop', 'hoop'])] });
      if (cat === 'english') {
        const { fresh, review } = C.englishPlan(P.words, P.lv.english);
        const learn = !practice && num < 2 && fresh.length;   // καινούργιες λέξεις μόνο στις 2 πρώτες αποστολές
        let words = (learn ? fresh.concat(review) : review).map(w => w[0]);
        if (words.length < 2) words = words.concat(C.WORDS.slice(0, 3).map(w => w[0])).slice(0, 3);
        steps.push({ cat, items: learn ? ['words', pickOne(['bubbles', 'pairsE'])] : [pickOne(['bubbles', 'pairsE'])], fresh: learn ? fresh.map(w => w[0]) : [], words });
      }
      if (cat === 'world') steps.push({ cat, items: [pickOne(['hunt', 'sort']), pickOne(['fact', 'pattern', 'odd'])] });
    });
    if (!steps.length) steps.push({ cat: 'letters', items: ['meteor', 'feed'] });
    return { day: DB.store.today(), steps, si: 0, ii: 0, intro: true, stars: 0, done: false, practice: !!practice, num: num + 1 };
  }
  function today() { const m = P.mission; return m && m.day === DB.store.today() ? m : null; }
  const save = () => PR.save();

  /* ---------- UI ---------- */
  let M = null, token = 0, starOk = true, tries = 0;
  const area = () => $('#mArea');
  function drawHead() {
    $('#mPlanets').innerHTML = M.steps.map((s, i) => {
      const c = CATS[s.cat], st = i < M.si ? 'done' : i === M.si ? 'now' : '';
      return `<div class="planet ${st}" style="--pc:${c.col}"><span>${i < M.si ? '✓' : c.e}</span></div>${i < M.steps.length - 1 ? '<i class="orbit"></i>' : ''}`;
    }).join('') + `<i class="orbit"></i><div class="planet chest ${M.si >= M.steps.length ? 'now' : ''}"><span>🎁</span></div>`;
    const step = M.steps[M.si];
    $('#mDots').innerHTML = step ? step.items.map((_, i) => `<i class="${i < M.ii ? 'on' : i === M.ii ? 'cur' : ''}"></i>`).join('') : '';
    $('#mTitle').textContent = step ? CATS[step.cat].name : (M.practice ? 'Τέλος εξάσκησης!' : 'Το σεντούκι της αποστολής');
    $('#v-mission').style.setProperty('--pc', step ? CATS[step.cat].col : '#FFD84D');
  }
  let lastSay = '';
  async function speak(t, cmd) { lastSay = t; const my = token; const a = cmd ? R().run(cmd) : null; await R().say(t); if (a) await a; return my === token; }

  function start(practice) {
    const cur = today();
    if (practice || !cur || cur.done || cur.practice) { P.mission = plan(practice); save(); }
    M = P.mission; DB.app.show('mission'); next();
  }
  function resume() { M = today(); if (!M || M.done || M.practice) return start(false); DB.app.show('mission'); next(); }

  /* προχωράει στο επόμενο κομμάτι της αποστολής */
  async function next() {
    const my = ++token; starOk = true; tries = 0;
    drawHead();
    if (M.si >= M.steps.length) return M.practice ? practiceEnd() : chest();
    const step = M.steps[M.si];
    if (M.intro) { return intro(step, my); }
    const item = step.items[M.ii];
    if (!item) { M.si++; M.ii = 0; M.intro = true; save(); return next(); }
    const [type, arg] = item.split(':');
    if (type === 'check') return checklist(my);
    if (type === 'lesson') return order(C.lessonQ(P.seen.lesson), my);
    const alive = () => my === token, A = DB.arcade;
    if (type === 'meteor') return game(A.meteors(area(), alive, P.lv.letters), my, 'Τα έπιασες όλα!');
    if (type === 'feed') return game(A.feed(area(), alive, P.lv.numbers), my, 'Μπαταρίες στο φουλ!');
    if (type === 'words') return A.meetWords(area(), alive, step.fresh).then(() => { if (alive()) advance(); });
    if (type === 'bubbles') return game(A.bubbles(area(), alive, step.words, P.lv.english), my, '{Great job!}');
    if (type === 'hunt') { P.seen.hunt = (P.seen.hunt || 0) + 1; return game(A.hunt(area(), alive, P.lv.world, P.seen.hunt), my, 'Τι κυνηγός!'); }
    if (type === 'hoop') return game(A.hoop(area(), alive, P.lv.numbers), my, 'Τι σουτέρ! Σαν παίκτης του Περιστερίου!');
    if (type === 'whackL') return game(A.whack(area(), alive, 'letters', P.lv.letters), my, 'Μπαμ! Τους έπιασες όλους!');
    if (type === 'whackN') return game(A.whack(area(), alive, 'numbers', P.lv.numbers), my, 'Τι γρήγορα χέρια!');
    if (type === 'pairsL') return game(A.pairs(area(), alive, 'letters', P.lv.letters), my, 'Τι μνήμη!');
    if (type === 'pairsE') return game(A.pairs(area(), alive, 'english', P.lv.english, step.words), my, '{Super memory!}');
    if (type === 'sort') { P.seen.sort = (P.seen.sort || 0) + 1; return game(A.sort(area(), alive, P.lv.world, P.seen.sort), my, 'Όλα στη θέση τους!'); }
    if (type === 'letter') return choice(C.letterQ(P.lv.letters), my);
    if (type === 'number') return choice(C.numberQ(P.lv.numbers), my);
    if (type === 'learn') return learn(C.W(arg), my);
    if (type === 'quiz') return choice(C.englishQ(C.W(arg), P.lv.english), my);
    if (type === 'fact') return choice(C.factQ(P.seen.fact), my);
    if (type === 'pattern') return choice(C.patternQ(P.lv.world), my);
    if (type === 'odd') return choice(C.oddQ(P.lv.world), my);
    advance();
  }
  function advance() { M.ii++; save(); next(); }

  async function game(promise, my, line) {
    const r = await promise;
    if (!r || my !== token) return;
    const n = Math.max(1, Math.ceil(r.first / 2));
    gain(n, $('#mArea'));
    try { await speak(line, 'CHEER'); } catch (e) {}
    if (my === token) advance();
  }
  async function intro(step, my) {
    const c = CATS[step.cat];
    area().innerHTML = `<div class="introCard" style="--pc:${c.col}"><div class="bigPlanet"><span>${c.e}</span></div><h2>${esc(c.name)}</h2><button class="go" id="mGo">Πάμε! ➜</button></div>`;
    V.sfx.whoosh();
    let gone = false;
    const go = () => { if (gone || my !== token) return; gone = true; V.stop(); M.intro = false; save(); next(); };
    $('#mGo').onclick = go;
    speak(c.intro, 'HAPPY').catch(() => {}); setTimeout(go, 1600);
  }

  /* ---------- ερώτηση πολλαπλής επιλογής ---------- */
  async function choice(q, my) {
    if (q.fact) {
      area().innerHTML = `<div class="factCard"><div class="chip">${esc(q.title)}</div>${q.show}<p>${esc(q.fact)}</p><button class="go" id="mGo">Κατάλαβα! ➜</button></div>`;
      let gone = false;
      $('#mGo').onclick = () => { if (gone || my !== token) return; gone = true; V.stop(); showChoice(q, my); };
      try { await speak('Ήξερες ότι… ' + q.fact, 'THINK'); } catch (e) {}
      return;
    }
    showChoice(q, my);
  }
  function showChoice(q, my) {
    area().innerHTML = `<div class="qCard"><div class="chip">${esc(q.title)}</div>${q.show || ''}
      <div class="choices n${q.choices.length}${q.wide ? ' wide' : ''}">${q.choices.map((c, i) => `<button class="choice" data-i="${i}">${c.html}</button>`).join('')}</div></div>`;
    let locked = false, armed = -1;
    area().querySelector('.choices').onclick = async e => {
      const b = e.target.closest('.choice'); if (!b || locked || my !== token) return;
      const i = +b.dataset.i, c = q.choices[i];
      if (q.listen && armed !== i) { // πρώτο πάτημα: ακούει τη λέξη, δεύτερο: απαντά
        armed = i; area().querySelectorAll('.choice').forEach(x => x.classList.toggle('armed', x === b));
        V.stop(); V.speak(`{${c.sayEn}}`); return;
      }
      V.stop(); locked = true;
      if (c.ok) {
        b.classList.add('right'); V.sfx.right(); R().confetti(40, .5, .5);
        PR.result(q.skill, tries === 0); DB.log.add('right'); if (q.word) PR.wordSeen(q.word, tries === 0);
        if (tries === 0) gain(1, b);
        if (q.fact) P.seen.fact++;
        try { await speak(q.fact ? `${praise()} ${q.good}` : praise(), tries === 0 ? 'HAPPY' : null); } catch (e) {}
        if (my === token) advance();
      } else {
        tries++; b.classList.add('wrong'); V.sfx.wrong(); R().eyes('sad'); DB.log.add('wrong');
        if (tries === 1) PR.result(q.skill, false);
        setTimeout(() => b.classList.remove('wrong'), 600);
        try {
          if (tries >= 2) { const k = q.choices.findIndex(x => x.ok); area().querySelectorAll('.choice')[k].classList.add('hint'); await speak('Δες αυτό που λάμπει! Νομίζω ότι είναι εκείνο!'); }
          else await speak(oops());
        } catch (e) {}
        R().eyes('normal'); locked = false;
      }
    };
    speak(q.say).catch(() => {});
  }

  /* ---------- νέα αγγλική λέξη ---------- */
  async function learn(w, my) {
    area().innerHTML = `<div class="learnCard"><div class="chip">Νέα λέξη!</div><div class="prompt"><span class="emo">${w[2]}</span></div>
      <div class="en big">${w[0]}</div><div class="gr">${esc(w[1])}</div>
      <div class="row center"><button class="ghost" id="lAgain">🔊 Άκου</button><button class="go" id="lSay">${V.canListen ? '🎤 Πες το!' : '✓ Το είπα!'}</button></div>
      <button class="next" id="lNext" hidden>Συνέχεια ➜</button></div>`;
    PR.wordSeen(w[0], false);
    let busy = false, got = false;
    $('#lAgain').onclick = () => { if (!busy) { V.stop(); V.speak(`{${w[0]}}`); } };
    $('#lNext').onclick = () => { if (my === token) { V.stop(); advance(); } };
    $('#lSay').onclick = async () => {
      if (busy || my !== token) return; busy = true; V.stop();
      let heard = '';
      if (V.canListen) {
        $('#lSay').textContent = '👂 Σε ακούω…'; $('#lSay').classList.add('listening'); R().eyes('surprise');
        try { heard = await V.listen('en-US'); } catch (e) { heard = ''; }
        $('#lSay').classList.remove('listening'); R().eyes('normal');
      }
      const ok = !V.canListen || heard.toLowerCase().includes(w[0]);
      if (!got) { got = true; gain(1, $('#lSay')); }
      $('#lSay').textContent = V.canListen ? '🎤 Ξανά!' : '✓ Το είπα!';
      try {
        if (ok) { V.sfx.right(); await speak(`${V.canListen ? 'Τέλεια προφορά!' : 'Μπράβο!'} {${w[0]}}! Σαν αληθινός Εγγλέζος!`, 'HAPPY'); }
        else if (heard) await speak(`Καλή προσπάθεια! Άκουσέ με άλλη μια φορά: {${w[0]}}.`);
        else await speak(`Δεν σε άκουσα καλά. Πες το πιο δυνατά: {${w[0]}}!`);
      } catch (e) {}
      $('#lNext').hidden = false; busy = false;
    };
    try { await speak(`Νέα λέξη! ${w[1].charAt(0).toUpperCase() + w[1].slice(1)} στα αγγλικά λέγεται… {${w[0]}}! {${w[0]}}! Πες το κι εσύ!`, 'WAVE_R'); } catch (e) {}
  }

  /* ---------- βάλε σε σειρά ---------- */
  async function order(q, my) {
    const cards = C.shuffle(q.steps.map((s, i) => ({ s, i })));
    let pos = 0, mist = 0;
    area().innerHTML = `<div class="orderCard"><div class="chip">Μάθε τη σειρά</div><h3>${esc(q.title)}</h3>
      <div class="slots">${q.steps.map((_, i) => `<div class="oslot" data-i="${i}"><b>${i + 1}</b></div>`).join('')}</div>
      <div class="ocards">${cards.map(c => `<button class="ocard" data-i="${c.i}"><span class="emo">${c.s[0]}</span><small>${esc(c.s[1])}</small></button>`).join('')}</div></div>`;
    area().querySelector('.ocards').onclick = async e => {
      const b = e.target.closest('.ocard'); if (!b || b.disabled || my !== token) return;
      const i = +b.dataset.i; V.stop();
      if (i === pos) {
        const slot = area().querySelectorAll('.oslot')[pos]; slot.innerHTML = `<span class="emo">${q.steps[i][0]}</span><small>${esc(q.steps[i][1])}</small>`; slot.classList.add('full');
        b.disabled = true; b.classList.add('used'); V.sfx.pop(); pos++;
        if (pos === q.steps.length) {
          P.seen.lesson++; PR.result('routine', mist === 0); if (mist < 2) gain(2, slot);
          R().confetti(60);
          try { await speak(`${praise()} Τώρα το ξέρεις!`, 'CHEER'); } catch (e) {}
          if (my === token) advance();
        } else { R().setBubble(q.steps[i][1]); V.speak(q.steps[i][1]); }
      } else {
        mist++; b.classList.add('wrong'); V.sfx.wrong(); setTimeout(() => b.classList.remove('wrong'), 600);
        speak(mist > 2 ? `Ψάξε αυτό: ${q.steps[pos][1].toLowerCase()}!` : 'Χμ, αυτό γίνεται αργότερα! Τι γίνεται πριν;').catch(() => {});
      }
    };
    try { await speak(q.say); } catch (e) {}
  }

  /* ---------- ρουτίνες της ημέρας ---------- */
  const WHEN = { morning: 'Πρωί', day: 'Μέρα', evening: 'Βράδυ' };
  function routineList() { return S.routines.filter(r => r.on); }
  function drawChecklist(box, inMission) {
    const st = PR.rday();
    const list = routineList();
    const pend = list.some(r => st[r.id] === 'wait');
    box.innerHTML = `<div class="rList">${list.map(r => `<button class="rCard ${st[r.id] || ''}" data-id="${r.id}"><span class="emo">${r.e}</span><span class="rl">${esc(r.label)}<small>${WHEN[r.when] || ''}</small></span><span class="rs">${st[r.id] === 'ok' ? '⭐' : st[r.id] === 'wait' ? '⏳' : ''}</span></button>`).join('') || '<p class="note">Ο γονιός δεν έχει διαλέξει ρουτίνες ακόμα.</p>'}</div>
      <div class="row center">${pend ? '<button class="ghost" id="rApprove">👨‍👩‍👦 Ο γονιός επιβεβαιώνει</button>' : ''}${inMission ? '<button class="go" id="rNext">Συνέχεια ➜</button>' : ''}</div>`;
  }
  function bindChecklist(box, inMission, my) {
    box.onclick = async e => {
      const a = e.target.closest('#rApprove');
      if (a) { DB.app.askPin(() => { let n = 0; routineList().forEach(r => { if (PR.routineApprove(r.id)) n++; }); drawChecklist(box, inMission); if (n) { R().celebrate(); speak(`Ο γονιός επιβεβαίωσε! Κέρδισες ${n === 1 ? 'ένα αστέρι' : C.NUM[n] + ' αστέρια'}!`).catch(() => {}); } }); return; }
      if (e.target.closest('#rNext')) { V.stop(); if (my === token) advance(); return; }
      const b = e.target.closest('.rCard'); if (!b) return;
      const id = b.dataset.id, st = PR.rday();
      if (st[id]) { speak(st[id] === 'ok' ? 'Αυτό το έκανες ήδη! Είσαι σούπερ!' : 'Περιμένουμε τον μπαμπά ή τη μαμά να το επιβεβαιώσει!').catch(() => {}); return; }
      const r = S.routines.find(x => x.id === id);
      const res = PR.routineMark(id); drawChecklist(box, inMission); V.sfx.coin();
      if (res === 'ok') DB.ui.flyStar(box.querySelector(`[data-id="${id}"]`));
      speak(res === 'ok' ? 'Μπράβο! Αστέρι!' : 'Μπράβο! Θα το δει ο γονιός!', 'HAPPY').catch(() => {});
    };
  }
  async function checklist(my) {
    area().innerHTML = `<div class="checkCard"><div class="chip">Τι έκανα σήμερα;</div><div id="rBox"></div></div>`;
    const box = $('#rBox'); drawChecklist(box, true); bindChecklist(box, true, my);
    try { await speak('Τι έκανες σήμερα; Πάτα τα!'); } catch (e) {}
  }

  /* ---------- σεντούκι ---------- */
  function itemPreview(kind, it) {
    if (!it) return '';
    if (kind === 'color') return `<span class="sw big" style="background:linear-gradient(${it.c[0]},${it.c[1]})"></span>`;
    if (kind === 'eyes') return `<span class="sw big eye" style="--e:${it.c}"></span>`;
    if (kind === 'scene') return `<span class="sw big scene sc-${it.id}"></span>`;
    if (kind === 'shirt' && it.c) return `<span class="jersey" style="--j1:${it.c[0]};--j2:${it.c[1]}">${String(S.jersey || 7).slice(0, 2)}</span>`;
    return `<span class="emo">${it.e}</span>`;
  }
  const KIND = { shirt: 'Νέα φανέλα', color: 'Νέο χρώμα', eyes: 'Νέα μάτια', hat: 'Νέο καπέλο', back: 'Νέο αξεσουάρ', dance: 'Νέος χορός', scene: 'Νέο σκηνικό' };
  async function chest() {
    const my = token;
    area().innerHTML = `<div class="chestCard"><button class="chestBtn" id="chest" aria-label="Άνοιξε το σεντούκι"><span class="emo">🎁</span></button><p class="note">Πάτα το δώρο!</p></div>`;
    try { await speak('Αποστολή ολοκληρώθηκε! Άνοιξε το σεντούκι!', 'CHEER'); } catch (e) {}
    $('#chest').onclick = async () => {
      if (my !== token || M.done) return;
      M.done = true; PR.missionDone(); DB.log.add('mission');
      const giftDay = (M.num || 1) === 1 || M.num === 3;
      const g = giftDay ? PR.nextGift() : null; const bonus = g ? 3 : 5; PR.addStars(bonus, 'chest'); PR.addXp(40); save();
      V.sfx.chest(); R().confetti(180);
      area().innerHTML = `<div class="chestCard open"><div class="gift">${g ? itemPreview(g.kind, g.item) : '<span class="emo">⭐</span>'}</div>
        <h2>${g ? esc(KIND[g.kind] + ': ' + g.item.name) : '+' + bonus + ' αστέρια!'}</h2>
        <p class="streak">🔥 ${P.streak} ${P.streak === 1 ? 'μέρα' : 'μέρες'} στη σειρά · Αποστολή ${M.num || 1} από ${S.maxMissions || 5} σήμερα</p>
        <div class="row center">${g && g.kind !== 'dance' ? '<button class="go" id="wear">Φόρα το!</button>' : g ? '<button class="go" id="wear">Δείξε μου τον χορό!</button>' : ''}<button class="ghost" id="done">Τέλος</button></div></div>`;
      DB.ui.flyStar($('.gift'), bonus);
      if ($('#wear')) $('#wear').onclick = () => DB.app.run(async () => { PR.wear(g.kind, g.item.id); if (g.kind === 'dance') await R().run('DANCE'); else { await R().run('SPIN'); await R().say('Πώς μου πάει;'); } });
      $('#done').onclick = () => { V.stop(); DB.app.show('home'); };
      try { await speak(`Ουάου! ${g ? g.item.name + '!' : C.NUM[bonus] + ' αστέρια!'}`, 'DANCE'); } catch (e) {}
    };
  }
  async function practiceEnd() {
    area().innerHTML = `<div class="chestCard"><div class="gift"><span class="emo">🏁</span></div><h2>Μπράβο εξάσκηση!</h2><div class="row center"><button class="go" id="done">Τέλος</button></div></div>`;
    $('#done').onclick = () => { V.stop(); DB.app.show('home'); };
    try { await speak('Τέλεια εξάσκηση! Ο εγκέφαλός σου έγινε ακόμα πιο δυνατός!', 'CHEER'); } catch (e) {}
  }

  /* αστέρια: στην εξάσκηση μόνο XP */
  function gain(n, el) {
    if (M && M.practice) { PR.addXp(n * 5); return; }
    M.stars += n; PR.addStars(n, 'mission'); DB.ui.flyStar(el, n);
  }

  function again() { if (lastSay) R().say(lastSay).catch(() => {}); }
  function pause() { token++; V.stop(); R().stopAll(true); }

  DB.mission = { CATS, start, resume, today, again, pause, drawChecklist, bindChecklist, routineList, itemPreview, KIND };
})();
