/* app.js – SmartKids: storage, router, learning, practice, quiz, games, progress.
   Content comes from data/content.js (the SK object). */
const app = document.getElementById("app");
const STORAGE_KEY = "smartkidsData";
const SUBJECTS = {
  alphabet:    { name: "A–Z",               icon: "🔤", cls: "s-az" },
  english:     { name: "English",           icon: "📖", cls: "s-english" },
  mathematics: { name: "Mathematics",       icon: "🔢", cls: "s-math" },
  gk:          { name: "General Knowledge", icon: "🌍", cls: "s-gk" },
  marathi:     { name: "Marathi",           icon: "अ",  cls: "s-local", lang: true },   // Local Language: one key per language
  urdu:        { name: "Urdu",              icon: "ا",  cls: "s-local", lang: true }
};
const state = { run: null, last: null, mem: null };   // one place for temporary (non-saved) state
let cache = null;                                      // saved data kept in memory too

/* ================= UTILITIES ================= */
function r(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }              // random int a..b
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = r(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(n, arr) { return shuffle(arr).slice(0, n); }                              // n random items
function mk(q, a, wrong, extra) { return Object.assign({ q: q, a: a, o: shuffle([a].concat(wrong)) }, extra); }  // build a question
function numWrongs(c) { const s = new Set(), sp = Math.max(3, Math.round(c * 0.2)); let g = 0; while (s.size < 3 && g++ < 300) { const v = c + r(-sp, sp); if (v >= 0 && v !== c) s.add(v); } return Array.from(s); }
function starsText(n) { return "⭐".repeat(n) + "☆".repeat(5 - n); }
function speak(t, lang) {   // lang is optional (e.g. "mr-IN", "ur-PK"); never blocks learning
  const note = document.getElementById("tts-note");
  if (!("speechSynthesis" in window)) { if (note) note.textContent = "Audio is not available on this device, but you can still learn!"; return; }
  const code = lang || "en-US", voices = speechSynthesis.getVoices();
  if (note) note.textContent = voices.length && !voices.some(function (v) { return v.lang.toLowerCase().indexOf(code.slice(0, 2).toLowerCase()) === 0; }) ? "This device has no " + code + " voice, so the sound may be missing." : "";
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = code; u.rate = 0.85; speechSynthesis.speak(u);
}
function page(html, cls) { app.innerHTML = '<section class="page ' + (cls || "") + '">' + html + "</section>"; }

/* ================= STORAGE (localStorage with safe fallback) ================= */
function defaultData() {
  return { version: 1, ageGroup: null, language: null, currentPath: null,
    progress: { alphabet: 0, english: 0, mathematics: 0, gk: 0, marathi: 0, urdu: 0 }, done: {},
    scores: { alphabet: [], english: [], mathematics: [], gk: [], marathi: [], urdu: [], mixed: [] },
    stars: 0, badges: [], streak: 0, lastDay: null, games: 0 };
}
function loadData() {
  if (cache) return cache;
  const d = defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && typeof s === "object") {
        ["ageGroup", "language", "currentPath", "stars", "streak", "lastDay", "games"].forEach(function (k) { if (s[k] !== undefined) d[k] = s[k]; });
        if (s.done && typeof s.done === "object") Object.assign(d.done, s.done);
        if (Array.isArray(s.badges)) d.badges = s.badges;
        if (s.scores && typeof s.scores === "object") Object.keys(d.scores).forEach(function (k) { if (Array.isArray(s.scores[k])) d.scores[k] = s.scores[k]; });
      }
    }
  } catch (e) { /* blocked or corrupted storage: continue with fresh data */ }
  if (SK.AGE_GROUPS.indexOf(d.ageGroup) < 0) d.ageGroup = null;
  if (!isLang(d.language)) d.language = null;
  d.stars = Number(d.stars) || 0; d.streak = Number(d.streak) || 0; d.games = Number(d.games) || 0;
  recount(d); cache = d; return d;
}
function recount(d) { Object.keys(SUBJECTS).forEach(function (s) { d.progress[s] = Object.keys(d.done).filter(function (k) { return k.indexOf(s + ":") === 0; }).length; }); }
function saveData() { const d = loadData(); recount(d); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) { /* session memory only */ } }
function resetData() { cache = null; try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }

/* ================= LESSON LOGIC ================= */
function gi() { const i = SK.AGE_GROUPS.indexOf(loadData().ageGroup); return i < 0 ? 1 : i; }   // age group index
function rawBank(s) { return SK[s === "gk" ? "gk" : "english"][gi()]; }
function totalLessons(s) { if (isLang(s)) return langTopics(s).length; if (s === "alphabet") return 26; if (s === "mathematics") return SK.MATH_TOPICS[gi()].length; return Math.ceil(rawBank(s).length / 4); }
function lessonTitle(x) { if (isLang(x.subject)) return langTopics(x.subject)[x.n].name; if (x.subject === "alphabet") return "Letter " + SK.ALPHABET[x.n].id; if (x.subject === "mathematics") return SK.MATH_TOPICS[gi()][x.n]; return "Lesson " + (x.n + 1); }
function lessonHref(x) { return "#lesson/" + x.subject + "/" + x.n; }
function chunk(s, n) { return rawBank(s).slice(n * 4, n * 4 + 4); }

/* CONTINUE ENGINE: first unfinished lesson, starting with the subject the child was last in */
function nextLesson() {
  const d = loadData(), keys = coreSubjects().concat(d.language ? [d.language] : []);
  const first = d.currentPath && SUBJECTS[d.currentPath.subject] ? d.currentPath.subject : (gi() === 0 ? "alphabet" : "english");
  const order = [first].concat(keys.filter(function (k) { return k !== first; }));
  for (let i = 0; i < order.length; i++) for (let n = 0; n < totalLessons(order[i]); n++) if (!d.done[order[i] + ":" + n]) return { subject: order[i], n: n };
  return null;
}
function contHref() { if (!loadData().ageGroup) return "#age-selection"; const nx = nextLesson(); return nx ? lessonHref(nx) : "#dashboard"; }

/* ================= QUESTION MAKERS ================= */
function bankQ(line, s) { const p = line.split("|"); return mk(p[0], p[1], p.slice(2), { subject: s, topic: SUBJECTS[s].name }); }
function alphaQs(n) {
  const L = SK.ALPHABET[n], o = shuffle(SK.ALPHABET.filter(function (x) { return x !== L; })), x = { subject: "alphabet", topic: "A–Z", e: L.id + " for " + L.word + "!" };
  return [ mk("Which one is " + L.word + "?", L.emoji, o.slice(0, 3).map(function (z) { return z.emoji; }), x),
           mk(L.emoji + " " + L.word + " starts with which letter?", L.id, o.slice(3, 6).map(function (z) { return z.id; }), x),
           mk("Which is the small letter for " + L.id + "?", L.lower, o.slice(6, 9).map(function (z) { return z.lower; }), x) ];
}
function mathQ(t, g) {
  const e = pick(1, ["🍎", "⭐", "🐟", "🎈", "🍪"])[0]; let q, a, x = "", A, B;
  switch (t) {
    case "Counting": a = r(2, 9); q = e.repeat(a) + "\nHow many?"; break;
    case "Addition": A = g === 0 ? r(1, 5) : r(10, 60); B = g === 0 ? r(1, 4) : r(10, 40); a = A + B;
      q = g === 0 ? e.repeat(A) + " + " + e.repeat(B) + "\nHow many in all?" : A + " + " + B + " = ?"; x = A + " + " + B + " = " + a; break;
    case "Subtraction": A = g === 0 ? r(3, 9) : r(20, 99); B = g === 0 ? r(1, 2) : r(5, 19); a = A - B; q = A + " − " + B + " = ?"; x = A + " − " + B + " = " + a; break;
    case "Multiplication": A = g === 2 ? r(11, 25) : r(2, 10); B = g === 2 ? r(3, 9) : r(2, 10); a = A * B; q = A + " × " + B + " = ?"; x = A + " × " + B + " = " + a; break;
    case "Division": B = r(2, 10); a = r(2, 10); A = a * B; q = A + " ÷ " + B + " = ?"; x = A + " ÷ " + B + " = " + a; break;
    case "Tables": A = r(2, 10); a = r(2, 10); q = A + " × ? = " + (A * a); x = A + " × " + a + " = " + (A * a); break;
    case "Number sequence": B = [r(1, 3), r(2, 10), r(5, 25)][g]; A = r(1, 10); a = A + 3 * B; q = A + ", " + (A + B) + ", " + (A + 2 * B) + ", ?"; x = "Each number goes up by " + B + "."; break;
    case "Fractions": B = r(2, 5); a = r(2, 9); q = "What is 1/" + B + " of " + (a * B) + "?"; x = (a * B) + " split into " + B + " equal parts is " + a + "."; break;
    case "Percentages": A = pick(1, [10, 25, 50])[0]; B = pick(1, [20, 40, 60, 80, 100, 200])[0]; a = B * A / 100; q = "What is " + A + "% of " + B + "?"; x = A + "% of " + B + " = " + a; break;
    case "Word problems": A = r(20, 40); B = r(5, 15); a = A - B; q = "A box has " + A + " pencils.\n" + B + " are taken out. How many are left?"; x = A + " − " + B + " = " + a; break;
    case "Basic algebra": a = r(2, 20); A = r(2, 15); q = "x + " + A + " = " + (a + A) + "\nWhat is x?"; x = "x = " + (a + A) + " − " + A + " = " + a; break;
    case "More or less": A = r(1, 5); B = A + r(1, 4);
      if (r(0, 1)) return mk(e.repeat(A) + "  vs  " + e.repeat(B) + "\nWhich side has more?", "Right", ["Left"], { subject: "mathematics", topic: t, e: "The right side has more." });
      return mk(e.repeat(B) + "  vs  " + e.repeat(A) + "\nWhich side has more?", "Left", ["Right"], { subject: "mathematics", topic: t, e: "The left side has more." });
  }
  return mk(q, String(a), numWrongs(a).map(String), { subject: "mathematics", topic: t, e: x });
}
function lessonQs(s, n) {
  if (isLang(s)) return langLessonQs(s, n);
  if (s === "alphabet") return alphaQs(n);
  if (s === "mathematics") { const t = SK.MATH_TOPICS[gi()][n]; return Array.from({ length: 5 }, function () { return mathQ(t, gi()); }); }
  return chunk(s, n).map(function (l) { return bankQ(l, s); });
}
function makeQs(s, count) {
  const g = gi();
  if (isLang(s)) return Array.from({ length: count }, function () { return langRandomQ(s); });
  if (s === "mixed") { let all = []; coreSubjects().forEach(function (k) { all = all.concat(makeQs(k, 3)); }); if (loadData().language) all = all.concat(makeQs(loadData().language, 2)); return pick(count, all); }
  if (s === "alphabet") return Array.from({ length: count }, function () { return alphaQs(r(0, 25))[r(0, 2)]; });
  if (s === "mathematics") { const t = SK.MATH_TOPICS[g]; return Array.from({ length: count }, function (_, i) { return mathQ(t[i % t.length], g); }); }
  const bank = rawBank(s); return pick(Math.min(count, bank.length), bank).map(function (l) { return bankQ(l, s); });
}
/* game question makers */
function seqQ(g) { const st = [r(1, 3), r(2, 10), r(5, 25)][g], s = r(1, 10), a = s + 3 * st; return mk(s + ", " + (s + st) + ", " + (s + 2 * st) + ", ?", String(a), numWrongs(a).map(String), { subject: "games", topic: "Number Sequence", e: "The numbers go up by " + st + "." }); }
function missingQ(g) {
  const list = SK.WORDS.filter(function (w) { return g > 0 || w.split("|")[0].length === 3; }), w = pick(1, list)[0].split("|"), word = w[0], vow = "AEIOU".split("");
  const idx = g === 0 ? word.split("").findIndex(function (c) { return vow.indexOf(c) >= 0; }) : r(0, word.length - 1), ch = word[idx];
  const pool = vow.indexOf(ch) >= 0 ? vow : "BCDFGHKLMNPRSTW".split("");
  return mk(w[1] + "\n" + word.split("").map(function (c, i) { return i === idx ? "_" : c; }).join(" "), ch, pick(3, pool.filter(function (z) { return z !== ch; })), { subject: "games", topic: "Missing Letter", e: word + " – the missing letter is " + ch + "." });
}
function pictureQ() { const L = pick(4, SK.ALPHABET); return mk("What is this?\n" + L[0].emoji, L[0].word, L.slice(1).map(function (z) { return z.word; }), { subject: "games", topic: "Picture Quiz", e: "It is " + L[0].word + "!" }); }

/* ================= BADGES + STREAK ================= */
const BADGES = [
  ["first-lesson", "⭐", "First Lesson", function (d) { return Object.keys(d.done).length >= 1; }],
  ["alphabet-explorer", "🏆", "Alphabet Explorer", function (d) { return d.progress.alphabet >= 26; }],
  ["english-explorer", "📚", "English Explorer", function (d) { return d.progress.english >= 3; }],
  ["math-star", "🔢", "Math Star", function (d) { return d.progress.mathematics >= 3; }],
  ["gk-explorer", "🌍", "GK Explorer", function (d) { return d.progress.gk >= 3; }],
  ["practice-streak", "🔥", "Practice Streak (3 days)", function (d) { return d.streak >= 3; }],
  ["quiz-master", "🎯", "Quiz Master (90%+)", function (d) { return Object.keys(d.scores).some(function (k) { return d.scores[k].some(function (p) { return p >= 90; }); }); }],
  ["game-player", "🎮", "Game Player", function (d) { return d.games >= 1; }],
  ["language-learner", "🗣️", "Language Learner", function (d) { return d.progress.marathi + d.progress.urdu >= 1; }],
  ["marathi-explorer", "अ", "Marathi Explorer (5 topics)", function (d) { return d.progress.marathi >= 5; }],
  ["urdu-explorer", "ا", "Urdu Explorer (5 topics)", function (d) { return d.progress.urdu >= 5; }],
  ["language-quiz-star", "🌟", "Language Quiz Star (80%+)", function (d) { return d.scores.marathi.concat(d.scores.urdu).some(function (p) { return p >= 80; }); }]
];
function checkBadges() { const d = loadData(), fresh = []; recount(d); BADGES.forEach(function (b) { if (d.badges.indexOf(b[0]) < 0 && b[3](d)) { d.badges.push(b[0]); fresh.push(b[2]); } }); return fresh; }
function badgeNote(nb) { return nb && nb.length ? '<p class="badge-new">🏅 New badge: ' + nb.join(", ") + "</p>" : ""; }
function touchStreak() { const d = loadData(), today = new Date().toDateString(); if (d.lastDay === today) return; d.streak = d.lastDay === new Date(Date.now() - 864e5).toDateString() ? d.streak + 1 : 1; d.lastDay = today; }

/* ================= RUN ENGINE (practice, quiz and games share this) ================= */
function startRun(qs, cfg) { state.run = { qs: qs, i: 0, answers: [], cfg: cfg, locked: false }; showQuestion(); }
function showQuestion() {
  const run = state.run, q = run.qs[run.i], total = run.qs.length;
  page('<p class="muted">' + run.cfg.title + " • Question " + (run.i + 1) + " of " + total + '</p><div class="progress-bar"><span style="width:' + Math.round(run.i / total * 100) + '%"></span></div>' +
    '<div class="q-card"><h2 class="q-text">' + q.q + '</h2><div class="opts">' + q.o.map(function (o, k) { return '<button class="opt" data-k="' + k + '" onclick="answer(' + k + ')">' + optHtml(q, o) + "</button>"; }).join("") + '</div><div id="fb" role="status"></div></div>');
}
function answer(k) {
  const run = state.run; if (!run || run.locked) return; run.locked = true;
  const q = run.qs[run.i], ok = q.o[k] === q.a; run.answers.push({ q: q, picked: q.o[k], ok: ok });
  document.querySelectorAll(".opt").forEach(function (b) {
    b.disabled = true; const isRight = q.o[Number(b.dataset.k)] === q.a;
    if (isRight) { b.classList.add("correct"); b.prepend("✔ "); }
    else if (Number(b.dataset.k) === k) { b.classList.add("wrong"); b.prepend("✖ "); }
  });
  if (run.cfg.mode === "quiz") { setTimeout(nextQ, 600); return; }          // quizzes move on by themselves
  const last = run.i === run.qs.length - 1;
  document.getElementById("fb").innerHTML = (ok ? '<div class="feedback ok">🎉 Correct! Great work! ' + (q.e || ansHtml(q) + "!") + "</div>" : '<div class="feedback try">Good try! The correct answer is ' + ansHtml(q) + ". Let's learn it again!</div>") +
    '<button class="btn btn-primary" id="nextq" onclick="nextQ()">' + (last ? "See Results →" : "Next →") + "</button>";
  document.getElementById("nextq").focus();
}
function nextQ() {
  const run = state.run; if (!run) return; run.locked = false; run.i++;
  if (run.i < run.qs.length) { showQuestion(); return; }
  const correct = run.answers.filter(function (a) { return a.ok; }).length;
  touchStreak(); run.cfg.onFinish({ correct: correct, total: run.qs.length, pct: Math.round(correct / run.qs.length * 100), answers: run.answers });
}
function summary(title, msg, res, retry, nb) {
  page('<div class="card lesson-card"><h1>' + title + '</h1><p class="big-score">' + res.correct + " / " + res.total + "</p><p>" + msg + "</p>" + badgeNote(nb) + '</div><div class="btn-row"><button class="btn btn-ghost" onclick="' + retry + '">Try Again</button><a class="btn btn-primary" href="' + contHref() + '">Continue Learning →</a></div>');
}

/* ----- finish handlers ----- */
function practiceLesson(s, n) { startRun(lessonQs(s, n), { title: "Practice • " + lessonTitle({ subject: s, n: n }), mode: "practice", subject: s, onFinish: function (res) { completeLesson(s, n, res); } }); }
function completeLesson(s, n, res) {
  const d = loadData(), key = s + ":" + n, first = !d.done[key];
  if (first) { d.done[key] = true; d.stars += 3; }
  d.currentPath = isLang(s) ? { subject: s, language: s, topic: langTopics(s)[n].id, lessonId: n } : { subject: s, lessonId: n }; const nb = checkBadges(); saveData();
  const nx = nextLesson();
  page('<div class="card lesson-card"><h1>Great Job! 🎉</h1><p>You completed ' + lessonTitle({ subject: s, n: n }) + ".</p><p>You got " + res.correct + " / " + res.total + (first ? " &nbsp; +3 ⭐" : "") + "</p>" + badgeNote(nb) +
    (nx ? "<p>Next:</p><h2>" + SUBJECTS[nx.subject].name + " • " + lessonTitle(nx) + "</h2>" : "<p>You finished every lesson! Try a quiz or a game.</p>") +
    '</div><div class="btn-row"><button class="btn btn-ghost" onclick="practiceLesson(\'' + s + "'," + n + ')">Practice Again</button><a class="btn btn-primary" href="' + contHref() + '">Continue Learning →</a></div>');
}
function startPractice(s) { if (s !== "mixed" && !SUBJECTS[s]) return views.notfound(); startRun(makeQs(s, 8), { title: "Practice • " + (s === "mixed" ? "Mixed" : SUBJECTS[s].name), mode: "practice", subject: s, onFinish: function (res) { const d = loadData(); d.stars += Math.ceil(res.correct / 2); const nb = checkBadges(); saveData(); summary("Practice complete! 🎉", "Practice makes you stronger!", res, "startPractice('" + s + "')", nb); } }); }
function startQuiz(s) { if (s !== "mixed" && !SUBJECTS[s]) return views.notfound(); startRun(makeQs(s, 10), { title: "Quiz • " + (s === "mixed" ? "Mixed" : SUBJECTS[s].name), mode: "quiz", subject: s, onFinish: quizFinish }); }
function quizFinish(res) {
  const d = loadData(), key = state.run.cfg.subject, st = Math.max(1, Math.round(res.pct / 20));
  d.scores[key] = (d.scores[key] || []).concat(res.pct).slice(-10); d.stars += st;
  const nb = checkBadges(); saveData();
  state.last = { res: res, st: st, nb: nb, subject: key }; location.hash = "#results";
}
function recommend(res) {   // simple rule-based recommendation (no AI)
  const by = {}; res.answers.forEach(function (a) { const k = a.q.topic; by[k] = by[k] || { c: 0, n: 0, s: a.q.subject }; by[k].n++; if (a.ok) by[k].c++; });
  let weak = null; Object.keys(by).forEach(function (k) { const p = Math.round(by[k].c / by[k].n * 100); if (p < 75 && (!weak || p < weak.p)) weak = { k: k, p: p, s: by[k].s }; });
  if (weak) return { text: weak.k + ": you scored " + weak.p + "%. " + (weak.p < 50 ? "Practice this topic again." : "Try another practice activity."), href: "#practice/" + (SUBJECTS[weak.s] ? weak.s + (isLang(weak.s) ? "/go" : "") : "mixed") };
  return { text: "Great work! Continue to the next topic.", href: null };
}
function gameFinish(name, res, id) { const d = loadData(); d.stars += res.correct; d.games++; const nb = checkBadges(); saveData(); summary(name + " done! 🎮", "+" + res.correct + " ⭐ earned", res, "views.game(['" + id + "'])", nb); }

/* ================= MEMORY GAMES ================= */
function startMemory(kind) {
  let cards = []; if (kind.indexOf("lang:") === 0) cards = langMatchCards(kind.slice(5)); else pick(6, SK.ALPHABET).forEach(function (L) { if (kind === "memory") cards.push({ p: L.id, t: L.emoji }, { p: L.id, t: L.word }); else cards.push({ p: L.id, t: L.id }, { p: L.id, t: L.lower }); });
  state.mem = { cards: shuffle(cards), open: [], matched: [], moves: 0, lock: false, kind: kind };
  page("<h1>" + (kind === "memory" ? "Memory Match" : kind === "letters" ? "Letter Match" : "Word Match • " + SUBJECTS[kind.slice(5)].name) + '</h1><p class="muted">Flip two cards. Find the pairs!</p><p>Moves: <strong id="moves">0</strong></p><div class="mem-grid">' +
    state.mem.cards.map(function (c, i) { return '<button class="mem" dir="auto" id="m' + i + '" onclick="flipCard(' + i + ')" aria-label="Hidden card">?</button>'; }).join("") + "</div>", "page-wide");
}
function flipCard(i) {
  const m = state.mem; if (!m || m.lock || m.open.indexOf(i) >= 0 || m.matched.indexOf(i) >= 0) return;
  const b = document.getElementById("m" + i); b.textContent = m.cards[i].t; b.classList.add("open"); b.setAttribute("aria-label", m.cards[i].t); m.open.push(i);
  if (m.open.length < 2) return;
  m.moves++; document.getElementById("moves").textContent = m.moves;
  const x = m.open[0], y = m.open[1];
  if (m.cards[x].p === m.cards[y].p) {
    m.matched.push(x, y); m.open = []; [x, y].forEach(function (k) { document.getElementById("m" + k).classList.add("done"); });
    if (m.matched.length === m.cards.length) { const d = loadData(); d.stars += 3; d.games++; touchStreak(); const nb = checkBadges(); saveData();
      page('<div class="card lesson-card"><h1>You found them all! 🎉</h1><p class="big-score">' + m.moves + ' moves</p><p>+3 ⭐ earned</p>' + badgeNote(nb) + '</div><div class="btn-row"><button class="btn btn-ghost" onclick="startMemory(\'' + m.kind + '\')">Play Again</button><a class="btn btn-primary" href="#games">More Games →</a></div>'); }
  } else {
    m.lock = true;
    setTimeout(function () { [x, y].forEach(function (k) { const e = document.getElementById("m" + k); if (e) { e.textContent = "?"; e.classList.remove("open"); e.setAttribute("aria-label", "Hidden card"); } }); m.open = []; m.lock = false; }, 800);
  }
}

/* ================= SCREENS (views) ================= */
function contCard() {
  const d = loadData(), nx = nextLesson();
  if (!d.ageGroup) return card("Start your learning journey", "Pick your age and begin.", null, "#age-selection", "Let's Start →");
  if (!nx) return card("All lessons done! 🎉", "Try a quiz or play a game.", null, "#quiz", "Take a Quiz →");
  const t = totalLessons(nx.subject);
  return card("Continue Learning", SUBJECTS[nx.subject].name + " • " + lessonTitle(nx), { done: d.progress[nx.subject], total: t }, lessonHref(nx), "Continue →");
}
function card(title, detail, bar, href, label) {
  return '<div class="continue-card"><h2>' + title + "</h2><p>" + detail + "</p>" + (bar ? barHtml(bar.done, bar.total) + "<p>" + bar.done + " / " + bar.total + "</p>" : "") + '<a class="btn btn-primary" href="' + href + '">' + label + "</a></div>";
}
function barHtml(done, total) { return '<div class="progress-bar" role="progressbar" aria-valuenow="' + done + '" aria-valuemin="0" aria-valuemax="' + total + '"><span style="width:' + Math.round(done / total * 100) + '%"></span></div>'; }
function subjectTiles(base, mixed) {
  let h = coreSubjects().map(function (k) { return '<a class="subject-card ' + SUBJECTS[k].cls + '" href="#' + base + "/" + k + '"><span class="s-icon" aria-hidden="true">' + SUBJECTS[k].icon + '</span><span class="s-name">' + SUBJECTS[k].name + "</span></a>"; }).join("");
  h += '<a class="subject-card s-local" href="#local/' + base + '"><span class="s-icon" aria-hidden="true">🗣️</span><span class="s-name">Local Language</span></a>';
  if (mixed) h += '<a class="subject-card s-games" href="#' + base + '/mixed"><span class="s-icon" aria-hidden="true">🎲</span><span class="s-name">Mixed</span></a>';
  return h;
}
function statsHtml() { const d = loadData(); recount(d); const lessons = Object.keys(d.done).length; return '<div class="stats"><div class="stat"><strong>' + d.stars + '</strong>⭐ Stars</div><div class="stat"><strong>' + d.badges.length + '</strong>🏅 Badges</div><div class="stat"><strong>' + lessons + '</strong>📘 Lessons</div><div class="stat"><strong>' + d.streak + '</strong>🔥 Day streak</div></div>'; }

const views = {};
views.home = function () {
  page('<div class="hero"><div class="hero-text"><h1>Welcome, Young Learner!</h1><p class="hero-sub">Learn, practice and play. No sign-up needed.</p>' + contCard() +
    '</div><div class="hero-art"><img src="assets/logo/smartkids-logo.jpeg" alt="SmartKids logo: an open book with a rising sun" width="768" height="512"></div></div>' +
    '<ul class="pillars"><li class="pillar pillar-learn"><span class="pillar-icon" aria-hidden="true">📚</span><strong>Learn</strong><span>See new things</span></li><li class="pillar pillar-practice"><span class="pillar-icon" aria-hidden="true">🧩</span><strong>Practice</strong><span>Try it yourself</span></li><li class="pillar pillar-assess"><span class="pillar-icon" aria-hidden="true">📝</span><strong>Assess</strong><span>Show what you know</span></li></ul>' +
    '<h2 class="section-title">Pick a subject</h2><div class="subject-grid">' + subjectTiles("learn", false).replace("</a>", "</a>") +
    '<a class="subject-card s-games" href="#games"><span class="s-icon" aria-hidden="true">🎮</span><span class="s-name">Games</span></a><a class="subject-card s-progress" href="#progress"><span class="s-icon" aria-hidden="true">🏆</span><span class="s-name">My Progress</span></a></div>', "page-wide");
};
let pendingAge = null;
views["age-selection"] = function () {
  pendingAge = loadData().ageGroup;
  page("<h1>How old are you?</h1><p class=\"muted\">Pick your age group.</p><div class=\"choices\">" + SK.AGE_GROUPS.map(function (g, i) {
    return '<button class="choice' + (g === pendingAge ? " selected" : "") + '" data-age="' + g + '" aria-pressed="' + (g === pendingAge) + '" onclick="pickAge(\'' + g + '\')"><span class="choice-icon" aria-hidden="true">' + ["🧸", "🎒", "🚀"][i] + "</span><strong>" + g + "</strong><span>years</span></button>"; }).join("") +
    '</div><p id="age-msg" class="muted" role="status"></p><div class="btn-row"><button class="btn btn-primary" onclick="confirmAge()">Continue →</button></div>');
};
function pickAge(g) { pendingAge = g; document.querySelectorAll(".choice").forEach(function (b) { const on = b.dataset.age === g; b.classList.toggle("selected", on); b.setAttribute("aria-pressed", on); }); }
function confirmAge() {
  if (!pendingAge) { document.getElementById("age-msg").textContent = "Tap your age group first."; return; }
  const d = loadData();
  if (d.ageGroup !== pendingAge) { d.ageGroup = pendingAge; d.currentPath = null; Object.keys(d.done).forEach(function (k) { if (k.indexOf("alphabet:") !== 0) delete d.done[k]; }); }
  saveData(); location.hash = "#dashboard";
}
views.dashboard = function () {
  const d = loadData(); if (!d.ageGroup) { location.hash = "#age-selection"; return; }
  const tile = function (s, label) { return '<a class="card" href="#learn/' + s + '"><h3>' + label + "</h3>" + barHtml(d.progress[s], totalLessons(s)) + "<p>" + d.progress[s] + " / " + totalLessons(s) + " lessons</p></a>"; };
  const local = d.language ? tile(d.language, "🗣️ Local Language • " + SUBJECTS[d.language].name) : '<a class="card" href="#local/learn"><h3>🗣️ Local Language</h3><p>Choose Marathi or Urdu</p></a>';
  page("<h1>Welcome, Young Learner!</h1>" + contCard() + '<h2 style="margin-top:1.5rem">Your Learning</h2><div class="cards">' + coreSubjects().map(function (s) { return tile(s, SUBJECTS[s].icon + " " + SUBJECTS[s].name); }).join("") + local +
    '</div><h2>Quick Actions</h2><div class="btn-row"><a class="btn btn-ghost" href="#practice">🧩 Practice</a><a class="btn btn-ghost" href="#quiz">📝 Quiz</a><a class="btn btn-ghost" href="#games">🎮 Games</a></div><h2 style="margin-top:1.5rem">Your Progress</h2>' + statsHtml(), "page-wide");
};
views.learn = function (a) {
  const s = a[0];
  if (s === "local") { location.hash = "#local/learn"; return; }
  if (isLang(s)) { const dd = loadData(); dd.language = s; saveData(); }
  if (!s || !SUBJECTS[s]) { page('<h1>What do you want to learn?</h1><div class="cards">' + subjectTiles("learn", false) + "</div>", "page-wide"); return; }
  const d = loadData(); let list = "";
  for (let n = 0; n < totalLessons(s); n++) list += '<a class="lesson-link' + (d.done[s + ":" + n] ? " done" : "") + '" href="#lesson/' + s + "/" + n + '"><span aria-hidden="true">' + (d.done[s + ":" + n] ? "✅" : "▶️") + "</span> " + lessonTitle({ subject: s, n: n }) + (d.done[s + ":" + n] ? " (done)" : "") + "</a>";
  page("<h1>" + SUBJECTS[s].icon + " " + SUBJECTS[s].name + (isLang(s) ? " " + loc(localLanguageData[s].nativeName, s) : "") + "</h1>" + (isLang(s) ? '<p class="muted">Pick a topic. <a href="#local/learn">Switch language</a></p>' : "") + '<div class="lesson-list">' + list + "</div>");
};
views.lesson = function (a) {
  const s = a[0], n = Number(a[1]);
  if (!SUBJECTS[s] || !(n >= 0 && n < totalLessons(s))) return views.notfound();
  if (isLang(s)) return langLesson(s, n, Number(a[2]) || 0);
  let body = "";
  if (s === "alphabet") { const L = SK.ALPHABET[n]; body = '<div class="card lesson-card"><div class="big-letter">' + L.id + " " + L.lower + '</div><div class="pic" aria-hidden="true">' + L.emoji + "</div><h2>" + L.id + " for " + L.word + "</h2><p>" + L.word + " starts with the letter " + L.id + '.</p><button class="btn btn-ghost" onclick="speak(\'' + L.id + " for " + L.word + '\')">🔊 Listen</button></div>'; }
  else if (s === "mathematics") { const t = SK.MATH_TOPICS[gi()][n]; let ex = ""; for (let i = 0; i < 3; i++) { const q = mathQ(t, gi()); ex += '<div class="fact"><strong>' + q.q + "</strong><span>= " + q.a + "</span></div>"; } body = '<div class="card"><h2>' + t + "</h2><p>Look at these examples:</p>" + ex + "</div>"; }
  else body = '<div class="card"><h2>Remember these</h2>' + chunk(s, n).map(function (l) { const p = l.split("|"); return '<div class="fact"><strong>' + p[0] + "</strong><span>" + p[1] + "</span></div>"; }).join("") + "</div>";
  page('<p><a href="#learn/' + s + '">← ' + SUBJECTS[s].name + "</a></p><h1>" + lessonTitle({ subject: s, n: n }) + "</h1>" + body + '<div class="btn-row">' + (n > 0 ? '<a class="btn btn-ghost" href="#lesson/' + s + "/" + (n - 1) + '">← Previous</a>' : "") +
    '<button class="btn btn-primary" onclick="practiceLesson(\'' + s + "'," + n + ')">Practice →</button>' + (n < totalLessons(s) - 1 ? '<a class="btn btn-ghost" href="#lesson/' + s + "/" + (n + 1) + '">Next →</a>' : "") + "</div>");
};
views.practice = function (a) { if (a[0] === "local") return views.local(["practice"]); if (isLang(a[0]) && a[1] !== "go") return langPracticeMenu(a[0]); if (a[0]) return startPractice(a[0]); page('<h1>Practice time!</h1><p class="muted">Pick a subject.</p><div class="cards">' + subjectTiles("practice", true) + "</div>", "page-wide"); };
views.quiz = function (a) { if (a[0] === "local") return views.local(["quiz"]); if (a[0]) return startQuiz(a[0]); page('<h1>Quiz time!</h1><p class="muted">Pick a quiz.</p><div class="cards">' + subjectTiles("quiz", true) + "</div>", "page-wide"); };
views.results = function () {
  const L = state.last; if (!L) return views.notfound();
  const r2 = L.res, rec = recommend(r2);
  page('<div class="card lesson-card"><h1>🎉 Quiz Complete!</h1><p class="big-score">' + r2.correct + " / " + r2.total + "</p><p><strong>" + r2.pct + '%</strong></p><p class="stars" aria-label="' + L.st + ' out of 5 stars">' + starsText(L.st) + "</p><p>Correct: " + r2.correct + " &nbsp;•&nbsp; To practise: " + (r2.total - r2.correct) + "</p>" + badgeNote(L.nb) + "</div>" +
    '<div class="card" style="margin-top:1rem"><h2>Recommended Practice</h2><p>' + rec.text + "</p>" + (rec.href ? '<a class="btn btn-ghost" href="' + rec.href + '">Practice Now →</a>' : "") + '</div><div class="btn-row"><a class="btn btn-ghost" href="#review">Review Answers</a><a class="btn btn-primary" href="' + contHref() + '">Continue Learning →</a></div>');
};
views.review = function () {
  const L = state.last; if (!L) return views.notfound();
  const wrong = L.res.answers.filter(function (x) { return !x.ok; });
  page("<h1>Review Answers</h1>" + (wrong.length ? wrong.map(function (x) { return '<div class="card" style="margin-bottom:1rem"><h3 style="white-space:pre-line">' + x.q.q + "</h3><p>Your answer: " + optHtml(x.q, x.picked) + " ❌</p><p><strong>Correct answer: " + ansHtml(x.q) + " ✅</strong></p><p>" + (x.q.e || "The correct answer is " + ansHtml(x.q) + ".") + "</p></div>"; }).join("") : '<div class="card"><h2>No mistakes! 🌟</h2></div>') + '<div class="btn-row"><a class="btn btn-primary" href="' + contHref() + '">Continue Learning →</a></div>');
};
views.games = function () {
  const G = [["memory", "🃏", "Memory Match", "Match pictures with words"], ["letters", "🔠", "Letter Match", "Match A with a"], ["sequence", "🔢", "Number Sequence", "Find the next number"], ["missing", "🔤", "Missing Letter", "Fill in the blank"], ["picture", "🖼️", "Picture Quiz", "What is this?"]];
  page('<h1>Games</h1><p class="muted">Pick a game and play!</p><div class="cards">' + G.map(function (g) { return '<a class="card lesson-card" href="#game/' + g[0] + '"><div class="pic" style="font-size:3.5rem" aria-hidden="true">' + g[1] + "</div><h3>" + g[2] + "</h3><p>" + g[3] + "</p><span class=\"btn btn-primary\">Play →</span></a>"; }).join("") + "</div>", "page-wide");
};
views.game = function (a) {
  const id = a[0], g = gi(), G = { sequence: ["Number Sequence", function () { return seqQ(g); }], missing: ["Missing Letter", function () { return missingQ(g); }], picture: ["Picture Quiz", pictureQ] };
  if (id === "memory" || id === "letters") return startMemory(id);
  if (id.indexOf("match-") === 0 && isLang(id.slice(6))) return startMemory("lang:" + id.slice(6));
  if (!G[id]) return views.notfound();
  startRun(Array.from({ length: 8 }, G[id][1]), { title: G[id][0], mode: "game", subject: "game", onFinish: function (res) { gameFinish(G[id][0], res, id); } });
};
views.progress = function () {
  const d = loadData(); recount(d);
  const rows = Object.keys(SUBJECTS).map(function (s) { const sc = d.scores[s], t = totalLessons(s); return '<div class="bar-row"><strong>' + SUBJECTS[s].icon + " " + (isLang(s) ? "Local Language • " : "") + SUBJECTS[s].name + (d.language === s ? " (selected)" : "") + " — " + Math.round(d.progress[s] / t * 100) + "%</strong>" + barHtml(d.progress[s], t) + '<span class="muted">' + d.progress[s] + " / " + t + " lessons" + (sc.length ? " • last quiz " + sc[sc.length - 1] + "%" : "") + "</span></div>"; }).join("");
  page("<h1>My Progress</h1>" + statsHtml() + '<h2 style="margin-top:1.5rem">Lessons</h2>' + rows + "<h2>Badges</h2><div class=\"badge-grid\">" + BADGES.map(function (b) { const on = d.badges.indexOf(b[0]) >= 0; return '<div class="badge' + (on ? "" : " locked") + '"><span aria-hidden="true">' + b[1] + "</span>" + b[2] + (on ? "" : "<br>(locked)") + "</div>"; }).join("") +
    '</div><div class="btn-row"><a class="btn btn-ghost" href="#age-selection">Change age group</a><button class="btn btn-ghost" onclick="resetAll()">Start over</button></div>');
};
function resetAll() { if (confirm("Start over? This clears your stars and progress on this device.")) { resetData(); location.hash = "#home"; route(); } }
views.notfound = function () { page('<h1>Let\'s take you back to learning.</h1><div class="btn-row"><a class="btn btn-primary" href="#home">Back to Learning</a></div>'); };

/* ================= LOCAL LANGUAGE (Marathi, Urdu) ================= */
function isLang(s) { return !!(SUBJECTS[s] && SUBJECTS[s].lang); }
function coreSubjects() { return Object.keys(SUBJECTS).filter(function (k) { return !SUBJECTS[k].lang; }); }
function langTopics(key) { return LL_TOPICS.filter(function (t) { return t.minAge <= gi(); }); }   // topics available for the age group
/* Wrap local-script text so it gets the right font, language and direction (RTL only for Urdu) */
function loc(text, key) { const L = localLanguageData[key]; return '<span class="local" lang="' + L.htmlLang + '" dir="' + L.direction + '">' + text + "</span>"; }
function optHtml(q, o) { return q.ol ? loc(o, q.ol) : o; }
function ansHtml(q) { return optHtml(q, q.a); }
function langItem(key, topic, k) { return { en: topic.en[k], pic: topic.pic[k], local: localLanguageData[key].words[topic.id][k] }; }
function langTypes() { return [["pic", "en2l"], ["pic", "en2l", "l2en", "fill"], ["en2l", "l2en", "fill", "tf", "pic"]][gi()]; }
function langQ(key, topic, k, type) {
  const name = localLanguageData[key].languageName, it = langItem(key, topic, k);
  const others = shuffle(topic.en.map(function (_, i) { return i; }).filter(function (i) { return i !== k; })).slice(0, 3).map(function (i) { return langItem(key, topic, i); });
  const locals = others.map(function (o) { return o.local; }), ens = others.map(function (o) { return o.en; });
  const x = { subject: key, topic: topic.name, e: it.en + " = " + loc(it.local, key) };
  if (type === "pic") return mk(it.pic + "\nWhich " + name + " word is this?", it.local, locals, Object.assign({ ol: key }, x));
  if (type === "l2en") return mk("What does " + loc(it.local, key) + " mean?", it.en, ens, x);
  if (type === "fill") return mk("In " + name + ", “" + it.en + "” is ______", it.local, locals, Object.assign({ ol: key }, x));
  if (type === "tf") { const truth = r(0, 1) === 1; return mk(loc(it.local, key) + " means “" + (truth ? it.en : ens[0]) + "”.", truth ? "True" : "False", [truth ? "False" : "True"], x); }
  return mk("What is “" + it.en + "” in " + name + "?", it.local, locals, Object.assign({ ol: key }, x));
}
function langLessonQs(key, n) {
  const t = langTopics(key)[n], types = langTypes();
  return pick(5, t.en.map(function (_, i) { return i; })).map(function (k, i) { return langQ(key, t, k, types[i % types.length]); });
}
function langRandomQ(key) { const t = pick(1, langTopics(key))[0]; return langQ(key, t, r(0, t.en.length - 1), pick(1, langTypes())[0]); }
function langMatchCards(key) {
  const pool = []; langTopics(key).forEach(function (t) { if (t.id !== "sentences") t.en.forEach(function (_, k) { pool.push(langItem(key, t, k)); }); });
  const cards = []; pick(6, pool).forEach(function (it, i) { cards.push({ p: "w" + i, t: it.en }, { p: "w" + i, t: it.local }); }); return cards;
}
/* One lesson = one topic, shown as flashcards: #lesson/<language>/<topic number>/<word number> */
function langLesson(key, n, w) {
  const L = localLanguageData[key], t = langTopics(key)[n], total = t.en.length; w = Math.max(0, Math.min(total - 1, w));
  const it = langItem(key, t, w), base = "#lesson/" + key + "/" + n + "/";
  page('<p><a href="#learn/' + key + '">← ' + L.languageName + " topics</a></p><h1>" + L.languageName + " Learning • " + t.name + '</h1><p class="muted">Word ' + (w + 1) + " of " + total + "</p>" + barHtml(w + 1, total) +
    '<div class="card lesson-card"><div class="pic" aria-hidden="true">' + it.pic + "</div><h2>" + it.en + '</h2><p class="local-word">' + loc(it.local, key) + "</p>" +
    '<div class="btn-row" style="justify-content:center"><button class="btn btn-ghost" aria-label="Listen to ' + it.en + " in " + L.languageName + '" onclick="speak(\'' + it.local + "','" + L.speechCode + '\')">🔊 Listen</button>' +
    '<button class="btn btn-ghost" aria-label="Listen to the English word" onclick="speak(\'' + it.en + '\',\'en-IN\')">🔊 English</button></div><p id="tts-note" class="muted" role="status"></p></div><div class="btn-row">' +
    (w > 0 ? '<a class="btn btn-ghost" href="' + base + (w - 1) + '">← Previous</a>' : "") +
    (w < total - 1 ? '<a class="btn btn-primary" href="' + base + (w + 1) + '">Next →</a>' : '<button class="btn btn-primary" onclick="practiceLesson(\'' + key + "'," + n + ')">Practice →</button>') + "</div>");
}
views.local = function (a) {   // language chooser, used by Learn, Practice and Quiz
  const mode = a[0] || "learn", d = loadData();
  page('<h1>🗣️ Local Language</h1><p class="muted">Choose a language. SmartKids stays in English; only the lessons change.</p><div class="choices choices-2">' +
    ["marathi", "urdu"].map(function (k) { const L = localLanguageData[k]; return '<button class="choice' + (d.language === k ? " selected" : "") + '" onclick="chooseLang(\'' + k + "','" + mode + '\')"><span class="choice-icon" aria-hidden="true">' + SUBJECTS[k].icon + "</span><strong>" + loc(L.nativeName, k) + "</strong><span>" + L.languageName + "</span></button>"; }).join("") + "</div>");
};
function chooseLang(key, mode) { const d = loadData(); d.language = key; saveData(); location.hash = "#" + (mode === "practice" ? "practice/" : mode === "quiz" ? "quiz/" : "learn/") + key; }
function langPracticeMenu(key) {
  const n = SUBJECTS[key].name;
  page("<h1>" + n + ' Practice</h1><p class="muted">Pick an activity.</p><div class="cards"><a class="card lesson-card" href="#practice/' + key + '/go"><div class="pic" style="font-size:3.5rem" aria-hidden="true">🧩</div><h3>Practice Questions</h3><p>Translate, pictures, true or false</p></a>' +
    '<a class="card lesson-card" href="#game/match-' + key + '"><div class="pic" style="font-size:3.5rem" aria-hidden="true">🃏</div><h3>Word Match</h3><p>Match English with ' + n + '</p></a></div><p><a href="#local/practice">Switch language</a></p>');
}

/* ================= ROUTER ================= */
function route() {
  const parts = (location.hash.slice(1) || "home").split("/");
  try { (views[parts[0]] || views.notfound)(parts.slice(1)); } catch (e) { views.notfound(); }
  const map = { lesson: "learn", game: "games", dashboard: "home", "age-selection": "home", results: "quiz", review: "quiz" }, key = map[parts[0]] || parts[0];
  document.querySelectorAll("[data-nav]").forEach(function (a) { a.classList.toggle("active", a.dataset.nav === key); });
  window.scrollTo(0, 0); app.focus({ preventScroll: true });
}
window.addEventListener("hashchange", route);
route();
