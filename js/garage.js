/* DimiBot – Γκαράζ: ο Δημήτρης ξοδεύει αστέρια για να αναβαθμίσει τον DimiBot */
window.DB = window.DB || {};
(function () {
  const $ = s => document.querySelector(s);
  const PR = DB.progress, V = DB.voice, R = () => DB.robot;
  const KINDS = [['color', 'Χρώμα', '🎨'], ['eyes', 'Μάτια', '👀'], ['hat', 'Καπέλα', '🎩'], ['back', 'Πλάτη', '🎒'], ['dance', 'Χοροί', '🕺'], ['scene', 'Σκηνικό', '🌌']];
  let kind = 'color', armed = null;

  function draw() {
    $('#gTabs').innerHTML = KINDS.map(([k, n, e]) => `<button class="gtab" data-k="${k}" aria-pressed="${k === kind}"><span>${e}</span>${n}</button>`).join('');
    const lvl = PR.levelInfo().level, L = PR.look(), stars = PR.data.stars;
    $('#gGrid').innerHTML = PR.ITEMS[kind].map(it => {
      const own = PR.owns(kind, it.id), on = L[kind] === it.id, lock = (it.lvl || 1) > lvl;
      const tag = on ? '<b class="tag on">✓</b>' : own ? '' : lock ? `<b class="tag lock">🔒 Επ. ${it.lvl}</b>` : `<b class="tag price${stars >= it.price ? '' : ' poor'}">⭐ ${it.price}</b>`;
      return `<button class="gItem${on ? ' on' : ''}${lock ? ' locked' : ''}${armed === it.id ? ' armed' : ''}" data-id="${it.id}">${DB.mission.itemPreview(kind, it)}<span class="gName">${it.name}</span>${tag}${armed === it.id ? '<span class="buy">Αγόρασέ το!</span>' : ''}</button>`;
    }).join('');
  }

  async function tap(id) {
    const it = PR.find(kind, id), lvl = PR.levelInfo().level;
    if (PR.owns(kind, id)) {
      armed = null; PR.wear(kind, id); V.sfx.pop(); draw();
      if (kind === 'dance') return DB.app.run(() => R().run('DANCE'));
      return DB.app.run(async () => { await R().run(kind === 'hat' || kind === 'back' ? 'SPIN' : 'HAPPY'); await R().say(['Ουάου! Μου πάει τέλεια!', 'Σούπερ στιλ!', 'Είμαι το πιο κουλ ρομπότ της γειτονιάς!'][Math.floor(Math.random() * 3)]); });
    }
    if ((it.lvl || 1) > lvl) { V.sfx.wrong(); return DB.app.run(() => R().say(`Αυτό ξεκλειδώνει στο επίπεδο ${it.lvl}! Μάζεψε αστέρια στις αποστολές για να ανέβεις!`)); }
    if (PR.data.stars < it.price) { V.sfx.wrong(); return DB.app.run(() => R().say(`Θέλει ${it.price} αστέρια. Έχεις ${PR.data.stars}. Λίγες αποστολές ακόμα!`)); }
    if (armed !== id) { armed = id; V.sfx.tap(); draw(); return DB.app.run(() => R().say(`${it.name}! Κοστίζει ${it.price} αστέρια. Πάτα ξανά για να το αγοράσεις!`)); }
    armed = null;
    if (PR.buy(kind, id)) {
      PR.wear(kind, id); V.sfx.coin(); R().confetti(90); draw();
      DB.app.run(async () => { if (kind === 'dance') { await R().say('Καινούργιος χορός! Κοίτα!'); await R().run('DANCE'); } else { await R().run('CHEER'); await R().say('Ευχαριστώ! Αυτή είναι η καλύτερη αναβάθμιση!'); } });
    }
  }

  function init() {
    $('#gTabs').addEventListener('click', e => { const b = e.target.closest('.gtab'); if (!b) return; kind = b.dataset.k; armed = null; V.sfx.tap(); draw(); });
    $('#gGrid').addEventListener('click', e => { const b = e.target.closest('.gItem'); if (b) tap(b.dataset.id); });
    PR.on(t => { if (t === 'stars' || t === 'level') draw(); });
    draw();
  }

  DB.garage = { init, draw };
})();
