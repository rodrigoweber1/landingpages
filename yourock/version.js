// Versão do app: única fonte da verdade (usada pela tela Ajustes e pelo cache do service worker).
// A cada publicação: aumente APP_VERSION (corrige = 1.0.1, novidade = 1.1.0, mudança grande = 2.0.0) e acrescente uma linha no topo de APP_NOTES.
var APP_VERSION = '1.0.0';
var APP_DATE = '2026-11-15';
var APP_NOTES = [
  { pt: 'Versionamento: número da versão e botão para atualizar em Ajustes', en: 'Versioning: version number and update button in Settings', es: 'Versionado: número de versión y botón para actualizar en Ajustes' },
  { pt: 'Microfone liga ao iniciar o exercício; oitava conferida nas notas', en: 'Microphone turns on when an exercise starts; octave is checked', es: 'El micrófono se enciende al iniciar el ejercicio; se comprueba la octava' },
  { pt: 'Afinador mais estável, com controle de sensibilidade', en: 'Steadier tuner with a sensitivity control', es: 'Afinador más estable, con control de sensibilidad' },
  { pt: 'Sequência de acordes com os mesmos cartões do buscador', en: 'Chord sequence uses the same cards as the finder', es: 'La secuencia de acordes usa las mismas tarjetas del buscador' },
  { pt: '8 exercícios de pestana e 3 diagramas de acorde por linha no celular', en: '8 barre-chord exercises and 3 chord diagrams per row on phones', es: '8 ejercicios de cejilla y 3 diagramas de acorde por fila en el móvil' },
  { pt: 'Braço na vertical no celular, quiz de nível e tema Ardósia', en: 'Vertical fretboard on phones, level quiz and Slate theme', es: 'Mástil vertical en el móvil, test de nivel y tema Pizarra' }
];
