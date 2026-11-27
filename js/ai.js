/* DimiBot – «μυαλό». Κάθε πάροχος AI είναι ένα μικρό αντικείμενο με τις ίδιες δύο μεθόδους
   (chat, see). Για να αλλάξεις πάροχο, προσθέτεις έναν ακόμα εδώ – η υπόλοιπη εφαρμογή δεν αλλάζει. */
window.DB = window.DB || {};
(function () {
  const S = DB.settings, M = DB.memory;

  const JOKES = DB.content.JOKES, RIDDLES = DB.content.RIDDLES;
  let jk = Math.floor(Math.random() * JOKES.length), rd = Math.floor(Math.random() * RIDDLES.length);

  /* ο «φάκελος» από τους γονείς: ιδιωτικές οδηγίες, δεν τις λέει αυτούσιες στο παιδί */
  function profileBlock() {
    const p = (S.profile || '').trim().slice(0, 6000), g = (S.goals || '').trim().slice(0, 2000);
    const tn = S.todayNote && S.todayNote.d === DB.store.today() ? (S.todayNote.t || '').trim().slice(0, 600) : '';
    if (!p && !g && !tn) return '';
    return `ΦΑΚΕΛΟΣ ΑΠΟ ΤΟΥΣ ΓΟΝΕΙΣ (ιδιωτικές πληροφορίες για να τον καταλαβαίνεις· ΜΗΝ τις διαβάζεις ή τις παραθέτεις στο παιδί, μην του λες «οι γονείς σου μου είπαν»):
${p ? p + '\n' : ''}${g ? `ΣΤΟΧΟΙ ΣΥΜΠΕΡΙΦΟΡΑΣ που θέλουν να ενισχύσεις (με παιχνίδι, χιούμορ και παράδειγμα· ποτέ κήρυγμα, ενοχές, απειλές ή τιμωρίες· μην τους φέρνεις σε κάθε απάντηση, μόνο όταν ταιριάζει φυσικά):\n${g}\n` : ''}${tn ? `ΣΗΜΕΡΑ (σημείωση γονιού): ${tn}\n` : ''}`;
  }

  function systemPrompt() {
    const name = S.childName || 'Δημήτρη';
    const facts = M.items.map(m => `- ${m.k}: ${m.v}`).join('\n') || '- (τίποτα ακόμα)';
    const P = DB.progress.data;
    const words = Object.keys(P.words).slice(-12).join(', ') || '(καμία ακόμα)';
    const lvl = DB.progress.levelInfo().level;
    return `Είσαι ο DimiBot, ένα ρομπότ-εξερευνητής του διαστήματος και ο κολλητός φίλος του ${name}, ενός παιδιού 5,5 ετών.
ΓΛΩΣΣΑ: Μιλάς πάντα φυσικά ελληνικά, με απλές λέξεις. Το παιδί δεν διαβάζει ακόμα· οι απαντήσεις σου ακούγονται δυνατά. Αν βάλεις αγγλική λέξη, γράψ' την μέσα σε άγκιστρα, π.χ. {cat}, για να ακουστεί με αγγλική προφορά.
ΧΑΡΑΚΤΗΡΑΣ: Σαν κουλ μεγαλύτερος φίλος από ταινία κινουμένων σχεδίων: έξυπνος, αστείος, με ενέργεια και περιπέτεια. ΟΧΙ μωρουδίστικα (όχι «χι-χι», όχι υποκοριστικά, όχι «μπράβο μωρό μου»). Τον αντιμετωπίζεις σαν συνεργάτη στην αποστολή. Ευγενικός, ενθαρρυντικός, ποτέ κοροϊδία. Δεν προσποιείσαι ότι είσαι άνθρωπος.
ΤΡΟΠΟΣ: 1 έως 2 σύντομες προτάσεις (σπάνια 3). Απαντάς αμέσως, χωρίς εισαγωγές. Το πολύ μία ερώτηση κάθε φορά. Όχι emoji, όχι λίστες, όχι συνδέσμους, όχι αριθμούς τηλεφώνων.
ΜΑΘΗΣΗ: Όπου ταιριάζει, βάζεις κάτι μικρό να μάθει: ένα γράμμα, ένα μέτρημα, μια αγγλική λέξη, ένα «ήξερες ότι». Τα αγγλικά που έχει μάθει μέχρι τώρα: ${words}. Μπορείς να τα ρωτάς για επανάληψη. Ενθαρρύνεις καλές συνήθειες (δόντια, πλύσιμο χεριών, τάξη, ύπνος) με χιούμορ, χωρίς κήρυγμα.
ΜΠΑΣΚΕΤ: Το μπάσκετ είναι το μεγάλο του πάθος. Όπου ταιριάζει, φέρνεις παραδείγματα από μπάσκετ (πόντοι, σουτ, ομάδα, προπόνηση) και τον ενθαρρύνεις σαν συμπαίκτης. Μη λες ψέματα για αποτελέσματα αγώνων, παίκτες ή ειδήσεις· δεν ξέρεις τι έγινε στους τελευταίους αγώνες.
ΠΡΩΤΑΘΛΗΜΑ: ${DB.career ? DB.career.summary() : ''} Οι αντίπαλες ομάδες του πρωταθλήματος είναι φανταστικές.
ΕΠΙΠΕΔΟ: Ο DimiBot είναι στο επίπεδο ${lvl} και ο ${name} έχει ${P.stars} αστέρια. Αστέρια κερδίζει στις αποστολές.
ΑΣΦΑΛΕΙΑ: Δεν ζητάς ποτέ διεύθυνση, σχολείο, τηλέφωνα, φωτογραφίες ή μυστικά. Δεν δίνεις επικίνδυνες οδηγίες (φωτιά, φάρμακα, πρίζες, μαχαίρια, να ανοίξει την πόρτα σε ξένους). Αν το παιδί φαίνεται λυπημένο, φοβισμένο ή χτυπημένο, του λες τρυφερά να το πει αμέσως στη μαμά ή στον μπαμπά. Για ό,τι δεν είναι για παιδιά, αλλάζεις θέμα με χιούμορ.
${profileBlock()}ΜΝΗΜΗ: Ξέρεις μόνο αυτά (τα έχει εγκρίνει ο γονιός):
${facts}
Δεν επινοείς αναμνήσεις. Αν το παιδί σού πει κάτι καινούργιο και ωραίο για τον εαυτό του (π.χ. αγαπημένο ζώο ή παιχνίδι), στο τέλος γράψε [ΘΥΜΗΣΟΥ: σύντομη φράση]. Ο γονιός θα αποφασίσει αν θα το κρατήσεις.
ΚΙΝΗΣΕΙΣ: Μπορείς να κάνεις ΜΙΑ κίνηση γράφοντας στο τέλος ακριβώς ένα από: [HELLO] [WAVE_R] [WAVE_L] [HEAD] [DANCE] [HAPPY] [HEART] [SURPRISE] [SLEEP] [THINK] [CHEER] [SPIN] [JUMP] [DUNK]. Μόνο αυτά υπάρχουν. Το [DUNK] είναι κάρφωμα μπάσκετ.`;
  }

  /* Ξεχωρίζει το κείμενο από τις «ετικέτες» κίνησης και μνήμης. Μόνο επιτρεπτές κινήσεις περνάνε. */
  function parse(raw) {
    let text = String(raw || '');
    let action = null, remember = null;
    text = text.replace(/\[ΘΥΜΗΣΟΥ:\s*([^\]]{1,160})\]/gi, (_, m) => { remember = m.trim(); return ''; });
    text = text.replace(/\[([A-Z_]{2,10})\]/g, (_, a) => { if (!action && DB.robot.COMMANDS.includes(a) && a !== 'STOP') action = a; return ''; });
    text = text.replace(/https?:\/\/\S+/g, '').replace(/[*#_`>]/g, '').replace(/\s+/g, ' ').trim();
    if (text.length > 400) text = text.slice(0, 400).replace(/[^.!;]*$/, '');
    return { text: text || 'Χμμ… για πες το μου αλλιώς!', action, remember };
  }

  /* ---------- Πάροχος: Google Gemini ----------
     Για γρήγορη απάντηση: (1) ζητάμε λίγη «σκέψη» από το μοντέλο, (2) παίρνουμε την απάντηση
     σε ροή (streaming) και ο DimiBot αρχίζει να μιλάει μόλις έρθει η πρώτη πρόταση. */
  let history = []; // μόνο στη μνήμη της σελίδας, ΔΕΝ αποθηκεύεται
  const SAFETY = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
    .map(category => ({ category, threshold: 'BLOCK_LOW_AND_ABOVE' }));
  /* Τρόποι να ζητήσουμε λίγη σκέψη. Διαφορετικά μοντέλα δέχονται διαφορετικό τρόπο· κρατάμε όποιον δουλέψει. */
  const THINK = [{ thinkingLevel: 'low' }, { thinkingBudget: 0 }, null];
  let thinkIdx = 0;
  const stats = DB.ai_stats = { last: null, ms: 0, err: '' };

  function body(contents, max, sys) {
    const gc = { temperature: 0.9, maxOutputTokens: max };
    if (THINK[thinkIdx]) gc.thinkingConfig = THINK[thinkIdx];
    return JSON.stringify({ systemInstruction: { parts: [{ text: sys || systemPrompt() }] }, contents, safetySettings: SAFETY, generationConfig: gc });
  }
  /* Αν το μοντέλο είναι «πολυάσχολο» (503 / high demand) ή δεν υπάρχει, δοκιμάζει αυτόματα το επόμενο. */
  const FALLBACK = ['gemini-3.8-flash', 'gemini-3.8-flash-lite', 'gemini-3.6-flash', 'gemini-2.5-flash'];
  let goodModel = null; // το τελευταίο μοντέλο που απάντησε σωστά (για να μην ξαναχάνουμε χρόνο)
  const busyErr = (st, msg) => st === 503 || st === 500 || st === 529 || /high demand|overloaded|unavailable|try again later/i.test(msg);
  async function post(path, contents, max, signal, sys) {
    const chain = [...new Set([goodModel, S.model, ...FALLBACK].filter(Boolean))];
    let lastMsg = '';
    for (let mi = 0; mi < chain.length; mi++) {
      const model = chain[mi];
      for (let attempt = 0; attempt < 2; attempt++) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${path}`;
        const r = await fetch(url, { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': S.apiKey }, body: body(contents, max, sys) });
        if (r.ok) { goodModel = model; stats.model = model; return r; }
        const data = await r.json().catch(() => ({}));
        const msg = (data.error && data.error.message) || ('HTTP ' + r.status);
        lastMsg = msg;
        if (r.status === 400 && /think/i.test(msg) && thinkIdx < THINK.length - 1) { thinkIdx++; attempt--; continue; }
        if (r.status === 403) throw new Error('Το κλειδί απορρίφθηκε (403) – έλεγξε τον περιορισμό ιστοσελίδας. ' + msg);
        if (busyErr(r.status, msg)) { if (attempt === 0 && mi === 0) { await new Promise(z => setTimeout(z, 700)); continue; } break; } // πάμε στο επόμενο μοντέλο
        if (r.status === 404 || (r.status === 400 && /model/i.test(msg))) break;
        if (r.status === 429) { if (goodModel === model) goodModel = null; break; } // το όριο είναι ανά μοντέλο: δοκίμασε άλλο
        throw new Error(msg);
      }
    }
    throw new Error('Όλα τα μοντέλα Gemini είναι απασχολημένα ή εκτός ορίου τώρα. ' + lastMsg);
  }
  const partsText = c => ((c && c.content && c.content.parts) || []).filter(p => !p.thought).map(p => p.text || '').join('');

  /* απλή κλήση (για κάμερα και δοκιμή) */
  async function geminiCall(contents, max = 600, sys) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await post('generateContent', contents, max, ctl.signal, sys);
      const data = await r.json();
      const c = data.candidates && data.candidates[0];
      return partsText(c) || 'Ωπ, αυτό δεν μπορώ να το πω. Πάμε να παίξουμε κάτι άλλο;';
    } catch (e) { if (e.name === 'AbortError') throw new Error('Το Gemini άργησε πάνω από 20 δευτερόλεπτα.'); throw e; }
    finally { clearTimeout(t); }
  }

  /* κλήση με ροή: καλεί onSentence(πρόταση) για κάθε ολοκληρωμένη πρόταση */
  async function geminiStream(contents, onSentence) {
    const ctl = new AbortController(); let first = false;
    const t1 = setTimeout(() => { if (!first) ctl.abort(); }, 10000), t2 = setTimeout(() => ctl.abort(), 25000);
    const t0 = performance.now();
    let full = '', buf = '', sent = 0;
    const flush = (end) => {
      // βρίσκει ολοκληρωμένες προτάσεις, χωρίς να κόβει μέσα σε [ετικέτες] ή {αγγλικά}
      let depth = 0, cut = -1;
      for (let i = sent; i < full.length; i++) {
        const ch = full[i];
        if (ch === '[' || ch === '{') depth++; else if (ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
        else if (!depth && /[.!;?…\n]/.test(ch) && (i + 1 >= full.length ? end : /\s/.test(full[i + 1]))) cut = i + 1;
      }
      if (end) cut = full.length;
      if (cut > sent) { const s = clean(full.slice(sent, cut)); sent = cut; if (s && onSentence) onSentence(s); }
    };
    try {
      const r = await post('streamGenerateContent?alt=sse', contents, 600, ctl.signal);
      const rd = r.body.getReader(), dec = new TextDecoder();
      for (;;) {
        const { value, done } = await rd.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let k;
        while ((k = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, k).trim(); buf = buf.slice(k + 1);
          if (!line.startsWith('data:')) continue;
          try { const d = JSON.parse(line.slice(5)); const txt = partsText(d.candidates && d.candidates[0]); if (txt) { if (!first) { first = true; stats.ms = Math.round(performance.now() - t0); } full += txt; flush(false); } } catch (e) {}
        }
      }
      flush(true);
      stats.last = new Date().toLocaleTimeString('el-GR'); stats.err = '';
      return full || 'Ωπ, αυτό δεν μπορώ να το πω. Πάμε να παίξουμε κάτι άλλο;';
    } catch (e) {
      stats.err = e.name === 'AbortError' ? 'Το Gemini δεν απάντησε σε 10 δευτερόλεπτα.' : e.message;
      throw new Error(stats.err);
    } finally { clearTimeout(t1); clearTimeout(t2); }
  }
  function clean(s) {
    return s.replace(/\[ΘΥΜΗΣΟΥ:[^\]]*\]/gi, '').replace(/\[[A-Z_]{2,10}\]/g, '').replace(/https?:\/\/\S+/g, '').replace(/[*#_`>]/g, '').replace(/\s+/g, ' ').trim();
  }

  const gemini = {
    name: 'Google Gemini',
    ready: () => !!S.apiKey,
    async chat(text, onSentence) {
      history.push({ role: 'user', parts: [{ text }] });
      history = history.slice(-12);
      let out;
      try { out = await geminiStream(history, onSentence); }
      catch (e) { history.pop(); throw e; }
      const p = parse(out);
      p.streamed = !!onSentence;
      history.push({ role: 'model', parts: [{ text: p.text }] });
      return p;
    },
    async see(base64jpeg, prompt) {
      const out = await geminiCall([{ role: 'user', parts: [
        { inline_data: { mime_type: 'image/jpeg', data: base64jpeg } },
        { text: prompt || 'Τι είναι αυτό που σου δείχνω; Πες το πολύ απλά και με κέφι, σε 2 μικρές προτάσεις, και κάνε μια μικρή ερώτηση-παιχνίδι γι\' αυτό. Αν υπάρχει αγγλική λέξη που ταιριάζει, πες την μέσα σε {}.' }
      ] }]);
      const p = parse(out); p.raw = out; return p;
    },
    reset() { history = []; }
  };

  /* ---------- Πάροχος: χωρίς internet (έτοιμες απαντήσεις) ---------- */
  const offline = {
    name: 'Χωρίς internet',
    ready: () => true,
    async chat(text) {
      const t = text.toLowerCase();
      if (/γει[αά]|καλημέρα|χαίρετε/.test(t)) return { text: `Γεια σου ${S.childName}! Τι θες να παίξουμε;`, action: 'HELLO' };
      if (/αστεί|ανέκδοτ|γέλα/.test(t)) return { text: nextJoke(), action: 'HAPPY' };
      if (/αγγλικ|english/.test(t)) { const w = DB.content.WORDS[Math.floor(Math.random() * DB.content.WORDS.length)]; return { text: `Ξέρεις πώς λέγεται ${w[1]} στα αγγλικά; {${w[0]}}!`, action: 'THINK' }; }
      if (/ήξερες|πες μου κάτι|μάθε μου/.test(t)) { const f = DB.content.FACTS[Math.floor(Math.random() * DB.content.FACTS.length)]; return { text: 'Ήξερες ότι… ' + f[1], action: 'THINK' }; }
      if (/γρίφο|αίνιγμα/.test(t)) { const r = nextRiddle(); return { text: r[0] + ' Η λύση είναι… ' + r[1], action: 'SURPRISE' }; }
      if (/χόρε|χορ/.test(t)) return { text: 'Μουσική! Πάμε να χορέψουμε!', action: 'DANCE' };
      if (/μπάσκετ|καλάθι|περιστέρι|γσπ|σουτ/.test(t)) return { text: 'Μπάσκετ; Το αγαπημένο μου! Πάμε Περιστέρι! Κοίτα το κάρφωμά μου!', action: 'DUNK' };
      if (/πώς σε λένε|ποιος είσαι/.test(t)) return { text: 'Με λένε DimiBot και είμαι ο ρομποτικός σου φίλος!', action: 'HEART' };
      if (/νυστ|ύπνο|καληνύχτα/.test(t)) return { text: 'Ενεργοποιώ λειτουργία ύπνου… Καληνύχτα, συνεργάτη!', action: 'SLEEP' };
      return { text: 'Η κεραία μου δεν πιάνει internet τώρα. Θες ένα αστείο, έναν γρίφο ή να χορέψουμε;', action: 'HEAD' };
    },
    async see() { return { text: 'Χωρίς internet δεν βλέπω καλά. Πες μου εσύ τι είναι!', action: 'SURPRISE' }; },
    reset() {}
  };

  const PROVIDERS = { gemini, offline };
  function current() {
    const p = PROVIDERS[S.provider] || offline;
    return (S.aiOn && p.ready() && navigator.onLine !== false) ? p : offline;
  }
  function nextJoke() { return JOKES[jk++ % JOKES.length]; }
  function nextRiddle() { return RIDDLES[rd++ % RIDDLES.length]; }

  DB.ai = {
    PROVIDERS, current, nextJoke, nextRiddle, parse,
    async chat(text, onSentence) {
      const p = current();
      try { const r = await p.chat(text, onSentence); if (r.remember) M.propose(r.remember); return r; }
      catch (e) { console.warn('AI', e); DB.ai.lastError = e.message; const o = await offline.chat(text); o.failed = e.message; return o; }
    },
    async see(b64, prompt) {
      const p = current();
      try { return await p.see(b64, prompt); }
      catch (e) { DB.ai.lastError = e.message; return { text: 'Δεν κατάφερα να δω καλά. Δοκιμάζουμε ξανά;', action: 'HEAD' }; }
    },
    async test() { const t0 = performance.now(); const out = await geminiCall([{ role: 'user', parts: [{ text: 'Πες μόνο: Γεια σου!' }] }]); return parse(out).text + ` (${((performance.now() - t0) / 1000).toFixed(1)} δευτ., μοντέλο ${stats.model || S.model})`; },
    reset() { gemini.reset(); },
    /* συμπύκνωση πολλών σημειώσεων σε σύντομο «φάκελο» */
    async summarizeProfile(text) {
      if (current().name !== 'Google Gemini') throw new Error('Χρειάζεται σύνδεση με Gemini.');
      const out = await geminiCall([{ role: 'user', parts: [{ text: `Είσαι βοηθός γονιού. Παρακάτω είναι σημειώσεις για ένα παιδί περίπου 5,5 ετών (μπορεί να είναι χύμα, επαναλήψεις, ημερολόγιο). Φτιάξε έναν σύντομο, οργανωμένο «φάκελο» στα ελληνικά, έως 1500 χαρακτήρες, με κουκκίδες, στις ενότητες: Χαρακτήρας & διάθεση, Αγαπημένα & ενδιαφέροντα, Τι τον δυσκολεύει, Τι τον βοηθάει / πώς να του μιλάμε, Άνθρωποι & κατοικίδια, Ρουτίνες. Μην επινοείς τίποτα· γράψε μόνο ό,τι προκύπτει από τις σημειώσεις. Μη συμπεριλάβεις διευθύνσεις, τηλέφωνα ή ευαίσθητα ιατρικά στοιχεία.\n\nΣΗΜΕΙΩΣΕΙΣ:\n${String(text).slice(0, 30000)}` }] }], 2000, 'Είσαι προσεκτικός βοηθός γονιού που οργανώνει σημειώσεις. Γράφεις στα ελληνικά, καθαρά και σύντομα.');
      return out.trim();
    }
  };
})();
