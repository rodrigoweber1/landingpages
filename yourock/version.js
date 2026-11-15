// Versão do app: única fonte da verdade (usada pela tela Ajustes e pelo cache do service worker).
// A cada publicação: aumente APP_VERSION (corrige = 1.0.1, novidade = 1.1.0, mudança grande = 2.0.0) e acrescente uma linha no topo de APP_NOTES.
var APP_VERSION = '1.4.10';
var APP_DATE = '2026-11-15';
var APP_NOTES = [
  // a cada nova versão, acrescente aqui no topo uma linha { pt, en, es }
  { pt: 'Notas da Guitarra: sem as bolinhas das cordas soltas no braço (os nomes das cordas já aparecem ao lado); elas continuam em "Cordas soltas"', en: 'Guitar Notes: no open-string dots on the fretboard (string names are already shown beside it); they remain under "Open strings"', es: 'Notas de la guitarra: sin los puntos de las cuerdas al aire en el mástil (los nombres de las cuerdas ya aparecen al lado); siguen en "Cuerdas al aire"' },
  { pt: 'Treinar: o dropdown de exercícios começa sempre fechado e mostra o nome do nível', en: 'Train: the exercise dropdown always starts closed and shows the level name', es: 'Entrenar: el desplegable de ejercicios siempre empieza cerrado y muestra el nombre del nivel' },
];
