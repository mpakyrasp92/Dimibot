/* DimiBot – μίνι παιχνίδια δράσης για την αποστολή.
   Λίγη ομιλία, πολλή δράση: φούσκες, μετεωρίτες, κυνήγι, τάισμα με μπαταρίες. */
window.DB = window.DB || {};
(function () {
  const C = DB.content, V = DB.voice, PR = DB.progress;
  const R = () => DB.robot;
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];

  /* μικρή χαρούμενη κίνηση που δεν «μπλοκάρει» το παιχνίδι */
  let jt = 0;
  function joy(big) {
    const r = R(); const k = jt++ % 4;
    r.eyes(big ? 'star' : 'happy');
    if (k === 0) { r.set('bot', 'translateY(-34px)'); r.set('armL', 'rotate(150deg)'); r.set('armR', 'rotate(-150deg)'); }
    else if (k === 1) { r.set('armR', 'rotate(-160deg)'); r.set('head', 'rotate(10deg)'); }
    else if (k === 2) { r.set('bot', 'scaleX(-1)'); }
    else { r.set('armL', 'rotate(160deg)'); r.set('head', 'rotate(-10deg)'); r.set('bot', 'translateY(-20px)'); }
    setTimeout(() => { r.rest(); r.eyes('normal'); }, 380);
    if (big) r.confetti(70);
  }
  function oops() { const r = R(); r.eyes('sad'); r.set('head', 'rotate(-8deg)'); setTimeout(() => { r.rest(); r.eyes('normal'); }, 500); }
  const COMBO = ['', '', 'Ναι!', 'Τέλεια!', 'Φωτιά!', 'Ασταμάτητος!', 'Σούπερ!', 'Μπαμ!'];

  /* ---------- γενική μηχανή: αντικείμενα που κινούνται και τα πατάς ----------
     cfg: { mode:'rise'|'fall'|'fly', hits, speed, every, next():target, top(target):html, say(target):text,
            spawn(target, wantOk):{html, ok} } */
  function arcade(area, alive, cfg) {
    return new Promise(resolve => {
      area.innerHTML = `<div class="arcade ${cfg.cls || ''}"><div class="aTop"><button class="aSay" aria-label="Άκου ξανά">🔊</button><div class="aTarget"></div><div class="aHits">${'<i></i>'.repeat(cfg.hits)}</div></div><div class="arena"></div></div>`;
      const arena = area.querySelector('.arena'), topEl = area.querySelector('.aTarget'), hitsEl = area.querySelectorAll('.aHits i');
      let target = null, hits = 0, combo = 0, missed = false, first = 0, items = [], last = 0, nextSpawn = 0, raf = 0, ended = false, sinceOk = 0;
      const W = () => arena.clientWidth, H = () => arena.clientHeight;
      function newTarget() {
        target = cfg.next(); missed = false; sinceOk = 0;
        topEl.innerHTML = cfg.top(target); topEl.classList.remove('pop'); void topEl.offsetWidth; topEl.classList.add('pop');
        items.forEach(it => { it.ok = cfg.isOk ? cfg.isOk(it.key, target) : false; it.el.dataset.ok = it.ok ? 1 : 0; });
        V.speak(cfg.say(target));
      }
      area.querySelector('.aSay').onclick = () => V.speak(cfg.say(target));
      function spawn(forceOk) {
        const wantOk = forceOk || Math.random() < (cfg.okRate || .4);
        const s = cfg.spawn(target, wantOk);
        const el = document.createElement('button'); el.className = 'item'; el.innerHTML = s.html;
        arena.appendChild(el);
        const size = el.offsetWidth || 90, w = W(), h = H();
        const sp = (cfg.speed || 70) * (0.8 + Math.random() * .5) * (h / 420);
        let x, y, vx = 0, vy = 0;
        const freeX = () => { let best = 0, bd = -1; for (let k = 0; k < 8; k++) { const c = Math.random() * (w - size); const d = Math.min(...items.map(o => Math.abs(o.x - c) + Math.abs(o.y - (cfg.mode === 'rise' ? h : 0)) / 3), 9999); if (d > bd) { bd = d; best = c; } } return best; };
        if (cfg.mode === 'rise') { x = freeX(); y = h + 10; vy = -sp; }
        else if (cfg.mode === 'fall') { x = freeX(); y = -size - 10; vy = sp * .8; }
        else { const L = Math.random() < .5; x = L ? -size - 10 : w + 10; y = 10 + Math.random() * (h - size - 20); vx = (L ? 1 : -1) * sp * 1.3; }
        const it = { el, x, y, vx, vy, ok: s.ok, key: s.key, size, wob: Math.random() * 6 };
        el.onpointerdown = e => { e.preventDefault(); tap(it); };
        el.dataset.ok = it.ok ? 1 : 0; items.push(it); if (it.ok) sinceOk = 0;
      }
      function tap(it) {
        if (ended || !alive() || it.dead) return;
        if (it.ok) {
          it.dead = true; it.el.classList.add('boom'); setTimeout(() => it.el.remove(), 350);
          items = items.filter(x => x !== it);
          if (!missed) first++;
          cfg.onResult && cfg.onResult(!missed, target);
          hitsEl[hits] && hitsEl[hits].classList.add('on'); hits++; combo++;
          V.sfx.pop(); setTimeout(V.sfx.right, 80); joy(hits === cfg.hits);
          if (COMBO[combo]) R().setBubble(COMBO[combo]);
          if (hits >= cfg.hits) return finish();
          setTimeout(() => { if (!ended && alive()) newTarget(); }, 350);
        } else {
          missed = true; combo = 0; it.el.classList.remove('nope'); void it.el.offsetWidth; it.el.classList.add('nope'); V.sfx.wrong(); oops();
        }
      }
      function finish() { ended = true; cancelAnimationFrame(raf); setTimeout(() => { area.querySelector('.arena') && (arena.innerHTML = ''); resolve({ hits, first }); }, 450); }
      function loop(t) {
        if (ended) return;
        if (!alive()) { ended = true; resolve(null); return; }
        const dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t;
        const w = W(), h = H();
        items.forEach(it => {
          it.x += it.vx * dt; it.y += it.vy * dt; it.wob += dt * 2;
          const sway = cfg.mode === 'rise' ? Math.sin(it.wob) * 10 : cfg.mode === 'fall' ? Math.sin(it.wob) * 4 : 0;
          it.el.style.transform = `translate(${it.x + sway}px,${it.y}px)`;
          if (it.y < -it.size - 20 || it.y > h + 30 || it.x < -it.size - 30 || it.x > w + 30) { it.dead = true; it.el.remove(); }
        });
        items = items.filter(i => !i.dead);
        sinceOk += dt;
        if (t > nextSpawn && items.length < (cfg.max || 6)) { spawn(!items.some(i => i.ok) && sinceOk > 1.2); nextSpawn = t + (cfg.every || 1000) * (0.7 + Math.random() * .6); }
        raf = requestAnimationFrame(loop);
      }
      newTarget();
      setTimeout(() => { spawn(true); raf = requestAnimationFrame(loop); }, 300);
    });
  }

  /* ---------- 1. Μετεωρίτες με γράμματα ---------- */
  function meteors(area, alive, lv) {
    const pool = C.LETTERS.slice(0, Math.min(C.LETTERS.length, 4 + lv * 4));
    const recent = pool.slice(-6);
    return arcade(area, alive, {
      cls: 'space', mode: 'fall', hits: 6, speed: 55 + lv * 10, every: 1100 - lv * 80, max: 4 + Math.min(3, lv),
      next: () => pick(Math.random() < .5 ? recent : pool),
      top: L => `<span class="glyph">${L[0]}</span><span class="emo">${L[3]}</span>`,
      say: L => `${L[1]}!`,
      isOk: (k, L) => k === L[0],
      spawn: (L, ok) => { const x = ok ? L : pick(pool.filter(p => p !== L)); return { html: `<span class="rock"><span class="glyph">${x[0]}</span></span>`, ok: x === L, key: x[0] }; },
      onResult: ok => PR.result('letters', ok)
    });
  }

  /* ---------- 2. Φούσκες με αγγλικές λέξεις ---------- */
  function bubbles(area, alive, words, lv) {
    const list = words.map(C.W).filter(Boolean);
    const others = C.WORDS.filter(w => !list.includes(w));
    let i = 0;
    return arcade(area, alive, {
      cls: 'sea', mode: 'rise', hits: 6, speed: 60 + lv * 8, every: 950, max: 5,
      next: () => list[i++ % list.length],
      top: w => `<span class="en">${w[0]}</span>`,
      say: w => `{${w[0]}}!`,
      isOk: (k, w) => k === w[0],
      spawn: (w, ok) => { const same = others.filter(o => o[3] === w[3]); const x = ok ? w : pick(Math.random() < .6 && same.length ? same : others.concat(list.filter(l => l !== w))); return { html: `<span class="bub"><span class="emo">${x[2]}</span></span>`, ok: x === w, key: x[0] }; },
      onResult: (ok, w) => { PR.result('english', ok); PR.wordSeen(w[0], ok); }
    });
  }

  /* ---------- 3. Κυνήγι κατηγορίας (κόσμος & σκέψη) ---------- */
  const NOISE = ['📖', '🪑', '👟', '🧸', '✏️', '⏰', '🎸', '🧦', '🌳', '🏠', '🔑'];
  const LAND = ['🐶', '🐱', '🐰', '🐻', '🦁', '🐮', '🐸', '🐵', '🐘', '🦒'], FRUIT = ['🍎', '🍌', '🍇', '🍓', '🍐', '🍊', '🍉', '🍒'], CARS = ['🚗', '🚌', '🚂', '✈️', '🚲', '🚀', '🚁', '🚜'], SEA = ['🐟', '🐙', '🐬', '🦀', '🐳', '🦈'];
  /* [όνομα, οδηγία, σωστά, λάθη] – τα «λάθη» διαλέγονται ώστε να μην υπάρχει αμφιβολία */
  const HUNT = [
    ['ζώα', 'Πιάσε μόνο τα ζώα!', LAND, NOISE.concat(FRUIT, CARS)],
    ['φρούτα', 'Πιάσε μόνο τα φρούτα!', FRUIT, NOISE.concat(LAND, CARS)],
    ['οχήματα', 'Πιάσε μόνο ό,τι έχει ρόδες ή πετάει!', CARS, NOISE.concat(LAND, FRUIT)],
    ['θάλασσα', 'Πιάσε μόνο ό,τι ζει στη θάλασσα!', SEA, NOISE.concat(LAND, CARS, FRUIT)],
    ['κόκκινα', 'Πιάσε μόνο τα κόκκινα!', ['🍎', '🍓', '🚒', '❤️', '🍒', '🌹', '🔴'], ['🍌', '🍐', '🐶', '🐸', '🚌', '🌳', '💧', '🐳', '🧊', '⚽', '📖', '🔑']],
    ['ζεστά', 'Πιάσε μόνο ό,τι είναι ζεστό!', ['☀️', '🔥', '☕', '🌋', '🍲'], ['🧊', '⛄', '❄️', '🍦', '🐧', '⚽', '📖', '🧸', '🌳', '🔑']],
    ['μπάλες', 'Πιάσε μόνο τις μπάλες!', ['🏀', '⚽', '🏐', '🎾', '🏈', '⚾'], ['🍎', '🍊', '🐶', '🚗', '📖', '🧸', '🌳', '🔑', '⏰', '🎸']],
    ['κρύα', 'Πιάσε μόνο ό,τι είναι κρύο!', ['🧊', '⛄', '❄️', '🍦', '🐧'], ['☀️', '🔥', '☕', '🌋', '⚽', '📖', '🧸', '🌳', '🍌', '🔑']]
  ];
  const SORTS = [[0, 1], [6, 1], [0, 2], [1, 2], [3, 2], [5, 7], [3, 1], [6, 0]];
  function hunt(area, alive, lv, idx) {
    const [label, say, set, bad] = HUNT[idx % HUNT.length];
    return arcade(area, alive, {
      cls: 'air', mode: 'fly', hits: 6, speed: 70 + lv * 12, every: 900 - lv * 50, max: 5, okRate: .45,
      next: () => label,
      top: () => `<span class="huntL">${say.replace('Πιάσε μόνο ', '').replace('!', '')}</span><span class="emo">${set[0]}${set[1]}</span>`,
      say: () => say,
      isOk: k => set.includes(k),
      spawn: (_, ok) => { const e = ok ? pick(set) : pick(bad); return { html: `<span class="orb"><span class="emo">${e}</span></span>`, ok: set.includes(e), key: e }; },
      onResult: ok => PR.result('world', ok)
    }).then(r => { if (r) r.say = say; return r; });
  }

  /* ---------- 4. Τάισε τον DimiBot με μπαταρίες (μέτρημα / πρόσθεση) ---------- */
  function feed(area, alive, lv) {
    return new Promise(resolve => {
      let round = 0, firstAll = 0; const ROUNDS = 3;
      const go = () => {
        if (!alive()) return resolve(null);
        if (round >= ROUNDS) return resolve({ hits: ROUNDS, first: firstAll });
        let a, b = 0;
        if (lv <= 1) a = 1 + rnd(5); else if (lv === 2) a = 2 + rnd(7); else { a = 1 + rnd(lv >= 4 ? 5 : 3); b = 1 + rnd(lv >= 4 ? 5 : 3); }
        const N = a + b; let count = 0, miss = false;
        area.innerHTML = `<div class="feed"><div class="aTop"><button class="aSay" aria-label="Άκου ξανά">🔊</button><div class="aTarget pop">${b ? `<span class="glyph">${a}</span><b class="plus">+</b><span class="glyph">${b}</span>` : `<span class="glyph">${N}</span>`}</div><div class="aHits">${'<i></i>'.repeat(ROUNDS)}</div></div>
          <div class="tank"><div class="fill"></div><b class="cnt">0</b></div>
          <div class="pile">${Array.from({ length: 10 }, (_, i) => `<button class="bat" data-i="${i}"><span class="emo">🔋</span></button>`).join('')}</div>
          <div class="row center"><button class="ghost" id="fReset">↺ Από την αρχή</button><button class="go" id="fDone">✓ Έτοιμο!</button></div></div>`;
        area.querySelectorAll('.aHits i').forEach((x, i) => x.classList.toggle('on', i < round));
        const sayIt = () => V.speak(b ? `Δώσε μου ${C.NUM[a]} μπαταρίες… και ${C.NUM[b]} ακόμα!` : `Δώσε μου ${C.NUM[N]} μπαταρίες!`);
        area.querySelector('.aSay').onclick = sayIt; sayIt();
        const cnt = area.querySelector('.cnt'), fill = area.querySelector('.fill');
        const show = () => { cnt.textContent = count; fill.style.height = Math.min(100, count * 10) + '%'; };
        area.querySelector('.pile').onclick = e => {
          const bt = e.target.closest('.bat'); if (!bt || bt.disabled || !alive()) return;
          bt.disabled = true; bt.classList.add('fly'); count++; show();
          V.tone(330 + count * 60, .15, 'triangle', .18); V.speak(C.NUM[count] || String(count));
          const r = R(); r.set('head', `rotate(${count % 2 ? 6 : -6}deg)`); setTimeout(() => r.set('head', ''), 200);
        };
        area.querySelector('#fReset').onclick = () => { count = 0; show(); area.querySelectorAll('.bat').forEach(x => { x.disabled = false; x.classList.remove('fly'); }); };
        let busy = false;
        area.querySelector('#fDone').onclick = async () => {
          if (!alive() || busy) return; busy = true;
          if (count === N) {
            PR.result('numbers', !miss); if (!miss) firstAll++;
            V.sfx.right(); joy(round === ROUNDS - 1);
            await V.speak(b ? `Ναι! ${C.NUM[a]} και ${C.NUM[b]} κάνουν ${C.NUM[N]}! Γέμισα!` : `Ναι! ${C.NUM[N]}! Γέμισα ενέργεια!`);
            round++; go();
          } else {
            if (!miss) PR.result('numbers', false); miss = true; V.sfx.wrong(); oops();
            await V.speak(count < N ? `Μου έδωσες ${C.NUM[count] || count}. Θέλω κι άλλες!` : `Ωπ, ${C.NUM[count] || count}! Πάρα πολλές! Ας ξαναμετρήσουμε.`);
            if (count > N) area.querySelector('#fReset').click();
            busy = false;
          }
        };
      };
      go();
    });
  }

  /* ---------- γνωριμία με τις νέες αγγλικές λέξεις (γρήγορα, χωρίς πολλή κουβέντα) ---------- */
  async function meetWords(area, alive, words) {
    for (const k of words) {
      const w = C.W(k); if (!w || !alive()) return;
      PR.wordSeen(w[0], false);
      area.innerHTML = `<div class="learnCard"><div class="chip">Νέα λέξη!</div><div class="prompt"><span class="emo">${w[2]}</span></div><div class="en big">${w[0]}</div><div class="gr">${w[1]}</div></div>`;
      R().run('WAVE_R');
      await V.speak(`{${w[0]}}! ${w[1].charAt(0).toUpperCase() + w[1].slice(1)}. {${w[0]}}!`);
      await new Promise(r => setTimeout(r, 400));
    }
  }


  /* ---------- 5. Εξωγήινοι στις τρύπες (γράμματα ή αριθμοί) ---------- */
  function whack(area, alive, kind, lv) {
    return new Promise(resolve => {
      const HITS = 6;
      const letters = C.LETTERS.slice(0, Math.min(C.LETTERS.length, 4 + lv * 4));
      const maxN = lv <= 1 ? 5 : lv <= 3 ? 7 : 10;
      const nums = Array.from({ length: maxN }, (_, i) => i + 1);
      const pool = kind === 'letters' ? letters.map(l => l[0]) : nums;
      let target, hits = 0, first = 0, missed = false, ended = false, timers = [];
      area.innerHTML = `<div class="arcade whackG"><div class="aTop"><button class="aSay" aria-label="Άκου ξανά">🔊</button><div class="aTarget"></div><div class="aHits">${'<i></i>'.repeat(HITS)}</div></div>
        <div class="holes">${Array.from({ length: 9 }, (_, i) => `<button class="hole" data-i="${i}"><span class="alien"><span class="emo">👾</span><b></b></span></button>`).join('')}</div></div>`;
      const holes = [...area.querySelectorAll('.hole')], topEl = area.querySelector('.aTarget'), hitsEl = area.querySelectorAll('.aHits i');
      const L = k => letters.find(l => l[0] === k);
      const say = () => V.speak(kind === 'letters' ? `${L(target)[1]}!` : `Ποιος έχει ${C.NUM[target]};`);
      const showTop = () => {
        topEl.innerHTML = kind === 'letters' ? `<span class="glyph">${target}</span><span class="emo">${L(target)[3]}</span>`
          : `<div class="dots">${'<i></i>'.repeat(target)}</div>`;
        topEl.classList.remove('pop'); void topEl.offsetWidth; topEl.classList.add('pop');
      };
      const newTarget = () => { let t; do { t = pick(pool); } while (t === target && pool.length > 1); target = t; missed = false; showTop(); say(); };
      area.querySelector('.aSay').onclick = say;
      const up = new Set();
      function popUp() {
        if (ended) return;
        if (!alive()) { ended = true; timers.forEach(clearTimeout); return resolve(null); }
        const free = holes.filter((_, i) => !up.has(i)); if (!free.length) return;
        const h = pick(free), i = +h.dataset.i;
        const needOk = ![...up].some(j => holes[j].dataset.v == target);
        const v = needOk || Math.random() < .35 ? target : pick(pool.filter(p => p !== target));
        h.dataset.v = v; h.querySelector('b').textContent = v; h.classList.add('up'); up.add(i);
        const stay = Math.max(1400, 2600 - lv * 220);
        timers.push(setTimeout(() => { h.classList.remove('up'); up.delete(i); }, stay));
      }
      function loop() { if (ended) return; popUp(); if (Math.random() < .5) popUp(); timers.push(setTimeout(loop, Math.max(650, 1100 - lv * 90))); }
      area.querySelector('.holes').onpointerdown = e => {
        const h = e.target.closest('.hole'); if (!h || ended || !h.classList.contains('up')) return;
        e.preventDefault();
        const i = +h.dataset.i;
        if (h.dataset.v == target) {
          h.classList.add('bonk'); setTimeout(() => h.classList.remove('bonk', 'up'), 260); up.delete(i);
          PR.result(kind === 'letters' ? 'letters' : 'numbers', !missed); if (!missed) first++;
          hitsEl[hits] && hitsEl[hits].classList.add('on'); hits++;
          V.sfx.boing(); setTimeout(V.sfx.right, 90); joy(hits === HITS);
          if (hits >= HITS) { ended = true; timers.forEach(clearTimeout); return setTimeout(() => resolve({ hits, first }), 500); }
          setTimeout(newTarget, 300);
        } else { missed = true; h.classList.add('nope'); setTimeout(() => h.classList.remove('nope'), 400); V.sfx.wrong(); oops(); }
      };
      newTarget(); timers.push(setTimeout(loop, 600));
    });
  }

  /* ---------- 6. Ζευγάρια (κάρτες μνήμης) ---------- */
  function pairs(area, alive, mode, lv, words) {
    return new Promise(resolve => {
      const N = lv >= 3 ? 4 : 3;
      let set;
      if (mode === 'english') {
        const list = (words || []).map(C.W).filter(Boolean);
        const more = C.WORDS.filter(w => !list.includes(w));
        set = list.concat(more.sort(() => Math.random() - .5)).slice(0, N).map(w => ({ k: w[0], a: `<span class="emo">${w[2]}</span>`, b: `<span class="en">${w[0]}</span>`, say: `{${w[0]}}` }));
      } else {
        const pool = C.LETTERS.slice(0, Math.min(C.LETTERS.length, 4 + lv * 4)).sort(() => Math.random() - .5).slice(0, N);
        set = pool.map(l => ({ k: l[0], a: `<span class="glyph">${l[0]}</span>`, b: `<span class="emo">${l[3]}</span>`, say: `${l[1]}… ${l[2]}` }));
      }
      const cards = C.shuffle(set.flatMap(s => [{ k: s.k, html: s.a, say: s.say }, { k: s.k, html: s.b, say: s.say }]));
      area.innerHTML = `<div class="pairsG"><div class="aTop"><div class="aTarget"><span class="huntL">Βρες τα ζευγάρια!</span></div><div class="aHits">${'<i></i>'.repeat(N)}</div></div>
        <div class="cardsG n${cards.length}">${cards.map((c, i) => `<button class="mcard" data-i="${i}"><span class="back">⭐</span><span class="face">${c.html}</span></button>`).join('')}</div></div>`;
      V.speak('Βρες τα ζευγάρια!');
      const els = [...area.querySelectorAll('.mcard')], hitsEl = area.querySelectorAll('.aHits i');
      let open = [], found = 0, misses = 0, lock = false;
      area.querySelector('.cardsG').onclick = e => {
        const b = e.target.closest('.mcard'); if (!b || lock || !alive() || b.classList.contains('flip')) return;
        const i = +b.dataset.i; b.classList.add('flip'); V.sfx.tap(); V.speak(cards[i].say); open.push(i);
        if (open.length < 2) return;
        const [x, y] = open; open = [];
        if (cards[x].k === cards[y].k) {
          els[x].classList.add('done'); els[y].classList.add('done');
          hitsEl[found] && hitsEl[found].classList.add('on'); found++;
          V.sfx.right(); joy(found === N); PR.result(mode === 'english' ? 'english' : 'letters', true);
          if (found === N) setTimeout(() => resolve({ hits: N, first: Math.max(0, N * 2 - misses) }), 700);
        } else {
          misses++; lock = true;
          setTimeout(() => { els[x].classList.remove('flip'); els[y].classList.remove('flip'); lock = false; }, 1000);
        }
      };
    });
  }

  /* ---------- 7. Τακτοποίησε στα καλάθια (κατηγορίες) ---------- */
  function sort(area, alive, lv, idx) {
    return new Promise(resolve => {
      const pr = SORTS[idx % SORTS.length], a = HUNT[pr[0]], b = HUNT[pr[1]];
      const A = a[2].filter(e => !b[2].includes(e)), B = b[2].filter(e => !a[2].includes(e));
      const TOTAL = lv >= 3 ? 8 : 6;
      const queue = C.shuffle([...C.shuffle(A).slice(0, TOTAL / 2).map(e => [e, 0]), ...C.shuffle(B).slice(0, TOTAL / 2).map(e => [e, 1])]);
      let n = 0, first = 0, missed = false;
      area.innerHTML = `<div class="sortG"><div class="aTop"><div class="aTarget"><span class="huntL">Βάλε κάθε πράγμα στο σωστό καλάθι!</span></div><div class="aHits">${'<i></i>'.repeat(TOTAL)}</div></div>
        <div class="sortRow"><button class="basket" data-b="0"><span class="emo">${a[2][0]}</span><b>${a[0]}</b><span class="emo bk">🧺</span></button>
        <div class="thing"><span class="emo"></span></div>
        <button class="basket" data-b="1"><span class="emo">${b[2][0]}</span><b>${b[0]}</b><span class="emo bk">🧺</span></button></div></div>`;
      V.speak(`${a[0]} εδώ, ${b[0]} εκεί!`);
      const thing = area.querySelector('.thing'), hitsEl = area.querySelectorAll('.aHits i');
      const show = () => { thing.innerHTML = `<span class="emo">${queue[n][0]}</span>`; thing.classList.remove('in'); void thing.offsetWidth; thing.classList.add('in'); missed = false; };
      show();
      area.querySelectorAll('.basket').forEach(bk => bk.onclick = () => {
        if (!alive() || n >= TOTAL || thing.classList.contains('go')) return;
        const side = +bk.dataset.b;
        if (side === queue[n][1]) {
          PR.result('world', !missed); if (!missed) first++;
          hitsEl[n] && hitsEl[n].classList.add('on');
          thing.classList.add('go', side ? 'r' : 'l'); V.sfx.pop(); joy(n === TOTAL - 1); n++;
          setTimeout(() => { thing.classList.remove('go', 'l', 'r'); if (n >= TOTAL) resolve({ hits: TOTAL, first }); else show(); }, 420);
        } else { missed = true; bk.classList.remove('nope'); void bk.offsetWidth; bk.classList.add('nope'); V.sfx.wrong(); oops(); }
      });
    });
  }

  /* ---------- 8. Μπάσκετ: σουτ στο καλάθι που κινείται, μετράμε πόντους (2άρια και 3άρια) ---------- */
  function hoop(area, alive, lv) {
    return new Promise(resolve => {
      const GOAL = 5, S = DB.settings;
      let made = 0, total = 0, first = 0, miss = false, busy = false, t0 = performance.now(), raf = 0, ended = false, shot = 0;
      area.innerHTML = `<div class="hoopG"><div class="aTop"><div class="aTarget score"><span class="emo">🏀</span><b class="pts">0</b><small>πόντοι</small></div><div class="aHits">${'<i></i>'.repeat(GOAL)}</div></div>
        <div class="court"><div class="hoop"><div class="board"></div><div class="rim"></div><div class="net"></div></div><div class="kind"></div><span class="ball emo">🏀</span><div class="line3"></div></div>
        <button class="go big shoot">🏀 ΣΟΥΤ!</button></div>`;
      const court = area.querySelector('.court'), hp = area.querySelector('.hoop'), ball = area.querySelector('.ball'), pts = area.querySelector('.pts'), kind = area.querySelector('.kind'), hitsEl = area.querySelectorAll('.aHits i');
      const speed = .7 + lv * .18, amp = () => court.clientWidth * .36;
      let hx = 0;
      const three = () => shot % 3 === 2;   // κάθε τρίτο σουτ είναι τρίποντο
      const setKind = () => { kind.textContent = three() ? '3 πόντοι' : '2 πόντοι'; court.classList.toggle('far', three()); };
      setKind();
      function loop(t) {
        if (ended) return; if (!alive()) { ended = true; return resolve(null); }
        if (!frozen) hx = Math.sin((t - t0) / 1000 * speed * 1.6) * amp();
        hp.style.transform = `translateX(${hx}px)`;
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      V.speak(`Μπάσκετ! Πάτα «Σουτ» όταν το καλάθι είναι από πάνω σου!`);
      let frozen = false;
      const shoot = () => {
        if (busy || ended || !alive()) return; busy = true;
        const pts3 = three();
        const tol = court.clientWidth * (lv <= 1 ? .16 : lv <= 3 ? .12 : .09);
        const ok = Math.abs(hx) < tol;           // κρίνεται τη στιγμή του σουτ (πιο δίκαιο για μικρά παιδιά)
        if (ok) frozen = true;                     // το καλάθι «περιμένει» την μπάλα
        ball.style.setProperty('--bx', (ok ? hx : hx + (hx > 0 ? -70 : 70)) + 'px');
        ball.classList.remove('up', 'in', 'out'); void ball.offsetWidth; ball.classList.add('up'); V.sfx.whoosh();
        R().set('armR', 'rotate(-165deg)'); R().set('bot', 'translateY(-16px)'); setTimeout(() => R().rest(), 300);
        setTimeout(async () => {
          if (ok) {
            const p = pts3 ? 3 : 2; total += p; made++; if (!miss) first++; miss = false;
            ball.classList.add('in'); court.classList.add('swish'); setTimeout(() => court.classList.remove('swish'), 500);
            pts.textContent = total; hitsEl[made - 1] && hitsEl[made - 1].classList.add('on');
            V.sfx.right(); joy(made === GOAL); PR.result('numbers', true);
            const cheer = Math.random() < .3 ? ' Πάμε Περιστέρι!' : '';
            await V.speak(`${C.NUM[p]}! Σύνολο ${C.NUM[total] || total}!${cheer}`);
            frozen = false; t0 = performance.now() - Math.random() * 2000;
            if (made >= GOAL) { ended = true; cancelAnimationFrame(raf); return resolve({ hits: GOAL, first, total }); }
          } else {
            miss = true; ball.classList.add('out'); V.sfx.boing(); oops();
            V.speak(['Άουτ! Ξανά!', 'Σχεδόν! Περίμενε το καλάθι!', 'Στο σίδερο! Πάμε πάλι!'][shot % 3]);
          }
          shot++; setKind();
          setTimeout(() => { ball.classList.remove('up', 'in', 'out'); busy = false; }, 350);
        }, 560);
      };
      area.querySelector('.shoot').onclick = shoot;
      court.onpointerdown = e => { e.preventDefault(); shoot(); };
    });
  }

  DB.arcade = { meteors, bubbles, hunt, feed, meetWords, whack, pairs, sort, hoop, HUNT, joy };
})();
