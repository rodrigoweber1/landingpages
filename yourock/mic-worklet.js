// captura do microfone fora da thread principal: guarda as últimas amostras e, a cada ~20 ms,
// envia a janela de análise junto com o instante exato (relógio do áudio) em que ela termina
class MicProc extends AudioWorkletProcessor {
  constructor() {
    super();
    this.n = 2048; this.ring = new Float32Array(8192); this.w = 0; this.cnt = 0;
    this.hop = Math.round(sampleRate * 0.02);
    this.port.onmessage = e => { if (e.data && e.data.n) this.n = e.data.n; };
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    const M = 8191;
    for (let i = 0; i < ch.length; i++) this.ring[(this.w + i) & M] = ch[i];
    this.w = (this.w + ch.length) & M; this.cnt += ch.length;
    if (this.cnt >= this.hop) {
      this.cnt = 0;
      const n = this.n, out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = this.ring[(this.w - n + i) & M];
      this.port.postMessage({ b: out, t: currentTime + ch.length / sampleRate }, [out.buffer]);
    }
    return true;
  }
}
registerProcessor('mic-proc', MicProc);
