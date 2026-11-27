/* DimiBot – τα τραγούδια της οικογένειας για τον χορό.
   Ο γονιός προσθέτει δικά του αρχεία ήχου (mp3, m4a…) από το tablet. Αποθηκεύονται ΜΟΝΟ τοπικά
   (IndexedDB του Chrome) και δεν ανεβαίνουν πουθενά. */
window.DB = window.DB || {};
(function () {
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('dimibot-music', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('songs', { keyPath: 'id' });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('songs', mode); const st = t.objectStore('songs'); const out = fn(st); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); }
  let cache = null;
  async function list() { if (cache) return cache; const all = await tx('readonly', st => st.getAll()); cache = (all || []).map(s => ({ id: s.id, name: s.name, size: s.blob.size })); return cache; }
  async function add(file) { const id = 's' + Date.now() + Math.floor(Math.random() * 1000); await tx('readwrite', st => st.put({ id, name: file.name.replace(/\.[^.]+$/, ''), blob: file })); cache = null; return id; }
  async function remove(id) { await tx('readwrite', st => st.delete(id)); cache = null; }
  async function get(id) { return tx('readonly', st => st.get(id)); }

  /* παίζει ένα τυχαίο τραγούδι για «secs» δευτερόλεπτα, από ένα ζωντανό σημείο του */
  let audio = null, url = null, stopT = null;
  async function play(secs = 14) {
    stop();
    const l = await list().catch(() => []); if (!l.length) return null;
    const s = await get(l[Math.floor(Math.random() * l.length)].id); if (!s) return null;
    url = URL.createObjectURL(s.blob); audio = new Audio(url); audio.volume = 0;
    await new Promise(r => { audio.onloadedmetadata = r; audio.onerror = r; setTimeout(r, 1500); });
    const d = audio.duration || 0;
    if (d > secs * 2) audio.currentTime = d * (0.2 + Math.random() * 0.3);
    try { await audio.play(); } catch (e) { stop(); return null; }
    const a = audio; let v = 0; const up = setInterval(() => { v = Math.min(1, v + .1); a.volume = v; if (v >= 1) clearInterval(up); }, 80);
    stopT = setTimeout(() => fadeOut(), secs * 1000);
    return a;
  }
  function fadeOut() { const a = audio; if (!a) return; const iv = setInterval(() => { a.volume = Math.max(0, a.volume - .1); if (a.volume <= 0) { clearInterval(iv); if (a === audio) stop(); } }, 90); }
  function stop() { clearTimeout(stopT); if (audio) { try { audio.pause(); } catch (e) {} audio = null; } if (url) { URL.revokeObjectURL(url); url = null; } }
  const playing = () => !!(audio && !audio.paused);

  DB.music = { list, add, remove, play, stop, playing, has: async () => (await list().catch(() => [])).length > 0 };
})();
