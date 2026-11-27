'use strict';
const $ = (s, e = document) => e.querySelector(s);
const view = $('#view');
const ic = id => '<svg class="ic" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- persistência ----------
const KEY = 'fretforge.v1';
function fresh() {
  return { v: 1, sessions: [], routines: seedRoutines(), active: 'r1', fav: [], best: {},
    settings: { latency: 90, step: 5, needClean: 2, thr: 85, sub: 0, subAuto: 1, count: 4, lefty: false, label: 'note', goal: 120, level: 'auto', levelParams: true, planMin: 20, speed: true } };
}
function loadDB() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.v === 1) { d.settings = Object.assign(fresh().settings, d.settings); if (!d.settings.subAuto) { d.settings.sub = 0; d.settings.subAuto = 1; } if (!['auto', '1', '2', '3', '4'].includes(String(d.settings.level))) d.settings.level = 'auto'; return d; } } catch (e) {}
  return fresh();
}
let DB = loadDB();
const save = () => { DB.uat = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} if (typeof Acct !== 'undefined') Acct.dirty(); };
const S = () => DB.settings;
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

// ---------- estatísticas ----------
const dkey = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const fmtH = s => s >= 3600 ? (s / 3600).toFixed(1) + ' h' : Math.round(s / 60) + ' min';
function stats() {
  const ss = DB.sessions, perDay = {}, focus = {};
  let total = 0, bestClean = 0;
  Object.keys(FOCUS).forEach(k => focus[k] = { secs: 0, accSum: 0, accN: 0 });
  ss.forEach(s => {
    total += s.secs; const k = dkey(s.t); perDay[k] = (perDay[k] || 0) + s.secs;
    const f = focus[s.focus]; if (f) { f.secs += s.secs; if (s.acc != null) { f.accSum += s.acc; f.accN++; } }
    if (s.clean > bestClean) bestClean = s.clean;
  });
  Object.values(focus).forEach(f => f.acc = f.accN ? f.accSum / f.accN : null);
  let streak = 0; const d = new Date(); if (!perDay[dkey(d)]) d.setDate(d.getDate() - 1);
  while (perDay[dkey(d)]) { streak++; d.setDate(d.getDate() - 1); }
  const days = []; for (let i = 29; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); days.push({ k: dkey(x), s: perDay[dkey(x)] || 0 }); }
  const mon = new Date(); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const week = ss.filter(s => s.t >= mon.getTime()).reduce((a, s) => a + s.secs, 0);
  return { total, perDay, focus, streak, days, week, bestClean, n: ss.length };
}
function insights(st) {
  const out = [], ss = DB.sessions;
  if (!ss.length) return [{ t: 'warn', m: 'Ainda sem dados. Faça seu primeiro treino para eu começar a analisar seus pontos fortes e fracos.' }];
  const cl = curLevel(), lp = lvlProgress(cl);
  if (cl < 4 && lp.pct >= UNLOCK_AT) out.push({ t: 'good', m: `Você dominou ${lp.mastered}/${lp.total} do Nível ${LEVELS[cl].roman}. Pronto para avançar para o Nível ${LEVELS[cl + 1].roman}.` });
  else out.push({ t: '', m: `Nível ${LEVELS[cl].roman} (${LEVELS[cl].name}): ${lp.mastered}/${lp.total} exercícios dominados. Faltam ${Math.max(0, Math.ceil(UNLOCK_AT * lp.total) - lp.mastered)} para liberar o próximo nível.` });
  if (st.streak >= 3) out.push({ t: 'good', m: `Sequência de ${st.streak} dias seguidos. Consistência vale mais que sessões longas e raras.` });
  else if (!st.perDay[dkey(Date.now())]) out.push({ t: 'warn', m: 'Você ainda não treinou hoje. Dez minutos já mantêm o hábito.' });
  const fa = Object.entries(st.focus).filter(([, f]) => f.accN >= 2).sort((a, b) => a[1].acc - b[1].acc);
  if (fa.length && fa[0][1].acc < 0.8) out.push({ t: 'warn', m: `Ponto fraco: ${FOCUS[fa[0][0]].n} (${Math.round(fa[0][1].acc * 100)}% de precisão). Vou priorizar isso no treino do dia.` });
  const tot = st.total || 1;
  const neglected = Object.entries(st.focus).filter(([, f]) => f.secs / tot < 0.06).map(([k]) => FOCUS[k].n);
  if (neglected.length && st.n >= 5) out.push({ t: '', m: `Pouca prática em: ${neglected.join(', ')}. Um treino equilibrado evita lacunas.` });
  const byEx = {}; ss.forEach(s => (byEx[s.ex] = byEx[s.ex] || []).push(s));
  Object.entries(byEx).forEach(([id, l]) => {
    if (l.length >= 4 && EXMAP[id]) {
      const last3 = l.slice(-3).map(x => x.clean), prev = Math.max(...l.slice(0, -3).map(x => x.clean));
      if (last3.every(c => c <= prev)) out.push({ t: 'warn', m: `Platô em "${EXMAP[id].name}": sem evolução há 3 sessões em ${prev} BPM. Tente baixar 10%, mudar a subdivisão ou treinar em blocos de 30 s.` });
    }
    if (l.length >= 3 && l[l.length - 1].clean > l[0].clean && EXMAP[id]) {
      const g = l[l.length - 1].clean - l[0].clean;
      if (g >= 15) out.push({ t: 'good', m: `Evolução em "${EXMAP[id].name}": +${g} BPM limpos desde a primeira sessão.` });
    }
  });
  const g = S().goal * 60, w = st.week;
  if (g) out.push({ t: w >= g ? 'good' : '', m: w >= g ? 'Meta semanal batida! 🎯' : `Meta semanal: ${Math.round(w / 60)} de ${S().goal} min (${Math.round(100 * w / g)}%).` });
  return out.slice(0, 7);
}
function achievements(st) {
  const A = [['Primeiro treino', st.n >= 1], ['3 dias seguidos', st.streak >= 3], ['7 dias seguidos', st.streak >= 7], ['10 horas de prática', st.total >= 36000],
    ['100 BPM limpos', st.bestClean >= 100], ['Mestre da precisão (≥95%)', DB.sessions.some(s => s.acc != null && s.acc >= 0.95)], ['Explorador: 5 focos', Object.values(st.focus).filter(f => f.secs > 0).length >= 5], ['Meta semanal', S().goal && st.week >= S().goal * 60], ['Primeira estrela dourada ★★★', EX.some(e => starsOf(e.id) === 3)], ['10 exercícios dominados', EX.filter(e => isMastered(e.id)).length >= 10], ['5 missões do dia', (DB.misCount || 0) >= 5], ['Rank Músico', rankOf(totalXP()).i >= 2], ['Primeira revisão espaçada', EX.some(e => (DB.best[e.id] && DB.best[e.id].rv) > 0)]];
  return A.map(([n, ok]) => ({ n, ok: !!ok }));
}

// ---------- níveis e domínio ----------
const isMastered = id => ((DB.best[id] && DB.best[id].clean) || 0) >= MASTER_AT * EXMAP[id].target;
function lvlProgress(l) {
  const ids = LV_EX[l]; let m = 0, s = 0;
  ids.forEach(id => { if (DB.best[id]) s++; if (isMastered(id)) m++; });
  return { total: ids.length, mastered: m, started: s, pct: m / ids.length };
}
function autoLevel() { let r = 4; for (let l = 1; l < 4; l++) if (lvlProgress(l).pct < UNLOCK_AT) { r = l; break; } return Math.max(r, DB.placed || 1); }
function curLevel() { const v = S().level; return v === 'auto' ? autoLevel() : +v; }
// parâmetros de ritmo de aprendizado do exercício em treino (ou do nível atual)
function P() {
  const L = LEVELS[Sess.ex ? Sess.ex.lvl : curLevel()];
  return S().levelParams ? { thr: L.thr, needClean: L.needClean, step: L.step } : { thr: S().thr, needClean: S().needClean, step: S().step };
}


// ---------- gamification: estrelas, XP, rank, revisão espaçada e missão do dia ----------
// estrelas por exercício: 1★ = 50% da meta de BPM limpo, 2★ = 75%, 3★ = dominado (90%)
const starsOf = id => { const b = DB.best[id], e = EXMAP[id]; if (!b || !e) return 0; const r = (b.clean || 0) / e.target; return r >= MASTER_AT ? 3 : r >= 0.75 ? 2 : r >= 0.5 ? 1 : 0; };
const starsHTML = id => { const n = starsOf(id); return `<span class="stars" role="img" aria-label="${n}/3">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`; };
// XP: 10 por minuto treinado + até 20 pela precisão; bônus por recorde, estrela nova, domínio, revisão e missão
const RANKS = [[0, 'Iniciante'], [150, 'Aprendiz'], [500, 'Músico'], [1200, 'Guitarrista'], [2500, 'Virtuoso'], [5000, 'Lenda']];
const baseXP = s => Math.round((s.secs || 0) / 60 * 10) + (s.acc != null ? Math.round(s.acc * 20) : 0);
const sessXP = s => s.xp != null ? s.xp : baseXP(s);
const totalXP = () => DB.sessions.reduce((a, s) => a + sessXP(s), 0) + (DB.bonus || 0);
function rankOf(xp) {
  let i = 0; RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; });
  const nx = RANKS[i + 1];
  return { i, name: RANKS[i][1], next: nx ? nx[1] : null, need: nx ? nx[0] - xp : 0, pct: nx ? Math.round(100 * (xp - RANKS[i][0]) / (nx[0] - RANKS[i][0])) : 100 };
}
// revisão espaçada: exercício dominado volta a ser sugerido após 3, 7, 14, 30 e 60 dias (a cada revisão limpa o intervalo cresce)
const REV_DAYS = [3, 7, 14, 30, 60];
const isDue = id => { const b = DB.best[id]; return !!b && isMastered(id) && (Date.now() - b.t) / 864e5 >= REV_DAYS[Math.min(b.rv || 0, 4)]; };
const dueCount = () => EX.filter(e => e.lvl <= curLevel() && isDue(e.id)).length;
// missão do dia: uma por dia, +30 XP ao cumprir
const MIS_XP = 30;
function ensureMission() {
  const k = dkey(Date.now());
  if (DB.mis && DB.mis.d === k) return DB.mis;
  const n = Math.floor(Date.now() / 864e5) % 4, ul = curLevel(), st = stats();
  let f = null;
  if (n === 3) { const fs = [...new Set(EX.filter(e => e.lvl <= ul).map(e => e.focus))].sort((a, b) => st.focus[a].secs - st.focus[b].secs); f = fs[0]; }
  DB.mis = { d: k, t: n, f, done: false }; save(); return DB.mis;
}
function missionProgress(m) {
  const k = dkey(Date.now()), ts = DB.sessions.filter(s => dkey(s.t) === k);
  if (m.t === 0) { const v = Math.floor(ts.reduce((a, s) => a + s.secs, 0) / 60); return { v: Math.min(15, v), g: 15, unit: ' min' }; }
  if (m.t === 1) return { v: Math.min(3, new Set(ts.map(s => s.ex)).size), g: 3, unit: '' };
  if (m.t === 2) return { v: ts.some(s => s.pr) ? 1 : 0, g: 1, unit: '' };
  return { v: ts.some(s => s.focus === m.f) ? 1 : 0, g: 1, unit: '' };
}
function checkMission() {
  const m = ensureMission(); if (m.done) return '';
  const p = missionProgress(m); if (p.v < p.g) return '';
  m.done = true; DB.bonus = (DB.bonus || 0) + MIS_XP; DB.misCount = (DB.misCount || 0) + 1; save();
  return T('🎯 Missão do dia cumprida!') + ' +' + MIS_XP + ' XP';
}

// ---------- treino do dia (adaptativo, baseado em regras) ----------
function recommend(min) {
  const n = Math.max(2, Math.round(min / 4)), st = stats(), now = Date.now(), ul = curLevel();
  const sc = EX.filter(e => e.lvl <= ul).map(e => {
    const f = st.focus[e.focus], b = DB.best[e.id];
    const weak = f.acc != null ? 1 - f.acc : 0.35;
    const days = b ? Math.min(14, (now - b.t) / 864e5) / 14 : 0.6;
    const due = isDue(e.id);
    const score = 1.6 * weak + 0.9 * days + Math.random() * 0.25 + (e.lvl === ul ? 0.5 : 0) - (isMastered(e.id) ? 0.4 : 0) + (due ? 1.8 : 0);
    let why = b ? `Não treinado há ${Math.max(1, Math.round((now - b.t) / 864e5))} dia(s)` : 'Novo para você';
    if (f.acc != null && f.acc < 0.8) why = `Ponto fraco: ${FOCUS[e.focus].n} (${Math.round(f.acc * 100)}% de precisão)`;
    if (due) why = `Revisão espaçada: dominado, sem treino há ${Math.max(1, Math.round((now - b.t) / 864e5))} dia(s)`;
    return { e, score, why };
  }).sort((a, b) => b.score - a.score);
  const pick = [], cnt = {};
  for (const c of sc) { if ((cnt[c.e.focus] || 0) >= 2) continue; cnt[c.e.focus] = (cnt[c.e.focus] || 0) + 1; pick.push(c); if (pick.length >= n) break; }
  pick.sort((a, b) => ['mech', 'pick'].indexOf(b.e.focus) - ['mech', 'pick'].indexOf(a.e.focus) || a.e.lvl - b.e.lvl);
  return pick.map(c => ({ id: c.e.id, why: c.why }));
}
let TODAY = null;

// ---------- fretboard ----------
function fretboardSVG(ex, lefty, label, horiz) {
  const notes = ex.notes, fr = notes.map(n => n[1]);
  const lo = Math.min(...fr), hi = Math.max(...fr);
  const mob = window.matchMedia && matchMedia('(max-width:759px)').matches;   // celular: braço horizontal, só o trecho que importa, com casas largas (bolinhas maiores)
  const first = lo <= 1 ? 0 : lo, last = hi === 0 ? 5 : Math.max(hi, first + (mob ? 4 : 5)), cols = last - first + 1;
  const g0 = first === 0 ? 0.3 : 1, units = cols - 1 + g0;   // a casa 0 (corda solta) não leva nota: fica estreita, só um respiro entre o nome da corda e a pestana
  const bnd = k => k <= 0 ? 0 : (first === 0 ? k - 1 + g0 : k);
  const mL = 34, mR = 12, W = mob || hi === 0 ? mL + mR + units * 58 : 640, H = 214, cw = (W - mL - mR) / units, X = f => { const c = f - first, x = mL + (bnd(c) + bnd(c + 1)) / 2 * cw; return lefty ? W - x : x; };
  const L = k => { const x = mL + bnd(k) * cw; return lefty ? W - x : x; };
  const Y = s => 28 + (5 - s) * 28;
  let o = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"${hi === 0 ? ` style="max-width:${Math.round(W * (innerWidth >= 1100 ? 2.2 : 1.5))}px"` : ''}>`;
  [3, 5, 7, 9, 12, 15, 17].forEach(f => { if (f >= first && f <= last) { const two = f === 12; (two ? [-14, 14] : [0]).forEach(dy => o += `<circle class="inlay" cx="${X(f)}" cy="${(Y(2) + Y(3)) / 2 + dy * 0}" r="${two ? 6 : 7}" ${two ? `transform="translate(0 ${dy})"` : ''}/>`); } });
  for (let k = 1; k <= cols; k++) o += `<line class="${first === 0 && k === 1 ? 'nut' : 'fret'}" x1="${L(k)}" x2="${L(k)}" y1="${Y(5) - 10}" y2="${Y(0) + 10}"/>`;
  const openS = new Set(notes.filter(n => n[1] === 0).map(n => n[0]));   // corda solta: não desenha bolinha extra, destaca o nome da corda
  for (let s = 0; s < 6; s++) { o += `<line class="strg" data-s="${s}" x1="${L(0)}" x2="${L(cols)}" y1="${Y(s)}" y2="${Y(s)}" stroke-width="${1 + (5 - s) * 0.45}"/>`; if (!openS.has(s)) o += `<text class="slab" x="${lefty ? W - 14 : 14}" y="${Y(s)}">${'EADGBe'[s]}</text>`; }
  o += fretMarks(X, Y(0) + 22, Math.max(first, 1), last);
  for (let f = first; f <= last; f++) o += `<text class="fnum${isMark(f) ? ' mk' : ''}" x="${X(f)}" y="${H - 6}">${f === 0 ? '' : f}</text>`;
  const seen = new Set();
  notes.forEach(([s, f]) => { const k = s + '_' + f; if (seen.has(k)) return; seen.add(k);
    if (f === 0) { const lx = lefty ? W - 14 : 14; o += `<g class="dot open" id="d${k}"><circle cx="${lx}" cy="${Y(s)}" r="11"/><text x="${lx}" y="${Y(s)}">${'EADGBe'[s]}</text></g>`; return; }
    o += `<g class="dot" id="d${k}"><circle cx="${X(f)}" cy="${Y(s)}" r="12"/><text x="${X(f)}" y="${Y(s)}">${label === 'fret' ? f : pcName(OPEN[s] + f)}</text></g>`; });
  return o + '</svg>';
}
function slotLabel(i, sub) { const b = Math.floor(i / sub) + 1, r = i % sub; return sub === 2 ? (r ? '&' : b) : (r === 0 ? b : ['', 'e', '&', 'a'][r]); }
const CHV = {};   // cache: acorde -> digitação mais simples (mesma da seção Acordes)
// formas de pestana "de livro" (a busca automática às vezes sugere variantes com corda solta, menos usadas na prática)
const CHSTD = { E5: { f: [0, 2, 2, -1, -1, -1] }, G5: { f: [3, 5, 5, -1, -1, -1] }, A5: { f: [-1, 0, 2, 2, -1, -1] }, C5: { f: [-1, 3, 5, 5, -1, -1] }, D5: { f: [-1, -1, 0, 2, 3, -1] }, F: { f: [1, 3, 3, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 } }, Bb: { f: [-1, 1, 3, 3, 3, 1], barre: { fret: 1, from: 1, to: 5 } }, Bm: { f: [-1, 2, 4, 4, 3, 2], barre: { fret: 2, from: 1, to: 5 } }, 'F#m': { f: [2, 4, 4, 2, 2, 2], barre: { fret: 2, from: 0, to: 5 } }, Gm: { f: [3, 5, 5, 3, 3, 3], barre: { fret: 3, from: 0, to: 5 } }, Cm: { f: [-1, 3, 5, 5, 4, 3], barre: { fret: 3, from: 1, to: 5 } } };
function chordMini(name) {
  if (CHSTD[name]) return CHSTD[name];
  if (!(name in CHV)) { const c = parseChord(name); CHV[name] = c ? (findVoicings(c.root, QUAL.find(x => x.k === c.q).iv, c.bass)[0] || null) : null; }
  return CHV[name];
}
// exercícios de troca de acordes: os mesmos diagramas da seção Acordes; o acorde da vez fica em destaque
function chordStripHTML(ex) {
  const list = [...new Set(ex.chords || [])]; if (list.length < 2) return '';
  const items = list.map((n, i) => { const v = chordMini(n); return v ? `<div class="cmini${i === 0 ? ' on' : ''}" data-ch="${esc(n)}"><b>${esc(n)}</b>${chordLite(v, parseChord(n).root)}</div>` : ''; }).join('');
  return items ? `<div class="cstrip">${items}</div>` : '';
}
function chordStripOn(name) { document.querySelectorAll('.cmini').forEach(e => e.classList.toggle('on', e.dataset.ch === name)); }
function strumHTML(ex) {
  const arrows = { D: '↓', U: '↑', x: '✕', '-': '·' };
  const strip = chordStripHTML(ex);   // com os diagramas na tela, o nome grande do acorde sai e o rasgueado fica menor
  return `<div class="chord" id="chordNow"${strip ? ' style="display:none"' : ''}>${esc((ex.chords || [''])[0])}</div>${strip}<div class="slots${strip ? ' sm' : ''}" style="grid-template-columns:repeat(${Math.min(8, ex.pattern.length)},1fr)">` +
    ex.pattern.map((p, i) => `<div class="slot ${p === '-' ? 'rest' : ''}" id="sl${i}">${arrows[p]}<small>${slotLabel(i, ex.sub)}</small></div>`).join('') + '</div>';
}

// ---------- sessão de treino ----------
const Sess = { queue: [], qi: 0, ex: null, bpm: 80, sub: 2, run: false, demo: false, passes: [], events: [], ui: -1, cleanStreak: 0, elapsed: 0, lastTick: 0, raf: 0, timer: 0, statusKey: {}, passAcc: null, bestClean: 0, offs: [], loop: false, stopAt: null, ended: false, endT: 0, browse: false, secA: 0, secB: null };
const secRange = () => { const n = Sess.ex.len, a = Math.max(0, Math.min(n - 1, Sess.secA || 0)), b = Math.max(a, Math.min(n - 1, Sess.secB == null ? n - 1 : Sess.secB)); return [a, b, b - a + 1]; };
const secOn = () => { if (!Sess.ex) return false; const [a, b] = secRange(); return a > 0 || b < Sess.ex.len - 1; };
const exSecs = () => (+S().exMin || 2) * 60;
function setQueue(ids, startAt = 0) {
  stopRun(); Sess.queue = ids.map(id => ({ id, done: false })); Sess.qi = startAt; Sess.ex = null; Sess.browse = false;
  if (location.hash === '#/train') render(); else location.hash = '#/train';
}
function dropPass(pass) {
  const before = Sess.events.length; Sess.events = Sess.events.filter(e => e.pass !== pass);
  Sess.ui = Math.max(-1, Sess.ui - (before - Sess.events.length));
}
function loadEx(i) {
  stopRun(); const q = Sess.queue[i]; if (!q) return; Sess.browse = false; Sess.qi = i; const ex = EXMAP[q.id]; Sess.ex = ex;
  Sess.bpm = (DB.best[ex.id] && DB.best[ex.id].last) || ex.bpm; Sess.sub = ex.type === 'rhythm' ? ex.sub : LEVELS[ex.lvl].sub;
  Sess.passes = []; Sess.cleanStreak = 0; Sess.elapsed = 0; Sess.bestClean = 0; Sess.offs = []; Sess.passAcc = null; Sess.statusKey = {}; Sess.loop = false; Sess.stopAt = null; Sess.ended = false; Sess.secA = 0; Sess.secB = ex.len - 1;
}
function secUI() {
  const sa = $('#secA'); if (!sa || !Sess.ex) return; const [a, b] = secRange(); sa.value = a; $('#secB').value = b;
  $('#secInfo').textContent = secOn() ? T('Treinando só o trecho') + ' ' + (a + 1) + '–' + (b + 1) + ' ' + T('em loop. Não conta para o BPM limpo nem para as estrelas.') : T('Escolha início e fim para repetir só uma parte difícil do exercício.');
}
function ensureEx() { if (Sess.queue.length && !Sess.ex) loadEx(Sess.qi); }
function startRun(demo) {
  ensureCtx(); if (Sess.run) stopRun();
  Sess.run = true; Sess.demo = demo; Sess.events = []; Sess.ui = -1; Sess.step = 0; Sess.nextT = AC.currentTime + 0.2; Sess.countBeats = Math.max(0, Math.min(4, S().count == null ? 4 : +S().count)); Sess.countSteps = Sess.countBeats * Sess.sub; Sess.playStart = null; Sess.beats = [];
  Sess.curPass = 0; Sess.lastTick = performance.now(); Sess.statusKey = {}; clearBoardStatus(); Sess.stopAt = null; Sess.ended = false; { const dn = $('#done'); if (dn) dn.style.display = 'none'; }
  Mic.lat = S().latency / 1000;
  Sess.timer = setInterval(schedule, 25); Sess.raf = requestAnimationFrame(frame); refreshCtl();
}
// parou o exercício: o microfone não fica ligado à toa (liga de novo sozinho no próximo Iniciar)
function micOff() { if (Mic.on) Mic.stop(); refreshCtl(); showRate(false); }
function runDone() {
  stopRun(); micOff(); clearBoardStatus();
  const dn = $('#done'); if (dn) dn.style.display = 'flex';
}
function stopRun() { Sess.run = false; clearInterval(Sess.timer); cancelAnimationFrame(Sess.raf); $('#cd') && ($('#cd').style.display = 'none'); refreshCtl(); }
function schedule() {
  const ex = Sess.ex; if (!Sess.run) return;
  while (Sess.nextT < AC.currentTime + 0.2) {
    const sub = Sess.sub, dur = 60 / Sess.bpm / sub, i = Sess.step, t = Sess.nextT;
    if (Sess.stopAt != null && i - Sess.countSteps >= Sess.stopAt) { if (!Sess.ended) { Sess.ended = true; Sess.endT = t; } Sess.nextT = Infinity; break; }
    if (i % sub === 0) { const cm = S().clickMode || 'on'; if (cm === 'on' || (cm === 'count' && i < Sess.countSteps)) click(t, S().clickAcc !== false && (i / sub) % 4 === 0, (S().clickVol == null ? 100 : +S().clickVol) / 100); Sess.beats.push({ t, n: (i / sub) % 4, ci: i < Sess.countSteps }); }
    const ni = i - Sess.countSteps;
    if (ni >= 0) {
      if (ni === 0) Sess.playStart = t;
      const len = ex.len, [sa, sb, L] = secRange(), pos = sa + ni % L, pass = Math.floor(ni / L);
      const ev = { t, pos, pass, dur, res: null, last: ni % L === L - 1, first: ni % L === 0 };
      if (ex.type === 'notes') { ev.exp = midiOf(ex.notes[pos]); ev.prev = midiOf(ex.notes[ni > 0 && ni % L === 0 ? sb : (pos + len - 1) % len]); ev.key = ex.notes[pos][0] + '_' + ex.notes[pos][1]; if (Sess.demo) pluck(t, ev.exp, dur); }
      else ev.exp = ex.pattern[pos] !== '-' ? 1 : null;
      Sess.events.push(ev);
    }
    Sess.step++; Sess.nextT += dur;
  }
}
function judge(ev) {
  const ex = Sess.ex;
  if (ex.type === 'notes') {
    const w0 = ev.t - 0.25 * ev.dur, w1 = ev.t + 0.9 * ev.dur;
    const win = Mic.hist.filter(d => d.t >= w0 && d.t <= w1);
    ev.why = null;
    if (!win.length) { ev.why = { k: 'silence' }; return false; }
    if (!win.some(d => d.midi === ev.exp)) {   // o que foi ouvido (a nota mais frequente na janela)
      const c = {}; win.forEach(d => { c[d.midi] = (c[d.midi] || 0) + 1; });
      ev.why = { k: 'pitch', heard: +Object.keys(c).sort((x, y) => c[y] - c[x])[0] };
      return false;
    }
    if (ex.rep || ev.prev === ev.exp) { const on = Mic.onsets.some(o => o.t >= w0 && o.t <= w1); if (!on) ev.why = { k: 'attack' }; return on; }
    return true;
  }
  const tol = Math.max(0.09, 0.35 * ev.dur); let best = null;
  Mic.onsets.forEach(o => { const d = o.t - ev.t; if (Math.abs(d) <= tol && (best == null || Math.abs(d) < Math.abs(best))) best = d; });
  if (best != null) Sess.offs.push(best);
  return best != null;
}
function frame() {
  if (!Sess.run) return;
  const now = AC.currentTime, ex = Sess.ex, evs = Sess.events;
  // o que se vê deve coincidir com o que se ouve: desconta o atraso de saída do áudio (maior em Bluetooth)
  const vnow = now - (AC.outputLatency || AC.baseLatency || 0);
  while (Sess.beats.length && Sess.beats[0].t <= vnow) { const b = Sess.beats.shift(); document.querySelectorAll('.beats i').forEach((x, k) => x.classList.toggle('on', k === b.n));
    // contagem regressiva: mostra N, ..., 2, 1 exatamente em cada clique; some quando a primeira nota acende
    const cd = $('#cd'); if (cd && b.ci) { cd.style.display = 'grid'; cd.textContent = Sess.countBeats - b.n; } }
  while (evs[Sess.ui + 1] && evs[Sess.ui + 1].t <= vnow) { Sess.ui++; showCursor(evs[Sess.ui]); }
  if (Mic.on && !Sess.demo) {
    for (const ev of evs) {
      if (ev.res !== null || ev.exp == null && ev.res !== null) continue;
      if (now < ev.t + 0.9 * ev.dur + 0.06) break;
      ev.res = ev.exp == null ? 'skip' : (judge(ev) ? 'hit' : 'miss');
      if (ev.res !== 'skip') paintResult(ev);
      if (ev.last) endPass(ev.pass);
    }
  } else if (!Sess.demo) {
    for (const ev of evs) { if (ev.res !== null) continue; if (now < ev.t + ev.dur) break; ev.res = 'unk'; if (ev.last) { Sess.curPass = ev.pass + 1; dropPass(ev.pass); updHud(); showRate(true); break; } }
  }
  const tn = performance.now(); Sess.elapsed += (tn - Sess.lastTick) / 1000; Sess.lastTick = tn; updHud();
  // duração fixa: ao acabar o tempo, termina a passada em andamento e para (a menos que o loop esteja ligado)
  if (!Sess.loop && !Sess.demo && Sess.stopAt == null && Sess.elapsed >= exSecs()) { const ni = Sess.step - Sess.countSteps, len = secRange()[2]; Sess.stopAt = Math.max(len, Math.ceil(Math.max(ni, 1) / len) * len); }
  if (Sess.ended && now > Sess.endT + 0.3 && (!Sess.events.length || now > Sess.endT + 2)) { runDone(); return; }
  Sess.raf = requestAnimationFrame(frame);
}
function endPass(pass) {
  const evs = Sess.events.filter(e => e.pass === pass && e.res && e.res !== 'skip');
  if (!evs.length) return;
  const acc = evs.filter(e => e.res === 'hit').length / evs.length;
  dropPass(pass);
  passDone(acc);
  applyStatus(); Sess.statusKey = {};
}
function passDone(acc) {
  if (secOn()) { Sess.passAcc = acc; Sess.secPasses = (Sess.secPasses || 0) + 1; Sess.curPass = Sess.passes.length; updHud(); return; }   // treino de trecho: não conta para BPM limpo nem estrelas
  Sess.passes.push({ acc, bpm: Sess.bpm }); Sess.passAcc = acc; Sess.curPass = Sess.passes.length;
  const pp = P(), thr = pp.thr / 100, clean = acc >= thr;
  if (clean) { Sess.cleanStreak++; Sess.bestClean = Math.max(Sess.bestClean, Sess.bpm); } else Sess.cleanStreak = 0;
  if (S().speed) {
    if (clean && Sess.cleanStreak >= pp.needClean) { Sess.bpm = Math.min(240, Sess.bpm + pp.step); Sess.cleanStreak = 0; toast(`🚀 ${Math.round(acc * 100)}% limpo ×${pp.needClean} → ${Sess.bpm} BPM`); }
    else if (acc < 0.6) { Sess.bpm = Math.max(30, Sess.bpm - pp.step); toast(`↓ ${Math.round(acc * 100)}% – voltando para ${Sess.bpm} BPM`); }
  }
  updHud();
}
// a corda da nota da vez vibra e vai assentando (só no braço dos exercícios de notas)
function vibrateString(s) {
  const l = document.querySelector('.board .strg[data-s="' + s + '"]'); if (!l) return;
  l.classList.remove('vib'); void l.getBoundingClientRect(); l.classList.add('vib');
}
function showCursor(ev) {
  const ex = Sess.ex, cd = $('#cd'); if (cd) cd.style.display = 'none';   // fim da contagem
  if (ex.type === 'notes') {
    // só UMA nota acende, no instante do clique (mesma nota repetida também pisca de novo)
    document.querySelectorAll('.dot.cur').forEach(e => e.classList.remove('cur'));
    const n = ex.notes[ev.pos], d = $('#d' + n[0] + '_' + n[1]);
    if (d) { void d.getBoundingClientRect(); d.classList.add('cur'); }
    vibrateString(n[0]);
    if (ev.first) clearBoardStatus();   // resultado da passada anterior some depois de alguns toques
  } else {
    document.querySelectorAll('.slot.cur').forEach(e => e.classList.remove('cur'));
    const s = $('#sl' + ev.pos); if (s) { void s.getBoundingClientRect(); s.classList.add('cur'); }
    if (ex.chords && ev.first) { const c = $('#chordNow'); c && (c.textContent = ex.chords[ev.pass % ex.chords.length], chordStripOn(c.textContent)); }
    if (ev.first) clearBoardStatus();
  }
}
const noteTxt = m => pcName(m) + (Math.floor(m / 12) - 1);
function showWhy(ev) {
  const w = $('#why'); if (!w || !ev.why) return;
  w.textContent = ev.why.k === 'silence' ? '✗ ' + T('Não ouvi som nessa nota')
    : ev.why.k === 'attack' ? '✗ ' + T('Nota certa, mas não detectei uma nova palhetada')
    : '✗ ' + T('Ouvi') + ' ' + noteTxt(ev.why.heard) + ' ' + T('em vez de') + ' ' + noteTxt(ev.exp);
}
function paintResult(ev) {
  // só registra; as cores aparecem de uma vez no fim da passada (nada pisca fora do tempo durante o treino)
  const k = Sess.ex.type === 'notes' ? 'd' + ev.key : 'sl' + ev.pos;
  if (ev.res === 'miss') showWhy(ev);
  if (ev.res === 'miss') Sess.statusKey[k] = 'miss'; else if (Sess.statusKey[k] !== 'miss') Sess.statusKey[k] = 'hit';
  const el = document.getElementById(k); if (el) { el.classList.remove('hit', 'miss'); el.classList.add(Sess.statusKey[k]); markDot(el, Sess.statusKey[k]); }
}
function applyStatus() {
  Object.entries(Sess.statusKey).forEach(([k, v]) => { const el = document.getElementById(k); if (el) { el.classList.remove('hit', 'miss'); el.classList.add(v); markDot(el, v); } });
}
function markDot(el, v) { if (!el.classList.contains('dot')) return; const c = el.querySelector('circle'); if (!c) return; let t = el.querySelector('.mk'); if (!t) { t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('class', 'mk'); el.appendChild(t); } t.setAttribute('x', +c.getAttribute('cx') + 10); t.setAttribute('y', +c.getAttribute('cy') - 10); t.textContent = v === 'miss' ? '\u2717' : '\u2713'; }
function clearBoardStatus() { { const w = $('#why'); if (w) w.textContent = ''; }
  document.querySelectorAll('.dot.hit,.dot.miss,.slot.hit,.slot.miss').forEach(e => e.classList.remove('hit', 'miss')); document.querySelectorAll('.dot .mk').forEach(e => e.remove()); }
function updHud() {
  const g = id => $('#' + id); if (!g('bpm')) return;
  g('bpm').textContent = Sess.bpm;
  if (g('durInfo') && Sess.ex) {
    const ps = secRange()[2] * 60 / Sess.bpm / Sess.sub, nc = P().needClean, fm = x => (x < 90 ? Math.round(x) + ' s' : x < 3600 ? Math.floor(x / 60) + ' min' + (Math.round(x % 60) ? ' ' + Math.round(x % 60) + ' s' : '') : '1 h+');
    g('durInfo').textContent = (Sess.loop ? T('🔁 Loop ligado: sem tempo fixo. Toque em Concluir e salvar quando terminar.')
      : `⏱ ${T('Duração:')} ${fm(exSecs())} · ${T('cada passada')} ≈ ${fm(ps)}` + (S().speed ? ` · ${T('Para subir o BPM:')} ${nc} ${T('passadas limpas seguidas')}` : '') + '. ' + T('No fim você escolhe: continuar em loop ou concluir.'));
  }
  if (!Sess.rateReady) updRate();
  if (g('bpmL')) g('bpmL').textContent = 'BPM (1 clique = 1 tempo) · ' + subText(Sess.ex, Sess.sub);
  g('acc').textContent = Sess.passAcc == null ? '–' : Math.round(Sess.passAcc * 100) + '%';
  g('acc').style.color = Sess.passAcc == null ? '' : Sess.passAcc >= P().thr / 100 ? 'var(--ok)' : Sess.passAcc >= 0.6 ? 'var(--warn)' : 'var(--bad)';
  g('pass').textContent = Sess.passes.length;
  const m = Math.floor(Sess.elapsed / 60), s = Math.floor(Sess.elapsed % 60); g('timer').textContent = m + ':' + String(s).padStart(2, '0') + (Sess.loop ? '' : ' / ' + Math.floor(exSecs() / 60) + ':' + String(exSecs() % 60).padStart(2, '0'));
  g('streak').textContent = S().speed ? `${Sess.cleanStreak}/${P().needClean}` : '–';
  if (g('off')) { const o = Sess.offs.slice(-12); g('off').textContent = o.length ? (o.reduce((a, b) => a + b, 0) / o.length * 1000 >= 0 ? '+' : '') + Math.round(o.reduce((a, b) => a + b, 0) / o.length * 1000) + ' ms' : '–'; }
}
function subText(ex, sub) {
  if (!ex) return '';
  if (ex.type === 'rhythm') return sub + ' divisões por tempo';
  return sub === 1 ? '1 nota por clique' : sub === 2 ? '2 notas por clique (colcheias)' : '4 notas por clique (semicolcheias)';
}
// autoavaliação (sem microfone): painel sempre visível; os botões liberam ao fim de cada passada
function showRate(on) { Sess.rateReady = !!on && !Mic.on; updRate(); }
function updRate() {
  const r = $('#rate'); if (!r) return;
  r.style.display = Mic.on ? 'none' : 'flex';
  r.querySelectorAll('button').forEach(b => { b.disabled = !Sess.rateReady; });
  const i = $('#rateInfo'), ex = Sess.ex;
  if (i && ex) i.textContent = Sess.rateReady ? 'Como foi a última passada?' : `Autoavaliação: libera ao fim de cada passada (${secRange()[2]} notas ≈ ${Math.round(secRange()[2] * 60 / Sess.bpm / Sess.sub)} s).`;
}
// motivo do erro do microfone (antes era uma mensagem genérica); só para de tentar sozinho quando o usuário bloqueou a permissão
function micFail(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') { Mic.denied = true; toast('Microfone bloqueado: libere nas permissões do site e toque no 🎤.'); }
  else if (n === 'NotFoundError' || n === 'OverconstrainedError') toast('Nenhum microfone encontrado. Dá para treinar com autoavaliação.');
  else if (!navigator.mediaDevices) toast('Este navegador não permite microfone aqui (use HTTPS).');
  else toast('Não consegui ligar o microfone (' + (n || 'erro') + (e && e.stage ? ' · ' + e.stage : '') + '). Toque no 🎤 para tentar de novo.');
}
function refreshCtl() {
  const b = $('#btnRun'); if (!b) return;
  b.innerHTML = Sess.run && !Sess.demo ? ic('i-stop') + 'Parar' : ic('i-play') + 'Iniciar'; b.classList.toggle('pri', !(Sess.run && !Sess.demo));
  $('#btnDemo').innerHTML = Sess.run && Sess.demo ? ic('i-stop') + 'Parar demo' : ic('i-vol') + 'Demo';
  { const bm = $('#btnMic'); if (bm) { bm.classList.toggle('on', Mic.on); bm.innerHTML = Mic.on ? '<span class="rec"></span>' : ic('i-mic'); } }
  $('#btnSpeed').classList.toggle('on', S().speed);
  { const bl = $('#btnLoop'); if (bl) bl.classList.toggle('on', Sess.loop); }
}
function finishEx(next) {
  const was = Sess.run; stopRun(); if (Mic.on) Mic.stop();
  if (Sess.ex && Sess.elapsed >= 8) {
    const accs = Sess.passes.map(p => p.acc), acc = accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : null;
    const clean = Math.max(Sess.bestClean, 0);
    const id = Sess.ex.id, wasM = DB.best[id] ? isMastered(id) : false, wasLv = autoLevel(), wasDue = isDue(id), st0 = starsOf(id), rk0 = rankOf(totalXP()).i, prevClean = (DB.best[id] && DB.best[id].clean) || 0;
    const sess = { t: Date.now(), ex: id, focus: Sess.ex.focus, secs: Math.round(Sess.elapsed), acc, bpm: Sess.bpm, clean, pr: clean > prevClean };
    DB.sessions.push(sess);
    const b = DB.best[id] || { n: 0, clean: 0 }; b.n++; b.last = Sess.bpm; b.t = Date.now(); b.clean = Math.max(b.clean || 0, clean); DB.best[id] = b;
    const reviewed = wasDue && clean >= MASTER_AT * Sess.ex.target; if (reviewed) b.rv = (b.rv || 0) + 1;
    const gain = (sess.pr && prevClean ? 15 : 0) + 10 * Math.max(0, starsOf(id) - st0) + (!wasM && isMastered(id) ? 50 : 0) + (reviewed ? 10 : 0);
    sess.xp = baseXP(sess) + gain; save();
    let msg = `Salvo: ${Math.round(Sess.elapsed / 60 * 10) / 10} min${acc != null ? ' · ' + Math.round(acc * 100) + '% de precisão' : ''}${clean ? ' · ' + clean + ' BPM limpos' : ''}`;
    msg += ' · +' + sess.xp + ' XP';
    if (starsOf(id) > st0) msg = '⭐'.repeat(starsOf(id)) + ' ' + msg;
    if (reviewed) msg = '🔁 ' + T('Revisão concluída') + '. ' + msg;
    if (!wasM && isMastered(id)) msg = `🏆 Exercício dominado (${clean}/${Sess.ex.target} BPM)! ` + msg;
    if (autoLevel() > wasLv) msg = `🎉 Nível ${LEVELS[autoLevel()].roman} liberado! ` + msg;
    const mm = checkMission(); if (mm) msg = mm + ' ' + msg;
    if (rankOf(totalXP()).i > rk0) msg = '🎸 ' + T('Novo rank') + ': ' + T(rankOf(totalXP()).name) + '! ' + msg;
    toast(msg);
    const q = Sess.queue[Sess.qi]; if (q) q.done = true;
  }
  if (next === 'stay') { loadEx(Sess.qi); render(); return; }
  const nx = Sess.queue.findIndex((q, i) => i > Sess.qi && !q.done);
  if (nx >= 0) { loadEx(nx); render(); } else { Sess.ex = null; render(); if (was || Sess.queue.some(q => q.done)) toast('🎉 Treino completo!'); }
}

// ---------- views ----------
const NAV = [['home', 'Hoje', 'i-home'], ['vault', 'Biblioteca', 'i-vault'], ['train', 'Treinar', 'i-play'], ['stats', 'Progresso', 'i-stats'], ['metro', 'Metrônomo', 'i-metro'], ['notes', 'Notas', 'i-note'], ['chords', 'Acordes', 'i-chord'], ['tuner', 'Afinador', 'i-tuner'], ['settings', 'Ajustes', 'i-gear']];
const micEnabled = () => S().mic !== false;   // Ajustes: liga o microfone sozinho ao iniciar (padrão: sim); o botão 🎤 funciona sempre
function navHTML(cur) { return NAV.map(([k, n, i]) => `<a href="#/${k}" title="${n}" class="${k === cur ? 'on' : ''}"><svg><use href="#${i}"/></svg><span>${n}</span></a>`).join(''); }
const TOOLS = [['metro', 'Metrônomo', 'i-metro'], ['notes', 'Notas', 'i-note'], ['chords', 'Acordes', 'i-chord'], ['tuner', 'Afinador', 'i-tuner']];
const NAVB = [['home', 'Hoje', 'i-home'], ['train', 'Treinar', 'i-play'], ['vault', 'Biblioteca', 'i-vault'], ['tools', 'Ferramentas', 'i-tools'], ['stats', 'Progresso', 'i-stats']];
const IOS = document.documentElement.classList.contains('ios');   // barra de abas no padrão do iPhone (ver style.css)
function navBotHTML(cur) {
  const inTools = TOOLS.some(t => t[0] === cur);
  return NAVB.map(([k, n, i]) => k === 'tools'
    ? `<button type="button" data-act="toolsMenu" class="${inTools ? 'on' : ''}" aria-haspopup="true"><svg><use href="#${i}${IOS ? '-f' : ''}"/></svg><span>${n}</span></button>`
    : `<a href="#/${k}" title="${n}" class="${k === cur ? 'on' : ''}" ${k === cur ? 'aria-current="page"' : ''}><svg><use href="#${i}${IOS ? '-f' : ''}"/></svg><span>${n}</span></a>`).join('');
}
// o destaque da barra do iPhone desliza até a aba atual (--i = posição; "none" = tela fora das abas)
function navMark(cur) {
  const i = NAVB.findIndex(([k]) => k === cur || (k === 'tools' && TOOLS.some(t => t[0] === cur))), nb = $('#navBot');
  nb.classList.toggle('none', i < 0); if (i >= 0) nb.style.setProperty('--i', i);
}
if (IOS) {
  document.addEventListener('touchstart', () => {}, { passive: true });   // no Safari, libera o efeito de toque (:active)
  $('#navBot').addEventListener('click', e => {   // tocar na aba atual leva ao topo, como nos apps do iPhone
    const a = e.target.closest('a'); if (!a || a.getAttribute('href') !== location.hash) return;
    closeTools(); scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}
function closeTools() { const e = $('#toolsSheet'); if (e) e.remove(); }
const routes = { home: viewHome, vault: viewVault, train: viewTrain, stats: viewStats, metro: viewMetro, notes: viewNotes, chords: viewChords, tuner: viewTuner, settings: viewSettings, quiz: viewQuiz, account: () => Acct.viewAccount() };
let cleanup = () => {};
function render() {
  cleanup(); cleanup = () => {}; stopRun();
  const h = (location.hash || '#/home').slice(2).split('?')[0], r = routes[h] ? h : 'home';
  if (r === 'train') TLOPEN = false;   // dropdown de exercícios sempre começa fechado
  if (r === 'home' && !DB.placed && !DB.placeSkip && !DB.sessions.length) { location.hash = '#/quiz'; return; }
  closeTools(); $('#navTop').innerHTML = navHTML(r); $('#navBot').innerHTML = navBotHTML(r); navMark(r); const gb = $('#gearBtn'); if (gb) gb.classList.toggle('on', r === 'settings');
  view.innerHTML = ''; view.classList.remove('wide', 'wm', 'ws', 'wt'); routes[r](); window.scrollTo(0, 0);
}
addEventListener('hashchange', render);

const pill = k => `<span class="pill" style="background:${FOCUS[k].c}">${FOCUS[k].n}</span>`;
const estMin = ids => ids.length * 4;
function gameHTML() {
  const m = ensureMission(), p = missionProgress(m), xp = totalXP(), rk = rankOf(xp), due = dueCount();
  const title = m.t === 0 ? 'Treine 15 minutos hoje' : m.t === 1 ? 'Conclua 3 exercícios diferentes hoje' : m.t === 2 ? 'Bata um recorde: supere seu BPM limpo em um exercício' : 'Treine esta área hoje:';
  return `<div class="grid g2">
    <div class="card"><div class="row sp"><h2>Missão do dia</h2><span class="tag">${m.done ? '✓' : '+' + MIS_XP + ' XP'}</span></div>
      <div style="margin:6px 0 8px">${title} ${m.t === 3 ? pill(m.f) : ''}</div>
      <div class="meter"><b style="width:${m.done ? 100 : Math.round(100 * p.v / p.g)}%;background:${m.done ? 'var(--ok)' : 'var(--acc)'}"></b></div>
      <div class="small mut" style="margin-top:6px">${m.done ? '✓ ' : ''}${m.done ? '<span>Missão cumprida</span>' : p.v + ' / ' + p.g + p.unit}</div></div>
    <div class="card"><div class="row sp"><h2>${T(rk.name)}</h2><span class="tag">${xp} XP</span></div>
      <div class="meter" style="margin-top:12px"><b style="width:${rk.pct}%"></b></div>
      <div class="small mut" style="margin-top:6px">${rk.next ? `<span>Próximo rank:</span> ${T(rk.next)} · ${rk.need} XP` : '<span>Rank máximo!</span>'}${due ? ` · <span>🔁 ${due}</span> <span>revisões pendentes</span>` : ''}</div></div>
  </div>`;
}
// iPhone/iPad abrindo no navegador (ainda não instalado): ensina a pôr o app na tela de início
const installed = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const installSteps = () => `<ol class="inst small"><li>Toque em Compartilhar no Safari (em alguns iPhones, primeiro em •••)</li><li>Escolha Adicionar à Tela de Início</li><li>Toque em Adicionar</li></ol><div class="mut small">O app instalado pode começar sem o progresso salvo no navegador.</div>`;
const installCard = () => (!IOS || installed() || S().instOk ? '' : `<div class="card instcard"><div class="row sp" style="flex-wrap:nowrap"><b>Instale o SuperPick na tela de início</b><svg class="ishare" aria-hidden="true"><use href="#i-share"/></svg></div><div class="mut small">Abre em tela cheia, com ícone próprio, e funciona sem internet.</div>${installSteps()}<div class="row" style="margin-top:10px"><button class="btn sm" data-act="instOk">Entendi</button></div></div>`);
function viewHome() {
  const st = stats(); if (!TODAY) TODAY = recommend(S().planMin);
  const goal = S().goal * 60, pct = goal ? Math.min(100, Math.round(100 * st.week / goal)) : 0;
  const ins = insights(st).slice(0, 3);
  view.innerHTML = `
  <div class="row sp" style="margin:6px 0 14px"><div><h1>Bora treinar 🎸</h1><div class="mut">Treino que escuta você, ajusta a velocidade e mostra onde evoluir.</div></div></div>
  ${installCard()}
  <div class="dsk"><div class="da">${DB.placed ? '' : '<div class="card row sp" style="margin-bottom:12px"><div><b>Descubra seu nível</b><div class="mut small">Um quiz de 2 minutos para começar no exercício certo.</div></div><button class="btn pri" data-act="qzStart">Fazer o quiz</button></div>'}</div>
  <div class="db"><div class="grid g3 kg">
    <div class="card kpi row"><div class="ring" style="--p:${pct}" data-t="${pct}%"></div><div><div class="l">Meta semanal</div><div class="v" style="font-size:22px">${Math.round(st.week / 60)} / ${S().goal} min</div></div></div>
    <div class="card kpi"><div class="l">Sequência</div><div class="v">🔥 ${st.streak} <span class="mut" style="font-size:14px">dia${st.streak === 1 ? '' : 's'}</span></div></div>
    <a href="#/train" class="card kpi" style="display:block"><div class="l">Nível atual</div><div class="v" style="color:${LEVELS[curLevel()].color}">${LEVELS[curLevel()].roman} <span class="mut" style="font-size:14px">${LEVELS[curLevel()].name} · ${lvlProgress(curLevel()).mastered}/${lvlProgress(curLevel()).total} dominados</span></div></a>
  </div>
  ${Reminder.bannerHTML()}${gameHTML()}</div>
  <div class="dc"><div class="card">
    <div class="row sp"><div><h2>Treino de hoje</h2><div class="mut small">Escolhido pelos seus pontos fracos e pelo que você não pratica há mais tempo.</div></div>
      <div class="row"><select id="planMin" style="width:auto">${[10, 20, 30, 45, 60].map(m => `<option value="${m}" ${m === S().planMin ? 'selected' : ''}>${m} min</option>`).join('')}</select>
      <button class="btn sm" data-act="regen">↻ Gerar outro</button></div></div>
    <div class="grid tlist" style="margin-top:12px">${TODAY.map((p, i) => { const e = EXMAP[p.id]; return `<div class="ex card" style="margin:0"><div class="meta">${pill(e.focus)}<b>${i + 1}. ${esc(e.name)}</b><span class="tag">${LVL[e.lvl]} · ${(DB.best[e.id] && DB.best[e.id].last) || e.bpm} BPM</span></div><div><span class="reason">${esc(p.why)}</span></div></div>`; }).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn pri" data-act="startToday">▶ Começar treino (${TODAY.length} exercícios)</button><button class="btn" data-act="saveToday">Salvar como rotina</button></div>
  </div>
  <div class="grid g2"><div class="card"><h2>Insights</h2>${ins.map(i => `<div class="ins ${i.t}">${esc(i.m)}</div>`).join('')}<a class="btn sm" href="#/stats" style="display:inline-block;margin-top:6px">Ver progresso completo</a></div>
  <div class="card"><div class="row sp"><h2>Minhas rotinas</h2><button class="btn sm" data-act="newRoutine">+ Nova</button></div><div id="routines">${routinesHTML()}</div></div></div></div></div>
  <div class="mut small" style="text-align:center;margin:18px 0 6px"><a href="#/settings" style="color:inherit;text-decoration:none">SuperPick v${APP_VERSION}</a></div>`;
  $('#planMin').onchange = e => { S().planMin = +e.target.value; save(); TODAY = recommend(S().planMin); render(); };
  view.classList.add('wide');
}
let editR = null;
function routinesHTML() {
  return DB.routines.map(r => `<div class="card" style="margin:8px 0;padding:12px"><div class="row sp"><div><b>${esc(r.name)}</b> <span class="tag">${r.items.length} exerc. · ~${estMin(r.items)} min</span></div>
    <div class="row"><button class="btn sm pri" data-act="playR" data-id="${r.id}" ${r.items.length ? '' : 'disabled'}>▶</button><button class="btn sm" data-act="editR" data-id="${r.id}">✎</button><button class="btn sm danger" data-act="delR" data-id="${r.id}">🗑</button></div></div>
    ${editR === r.id ? `<div class="qlist" style="margin-top:8px">${r.items.map((id, i) => `<div class="qi"><span style="flex:1">${esc(EXMAP[id].name)}</span><button class="btn sm" data-act="mvR" data-id="${r.id}" data-i="${i}" data-d="-1">↑</button><button class="btn sm" data-act="mvR" data-id="${r.id}" data-i="${i}" data-d="1">↓</button><button class="btn sm danger" data-act="rmR" data-id="${r.id}" data-i="${i}">✕</button></div>`).join('') || '<div class="mut small">Vazia: adicione exercícios na Biblioteca.</div>'}<button class="btn sm" data-act="renR" data-id="${r.id}">Renomear</button></div>` : ''}</div>`).join('');
}
const VF = { q: '', focus: 'all', lvl: 'all', fav: false };
// a área Acordes se divide em três filtros na Biblioteca (não existe mais um filtro só "Acordes")
const CHKIND = { chOpen: 'Acordes abertos', chBarre: 'Acordes com pestana', chPower: 'Power chords' };
const CH_BARRE = new Set(['F', 'Bb', 'Bm', 'F#m', 'Gm', 'Cm']);
const chordKinds = e => e.kinds || [chordKind(e)];   // trocas mistas aparecem em mais de um filtro
function chordKind(e) {
  if (e.focus !== 'chords') return null;
  if (/power/i.test(e.id + ' ' + e.name)) return 'chPower';
  if (/pestana|barre|formas móveis|duas formas/i.test(e.id + ' ' + e.name) || (e.chords || []).some(c => CH_BARRE.has(c))) return 'chBarre';
  return 'chOpen';
}
function viewVault() {
  view.innerHTML = `<div class="row sp"><h1>Biblioteca</h1><span class="mut small" id="vcount"></span></div>
  <div class="vlay"><aside class="vside"><div class="card"><input type="search" id="vq" aria-label="Buscar exercício" placeholder="Buscar exercício…" value="${esc(VF.q)}">
  <div class="row chips" style="margin-top:10px" id="vfocus"></div>
  <div class="row" style="margin-top:10px"><select id="vlvl" aria-label="Nível" style="width:auto">${['all', 1, 2, 3, 4].map(k => `<option value="${k}" ${VF.lvl === k ? 'selected' : ''}>${k === 'all' ? 'Todos os níveis' : LVL[k]}</option>`).join('')}</select><label class="small mut vr" for="vact">Adicionar na rotina:</label><select id="vact" style="width:auto" aria-label="Adicionar na rotina" title="Adicionar na rotina">${DB.routines.map(r => `<option value="${r.id}" ${r.id === DB.active ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div></div>
  </aside><div id="vlist" class="grid g2"></div></div>`;
  view.classList.add('wide');
  const fch = () => $('#vfocus').innerHTML = ['all', ...Object.keys(FOCUS).flatMap(k => k === 'chords' ? Object.keys(CHKIND) : [k]), 'fav'].map(k => `<span class="chip ${(k === 'fav' ? VF.fav : VF.focus === k) ? 'on' : ''}" data-act="vf" data-k="${k}">${k === 'all' ? 'Todos' : k === 'fav' ? '★ Favoritos' : CHKIND[k] || FOCUS[k].n}</span>`).join('');
  fch(); vaultList();
  $('#vlvl').onchange = e => { VF.lvl = e.target.value === 'all' ? 'all' : +e.target.value; vaultList(); };
  $('#vq').oninput = e => { VF.q = e.target.value; vaultList(); };
  $('#vact').onchange = e => { DB.active = e.target.value; save(); };
}
function vaultList() {
  // busca: ignora acentos/maiúsculas, aceita várias palavras em qualquer ordem e procura no texto como aparece na tela (idioma escolhido) e no original em português
  const nrm = x => String(x).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const words = nrm(VF.q).split(/\s+/).filter(Boolean);
  const hay = e => nrm([e.name, e.desc, FOCUS[e.focus].n, LVL[e.lvl], T(e.name), T(e.desc), T(FOCUS[e.focus].n), T(LVL[e.lvl])].join(' '));
  const l = EX.filter(e => (VF.focus === 'all' || (CHKIND[VF.focus] ? chordKinds(e).includes(VF.focus) : e.focus === VF.focus)) && (VF.lvl === 'all' || e.lvl === VF.lvl) && (!VF.fav || DB.fav.includes(e.id)) && (!words.length || (h => words.every(w => h.includes(w)))(hay(e))));
  $('#vcount').textContent = l.length + ' exercícios';
  $('#vlist').innerHTML = l.map(e => { const b = DB.best[e.id]; return `<div class="card ex" style="margin:0"><div class="meta">${pill(e.focus)}<span class="tag">${LVL[e.lvl]}</span><span class="tag">${e.type === 'rhythm' ? 'ritmo (por ataque)' : e.len + ' notas'}</span>${b ? starsHTML(e.id) : ''}</div>
    <h3>${esc(e.name)}</h3><div class="mut small">${esc(e.desc)}</div><div class="small">Sugerido: ${e.bpm}–${e.target} BPM · ${subText(e, e.type === 'rhythm' ? e.sub : LEVELS[e.lvl].sub)}${b && b.clean ? ` · seu melhor limpo: <b style="color:var(--ok)">${b.clean}</b>` : ''}</div>
    <div class="row"><button class="btn sm pri" data-act="train1" data-id="${e.id}">▶ Treinar</button><button class="btn sm" data-act="addR" data-id="${e.id}">+ Rotina</button><button class="btn sm ${DB.fav.includes(e.id) ? 'on' : ''}" data-act="fav" data-id="${e.id}">${DB.fav.includes(e.id) ? '★' : '☆'}</button><button class="btn sm ghost" data-act="prev" data-id="${e.id}">Ver</button></div><div id="pv-${e.id}"></div></div>`; }).join('') || '<div class="mut">Nada encontrado.</div>';
}
function viewTrain() {
  ensureEx(); const ex = Sess.ex;
  if (!ex || Sess.browse) return viewTrilha();
  const lefty = S().lefty;
  view.innerHTML = `<div style="margin-bottom:10px"><button class="btn sm ghost" data-act="backTrail">← Voltar</button></div><div class="row sp"><div><div class="meta row">${pill(ex.focus)}<span class="tag">${LVL[ex.lvl]}</span><span class="tag">meta ${ex.target} BPM</span></div><h2 style="margin-top:6px">${esc(ex.name)}</h2><div class="mut small">${esc(ex.desc)}</div><div class="small" id="durInfo" style="margin-top:6px"></div></div>
    <div class="tag">${Sess.qi + 1} / ${Sess.queue.length}</div></div>
  <div class="dsk"><div class="da">
  <div class="board" style="margin-top:12px">${ex.type === 'notes' ? fretboardSVG(ex, lefty, S().label) : strumHTML(ex)}<div class="cd" id="cd"></div></div>
  <div class="small" id="why" style="min-height:18px;margin-top:6px;color:var(--bad)"></div></div>
  <div class="db"><div class="hud">
    <div class="box"><div class="bpmrow"><button class="btn sm" data-act="bpm" data-d="-5" aria-label="Diminuir 5 BPM">−5</button><button class="btn sm" data-act="bpm" data-d="-1" aria-label="Diminuir 1 BPM">−</button><div class="v" id="bpm">${Sess.bpm}</div><button class="btn sm" data-act="bpm" data-d="1" aria-label="Aumentar 1 BPM">+</button><button class="btn sm" data-act="bpm" data-d="5" aria-label="Aumentar 5 BPM">+5</button></div><div class="beats"><i id="bt0"></i><i id="bt1"></i><i id="bt2"></i><i id="bt3"></i></div><div class="l" id="bpmL">BPM</div></div>
    <div class="box"><div class="v" id="acc">–</div><div class="l">precisão da passada</div></div>
    <div class="box"><div class="v" id="pass">0</div><div class="l">passadas · limpas seguidas <b id="streak">–</b></div></div>
    <div class="box"><div class="v" id="timer">0:00</div><div class="l">tempo${ex.type === 'rhythm' ? ' · timing <b id="off">–</b>' : ''}</div></div>
  </div>
  <div id="done" class="row card" style="display:none"><span style="flex:1"><b>⏱ Tempo concluído!</b></span><button class="btn pri" data-act="loopOn">🔁 Continuar em loop</button><button class="btn" data-act="finish">Concluir e salvar ▸</button></div>
  <div id="rate" class="row card"><span id="rateInfo">Autoavaliação</span><button class="btn sm" data-act="rate" data-v="1">✓ Limpa</button><button class="btn sm" data-act="rate" data-v="0.5">✗ Com erros</button></div>
  <div class="row actbar"><button class="btn pri" id="btnRun" data-act="run">${ic('i-play')}Iniciar</button><button class="btn" id="btnMic" data-act="mic" title="Ativar microfone" aria-label="Ativar microfone">${ic('i-mic')}</button><button class="btn" id="btnDemo" data-act="demo">${ic('i-vol')}Demo</button></div></div>
  <div class="dc"><details class="card opts" id="opts"><summary><b>${ic('i-sliders')}Opções do exercício</b></summary>
  <div class="row" style="margin-top:12px"><button class="btn" id="btnSpeed" data-act="speed">${ic('i-bolt')}Auto-velocidade</button><button class="btn" id="btnLoop" data-act="loop">${ic('i-loop')}Loop</button>
    ${ex.type === 'notes' ? `<select id="subSel" style="width:auto">${[1, 2, 4].map(v => `<option value="${v}">Notas por clique: ${v}</option>`).join('')}</select>` : ''}</div>
  <div class="optsec"><div class="row" style="gap:8px"><b class="small">${ic('i-range')}Trecho</b><select id="secA" style="width:auto" aria-label="Início do trecho"></select><span class="mut small">até</span><select id="secB" style="width:auto" aria-label="Fim do trecho"></select><button class="btn sm" data-act="secAll">Tudo</button></div><div class="small mut" id="secInfo" style="margin-top:6px"></div></div>
  <div class="optsec"><b class="small">Metrônomo</b>
    <label class="lbl">Clique durante o exercício</label><select data-in="clickMode"><option value="on" ${(S().clickMode || 'on') === 'on' ? 'selected' : ''}>Sempre ligado</option><option value="count" ${S().clickMode === 'count' ? 'selected' : ''}>Só na contagem inicial</option><option value="off" ${S().clickMode === 'off' ? 'selected' : ''}>Mudo (só visual)</option></select>
    <label class="lbl">Volume do clique: <b id="v-clickVol">${S().clickVol == null ? 100 : S().clickVol}</b>%</label><input type="range" min="10" max="100" step="10" value="${S().clickVol == null ? 100 : S().clickVol}" data-in="clickVol">
    <label class="lbl"><input type="checkbox" data-in="clickAcc" ${S().clickAcc !== false ? 'checked' : ''}> Acentuar o tempo 1 de cada compasso</label></div></details>
  <div class="row" style="margin-top:10px"><button class="btn" data-act="finish">Concluir e salvar ▸</button><button class="btn ghost" data-act="skip">Pular</button><button class="btn ghost" data-act="restart">Reiniciar</button><span class="mut small">Dica: use fones para o clique do metrônomo não entrar no microfone. Barra de espaço inicia/para.</span></div>
  <h3 style="margin:18px 0 8px">Fila de hoje</h3><div class="qlist">${Sess.queue.map((q, i) => `<div class="qi ${i === Sess.qi ? 'cur' : ''} ${q.done ? 'done' : ''}" data-act="goQ" data-i="${i}" style="cursor:pointer">${q.done ? '✓' : i + 1}. ${esc(EXMAP[q.id].name)}</div>`).join('')}</div></div></div>`;
  view.classList.add('wide');
  { const sa = $('#secA'), sb = $('#secB'), nm = i => ex.type === 'notes' ? (i + 1) + ' · ' + noteTxt(midiOf(ex.notes[i])) : String(i + 1), opts = Array.from({ length: ex.len }, (_, i) => `<option value="${i}">${nm(i)}</option>`).join('');
    sa.innerHTML = sb.innerHTML = opts; secUI();
    sa.onchange = sb.onchange = () => { stopRun(); Sess.secA = +sa.value; Sess.secB = +sb.value; if (Sess.secB < Sess.secA) { if (document.activeElement === sa) Sess.secB = Sess.secA; else Sess.secA = Sess.secB; } secUI(); updHud(); }; }
  const ss = $('#subSel'); if (ss) { ss.value = Sess.sub; ss.onchange = e => { stopRun(); Sess.sub = +e.target.value; updHud(); }; }
  { const o = $('#opts'); if (o && innerWidth >= 760) o.open = true; }
  refreshCtl(); updHud(); showRate(false);
  const key = e => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Space') { e.preventDefault(); act.run(); }
    else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { e.preventDefault(); act.bpm({ d: (e.code === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 5 : 1) }); }
    else if (e.code === 'KeyM') act.mic();
    else if (e.code === 'KeyD') act.demo();
  };
  addEventListener('keydown', key); cleanup = () => { removeEventListener('keydown', key); stopRun(); if (Mic.on) Mic.stop(); };
}
let TL = null, TLOPEN = false;   // lista de exercícios do nível: recolhida (dropdown) por padrão
function guided(l) {   // sessão guiada: até 4 exercícios do nível, começando pelos já iniciados e ainda não dominados
  const ids = LV_EX[l], open = ids.filter(id => !isMastered(id));
  const pool = open.length ? open : ids;
  const started = pool.filter(id => DB.best[id]), fresh = pool.filter(id => !DB.best[id]);
  return started.concat(fresh).slice(0, 4).sort((a, b) => EXMAP[a].ord - EXMAP[b].ord);
}
function viewTrilha() {
  const cur = curLevel(); if (TL == null) TL = cur;
  const L = LEVELS[TL], pr = lvlProgress(TL), prev = TL > 1 ? lvlProgress(TL - 1) : null, gs = guided(TL);
  view.innerHTML = `<h1>Treinar</h1><div class="mut" style="margin:4px 0 14px">Siga a trilha em ordem. Um nível é recomendado como concluído quando você domina ${Math.round(UNLOCK_AT * 100)}% dos exercícios (BPM limpo ≥ ${Math.round(MASTER_AT * 100)}% da meta).</div>
  ${Sess.queue.length && Sess.ex ? `<div class="card row sp" style="margin:0 0 12px"><div><div class="mut small">Exercício em andamento</div><b>${esc(Sess.ex.name)}</b></div><button class="btn pri" data-act="resumeEx">▶ Continuar</button></div>` : ''}
  <div class="grid g4m">${[1, 2, 3, 4].map(l => { const x = LEVELS[l], p = lvlProgress(l);
    return `<div class="card lvl ${TL === l ? 'on' : ''} ${l > cur ? 'lock' : ''}" role="button" tabindex="0" aria-pressed="${TL === l}" data-act="tl" data-l="${l}" style="--c:${x.color}"><div class="roman">${x.roman}</div><b>${x.name}</b><div class="meter" style="margin:8px 0 4px"><b style="width:${Math.round(100 * p.pct)}%;background:${x.color}"></b></div><div class="small mut">${p.mastered}/${p.total} dominados${l === cur ? ' · <b style="color:var(--acc)">você está aqui</b>' : l > cur ? ' · 🔒 recomendado depois' : ' · ✓'}</div></div>`; }).join('')}</div>
  <div class="card" id="lvlDetail" style="--c:${L.color};border-left:4px solid ${L.color};scroll-margin-top:70px"><div class="row sp"><h2>Nível ${L.roman} · ${L.name}</h2><span class="tag">${LVL[TL]}</span></div>
    <p class="mut" style="margin:8px 0">${L.desc}</p>
    <div class="row small"><span class="chip">⏱ ${L.session}</span><span class="chip">🎯 precisão ≥ ${L.thr}%</span><span class="chip">✔ ${L.needClean} passadas limpas para subir</span><span class="chip">↑ passo de ${L.step} BPM</span></div>
    ${TL > cur ? `<div class="ins warn" style="margin-top:12px">Este nível é mais avançado que o seu momento. Recomendo dominar antes ${Math.round(UNLOCK_AT * 100)}% do Nível ${LEVELS[TL - 1].roman} (hoje: ${Math.round(100 * prev.pct)}%). Você pode treinar mesmo assim.</div>` : ''}
    <div class="row" style="margin:14px 0"><button class="btn pri" data-act="guided" data-l="${TL}">▶ Sessão guiada (${gs.length} exercícios, ~${gs.length * 4} min)</button><button class="btn" data-act="startToday2">Treino de hoje</button>${DB.routines.map(r => `<button class="btn sm" data-act="playR" data-id="${r.id}">${esc(r.name)}</button>`).join('')}</div>
    <details class="exdd"${TLOPEN || innerWidth >= 1100 ? ' open' : ''} ontoggle="TLOPEN = this.open"><summary><span>Nível ${L.roman} · ${L.name}</span><span class="mut small">${LV_EX[TL].length} exercícios</span></summary>
    <div class="qlist">${LV_EX[TL].map((id, i) => { const e = EXMAP[id], b = DB.best[id], m = isMastered(id), clean = (b && b.clean) || 0;
      return `<div class="qi" style="flex-wrap:wrap"><span style="width:52px;font-size:14px">${starsHTML(id)}</span><div style="flex:1;min-width:160px"><b>${i + 1}. ${esc(e.name)}</b> ${pill(e.focus)}<div class="mut small">${esc(e.desc)}</div><div class="meter" style="margin-top:6px;max-width:260px"><b style="width:${Math.min(100, Math.round(100 * clean / e.target))}%;background:${m ? 'var(--ok)' : L.color}"></b></div><div class="small mut">${clean ? clean + ' BPM limpos' : 'não iniciado'} · começar em ${e.bpm} · meta ${e.target} BPM · ${subText(e, e.type === 'rhythm' ? e.sub : LEVELS[e.lvl].sub)}</div></div><button class="btn sm pri" data-act="train1" data-id="${id}">▶</button></div>`; }).join('')}</div></details></div>`;
  view.classList.add('wide');
}
function viewStats() {
  const st = stats(), mx = Math.max(60, ...st.days.map(d => d.s)), tot = st.total || 1;
  view.innerHTML = `<h1>Progresso</h1><div class="slay">
  <div class="grid g4m sk" style="margin-top:12px"><div class="card kpi"><div class="v">${fmtH(st.total)}</div><div class="l">tempo total</div></div><div class="card kpi"><div class="v">${st.n}</div><div class="l">sessões</div></div><div class="card kpi"><div class="v">🔥 ${st.streak}</div><div class="l">dias seguidos</div></div><div class="card kpi"><div class="v">${st.bestClean || '–'}</div><div class="l">maior BPM limpo</div></div></div>
  <div class="card s30"><h2>Últimos 30 dias</h2><div class="bars" style="margin-top:12px">${st.days.map((d, i) => `<i class="${i === 29 ? 'today' : ''}" style="height:${Math.max(2, 100 * d.s / mx)}%" title="${d.k}: ${Math.round(d.s / 60)} min"></i>`).join('')}</div></div>
  <div class="grid g2 sg"><div class="card sf"><h2>Foco e precisão</h2>${Object.entries(st.focus).map(([k, f]) => `<div style="margin:10px 0"><div class="row sp small"><span>${pill(k)}</span><span class="mut">${fmtH(f.secs)} · ${f.acc == null ? 'sem dados' : Math.round(f.acc * 100) + '% precisão'}</span></div><div class="meter" style="margin-top:4px"><b style="width:${Math.round(100 * f.secs / tot)}%;background:${FOCUS[k].c}"></b></div></div>`).join('')}</div>
  <div class="card si"><h2>Insights</h2>${insights(st).map(i => `<div class="ins ${i.t}">${esc(i.m)}</div>`).join('')}</div></div>
  <div class="card sev"><h2>Evolução por exercício</h2>${Object.entries(DB.best).filter(([id]) => EXMAP[id]).sort((a, b) => b[1].t - a[1].t).map(([id, b]) => { const e = EXMAP[id]; return `<div style="margin:10px 0"><div class="row sp small"><span>${starsHTML(id)} ${esc(e.name)}</span><span class="mut">${b.clean || 0} / ${e.target} BPM limpos · ${b.n}×</span></div><div class="meter" style="margin-top:4px"><b style="width:${Math.min(100, 100 * (b.clean || 0) / e.target)}%"></b></div></div>`; }).join('') || '<div class="mut">Treine para ver a evolução.</div>'}</div>
  <div class="card sa"><h2>Conquistas</h2><div class="grid g4m" style="margin-top:10px">${achievements(st).map(a => `<div class="ach ${a.ok ? 'on' : ''}">${a.ok ? '🏆 ' : '🔒 '}${a.n}</div>`).join('')}</div></div>
  <div class="row"><button class="btn" data-act="demoData">Carregar dados de exemplo</button><button class="btn" data-act="export">Exportar JSON</button><button class="btn danger" data-act="wipe">Apagar tudo</button></div></div>`;
  view.classList.add('wide');
}
function viewSettings() {
  const s = S(); view.classList.add('wide', 'ws');
  view.innerHTML = `<h1>Ajustes</h1><div class="card" style="margin-top:12px"><label class="lbl" style="margin-top:0">Tema de cores</label><div class="themes">${themePicker()}</div><label class="lbl">Idioma</label><select id="langSel" aria-label="Idioma">${[['pt', 'Português'], ['en', 'English'], ['es', 'Español']].map(([k, n]) => `<option value="${k}" ${LANG === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="card">
  <label class="lbl"><input type="checkbox" data-in="mic" ${micEnabled() ? 'checked' : ''}> Ligar o microfone automaticamente ao iniciar o exercício (o botão 🎤 continua disponível para ligar quando quiser)</label>
  <label class="lbl">Meu nível</label><select data-in="level"><option value="auto" ${s.level === 'auto' ? 'selected' : ''}>Automático (pelo seu domínio dos exercícios)</option>${Object.entries(LVL).map(([k, v]) => `<option value="${k}" ${String(s.level) === k ? 'selected' : ''}>${v} · ${LEVELS[k].name}</option>`).join('')}</select>
  <div class="row" style="margin-top:8px"><button class="btn sm" data-act="qzStart">Refazer o quiz de nível</button>${DB.placed ? `<span class="mut small">Último resultado: Nível ${LEVELS[DB.placed].roman}</span>` : ''}</div>
  <label class="lbl"><input type="checkbox" data-in="levelParams" ${s.levelParams ? 'checked' : ''}> Usar o ritmo de aprendizado de cada nível (recomendado). Desmarque para usar os valores manuais abaixo.</label>
  <label class="lbl">Meta semanal: <b id="v-goal">${s.goal}</b> min</label><input type="range" min="0" max="600" step="10" value="${s.goal}" data-in="goal">
  <label class="lbl">Precisão para a passada contar como limpa: <b id="v-thr">${s.thr}</b>%</label><input type="range" min="60" max="100" step="1" value="${s.thr}" data-in="thr">
  <label class="lbl">Passadas limpas seguidas para subir o BPM: <b id="v-needClean">${s.needClean}</b></label><input type="range" min="1" max="5" value="${s.needClean}" data-in="needClean">
  <label class="lbl">Quanto subir/descer o BPM: <b id="v-step">${s.step}</b></label><input type="range" min="1" max="10" value="${s.step}" data-in="step">
  <label class="lbl">Latência do dispositivo: <b id="v-latency">${s.latency}</b> ms</label><input type="range" min="0" max="300" step="5" value="${s.latency}" data-in="latency">
  <div class="row" style="margin-top:6px"><button class="btn sm" data-act="calib">Calibrar automaticamente</button><span class="mut small">Precisa de microfone e alto-falante (sem fones). Compensa o atraso entre ouvir o clique e o som voltar.</span></div>
  <label class="lbl">Duração de cada exercício</label><select data-in="exMin">${[1, 2, 3, 5, 10].map(n => `<option value="${n}" ${(+s.exMin || 2) === n ? 'selected' : ''}>${n} min</option>`).join('')}</select>
  <label class="lbl">Contagem regressiva antes de começar</label><select data-in="count">${[4, 3, 2, 1, 0].map(n => `<option value="${n}" ${+s.count === n ? 'selected' : ''}>${n ? n + (n === 1 ? ' tempo' : ' tempos') + ' (' + Array.from({ length: n }, (_, i) => n - i).join(', ') + ')' : 'Sem contagem'}</option>`).join('')}</select>
  <div class="mut small" style="margin-top:4px">Cada número aparece junto com um clique do metrônomo; a primeira nota vem logo depois do 1.</div>
  <label class="lbl">Rótulo das bolinhas no braço</label><select data-in="label"><option value="note" ${s.label === 'note' ? 'selected' : ''}>Nome da nota</option><option value="fret" ${s.label === 'fret' ? 'selected' : ''}>Número da casa</option></select>
  <label class="lbl">Nomes das notas</label><select data-in="names"><option value="cifra" ${s.names !== 'solfejo' ? 'selected' : ''}>Cifra (C D E F G A B)</option><option value="solfejo" ${s.names === 'solfejo' ? 'selected' : ''}>Solfejo (Dó Ré Mi Fá Sol Lá Si)</option></select>
  <label class="lbl">Acidentes</label><select data-in="acc"><option value="#" ${s.acc !== 'b' ? 'selected' : ''}>Sustenidos (C#, D#…)</option><option value="b" ${s.acc === 'b' ? 'selected' : ''}>Bemóis (Db, Eb…)</option></select>
  <label class="lbl"><input type="checkbox" data-in="boardV" ${s.boardV !== false ? 'checked' : ''}> Braço na vertical no celular, na tela Notas (bolinhas maiores)</label>
  <label class="lbl"><input type="checkbox" data-in="lefty" ${s.lefty ? 'checked' : ''}> Modo canhoto (espelha o braço)</label></div>
  ${Reminder.settingsHTML()}
  <div class="card"><h2>Sobre</h2><div class="row sp"><div><b>SuperPick</b> <span class="mut">v${APP_VERSION}</span><div class="mut small">${APP_DATE}</div></div><button class="btn sm" data-act="upd">Atualizar app</button></div>
  ${IOS && !installed() ? `<div class="small" style="margin-top:12px"><b>Instale o SuperPick na tela de início</b></div>${installSteps()}` : ''}
  ${APP_NOTES.length ? `<div class="small" style="margin-top:12px"><b>Novidades</b></div><ul class="small mut" style="margin:6px 0 0;padding-left:18px">${APP_NOTES.map(n => `<li>${esc(n[LANG] || n.pt)}</li>`).join('')}</ul>` : ''}</div>
  <div class="card"><h2>Teste do microfone</h2><div class="mut small">Ligue, toque uma corda solta e veja: o nível deve passar de ~20%, a nota detectada deve bater com a corda e cada palhetada deve contar um ataque.</div>
  <div class="row" style="margin:12px 0"><button class="btn pri" id="mtBtn" data-act="mtest">${ic('i-mic')}Ligar teste</button><span class="mut small" id="mtErr"></span></div>
  <div class="meter" style="height:14px"><b id="mtLvl" style="width:0;background:var(--ok)"></b></div>
  <div class="grid g3" style="margin-top:12px"><div class="card kpi" style="margin:0"><div class="v" id="mtNote">–</div><div class="l">nota detectada</div></div><div class="card kpi" style="margin:0"><div class="v" id="mtHz">–</div><div class="l">frequência</div></div><div class="card kpi" style="margin:0"><div class="v" id="mtOn">0</div><div class="l">ataques (últimos 6 s)</div></div></div>
  <div class="small mut" id="mtTip" style="margin-top:10px"></div></div>`;
  let raf = 0, n0 = 0;
  const loop = () => {
    if (Mic.on && $('#mtLvl')) {
      const lv = Math.min(100, Mic.rms * 600); $('#mtLvl').style.width = lv + '%'; $('#mtLvl').style.background = lv < 8 ? 'var(--bad)' : lv > 90 ? 'var(--warn)' : 'var(--ok)';
      const d = Mic.last; $('#mtNote').textContent = d ? noteName(d.midi) + Math.floor(d.midi / 12 - 1) : '–'; $('#mtHz').textContent = d ? d.f.toFixed(1) + ' Hz' : '–';
      $('#mtOn').textContent = Mic.onsets.length;
      $('#mtTip').textContent = lv < 8 ? 'Sinal fraco: aproxime o microfone, aumente o ganho/volume de entrada do sistema ou toque mais forte.' : lv > 90 ? 'Sinal alto demais (pode saturar): afaste um pouco ou reduza o ganho de entrada.' : 'Nível bom.';
    }
    raf = requestAnimationFrame(loop);
  };
  if (Mic.on) { $('#mtBtn').innerHTML = ic('i-stop') + 'Parar teste'; }
  raf = requestAnimationFrame(loop); cleanup = () => cancelAnimationFrame(raf);
}

// ---------- ações ----------
const act = {
  regen() { TODAY = recommend(S().planMin); render(); },
  startToday() { setQueue(TODAY.map(p => p.id)); },
  startToday2() { if (!TODAY) TODAY = recommend(S().planMin); setQueue(TODAY.map(p => p.id)); },
  saveToday() { const n = prompt('Nome da rotina:', 'Treino de ' + new Date().toLocaleDateString('pt-BR')); if (!n) return; DB.routines.push({ id: 'r' + Date.now(), name: n, items: TODAY.map(p => p.id) }); save(); render(); toast('Rotina salva'); },
  newRoutine() { const n = prompt('Nome da rotina:'); if (!n) return; const id = 'r' + Date.now(); DB.routines.push({ id, name: n, items: [] }); DB.active = id; save(); render(); },
  playR(d) { const r = DB.routines.find(x => x.id === d.id); if (r && r.items.length) setQueue(r.items.slice()); },
  editR(d) { editR = editR === d.id ? null : d.id; $('#routines').innerHTML = routinesHTML(); },
  delR(d) { if (!confirm('Apagar esta rotina?')) return; DB.routines = DB.routines.filter(r => r.id !== d.id); if (!DB.routines.find(r => r.id === DB.active)) DB.active = (DB.routines[0] || {}).id; save(); $('#routines').innerHTML = routinesHTML(); },
  mvR(d) { const r = DB.routines.find(x => x.id === d.id), i = +d.i, j = i + +d.d; if (j < 0 || j >= r.items.length) return; [r.items[i], r.items[j]] = [r.items[j], r.items[i]]; save(); $('#routines').innerHTML = routinesHTML(); },
  rmR(d) { DB.routines.find(x => x.id === d.id).items.splice(+d.i, 1); save(); $('#routines').innerHTML = routinesHTML(); },
  renR(d) { const r = DB.routines.find(x => x.id === d.id), n = prompt('Novo nome:', r.name); if (n) { r.name = n; save(); $('#routines').innerHTML = routinesHTML(); } },
  vf(d) { if (d.k === 'fav') VF.fav = !VF.fav; else VF.focus = d.k; viewVault(); },
  vl(d) { VF.lvl = d.k === 'all' ? 'all' : +d.k; viewVault(); },
  train1(d) { setQueue([d.id]); },
  // não apaga nada: confere se o servidor responde, pede o service worker novo e recarrega (sem internet o app continua abrindo)
  async upd() {
    toast('Atualizando…');
    try {
      const c = new AbortController(), t = setTimeout(() => c.abort(), 8000);
      const r = await fetch('version.js?c=' + Date.now(), { cache: 'no-store', signal: c.signal }); const txt = await r.text(); clearTimeout(t);
      if (!r.ok || !/APP_VERSION/.test(txt)) throw new Error('sem resposta');
    } catch (e) { toast('Sem conexão: o app continua como está. Atualize quando a internet voltar.'); return; }
    try { const reg = await navigator.serviceWorker.getRegistration(); reg && await reg.update(); } catch (e) {}
    location.reload();
  },
  tl(d) { TL = +d.l; const y = scrollY; viewTrilha(); if (innerWidth >= 760) { scrollTo(0, y); return; } const c = $('#lvlDetail'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); },   // celular: rola até o nível escolhido; computador: a tela fica onde está
  guided(d) { setQueue(guided(+d.l)); },
  addR(d) { const r = DB.routines.find(x => x.id === DB.active); if (!r) return toast('Crie uma rotina primeiro'); r.items.push(d.id); save(); toast('Adicionado a "' + r.name + '"'); },
  fav(d) { const i = DB.fav.indexOf(d.id); i >= 0 ? DB.fav.splice(i, 1) : DB.fav.push(d.id); save(); vaultList(); },
  prev(d) { const el = $('#pv-' + d.id); if (el.innerHTML) { el.innerHTML = ''; return; } const e = EXMAP[d.id]; el.innerHTML = '<div class="board" style="margin-top:8px">' + (e.type === 'notes' ? fretboardSVG(e, S().lefty, S().label, true) : strumHTML(e)) + '</div>'; },
  async run() {
    ensureEx(); if (!Sess.ex) return;
    if (Sess.run && !Sess.demo) { stopRun(); micOff(); return; }
    if (micEnabled() && !Mic.on && !Mic.denied) { try { await Mic.start(); refreshCtl(); showRate(false); } catch (e) { micFail(e); } }
    startRun(false);
  },
  demo() { if (Sess.run && Sess.demo) stopRun(); else startRun(true); },
  toolsMenu() {
    if ($('#toolsSheet')) return closeTools();
    const cur = (location.hash || '#/home').slice(2).split('?')[0], d = document.createElement('div'); d.id = 'toolsSheet';
    d.innerHTML = `<div class="tsb" data-act="toolsClose"></div><div class="tsp" role="menu">${TOOLS.map(([k, n, i]) => `<a href="#/${k}" role="menuitem" class="${k === cur ? 'on' : ''}"><svg><use href="#${i}"/></svg><span>${n}</span></a>`).join('')}</div>`;
    document.body.appendChild(d);
  },
  toolsClose() { closeTools(); },
  async mic() { if (Mic.on) { Mic.stop(); refreshCtl(); showRate(false); return; } try { await Mic.start(); Mic.denied = false; refreshCtl(); showRate(false); toast('Microfone ligado. Use fones para o clique não ser captado.'); } catch (e) { Mic.denied = false; micFail(e); } },
  loop() { Sess.loop = !Sess.loop; if (Sess.loop) Sess.stopAt = null; refreshCtl(); updHud(); },
  loopOn() { Sess.loop = true; Sess.stopAt = null; Sess.ended = false; startRun(false); refreshCtl(); updHud(); },
  speed() { S().speed = !S().speed; save(); refreshCtl(); updHud(); },
  secAll() { Sess.secA = 0; Sess.secB = Sess.ex.len - 1; stopRun(); secUI(); updHud(); },
  bpm(d) { Sess.bpm = Math.max(30, Math.min(240, Sess.bpm + +d.d)); updHud(); },
  rate(d) { if (!Sess.rateReady) return; passDone(+d.v); showRate(false); },
  finish() { finishEx(); },
  skip() { const nx = Sess.queue.findIndex((q, i) => i > Sess.qi && !q.done); if (nx >= 0) { loadEx(nx); render(); } else toast('Esse é o último exercício'); },
  restart() { loadEx(Sess.qi); render(); },
  backTrail() { stopRun(); micOff(); Sess.browse = true; render(); },
  resumeEx() { Sess.browse = false; render(); },
  goQ(d) { loadEx(+d.i); render(); },
  async mtest() {
    if (Mic.on) { Mic.stop(); $('#mtBtn').innerHTML = ic('i-mic') + 'Ligar teste'; return; }
    try { await Mic.start(); Mic.onsets = []; $('#mtBtn').innerHTML = ic('i-stop') + 'Parar teste'; $('#mtErr').textContent = ''; }
    catch (e) { $('#mtErr').textContent = 'Falhou: ' + (e && e.name === 'NotAllowedError' ? 'permissão negada (libere o microfone no navegador).' : e && e.name === 'NotFoundError' ? 'nenhum microfone encontrado.' : 'use localhost ou HTTPS.'); }
  },
  async calib() {
    toast('Calibrando… fique em silêncio, sem fones');
    try {
      const v = await Mic.calibrate(); if (v == null) return toast('Não ouvi os cliques. Aumente o volume e tente de novo.');
      S().latency = Math.round(v * 1000); S().cal = { fp: await Cal.fp(), at: Date.now(), ms: S().latency }; save(); Cal.hide();
      if (location.hash === '#/settings') viewSettings(); toast('Latência: ' + S().latency + ' ms');
    } catch (e) { micFail(e); }
  },
  calLater() { Cal.hide(true); },
  demoData() {
    const now = Date.now(); const ids = EX.map(e => e.id), out = [];
    for (let d = 29; d >= 0; d--) { if (Math.random() < 0.25) continue; const n = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) { const e = EXMAP[ids[Math.floor(Math.random() * ids.length)]], prog = (30 - d) / 30, bpm = Math.round(e.bpm + (e.target - e.bpm) * prog * 0.8), acc = Math.max(0.4, Math.min(0.99, (e.focus === 'legato' ? 0.6 : 0.78) + prog * 0.15 + (Math.random() - .5) * 0.12));
        out.push({ t: now - d * 864e5 - k * 3e6, ex: e.id, focus: e.focus, secs: 180 + Math.floor(Math.random() * 420), acc, bpm, clean: acc >= .85 ? bpm : Math.round(bpm * .9) }); } }
    DB.sessions = out; DB.best = {}; out.forEach(s => { const b = DB.best[s.ex] || { n: 0, clean: 0 }; b.n++; b.last = s.bpm; b.t = s.t; b.clean = Math.max(b.clean, s.clean); DB.best[s.ex] = b; }); save(); TODAY = null; render(); toast('Dados de exemplo carregados');
  },
  export() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' })); a.download = 'superpick-backup.json'; a.click(); },
  wipe() { if (!confirm('Apagar todos os seus dados? Isso não pode ser desfeito.')) return; DB = fresh(); save(); Acct.forcePush(); TODAY = null; Sess.queue = []; Sess.ex = null; render(); },
};
Object.assign(act, toolActs, quizActs, accActs, tunerActs);
act.theme = d => { S().theme = d.k; save(); applyTheme(); document.querySelectorAll('.th').forEach(b => b.classList.toggle('on', b.dataset.k === d.k)); };
applyTheme();
// teclado: tudo que tem data-act e não é botão/link/campo vira controle focável (Tab) e responde a Enter/Espaço; Esc fecha o menu de Ferramentas
const KBD_SEL = '[data-act]:not(button):not(a):not(input):not(select):not(textarea):not(.tsb)';
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeTools(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches(KBD_SEL)) { e.preventDefault(); e.target.click(); }
});
function kbdify() {
  document.querySelectorAll(KBD_SEL).forEach(el => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    if (el.classList.contains('chip')) el.setAttribute('aria-pressed', el.classList.contains('on') ? 'true' : 'false');
  });
  document.querySelectorAll('.tsb').forEach(el => el.setAttribute('aria-hidden', 'true'));
}
{ let kq = 0; new MutationObserver(() => { if (!kq) kq = setTimeout(() => { kq = 0; kbdify(); }, 30); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); kbdify(); }
document.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a && act[a.dataset.act]) act[a.dataset.act](a.dataset, a); });
document.addEventListener('input', e => {
  const k = e.target.dataset.in; if (!k) return; const t = e.target;
  S()[k] = t.type === 'checkbox' ? t.checked : (t.type === 'range' ? +t.value : t.value); save();
  const v = $('#v-' + k); if (v) v.textContent = t.value;
  if (k === 'tunerSens') Mic.gate = TU_GATE[+t.value - 1];
});

// aviso de calibração do microfone: pergunta uma vez e guarda o resultado junto com uma "impressão" do aparelho
// (plataforma e quantidade de entradas/saídas de áudio). Só volta a perguntar se isso mudar
// (ex.: plugou fones ou trocou de microfone) ou se nunca foi calibrado.
const Cal = (() => {
  let dismissed = false, shown = false;
  async function fp() {
    let d = '';
    try { const l = await navigator.mediaDevices.enumerateDevices(); d = ['audioinput', 'audiooutput'].map(k => l.filter(x => x.kind === k).length).join('/'); } catch (e) {}
    return [navigator.platform || '', d].join('|');
  }
  async function need() { const c = S().cal; return !c || c.fp !== await fp(); }
  function hide(later) { if (later) dismissed = true; const b = $('#calbar'); b && b.remove(); shown = false; }
  async function check() {
    if (shown || dismissed || Sess.run || location.protocol === 'file:' || !navigator.mediaDevices) return;
    // espera a abertura fechar e o quiz acabar, para não cobrir as perguntas
    if ($('#intro.welcome') || (location.hash === '#/quiz' && ((QZ.i >= 0 && QZ.i < QZ_Q.length) || (!DB.placed && !DB.placeSkip)))) { setTimeout(check, 3000); return; }
    if (!(await need())) return;
    shown = true;
    const d = document.createElement('div'); d.id = 'calbar'; d.className = 'updbar'; d.setAttribute('role', 'status');
    d.innerHTML = '<div class="ut"><b>Calibrar o microfone</b><span class="small mut">Leva 4 segundos. Fique em silêncio e sem fones. Só pedimos de novo se o aparelho mudar.</span></div><div class="row"><button class="btn pri sm" data-act="calib">Calibrar</button><button class="btn sm" data-act="calLater">Depois</button></div>';
    document.body.appendChild(d);
  }
  setTimeout(check, 2500);
  try { navigator.mediaDevices.addEventListener('devicechange', () => setTimeout(check, 1500)); } catch (e) {}
  return { fp, check, hide };
})();
// aviso de versão nova: compara a versão publicada com a que está aberta (ao abrir, ao voltar para o app e a cada 30 min)
const Upd = (() => {
  let shown = false, dismissed = false;
  const hadSW = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
  function show() {
    if (shown || dismissed) return; shown = true;
    const d = document.createElement('div'); d.id = 'updbar'; d.setAttribute('role', 'status');
    d.innerHTML = '<div class="ut"><b>Nova versão disponível</b><span class="small mut">Atualize para ver as novidades.</span></div><div class="row"><button class="btn pri sm" data-act="updNow">Atualizar</button><button class="btn sm" data-act="updLater">Depois</button></div>';
    document.body.appendChild(d);
  }
  async function check() {
    if (shown || dismissed || location.protocol === 'file:') return;
    try {
      if ('serviceWorker' in navigator) { const r = await navigator.serviceWorker.getRegistration(); r && r.update().catch(() => {}); }
      const t = await (await fetch('version.js?c=' + Date.now(), { cache: 'no-store' })).text();
      const m = /APP_VERSION\s*=\s*'([^']+)'/.exec(t);
      if (m && m[1] !== APP_VERSION) show();
    } catch (e) {}
  }
  setTimeout(check, 4000); setInterval(check, 30 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  if ('serviceWorker' in navigator && hadSW) navigator.serviceWorker.addEventListener('controllerchange', show);
  return { dismiss() { dismissed = true; const d = $('#updbar'); d && d.remove(); }, check };
})();
act.updNow = () => { if (Sess.run) { toast('Termine ou pare o exercício para atualizar'); return; } act.upd(); };
act.updLater = () => Upd.dismiss();
act.instOk = () => { S().instOk = true; save(); render(); };
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
render();
quizWelcome();
