'use strict';
// Quiz de nivelamento: 7 perguntas pontuadas (0 a 3) + 1 de objetivo. Define o nível inicial e sugere o primeiro treino.
const QZ_Q = [
  { q: 'Há quanto tempo você toca guitarra?', f: null, o: ['Nunca toquei', 'Menos de 6 meses', 'De 6 meses a 2 anos', 'Mais de 2 anos'] },
  { q: 'Quais acordes você toca com segurança?', f: 'chords', o: ['Nenhum ainda', 'Alguns abertos (Em, Am, C, G)', 'Abertos e alguns com pestana (F, Bm)', 'Vários formatos em todo o braço'] },
  { q: 'Você toca um rasgueado no tempo, trocando de acorde?', f: 'rhythm', o: ['Nunca tentei', 'Com dificuldade, olhando a mão', 'Sim, em ritmo calmo', 'Sim, com variações e abafados'] },
  { q: 'Quais escalas você conhece?', f: 'lead', o: ['Nenhuma', 'Pentatônica na posição 1', 'Pentatônica em várias posições e blues', 'Escalas de 3 notas por corda e modos'] },
  { q: 'Como está a sua palhetada alternada (↓↑)?', f: 'pick', o: ['Ainda não alterno', 'Alterno devagar, perto de 60 BPM', 'Limpa até uns 100 BPM', 'Rápida e limpa, acima de 120 BPM'] },
  { q: 'E o legato (martelinho e puxada)?', f: 'legato', o: ['Não conheço', 'Conheço, mas sai fraco', 'Faço limpo em ritmo médio', 'Uso em frases e escalas rápidas'] },
  { q: 'Você já tocou sweep, tremolo ou tapping?', f: 'sweep', o: ['Nenhum deles', 'Já ouvi falar, mas nunca tentei', 'Tremolo ou arpejos, em ritmo lento', 'Sweep de várias cordas'] },
  { q: 'O que você mais quer tocar?', f: 'goal', o: ['Acompanhar músicas (acordes e ritmo)', 'Solar (escalas e frases)', 'Rock e metal (palhetada e power chords)', 'Técnica geral, um pouco de tudo'] },
];
const QZ_GOAL = [['chords', 'rhythm'], ['lead', 'legato'], ['pick', 'rhythm', 'chords'], ['mech', 'pick']];
const QZ_STEP = ['Iniciante', 'Básico', 'Intermediário', 'Avançado'];
let QZ = { i: -1, a: [] };

function quizLevel(a) {
  const sum = a.slice(0, 7).reduce((x, y) => x + y, 0);
  let L = sum <= 6 ? 1 : sum <= 12 ? 2 : sum <= 17 ? 3 : 4;
  const base = Math.min(a[2], a[4]);               // ritmo e palhetada são a base: limitam o nível
  if (base === 0) L = 1; else if (base === 1) L = Math.min(L, 2);
  if (a[0] === 0) L = 1;
  return { L, sum };
}
function quizPlan(a, L) {
  const sc = { chords: a[1], rhythm: a[2], lead: a[3], pick: a[4], legato: a[5], sweep: a[6] };
  const goalF = QZ_GOAL[a[7]] || [];
  const weak = Object.keys(sc).sort((x, y) => sc[x] - sc[y]).slice(0, 3);
  const order = [...new Set([...goalF, ...weak, 'mech', 'pick'])];
  const plan = [];
  for (const f of order) {
    if (plan.length >= 5) break;
    const fl = Math.min(L, sc[f] != null ? sc[f] + 1 : L);
    let c = EX.filter(e => e.focus === f && e.lvl <= fl).sort((x, y) => (y.lvl === fl) - (x.lvl === fl) || x.ord - y.ord)[0];
    let fb = false; if (!c) { c = EX.filter(e => e.focus === f).sort((x, y) => x.lvl - y.lvl || x.ord - y.ord)[0]; fb = true; }
    if (c && c.lvl > fl + (fb ? 0 : 1)) c = null;   // sem exercício no nível do aluno para essa técnica: pula (nada acima do nível dele)   // não empurra uma técnica distante do que o aluno já fez
    if (c && !plan.some(p => p.id === c.id)) plan.push({ id: c.id, why: goalF.includes(f) ? 'Combina com o seu objetivo' : weak.includes(f) ? 'Ponto a reforçar' : 'Base do seu treino' });
  }
  return plan;
}
function viewQuiz() {
  if (QZ.i < 0) {
    view.innerHTML = `<div class="card" style="margin-top:12px"><h1>Descubra seu nível</h1>
      <p class="mut">8 perguntas rápidas, cerca de 2 minutos. Responda com sinceridade: o objetivo é começar no ponto certo, não passar num teste.</p>
      <div class="row" style="margin-top:14px"><button class="btn pri" data-act="qzStart">Começar</button><button class="btn ghost" data-act="qzSkip">Pular por enquanto</button></div></div>`;
    return;
  }
  if (QZ.i >= QZ_Q.length) return quizResult();
  const q = QZ_Q[QZ.i];
  view.innerHTML = `<div class="card" style="margin-top:12px"><div class="row sp"><span class="mut small">Pergunta ${QZ.i + 1} de ${QZ_Q.length}</span>${QZ.i ? '<button class="btn sm ghost" data-act="qzBack">← Voltar</button>' : ''}</div>
    <div class="meter" style="height:6px;margin:8px 0 14px"><b style="width:${Math.round(100 * QZ.i / QZ_Q.length)}%;background:var(--acc)"></b></div>
    <h2>${esc(q.q)}</h2>
    <div class="grid" style="margin-top:12px">${q.o.map((t, k) => `<button class="btn" style="text-align:left;padding:12px 16px" data-act="qzAns" data-v="${k}">${esc(t)}</button>`).join('')}</div></div>`;
}
function quizResult() {
  const a = QZ.a, { L, sum } = quizLevel(a), plan = quizPlan(a, L), lv = LEVELS[L];
  DB.placed = L; DB.placement = { t: Date.now(), sum, level: L, a: a.slice() }; DB.placeSkip = false; save();
  TODAY = plan;
  const rows = QZ_Q.filter(q => q.f && q.f !== 'goal').map(q => `<div class="row sp" style="padding:4px 0">${pill(q.f)}<span>${QZ_STEP[a[QZ_Q.indexOf(q)]]}</span></div>`).join('');
  view.innerHTML = `<div class="card" style="margin-top:12px"><div class="mut small">Seu ponto de partida</div>
    <h1 style="color:${lv.color}">Nível ${lv.roman} · ${lv.name}</h1><p class="mut">${lv.desc}</p>
    <div class="small mut">Pontuação: ${sum} de 21. Você pode mudar o nível quando quiser em Ajustes.</div></div>
    <div class="grid g2"><div class="card"><h2>Por área</h2>${rows}</div>
    <div class="card"><h2>Primeiro treino sugerido</h2>${plan.map((p, i) => { const e = EXMAP[p.id]; return `<div class="ex card" style="margin:6px 0"><div class="meta">${pill(e.focus)}<b>${i + 1}. ${esc(e.name)}</b><span class="tag">${LVL[e.lvl]}</span></div><span class="reason">${esc(p.why)}</span></div>`; }).join('')}
    <div class="row" style="margin-top:10px"><button class="btn pri" data-act="qzGo">▶ Começar este treino</button><button class="btn" data-act="qzHome">Usar na tela Hoje</button><button class="btn ghost" data-act="qzStart">Refazer</button></div></div></div>`;
}
const quizActs = {
  qzStart() { QZ = { i: 0, a: [] }; if (location.hash !== '#/quiz') location.hash = '#/quiz'; else viewQuiz(); },
  qzSkip() { DB.placeSkip = true; save(); location.hash = '#/home'; },
  qzAns(d) {
    QZ.a[QZ.i] = +d.v; QZ.i++;
    if (QZ.i === 1 && QZ.a[0] === 0) { QZ.a = [0, 0, 0, 0, 0, 0, 0, 3]; QZ.i = QZ_Q.length; }   // nunca tocou: nível I direto, sem as outras perguntas (objetivo = técnica geral)
    viewQuiz(); window.scrollTo(0, 0);
  },
  qzBack() { if (QZ.i > 0) QZ.i--; viewQuiz(); },
  qzGo() { setQueue(TODAY.map(p => p.id)); },
  qzHome() { location.hash = '#/home'; },
};
