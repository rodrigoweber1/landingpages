'use strict';
// Afinador: automático ou corda por corda, progresso das 6 cordas, afinações alternativas,
// calibração do Lá, tom de referência (curto ou contínuo) e sinal sonoro de "afinado".
// Carregado antes de app.js; só define funções (nada roda no carregamento).

// cordas da 6ª (grave) para a 1ª (aguda), em números MIDI
const TUNINGS = [
  ['std', 'Padrão (E A D G B E)', [40, 45, 50, 55, 59, 64]],
  ['eb', 'Meio tom abaixo (Eb Ab Db Gb Bb Eb)', [39, 44, 49, 54, 58, 63]],
  ['dropd', 'Drop D (D A D G B E)', [38, 45, 50, 55, 59, 64]],
  ['dstd', 'Um tom abaixo (D G C F A D)', [38, 43, 48, 53, 57, 62]],
  ['dropc', 'Drop C (C G C F A D)', [36, 43, 48, 53, 57, 62]],
  ['openg', 'Open G (D G D G B D)', [38, 43, 50, 55, 59, 62]],
  ['opend', 'Open D (D A D F# A D)', [38, 45, 50, 54, 57, 62]],
  ['dadgad', 'DADGAD (D A D G A D)', [38, 45, 50, 55, 57, 62]],
];
const TU_OK = 5, TU_OFF = 12, TU_HOLD = 600;   // cents para "afinado" / para perder o ✓ / tempo estável (ms)
const TU_GATE = [0.03, 0.02, 0.012, 0.007, 0.004];

const Tuner = { done: [false, false, false, false, false, false], sel: 0, mute: 0, osc: null, oscStr: -1, hold: null, adv: null };

function tuCfg() {
  const c = S().tuner || (S().tuner = {});
  if (c.mode !== 'string') c.mode = 'auto';
  if (!TUNINGS.some(t => t[0] === c.tuning)) c.tuning = 'std';
  if (!(c.a4 >= 432 && c.a4 <= 446)) c.a4 = 440;
  if (c.beep == null) c.beep = true;
  c.cont = !!c.cont;
  return c;
}
const tuStrings = () => TUNINGS.find(t => t[0] === tuCfg().tuning)[2];
const tuFreq = m => tuCfg().a4 * Math.pow(2, (m - 69) / 12);

// ---------- sons ----------
function tuToneStop() {
  const o = Tuner.osc; Tuner.osc = null; Tuner.oscStr = -1;
  if (!o) return;
  try { const t = AC.currentTime; o.g.gain.cancelScheduledValues(t); o.g.gain.setValueAtTime(Math.max(0.0001, o.g.gain.value), t); o.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); o.o.stop(t + 0.1); } catch (e) {}
  Tuner.mute = performance.now() + 400; Mic.last = null;
}
function tuRefPlay(i) {
  const freq = tuFreq(tuStrings()[i]);
  if (!tuCfg().cont) { tuToneStop(); tone(freq, 2.5); Tuner.mute = performance.now() + 2700; tuRefMark(); return; }
  if (Tuner.oscStr === i) { tuToneStop(); tuRefMark(); return; }
  tuToneStop(); ensureCtx();
  const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = 'triangle'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.05);
  o.connect(g).connect(AC.destination); o.start(t);
  Tuner.osc = { o, g }; Tuner.oscStr = i; tuRefMark();
}
// dois bipes curtos; a escuta fica pausada para o microfone não "ouvir" o próprio aviso
function tuBeep() {
  if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
  if (!tuCfg().beep || Tuner.osc) return;
  ensureCtx(); const t0 = AC.currentTime;
  [[1318.5, 0], [1760, 0.1]].forEach(([f, d]) => {
    const t = t0 + d, o = AC.createOscillator(), g = AC.createGain();
    o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.1);
  });
  Tuner.mute = performance.now() + 450; Mic.last = null;
}

// ---------- tela ----------
// os botões são criados uma vez por afinação; depois só mudam de estado (o foco do teclado não se perde)
function tuStrBuild() {
  const box = $('#tuStr'); if (!box) return;
  box.innerHTML = tuStrings().map((m, i) => `<button type="button" class="tus" data-act="tuStr" data-i="${i}"><small>${6 - i}ª</small><b>${pcName(m)}</b><i></i></button>`).join('');
  tuStrBtns();
}
function tuStrBtns() {
  const c = tuCfg();
  document.querySelectorAll('.tus').forEach(b => {
    const i = +b.dataset.i, on = c.mode === 'string' && Tuner.sel === i;
    b.classList.toggle('ok', Tuner.done[i]); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    b.querySelector('i').textContent = Tuner.done[i] ? '✓' : '';
  });
  const all = $('#tuAll'); if (all) all.style.display = Tuner.done.every(Boolean) ? '' : 'none';
}
function tuRefMark() {
  document.querySelectorAll('[data-act="tuRef"]').forEach(b => b.classList.toggle('pri', +b.dataset.i === Tuner.oscStr));
  const p = $('#tuPause'); if (p) p.style.display = Tuner.osc ? '' : 'none';
}
function tuRefBtns() {
  const box = $('#tuRefs'); if (!box) return;
  box.innerHTML = tuStrings().map((m, i) => `<button type="button" class="btn sm" data-act="tuRef" data-i="${i}"><small>${6 - i}ª</small> <b>${pcName(m)}</b></button>`).join('');
  tuRefMark();
}
// texto parado (nada detectado)
function tuIdle() {
  const c = tuCfg(), n = $('#tn'); if (!n) return;
  n.textContent = c.mode === 'string' ? pcName(tuStrings()[Tuner.sel]) : '–'; n.style.color = '';
  $('#th').textContent = c.mode === 'string' ? `${T('Toque a corda selecionada')} · ${tuFreq(tuStrings()[Tuner.sel]).toFixed(1)} Hz` : T('Toque uma corda solta');
  $('#nd').style.left = '50%'; $('#tc').textContent = '–';
}
function tuSync() {
  const c = tuCfg();
  document.querySelectorAll('[data-act="tuMode"]').forEach(b => { const on = b.dataset.m === c.mode; b.classList.toggle('pri', on); b.setAttribute('aria-pressed', on); });
  const b = $('#tbtn'); if (b) b.innerHTML = Mic.on ? ic('i-stop') + T('Parar') : ic('i-mic') + T('Ativar microfone');
  const v = $('#v-a4'); if (v) v.textContent = c.a4;
}
function tuReset() {
  Tuner.done = [false, false, false, false, false, false]; Tuner.sel = 0; Tuner.hold = null; clearTimeout(Tuner.adv);
  tuStrBtns(); tuIdle();
}

// recebe a frequência já estabilizada e atualiza ponteiro, dica e progresso
function tuShow(f, now) {
  const c = tuCfg(), strs = tuStrings(); let midi, idx, cents;
  if (c.mode === 'string') {
    idx = Tuner.sel; midi = strs[idx]; cents = Math.round(1200 * Math.log2(f / tuFreq(midi)));
    // cordas graves às vezes são lidas uma oitava acima (harmônico): conta como a própria corda
    if (Math.abs(cents - 1200) < 60) { cents -= 1200; f /= 2; }
  }
  else { const m = 69 + 12 * Math.log2(f / c.a4); midi = Math.round(m); cents = Math.round((m - midi) * 100); idx = strs.indexOf(midi); }
  const a = Math.abs(cents);
  $('#tn').textContent = pcName(midi); $('#th').textContent = `${f.toFixed(1)} Hz · ${cents > 0 ? '+' : ''}${cents} cents`;
  $('#nd').style.left = (50 + Math.max(-50, Math.min(50, cents))) + '%';
  $('#tn').style.color = a <= TU_OK ? 'var(--ok)' : a <= 15 ? 'var(--warn)' : 'var(--bad)';
  $('#tc').textContent = T(a <= TU_OK ? '✓ afinado' : cents > 0 ? 'alto demais: afrouxe' : 'baixo demais: aperte');
  if (idx < 0) { Tuner.hold = null; return; }
  const state = a <= TU_OK ? 'ok' : a > TU_OFF ? 'off' : '';
  if (!state || (state === 'ok') === Tuner.done[idx]) { Tuner.hold = null; return; }
  const key = idx + state;
  if (!Tuner.hold || Tuner.hold.key !== key) { Tuner.hold = { key, t: now }; return; }
  if (now - Tuner.hold.t < TU_HOLD) return;
  Tuner.hold = null; Tuner.done[idx] = state === 'ok';
  if (state === 'ok') {
    tuBeep();
    // corda por corda: passa para a próxima que falta
    if (c.mode === 'string') {
      clearTimeout(Tuner.adv);
      Tuner.adv = setTimeout(() => { const next = [1, 2, 3, 4, 5].map(k => (idx + k) % 6).find(k => !Tuner.done[k]); if (next != null && Tuner.sel === idx) { Tuner.sel = next; tuStrBtns(); tuIdle(); } }, 900);
    }
  }
  tuStrBtns();
}

function viewTuner() {
  view.classList.add('wide', 'wt');
  const c = tuCfg();
  view.innerHTML = `<h1>Afinador</h1>
  <div class="card tumain">
    <div class="row tumodes" style="justify-content:center"><button type="button" class="btn sm" data-act="tuMode" data-m="auto">Automático</button><button type="button" class="btn sm" data-act="tuMode" data-m="string">Corda por corda</button></div>
    <div class="tustrs" id="tuStr"></div>
    <div class="ins" id="tuAll" role="status" style="display:none">As 6 cordas estão afinadas ✓</div>
    <div class="tunerbig" id="tn">–</div><div class="mut" style="text-align:center" id="th"></div><div class="needle"><i id="nd" style="left:50%"></i></div><div class="row" style="justify-content:center" id="tc">–</div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn pri" id="tbtn" data-act="tuner"></button><button type="button" class="btn" data-act="tuReset">Recomeçar</button></div>
    <div class="small mut" id="tuPause" style="text-align:center;margin-top:10px;display:none">Escuta pausada enquanto o tom toca</div>
  </div>
  <div class="card tuopts">
    <label class="lbl" style="margin-top:0" for="tuTun">Afinação</label><select id="tuTun">${TUNINGS.map(t => `<option value="${t[0]}" ${c.tuning === t[0] ? 'selected' : ''}>${t[1]}</option>`).join('')}</select>
    <label class="lbl" for="tuA4"><span>Calibração do Lá</span>: <b id="v-a4">${c.a4}</b> Hz</label><input type="range" id="tuA4" min="432" max="446" step="1" value="${c.a4}">
    <div class="row" style="margin-top:6px"><button type="button" class="btn sm" data-act="tuA440">Voltar para 440 Hz</button></div>
    <label class="lbl" for="tsens">Sensibilidade</label><input type="range" id="tsens" min="1" max="5" step="1" value="${S().tunerSens || 3}" data-in="tunerSens">
    <div class="lbl">Tom de referência</div><div class="row turefs" id="tuRefs"></div>
    <label class="lbl"><input type="checkbox" id="tuCont" ${c.cont ? 'checked' : ''}> Tom contínuo (toque de novo na nota para parar)</label>
    <label class="lbl"><input type="checkbox" id="tuBeep" ${c.beep ? 'checked' : ''}> Sinal sonoro quando a corda afinar</label>
  </div>`;
  tuStrBuild(); tuRefBtns(); tuSync(); tuIdle();
  $('#tuTun').onchange = e => { tuCfg().tuning = e.target.value; save(); tuToneStop(); tuRefBtns(); tuReset(); tuStrBuild(); };
  $('#tuA4').oninput = e => { tuCfg().a4 = +e.target.value; save(); tuToneStop(); tuRefMark(); tuSync(); tuReset(); };
  $('#tuCont').onchange = e => { tuCfg().cont = e.target.checked; save(); tuToneStop(); tuRefMark(); };
  $('#tuBeep').onchange = e => { tuCfg().beep = e.target.checked; save(); };

  let raf = 0, buf = [], miss = 0, last = null, lastNew = 0;
  Mic.gate = TU_GATE[(S().tunerSens || 3) - 1]; if (Mic.on) Mic.setTune(true);
  const loop = () => {
    const now = performance.now(), blocked = now < Tuner.mute || !!Tuner.osc;
    if (blocked) Mic.last = null;   // descarta o que o microfone ouviu do próprio app
    const d = Mic.on && !blocked ? Mic.last : null;
    if (!d) { Tuner.hold = null; if (++miss > 30) buf = []; if (miss === 90) tuIdle(); }
    else {
      miss = 0;
      if (d !== last) {
        last = d; lastNew = now;
        if (buf.length && Math.abs(12 * Math.log2(d.f / buf[buf.length - 1])) > 0.7) buf = [];
        buf.push(d.f); if (buf.length > 7) buf.shift();
      }
      if (buf.length) tuShow([...buf].sort((a, b) => a - b)[buf.length >> 1], now);
      if (now - lastNew > 250) Tuner.hold = null;   // leitura antiga não conta para o ✓
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const hidden = () => { if (document.hidden) { tuToneStop(); tuRefMark(); } };
  document.addEventListener('visibilitychange', hidden);
  cleanup = () => { cancelAnimationFrame(raf); clearTimeout(Tuner.adv); tuToneStop(); document.removeEventListener('visibilitychange', hidden); Mic.setTune(false); Mic.gate = 0.012; };
}

const tunerActs = {
  async tuner() {
    if (Mic.on) { Mic.stop(); tuSync(); tuIdle(); return; }
    try { await Mic.start(); Mic.setTune(true); Mic.gate = TU_GATE[(S().tunerSens || 3) - 1]; tuSync(); } catch (e) { micFail(e); }
  },
  tuMode(d) { tuCfg().mode = d.m; save(); Tuner.hold = null; clearTimeout(Tuner.adv); tuSync(); tuStrBtns(); tuIdle(); },
  // tocar numa corda escolhe a corda (e passa para o modo corda por corda)
  tuStr(d) { const c = tuCfg(); c.mode = 'string'; save(); Tuner.sel = +d.i; Tuner.hold = null; clearTimeout(Tuner.adv); tuSync(); tuStrBtns(); tuIdle(); },
  tuReset() { tuReset(); },
  tuA440() { tuCfg().a4 = 440; save(); const r = $('#tuA4'); if (r) r.value = 440; tuToneStop(); tuRefMark(); tuSync(); tuReset(); },
  tuRef(d) { tuRefPlay(+d.i); },
};
