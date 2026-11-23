'use strict';
// ---------- detecção de altura (YIN) ----------
function yin(buf, sr) {
  const half = buf.length >> 1;
  const minTau = Math.floor(sr / 1200), maxTau = Math.min(half - 2, Math.floor(sr / 70));
  const d = new Float32Array(maxTau + 2);
  for (let tau = 1; tau <= maxTau + 1; tau++) {
    let s = 0;
    for (let i = 0; i < half; i++) { const x = buf[i] - buf[i + tau]; s += x * x; }
    d[tau] = s;
  }
  let run = 0; d[0] = 1;
  for (let tau = 1; tau <= maxTau + 1; tau++) { run += d[tau]; d[tau] = run ? d[tau] * tau / run : 1; }
  for (let tau = minTau; tau < maxTau; tau++) {
    if (d[tau] < 0.15) {
      while (tau + 1 < maxTau && d[tau + 1] < d[tau]) tau++;
      const a = d[tau - 1], b = d[tau], c = d[tau + 1], den = a + c - 2 * b;
      const shift = den ? (a - c) / (2 * den) : 0;
      return { f: sr / (tau + shift), conf: 1 - d[tau] };
    }
  }
  return null;
}
if (typeof module !== 'undefined') module.exports = { yin };

// ---------- áudio ----------
let AC = null;
function ensureCtx() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
// clique agudo (acima da faixa da guitarra) para não confundir a detecção
function click(t, accent, vol = 1) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.frequency.value = accent ? 3400 : 2600; o.type = 'square';
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (accent ? 0.35 : 0.22) * vol), t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.05);
}
function pluck(t, midi, dur) {
  const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
  o.type = 'sawtooth'; o.frequency.value = mtof(midi);
  f.type = 'lowpass'; f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(500, t + Math.max(0.15, dur));
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.2, dur * 1.1));
  o.connect(f).connect(g).connect(AC.destination); o.start(t); o.stop(t + Math.max(0.25, dur * 1.2));
}
function tone(freq, secs) {
  ensureCtx(); const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = 'triangle'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + secs);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + secs + 0.05);
}

// ---------- microfone ----------
const Mic = {
  on: false, an: null, node: null, wlCtx: null, buf: null, stream: null, timer: null,
  hist: [], onsets: [], last: null, lat: 0.09, avg: 0, lastOnset: -1, rms: 0, gate: 0.012, tune: false, r1: 0, r2: 0,
  // abre o microfone de forma tolerante (Safari/iOS costuma dar InvalidStateError): tenta sem restrições, retoma o contexto
  // e, se o contexto estiver ruim, cria outro. O erro leva a etapa em que falhou (e.stage) para diagnóstico.
  async start() {
    if (this.on) return true;
    ensureCtx();
    const gum = c => navigator.mediaDevices.getUserMedia(c);
    let stream, stage = 'mic';
    try {
      // iOS/Safari às vezes responde InvalidStateError ao pedir o microfone (sessão de áudio ainda "ocupada"):
      // tenta sem restrições, espera um pouco e tenta de novo; por fim recria o contexto de áudio e tenta mais uma vez
      const hard = e => e && (e.name === 'NotAllowedError' || e.name === 'NotFoundError' || e.name === 'SecurityError');
      const wait = ms => new Promise(r => setTimeout(r, ms));
      try { stream = await gum({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
      catch (e) {
        if (hard(e)) throw e;
        try { stream = await gum({ audio: true }); }
        catch (e2) {
          if (hard(e2)) throw e2;
          await wait(400);
          try { stream = await gum({ audio: true }); }
          catch (e3) {
            if (hard(e3)) throw e3;
            try { await AC.close(); } catch (_) {} AC = null; this.wlCtx = null; ensureCtx(); await wait(300);
            stream = await gum({ audio: true });
          }
        }
      }
      stage = 'ctx';
      if (AC.state !== 'running') { try { await AC.resume(); } catch (e) {} }
      let src;
      try { src = AC.createMediaStreamSource(stream); }
      catch (e) { try { await AC.close(); } catch (_) {} AC = null; ensureCtx(); try { await AC.resume(); } catch (_) {} src = AC.createMediaStreamSource(stream); }
      stage = 'an';
      this.stream = stream;
      this.an = null; this.node = null;
      // caminho preferido: AudioWorklet (análise com o relógio do áudio, sem depender da thread principal);
      // se o navegador não tiver, cai no AnalyserNode com setInterval
      try {
        if (!AC.audioWorklet || typeof AudioWorkletNode === 'undefined') throw new Error('sem worklet');
        if (this.wlCtx !== AC) { await AC.audioWorklet.addModule('mic-worklet.js'); this.wlCtx = AC; }
        const nd = new AudioWorkletNode(AC, 'mic-proc', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
        nd.port.postMessage({ n: this.tune ? 4096 : 2048 });
        nd.port.onmessage = e => { if (this.on) this.feed(e.data.b, e.data.t); };
        src.connect(nd); nd.connect(AC.destination); this.node = nd;
      } catch (e) {
        this.an = AC.createAnalyser(); this.an.fftSize = this.tune ? 4096 : 2048; this.an.smoothingTimeConstant = 0;
        this.buf = new Float32Array(this.an.fftSize);
        src.connect(this.an);
      }
    } catch (e) {
      if (stream) stream.getTracks().forEach(t => t.stop());
      this.stream = null; try { e.stage = stage; } catch (_) {}
      throw e;
    }
    this.hist = []; this.onsets = []; this.on = true;
    if (this.an) this.timer = setInterval(() => this.tick(), 20);
    return true;
  },
  // afinador: janela maior (4096 amostras) separa melhor as cordas graves; os exercícios continuam com 2048 (resposta rápida)
  setTune(on) {
    this.tune = on;
    if (this.node) { this.node.port.postMessage({ n: on ? 4096 : 2048 }); return; }
    if (!this.an) return;
    this.an.fftSize = on ? 4096 : 2048; this.buf = new Float32Array(this.an.fftSize);
  },
  stop() {
    this.on = false; clearInterval(this.timer);
    if (this.node) { try { this.node.port.onmessage = null; this.node.disconnect(); } catch (e) {} this.node = null; }
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null; this.last = null;
  },
  tick() { this.an.getFloatTimeDomainData(this.buf); this.feed(this.buf, AC.currentTime); },
  // analisa uma janela de amostras que termina no instante tEnd (relógio do AudioContext)
  feed(buf, tEnd) {
    let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    const rms = Math.sqrt(s / buf.length); this.rms = rms;
    const t = tEnd - this.lat;
    // ataque = o volume sobe de repente. A regra nova compara com o volume de 40 ms atrás (uma corda ressoando só cai);
    // a antiga (contra a média) falhava em cordas soltas que ainda soavam quando a palhetada seguinte chegava
    const rising = rms > 0.008 && rms > 1.35 * Math.max(this.r2, 0.002) + 0.003;
    if ((rising || (rms > 0.015 && rms > 1.8 * this.avg && rms - this.avg > 0.01)) && t - this.lastOnset > 0.07) {
      this.onsets.push({ t }); this.lastOnset = t;
    }
    this.avg = this.avg * 0.88 + rms * 0.12; this.r2 = this.r1; this.r1 = rms;
    let det = null;
    if (rms > this.gate) {
      const r = yin(buf, AC.sampleRate);
      if (r && r.conf > (this.tune ? 0.9 : 0.8)) { const m = Math.round(69 + 12 * Math.log2(r.f / 440)); det = { t, midi: m, f: r.f, rms }; }
    }
    this.last = det ? det : (rms > this.gate ? this.last : null);
    if (det) this.hist.push(det);
    const cut = t - 6;
    while (this.hist.length && this.hist[0].t < cut) this.hist.shift();
    while (this.onsets.length && this.onsets[0].t < cut) this.onsets.shift();
  },
  // mede a latência aproximada alto-falante -> microfone
  async calibrate() {
    const was = this.on; await this.start(); const old = this.lat; this.lat = 0; this.onsets = [];
    const base = AC.currentTime + 0.5, times = [0, 0.8, 1.6, 2.4].map(x => base + x);
    times.forEach(t => click(t, true));
    await new Promise(r => setTimeout(r, 3600));
    const ds = times.map(t => { const o = this.onsets.find(o => o.t >= t - 0.02); return o ? o.t - t : null; }).filter(x => x != null && x < 0.5);
    this.lat = old; if (!was) this.stop();
    if (!ds.length) return null;
    ds.sort((a, b) => a - b); return ds[ds.length >> 1];
  },
};
