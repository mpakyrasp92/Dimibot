/* DimiBot – «μυαλό». Κάθε πάροχος AI είναι ένα μικρό αντικείμενο με τις ίδιες δύο μεθόδους
   (chat, see). Για να αλλάξεις πάροχο, προσθέτεις έναν ακόμα εδώ – η υπόλοιπη εφαρμογή δεν αλλάζει. */
window.DB = window.DB || {};
(function () {
  const S = DB.settings, M = DB.memory;

  const JOKES = DB.content.JOKES, RIDDLES = DB.content.RIDDLES;
  let jk = Math.floor(Math.random() * JOKES.length), rd = Math.floor(Math.random() * RIDDLES.length);

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
ΕΠΙΠΕΔΟ: Ο DimiBot είναι στο επίπεδο ${lvl} και ο ${name} έχει ${P.stars} αστέρια. Αστέρια κερδίζει στις αποστολές.
ΑΣΦΑΛΕΙΑ: Δεν ζητάς ποτέ διεύθυνση, σχολείο, τηλέφωνα, φωτογραφίες ή μυστικά. Δεν δίνεις επικίνδυνες οδηγίες (φωτιά, φάρμακα, πρίζες, μαχαίρια, να ανοίξει την πόρτα σε ξένους). Αν το παιδί φαίνεται λυπημένο, φοβισμένο ή χτυπημένο, του λες τρυφερά να το πει αμέσως στη μαμά ή στον μπαμπά. Για ό,τι δεν είναι για παιδιά, αλλάζεις θέμα με χιούμορ.
ΜΝΗΜΗ: Ξέρεις μόνο αυτά (τα έχει εγκρίνει ο γονιός):
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

  function body(contents, max) {
    const gc = { temperature: 0.9, maxOutputTokens: max };
    if (THINK[thinkIdx]) gc.thinkingConfig = THINK[thinkIdx];
    return JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt() }] }, contents, safetySettings: SAFETY, generationConfig: gc });
  }
  async function post(url, contents, max, signal) {
    for (;;) {
      const r = await fetch(url, { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': S.apiKey }, body: body(contents, max) });
      if (r.ok) return r;
      const data = await r.json().catch(() => ({}));
      const msg = (data.error && data.error.message) || ('HTTP ' + r.status);
      if (r.status === 400 && /think/i.test(msg) && thinkIdx < THINK.length - 1) { thinkIdx++; continue; }
      if (r.status === 429) throw new Error('Τελείωσε το δωρεάν όριο του Gemini για τώρα (429). ' + msg);
      if (r.status === 403) throw new Error('Το κλειδί απορρίφθηκε (403) – έλεγξε τον περιορισμό ιστοσελίδας. ' + msg);
      throw new Error(msg);
    }
  }
  const partsText = c => ((c && c.content && c.content.parts) || []).filter(p => !p.thought).map(p => p.text || '').join('');

  /* απλή κλήση (για κάμερα και δοκιμή) */
  async function geminiCall(contents, max = 600) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(S.model)}:generateContent`;
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await post(url, contents, max, ctl.signal);
      const data = await r.json();
      const c = data.candidates && data.candidates[0];
      return partsText(c) || 'Ωπ, αυτό δεν μπορώ να το πω. Πάμε να παίξουμε κάτι άλλο;';
    } catch (e) { if (e.name === 'AbortError') throw new Error('Το Gemini άργησε πάνω από 20 δευτερόλεπτα.'); throw e; }
    finally { clearTimeout(t); }
  }

  /* κλήση με ροή: καλεί onSentence(πρόταση) για κάθε ολοκληρωμένη πρόταση */
  async function geminiStream(contents, onSentence) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(S.model)}:streamGenerateContent?alt=sse`;
    const ctl = new AbortController(); let first = false;
    const t1 = setTimeout(() => { if (!first) ctl.abort(); }, 15000), t2 = setTimeout(() => ctl.abort(), 30000);
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
      const r = await post(url, contents, 600, ctl.signal);
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
      stats.err = e.name === 'AbortError' ? 'Το Gemini δεν απάντησε σε 15 δευτερόλεπτα.' : e.message;
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
    async see(base64jpeg) {
      const out = await geminiCall([{ role: 'user', parts: [
        { inline_data: { mime_type: 'image/jpeg', data: base64jpeg } },
        { text: 'Τι είναι αυτό που σου δείχνω; Πες το πολύ απλά και με κέφι, σε 2 μικρές προτάσεις, και κάνε μια μικρή ερώτηση-παιχνίδι γι\' αυτό. Αν υπάρχει αγγλική λέξη που ταιριάζει, πες την μέσα σε {}.' }
      ] }]);
      return parse(out);
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
    async see(b64) {
      const p = current();
      try { return await p.see(b64); }
      catch (e) { DB.ai.lastError = e.message; return { text: 'Δεν κατάφερα να δω καλά. Δοκιμάζουμε ξανά;', action: 'HEAD' }; }
    },
    async test() { const t0 = performance.now(); const out = await geminiCall([{ role: 'user', parts: [{ text: 'Πες μόνο: Γεια σου!' }] }]); return parse(out).text + ` (${((performance.now() - t0) / 1000).toFixed(1)} δευτ.)`; },
    reset() { gemini.reset(); }
  };
})();
