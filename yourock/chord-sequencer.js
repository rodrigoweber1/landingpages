/*!
 * ChordSequencer — secuencia de práctica de acordes de guitarra (sin dependencias).
 * Sacado del "Buscador de acordes" del curso You Rock. Un solo archivo, JS puro.
 *
 * Uso mínimo:
 *   <div id="seq"></div>
 *   <script src="chord-sequencer.js"></script>
 *   <script>
 *     const seq = ChordSequencer.mount('#seq', { lang: 'es' });
 *     seq.add({ root: 'C', q: 'maj' });     // añadir un acorde por código
 *   </script>
 *
 * Qué hace: hasta 8 acordes; cada uno con nota + tipo (21 tipos), diagrama de mástil con digitación,
 * toque en el diagrama = cambiar de posición, arrastrar para reordenar, play/stop con metrónomo,
 * silenciar acordes, 2 o 4 tiempos por acorde, BPM (− / +, mantener pulsado = rápido).
 * Suena con cuerda pulsada sintetizada (Karplus-Strong), sin archivos de audio.
 */
(function (root) {
  'use strict';

  /* =====================================================================
   * 1. MOTOR DE ACORDES (teoría + posiciones en el mástil)
   * ===================================================================== */
  var LET = [0, 2, 4, 5, 7, 9, 11];                       // C D E F G A B en semitonos
  var LET_EN = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var LET_ES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  var OPEN = [40, 45, 50, 55, 59, 64];                     // E2 A2 D3 G3 B3 E4 (cuerda 6 → 1), MIDI
  // las 12 notas raíz: [letra, alteración]
  var ROOTS = [[0, 0], [0, 1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
  // iv = semitonos, dg = grados, o5 = la 5ª se puede omitir
  var Q = {
    maj:   { iv: [0, 4, 7],          dg: [1, 3, 5],       sym: '',       es: 'Mayor',    en: 'Major',  pt: 'Maior' },
    min:   { iv: [0, 3, 7],          dg: [1, 3, 5],       sym: 'm',      es: 'Menor',    en: 'Minor' },
    p5:    { iv: [0, 7],             dg: [1, 5],          sym: '5',      es: '5',        en: '5' },
    six:   { iv: [0, 4, 7, 9],       dg: [1, 3, 5, 6],    sym: '6',      es: '6',        en: '6',      o5: 1 },
    m6:    { iv: [0, 3, 7, 9],       dg: [1, 3, 5, 6],    sym: 'm6',     es: 'm6',       en: 'm6',     o5: 1 },
    d7:    { iv: [0, 4, 7, 10],      dg: [1, 3, 5, 7],    sym: '7',      es: '7',        en: '7',      o5: 1 },
    maj7:  { iv: [0, 4, 7, 11],      dg: [1, 3, 5, 7],    sym: 'maj7',   es: 'Mayor 7',  en: 'Maj 7',  pt: 'Maior 7', o5: 1 },
    m7:    { iv: [0, 3, 7, 10],      dg: [1, 3, 5, 7],    sym: 'm7',     es: 'Menor 7',  en: 'Min 7',  o5: 1 },
    mmaj7: { iv: [0, 3, 7, 11],      dg: [1, 3, 5, 7],    sym: 'm(maj7)', es: 'm(maj7)', en: 'm(maj7)', o5: 1 },
    d9:    { iv: [0, 4, 7, 10, 14],  dg: [1, 3, 5, 7, 9], sym: '9',      es: '9',        en: '9',      o5: 1 },
    maj9:  { iv: [0, 4, 7, 11, 14],  dg: [1, 3, 5, 7, 9], sym: 'maj9',   es: 'maj9',     en: 'maj9',   o5: 1 },
    m9:    { iv: [0, 3, 7, 10, 14],  dg: [1, 3, 5, 7, 9], sym: 'm9',     es: 'm9',       en: 'm9',     o5: 1 },
    add9:  { iv: [0, 4, 7, 14],      dg: [1, 3, 5, 9],    sym: 'add9',   es: 'add9',     en: 'add9',   o5: 1 },
    madd9: { iv: [0, 3, 7, 14],      dg: [1, 3, 5, 9],    sym: 'madd9',  es: 'madd9',    en: 'madd9',  o5: 1 },
    sus2:  { iv: [0, 2, 7],          dg: [1, 2, 5],       sym: 'sus2',   es: 'sus2',     en: 'sus2' },
    sus4:  { iv: [0, 5, 7],          dg: [1, 4, 5],       sym: 'sus4',   es: 'sus4',     en: 'sus4' },
    s74:   { iv: [0, 5, 7, 10],      dg: [1, 4, 5, 7],    sym: '7sus4',  es: '7sus4',    en: '7sus4',  o5: 1 },
    dim:   { iv: [0, 3, 6],          dg: [1, 3, 5],       sym: 'dim',    es: 'Dim',      en: 'Dim' },
    dim7:  { iv: [0, 3, 6, 9],       dg: [1, 3, 5, 7],    sym: 'dim7',   es: 'dim7',     en: 'dim7' },
    m7b5:  { iv: [0, 3, 6, 10],      dg: [1, 3, 5, 7],    sym: 'm7b5',   es: 'm7b5',     en: 'm7b5' },
    aug:   { iv: [0, 4, 8],          dg: [1, 3, 5],       sym: 'aug',    es: 'Aum',      en: 'Aug' }
  };

  function noteName(li, acc, lang) {
    var a = acc === 0 ? '' : acc === 1 ? '#' : acc === -1 ? 'b' : acc === 2 ? '##' : acc === -2 ? 'bb' : (acc > 0 ? '#' + acc : 'b' + (-acc));
    return (lang === 'en' ? LET_EN : LET_ES)[li] + a;
  }
  // notas del acorde con su ortografía correcta (Eb en vez de D#, etc.)
  function spell(p) {
    var base = LET[p.rootL] + p.rootA, q = Q[p.q];
    return q.iv.map(function (iv, i) {
      var li = (p.rootL + q.dg[i] - 1) % 7;
      var acc = (((base + iv) - LET[li]) % 12 + 12) % 12;
      if (acc > 6) acc -= 12;
      return { li: li, acc: acc, pc: ((base + iv) % 12 + 12) % 12, deg: q.dg[i] };
    });
  }
  // Busca posiciones tocables: { f:[6] (índice 0 = cuerda 6; -1 = no se toca; 0 = al aire), lo, hi, barre, fingers, score }
  function voicings(p) {
    var q = Q[p.q], tones = spell(p), rootPc = tones[0].pc;
    var allPcs = {}, must = [];
    tones.forEach(function (t) { allPcs[t.pc] = 1; if (!(q.o5 && t.deg === 5)) must.push(t.pc); });
    var pcOf = function (s, f) { return (OPEN[s] + f) % 12; };
    var out = [], seen = {}, minStr = p.q === 'p5' ? 2 : 4;
    for (var lo = 1; lo <= 12; lo++) {
      var opts = [];
      for (var s = 0; s < 6; s++) {
        var o = [-1];
        if (lo <= 4) o.push(0);
        for (var f = lo; f <= lo + 3; f++) o.push(f);
        opts.push(o);
      }
      var cur = [];
      (function rec(s) {
        if (s === 6) {
          var snd = [];
          cur.forEach(function (f, i) { if (f >= 0) snd.push(i); });
          if (snd.length < minStr) return;
          if (snd[snd.length - 1] - snd[0] + 1 !== snd.length) return;       // sin cuerdas muteadas en medio
          if (pcOf(snd[0], cur[snd[0]]) !== rootPc) return;                   // el bajo es la tónica
          if (p.q === 'p5' && snd[0] > 2) return;
          var pcs = {}, npc = 0, k;
          snd.forEach(function (i) { var pc = pcOf(i, cur[i]); if (!pcs[pc]) { pcs[pc] = 1; npc++; } });
          for (k in pcs) if (!allPcs[k]) return;
          for (k = 0; k < must.length; k++) if (!pcs[must[k]]) return;
          var fr = snd.filter(function (i) { return cur[i] > 0; });
          if (!fr.length) return;
          var mn = Math.min.apply(null, fr.map(function (i) { return cur[i]; }));
          if (mn !== lo) return;
          var at = fr.filter(function (i) { return cur[i] === mn; }), barre = null, fingers = fr.length;
          if (at.length >= 2) {
            var a = at[0], b = at[at.length - 1], okb = true;
            for (var i = a; i <= b; i++) if (cur[i] < mn) okb = false;
            if (okb) { barre = { fret: mn, from: a, to: b }; fingers = fr.length - at.length + 1; }
          }
          if (fingers > 4) return;
          var key = cur.join(',');
          if (seen[key]) return;
          seen[key] = 1;
          var hi = Math.max.apply(null, fr.map(function (i) { return cur[i]; }));
          var opens = snd.filter(function (i) { return cur[i] === 0; }).length;
          var sc = snd.length * 10 - fingers * 3 - (hi - lo) * 2 - lo * 0.6 + opens * 2 + (snd[0] <= 1 ? 3 : 0) +
            (npc === tones.length ? 4 : 0) - (barre && barre.to - barre.from < 2 ? 2 : 0) - (hi - lo >= 3 ? 2 : 0);
          out.push({ f: cur.slice(), lo: lo, hi: hi, barre: barre, fingers: fingers, score: sc, bass: snd[0], n: snd.length });
          return;
        }
        opts[s].forEach(function (f) {
          if (f >= 0 && s > 0 && cur.slice(0, s).some(function (x) { return x >= 0; }) && cur[s - 1] < 0) return;
          cur.push(f); rec(s + 1); cur.pop();
        });
      })(0);
    }
    out.sort(function (a, b) { return b.score - a.score; });
    // se reparten por zonas del mástil para ofrecer variedad
    var pick = [], bucket = function (v) { return v.lo <= 3 ? 0 : v.lo <= 6 ? 1 : v.lo <= 9 ? 2 : 3; };
    for (var pass = 0; pass < 2; pass++) {
      [0, 1, 2, 3].forEach(function (b) {
        var taken = pick.filter(function (v) { return bucket(v) === b; });
        for (var j = 0; j < out.length; j++) {
          var v = out[j];
          if (taken.length > pass) break;
          if (bucket(v) !== b || pick.indexOf(v) >= 0) continue;
          if (pick.some(function (w) { return w.bass === v.bass && Math.abs(w.lo - v.lo) < 2; })) continue;
          if (pick.some(function (w) { return w.f.every(function (x, i) { return (x < 0) === (v.f[i] < 0) && (x < 0 || x - w.lo === v.f[i] - v.lo); }); })) continue;
          pick.push(v); taken.push(v);
        }
      });
    }
    pick.sort(function (a, b) { return a.lo - b.lo || b.score - a.score; });
    return { voicings: pick.slice(0, 6), tones: tones };
  }
  var vcache = {};
  function voicingsCached(p) {
    var k = p.rootL + ':' + p.rootA + ':' + p.q;
    return vcache[k] || (vcache[k] = voicings(p));
  }

  /* =====================================================================
   * 2. AUDIO (cuerda pulsada Karplus-Strong, sin archivos)
   * ===================================================================== */
  var AC = null, bufCache = {};
  function audio() {
    if (!AC) {
      var C = root.AudioContext || root.webkitAudioContext; if (!C) return null;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} // iPhone: suena con el modo silencio
      AC = new C();
    }
    if (AC.state !== 'running' && AC.resume) AC.resume();
    return AC;
  }
  function pluckBuf(ac, midi) {
    if (bufCache[midi]) return bufCache[midi];
    var sr = ac.sampleRate, f = 440 * Math.pow(2, (midi - 69) / 12);
    var N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * 1.8);
    var b = ac.createBuffer(1, len, sr), d = b.getChannelData(0), ring = new Float32Array(N), prev = 0, i;
    for (i = 0; i < N; i++) { prev = prev * 0.4 + (Math.random() * 2 - 1) * 0.6; ring[i] = prev; }
    var rho = Math.pow(10, -3 / (1.6 * f)), p = 0;
    for (i = 0; i < len; i++) { var q = (p + 1) % N, v = ring[p]; d[i] = v; ring[p] = rho * 0.5 * (v + ring[q]); p = q; }
    var fade = Math.floor(sr * 0.05);
    for (i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
    return (bufCache[midi] = b);
  }
  function pluck(midi, when, vol) {
    var ac = audio(); if (!ac) return;
    var s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = pluckBuf(ac, midi); g.gain.value = vol == null ? 0.55 : vol;
    s.connect(g); g.connect(ac.destination); s.start(when || 0);
  }
  // los móviles solo arrancan el audio dentro de un toque: se desbloquea con el primero
  ['touchend', 'pointerup', 'click'].forEach(function (t) {
    document.addEventListener(t, function () {
      if (AC && AC.state === 'running') return;
      var ac = audio(); if (!ac) return;
      try { var s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, 22050); s.connect(ac.destination); s.start(0); } catch (e) {}
    }, true);
  });

  /* =====================================================================
   * 3. TEXTOS
   * ===================================================================== */
  var D = {
    pt: {
      title: 'Sequência de prática',
      intro: 'Toque num acorde acima e use o botão Sequência para montar sua progressão. Arraste para mudar a ordem e toque em play.',
      empty: 'Ainda não há acordes. Toque em «Adicionar acorde».', emptyAdd: 'Ainda não há acordes. Toque num acorde acima e depois em «Sequência».', add: 'Adicionar acorde', full: 'Sequência cheia (8)',
      drag: 'Arraste para mudar a ordem', rem: 'Remover este acorde', root: 'Nota', type: 'Tipo',
      pos: 'Posição', cycle: 'Trocar de posição', fret: 'casa', open: 'Posição aberta', barre: 'Pestana na casa',
      none: 'Sem posições confortáveis', play: 'Tocar', stop: 'Parar', metro: 'Metrônomo', tempo: 'Velocidade',
      slower: 'Mais lento', faster: 'Mais rápido', mute: 'Silenciar os acordes', unmute: 'Ativar os acordes',
      beats: 'Tempos por acorde: {n} (toque para mudar)', beatsLbl: 'tempos', chosen: 'Posição escolhida'
    },
    es: {
      title: 'Secuencia de práctica',
      intro: 'Toca un acorde de arriba y usa el botón Secuencia para montar tu progresión. Arrastra para cambiar el orden y pulsa play.',
      empty: 'Todavía no hay acordes. Pulsa «Añadir acorde».', emptyAdd: 'Todavía no hay acordes. Toca un acorde de arriba y luego «Secuencia».', add: 'Añadir acorde', full: 'Secuencia llena (8)',
      drag: 'Arrastra para cambiar el orden', rem: 'Quitar este acorde', root: 'Nota', type: 'Tipo',
      pos: 'Posición', cycle: 'Cambiar de posición', fret: 'traste', open: 'Posición abierta', barre: 'Cejilla en el traste',
      none: 'Sin posiciones cómodas', play: 'Reproducir', stop: 'Parar', metro: 'Metrónomo', tempo: 'Velocidad',
      slower: 'Más lento', faster: 'Más rápido', mute: 'Silenciar los acordes', unmute: 'Activar los acordes',
      beats: 'Tiempos por acorde: {n} (toca para cambiar)', beatsLbl: 'tiempos', chosen: 'Posición elegida'
    },
    en: {
      title: 'Practice sequence',
      intro: 'Tap a chord above and use the Sequence button to build your progression. Drag to reorder and hit play.',
      empty: 'No chords yet. Tap “Add chord”.', emptyAdd: 'No chords yet. Tap a chord above, then “Sequence”.', add: 'Add chord', full: 'Sequence full (8)',
      drag: 'Drag to change the order', rem: 'Remove this chord', root: 'Note', type: 'Type',
      pos: 'Position', cycle: 'Change position', fret: 'fret', open: 'Open position', barre: 'Barre at fret',
      none: 'No comfortable shapes', play: 'Play', stop: 'Stop', metro: 'Metronome', tempo: 'Speed',
      slower: 'Slower', faster: 'Faster', mute: 'Mute the chords', unmute: 'Turn the chords on',
      beats: 'Beats per chord: {n} (tap to change)', beatsLbl: 'beats', chosen: 'Chosen position'
    }
  };
  var esc = function (x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* =====================================================================
   * 4. DIAGRAMA DE MÁSTIL (SVG)
   * ===================================================================== */
  function neckSvg(v, rootPc) {
    var start = v.hi <= 5 ? 1 : v.lo, X0 = 15, SP = 15, Y0 = 24, FH = 21, ROWS = 5;
    var X = function (k) { return X0 + k * SP; }, Y = function (f) { return Y0 + (f - start) * FH + FH / 2; };
    var num = function (x, y, n, col) { return '<text x="' + x + '" y="' + (y + 4.7) + '" text-anchor="middle" font-size="13.4" font-weight="800" font-family="system-ui,sans-serif" style="fill:' + col + '">' + n + '</text>'; };
    // dedos: a pestana é o 1; os demais sobem pelo braço
    var fg = [0, 0, 0, 0, 0, 0], bar = v.barre || null, rest = [], s;
    for (s = 0; s < 6; s++) { var f0 = v.f[s]; if (f0 > 0) { if (bar && f0 === bar.fret && s >= bar.from && s <= bar.to) fg[s] = 1; else rest.push([f0, s]); } }
    rest.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var nf = bar ? 2 : 1;
    rest.forEach(function (x) { fg[x[1]] = Math.min(nf, 4); nf++; });
    var aria = v.f.map(function (f, i) { return (6 - i) + ': ' + (f < 0 ? '×' : f); }).join(', ');
    var h = '<svg viewBox="0 0 105 132" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(aria) + '" style="display:block;width:96px;max-width:100%;height:auto;margin:0 auto">';
    h += '<rect x="' + (X0 - 8) + '" y="' + Y0 + '" width="' + (5 * SP + 16) + '" height="' + (ROWS * FH) + '" rx="3" style="fill:var(--boardbg)"/>';
    for (var r = 0; r <= ROWS; r++) {
      var nut = r === 0 && start === 1;
      h += '<path d="M' + (X0 - 8) + ' ' + (Y0 + r * FH) + 'h' + (5 * SP + 16) + '" style="stroke:' + (nut ? 'var(--nutc)' : 'var(--fretc)') + ';fill:none" stroke-width="' + (nut ? 4 : 1.3) + '"/>';
    }
    for (var k = 0; k < 6; k++) h += '<path d="M' + X(k) + ' ' + Y0 + 'v' + (ROWS * FH) + '" style="stroke:var(--strc);fill:none" stroke-width="' + (2 - k * 0.24).toFixed(2) + '"/>';
    if (start > 1) h += '<text x="' + (X0 + 5 * SP + 12) + '" y="' + (Y0 + FH / 2 + 4) + '" font-size="10" font-weight="700" font-family="system-ui,sans-serif" style="fill:var(--lblc)">' + start + 'fr</text>';
    if (bar) h += '<rect x="' + (X(bar.from) - 7.5) + '" y="' + (Y(bar.fret) - 7.5) + '" width="' + ((bar.to - bar.from) * SP + 15) + '" height="15" rx="7.5" style="fill:var(--acc);stroke:var(--tx)" stroke-opacity=".5"/>';
    var onBar = 0;
    for (s = 0; s < 6; s++) {
      var f = v.f[s];
      if (f < 0) { h += '<path d="M' + (X(s) - 4) + ' 7l8 8m0 -8l-8 8" style="stroke:var(--bad);fill:none" stroke-width="2.2" stroke-linecap="round"/>'; continue; }
      var isR = (OPEN[s] + f) % 12 === rootPc;
      if (f === 0) { h += '<circle cx="' + X(s) + '" cy="11" r="4.6" style="fill:none;stroke:' + (isR ? 'var(--acc)' : 'var(--mut)') + '" stroke-width="2"/>'; continue; }
      if (bar && f === bar.fret && s >= bar.from && s <= bar.to) { if (!isR) continue; onBar++; }
      h += '<circle cx="' + X(s) + '" cy="' + Y(f) + '" r="7.5" style="fill:' + (isR ? 'var(--acc)' : 'var(--tx)') + ';stroke:' + (isR ? 'var(--tx)' : 'var(--boardbg)') + '" stroke-width="1.2"/>';
      if (fg[s]) h += num(X(s), Y(f), fg[s], isR ? 'var(--on)' : 'var(--bg)');
    }
    if (bar && !onBar) h += num((X(bar.from) + X(bar.to)) / 2, Y(bar.fret), 1, 'var(--on)');
    return h + '</svg>';
  }

  /* =====================================================================
   * 5. ESTILOS (con variables CSS para adaptarlos a tu app)
   * ===================================================================== */
  var CSS =
    '.cs{--cs-radius:16px;color:var(--tx);display:flex;flex-direction:column;gap:10px}' +
    '.cs *{box-sizing:border-box}' +
    '.cs h2{margin:0}' +
    '.cs p{margin:0;font-size:14px;line-height:20px;color:var(--mut)}' +
    '.cs button,.cs select{font-family:inherit;color:inherit}' +
    '.cs-empty{padding:18px 16px;border:1px dashed var(--line);border-radius:16px;text-align:center}' +
    '.cs-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
    '@media(min-width:760px){.cs-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}' +
    '@media(min-width:1000px){.cs-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}' +
    '.cs-slot{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 6px 10px;min-width:0;border-radius:var(--cs-radius);background:var(--bg2);border:1px solid var(--line)}' +
    '.cs-slot[aria-pressed="true"]{border:2px solid var(--acc);padding:7px 5px 9px}' +
    '.cs-top{display:flex;align-items:center;justify-content:space-between;width:100%}' +
    '.cs-drag{display:inline-flex;align-items:center;gap:4px;height:32px;padding:0 8px;border-radius:999px;background:var(--bg3);touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;font-size:13px;font-weight:700}' +
    '.cs-x{width:32px;height:32px;padding:0;border:0;border-radius:999px;background:transparent;color:var(--mut);font-size:20px;line-height:1;cursor:pointer}' +
    '.cs-nm{font-size:15px;font-weight:700}' +
    '.cs-st svg{width:100%;height:auto;display:block}' +
    '@media(max-width:759px){.cs-grid{grid-template-columns:repeat(3,1fr);gap:8px;max-width:none}.cs-slot{padding:8px 6px}.cs-slot[aria-pressed="true"]{padding:7px 5px}.cs-st .small{font-size:10px;line-height:1.25;min-height:26px}}' +
    '.cs-sels{display:flex;gap:4px;width:100%}' +
    '.cs-sels select{flex:1 1 0;width:auto;min-width:0;height:40px;padding:0 4px;border:1px solid var(--line);border-radius:10px;background:var(--bg);font-size:15px}' +
    '.cs-d{width:100%;display:flex;flex-direction:column;align-items:center}' +
    '.cs-cyc{display:flex;flex-direction:column;align-items:center;gap:2px;width:100%;padding:4px 0 0;border:0;background:transparent;cursor:pointer}' +
    '.cs-cyc small{font-size:13px;line-height:18px;color:var(--mut)}' +
    '.cs-add{align-self:flex-start;height:44px;padding:0 20px;border:0;border-radius:999px;background:var(--acc);color:var(--on);font-size:15px;font-weight:600;cursor:pointer}' +
    '.cs-dock{position:sticky;bottom:74px;z-index:6;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 14px;width:fit-content;max-width:100%;margin:0 auto;padding:6px 12px;border-radius:999px;background:var(--bg2);border:1px solid var(--line);box-shadow:0 6px 20px rgba(0,0,0,.25)}' +
    '@media(min-width:760px){.cs-dock{bottom:12px}}' +
    '.cs-row{display:flex;align-items:center;gap:4px}.cs-row+.cs-row{padding-left:14px;border-left:1px solid var(--line)}@media(max-width:420px){.cs-dock{flex-wrap:nowrap;gap:6px;padding:6px 8px;width:100%}.cs-row+.cs-row{padding-left:6px}.cs-rb{width:38px}.cs-rb.cs-bt{min-width:44px}.cs-tb{width:38px}.cs-bpm{min-width:44px}}' +
    '.cs-rb{flex:0 0 auto;width:42px;height:44px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;background:transparent;color:var(--mut);cursor:pointer;font-size:18px;font-weight:700}' +
    '.cs-rb[aria-pressed="true"]{background:color-mix(in srgb,var(--acc) 15%,transparent);color:var(--acc)}' +
    '.cs-rb.cs-play{background:var(--acc);color:var(--on)}' +
    '.cs-tb{flex:0 0 auto;width:44px;height:44px;padding:0;border:0;border-radius:999px;background:var(--bg3);font-size:22px;line-height:1;font-weight:700;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none}' +
    '.cs-bpm{display:flex;flex-direction:column;align-items:center;min-width:48px}.cs-rb.cs-bt{width:auto;min-width:46px;padding:0 6px;flex-direction:column;gap:0}.cs-rb.cs-bt b{font-size:18px;line-height:20px;color:var(--tx,inherit)}.cs-rb.cs-bt small{font-size:11px;line-height:12px;font-weight:700;letter-spacing:.04em}' +
    '.cs-bpm b{font-size:22px;line-height:24px}.cs-bpm small{font-size:12px;line-height:14px;font-weight:700;letter-spacing:.06em;color:var(--mut)}';
  function injectCss() {
    if (document.getElementById('cs-css')) return;
    var s = document.createElement('style'); s.id = 'cs-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* =====================================================================
   * 6. COMPONENTE
   * ===================================================================== */
  // limite de acordes na sequência: 12 no computador e 9 no celular (o que está salvo é lido até 12)
  var MAX = 12;
  function maxNow() { return window.matchMedia && window.matchMedia('(max-width:759px)').matches ? 9 : MAX; }
  // posição escolhida fora do sequenciador: { frets:[6] (0 = corda 6, -1 = não toca), barre:{fret,from,to} }
  function customFrom(c) {
    if (!c || !Array.isArray(c.frets) || c.frets.length !== 6) return null;
    var f = c.frets.map(function (x) { x = x | 0; return x < -1 ? -1 : x > 24 ? 24 : x; });
    var fr = f.filter(function (x) { return x > 0; });
    if (!fr.length && !f.some(function (x) { return x === 0; })) return null;
    var b = c.barre && c.barre.fret ? { fret: c.barre.fret | 0, from: c.barre.from | 0, to: c.barre.to | 0 } : null;
    return { f: f, lo: fr.length ? Math.min.apply(null, fr) : 1, hi: fr.length ? Math.max.apply(null, fr) : 1, barre: b };
  }
  function mount(target, opts) {
    opts = opts || {};
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) throw new Error('ChordSequencer: no encuentro el contenedor');
    injectCss();
    host.classList.add('cs');
    var lang = D[opts.lang] ? opts.lang : 'pt';
    var nl = function () { return typeof opts.names === 'function' ? opts.names() : (lang === 'en' ? 'en' : 'es'); };   // 'en' = cifra (C D E), 'es' = solfejo
    var storeKey = opts.storageKey === undefined ? 'chordseq.v1' : opts.storageKey;
    var S = { sl: [], bpm: 80, mute: false, beats: 4, cur: 0, run: false, metro: false };
    var nx = 0, bt = 0, clock = 0, hlClock = 0, hq = [];

    // ---- guardado ----
    function save() {
      if (opts.onChange) { try { opts.onChange(api.getState()); } catch (e) {} }
      if (!storeKey) return;
      try { localStorage.setItem(storeKey, JSON.stringify({ sl: S.sl.map(function (x) { return { r: x.r, q: x.q, v: x.v, cv: x.cv ? { f: x.cv.f, barre: x.cv.barre } : null }; }), bpm: S.bpm, mute: S.mute, beats: S.beats })); } catch (e) {}
    }
    function load() {
      if (!storeKey) return;
      try {
        var sv = JSON.parse(localStorage.getItem(storeKey) || 'null');
        if (!sv) return;
        if (Array.isArray(sv.sl)) S.sl = sv.sl.filter(function (x) { return x && x.r >= 0 && x.r < 12 && Q[x.q]; }).slice(0, MAX).map(function (x) { return { r: x.r | 0, q: x.q, v: Math.max(0, x.v | 0), cv: x.cv ? customFrom({ frets: x.cv.f, barre: x.cv.barre }) : null }; });
        if (sv.bpm >= 40 && sv.bpm <= 200) S.bpm = sv.bpm | 0;
        S.mute = !!sv.mute; S.beats = sv.beats === 2 ? 2 : 4;
      } catch (e) {}
    }

    // ---- datos de cada hueco ----
    function P(i) { var r = ROOTS[S.sl[i].r]; return { rootL: r[0], rootA: r[1], q: S.sl[i].q }; }
    function V(i) {
      var sl = S.sl[i], k = sl.r + ':' + sl.q;
      if (sl._vk !== k) { sl._vk = k; sl._vs = voicingsCached(P(i)).voicings; }
      if (sl.cv) return sl.cv;
      return sl._vs.length ? sl._vs[sl.v % sl._vs.length] : null;
    }
    function diagram(i) {
      var t = D[lang], v = V(i), p = P(i);
      if (!v) return '<span style="font-size:13px;color:var(--mut);padding:40px 0">' + esc(t.none) + '</span>';
      var n = S.sl[i]._vs.length;
      var sub = v.barre ? t.barre + ' ' + v.barre.fret : (v.lo <= 4 && v.f.some(function (f) { return f === 0; }) ? t.open : t.fret + ' ' + v.lo);
      return '<button type="button" class="cs-cyc" data-a="cyc" data-i="' + i + '" aria-label="' + esc(t.cycle) + '">' + neckSvg(v, spell(p)[0].pc) +
        '<small style="margin-top:6px">' + esc(S.sl[i].cv ? t.chosen : t.pos + ' ' + ((S.sl[i].v % n) + 1) + '/' + n) + '</small><small>' + esc(sub) + '</small></button>';
    }
    function slot(i) {
      var sl = S.sl[i], t = D[lang], on = S.run && S.cur === i;
      var h = '<div class="cs-slot" data-i="' + i + '" aria-pressed="' + on + '"><div class="cs-top"><span class="cs-drag" data-drag="' + i + '" role="button" aria-label="' + esc(t.drag) + '" title="' + esc(t.drag) + '">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="18" r="1.8"/><circle cx="15" cy="18" r="1.8"/></svg>' + (i + 1) + '</span>' +
        (opts.diagram ? '<span class="cs-nm">' + esc(noteName(ROOTS[sl.r][0], ROOTS[sl.r][1], nl()) + Q[sl.q].sym) + '</span>' : '') +
        '<button type="button" class="cs-x" data-a="rem" data-i="' + i + '" aria-label="' + esc(t.rem) + '">×</button></div>';
      if (opts.diagram) { var vv = V(i); return h + '<div class="cs-d cs-st">' + (vv ? opts.diagram(vv, spell(P(i))[0].pc) : '<span style="font-size:13px;color:var(--mut);padding:40px 0">' + esc(t.none) + '</span>') + '</div></div>'; }
      h += '<div class="cs-sels">';
      h += '<select data-a="r" data-i="' + i + '" aria-label="' + esc(t.root) + '">' + ROOTS.map(function (r, k) { return '<option value="' + k + '"' + (k === sl.r ? ' selected' : '') + '>' + esc(noteName(r[0], r[1], nl())) + '</option>'; }).join('') + '</select>';
      h += '<select data-a="q" data-i="' + i + '" aria-label="' + esc(t.type) + '">' + Object.keys(Q).map(function (k) { return '<option value="' + k + '"' + (k === sl.q ? ' selected' : '') + '>' + esc(Q[k][lang] || Q[k].es) + '</option>'; }).join('') + '</select></div>';
      return h + '<div class="cs-d">' + diagram(i) + '</div></div>';
    }
    function dock() {
      var t = D[lang], nb = S.beats;
      var ic = S.run ? '<path d="M7 6h10v12H7z" fill="currentColor" stroke="none"/>' : '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>';
      var svg = function (inner) { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'; };
      return '<div class="cs-dock"><div class="cs-row">' +
        '<button type="button" class="cs-rb cs-play" data-a="play" aria-pressed="' + S.run + '" aria-label="' + esc(S.run ? t.stop : t.play) + '" title="' + esc(S.run ? t.stop : t.play) + '"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' + ic + '</svg></button>' +
        '<button type="button" class="cs-rb" data-a="mute" aria-pressed="' + S.mute + '" aria-label="' + esc(S.mute ? t.unmute : t.mute) + '" title="' + esc(S.mute ? t.unmute : t.mute) + '">' + svg('<path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/>' + (S.mute ? '<path d="m16 9 5 6m0-6-5 6"/>' : '<path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')) + '</button>' +
        '<button type="button" class="cs-rb" data-a="metro" aria-pressed="' + S.metro + '" aria-label="' + esc(t.metro) + '" title="' + esc(t.metro) + '">' + svg('<path d="M9 3h6l4 18H5z"/><path d="M7 16h10"/><path d="M12 16l5-10"/>') + '</button>' +
        '<button type="button" class="cs-rb cs-bt" data-a="beats" aria-label="' + esc(t.beats.replace('{n}', nb)) + '" title="' + esc(t.beats.replace('{n}', nb)) + '"><b>' + nb + '</b><small>' + esc(t.beatsLbl) + '</small></button></div>' +
        '<div class="cs-row" role="group" aria-label="' + esc(t.tempo) + '"><button type="button" class="cs-tb" data-bpm="-1" aria-label="' + esc(t.slower) + '">−</button>' +
        '<span class="cs-bpm" aria-live="polite"><b data-bpmv>' + S.bpm + '</b><small>BPM</small></span>' +
        '<button type="button" class="cs-tb" data-bpm="1" aria-label="' + esc(t.faster) + '">+</button></div></div>';
    }
    function paint() {
      var t = D[lang];
      var h = '<h2>' + esc(t.title) + '</h2><p>' + esc(t.intro) + '</p>';
      if (!S.sl.length) h += '<p class="cs-empty">' + esc(opts.addButton === false ? t.emptyAdd : t.empty) + '</p>';
      else {
        h += '<div class="cs-grid">' + S.sl.map(function (x, i) { return slot(i); }).join('') + '</div>';
        h += dock();
      }
      if (opts.addButton !== false) h += '<button type="button" class="cs-add" data-a="add">+ ' + esc(S.sl.length >= maxNow() ? t.full : t.add) + '</button>';
      host.innerHTML = h;
    }
    function refresh(i) { var d = host.querySelector('.cs-slot[data-i="' + i + '"] .cs-d'); if (d) d.innerHTML = diagram(i); }
    function hl() {
      host.querySelectorAll('.cs-slot').forEach(function (el) { el.setAttribute('aria-pressed', S.run && +el.dataset.i === S.cur ? 'true' : 'false'); });
    }
    function setBpm(v) {
      S.bpm = Math.max(40, Math.min(200, Math.round(v))); save();
      var o = host.querySelector('[data-bpmv]'); if (o) o.textContent = S.bpm;
    }

    // ---- sonido ----
    function strum(i, when, vol) {
      try {
        if (S.mute) return;
        var ac = audio(), v = V(i); if (!ac || !v) return;
        var t0 = when == null ? ac.currentTime + 0.02 : when, k = 0;
        for (var s = 0; s < 6; s++) { if (v.f[s] < 0) continue; pluck(OPEN[s] + v.f[s], t0 + k * 0.028, (vol || 0.5) * (1 - s * 0.04)); k++; }
      } catch (e) {}
    }
    function tick(at, strong) {
      try {
        var ac = audio(); if (!ac) return;
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = 'square'; o.frequency.value = strong ? 1500 : 1000;
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(strong ? 0.3 : 0.18, at + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
        o.connect(g); g.connect(ac.destination); o.start(at); o.stop(at + 0.08);
      } catch (e) {}
    }
    // planificador: programa los golpes con el reloj de audio (preciso aunque la pantalla vaya lenta)
    function sched() {
      var ac = audio(); if (!ac || !(S.run || S.metro)) return;
      flush();
      var spb = 60 / S.bpm;
      if (nx < ac.currentTime - 0.1) nx = ac.currentTime + 0.05;
      while (nx < ac.currentTime + 0.4) {
        var nb = S.beats === 2 ? 2 : 4, b = bt % nb, at = nx;
        if (S.metro) tick(at, b === 0);
        if (S.run) {
          if (!S.sl.length) break;
          var ci = Math.floor(bt / nb) % S.sl.length;
          strum(ci, at, b === 0 ? 0.5 : 0.34);
          if (b === 0) hq.push({ ci: ci, w: performance.now() + Math.max(0, at - ac.currentTime) * 1000 });
        }
        nx += spb; bt++;
      }
    }
    function flush() {
      if (!hq.length) return;
      var now = performance.now(), ch = false;
      while (hq.length && hq[0].w <= now + 10) { var x = hq.shift(); if (S.run && x.ci < S.sl.length && S.cur !== x.ci) { S.cur = x.ci; ch = true; } }
      if (ch) hl();
    }
    function startClock() {
      var ac = audio(); if (!ac) return false;
      if (!clock) { nx = ac.currentTime + 0.08; bt = 0; clock = setInterval(sched, 40); hlClock = setInterval(flush, 25); }
      return true;
    }
    function stopClock() { if (clock) { clearInterval(clock); clearInterval(hlClock); clock = hlClock = 0; } }
    function stop(quiet) { S.run = false; if (!S.metro) stopClock(); if (!quiet) paint(); }

    // ---- eventos ----
    host.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT') return;
      var a = b.getAttribute('data-a'), i = +b.getAttribute('data-i');
      if (a === 'cyc') { if (S.sl[i].cv) { S.sl[i].cv = null; S.sl[i].v = 0; } else S.sl[i].v++; save(); refresh(i); if (!S.run) strum(i, null, 0.55); }
      else if (a === 'rem') { S.sl.splice(i, 1); if (S.cur >= S.sl.length) S.cur = 0; if (!S.sl.length) stop(true); save(); paint(); }
      else if (a === 'add') { api.add({ root: 'C', q: 'maj' }); }
      else if (a === 'play') {
        if (S.run) { stop(); return; }
        if (!S.sl.length || !startClock()) return;
        S.run = true; hq = []; bt = S.cur * S.beats; sched(); paint();
      }
      else if (a === 'metro') {
        S.metro = !S.metro;
        if (S.metro) { if (startClock()) sched(); } else if (!S.run) stopClock();
        paint();
      }
      else if (a === 'mute') { S.mute = !S.mute; save(); paint(); }
      else if (a === 'beats') {
        S.beats = S.beats === 2 ? 4 : 2; save();
        if (S.run && S.sl.length) { bt = ((S.cur + 1) % S.sl.length) * S.beats; hq = []; }
        paint();
      }
    });
    host.addEventListener('change', function (e) {
      var el = e.target, a = el && el.getAttribute && el.getAttribute('data-a'); if (a !== 'r' && a !== 'q') return;
      var i = +el.getAttribute('data-i'), sl = S.sl[i];
      if (a === 'r') sl.r = +el.value; else sl.q = el.value;
      sl.v = 0; sl.cv = null; save(); refresh(i);
      if (!S.run) strum(i, null, 0.55);
    });
    // BPM: pulsación larga = repetir, cada vez más rápido
    var rep = 0;
    var stopRep = function () { clearTimeout(rep); rep = 0; };
    host.addEventListener('pointerdown', function (e) {
      var b = e.target.closest && e.target.closest('[data-bpm]'); if (!b) return;
      var step = +b.dataset.bpm, n = 0;
      setBpm(S.bpm + step); stopRep();
      var go = function () { n++; setBpm(S.bpm + step * (n > 12 ? 5 : 1)); rep = setTimeout(go, 90); };
      rep = setTimeout(go, 420);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { host.addEventListener(ev, stopRep); });
    // arrastrar para reordenar
    host.addEventListener('pointerdown', function (e) {
      var g = e.target.closest && e.target.closest('[data-drag]'); if (!g) return;
      e.preventDefault();
      var from = +g.getAttribute('data-drag'), cards = [].slice.call(host.querySelectorAll('.cs-slot')), to = from;
      var mark = function () { cards.forEach(function (c, k) { c.style.opacity = k === from ? '.45' : '1'; c.style.outline = (k === to && k !== from) ? '3px solid var(--acc)' : 'none'; }); };
      mark();
      var mv = function (ev) {
        var o = document.elementFromPoint(ev.clientX, ev.clientY), c = o && o.closest ? o.closest('.cs-slot') : null;
        if (c && host.contains(c)) { var k = cards.indexOf(c); if (k >= 0 && k !== to) { to = k; mark(); } }
        if (ev.clientY < 60) window.scrollBy(0, -12); else if (ev.clientY > innerHeight - 60) window.scrollBy(0, 12);
      };
      var up = function () {
        document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
        if (to !== from) {
          var x = S.sl.splice(from, 1)[0]; S.sl.splice(to, 0, x);
          if (S.cur === from) S.cur = to; else if (from < S.cur && to >= S.cur) S.cur--; else if (from > S.cur && to <= S.cur) S.cur++;
          save();
        }
        paint();
      };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    });

    /* ---- API pública ---- */
    var api = {
      /** añade un acorde: { root: 'C' | 'F#' | 'Bb' | 'Do' | 'Sol'… , q: 'maj'|'min'|'d7'|…, pos: 0 } → false si está llena o no se entiende */
      add: function (c) {
        if (S.sl.length >= maxNow()) return false;
        var r = rootIndex(c && c.root);
        if (r < 0 || !Q[c && c.q || 'maj']) return false;
        S.sl.push({ r: r, q: c.q || 'maj', v: Math.max(0, (c.pos | 0)), cv: customFrom(c) });
        save(); paint(); return true;
      },
      remove: function (i) { if (S.sl[i]) { S.sl.splice(i, 1); if (!S.sl.length) stop(true); save(); paint(); } },
      clear: function () { S.sl = []; S.cur = 0; stop(true); save(); paint(); },
      play: function () { if (!S.run && S.sl.length && startClock()) { S.run = true; hq = []; bt = S.cur * S.beats; sched(); paint(); } },
      stop: function () { stop(); },
      /** { n: acordes na sequência, max: quantos cabem nesta tela } */
      size: function () { return { n: S.sl.length, max: maxNow() }; },
      setBpm: function (v) { setBpm(v); },
      setLang: function (l) { lang = D[l] ? l : 'pt'; paint(); },
      /** { chords:[{root,q,pos}], bpm, beats, mute } — para guardar en tu base de datos */
      getState: function () {
        return { chords: S.sl.map(function (x) { var r = ROOTS[x.r]; return { root: noteName(r[0], r[1], 'en'), q: x.q, pos: x.v, frets: x.cv ? x.cv.f : undefined, barre: x.cv ? x.cv.barre : undefined }; }), bpm: S.bpm, beats: S.beats, mute: S.mute };
      },
      setState: function (st) {
        if (!st) return;
        S.sl = []; (st.chords || []).slice(0, MAX).forEach(function (c) { var r = rootIndex(c.root); if (r >= 0 && Q[c.q]) S.sl.push({ r: r, q: c.q, v: Math.max(0, c.pos | 0), cv: customFrom(c) }); });
        if (st.bpm >= 40 && st.bpm <= 200) S.bpm = st.bpm | 0;
        if (st.beats) S.beats = st.beats === 2 ? 2 : 4;
        if (st.mute != null) S.mute = !!st.mute;
        S.cur = 0; stop(true); save(); paint();
      },
      destroy: function () { stop(true); stopClock(); host.innerHTML = ''; }
    };
    load();
    paint();
    return api;
  }

  // 'C', 'c#', 'Bb', 'Sol', 'Fa#', 'sib'… → índice en ROOTS (o -1)
  function rootIndex(name) {
    var s = String(name == null ? '' : name).trim().replace(/♯/g, '#').replace(/♭/g, 'b'), m, li = -1;
    if ((m = /^(do|re|mi|fa|sol|la|si)\s*(#|b)?$/i.exec(s))) li = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'].indexOf(m[1].toLowerCase());
    else if ((m = /^([a-g])\s*(#|b)?$/i.exec(s))) li = 'cdefgab'.indexOf(m[1].toLowerCase());
    if (li < 0) return -1;
    var acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0, pc = (LET[li] + acc + 12) % 12;
    for (var k = 0; k < ROOTS.length; k++) if (ROOTS[k][0] === li && ROOTS[k][1] === acc) return k;
    for (k = 0; k < ROOTS.length; k++) if ((LET[ROOTS[k][0]] + ROOTS[k][1] + 12) % 12 === pc) return k;   // p. ej. Cb → B
    return -1;
  }

  root.ChordSequencer = {
    mount: mount,
    // motor suelto, por si lo quieres usar sin la interfaz
    engine: { voicings: voicingsCached, spell: spell, noteName: noteName, neckSvg: neckSvg, pluck: pluck, types: Q, roots: ROOTS }
  };
})(typeof window !== 'undefined' ? window : this);
