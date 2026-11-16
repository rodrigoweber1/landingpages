'use strict';
// Cordas: 0 = Mi grave (E2) ... 5 = Mi agudo (E4). Nota = [corda, casa]
const OPEN = [40, 45, 50, 55, 59, 64];
const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = m => NN[((m % 12) + 12) % 12];
const midiOf = ([s, f]) => OPEN[s] + f;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

const FOCUS = {
  mech:   { n: 'Mecânica',  c: 'var(--f-mech)' },
  pick:   { n: 'Palhetada', c: 'var(--f-pick)' },
  lead:   { n: 'Solo',      c: 'var(--f-lead)' },
  legato: { n: 'Legato',    c: 'var(--f-legato)' },
  sweep:  { n: 'Sweep',     c: 'var(--f-sweep)' },
  chords: { n: 'Acordes',   c: 'var(--f-chords)' },
  rhythm: { n: 'Ritmo',     c: 'var(--f-rhythm)' },
};
const LVL = { 1: 'Nível I', 2: 'Nível II', 3: 'Nível III', 4: 'Nível IV' };
// Ritmo de aprendizado de cada nível: precisão exigida, passadas limpas seguidas antes de subir o BPM e tamanho do passo.
// Níveis iniciais priorizam consolidar (mais repetições limpas, passos pequenos); os avançados exigem mais precisão.
const LEVELS = {
  1: { roman: 'I',   name: 'Fundamentos',  color: 'var(--lv1)', sub: 1, thr: 80, needClean: 3, step: 3, session: '10–15 min por dia, 5×/semana',
       desc: 'Coordenação das duas mãos, palhetada alternada e os primeiros acordes. Uma nota por clique do metrônomo, em andamento lento. O objetivo é soar limpo, não rápido.' },
  2: { roman: 'II',  name: 'Consolidação', color: 'var(--lv2)', sub: 2, thr: 85, needClean: 3, step: 4, session: '15–25 min por dia, 5×/semana',
       desc: 'Troca de cordas com palhetada alternada, digitações menos óbvias, primeiro legato, primeiros arpejos de acordes e rasgueados com síncopa. A partir daqui, duas notas por clique (colcheias).' },
  3: { roman: 'III', name: 'Técnica',      color: 'var(--lv3)', sub: 2, thr: 85, needClean: 2, step: 5, session: '25–40 min por dia, 5–6×/semana',
       desc: 'Contratempo, saltos de terça e de corda, trinados com abertura maior e tremolo. Exige relaxamento e controle em velocidades médias.' },
  4: { roman: 'IV',  name: 'Domínio',      color: 'var(--lv4)', sub: 2, thr: 90, needClean: 2, step: 5, session: '40–60 min por dia, 6×/semana',
       desc: 'Primeiro sweep, economy picking, sequências longas, outras posições do braço e funk em semicolcheias. Pede precisão de 90% ou mais.' },
};
const MASTER_AT = 0.9;   // exercício dominado = BPM limpo ≥ 90% da meta
const UNLOCK_AT = 0.7;   // próximo nível recomendado quando 70% do nível atual estiver dominado

// ---------- geradores de padrões ----------
const SH3  = [[5,7,8],[5,7,8],[5,7,9],[4,5,7],[5,6,8],[5,7,8]];   // Lá menor natural, 3 notas por corda
const PENT = [[5,8],[5,7],[5,7],[5,7],[5,8],[5,8]];               // Lá menor pentatônica, pos. 1
const flat = sh => sh.flatMap((fr, s) => fr.map(f => [s, f]));
const updown = l => l.concat(l.slice(0, -1).reverse());
const groups = (l, g) => { const o = []; for (let i = 0; i <= l.length - g; i++) for (let j = 0; j < g; j++) o.push(l[i + j]); return o; };
const thirds = l => { const o = []; for (let i = 0; i + 2 < l.length; i++) o.push(l[i], l[i + 2]); return o; };
const spider = order => { const n = []; for (let b = 0; b < 3; b++) for (let s = 0; s < 6; s++) for (const o of order) n.push([s, 5 + b + o - 1]); return n; };
const trills = k => { const n = []; for (let s = 0; s < 6; s++) for (let r = 0; r < 4; r++) n.push([s, 5], [s, 5 + k]); return n; };

const EX = [];
const add = e => EX.push(Object.assign({ type: 'notes', sub: 2 }, e));

// Mecânica
// Spider Walk: as 24 ordens possíveis dos dedos 1-2-3-4 (nível e BPM definidos na tabela CURR)
const PERMS = (function p(a) { return a.length < 2 ? [a] : a.flatMap((x, i) => p(a.filter((_, j) => j !== i)).map(r => [x, ...r])); })([1, 2, 3, 4]);
PERMS.forEach(o => { const n = o.join('-'); add({ id: 'sp' + n, name: 'Spider Walk ' + n, focus: 'mech', lvl: 1, bpm: 60, target: 100, notes: spider(o),
   desc: 'Um dedo por casa, subindo corda por corda. Mantenha a mão relaxada e as notas limpas.' }); });
const spCost = n => { const d = n.split('-').map(Number); let c = 0; for (let i = 1; i < 4; i++) c += Math.abs(d[i] - d[i - 1]); return c; };
add({ id: 'chrom', name: 'Cromático ida e volta', focus: 'mech', lvl: 'beg', bpm: 60, target: 110,
  notes: [0,1,2,3,4,5].flatMap(s => [5,6,7,8,8,7,6,5].map(f => [s, f])), desc: 'Quatro casas, quatro dedos, em todas as cordas.' });
// Palhetada
add({ id: 'alt', name: 'Palhetada alternada – cordas A/D/G/B', focus: 'pick', lvl: 'beg', bpm: 70, target: 130,
  notes: [1,2,3,4].flatMap(s => [5,6,7,8,7,6].map(f => [s, f])), desc: 'Pra baixo e pra cima, sempre alternando. Palheta relaxada.' });
add({ id: 'trem', name: 'Tremolo picking', focus: 'pick', lvl: 'int', bpm: 60, target: 100, rep: true,
  notes: [0,1,2,3,4,5].flatMap(s => Array(8).fill([s, 5])), desc: 'Oito palhetadas na mesma nota. Cada palhetada precisa soar (usa detecção de ataque).' });
add({ id: 'skip', name: 'Salto de cordas', focus: 'pick', lvl: 'int', bpm: 70, target: 120,
  notes: [0,1,2,3].flatMap(b => [[b,5],[b+2,5],[b,7],[b+2,7]]), desc: 'Pule uma corda mantendo a palhetada alternada.' });
add({ id: 'econ', name: 'Economy em 3 notas por corda (Mi menor, casa 12)', focus: 'pick', lvl: 'adv', bpm: 80, target: 140,
  notes: updown(flat(SH3.map(a => a.map(f => f + 7)))), desc: 'Mesma escala em 3 notas por corda, agora na região da casa 12 (Mi menor). Varra a palheta ao trocar de corda na mesma direção.' });
// Solo
add({ id: 'pent', name: 'Pentatônica menor – posição 1', focus: 'lead', lvl: 'beg', bpm: 60, target: 120,
  notes: updown(flat(PENT)), desc: 'Subir e descer a escala de Lá menor pentatônica.' });
add({ id: 'pent4', name: 'Pentatônica em grupos de 4', focus: 'lead', lvl: 'int', bpm: 70, target: 120,
  notes: groups(flat(PENT), 4), desc: 'Sequência 1-2-3-4, 2-3-4-5... na escala.' });
add({ id: 'pent3rd', name: 'Pentatônica em terças', focus: 'lead', lvl: 'int', bpm: 70, target: 120,
  notes: thirds(flat(PENT)), desc: 'Saltos de uma nota sobre a escala, ótimo para frases.' });
add({ id: 'nps3', name: '3 notas por corda – Lá menor', focus: 'lead', lvl: 'int', bpm: 60, target: 120,
  notes: updown(flat(SH3)), desc: 'A escala natural em 3 notas por corda, subindo e descendo.' });
add({ id: 'nps3g', name: '3nps em grupos de 3', focus: 'lead', lvl: 'adv', bpm: 70, target: 130,
  notes: groups(flat(SH3), 3), desc: 'Sequências de 3 notas deslizando pela escala.' });
const PENT2 = [[8,10],[7,10],[7,10],[7,9],[8,10],[8,10]];          // Lá menor pentatônica, pos. 2
const PENT3 = [[10,12],[10,12],[10,12],[9,12],[10,13],[10,12]];    // pos. 3
const BLUES = [[5,8],[5,6,7],[5,7],[5,7],[5,8],[5,8]];             // pos. 1 + blue note (Mib)
const PENTM = [[5,7],[4,7],[4,7],[4,6],[5,7],[5,7]];               // Lá maior pentatônica
const DIAG  = [[5,8],[5,7],[5,7],[7,9],[8,10],[8,10]];             // pos. 1 ligada à pos. 2
const DOR   = [[7,9,10],[7,9,10],[7,9,11],[7,9,11],[7,8,10],[7,9,10]]; // Mi dórico, casa 7
const HARM  = [[5,7,8],[5,7,8],[6,7,9],[4,5,7],[5,6],[5,7,8]];     // Lá menor harmônica, casa 5
const LICKS = [
  [[5,8],[5,5],[4,8],[4,5],[3,7],[3,5],[2,7],[2,5]],
  [[4,8],[4,5],[3,7],[4,5],[4,8],[5,5],[5,8],[5,5]],
  [[1,5],[1,7],[2,5],[2,7],[3,5],[3,7],[2,7],[2,5]],
];
add({ id: 'pent2', name: 'Pentatônica menor – posição 2', focus: 'lead', notes: updown(flat(PENT2)),
  desc: 'A mesma escala de Lá menor pentatônica, agora na casa 7. Aprenda a forma nova sem olhar a anterior.' });
add({ id: 'pent3', name: 'Pentatônica menor – posição 3', focus: 'lead', notes: updown(flat(PENT3)),
  desc: 'Terceira forma da pentatônica, na casa 10. Note onde ela se encaixa entre as outras posições.' });
add({ id: 'blues', name: 'Escala blues menor – Lá', focus: 'lead', notes: updown(flat(BLUES)),
  desc: 'Pentatônica com a "blue note" (Mib) na corda Lá. Passe por ela sem parar: é a nota do blues.' });
add({ id: 'pent3g', name: 'Pentatônica em grupos de 3', focus: 'lead', notes: groups(flat(PENT), 3),
  desc: 'Sequências de 3 notas deslizando pela pentatônica, no mesmo estilo dos grupos de 4.' });
add({ id: 'pentM', name: 'Pentatônica maior – Lá', focus: 'lead', notes: updown(flat(PENTM)),
  desc: 'Escala de som aberto e alegre (country, rock clássico). Fica na casa 4 a 7.' });
add({ id: 'nps3rd', name: '3 notas por corda em terças', focus: 'lead', notes: thirds(flat(SH3)),
  desc: 'Saltos de uma nota na escala de Lá menor em 3 notas por corda. Boa base para frases melódicas.' });
add({ id: 'licks', name: '3 licks clássicos na pentatônica', focus: 'lead', notes: [].concat(...LICKS, ...LICKS),
  desc: 'Três frases curtas de 8 notas, repetidas duas vezes cada. Toque como frase, não como escala.' });
add({ id: 'diag', name: 'Pentatônica ligando posições 1 e 2', focus: 'lead', notes: updown(flat(DIAG)),
  desc: 'Sobe pela diagonal, saindo da posição 1 e chegando à posição 2. É assim que o solo anda pelo braço.' });
add({ id: 'dor', name: 'Mi dórico – 3 notas por corda (casa 7)', focus: 'lead', notes: updown(flat(DOR)),
  desc: 'Modo dórico: som menor com a 6ª maior (Dó#). Muito usado em rock, funk e fusion.' });
add({ id: 'harm', name: 'Lá menor harmônica – casa 5', focus: 'lead', notes: updown(flat(HARM)),
  desc: 'Menor com sétima maior (Sol#). Cuidado com o salto entre Fá e Sol#, que dá o som neoclássico.' });
// Legato
add({ id: 'ham', name: 'Hammer-on e pull-off 5-7-8', focus: 'legato', lvl: 'beg', bpm: 60, target: 110,
  notes: [0,1,2,3,4,5].flatMap(s => [5,7,8,7].map(f => [s, f])), desc: 'Só a primeira nota é palhetada; o resto vem dos dedos.' });
[[1,'beg'],[2,'int'],[3,'adv']].forEach(([k, l]) => add({ id: 'tr' + k, name: 'Trinados 1-' + (k + 1), focus: 'legato', lvl: l, bpm: 60 + 10 * k, target: 110 + 10 * k,
  notes: trills(k), desc: 'Alterne rápido entre duas casas só com martelinho e puxada.' }));
// Sweep
add({ id: 'sweepAm', name: 'Arpejo Am (6 cordas, subir e descer)', focus: 'sweep', lvl: 'int', bpm: 50, target: 100,
  notes: updown([[0,5],[1,7],[2,7],[3,5],[4,5],[5,5]]), desc: 'Deslize a palheta de forma contínua pelas cordas, uma nota por corda.' });
add({ id: 'sweep2', name: 'Arpejo Am repetido', focus: 'sweep', lvl: 'adv', bpm: 60, target: 120,
  notes: [].concat(updown([[0,5],[1,7],[2,7],[3,5],[4,5],[5,5]]), updown([[0,5],[1,7],[2,7],[3,5],[4,5],[5,5]])), desc: 'Duas voltas seguidas, com ênfase na limpeza.' });
// Acordes (arpejos dedilhados)
add({ id: 'arpAmC', name: 'Arpejo Am | C dedilhado', focus: 'chords', lvl: 'beg', bpm: 60, target: 110,
  notes: [].concat([[1,0],[2,2],[3,2],[4,1],[3,2],[2,2]], [[1,3],[2,2],[3,0],[4,1],[3,0],[2,2]]), desc: 'Dois acordes, um padrão de dedilhado. Deixe as notas soarem.' });
// Ritmo (valida o tempo pelo ataque, sem nota)
const R = (id, name, l, b, t, pattern, desc, o = {}) => add(Object.assign({ id, name, focus: 'rhythm', lvl: l, bpm: b, target: t, type: 'rhythm', pattern, desc }, o));
R('rBasic', 'Rasgueado básico ↓ ↓↑ ↑↓↑', 'beg', 70, 110, ['D','-','D','U','-','U','D','U'], 'O padrão clássico do pop/folk.', { sub: 2, chords: ['Am','C','G','Em'] });
R('r8', 'Colcheias contínuas', 'beg', 70, 120, ['D','U','D','U','D','U','D','U'], 'Mão constante pra baixo e pra cima.', { sub: 2, chords: ['Em'] });
R('rReg', 'Contratempo (reggae)', 'int', 70, 110, ['-','U','-','U','-','U','-','U'], 'Acentue o "e" de cada tempo.', { sub: 2, chords: ['Am','Dm'] });
R('rFunk', 'Funk 16 com abafado', 'adv', 70, 100, ['D','x','U','x','D','x','U','D','x','U','x','D','x','U','D','U'], 'Abafe com a mão esquerda nos "x" e mantenha a mão direita contínua.', { sub: 4, chords: ['E9'] });
R('rTrans', 'Troca de acordes Em–Am', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Uma passada por compasso, só dois acordes. Troque de acorde antes do próximo tempo 1.', { focus: 'chords', sub: 2, chords: ['Em','Am'] });
R('rTrans4', 'Troca de acordes Am–C–G–Em', 'int', 50, 100, ['D','-','-','-','D','-','-','-'], 'Uma passada por compasso, agora com quatro acordes. Troque antes do próximo tempo 1.', { focus: 'chords', sub: 2, chords: ['Am','C','G','Em'] });
// degrau 1 da palhetada alternada: só a mão da palheta, sem mão esquerda nem troca de corda
add({ id: 'altOpen', name: 'Palhetada alternada em corda solta', focus: 'pick', rep: true, notes: Array(32).fill([4, 0]),
  desc: 'Repita a corda Si solta com palhetadas ↓↑ constantes. Só a mão da palheta trabalha: pulso relaxado, movimento pequeno.' });
// novos exercícios para o Nível IV
add({ id: 'spMix', name: 'Spider Walk misto (1-3-2-4 + 4-2-3-1)', focus: 'mech', notes: [].concat(spider([1,3,2,4]), spider([4,2,3,1])),
  desc: 'Duas digitações alternadas na mesma passada, sem perder o tempo.' });
add({ id: 'econ4', name: 'Economy em grupos de 4', focus: 'pick', notes: groups(flat(SH3), 4),
  desc: 'Sequências de 4 notas pela escala, varrendo a palheta nas trocas de corda.' });

// novos exercícios: legato, sweep, palhetada, acordes e ritmo
const ARP = c => c.concat(c.slice(1, -1).reverse());
add({ id: 'slide', name: 'Slide 5-7-9 por corda', focus: 'legato', notes: [0,1,2,3,4,5].flatMap(s => [5,7,9,7,5].map(f => [s, f])),
  desc: 'Palhete só a primeira nota e deslize o dedo para as casas seguintes sem soltar a corda.' });
add({ id: 'legPent', name: 'Pentatônica em legato', focus: 'legato', notes: updown(flat(PENT)),
  desc: 'Palhete só a primeira nota de cada corda; a segunda sai com martelinho ou puxada.' });
add({ id: 'leg3', name: 'Legato em 3 notas por corda', focus: 'legato', notes: SH3.flatMap((fr, s) => [fr[0], fr[1], fr[2], fr[1]].map(f => [s, f])),
  desc: 'Martelinho e puxada com três dedos em cada corda. Só a primeira nota de cada corda é palhetada.' });
add({ id: 'legChrom', name: 'Legato cromático 1-2-3-4', focus: 'legato', notes: [0,1,2,3,4,5].flatMap(s => [5,6,7,8,7,6].map(f => [s, f])),
  desc: 'Os quatro dedos em casas vizinhas, só com martelinho e puxada. Cuide da força do dedo mínimo.' });
add({ id: 'leg6', name: 'Legato em sequências de 6 notas', focus: 'legato', notes: groups(flat(SH3), 6),
  desc: 'Três notas em cada corda, trocando de corda sem perder o ritmo. Palhete só a primeira de cada corda.' });
add({ id: 'sweep3', name: 'Sweep de 3 cordas – Am', focus: 'sweep', notes: [].concat(updown([[3,5],[4,5],[5,5]]), updown([[3,5],[4,5],[5,5]]), updown([[3,5],[4,5],[5,5]])),
  desc: 'Arpejo de Lá menor nas três cordas agudas. Um único movimento de palheta, sem bloquear a nota anterior.' });
add({ id: 'sweep4', name: 'Sweep de 4 cordas – Am', focus: 'sweep', notes: [].concat(updown([[2,7],[3,5],[4,5],[5,5]]), updown([[2,7],[3,5],[4,5],[5,5]]), updown([[2,7],[3,5],[4,5],[5,5]])),
  desc: 'Arpejo de Lá menor em quatro cordas. Cada nota soa limpa e sem se misturar com a seguinte.' });
add({ id: 'sweep5', name: 'Sweep de 5 cordas – Am', focus: 'sweep', notes: [].concat(updown([[1,7],[2,7],[3,5],[4,5],[5,5]]), updown([[1,7],[2,7],[3,5],[4,5],[5,5]]), updown([[1,7],[2,7],[3,5],[4,5],[5,5]])),
  desc: 'Arpejo de Lá menor em cinco cordas, na casa 5 a 7. Prepare o próximo dedo antes da palheta chegar.' });
add({ id: 'sweepC', name: 'Arpejo C maior (6 cordas)', focus: 'sweep', notes: updown([[0,8],[1,7],[2,5],[3,5],[4,5],[5,8]]),
  desc: 'O sweep de seis cordas em Dó maior. Compare o som maior com o arpejo de Lá menor.' });
add({ id: 'down', name: 'Palhetada só para baixo', focus: 'pick', notes: [1,2,3,4].flatMap(s => [5,7,5,7].map(f => [s, f])),
  desc: 'Toque todas as notas com palhetadas para baixo, sem alternar. Cria um som firme e constante.' });
add({ id: 'inout', name: 'Palhetada inside e outside', focus: 'pick', notes: [0,1,2,3].flatMap(b => [[b,5],[b+1,7],[b,7],[b+1,5]]),
  desc: 'Alterne entre duas cordas vizinhas em padrões que fazem a palheta passar por dentro ou por fora.' });
add({ id: 'pedal', name: 'Pedal point com corda solta', focus: 'pick', notes: [2,3,5,3].flatMap(f => [[1,0],[2,f]]),
  desc: 'A corda Lá solta serve de base e alterna com notas na corda Ré. Mantenha a palhetada alternada.' });
add({ id: 'arpEmAm', name: 'Arpejo Em · Am dedilhado', focus: 'chords', notes: [].concat(ARP([[0,0],[1,2],[2,2],[3,0],[4,0],[5,0]]), ARP([[1,0],[2,2],[3,2],[4,1],[5,0]])),
  desc: 'Dois acordes abertos, tocados nota a nota de baixo para cima e de volta. Deixe as notas soarem.' });
add({ id: 'arp4', name: 'Arpejo G · Em · C · D dedilhado', focus: 'chords', notes: [].concat(ARP([[0,3],[1,2],[2,0],[3,0],[4,0],[5,3]]), ARP([[0,0],[1,2],[2,2],[3,0],[4,0],[5,0]]), ARP([[1,3],[2,2],[3,0],[4,1],[5,0]]), ARP([[2,0],[3,2],[4,3],[5,2]])),
  desc: 'A sequência mais comum do pop em quatro acordes abertos. Prepare o próximo acorde antes de trocar.' });
add({ id: 'arpAmDmE', name: 'Arpejo Am · Dm · E dedilhado', focus: 'chords', notes: [].concat(ARP([[1,0],[2,2],[3,2],[4,1],[5,0]]), ARP([[2,0],[3,2],[4,3],[5,1]]), ARP([[0,0],[1,2],[2,2],[3,1],[4,0],[5,0]])),
  desc: 'A progressão menor clássica (i, iv, V). Observe como o acorde E resolve para o Am.' });
add({ id: 'power', name: 'Power chords E5 · A5 · D5 (nota a nota)', focus: 'chords', notes: [[0,0],[1,2],[1,0],[2,2],[2,0],[3,2],[2,0],[2,2],[1,0],[1,2],[0,0]],
  desc: 'Duas notas por acorde (fundamental e quinta). Base do rock: toque limpo, sem encostar nas outras cordas.' });
add({ id: 'arpF', name: 'Arpejo F (pestana) · C', focus: 'chords', notes: [].concat(ARP([[0,1],[1,3],[2,3],[3,2],[4,1],[5,1]]), ARP([[1,3],[2,2],[3,0],[4,1],[5,0]])),
  desc: 'O primeiro acorde com pestana. Pressione com a lateral do indicador e deixe todas as notas soarem.' });
add({ id: 'arpBm', name: 'Arpejo Bm (pestana) · G · D', focus: 'chords', notes: [].concat(ARP([[1,2],[2,4],[3,4],[4,3],[5,2]]), ARP([[0,3],[1,2],[2,0],[3,0],[4,0],[5,3]]), ARP([[2,0],[3,2],[4,3],[5,2]])),
  desc: 'Pestana na casa 2 com a forma de Lá menor. Depois volte para acordes abertos sem perder o tempo.' });
add({ id: 'arpCaged', name: 'C maior em duas formas (aberto e casa 3)', focus: 'chords', notes: [].concat(ARP([[1,3],[2,2],[3,0],[4,1],[5,0]]), ARP([[1,3],[2,5],[3,5],[4,5],[5,3]])),
  desc: 'O mesmo acorde de Dó maior, primeiro aberto e depois com a forma de Lá na casa 3. É a ideia do sistema CAGED.' });
R('rQ', 'Rasgueado em semínimas ↓ ↓ ↓ ↓', 'beg', 60, 100, ['D','-','D','-','D','-','D','-'], 'Uma batida para baixo por tempo, em um único acorde. O primeiro passo antes de usar a mão para cima.', { sub: 2, chords: ['Em'] });
R('rPM', 'Palm mute em colcheias (power chord)', 'beg', 70, 110, ['D','D','D','D','D','D','D','D'], 'Apoie a lateral da mão direita perto da ponte para abafar. Colcheias constantes, todas para baixo.', { kinds: ['chPower'], sub: 2, chords: ['E5'] });
R('rSync', 'Síncopa pop (pausa no 2)', 'beg', 70, 110, ['D','-','-','U','-','U','D','U'], 'O tempo 2 fica em silêncio e a mão continua se movendo. Esse é o ritmo de muitas músicas pop.', { sub: 2, chords: ['G','D','Em','C'] });
R('r16', 'Semicolcheias contínuas', 'beg', 60, 90, ['D','U','D','U','D','U','D','U','D','U','D','U','D','U','D','U'], 'Quatro batidas por tempo, alternando baixo e cima. Mão relaxada e movimento pequeno.', { sub: 4, chords: ['Em'] });
R('rGallop', 'Galope (colcheia + 2 semicolcheias)', 'beg', 70, 110, ['D','-','D','D','D','-','D','D','D','-','D','D','D','-','D','D'], 'Uma batida longa e duas curtas em cada tempo. O ritmo clássico do heavy metal.', { kinds: ['chPower'], sub: 4, chords: ['E5'] });

// Pestana (cejilla): segurar, trocar, formas móveis e progressão
const F_SH = [[0,1],[1,3],[2,3],[3,2],[4,1],[5,1]], BM_SH = [[1,2],[2,4],[3,4],[4,3],[5,2]];
const ESH = f => [[0,f],[1,f+2],[2,f+2],[3,f+1],[4,f],[5,f]], ASH = f => [[1,f],[2,f+2],[3,f+2],[4,f+2],[5,f]];
add({ id: 'barreF', name: 'Pestana: F segurado, corda por corda', focus: 'chords', notes: [].concat(ARP(F_SH), ARP(F_SH)),
  desc: 'Pestana na casa 1 (forma de Mi). Segure o acorde e toque nota a nota, de baixo para cima e de volta. Se alguma corda abafar, ajuste o dedo da pestana.' });
add({ id: 'barreBm', name: 'Pestana: Bm segurado, corda por corda', focus: 'chords', notes: [].concat(ARP(BM_SH), ARP(BM_SH)),
  desc: 'Pestana na casa 2 (forma de Lá menor). Mesma ideia do F: pressione com a lateral do indicador e deixe cada nota soar inteira.' });
add({ id: 'moveE', name: 'Formas móveis: forma de Mi em F · G · A', focus: 'chords', notes: [].concat(ARP(ESH(1)), ARP(ESH(3)), ARP(ESH(5))),
  desc: 'O mesmo desenho de pestana deslizando pelo braço (casas 1, 3 e 5). Quem sabe uma forma sabe todos os acordes maiores.' });
add({ id: 'moveA', name: 'Formas móveis: forma de Lá em Bb · C · D', focus: 'chords', notes: [].concat(ARP(ASH(1)), ARP(ASH(3)), ARP(ASH(5))),
  desc: 'A forma de Lá com pestana nas casas 1, 3 e 5. A fundamental fica na corda 5 (Lá): é dela que vem o nome do acorde.' });
R('rBarreFC', 'Troca F · C rasgueada', 'beg', 50, 90, ['D','-','D','-','D','-','D','-'], 'Quatro batidas em F (pestana) e quatro em C (aberto), alternando. Prepare o indicador antes do tempo 1 de cada acorde.', { focus: 'chords', sub: 2, chords: ['F','C'] });
R('rBarreFBbC', 'Troca F · Bb · C rasgueada', 'beg', 50, 90, ['D','-','D','-','D','-','D','-'], 'Três acordes que aparecem juntos em muitas músicas: F e Bb com pestana, C aberto. A pestana desliza uma casa e a forma muda de Mi para Lá.', { focus: 'chords', sub: 2, chords: ['F','Bb','C'] });
R('rBarreStrum', 'Rasgueado pop com pestana (F · Bm)', 'beg', 60, 100, ['D','-','-','U','-','U','D','U'], 'Padrão de pop com pausa no tempo 2, alternando F e Bm. Solte um pouco a pressão da pestana entre as batidas para descansar a mão.', { focus: 'chords', sub: 2, chords: ['F','Bm'] });
R('rBarreProg', 'Progressão com pestana: F · Bb · Gm · C', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'Quatro acordes em ciclo, três deles com pestana (Gm usa a forma de Mi menor na casa 3). Troque sem parar o ritmo, mesmo que o acorde saia imperfeito.', { focus: 'chords', sub: 2, chords: ['F','Bb','Gm','C'] });

R('rTransGC', 'Troca de acordes G–C', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Uma passada por compasso entre dois acordes abertos. Prepare o próximo acorde antes do tempo 1.', { focus: 'chords', sub: 2, chords: ['G', 'C'] });
R('rTransDA', 'Troca de acordes D–A', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Dois acordes de três dedos que ficam próximos. Troque sem olhar a mão, se puder.', { focus: 'chords', sub: 2, chords: ['D', 'A'] });
R('rTransGDEmC', 'Troca de acordes G–D–Em–C', 'beg', 50, 100, ['D','-','-','-','D','-','-','-'], 'A sequência mais comum do pop, em quatro acordes abertos, uma passada por compasso.', { focus: 'chords', sub: 2, chords: ['G', 'D', 'Em', 'C'] });
R('rTransADE', 'Troca de acordes A–D–E', 'beg', 50, 100, ['D','-','-','-','D','-','-','-'], 'Os três acordes do rock e do blues em Lá. Mantenha o andamento mesmo que o acorde saia imperfeito.', { focus: 'chords', sub: 2, chords: ['A', 'D', 'E'] });
R('rTransAmDmE', 'Troca de acordes Am–Dm–E', 'beg', 50, 100, ['D','-','-','-','D','-','-','-'], 'A progressão menor clássica (i, iv, V). O E resolve de volta no Am.', { focus: 'chords', sub: 2, chords: ['Am', 'Dm', 'E'] });
R('rTransCGAmEm', 'Troca de acordes C–G–Am–Em com rasgueado pop', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'Quatro acordes abertos com o padrão pop (pausa no tempo 2). Troque sem parar a mão direita.', { focus: 'chords', sub: 2, chords: ['C', 'G', 'Am', 'Em'] });
R('rBarreFAmDmC', 'Troca com pestana F · Am · Dm · C', 'beg', 50, 90, ['D','-','D','-','D','-','D','-'], 'O F com pestana entre acordes abertos. Solte a pressão do indicador ao trocar e prepare o dedo antes do tempo 1.', { focus: 'chords', sub: 2, chords: ['F', 'Am', 'Dm', 'C'] });
R('rBarreBmGDA', 'Troca com pestana Bm · G · D · A', 'beg', 50, 90, ['D','-','D','-','D','-','D','-'], 'Bm com pestana na casa 2 seguido de três acordes abertos. Uma progressão de muitas músicas.', { focus: 'chords', sub: 2, chords: ['Bm', 'G', 'D', 'A'] });
R('rBarreGmCmD', 'Troca com pestana Gm · Cm · D', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'Dois acordes menores com pestana (formas de Mi e Lá menores) e um aberto. Mantenha o ritmo na troca.', { focus: 'chords', sub: 2, chords: ['Gm', 'Cm', 'D'] });
R('rBarreAmF', 'Troca com pestana Am–F', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Primeira troca com pestana: só dois acordes, uma passada por compasso. Prepare o indicador na casa 1 antes do tempo 1 e solte a pressão ao voltar para o Am.', { focus: 'chords', sub: 2, chords: ['Am','F'] });
R('rTransCAm', 'Troca de acordes C–Am', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Dois acordes que dividem dedos: o dedo 3 fica quase parado e só os outros se movem.', { focus: 'chords', sub: 2, chords: ['C', 'Am'] });
R('rTransEA', 'Troca de acordes E–A', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Dois acordes de rock com a mesma forma, uma corda abaixo. Leve os três dedos juntos.', { focus: 'chords', sub: 2, chords: ['E', 'A'] });
R('rTransDGA', 'Troca de acordes D–G–A', 'beg', 50, 100, ['D','-','-','-','D','-','-','-'], 'Os três acordes de muitas músicas folk e country em Ré. Mantenha o andamento firme.', { focus: 'chords', sub: 2, chords: ['D', 'G', 'A'] });
R('rTransEmCD', 'Troca de acordes Em–C–D', 'beg', 50, 100, ['D','-','-','-','D','-','-','-'], 'Três acordes abertos com o Em como base. O dedo 2 do Em é guia para o C.', { focus: 'chords', sub: 2, chords: ['Em', 'C', 'D'] });
R('rTransCAmDmG', 'Troca de acordes C–Am–Dm–G', 'beg', 50, 100, ['D','-','-','-','D','-','-','-'], 'A progressão dos anos 50 em quatro acordes abertos. Pense no próximo acorde durante o compasso.', { focus: 'chords', sub: 2, chords: ['C', 'Am', 'Dm', 'G'] });
R('rBarreBmA', 'Troca com pestana Bm–A', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Bm com pestana na casa 2 e A aberto. Solte a pressão do indicador ao trocar.', { focus: 'chords', sub: 2, chords: ['Bm', 'A'] });
R('rTransGEmCD', 'Troca de acordes G–Em–C–D com rasgueado pop', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'A sequência pop com o padrão de pausa no tempo 2. Não pare a mão direita na troca.', { focus: 'chords', sub: 2, chords: ['G', 'Em', 'C', 'D'] });
R('rTransDAEmG', 'Troca de acordes D–A–Em–G com rasgueado pop', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'Outra progressão de pop e folk, agora em Ré. Troque antes do tempo 1.', { focus: 'chords', sub: 2, chords: ['D', 'A', 'Em', 'G'] });
R('rBarreCAmFG', 'Troca com pestana C · Am · F · G', 'beg', 50, 90, ['D','-','D','-','D','-','D','-'], 'A progressão clássica (I, vi, IV, V) com F em pestana. O F é a troca mais difícil; prepare antes.', { focus: 'chords', sub: 2, chords: ['C', 'Am', 'F', 'G'] });
R('rBarreDmBbFC', 'Troca com pestana Dm · Bb · F · C', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'Dois acordes com pestana seguidos (Bb e F) entre Dm e C. Mantenha o ritmo mesmo se a pestana falhar.', { focus: 'chords', sub: 2, chords: ['Dm', 'Bb', 'F', 'C'] });
R('rBarreF#mDAE', 'Troca com pestana F#m · D · A · E', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'F#m com pestana na casa 2 e três acordes abertos. Uma progressão comum de pop e rock.', { focus: 'chords', sub: 2, chords: ['F#m', 'D', 'A', 'E'] });
R('rTransAmE', 'Troca de acordes Am–E', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Os dois acordes têm a mesma forma, só que o E sobe uma corda. Leve os dedos 2 e 3 juntos.', { focus: 'chords', sub: 2, chords: ['Am', 'E'] });
R('rTransGEm', 'Troca de acordes G–Em', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Dois acordes com dedos em comum: dois dedos quase não saem do lugar.', { focus: 'chords', sub: 2, chords: ['G', 'Em'] });
R('rTransDG', 'Troca de acordes D–G', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Um par muito usado em Ré. Prepare o dedo 3 do G antes do tempo 1.', { focus: 'chords', sub: 2, chords: ['D', 'G'] });
R('rTransAD', 'Troca de acordes A–D', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Dois acordes de três dedos que ficam na mesma região do braço. Troque sem olhar a mão.', { focus: 'chords', sub: 2, chords: ['A', 'D'] });
R('rTransCG', 'Troca de acordes C–G', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Troca de dois acordes grandes: o dedo 3 do C vai para a corda grave do G. Vá devagar.', { focus: 'chords', sub: 2, chords: ['C', 'G'] });
R('rTransEmD', 'Troca de acordes Em–D', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Do Em para o D só os dedos mudam de corda; mantenha o punho relaxado.', { focus: 'chords', sub: 2, chords: ['Em', 'D'] });
R('rPwEA', 'Power chords: troca E5–A5', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'Dois power chords com a mesma forma: só o dedo 1 e o dedo 3 se movem juntos, uma corda abaixo. Uma passada por compasso.', { focus: 'chords', sub: 2, chords: ['E5', 'A5'] });
R('rPwAD', 'Power chords: troca A5–D5', 'beg', 50, 80, ['D','-','-','-','D','-','-','-'], 'A mesma forma deslizando uma corda. Toque só as duas ou três cordas do acorde, sem encostar nas outras.', { focus: 'chords', sub: 2, chords: ['A5', 'D5'] });
R('rPwADE', 'Power chords: troca A5–D5–E5', 'beg', 50, 100, ['D','-','-','-','D','-','-','-'], 'Os três acordes do rock em Lá, em power chords. Deslize a forma sem levantar a mão do braço.', { focus: 'chords', sub: 2, chords: ['A5', 'D5', 'E5'] });
R('rPwEGA', 'Power chords: troca E5–G5–A5', 'beg', 50, 100, ['D','-','D','-','D','-','D','-'], 'O riff clássico do rock: E5, G5 e A5. Quatro batidas em cada acorde, só para baixo.', { focus: 'chords', sub: 2, chords: ['E5', 'G5', 'A5'] });
R('rPwRock', 'Power chords: rasgueado rock E5–G5–A5–C5', 'beg', 60, 100, ['D','-','D','D','-','U','D','U'], 'Quatro power chords com um padrão de rock com pausa e batidas para cima. Mantenha a mão direita em movimento contínuo.', { focus: 'chords', sub: 2, chords: ['E5', 'G5', 'A5', 'C5'] });
R('rPwPM', 'Power chords com palm mute: E5–G5–A5', 'beg', 70, 110, ['D','D','D','D','D','D','D','D'], 'Colcheias abafadas com a lateral da mão direita perto da ponte, trocando de power chord a cada compasso.', { focus: 'chords', sub: 2, chords: ['E5', 'G5', 'A5'] });
R('rPwGal', 'Power chords: galope E5–G5–A5', 'beg', 70, 110, ['D','-','D','D','D','-','D','D','D','-','D','D','D','-','D','D'], 'O galope do heavy metal trocando de power chord a cada compasso. Palm mute leve e mão direita relaxada.', { focus: 'chords', sub: 4, chords: ['E5', 'G5', 'A5'] });
add({ id: 'power2', name: 'Power chords G5 · C5 · D5 (nota a nota)', focus: 'chords', notes: [[0,3],[1,5],[1,3],[2,5],[1,5],[2,7],[2,5],[1,3],[1,5],[0,3]], desc: 'Mesma ideia do E5 · A5 · D5, agora com a fundamental na corda Mi grave (G5) e na corda Lá (C5 e D5). Toque cada nota limpa.' });
add({ id: 'power3', name: 'Power chords E5 · G5 · A5 (nota a nota)', focus: 'chords', notes: [[0,0],[1,2],[0,3],[1,5],[1,0],[2,2],[1,0],[2,2],[0,3],[1,5],[0,0],[1,2]], desc: 'Os três power chords do riff clássico, uma nota de cada vez. Prepare a forma antes de cada acorde.' });
add({ id: 'pDownOpen', name: 'Palhetada só para baixo em corda solta', focus: 'pick', rep: true, notes: Array(16).fill([4, 0]),
  desc: 'Repita a corda Si solta só com palhetadas para baixo ↓. Cada batida igual à anterior, com o pulso solto.' });
add({ id: 'pAltTwo', name: 'Alternada entre duas cordas soltas (Si e Mi agudo)', focus: 'pick', notes: Array(8).fill([[4, 0], [5, 0]]).flat(),
  desc: 'A palheta troca de corda a cada nota. Mantenha ↓↑ sem parar, mesmo na mudança de corda.' });
add({ id: 'pAltThree', name: 'Alternada em três cordas soltas (Sol, Si e Mi agudo)', focus: 'pick', notes: Array(4).fill([[3, 0], [4, 0], [5, 0], [4, 0]]).flat(),
  desc: 'Suba e desça entre três cordas vizinhas. O movimento da palheta continua ↓↑ em todas as notas.' });
add({ id: 'pPairs', name: 'Palhetada em pares por corda (cordas soltas)', focus: 'pick', notes: [2, 3, 4, 5, 4, 3, 2].flatMap(s => [[s, 0], [s, 0]]),
  desc: 'Duas notas em cada corda, depois muda. A segunda nota de cada par é a palhetada para cima ↑.' });
add({ id: 'pAltSix', name: 'Alternada em todas as cordas soltas, subindo e descendo', focus: 'pick', notes: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1].map(s => [s, 0]),
  desc: 'Percorra as seis cordas soltas e volte. Treine a palheta chegar na corda certa sem olhar.' });
add({ id: 'pAlt12', name: 'Alternada com dois dedos na corda Si (casas 1 e 2)', focus: 'pick', notes: Array(8).fill([[4, 1], [4, 2]]).flat(),
  desc: 'Primeiro contato entre as duas mãos: dedos 1 e 2 na casa 1 e 2, palheta ↓↑ alternada.' });
add({ id: 'pSkipOpen', name: 'Salto de cordas soltas (Ré, Si, Sol e Mi agudo)', focus: 'pick', notes: Array(4).fill([[2, 0], [4, 0], [3, 0], [5, 0]]).flat(),
  desc: 'A palheta pula uma corda e volta. Mantenha o ↓↑ constante enquanto a mão procura a corda certa.' });
R('rHalf', 'Duas batidas por compasso ↓ no 1 e no 3', 'beg', 60, 100, ['D','-','-','-','D','-','-','-'], 'A primeira batida para baixo no tempo 1 e a segunda no tempo 3, com o acorde soando entre elas.', { sub: 2, chords: ['Em'] });
R('rDU1', 'Dois para baixo e um ↓↑', 'beg', 60, 100, ['D','-','D','U','D','-','D','U'], 'Tempos 2 e 4 com ↓↑. A mão sobe e desce de forma contínua; só toque nas batidas marcadas.', { sub: 2, chords: ['Em'] });
R('rUp3', 'Três para baixo e dois para cima', 'beg', 60, 100, ['D','-','D','-','D','U','-','U'], 'Três batidas fortes e depois ↓↑ ↑ no fim do compasso. Bom para sentir o contratempo.', { sub: 2, chords: ['Am'] });
R('rFolk2', 'Folk: ↓ ↓↑ ↓↑ ↓↑', 'beg', 60, 100, ['D','-','D','U','D','U','D','U'], 'Um padrão folk muito usado: só o primeiro tempo sem ↑. Alterne G e C a cada compasso.', { sub: 2, chords: ['G', 'C'] });
R('rOff', 'Contratempo com troca de acorde', 'beg', 60, 100, ['-','U','D','U','-','U','D','U'], 'O tempo 1 fica em silêncio e a mão continua se movendo. Troque Am e G a cada compasso.', { sub: 2, chords: ['Am', 'G'] });
R('rCountry', 'Country: baixo e contratempo', 'beg', 60, 100, ['D','-','-','U','D','-','-','U'], 'Batida forte no 1 e no 3, com um ↑ leve depois. Alterne G, C e D, um acorde por compasso.', { sub: 2, chords: ['G', 'C', 'D'] });
R('r16Pop', 'Pop em semicolcheias', 'beg', 60, 90, ['D','-','-','U','-','U','D','U','D','-','-','U','-','U','D','U'], 'O padrão pop com quatro divisões por tempo. Fique relaxado e use movimentos pequenos.', { sub: 4, chords: ['C', 'G', 'Am', 'F'] });
R('rBallad', 'Balada em semicolcheias', 'beg', 55, 85, ['D','-','-','-','D','U','-','U','D','-','-','-','D','U','-','U'], 'Batida longa no 1 e no 3 seguida de ↓↑ ↑. Deixe o acorde soar bem antes de seguir.', { sub: 4, chords: ['C', 'G'] });
R('rSync2', 'Pausa no tempo 3 com troca de acorde', 'beg', 60, 100, ['D','-','D','-','-','U','D','U'], 'O tempo 3 fica em silêncio e a mão continua. Troque Am e F antes do próximo tempo 1.', { sub: 2, chords: ['Am', 'F'] });
R('rFunk2', 'Funk em semicolcheias com abafado (E9 e Em)', 'beg', 70, 100, ['D','x','U','x','-','x','U','D','x','U','x','D','x','U','x','U'], 'Abafe com a mão esquerda nos "x" e mantenha a mão direita contínua. Troque entre E9 e Em.', { sub: 4, chords: ['E9', 'Em'] });
R('rMetal', 'Rasgueado de metal em semicolcheias (power chords)', 'beg', 70, 110, ['D','D','-','D','D','-','D','-','D','D','-','D','D','-','D','-'], 'Dois ↓↓, pausa, dois ↓↓, pausa, ↓ e pausa. Palm mute firme e troca de power chord a cada compasso.', { kinds: ['chPower'], sub: 4, chords: ['E5', 'G5', 'A5'] });
R('rMixGEmBmC', 'Troca mista: G · Em · Bm · C (abertos e pestana)', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'Três acordes abertos e o Bm com pestana. O Bm é a troca difícil: prepare o indicador antes do tempo 1.', { focus: 'chords', sub: 2, chords: ['G', 'Em', 'Bm', 'C'], kinds: ['chOpen', 'chBarre'] });
R('rMixE5A5CG', 'Troca mista: E5 · A5 · C · G (power chords e abertos)', 'beg', 60, 100, ['D','-','D','-','D','-','D','-'], 'Dois power chords e dois acordes abertos. Mude a forma da mão esquerda sem perder a batida.', { focus: 'chords', sub: 2, chords: ['E5', 'A5', 'C', 'G'], kinds: ['chOpen', 'chPower'] });
R('rMixFG5A5Dm', 'Troca mista: F · G5 · A5 · Dm (pestana, power chords e aberto)', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'Os três tipos de acorde na mesma sequência. Solte a pressão da pestana ao ir para os power chords.', { focus: 'chords', sub: 2, chords: ['F', 'G5', 'A5', 'Dm'], kinds: ['chOpen', 'chBarre', 'chPower'] });
R('rMixBmE5GD', 'Troca mista: Bm · E5 · G · D (pestana, power chord e abertos)', 'beg', 60, 100, ['D','-','D','-','D','-','D','-'], 'Pestana, power chord e dois abertos. Preste atenção em quais cordas ficam soando em cada acorde.', { focus: 'chords', sub: 2, chords: ['Bm', 'E5', 'G', 'D'], kinds: ['chOpen', 'chBarre', 'chPower'] });
R('rMixA5F#mDE', 'Troca mista: A5 · F#m · D · E (power chord, pestana e abertos)', 'beg', 60, 100, ['D','-','D','U','-','U','D','U'], 'Do power chord para o F#m com pestana na casa 2, depois dois abertos. Mantenha a mão direita sem parar.', { focus: 'chords', sub: 2, chords: ['A5', 'F#m', 'D', 'E'], kinds: ['chOpen', 'chBarre', 'chPower'] });
R('rMixDmBbG5C5', 'Troca mista: Dm · Bb · G5 · C5 (aberto, pestana e power chords)', 'beg', 60, 100, ['D','-','D','-','D','-','D','-'], 'Dm aberto, Bb com pestana e dois power chords. O Bb é a troca mais exigente.', { focus: 'chords', sub: 2, chords: ['Dm', 'Bb', 'G5', 'C5'], kinds: ['chOpen', 'chBarre', 'chPower'] });
// Currículo: [id, nível, BPM inicial, BPM meta]. A ordem aqui é a ordem pedagógica dentro do nível.
// Regra: cada exercício acrescenta uma única dificuldade nova (ver revisao-niveis/reference/auditoria-niveis.html).
const CURR = [
  // Nível I: mão da palheta isolada, depois mão esquerda, depois troca de corda e ritmo (rasgueio em um acorde). Arpejos só a partir do Nível II
  // (Nível I usa 1 nota por clique: 50–100 BPM = 50–100 notas/min, que fecha com o início do Nível II, 60 BPM × 2 = 120 notas/min)
  ['pDownOpen', 1, 60, 100], ['altOpen', 1, 60, 100], ['pAltTwo', 1, 55, 100], ['pAltThree', 1, 55, 100], ['pPairs', 1, 50, 100], ['pAltSix', 1, 50, 100], ['pAlt12', 1, 50, 100], ['pSkipOpen', 1, 50, 90], ['chrom', 1, 50, 100], ['sp1-2-3-4', 1, 50, 100], ['rQ', 1, 60, 100], ['rHalf', 1, 60, 100], ['rDU1', 1, 60, 100], ['rUp3', 1, 60, 100], ['r8', 1, 60, 90], ['sp4-3-2-1', 1, 50, 100], ['pent', 1, 50, 100], ['pent2', 1, 50, 100], ['pent3', 1, 50, 100], ['blues', 1, 50, 100], ['rTrans', 1, 50, 80], ['rTransGC', 1, 50, 80], ['rTransDA', 1, 50, 80], ['rTransCAm', 1, 50, 80], ['rTransEA', 1, 50, 80], ['rTransAmE', 1, 50, 80], ['rTransGEm', 1, 50, 80], ['rTransDG', 1, 50, 80], ['rTransAD', 1, 50, 80], ['rTransCG', 1, 50, 80], ['rTransEmD', 1, 50, 80], ['rPwEA', 1, 50, 80], ['rPwAD', 1, 50, 80],
  // Nível II: troca de cordas com palhetada alternada, digitações salteadas, primeiro legato, síncopa, 4 acordes
  ['alt', 2, 60, 100], ['down', 2, 60, 100], ['sp1-2-4-3', 2, 60, 100], ['sp2-1-3-4', 2, 60, 100], ['sp1-3-2-4', 2, 60, 100], ['ham', 2, 60, 100], ['slide', 2, 60, 100], ['legPent', 2, 60, 100], ['sp1-3-4-2', 2, 60, 100], ['sp2-3-4-1', 2, 60, 100], ['sp3-4-2-1', 2, 60, 100], ['sp4-3-1-2', 2, 60, 100], ['sp2-4-1-3', 2, 60, 100], ['nps3', 2, 60, 100], ['tr1', 2, 60, 100], ['pent4', 2, 70, 110], ['pent3g', 2, 70, 110], ['pentM', 2, 60, 110], ['rBasic', 2, 70, 100], ['rTrans4', 2, 50, 100], ['rFolk2', 2, 60, 100], ['rOff', 2, 60, 100], ['rCountry', 2, 60, 100], ['rTransGDEmC', 2, 50, 100], ['rTransADE', 2, 50, 100], ['rTransAmDmE', 2, 50, 100], ['rTransDGA', 2, 50, 100], ['rTransEmCD', 2, 50, 100], ['rTransCAmDmG', 2, 50, 100], ['rPM', 2, 70, 110], ['arpAmC', 2, 50, 100], ['arpEmAm', 2, 50, 100], ['arp4', 2, 50, 100], ['arpAmDmE', 2, 50, 100], ['power', 2, 50, 100], ['power2', 2, 50, 90], ['barreF', 2, 50, 90], ['barreBm', 2, 50, 90], ['rBarreAmF', 2, 50, 80], ['rBarreBmA', 2, 50, 80], ['rPwADE', 2, 50, 100], ['rPwEGA', 2, 50, 100], ['power3', 3, 60, 100],
  // Nível III: contratempo, saltos de terça e de corda, aberturas maiores, tremolo
  ['rReg', 3, 70, 110], ['rSync', 3, 70, 110], ['r16Pop', 3, 60, 90], ['rBallad', 3, 55, 85], ['rSync2', 3, 60, 100], ['rGallop', 3, 70, 110], ['r16', 3, 60, 90], ['pent3rd', 3, 80, 120], ['nps3rd', 3, 70, 115], ['licks', 3, 60, 110], ['tr2', 3, 70, 110], ['leg3', 3, 60, 110], ['legChrom', 3, 60, 110], ['skip', 3, 70, 110], ['sp1-4-3-2', 3, 70, 115], ['sp2-1-4-3', 3, 70, 115], ['sp2-4-3-1', 3, 70, 115], ['sp3-1-2-4', 3, 70, 115], ['sp3-2-1-4', 3, 70, 115], ['sp3-4-1-2', 3, 70, 115], ['sp4-1-2-3', 3, 70, 115], ['sp4-2-1-3', 3, 70, 115], ['sp3-1-4-2', 3, 70, 115], ['trem', 3, 70, 110], ['inout', 3, 70, 115], ['pedal', 3, 70, 115], ['sp4-2-3-1', 3, 70, 115], ['sweep3', 3, 40, 80], ['arpF', 3, 50, 100], ['arpBm', 3, 50, 100], ['rBarreFC', 3, 50, 90], ['rBarreFBbC', 3, 50, 90], ['moveE', 3, 50, 100], ['moveA', 3, 50, 100], ['rBarreStrum', 3, 60, 100], ['rTransCGAmEm', 3, 60, 100], ['rTransGEmCD', 3, 60, 100], ['rTransDAEmG', 3, 60, 100], ['rPwRock', 3, 60, 100], ['rPwPM', 3, 70, 110], ['rBarreFAmDmC', 3, 50, 90], ['rBarreBmGDA', 3, 50, 90], ['rBarreCAmFG', 3, 50, 90],
  // Nível IV: sweep, economy, sequências longas, funk em semicolcheias
  ['sweep4', 4, 40, 80], ['sweepAm', 4, 40, 80], ['sweep5', 4, 40, 80], ['sweepC', 4, 40, 80], ['leg6', 4, 70, 110], ['arpCaged', 4, 50, 100], ['nps3g', 4, 90, 140], ['diag', 4, 80, 130], ['dor', 4, 80, 130], ['harm', 4, 70, 120], ['econ', 4, 90, 140], ['econ4', 4, 90, 150], ['tr3', 4, 80, 130], ['sweep2', 4, 80, 130], ['sp1-4-2-3', 4, 80, 120], ['sp2-3-1-4', 4, 80, 120], ['sp3-2-4-1', 4, 80, 120], ['sp4-1-3-2', 4, 80, 120], ['spMix', 4, 90, 140], ['rFunk', 4, 80, 110], ['rFunk2', 4, 70, 100], ['rMetal', 4, 70, 110], ['rBarreProg', 4, 60, 100], ['rBarreGmCmD', 4, 60, 100], ['rBarreDmBbFC', 4, 60, 100], ['rBarreF#mDAE', 4, 60, 100], ['rPwGal', 4, 70, 110], ['rMixGEmBmC', 4, 60, 100], ['rMixE5A5CG', 4, 60, 100], ['rMixFG5A5Dm', 4, 60, 100], ['rMixBmE5GD', 4, 60, 100], ['rMixA5F#mDE', 4, 60, 100], ['rMixDmBbG5C5', 4, 60, 100],
];
const LV_EX = { 1: [], 2: [], 3: [], 4: [] };
CURR.forEach(([id, l, b, t], i) => { const e = EX.find(x => x.id === id); e.lvl = l; e.bpm = b; e.target = t; e.ord = i; LV_EX[l].push(id); });
EX.sort((a, b) => a.ord - b.ord);
EX.forEach(e => { e.len = e.type === 'notes' ? e.notes.length : e.pattern.length; });
const EXMAP = Object.fromEntries(EX.map(e => [e.id, e]));

function seedRoutines() {
  return [
    { id: 'r1', name: 'Aquecimento 10 min', items: ['chrom', 'sp1-2-3-4', 'pent'] },
    { id: 'r2', name: 'Velocidade e solo', items: ['alt', 'pent4', 'nps3', 'tr2'] },
    { id: 'r3', name: 'Ritmo e acordes', items: ['r8', 'rTrans', 'arpAmC', 'rBasic'] },
  ];
}
