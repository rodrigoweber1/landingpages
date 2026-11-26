'use strict';
// Ferramentas: Metrônomo, Notas da Guitarra e Buscador de Acordes.
// Carregado antes de app.js; só define funções (nada roda no carregamento).

// ---------- nomes de notas (cifra ou solfejo, sustenido ou bemol) ----------
const PC_SH = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PC_FL = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SO_SH = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
const SO_FL = ['Dó', 'Réb', 'Ré', 'Mib', 'Mi', 'Fá', 'Solb', 'Sol', 'Láb', 'Lá', 'Sib', 'Si'];
const NAT = new Set([0, 2, 4, 5, 7, 9, 11]);
function pcName(m, forceCifra) {
  const pc = ((m % 12) + 12) % 12, fl = S().acc === 'b', so = !forceCifra && S().names === 'solfejo';
  return (so ? (fl ? SO_FL : SO_SH) : (fl ? PC_FL : PC_SH))[pc];
}
// marcações do braço (casas 3, 5, 7, 9, 12 duplo, 15...) desenhadas abaixo das cordas, junto dos números
const MARK = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
const isMark = f => MARK.includes(f);
function fretMarks(X, y, from, to) {
  let o = '';
  MARK.forEach(f => { if (f < from || f > to) return; o += f % 12 === 0 ? `<circle class="fmk" cx="${X(f) - 6}" cy="${y}" r="3.5"/><circle class="fmk" cx="${X(f) + 6}" cy="${y}" r="3.5"/>` : `<circle class="fmk" cx="${X(f)}" cy="${y}" r="3.5"/>`; });
  return o;
}
// ---- braço na vertical (celular): cordas em colunas, casas descendo, como nos diagramas de acorde ----
const useVBoard = () => S().boardV !== false && window.matchMedia && matchMedia('(max-width:759px)').matches;
function vGeom(first, last, lefty) {
  const W = 340, mL = 40, mR = 36, SP = (W - mL - mR) / 5, FH = 44, base = first === 0 ? 1 : first, nutY = 34;
  const X = s => mL + (lefty ? 5 - s : s) * SP, Y = f => (f === 0 ? nutY - 24 : nutY + (f - base + 0.5) * FH);
  return { W, H: nutY + (last - base + 1) * FH + 12, X, Y, nutY, base, FH, rows: last - base + 1 };
}
function vNeckBase(first, last, lefty, g) {
  let o = '';
  const xa = Math.min(g.X(0), g.X(5)) - 8, xb = Math.max(g.X(0), g.X(5)) + 8;
  for (let k = 0; k <= g.rows; k++) o += `<line class="${k === 0 && first === 0 ? 'nut' : 'fret'}" x1="${xa}" x2="${xb}" y1="${g.nutY + k * g.FH}" y2="${g.nutY + k * g.FH}"/>`;
  for (let s = 0; s < 6; s++) o += `<line class="strg" x1="${g.X(s)}" x2="${g.X(s)}" y1="${first === 0 ? 28 : g.nutY}" y2="${g.nutY + g.rows * g.FH}" stroke-width="${1 + (5 - s) * 0.45}"/><text class="slab" x="${g.X(s)}" y="12">${'EADGBe'[s]}</text>`;
  const nx = lefty ? g.W - 16 : 16, mx = lefty ? 16 : g.W - 16;
  for (let f = g.base; f <= last; f++) {
    o += `<text class="fnum${isMark(f) ? ' mk' : ''}" x="${nx}" y="${g.Y(f)}" style="dominant-baseline:middle">${f}</text>`;
    if (isMark(f)) o += f % 12 === 0 ? `<circle class="fmk" cx="${mx}" cy="${g.Y(f) - 8}" r="4"/><circle class="fmk" cx="${mx}" cy="${g.Y(f) + 8}" r="4"/>` : `<circle class="fmk" cx="${mx}" cy="${g.Y(f)}" r="4"/>`;
  }
  return o;
}
const dotFontV = t => (t.length <= 2 ? 13 : t.length === 3 ? 11 : 10);
function notesBoardVSVG() {
  const N = NT.frets, g = vGeom(0, N, S().lefty);
  let o = `<svg viewBox="0 0 ${g.W} ${g.H}" xmlns="http://www.w3.org/2000/svg">` + vNeckBase(0, N, S().lefty, g);
  for (let f = 1; f <= N; f++) for (let s = 0; s < 6; s++) {   // sem bolinhas nas cordas soltas: os nomes das cordas estão no topo
    const pc = (OPEN[s] + f) % 12; if (NT.show === 'nat' && !NAT.has(pc)) continue;
    const cls = 'dot' + (NT.sel != null ? (pc === NT.sel ? ' sel' : ' dim') : ''), t = S().label === 'fret' ? String(f) : pcName(pc);
    o += `<g class="${cls}" data-act="nplay" data-s="${s}" data-f="${f}" style="cursor:pointer"><circle cx="${g.X(s)}" cy="${g.Y(f)}" r="17"/><text x="${g.X(s)}" y="${g.Y(f)}" style="font-size:${dotFontV(t)}px">${t}</text></g>`;
  }
  return o + '</svg>';
}
const dotFont = t => (t.length <= 2 ? 11 : t.length === 3 ? 9 : 8);
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

// ======================================================================
// METRÔNOMO
// ======================================================================
const M = () => { DB.metro = Object.assign({ bpm: 100, beats: 4, sub: 1, accent: true, vol: 0.8, trainer: false, inc: 5, every: 4, max: 160 }, DB.metro || {}); return DB.metro; };
const Metro = { run: false, timer: 0, raf: 0, nextT: 0, step: 0, bar: 0, q: [], taps: [] };
const tempoName = b => (b < 60 ? 'Largo' : b < 76 ? 'Adagio' : b < 108 ? 'Andante' : b < 120 ? 'Moderato' : b < 156 ? 'Allegro' : b < 176 ? 'Vivace' : 'Presto');

function metroStart() {
  ensureCtx(); Metro.run = true; Metro.step = 0; Metro.bar = 0; Metro.q = []; Metro.nextT = AC.currentTime + 0.1;
  Metro.timer = setInterval(metroSched, 25); Metro.raf = requestAnimationFrame(metroFrame); mBtn();
}
function metroStop() { Metro.run = false; clearInterval(Metro.timer); cancelAnimationFrame(Metro.raf); document.querySelectorAll('#mDots i').forEach(i => i.classList.remove('on')); mBtn(); }
function metroSched() {
  const m = M(); if (!Metro.run) return;
  while (Metro.nextT < AC.currentTime + 0.2) {
    const dur = 60 / m.bpm / m.sub, i = Metro.step, per = m.beats * m.sub, pos = i % per;
    const beat = Math.floor(pos / m.sub), first = pos % m.sub === 0;
    click(Metro.nextT, first && beat === 0 && m.accent, (first ? 1 : 0.45) * m.vol);
    if (first) Metro.q.push({ t: Metro.nextT, beat });
    if (pos === per - 1) {   // fim do compasso: treino de velocidade
      Metro.bar++;
      if (m.trainer && Metro.bar % Math.max(1, m.every) === 0 && m.bpm < m.max) { m.bpm = Math.min(m.max, m.bpm + m.inc); Metro.changed = true; }
    }
    Metro.step++; Metro.nextT += dur;
  }
}
function metroFrame() {
  if (!Metro.run) return;
  const vnow = AC.currentTime - (AC.outputLatency || AC.baseLatency || 0);   // visual = som
  while (Metro.q.length && Metro.q[0].t <= vnow) {
    const b = Metro.q.shift();
    document.querySelectorAll('#mDots i').forEach((x, k) => x.classList.toggle('on', k === b.beat));
  }
  if (Metro.changed) { Metro.changed = false; mUpdate(); save(); }
  Metro.raf = requestAnimationFrame(metroFrame);
}
function mBtn() { const b = $('#mRun'); if (b) { b.innerHTML = Metro.run ? ic('i-stop') + 'Parar' : ic('i-play') + 'Iniciar'; b.classList.toggle('pri', !Metro.run); } }
function mDots() { const el = $('#mDots'); if (el) el.innerHTML = Array.from({ length: M().beats }, () => '<i></i>').join(''); }
function mUpdate() {
  const m = M(), g = id => $('#' + id); if (!g('mBpm')) return;
  g('mBpm').textContent = m.bpm; g('mTempo').textContent = tempoName(m.bpm); g('mRange').value = m.bpm;
}
function viewMetro() {
  view.classList.add('wide', 'wm');
  const m = M();
  const sel = (id, opts, cur) => `<select data-tin="${id}">${opts.map(([v, t]) => `<option value="${v}" ${+cur === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  view.innerHTML = `<h1>Metrônomo</h1>
  <div class="card" style="text-align:center;margin-top:12px">
    <div class="mbpm" id="mBpm">${m.bpm}</div><div class="mut">BPM · <b id="mTempo"></b></div>
    <div class="mdots" id="mDots"></div>
    <input type="range" id="mRange" min="30" max="240" value="${m.bpm}" data-tin="mbpm">
    <div class="row" style="justify-content:center;margin-top:10px">
      <button class="btn" data-act="mBpm" data-d="-5">−5</button><button class="btn" data-act="mBpm" data-d="-1">−1</button>
      <button class="btn" data-act="mBpm" data-d="1">+1</button><button class="btn" data-act="mBpm" data-d="5">+5</button></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn pri" id="mRun" data-act="mToggle" style="min-width:140px">${ic('i-play')}Iniciar</button><button class="btn" data-act="mTap">Tap tempo</button></div>
    <div class="mut small" style="margin-top:8px">Barra de espaço inicia/para. Toque em "Tap tempo" no ritmo que quiser para descobrir o BPM.</div>
  </div>
  <div class="card"><div class="grid g3">
    <div><label class="lbl" style="margin-top:0">Tempos por compasso</label>${sel('mbeats', [1, 2, 3, 4, 5, 6, 7, 8].map(n => [n, n + (n === 1 ? ' tempo' : ' tempos')]), m.beats)}</div>
    <div><label class="lbl" style="margin-top:0">Subdivisão</label>${sel('msub', [[1, 'Só os tempos'], [2, 'Colcheias (2 por tempo)'], [3, 'Tercinas (3 por tempo)'], [4, 'Semicolcheias (4 por tempo)']], m.sub)}</div>
    <div><label class="lbl" style="margin-top:0">Volume: <b id="v-mvol">${Math.round(m.vol * 100)}</b>%</label><input type="range" min="10" max="100" value="${Math.round(m.vol * 100)}" data-tin="mvol"></div>
  </div>
  <label class="lbl"><input type="checkbox" data-tin="maccent" ${m.accent ? 'checked' : ''}> Acentuar o primeiro tempo do compasso</label></div>
  <div class="card"><label class="lbl" style="margin-top:0"><input type="checkbox" data-tin="mtrainer" ${m.trainer ? 'checked' : ''}> Treino de velocidade (acelera sozinho)</label>
    <div class="row" style="margin-top:8px">Subir <input type="number" min="1" max="20" value="${m.inc}" data-tin="minc" style="width:70px"> BPM a cada <input type="number" min="1" max="32" value="${m.every}" data-tin="mevery" style="width:70px"> compassos, até <input type="number" min="40" max="240" value="${m.max}" data-tin="mmax" style="width:80px"> BPM</div></div>`;
  mDots(); mUpdate();
  const key = e => { if (e.code === 'Space' && !/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)) { e.preventDefault(); toolActs.mToggle(); } };
  addEventListener('keydown', key); cleanup = () => { removeEventListener('keydown', key); metroStop(); };
}

// ======================================================================
// NOTAS DA GUITARRA
// ======================================================================
const NT = { sel: null, show: 'all', frets: 12, lab: 'name' };
function notesBoardSVG() {
  // no computador a casa 0 (sem bolinhas) vira só um pedaço curto de corda: os nomes ficam perto da pestana; no celular nada muda
  const wide = window.matchMedia && matchMedia('(min-width:760px)').matches;
  const N = NT.frets, W = 1000, H = 232, mL = wide ? 30 : 44, mR = 10, cw = wide ? (W - mL - 14 - mR) / N : (W - mL - mR) / (N + 1), c0 = wide ? 14 : cw, lefty = S().lefty;
  const X = f => { const x = mL + c0 + (f - 0.5) * cw; return lefty ? W - x : x; }, L = k => { const x = mL + (k ? c0 + (k - 1) * cw : 0); return lefty ? W - x : x; }, Y = s => 28 + (5 - s) * 31;
  let o = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].forEach(f => { if (f > N) return; if (f % 12 === 0) { o += `<circle class="inlay" cx="${X(f)}" cy="${(Y(1) + Y(2)) / 2}" r="6"/><circle class="inlay" cx="${X(f)}" cy="${(Y(3) + Y(4)) / 2}" r="6"/>`; } else o += `<circle class="inlay" cx="${X(f)}" cy="${(Y(2) + Y(3)) / 2}" r="6"/>`; });
  for (let k = 1; k <= N + 1; k++) o += `<line class="${k === 1 ? 'nut' : 'fret'}" x1="${L(k)}" x2="${L(k)}" y1="${Y(5) - 10}" y2="${Y(0) + 10}"/>`;
  for (let s = 0; s < 6; s++) { o += `<line class="strg" x1="${L(0)}" x2="${L(N + 1)}" y1="${Y(s)}" y2="${Y(s)}" stroke-width="${1 + (5 - s) * 0.45}"/><text class="slab" x="${lefty ? W - 16 : 16}" y="${Y(s)}">${'EADGBe'[s]}</text>`; }
  o += fretMarks(X, Y(0) + 22, 1, N);
  for (let f = 1; f <= N; f++) o += `<text class="fnum${isMark(f) ? ' mk' : ''}" x="${X(f)}" y="${H - 6}">${f}</text>`;
  for (let s = 0; s < 6; s++) for (let f = 1; f <= N; f++) {   // sem bolinhas nas cordas soltas (casa 0): os nomes das cordas já estão à esquerda
    const pc = (OPEN[s] + f) % 12; if (NT.show === 'nat' && !NAT.has(pc)) continue;
    const cls = 'dot' + (NT.sel != null ? (pc === NT.sel ? ' sel' : ' dim') : ''), t = S().label === 'fret' ? String(f) : pcName(pc);
    o += `<g class="${cls}" data-act="nplay" data-s="${s}" data-f="${f}" style="cursor:pointer"><circle cx="${X(f)}" cy="${Y(s)}" r="13"/><text x="${X(f)}" y="${Y(s)}" style="font-size:${dotFont(t)}px">${t}</text></g>`;
  }
  return o + '</svg>';
}
function notesDraw() {
  if (NT.show === 'nat' && NT.sel != null && !NAT.has(NT.sel)) NT.sel = null;
  $('#nBoard').innerHTML = `<div class="bh">${notesBoardSVG()}</div><div class="bv">${notesBoardVSVG()}</div>`;
  $('#nBoard').classList.toggle('vmob', S().boardV !== false);
  $('#nChips').innerHTML = `<span class="chip ${NT.sel == null ? 'on' : ''}" data-act="nsel" data-pc="-1">Todas</span>` + Array.from({ length: 12 }, (_, pc) => pc).filter(pc => NT.show !== 'nat' || NAT.has(pc)).map(pc => `<span class="chip ${NT.sel === pc ? 'on' : ''}" data-act="nsel" data-pc="${pc}">${pcName(pc)}</span>`).join('');
  const so = S().names === 'solfejo', fl = S().acc === 'b', nat = NT.show === 'nat', on = b => (b ? 'on' : '');
  $('#nCtl').innerHTML = `<label class="small mut">Nomes</label><span class="chip ${on(!so)}" data-act="nname" data-v="cifra">C D E</span><span class="chip ${on(so)}" data-act="nname" data-v="solfejo">Dó Ré Mi</span>
    <label class="small mut" style="margin-left:10px">Acidentes</label><span class="chip ${on(!nat && !fl)}" data-act="nacc" data-v="#">Sustenidos (#)</span><span class="chip ${on(!nat && fl)}" data-act="nacc" data-v="b">Bemóis (b)</span><span class="chip ${on(nat)}" data-act="nacc" data-v="nat">Só naturais</span>`;
}
function viewNotes() {
  view.classList.add('wide');
  view.innerHTML = `<h1>Notas da Guitarra</h1><div class="mut" style="margin:4px 0 12px">Toque em uma nota para ouvir e ver todas as posições dela no braço.</div>
  <div class="card"><div class="row" id="nCtl" style="margin-bottom:12px"></div><div class="row" id="nChips"></div>
    <div class="row" style="margin-top:12px"><label class="small mut">Casas</label><select data-tin="nfrets" style="width:auto">${[12, 15, 19, 22].map(n => `<option value="${n}" ${NT.frets === n ? 'selected' : ''}>0 a ${n}</option>`).join('')}</select>
    <label class="small mut">Rótulo</label><select data-tin="nlab" style="width:auto"><option value="name" ${S().label !== 'fret' ? 'selected' : ''}>Nome da nota</option><option value="fret" ${S().label === 'fret' ? 'selected' : ''}>Número da casa</option></select></div></div>
  <div class="board" id="nBoard" style="overflow-x:auto"></div>
  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3>Cordas soltas</h3><div class="row" style="margin-top:8px">${[5, 4, 3, 2, 1, 0].map(s => `<button class="btn" data-act="nplay" data-s="${s}" data-f="0">${'6EADGB'.length ? ['E', 'B', 'G', 'D', 'A', 'E'][5 - s] : ''} <span class="mut small">${pcName(OPEN[s])}</span></button>`).join('')}</div><div class="mut small" style="margin-top:8px">Da mais fina (1ª) para a mais grossa (6ª). Nomes em cifra e, ao lado, no seu estilo de nomes.</div></div>
    <div class="card"><h3>Regras rápidas</h3><ul class="mut small" style="margin:8px 0 0;padding-left:18px"><li>A casa 12 repete a nota da corda solta (uma oitava acima).</li><li>Entre notas naturais há 2 casas (1 tom), exceto entre <b>Mi–Fá</b> e <b>Si–Dó</b>, que têm 1 casa (meio tom).</li><li>A mesma nota aparece em várias cordas: use as chips acima para ver onde.</li></ul></div></div>`;
  notesDraw();
}

// ======================================================================
// BUSCADOR DE ACORDES
// ======================================================================
const QUAL = [
  { k: '', n: 'Maior', iv: [0, 4, 7], al: ['', 'maj', 'M'] },
  { k: 'm', n: 'Menor', iv: [0, 3, 7], al: ['m', 'min', '-'] },
  { k: '7', n: 'Dominante com sétima', iv: [0, 4, 7, 10], al: ['7'] },
  { k: 'maj7', n: 'Maior com sétima maior', iv: [0, 4, 7, 11], al: ['maj7', 'M7', 'Δ', 'Δ7'] },
  { k: 'm7', n: 'Menor com sétima', iv: [0, 3, 7, 10], al: ['m7', 'min7', '-7'] },
  { k: 'mmaj7', n: 'Menor com sétima maior', iv: [0, 3, 7, 11], al: ['mmaj7', 'm(maj7)', 'mM7'] },
  { k: '6', n: 'Maior com sexta', iv: [0, 4, 7, 9], al: ['6'] },
  { k: 'm6', n: 'Menor com sexta', iv: [0, 3, 7, 9], al: ['m6'] },
  { k: 'sus2', n: 'Suspenso 2', iv: [0, 2, 7], al: ['sus2'] },
  { k: 'sus4', n: 'Suspenso 4', iv: [0, 5, 7], al: ['sus4', 'sus'] },
  { k: '7sus4', n: 'Sétima suspensa', iv: [0, 5, 7, 10], al: ['7sus4'] },
  { k: 'add9', n: 'Maior com nona', iv: [0, 2, 4, 7], al: ['add9'] },
  { k: '9', n: 'Dominante com nona', iv: [0, 2, 4, 7, 10], al: ['9'] },
  { k: 'm9', n: 'Menor com nona', iv: [0, 2, 3, 7, 10], al: ['m9'] },
  { k: 'dim', n: 'Diminuto', iv: [0, 3, 6], al: ['dim', '°'] },
  { k: 'dim7', n: 'Diminuto com sétima', iv: [0, 3, 6, 9], al: ['dim7', '°7'] },
  { k: 'm7b5', n: 'Meio-diminuto', iv: [0, 3, 6, 10], al: ['m7b5', 'ø', 'ø7'] },
  { k: 'aug', n: 'Aumentado', iv: [0, 4, 8], al: ['aug', '+'] },
  { k: '5', n: 'Power chord (quinta)', iv: [0, 7], al: ['5'] },
];
const CH = { root: 0, q: '', bass: null, text: 'C', v: [], seq: null, mode: 'one', stext: 'Am F C G', sv: [] };
const T = s => (typeof tr === 'function' ? tr(s) : s);
// qualidade do buscador -> tipo do sequenciador
const SEQ_Q = { '': 'maj', m: 'min', 7: 'd7', maj7: 'maj7', m7: 'm7', mmaj7: 'mmaj7', 6: 'six', m6: 'm6', sus2: 'sus2', sus4: 'sus4', '7sus4': 's74', add9: 'add9', 9: 'd9', m9: 'm9', dim: 'dim', dim7: 'dim7', m7b5: 'm7b5', aug: 'aug', 5: 'p5' };
const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const IVN = { 0: '1', 2: '9', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♯5', 9: '6', 10: '♭7', 11: '7' };
function parsePc(l, a) { return (LETTER[l.toUpperCase()] + (a === '#' ? 1 : a === 'b' ? -1 : 0) + 12) % 12; }
function parseChord(txt) {
  const t = txt.trim().replace(/♯/g, '#').replace(/♭/g, 'b'); const m = /^([A-Ga-g])([#b]?)(.*)$/.exec(t); if (!m) return null;
  let rest = m[3], bass = null; const sl = rest.split('/'); rest = sl[0].trim();
  if (sl[1] != null) { const b = /^([A-Ga-g])([#b]?)$/.exec(sl[1].trim()); if (!b) return null; bass = parsePc(b[1], b[2]); }
  const q = QUAL.find(x => x.al.includes(rest)); if (!q) return null;
  return { root: parsePc(m[1], m[2]), q: q.k, bass };
}
function chordTitle(c) { const q = QUAL.find(x => x.k === c.q); return pcName(c.root, true) + q.k + (c.bass != null ? '/' + pcName(c.bass, true) : ''); }

function findVoicings(root, iv, bass, limit) {
  const set = new Set(iv.map(i => (root + i) % 12)), req = new Set(iv.length >= 4 ? iv.filter(i => i !== 7).map(i => (root + i) % 12) : [...set]);
  const wantBass = bass != null ? bass : root; if (bass != null) { set.add(bass); req.add(bass); }
  const minSound = iv.length === 2 ? 3 : 4, found = new Map();
  for (let p = 0; p <= 12; p++) {
    const allowOpen = p <= 1, lo = Math.max(p, 1), hi = p + 3, opts = [];
    for (let s = 0; s < 6; s++) { const o = [-1]; if (allowOpen && set.has(OPEN[s] % 12)) o.push(0); for (let f = lo; f <= hi; f++) if (set.has((OPEN[s] + f) % 12)) o.push(f); opts.push(o); }
    const cur = new Array(6);
    const check = () => {
      const snd = []; for (let s = 0; s < 6; s++) if (cur[s] >= 0) snd.push(s);
      if (snd.length < minSound) return;
      for (let k = snd[0]; k <= snd[snd.length - 1]; k++) if (cur[k] < 0) return;            // sem corda muda no meio
      if ((OPEN[snd[0]] + cur[snd[0]]) % 12 !== wantBass) return;                             // grave = fundamental (ou baixo da barra)
      const have = new Set(snd.map(s => (OPEN[s] + cur[s]) % 12)); for (const r of req) if (!have.has(r)) return;
      const fr = snd.filter(s => cur[s] > 0); let fingers = 0, barre = null;
      if (fr.length) {
        const mn = Math.min(...fr.map(s => cur[s])), atMn = fr.filter(s => cur[s] === mn);
        const canBarre = atMn.length >= 2 && atMn[atMn.length - 1] - atMn[0] >= 3 && !snd.some(s => s >= atMn[0] && s <= atMn[atMn.length - 1] && cur[s] === 0);
        if (canBarre) { barre = { fret: mn, from: atMn[0], to: atMn[atMn.length - 1] }; fingers = 1 + fr.filter(s => cur[s] > mn).length; } else fingers = fr.length;
      }
      if (fingers > 4) return;
      const key = cur.join(','); if (found.has(key)) return;
      const fv = fr.map(s => cur[s]), span = fv.length ? Math.max(...fv) - Math.min(...fv) : 0, minF = fv.length ? Math.min(...fv) : 0;
      const muted = 6 - snd.length, hasOpen = snd.some(s => cur[s] === 0);
      const score = fingers + span * 0.5 + minF * 0.25 + muted * 0.8 - snd.length * 0.3 - (hasOpen ? 0.5 : 0) + (barre ? 0.7 : 0);
      found.set(key, { f: cur.slice(), fingers, barre, minF, hasOpen, score });
    };
    const rec = s => { if (s === 6) return check(); for (const f of opts[s]) { cur[s] = f; rec(s + 1); } };
    rec(0);
  }
  return [...found.values()].sort((a, b) => a.score - b.score).slice(0, limit || 6);
}
// ---------- sequência de acordes: posições mais próximas entre si ----------
const SEQ_MAX = 6;
function parseSeq(txt) {
  const parts = txt.replace(/[→>|;,]+/g, ' ').split(/\s+/).filter(Boolean), chords = [], bad = [];
  parts.forEach(p => { const c = parseChord(p); if (c) chords.push(c); else bad.push(p); });
  return { chords, bad };
}
// posição da mão no braço: média das casas apertadas (0 se o acorde só usa cordas soltas)
const vPos = v => { const f = v.f.filter(x => x > 0); return f.length ? f.reduce((a, b) => a + b, 0) / f.length : 0; };
// custo de ir de uma posição para outra: deslocar a mão pesa mais; dedos que ficam no mesmo lugar ajudam
function seqMove(a, b) {
  let ch = 0, com = 0; for (let s = 0; s < 6; s++) { if (b.f[s] > 0) { if (a.f[s] === b.f[s]) com++; else ch++; } }
  return Math.abs(vPos(a) - vPos(b)) + 0.3 * ch - 0.4 * com;
}
// caminho de menor custo total (programação dinâmica): uma posição por acorde
function bestPath(cands) {
  let prev = cands[0].map(v => ({ c: 0.7 * v.score, p: -1 })); const back = [prev];
  for (let i = 1; i < cands.length; i++) {
    const cur = cands[i].map(v => { let best = Infinity, bp = 0; cands[i - 1].forEach((u, j) => { const c = prev[j].c + seqMove(u, v); if (c < best) { best = c; bp = j; } }); return { c: best + 0.7 * v.score, p: bp }; });
    back.push(cur); prev = cur;
  }
  let k = 0; prev.forEach((x, j) => { if (x.c < prev[k].c) k = j; });
  const out = []; for (let i = cands.length - 1; i >= 0; i--) { out[i] = cands[i][k]; k = back[i][k].p; }
  return out;
}
function seqAddOne(root, qk, v) {
  const seq = CH.seq; if (!seq) return false;
  const eng = ChordSequencer.engine, LT = [0, 2, 4, 5, 7, 9, 11], r = eng.roots.find(x => (LT[x[0]] + x[1] + 12) % 12 === root);
  return seq.add({ root: eng.noteName(r[0], r[1], 'en'), q: SEQ_Q[qk], frets: v.f, barre: v.barre });
}
function seqRes() {
  const { chords: all, bad } = parseSeq(CH.stext), chords = all.slice(0, SEQ_MAX), err = $('#chErr'), out = $('#chRes');
  err.textContent = bad.length ? T('Não reconheci:') + ' ' + bad.join(', ') : all.length > SEQ_MAX ? T('Máximo de 6 acordes: usei os 6 primeiros.') : '';
  CH.sv = [];
  if (!chords.length) { out.innerHTML = `<div class="card mut">${T('Escreva de 1 a 6 acordes separados por espaço, por exemplo: Am F C G. Eu mostro as posições mais próximas entre si, abertas ou com pestana, para a troca ficar mais fácil.')}</div>`; return; }
  const cands = chords.map(c => findVoicings(c.root, QUAL.find(x => x.k === c.q).iv, c.bass, 16));
  const miss = chords.filter((c, i) => !cands[i].length).map(c => chordTitle(c));
  const keep = chords.map((c, i) => i).filter(i => cands[i].length);
  if (!keep.length) { out.innerHTML = `<div class="card mut">${T('Sem posições confortáveis')}: ${esc(miss.join(', '))}</div>`; return; }
  const cs = keep.map(i => chords[i]), cd = keep.map(i => cands[i]), path = bestPath(cd), naive = cd.map(c => c[0]);
  const tot = arr => arr.reduce((a, v, i) => a + (i ? Math.abs(vPos(arr[i - 1]) - vPos(v)) : 0), 0), mine = tot(path), base = tot(naive);
  CH.sv = path.map((v, i) => ({ v, c: cs[i] }));
  const cap = i => {
    if (!i) return `<span class="mut small">${T('ponto de partida')}</span>`;
    const a = path[i - 1], b = path[i], d = Math.round(vPos(b) - vPos(a)), com = b.f.filter((f, s) => f > 0 && a.f[s] === f).length;
    const mv = Math.abs(d) < 1 ? `<span>${T('mesma região')}</span>` : `<span>${d > 0 ? T('mão sobe') : T('mão desce')}</span> <b>${Math.abs(d)}</b> <span>${Math.abs(d) === 1 ? T('casa') : T('casas')}</span>`;
    return `<span class="mut small">${mv}${com ? ` · <b>${com}</b> <span>${com === 1 ? T('dedo fica no lugar') : T('dedos ficam no lugar')}</span>` : ''}</span>`;
  };
  out.innerHTML = `<div class="card"><div class="row sp"><div><div class="chtitle" style="font-size:26px">${esc(cs.map(chordTitle).join(' → '))}</div>
    <div class="mut small" style="margin-top:4px">${T('Posições escolhidas para a mão andar o mínimo possível entre os acordes.')}${base - mine >= 1 ? ` <b>${T('Movimento da mão:')} ${mine.toFixed(0)} ${T(mine.toFixed(0) === '1' ? 'casa' : 'casas')}</b> (${T('sem otimizar:')} ${base.toFixed(0)})` : ''}</div></div>
    <div class="row"><button class="btn pri" data-act="chsPlayAll">▶ ${T('Ouvir sequência')}</button><button class="btn" data-act="chsAddAll">+ ${T('Tudo para a prática')}</button></div></div>
    ${miss.length ? `<div class="small" style="margin-top:8px;color:var(--warn)">${T('Sem posições confortáveis')}: ${esc(miss.join(', '))}</div>` : ''}</div>
    <div class="cgrid">${CH.sv.map((x, i) => `<div class="card cv" style="margin:0"><div class="row sp" style="margin-bottom:2px"><b>${i + 1}. ${esc(chordTitle(x.c))}</b><span class="small mut">${x.v.barre ? T('pestana') : x.v.hasOpen ? T('aberto') : ''}</span></div>${chordSVG(x.v)}<div style="min-height:34px;text-align:center">${cap(i)}</div><div class="row" style="gap:8px;flex-wrap:nowrap"><button class="btn sm" data-act="chsPlay" data-i="${i}" style="flex:1" aria-label="${T('Ouvir')}" title="${T('Ouvir')}">▶</button><button class="btn sm" data-act="chsAdd" data-i="${i}" style="flex:1" aria-label="${T('Adicionar à sequência')}" title="${T('Adicionar à sequência')}">+</button></div></div>`).join('')}</div>`;
}
function chordMode() {
  const seq = CH.mode === 'seq', b = $('#chMode'); if (b) { b.setAttribute('aria-pressed', seq); b.classList.toggle('pri', seq); }
  const one = $('#chOne'); if (one) one.style.display = seq ? 'none' : '';
  const bd = $('#chBuild'); if (bd) bd.style.display = seq ? '' : 'none';
  const hint = $('#chHint'); if (hint) hint.style.display = seq ? 'none' : '';
  const inp = $('#chTxt'); if (inp) { inp.placeholder = seq ? T('Digite de 1 a 6 acordes: Am F C G…') : T('Digite um acorde: Am7, C#dim, G/B…'); inp.value = seq ? CH.stext : CH.text; }
  if (seq) seqRes(); else { $('#chErr').textContent = ''; chordRes(); }
}
function chordSVG(v) {
  const fr = v.f.map((f, s) => (f > 0 ? f : null)).filter(x => x != null), mn = fr.length ? Math.min(...fr) : 1, base = fr.length && Math.max(...fr) > 5 ? mn : 1;   // só 'desce' pelo braço quando o acorde não cabe nas 5 primeiras casas
  const X = s => 24 + s * 19, Y = r => 36 + r * 24;
  let o = `<svg viewBox="-9 14 143 148" xmlns="http://www.w3.org/2000/svg">`;
  for (let r = 0; r <= 5; r++) o += `<line class="${r === 0 && base === 1 ? 'nut' : 'fret'}" x1="${X(0)}" x2="${X(5)}" y1="${Y(r)}" y2="${Y(r)}"/>`;
  for (let s = 0; s < 6; s++) o += `<line class="strg" x1="${X(s)}" x2="${X(s)}" y1="${Y(0)}" y2="${Y(5)}" stroke-width="1.2"/>`;
  // número da casa: termina antes da coluna da corda grave, para não ficar embaixo da bolinha (cabe "10ª", "12ª")
  if (base > 1) o += `<text class="fnum" x="12" y="${Y(0) + 17}" style="font-size:12px;font-weight:700;fill:var(--tx);text-anchor:end">${base}ª</text>`;
  if (v.barre && base === 1) o += `<text class="fnum" x="12" y="${Y(v.barre.fret - 1) + 17}" style="font-size:12px;font-weight:700;fill:var(--tx);text-anchor:end">${v.barre.fret}ª</text>`;   // número da casa da pestana
  // pestana: cápsula da altura da casa, maior que as bolinhas (antes ficava escondida atrás delas quando cobria poucas cordas)
  if (v.barre) { const r = v.barre.fret - base; o += `<rect x="${X(v.barre.from) - 13}" y="${Y(r) + 1}" width="${X(v.barre.to) - X(v.barre.from) + 26}" height="22" rx="11" fill="var(--acc)" opacity=".6"/>`; }
  v.f.forEach((f, s) => {
    if (f < 0) { o += `<text class="fnum" x="${X(s)}" y="${Y(0) - 10}" style="font-size:13px">×</text>`; return; }
    if (f === 0) { o += `<circle cx="${X(s)}" cy="${Y(0) - 14}" r="5" fill="none" stroke="var(--strc)" stroke-width="1.5"/>`; return; }
    const t = S().label === 'fret' ? String(f) : pcName(OPEN[s] + f), r = f - base;
    o += `<g class="dot sel"><circle cx="${X(s)}" cy="${Y(r) + 12}" r="9"/><text x="${X(s)}" y="${Y(r) + 12}" style="font-size:${t.length > 2 ? 7 : 9}px">${t}</text></g>`;
  });
  return o + '</svg>';
}
function chordRes() {
  const q = QUAL.find(x => x.k === CH.q), cm = { root: CH.root, q: CH.q, bass: CH.bass };
  const names = q.iv.map(i => pcName(CH.root + i)).join(' · '), ivs = q.iv.map(i => (q.k === 'sus2' && i === 2 ? '2' : q.k === 'add9' && i === 2 ? '9' : IVN[i])).join(' · ');
  CH.v = findVoicings(CH.root, q.iv, CH.bass);
  $('#chRes').innerHTML = `<div class="card"><div class="row sp"><div><div class="chtitle">${esc(chordTitle(cm))}</div><div class="mut">${q.n}${CH.bass != null ? ' · baixo em ' + pcName(CH.bass) : ''}</div></div><button class="btn pri" data-act="chPlay" data-i="-1">▶ Ouvir acorde</button></div>
    <div class="row small" style="margin-top:10px"><span class="chip">Notas: <b>${esc(names)}</b></span><span class="chip">Fórmula: <b>${ivs}</b></span></div></div>
    ${CH.v.length ? `<div class="cgrid">${CH.v.map((v, i) => `<div class="card cv" style="margin:0">${chordSVG(v)}<div class="row" style="gap:8px;flex-wrap:nowrap"><button class="btn sm" data-act="chPlay" data-i="${i}" style="flex:1" aria-label="${T('Ouvir')}" title="${T('Ouvir')}">▶</button><button class="btn sm" data-act="chAdd" data-i="${i}" style="flex:1" aria-label="${T('Adicionar à sequência')}" title="${T('Adicionar à sequência')}">+</button></div></div>`).join('')}</div>` : '<div class="card mut">Não encontrei uma digitação simples (até 4 dedos) para esse acorde com essa nota no baixo.</div>'}`;
}
function chordSync() {
  document.querySelectorAll('#chRoots .chip').forEach(c => c.classList.toggle('on', +c.dataset.pc === CH.root));
  const sel = $('#chQ'); if (sel) sel.value = CH.q;
}
function viewChords() {
  view.classList.add('wide');
  view.innerHTML = `<h1>Buscador de Acordes</h1><div class="mut" style="margin:4px 0 12px">Digite o nome (Am, F#m7, Bb, C7, G/B, Dsus4…) ou escolha a nota e o tipo.</div>
  <div class="card"><div class="row sp" style="margin-bottom:10px"><button type="button" class="btn sm" id="chMode" data-act="chMode" aria-pressed="false" title="Escreva vários acordes e veja as posições mais próximas entre si">Sequência de acordes</button><span class="small mut" id="chHint">Ligue para escrever até 6 acordes</span></div>
    <input type="search" id="chTxt" placeholder="Digite um acorde: Am7, C#dim, G/B…" value="${esc(CH.text)}" data-tin="chtxt">
    <div class="small mut" id="chErr" style="margin-top:6px;min-height:18px"></div>
    <div id="chBuild" style="display:none;margin-top:10px"><div class="row" style="gap:8px"><label class="small mut" for="chsQ">Tipo do acorde</label><select id="chsQ" style="width:auto">${QUAL.map(q => `<option value="${q.k}">${q.n}${q.k ? ' (' + q.k + ')' : ''}</option>`).join('')}</select></div>
      <div class="small mut" style="margin:8px 0 6px">Toque numa nota para adicionar o acorde ao fim da sequência</div>
      <div class="row">${Array.from({ length: 12 }, (_, pc) => `<span class="chip" data-act="chsRoot" data-pc="${pc}">${pcName(pc, true)}</span>`).join('')}</div>
      <div class="row" style="margin-top:10px"><button type="button" class="btn sm" data-act="chsDel">Remover último</button><button type="button" class="btn sm" data-act="chsClr">Limpar</button></div></div>
    <div id="chOne"><div class="row" id="chRoots" style="margin-top:8px">${Array.from({ length: 12 }, (_, pc) => `<span class="chip" data-act="chRoot" data-pc="${pc}">${pcName(pc, true)}</span>`).join('')}</div>
    <div class="row" style="margin-top:10px"><select id="chQ" data-tin="chq" style="width:auto">${QUAL.map(q => `<option value="${q.k}">${q.n}${q.k ? ' (' + q.k + ')' : ''}</option>`).join('')}</select></div></div></div>
  <div id="chRes"></div>
  <div id="seq" style="margin-top:26px"></div>`;
  chordSync(); chordRes(); if (CH.mode === 'seq') chordMode();
  if (window.ChordSequencer) {
    try {
      const seq = ChordSequencer.mount('#seq', { lang: LANG, addButton: false, diagram: v => chordSVG(v), names: () => (S().names === 'solfejo' ? 'es' : 'en'), storageKey: null, onChange: st => { DB.chordSeq = st; save(); } });
      if (DB.chordSeq) seq.setState(DB.chordSeq);
      CH.seq = seq; cleanup = () => { CH.seq = null; seq.destroy(); };
    } catch (e) {}
  }
}
function chordUpdateText() { $('#chTxt').value = chordTitle({ root: CH.root, q: CH.q, bass: CH.bass }); CH.text = $('#chTxt').value; $('#chErr').textContent = ''; }

// ---------- temas de cores ----------
// [chave, nome, fundo, cartão, destaque, apoio, aviso]
const THEMES = [
  ['ardosia', 'Ardósia', '#101114', '#1a1b1f', '#3ed7b7', '#1cb3c1', '#f2cf8a'],
  ['gelo', 'Gelo', '#f5f5f5', '#ffffff', '#007a82', '#117d64', '#a85d00'],
];
function applyTheme() {
  let k = 'ardosia'; try { k = (S().theme) || 'ardosia'; } catch (e) {}
  const t = THEMES.find(x => x[0] === k) || THEMES[0];
  document.documentElement.setAttribute('data-theme', t[0]);
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t[2];
}
function themePicker() {
  const cur = S().theme || 'ardosia';
  return THEMES.map(t => `<button class="th ${t[0] === cur ? 'on' : ''}" data-act="theme" data-k="${t[0]}"><div class="sw">${t.slice(2).map(c => `<i style="background:${c}"></i>`).join('')}</div><b>${t[1]}</b></button>`).join('');
}

// ---------- ações e entradas das ferramentas ----------
const toolActs = {
  mToggle() { Metro.run ? metroStop() : metroStart(); },
  mBpm(d) { const m = M(); m.bpm = clampN(m.bpm + +d.d, 30, 240); mUpdate(); save(); },
  mTap() {
    const t = performance.now(); if (Metro.taps.length && t - Metro.taps[Metro.taps.length - 1] > 2000) Metro.taps = [];
    Metro.taps.push(t); Metro.taps = Metro.taps.slice(-6);
    if (Metro.taps.length >= 2) { const iv = []; for (let i = 1; i < Metro.taps.length; i++) iv.push(Metro.taps[i] - Metro.taps[i - 1]); const avg = iv.reduce((a, b) => a + b, 0) / iv.length; M().bpm = clampN(Math.round(60000 / avg), 30, 240); mUpdate(); save(); }
  },
  nname(d) { S().names = d.v; save(); viewNotes(); },
  nacc(d) { if (d.v === 'nat') NT.show = 'nat'; else { NT.show = 'all'; S().acc = d.v; save(); } viewNotes(); },
  nsel(d) { const pc = +d.pc; NT.sel = pc < 0 || NT.sel === pc ? null : pc; notesDraw(); },
  nplay(d) { ensureCtx(); const s = +d.s, f = +d.f, pc = (OPEN[s] + f) % 12; pluck(AC.currentTime, OPEN[s] + f, 1.6); NT.sel = NT.sel === pc && d.sel !== '1' ? NT.sel : pc; notesDraw(); },
  chRoot(d) { CH.root = +d.pc; if (CH.bass != null) CH.bass = null; chordSync(); chordUpdateText(); chordRes(); },
  chAdd(d) {
    const v = CH.v[+d.i]; if (!CH.seq || !v) return;
    toast(seqAddOne(CH.root, CH.q, v) ? T('Adicionado à sequência') : T('A sequência está cheia'));
  },
  chMode() { CH.mode = CH.mode === 'seq' ? 'one' : 'seq'; chordMode(); },
  chsRoot(d) {
    if (parseSeq(CH.stext).chords.length >= SEQ_MAX) { toast(T('A sequência já tem 6 acordes')); return; }
    const qk = ($('#chsQ') || {}).value || '';
    CH.stext = (CH.stext.trim() + ' ' + pcName(+d.pc, true) + qk).trim(); $('#chTxt').value = CH.stext; seqRes();
  },
  chsDel() { const p = CH.stext.trim().split(/\s+/); p.pop(); CH.stext = p.join(' '); $('#chTxt').value = CH.stext; seqRes(); },
  chsClr() { CH.stext = ''; $('#chTxt').value = ''; seqRes(); },
  chsPlay(d) { ensureCtx(); const x = CH.sv[+d.i]; if (!x) return; x.v.f.forEach((f, s) => { if (f >= 0) pluck(AC.currentTime + s * 0.055, OPEN[s] + f, 1.8); }); },
  chsAdd(d) { const x = CH.sv[+d.i]; if (!CH.seq || !x) return; toast(seqAddOne(x.c.root, x.c.q, x.v) ? T('Adicionado à sequência') : T('A sequência está cheia')); },
  chsPlayAll() {
    ensureCtx(); const t0 = AC.currentTime + 0.05;
    CH.sv.forEach((x, i) => x.v.f.forEach((f, s) => { if (f >= 0) pluck(t0 + i * 1.3 + s * 0.055, OPEN[s] + f, 1.2); }));
    toast(T('Tocando a sequência…'));
  },
  chsAddAll() {
    if (!CH.seq) return; let n = 0;
    for (const x of CH.sv) { if (!seqAddOne(x.c.root, x.c.q, x.v)) break; n++; }
    toast(n === CH.sv.length ? T('Adicionado à sequência') : T('A sequência está cheia'));
  },
  chPlay(d) {
    ensureCtx(); const i = +d.i, q = QUAL.find(x => x.k === CH.q); let midis;
    if (i < 0) { const v = CH.v[0]; if (v) midis = v.f.map((f, s) => (f >= 0 ? OPEN[s] + f : null)).filter(x => x != null); else { const r = 48 + CH.root; midis = q.iv.map(x => r + x); } }
    else midis = CH.v[i].f.map((f, s) => (f >= 0 ? OPEN[s] + f : null)).filter(x => x != null);
    midis.forEach((m, k) => pluck(AC.currentTime + k * 0.055, m, 1.8));
  },
};
const toolIn = {
  mbpm(v) { M().bpm = v; mUpdate(); },
  mbeats(v) { M().beats = v; mDots(); Metro.step = 0; },
  msub(v) { M().sub = v; Metro.step = 0; },
  mvol(v) { M().vol = v / 100; const e = $('#v-mvol'); if (e) e.textContent = v; },
  maccent(v) { M().accent = v; },
  mtrainer(v) { M().trainer = v; Metro.bar = 0; },
  minc(v) { M().inc = clampN(v || 1, 1, 20); }, mevery(v) { M().every = clampN(v || 1, 1, 32); }, mmax(v) { M().max = clampN(v || 40, 40, 240); },
  nshow(v) { NT.show = v; notesDraw(); }, nfrets(v) { NT.frets = v; notesDraw(); }, nlab(v) { S().label = v === 'fret' ? 'fret' : 'note'; save(); notesDraw(); },
  chq(v) { CH.q = v; chordUpdateText(); chordRes(); },
  chtxt(v) {
    if (CH.mode === 'seq') { CH.stext = v; seqRes(); return; }
    // vários acordes digitados no modo de um acorde só: liga a sequência sozinho
    if (/\s/.test(v.trim()) && !parseChord(v) && parseSeq(v).chords.length >= 2) { CH.mode = 'seq'; CH.stext = v; chordMode(); toast(T('Modo sequência ligado')); return; }
    CH.text = v; const c = parseChord(v); const err = $('#chErr'); if (!c) { err.textContent = v.trim() ? 'Não reconheci esse acorde. Exemplos: Am, F#m7, Bb, C7, G/B, Dsus4.' : ''; return; } err.textContent = ''; CH.root = c.root; CH.q = c.q; CH.bass = c.bass; chordSync(); chordRes(); },
};
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.tin; if (!k || !toolIn[k]) return; const t = e.target;
  const v = t.type === 'checkbox' ? t.checked : (t.type === 'range' || t.type === 'number' || t.tagName === 'SELECT') && k !== 'nshow' && k !== 'nlab' && k !== 'chq' ? +t.value : t.value;
  toolIn[k](v, t); if (!k.startsWith('ch') && !k.startsWith('n')) save();
});
