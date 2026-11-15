// Versão do app: única fonte da verdade (usada pela tela Ajustes e pelo cache do service worker).
// A cada publicação: aumente APP_VERSION (corrige = 1.0.1, novidade = 1.1.0, mudança grande = 2.0.0) e acrescente uma linha no topo de APP_NOTES.
var APP_VERSION = '1.2.4';
var APP_DATE = '2026-11-15';
var APP_NOTES = [
  { pt: 'Pestana sempre visível nos diagramas e número da casa sem corte (10ª, 12ª)', en: 'Barre always visible in diagrams and fret number no longer clipped (10th, 12th)', es: 'Cejilla siempre visible en los diagramas y número de traste sin recorte (10ª, 12ª)' },
  { pt: 'Rótulo das bolinhas (nota ou casa) vale também para Notas e diagramas de acorde', en: 'Dot labels (note or fret) now apply to Notes and chord diagrams too', es: 'La etiqueta de los puntos (nota o traste) vale también para Notas y diagramas de acorde' },
  { pt: 'Sequência de acordes: até 6 por linha no computador', en: 'Chord sequence: up to 6 per row on desktop', es: 'Secuencia de acordes: hasta 6 por fila en el ordenador' },
  { pt: 'Diagramas de acorde sem texto: pestana marcada e número da casa no desenho', en: 'Chord diagrams without text: barre and fret number shown in the drawing', es: 'Diagramas de acorde sin texto: cejilla y número de traste en el dibujo' },
  { pt: 'Acerto ou erro aparece na hora, nota por nota (com o microfone ligado)', en: 'Hit or miss shows right away, note by note (with the microphone on)', es: 'Acierto o error aparece al instante, nota por nota (con el micrófono encendido)' },
  { pt: 'Microfone mais compatível com iPhone/Safari', en: 'Microphone more compatible with iPhone/Safari', es: 'Micrófono más compatible con iPhone/Safari' },
  { pt: 'O microfone desliga ao parar ou concluir o exercício', en: 'The microphone turns off when you stop or finish an exercise', es: 'El micrófono se apaga al parar o terminar el ejercicio' },
  { pt: 'Duração fixa por exercício (ajustável) com botão para continuar em loop', en: 'Fixed duration per exercise (adjustable) with a keep-looping button', es: 'Duración fija por ejercicio (ajustable) con botón para seguir en bucle' },
  { pt: 'Duração de cada passada e do exercício explicada na tela de treino', en: 'Pass and exercise duration explained on the training screen', es: 'Duración de cada pasada y del ejercicio explicada en la pantalla de entrenamiento' },
  { pt: 'Erros do microfone agora explicam o motivo', en: 'Microphone errors now explain the cause', es: 'Los errores del micrófono ahora explican la causa' },
  { pt: 'Versão visível na página inicial', en: 'Version shown on the home page', es: 'Versión visible en la página de inicio' },
  { pt: 'Versionamento: número da versão e botão para atualizar em Ajustes', en: 'Versioning: version number and update button in Settings', es: 'Versionado: número de versión y botón para actualizar en Ajustes' },
  { pt: 'Microfone liga ao iniciar o exercício; oitava conferida nas notas', en: 'Microphone turns on when an exercise starts; octave is checked', es: 'El micrófono se enciende al iniciar el ejercicio; se comprueba la octava' },
  { pt: 'Afinador mais estável, com controle de sensibilidade', en: 'Steadier tuner with a sensitivity control', es: 'Afinador más estable, con control de sensibilidad' },
  { pt: 'Sequência de acordes com os mesmos cartões do buscador', en: 'Chord sequence uses the same cards as the finder', es: 'La secuencia de acordes usa las mismas tarjetas del buscador' },
  { pt: '8 exercícios de pestana e 3 diagramas de acorde por linha no celular', en: '8 barre-chord exercises and 3 chord diagrams per row on phones', es: '8 ejercicios de cejilla y 3 diagramas de acorde por fila en el móvil' },
  { pt: 'Braço na vertical no celular, quiz de nível e tema Ardósia', en: 'Vertical fretboard on phones, level quiz and Slate theme', es: 'Mástil vertical en el móvil, test de nivel y tema Pizarra' }
];
