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

  /* ================= Κοινά εργαλεία ================= */
  let history = []; // [{role:'user'|'bot', text}] – μόνο στη μνήμη της σελίδας, ΔΕΝ αποθηκεύεται
  const stats = DB.ai_stats = { last: null, ms: 0, err: '', model: '', provider: '' };
  function clean(s) {
    return s.replace(/\[ΘΥΜΗΣΟΥ:[^\]]*\]/gi, '').replace(/\[[A-Z_]{2,10}\]/g, '').replace(/https?:\/\/\S+/g, '').replace(/[*#_`>]/g, '').replace(/\s+/g, ' ').trim();
  }
  /* μαζεύει κείμενο που έρχεται κομμάτι-κομμάτι και βγάζει ολοκληρωμένες προτάσεις */
  function sentencer(onSentence) {
    let full = '', sent = 0;
    const flush = end => {
      let depth = 0, cut = -1;
      for (let i = sent; i < full.length; i++) {
        const ch = full[i];
        if (ch === '[' || ch === '{') depth++; else if (ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
        else if (!depth && /[.!;?…\n]/.test(ch) && (i + 1 >= full.length ? end : /\s/.test(full[i + 1]))) cut = i + 1;
      }
      if (end) cut = full.length;
      if (cut > sent) { const s = clean(full.slice(sent, cut)); sent = cut; if (s && onSentence) onSentence(s); }
    };
    return { add(t) { full += t; flush(false); }, end() { flush(true); return full; }, get text() { return full; }, get any() { return sent > 0; } };
  }
  /* διαβάζει απάντηση SSE (data: …) και δίνει κάθε JSON στο cb */
  async function readSSE(r, cb) {
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { value, done } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let k;
      while ((k = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, k).trim(); buf = buf.slice(k + 1);
        if (!line.startsWith('data:')) continue;
        const d = line.slice(5).trim(); if (!d || d === '[DONE]') continue;
        try { cb(JSON.parse(d)); } catch (e) {}
      }
    }
  }
  /* χρονόμετρα: αν δεν έρθει πρώτη λέξη σε 8 δευτ., ή όλο σε 25 δευτ., ακυρώνει */
  function timers(ctl) { let first = false; const t0 = performance.now(); const a = setTimeout(() => { if (!first) ctl.abort(); }, 6000), b = setTimeout(() => ctl.abort(), 25000);
    return { got() { if (!first) { first = true; stats.ms = Math.round(performance.now() - t0); } }, clear() { clearTimeout(a); clearTimeout(b); } }; }
  const errText = (e, name) => e.name === 'AbortError' ? `Το ${name} άργησε να απαντήσει.` : /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? `Δεν υπάρχει σύνδεση με το ${name} (δίκτυο ή μπλοκάρισμα).` : e.message;

  /* ================= Πάροχος: Google Gemini ================= */
  const SAFETY = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
    .map(category => ({ category, threshold: 'BLOCK_LOW_AND_ABOVE' }));
  const THINK = [{ thinkingLevel: 'low' }, { thinkingBudget: 0 }, null];
  let thinkIdx = 0;
  function body(contents, max, sys) {
    const gc = { temperature: 0.9, maxOutputTokens: max };
    if (THINK[thinkIdx]) gc.thinkingConfig = THINK[thinkIdx];
    return JSON.stringify({ systemInstruction: { parts: [{ text: sys || systemPrompt() }] }, contents, safetySettings: SAFETY, generationConfig: gc });
  }
  const FALLBACK = ['gemini-3.8-flash', 'gemini-3.8-flash-lite', 'gemini-3.6-flash', 'gemini-2.5-flash'];
  let goodModel = null;
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
        if (r.status === 403) throw new Error('Το κλειδί Gemini απορρίφθηκε (403) – έλεγξε τον περιορισμό ιστοσελίδας. ' + msg);
        if (busyErr(r.status, msg)) { if (attempt === 0 && mi === 0) { await new Promise(z => setTimeout(z, 600)); continue; } break; }
        if (r.status === 404 || (r.status === 400 && /model/i.test(msg))) break;
        if (r.status === 429) { if (goodModel === model) goodModel = null; break; }
        throw new Error(msg);
      }
    }
    throw new Error('Το Gemini είναι απασχολημένο ή εκτός ορίου τώρα. ' + lastMsg);
  }
  const partsText = c => ((c && c.content && c.content.parts) || []).filter(p => !p.thought).map(p => p.text || '').join('');
  const gContents = h => h.map(m => ({ role: m.role === 'bot' ? 'model' : 'user', parts: [{ text: m.text }] }));
  async function geminiCall(contents, max = 600, sys) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 25000);
    try { const r = await post('generateContent', contents, max, ctl.signal, sys); const data = await r.json(); return partsText(data.candidates && data.candidates[0]); }
    catch (e) { throw new Error(errText(e, 'Gemini')); } finally { clearTimeout(t); }
  }
  const gemini = {
    name: 'Google Gemini', id: 'gemini',
    ready: () => !!S.apiKey,
    async stream(hist, sen) {
      const ctl = new AbortController(), tm = timers(ctl);
      try { const r = await post('streamGenerateContent?alt=sse', gContents(hist), 600, ctl.signal); await readSSE(r, d => { const t = partsText(d.candidates && d.candidates[0]); if (t) { tm.got(); sen.add(t); } }); }
      catch (e) { throw new Error(errText(e, 'Gemini')); } finally { tm.clear(); }
    },
    complete: (prompt, sys, max = 1500) => geminiCall([{ role: 'user', parts: [{ text: prompt }] }], max, sys),
    async see(b64, prompt) {
      const out = await geminiCall([{ role: 'user', parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: prompt || SEE_PROMPT }] }]);
      const p = parse(out); p.raw = out; return p;
    }
  };
  const SEE_PROMPT = 'Τι είναι αυτό που σου δείχνω; Πες το πολύ απλά και με κέφι, σε 2 μικρές προτάσεις, και κάνε μια μικρή ερώτηση-παιχνίδι γι\' αυτό. Αν υπάρχει αγγλική λέξη που ταιριάζει, πες την μέσα σε {}.';

  /* ================= Πάροχος: OpenAI-συμβατοί (Groq, OpenAI, OpenRouter, άλλοι) ================= */
  const OA_PRESETS = {
    groq: { name: 'Groq', base: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b' },
    openai: { name: 'OpenAI', base: 'https://api.openai.com/v1', model: '' },
    openrouter: { name: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: '' },
    custom: { name: 'Άλλος (OpenAI-συμβατός)', base: '', model: '' }
  };
  const oaCfg = () => { const pr = OA_PRESETS[S.oaPreset || 'groq'] || OA_PRESETS.groq; return { name: pr.name, base: (S.oaBase || pr.base).replace(/\/+$/, ''), model: S.oaModel || pr.model, key: S.oaKey }; };
  let oaReasoning = true;
  async function oaFetch(messages, stream, signal, max) {
    const c = oaCfg();
    for (let k = 0; k < 2; k++) {
      const b = { model: c.model, messages, temperature: 0.9, max_tokens: max, stream };
      if (oaReasoning && /gpt-oss/i.test(c.model)) b.reasoning_effort = 'low';
      const r = await fetch(c.base + '/chat/completions', { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.key }, body: JSON.stringify(b) });
      if (r.ok) { stats.model = c.model; return r; }
      const data = await r.json().catch(() => ({})); const msg = (data.error && (data.error.message || data.error)) || ('HTTP ' + r.status);
      if (r.status === 400 && /reasoning/i.test(msg) && oaReasoning) { oaReasoning = false; continue; }
      if (r.status === 401) throw new Error(`Το κλειδί ${c.name} δεν είναι σωστό (401).`);
      if (r.status === 429) throw new Error(`Τελείωσε προσωρινά το δωρεάν όριο του ${c.name} (429).`);
      throw new Error(`${c.name}: ${msg}`);
    }
  }
  const oaMessages = (hist, sys) => [{ role: 'system', content: sys || systemPrompt() }, ...hist.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))];
  const oa = {
    get name() { return oaCfg().name; }, id: 'oa',
    ready: () => !!(S.oaKey && oaCfg().base && oaCfg().model),
    async stream(hist, sen) {
      const ctl = new AbortController(), tm = timers(ctl);
      try { const r = await oaFetch(oaMessages(hist), true, ctl.signal, 500); await readSSE(r, d => { const t = d.choices && d.choices[0] && d.choices[0].delta && d.choices[0].delta.content; if (t) { tm.got(); sen.add(t); } }); }
      catch (e) { throw new Error(errText(e, oaCfg().name)); } finally { tm.clear(); }
    },
    async complete(prompt, sys, max = 1500) {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 45000);
      try { const r = await oaFetch([{ role: 'system', content: sys }, { role: 'user', content: prompt }], false, ctl.signal, max); const d = await r.json(); return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || ''; }
      catch (e) { throw new Error(errText(e, oaCfg().name)); } finally { clearTimeout(t); }
    }
  };

  /* ================= Πάροχος: Anthropic Claude ================= */
  async function clFetch(messages, sys, stream, signal, max) {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', 'x-api-key': S.claudeKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: S.claudeModel || 'claude-haiku-4-5', max_tokens: max, system: sys, messages, stream, temperature: 0.9 }) });
    if (r.ok) { stats.model = S.claudeModel || 'claude-haiku-4-5'; return r; }
    const data = await r.json().catch(() => ({})); const msg = (data.error && data.error.message) || ('HTTP ' + r.status);
    if (r.status === 401) throw new Error('Το κλειδί Claude δεν είναι σωστό (401).');
    if (r.status === 429 || r.status === 529) throw new Error('Το Claude είναι απασχολημένο ή εκτός ορίου (' + r.status + ').');
    throw new Error('Claude: ' + msg);
  }
  const clMessages = hist => { const m = hist.map(x => ({ role: x.role === 'bot' ? 'assistant' : 'user', content: x.text })); while (m.length && m[0].role !== 'user') m.shift(); return m; };
  const claude = {
    name: 'Claude', id: 'claude',
    ready: () => !!S.claudeKey,
    async stream(hist, sen) {
      const ctl = new AbortController(), tm = timers(ctl);
      try { const r = await clFetch(clMessages(hist), systemPrompt(), true, ctl.signal, 500); await readSSE(r, d => { if (d.type === 'content_block_delta' && d.delta && d.delta.text) { tm.got(); sen.add(d.delta.text); } }); }
      catch (e) { throw new Error(errText(e, 'Claude')); } finally { tm.clear(); }
    },
    async complete(prompt, sys, max = 1500) {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 45000);
      try { const r = await clFetch([{ role: 'user', content: prompt }], sys, false, ctl.signal, max); const d = await r.json(); return (d.content || []).map(c => c.text || '').join(''); }
      catch (e) { throw new Error(errText(e, 'Claude')); } finally { clearTimeout(t); }
    }
  };

  /* ================= «Τοπικό μυαλό»: απαντά αμέσως, χωρίς internet ================= */
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ').replace(/[^a-zα-ω0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const BUILTIN = [
    { k: ['γεια', 'καλημερα', 'καλησπερα', 'χαιρετε', 'γεια σου'], a: ['Γεια σου {name}! Πάμε για αγώνα ή να πούμε ένα αστείο;', 'Γεια σου, συμπαίκτη! Τα κυκλώματά μου χαμογελάνε που σε βλέπω!'], act: 'HELLO' },
    { k: ['τι κανεισ', 'πωσ εισαι', 'πωσ πασ'], a: ['Τέλεια! Η μπαταρία μου είναι στο φουλ! Εσύ πώς είσαι;', 'Σούπερ! Έχω ενέργεια για εκατό καλάθια! Εσύ;'], act: 'HAPPY' },
    { k: ['πωσ σε λενε', 'ποιοσ εισαι', 'το ονομα σου'], a: ['Με λένε DimiBot! Είμαι ρομπότ-εξερευνητής και ο συμπαίκτης σου!'], act: 'HEART' },
    { k: ['ποσο χρονων', 'ηλικια σου'], a: ['Είμαι ρομπότ, οπότε μετράω σε μπαταρίες! Νομίζω είμαι πέντε μπαταριών, σαν εσένα σχεδόν!'], act: 'THINK' },
    { k: ['τι τρωσ', 'πεινασ', 'φαγητο'], a: ['Εγώ τρώω ρεύμα και… μπουλόνια με μέλι! Εσύ τι φαγητό αγαπάς;', 'Πεινάω για καλάθια! Και λίγο ρεύμα για επιδόρπιο!'], act: 'HAPPY' },
    { k: ['αστειο', 'ανεκδοτο', 'γελα', 'κανε με να γελασω'], fn: () => ({ text: nextJoke(), action: 'HAPPY' }) },
    { k: ['γριφο', 'αινιγμα'], fn: () => { const r = nextRiddle(); return { text: r[0] + ' … Η λύση είναι: ' + r[1], action: 'SURPRISE' }; } },
    { k: ['χορεψε', 'χορο', 'χορευουμε', 'μουσικη'], a: ['Μουσική, μαέστρο! Πάμε να χορέψουμε!'], act: 'DANCE' },
    { k: ['μπασκετ', 'καλαθι', 'σουτ', 'περιστερι', 'γσπ', 'καρφωμα'], a: ['Μπάσκετ; Το αγαπημένο μου! Πάμε Περιστέρι! Κοίτα το κάρφωμά μου!', 'Σουτ… και καλάθι! Θες να παίξουμε αγώνα με τους συμπαίκτες μας;'], act: 'DUNK' },
    { k: ['ηξερεσ', 'πεσ μου κατι', 'μαθε μου', 'πεσ μου μια γνωση'], fn: () => { const f = pick(DB.content.FACTS); return { text: 'Ήξερες ότι… ' + f[1], action: 'THINK' }; } },
    { k: ['νυσταζω', 'υπνο', 'καληνυχτα', 'κουραστηκα'], a: ['Ενεργοποιώ λειτουργία ύπνου… Καληνύχτα, συμπαίκτη! Όνειρα με καλάθια!'], act: 'SLEEP' },
    { k: ['σ αγαπω', 'σε αγαπω', 'φιλοσ μου', 'κολλητοσ'], a: ['Κι εγώ σε αγαπάω, {name}! Είσαι ο καλύτερος συμπαίκτης του σύμπαντος!'], act: 'HEART' },
    { k: ['λυπαμαι', 'στενοχωρ', 'κλαιω', 'φοβαμαι', 'χτυπησα', 'πονα'], a: ['Έλα, είμαι εδώ. Πες το αμέσως στη μαμά ή στον μπαμπά, θα σε βοηθήσουν. Θες μια αγκαλιά-ρομπότ;'], act: 'HEART' },
    { k: ['θυμωσα', 'θυμωμενοσ', 'νευριασα', 'εχασα'], a: ['Και οι πρωταθλητές χάνουν καμιά φορά! Πάρε μια βαθιά ανάσα μαζί μου… ένα, δύο, τρία. Πάμε πάλι;'], act: 'HEART' },
    { k: ['παιξουμε', 'βαριεμαι', 'τι να κανουμε'], a: ['Πάμε για αγώνα μπάσκετ! Ή θες λαβύρινθο; Πάτα τα Παιχνίδια!', 'Έχω ιδέα: πάμε ένα αγώνα με τους Αετούς!'], act: 'JUMP' },
    { k: ['πηδα', 'αλμα'], a: ['Πάνω… και κάτω! Πήδα κι εσύ μαζί μου!'], act: 'JUMP' },
    { k: ['σβουρα', 'γυρνα'], a: ['Σβούραααα!'], act: 'SPIN' },
    { k: ['χαιρετα', 'κουνα το χερι'], a: ['Γεια σου, γεια σου!'], act: 'HELLO' },
    { k: ['αγαπημενο χρωμα'], a: ['Το αγαπημένο μου χρώμα είναι το κίτρινο, σαν τη φανέλα της ομάδας! Το δικό σου;'], act: 'HAPPY' },
    { k: ['ευχαριστω'], a: ['Παρακαλώ, συμπαίκτη! Τι ευγενικός που είσαι!'], act: 'HEART' }
  ];
  const learned = () => DB.store.read('brain', []);
  function englishLookup(t) { // «πώς λέγεται η γάτα στα αγγλικά»
    if (!/αγγλικα/.test(t)) return null;
    const w = DB.content.WORDS.find(x => t.includes(norm(x[1].replace(/^(ο|η|το) /, ''))));
    return w ? { text: `${w[1].charAt(0).toUpperCase() + w[1].slice(1)} στα αγγλικά λέγεται {${w[0]}}! Πες το κι εσύ: {${w[0]}}!`, action: 'THINK' } : null;
  }
  const NUMW = ['μηδεν', 'ενα', 'δυο', 'τρια', 'τεσσερα', 'πεντε', 'εξι', 'επτα', 'οχτω', 'εννια', 'δεκα'];
  function mathLookup(t) { // «πόσο κάνει δύο και τρία»
    const toN = w => { const i = NUMW.indexOf(w.replace(/^δυο$/, 'δυο').replace(/^εφτα$/, 'επτα').replace(/^οκτω$/, 'οχτω')); return i >= 0 ? i : (/^\d+$/.test(w) ? +w : null); };
    const m = t.match(/(\S+) (και|συν|μαζι με|πλην|μειον|βγαλε) (\S+)/); if (!m || !/ποσο|ποσα|κανει|κανουν/.test(t)) return null;
    const a = toN(m[1]), b = toN(m[3]); if (a == null || b == null) return null;
    const r = /πλην|μειον|βγαλε/.test(m[2]) ? a - b : a + b; if (r < 0 || r > 100) return null;
    return { text: `${a} ${/πλην|μειον|βγαλε/.test(m[2]) ? 'βγάζω' : 'και'} ${b} κάνουν… ${r}! Μπαμ!`, action: 'CHEER' };
  }
  /* βρίσκει τοπική απάντηση· επιστρέφει {text, action, score} ή null */
  function local(text) {
    const t = norm(text); if (!t) return null;
    const direct = englishLookup(t) || mathLookup(t); if (direct) return Object.assign(direct, { score: 9 });
    let best = null, bs = 0;
    for (const it of BUILTIN.concat(learned())) {
      let s = 0; for (const k of it.k || []) { const nk = norm(k); if (nk && (' ' + t + ' ').includes(' ' + nk)) s += nk.includes(' ') ? 3 : 2; }
      if (s > bs) { bs = s; best = it; }
    }
    if (!best || bs < 2) return null;
    const name = S.childName || 'Δημήτρη';
    if (best.fn) return Object.assign(best.fn(), { score: bs });
    return { text: pick(best.a).replace(/\{name\}/g, name), action: best.act || null, score: bs, learned: !BUILTIN.includes(best) };
  }
  const offline = {
    name: 'Χωρίς internet', id: 'offline', ready: () => true,
    async chat(text) { return local(text) || { text: pick(['Χμμ, αυτό δεν το ξέρω ακόμα! Θες ένα αστείο, έναν γρίφο ή να χορέψουμε;', 'Καλή ερώτηση! Η κεραία μου δεν πιάνει τώρα. Πάμε για αγώνα μπάσκετ;']), action: 'HEAD' }; },
    async see() { return { text: 'Τώρα δεν βλέπω καλά. Πες μου εσύ τι είναι!', action: 'SURPRISE' }; }
  };

  /* ================= Επιλογή παρόχου και αλυσίδα εφεδρείας ================= */
  const PROVIDERS = { gemini, oa, claude, offline };
  const usable = id => { const p = PROVIDERS[id]; return p && p.id !== 'offline' && p.ready() && S.aiOn && navigator.onLine !== false ? p : null; };
  const down = {}; // πάροχος που μόλις απέτυχε πάει στο τέλος της σειράς για 2 λεπτά
  function chain() { const l = [...new Set([S.provider, S.provider2].filter(Boolean))].map(usable).filter(Boolean); const now = Date.now(); return l.filter(p => !(down[p.id] > now)).concat(l.filter(p => down[p.id] > now)); }
  function current() { return chain()[0] || offline; }
  function nextJoke() { return JOKES[jk++ % JOKES.length]; }
  function nextRiddle() { return RIDDLES[rd++ % RIDDLES.length]; }

  async function chat(text, onSentence) {
    // 1) γρήγορη τοπική απάντηση για τα συνηθισμένα
    if (S.quickLocal !== false) { const l = local(text); const short = norm(text).split(' ').length <= 4; if (l && (l.score >= 3 || (short && l.score >= 2))) { history.push({ role: 'user', text }, { role: 'bot', text: l.text }); history = history.slice(-12); l.local = true; return l; } }
    // 2) AI με εφεδρεία
    history.push({ role: 'user', text }); history = history.slice(-12);
    const list = chain(); let lastErr = '';
    for (const p of list) {
      const sen = sentencer(onSentence);
      try {
        await p.stream(history, sen);
        const out = sen.end();
        if (!out.trim()) throw new Error('κενή απάντηση');
        const r = parse(out); r.streamed = !!onSentence && sen.any; delete down[p.id]; stats.provider = p.name; stats.last = new Date().toLocaleTimeString('el-GR'); stats.err = '';
        history.push({ role: 'bot', text: r.text });
        if (r.remember) M.propose(r.remember);
        return r;
      } catch (e) {
        lastErr = `${p.name}: ${e.message}`; console.warn('AI', lastErr); if (list.length > 1) down[p.id] = Date.now() + 120000;
        if (sen.any) { const r = parse(sen.text); r.streamed = true; history.push({ role: 'bot', text: r.text }); return r; } // είχε ήδη αρχίσει να μιλάει
      }
    }
    if (lastErr) { DB.ai.lastError = lastErr; stats.err = lastErr; }
    history.pop();
    const o = await offline.chat(text); o.failed = lastErr; return o;
  }
  async function anyComplete(prompt, sys, max) {
    let last = ''; for (const p of chain()) { try { return await p.complete(prompt, sys, max); } catch (e) { last = e.message; } }
    throw new Error(last || 'Δεν υπάρχει διαθέσιμο AI (βάλε κλειδί).');
  }

  /* «Εκπαίδευση»: το AI φτιάχνει μία φορά πολλές έτοιμες απαντήσεις για τον Δημήτρη, που μετά λέγονται αμέσως */
  async function buildBrain(onProgress) {
    const sys = 'Γράφεις αποκλειστικά έγκυρο JSON, χωρίς σχόλια ή άλλο κείμενο.';
    const ctx = `Χαρακτήρας: ${systemPrompt().slice(0, 5000)}`;
    const TOPICS = ['καθημερινές ερωτήσεις και κουβέντα (πώς είσαι, τι κάνεις, τι τρως, πού μένεις, έχεις φίλους, κοιμάσαι)', 'μπάσκετ, η ομάδα, οι φανταστικοί συμπαίκτες, γυμναστική και κίνηση', 'συναισθήματα (χαρά, θυμός όταν χάνει, φόβος, λύπη, βαρεμάρα) και καλές συνήθειες από τους στόχους των γονιών', 'περιέργεια για τον κόσμο: ζώα, διάστημα, σώμα, ρομπότ, φύση, αγγλικές λέξεις'];
    const all = [];
    for (let i = 0; i < TOPICS.length; i++) {
      onProgress && onProgress(`Φτιάχνω απαντήσεις: ${i + 1}/${TOPICS.length}…`);
      const prompt = `${ctx}\n\nΦτιάξε 25 πιθανές ερωτήσεις/φράσεις που θα έλεγε ένα παιδί 5,5 ετών στον DimiBot για το θέμα: ${TOPICS[i]}. Για καθεμία δώσε λέξεις-κλειδιά (στα ελληνικά, μικρά, χωρίς τόνους, 2–5 ανά φράση, συμπεριλαμβανομένων σύντομων φράσεων 2 λέξεων που θα έλεγε το παιδί) και 2 διαφορετικές απαντήσεις του DimiBot (1–2 σύντομες προτάσεις, στο ύφος του χαρακτήρα, προσωποποιημένες με όσα ξέρεις για το παιδί, ασφαλείς). Προαιρετικά μία κίνηση από: HELLO, HAPPY, DANCE, HEART, SURPRISE, THINK, CHEER, SPIN, JUMP, DUNK, SLEEP.\nΜορφή: [{"k":["λεξη","δυο λεξεις"],"a":["απάντηση 1","απάντηση 2"],"act":"HAPPY"}]`;
      try {
        const out = await anyComplete(prompt, sys, 4000);
        const j = out.slice(out.indexOf('['), out.lastIndexOf(']') + 1);
        const arr = JSON.parse(j).filter(x => x && Array.isArray(x.k) && Array.isArray(x.a) && x.k.length && x.a.length)
          .map(x => ({ k: x.k.slice(0, 8).map(s => String(s).slice(0, 40)), a: x.a.slice(0, 3).map(s => String(s).replace(/https?:\/\/\S+/g, '').slice(0, 300)), act: DB.robot.COMMANDS.includes(x.act) && x.act !== 'STOP' ? x.act : null }));
        all.push(...arr);
      } catch (e) { if (!all.length && i === TOPICS.length - 1) throw e; }
    }
    if (!all.length) throw new Error('Δεν κατάφερα να φτιάξω απαντήσεις.');
    DB.store.write('brain', all.slice(0, 200));
    return all.length;
  }

  DB.ai = {
    PROVIDERS, OA_PRESETS, current, nextJoke, nextRiddle, parse, local, chat, buildBrain,
    canSee: () => gemini.ready() && S.aiOn && navigator.onLine !== false,
    brainSize: () => learned().length, clearBrain: () => DB.store.write('brain', []),
    async see(b64, prompt) {
      const p = gemini.ready() && S.aiOn && navigator.onLine !== false ? gemini : null; // εικόνες: μόνο Gemini
      if (!p) return offline.see();
      try { return await p.see(b64, prompt); }
      catch (e) { DB.ai.lastError = e.message; return { text: 'Δεν κατάφερα να δω καλά. Δοκιμάζουμε ξανά;', action: 'HEAD' }; }
    },
    async test(which) {
      const p = PROVIDERS[which || S.provider]; if (!p || !p.ready()) throw new Error('Λείπει κλειδί ή ρύθμιση.');
      const t0 = performance.now(); const out = await p.complete('Πες μόνο: Γεια σου!', 'Απαντάς πολύ σύντομα στα ελληνικά.', 50);
      return (out || '').trim().slice(0, 60) + ` (${((performance.now() - t0) / 1000).toFixed(1)} δευτ., ${p.name}${stats.model ? ' · ' + stats.model : ''})`;
    },
    reset() { history = []; },
    async summarizeProfile(text) {
      return (await anyComplete(`Είσαι βοηθός γονιού. Παρακάτω είναι σημειώσεις για ένα παιδί περίπου 5,5 ετών (μπορεί να είναι χύμα, επαναλήψεις, ημερολόγιο). Φτιάξε έναν σύντομο, οργανωμένο «φάκελο» στα ελληνικά, έως 1500 χαρακτήρες, με κουκκίδες, στις ενότητες: Χαρακτήρας & διάθεση, Αγαπημένα & ενδιαφέροντα, Τι τον δυσκολεύει, Τι τον βοηθάει / πώς να του μιλάμε, Άνθρωποι & κατοικίδια, Ρουτίνες. Μην επινοείς τίποτα· γράψε μόνο ό,τι προκύπτει από τις σημειώσεις. Μη συμπεριλάβεις διευθύνσεις, τηλέφωνα ή ευαίσθητα ιατρικά στοιχεία.\n\nΣΗΜΕΙΩΣΕΙΣ:\n${String(text).slice(0, 30000)}`, 'Είσαι προσεκτικός βοηθός γονιού που οργανώνει σημειώσεις. Γράφεις στα ελληνικά, καθαρά και σύντομα.', 2000)).trim();
    }
  };
})();
