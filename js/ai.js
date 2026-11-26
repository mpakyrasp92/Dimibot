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
ΤΡΟΠΟΣ: 1 έως 3 σύντομες προτάσεις. Το πολύ μία ερώτηση κάθε φορά. Όχι emoji, όχι λίστες, όχι συνδέσμους, όχι αριθμούς τηλεφώνων.
ΜΑΘΗΣΗ: Όπου ταιριάζει, βάζεις κάτι μικρό να μάθει: ένα γράμμα, ένα μέτρημα, μια αγγλική λέξη, ένα «ήξερες ότι». Τα αγγλικά που έχει μάθει μέχρι τώρα: ${words}. Μπορείς να τα ρωτάς για επανάληψη. Ενθαρρύνεις καλές συνήθειες (δόντια, πλύσιμο χεριών, τάξη, ύπνος) με χιούμορ, χωρίς κήρυγμα.
ΕΠΙΠΕΔΟ: Ο DimiBot είναι στο επίπεδο ${lvl} και ο ${name} έχει ${P.stars} αστέρια. Αστέρια κερδίζει στις αποστολές.
ΑΣΦΑΛΕΙΑ: Δεν ζητάς ποτέ διεύθυνση, σχολείο, τηλέφωνα, φωτογραφίες ή μυστικά. Δεν δίνεις επικίνδυνες οδηγίες (φωτιά, φάρμακα, πρίζες, μαχαίρια, να ανοίξει την πόρτα σε ξένους). Αν το παιδί φαίνεται λυπημένο, φοβισμένο ή χτυπημένο, του λες τρυφερά να το πει αμέσως στη μαμά ή στον μπαμπά. Για ό,τι δεν είναι για παιδιά, αλλάζεις θέμα με χιούμορ.
ΜΝΗΜΗ: Ξέρεις μόνο αυτά (τα έχει εγκρίνει ο γονιός):
${facts}
Δεν επινοείς αναμνήσεις. Αν το παιδί σού πει κάτι καινούργιο και ωραίο για τον εαυτό του (π.χ. αγαπημένο ζώο ή παιχνίδι), στο τέλος γράψε [ΘΥΜΗΣΟΥ: σύντομη φράση]. Ο γονιός θα αποφασίσει αν θα το κρατήσεις.
ΚΙΝΗΣΕΙΣ: Μπορείς να κάνεις ΜΙΑ κίνηση γράφοντας στο τέλος ακριβώς ένα από: [HELLO] [WAVE_R] [WAVE_L] [HEAD] [DANCE] [HAPPY] [HEART] [SURPRISE] [SLEEP] [THINK] [CHEER] [SPIN] [JUMP]. Μόνο αυτά υπάρχουν.`;
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

  /* ---------- Πάροχος: Google Gemini ---------- */
  let history = []; // μόνο στη μνήμη της σελίδας, ΔΕΝ αποθηκεύεται
  const SAFETY = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
    .map(category => ({ category, threshold: 'BLOCK_LOW_AND_ABOVE' }));
  async function geminiCall(contents) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(S.model)}:generateContent`;
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(url, {
        method: 'POST', signal: ctl.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': S.apiKey },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt() }] }, contents, safetySettings: SAFETY, generationConfig: { temperature: 0.9, maxOutputTokens: 1024 } })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + r.status));
      const c = data.candidates && data.candidates[0];
      if (!c || !c.content) return 'Ωπ, αυτό δεν μπορώ να το πω. Πάμε να παίξουμε κάτι άλλο;';
      return (c.content.parts || []).map(p => p.text || '').join('');
    } finally { clearTimeout(t); }
  }
  const gemini = {
    name: 'Google Gemini',
    ready: () => !!S.apiKey,
    async chat(text) {
      history.push({ role: 'user', parts: [{ text }] });
      history = history.slice(-12);
      const out = await geminiCall(history);
      const p = parse(out);
      history.push({ role: 'model', parts: [{ text: p.text }] });
      return p;
    },
    async see(base64jpeg) {
      const out = await geminiCall([{ role: 'user', parts: [
        { inline_data: { mime_type: 'image/jpeg', data: base64jpeg } },
        { text: 'Τι είναι αυτό που σου δείχνω; Πες το πολύ απλά, με χαρά, και κάνε μια μικρή ερώτηση-παιχνίδι γι\' αυτό (π.χ. χρώμα, μέτρημα, ήχος ζώου).' }] }]);
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
    async chat(text) {
      const p = current();
      try { const r = await p.chat(text); if (r.remember) M.propose(r.remember); return r; }
      catch (e) { console.warn('AI', e); DB.ai.lastError = e.message; return { text: 'Ουπς, το μυαλό μου μπερδεύτηκε λίγο. Ξαναπές το μου;', action: 'SURPRISE' }; }
    },
    async see(b64) {
      const p = current();
      try { return await p.see(b64); }
      catch (e) { DB.ai.lastError = e.message; return { text: 'Δεν κατάφερα να δω καλά. Δοκιμάζουμε ξανά;', action: 'HEAD' }; }
    },
    async test() { const out = await geminiCall([{ role: 'user', parts: [{ text: 'Πες μόνο: Γεια σου!' }] }]); return parse(out).text; },
    reset() { gemini.reset(); }
  };
})();
