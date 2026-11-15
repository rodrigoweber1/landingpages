'use strict';
// Camada de tradução: o app é escrito em português; aqui o texto da tela é traduzido
// para inglês/espanhol depois de cada render (dicionário exato + trechos + regras).
const LANGS = { pt: 'Português', en: 'English', es: 'Español' };
const LANG = (() => { try { const s = localStorage.getItem('fretforge.lang'); if (s && LANGS[s]) return s; } catch (e) {} const n = (navigator.language || 'pt').slice(0, 2); return LANGS[n] ? n : 'pt'; })();
const LI = { pt: 0, en: 1, es: 2 }[LANG];

// pt | en | es
const D_RAW = `
Hoje|Today|Hoy
Tema de cores|Color theme|Tema de color
Braço na vertical no celular, na tela Notas (bolinhas maiores)|Vertical fretboard on phones, in the Notes screen (bigger dots)|Mástil en vertical en el móvil, en la pantalla Notas (puntos más grandes)
Adicionar à sequência|Add to sequence|Añadir a la secuencia
Adicionado à sequência|Added to the sequence|Añadido a la secuencia
Adicionado à sequência (sem o baixo)|Added to the sequence (without the bass note)|Añadido a la secuencia (sin el bajo)
A sequência está cheia (8 acordes)|The sequence is full (8 chords)|La secuencia está llena (8 acordes)
Nomes|Names|Nombres
Sustenidos (#)|Sharps (#)|Sostenidos (#)
Bemóis (b)|Flats (b)|Bemoles (b)
Só naturais|Naturals only|Solo naturales
Descubra seu nível|Find your level|Descubre tu nivel
8 perguntas rápidas, cerca de 2 minutos. Responda com sinceridade: o objetivo é começar no ponto certo, não passar num teste.|8 quick questions, about 2 minutes. Answer honestly: the goal is to start at the right place, not to pass a test.|8 preguntas rápidas, unos 2 minutos. Responde con sinceridad: el objetivo es empezar en el punto correcto, no aprobar un examen.
Começar|Start|Empezar
Pular por enquanto|Skip for now|Saltar por ahora
← Voltar|← Back|← Atrás
Há quanto tempo você toca guitarra?|How long have you been playing guitar?|¿Cuánto tiempo llevas tocando guitarra?
Nunca toquei|I have never played|Nunca he tocado
Menos de 6 meses|Less than 6 months|Menos de 6 meses
De 6 meses a 2 anos|6 months to 2 years|De 6 meses a 2 años
Mais de 2 anos|More than 2 years|Más de 2 años
Quais acordes você toca com segurança?|Which chords can you play confidently?|¿Qué acordes tocas con seguridad?
Nenhum ainda|None yet|Ninguno todavía
Alguns abertos (Em, Am, C, G)|Some open chords (Em, Am, C, G)|Algunos abiertos (Em, Am, C, G)
Abertos e alguns com pestana (F, Bm)|Open chords and some barre chords (F, Bm)|Abiertos y algunos con cejilla (F, Bm)
Vários formatos em todo o braço|Many shapes all over the neck|Varias formas en todo el mástil
Você toca um rasgueado no tempo, trocando de acorde?|Can you strum in time while changing chords?|¿Tocas un rasgueo a tiempo cambiando de acorde?
Nunca tentei|I have never tried|Nunca lo he intentado
Com dificuldade, olhando a mão|With difficulty, looking at my hand|Con dificultad, mirando la mano
Sim, em ritmo calmo|Yes, at a calm tempo|Sí, a un ritmo tranquilo
Sim, com variações e abafados|Yes, with variations and muted strums|Sí, con variaciones y apagados
Quais escalas você conhece?|Which scales do you know?|¿Qué escalas conoces?
Nenhuma|None|Ninguna
Pentatônica na posição 1|Pentatonic in position 1|Pentatónica en la posición 1
Pentatônica em várias posições e blues|Pentatonic in several positions and blues|Pentatónica en varias posiciones y blues
Escalas de 3 notas por corda e modos|Scales in 3 notes per string and modes|Escalas de 3 notas por cuerda y modos
Como está a sua palhetada alternada (↓↑)?|How is your alternate picking (↓↑)?|¿Cómo está tu púa alternada (↓↑)?
Ainda não alterno|I do not alternate yet|Todavía no alterno
Alterno devagar, perto de 60 BPM|I alternate slowly, around 60 BPM|Alterno despacio, cerca de 60 BPM
Limpa até uns 100 BPM|Clean up to about 100 BPM|Limpia hasta unos 100 BPM
Rápida e limpa, acima de 120 BPM|Fast and clean, above 120 BPM|Rápida y limpia, por encima de 120 BPM
E o legato (martelinho e puxada)?|And legato (hammer-ons and pull-offs)?|¿Y el legato (hammer-on y pull-off)?
Não conheço|I do not know it|No lo conozco
Conheço, mas sai fraco|I know it, but it sounds weak|Lo conozco, pero suena flojo
Faço limpo em ritmo médio|Clean at a medium tempo|Lo hago limpio a ritmo medio
Uso em frases e escalas rápidas|I use it in fast phrases and scales|Lo uso en frases y escalas rápidas
Você já tocou sweep, tremolo ou tapping?|Have you played sweep, tremolo or tapping?|¿Has tocado sweep, tremolo o tapping?
Nenhum deles|None of them|Ninguno de ellos
Já ouvi falar, mas nunca tentei|Heard of them, never tried|He oído hablar, pero nunca lo he intentado
Tremolo ou arpejos, em ritmo lento|Tremolo or arpeggios, at a slow tempo|Tremolo o arpegios, a ritmo lento
Sweep de várias cordas|Sweep across several strings|Sweep en varias cuerdas
O que você mais quer tocar?|What do you most want to play?|¿Qué es lo que más quieres tocar?
Acompanhar músicas (acordes e ritmo)|Accompany songs (chords and rhythm)|Acompañar canciones (acordes y ritmo)
Solar (escalas e frases)|Play solos (scales and phrases)|Solear (escalas y frases)
Rock e metal (palhetada e power chords)|Rock and metal (picking and power chords)|Rock y metal (púa y power chords)
Técnica geral, um pouco de tudo|General technique, a bit of everything|Técnica general, un poco de todo
Iniciante|Beginner|Principiante
Básico|Basic|Básico
Intermediário|Intermediate|Intermedio
Avançado|Advanced|Avanzado
Seu ponto de partida|Your starting point|Tu punto de partida
Por área|By area|Por área
Primeiro treino sugerido|Suggested first workout|Primer entrenamiento sugerido
▶ Começar este treino|▶ Start this workout|▶ Empezar este entrenamiento
Usar na tela Hoje|Use on the Today screen|Usar en la pantalla Hoy
Refazer|Retake|Repetir
Combina com o seu objetivo|Matches your goal|Encaja con tu objetivo
Ponto a reforçar|Area to strengthen|Punto a reforzar
Base do seu treino|Foundation of your practice|Base de tu práctica
Um quiz de 2 minutos para começar no exercício certo.|A 2-minute quiz to start with the right exercise.|Un quiz de 2 minutos para empezar con el ejercicio correcto.
Fazer o quiz|Take the quiz|Hacer el quiz
Refazer o quiz de nível|Retake the level quiz|Repetir el quiz de nivel
Idioma|Language|Idioma
Alto contraste|High contrast|Alto contraste
Biblioteca|Library|Biblioteca
Exercício em andamento|Exercise in progress|Ejercicio en curso
▶ Continuar|▶ Resume|▶ Continuar
Ligar o microfone automaticamente ao iniciar o exercício (o botão 🎤 continua disponível para ligar quando quiser)|Turn the microphone on automatically when an exercise starts (the 🎤 button is always available)|Encender el micrófono automáticamente al iniciar el ejercicio (el botón 🎤 siempre está disponible)
Ferramentas|Tools|Herramientas
Não ouvi som nessa nota|I did not hear a sound on this note|No oí sonido en esta nota
Nota certa, mas não detectei uma nova palhetada|Right note, but no new pick was detected|Nota correcta, pero no detecté una nueva púa
Ouvi|I heard|Oí
em vez de|instead of|en vez de
Duração:|Duration:|Duración:
cada passada|each pass|cada pasada
No fim você escolhe: continuar em loop ou concluir.|At the end you choose: keep looping or finish.|Al final eliges: seguir en bucle o terminar.
🔁 Loop ligado: sem tempo fixo. Toque em Concluir e salvar quando terminar.|🔁 Loop on: no fixed time. Tap Finish and save when you are done.|🔁 Bucle activado: sin tiempo fijo. Toca Terminar y guardar cuando termines.
⏱ Tempo concluído!|⏱ Time is up!|⏱ ¡Tiempo cumplido!
🔁 Continuar em loop|🔁 Keep looping|🔁 Seguir en bucle
🔁 Loop|🔁 Loop|🔁 Bucle
Duração de cada exercício|Exercise duration|Duración de cada ejercicio
Cada passada dura|Each pass takes|Cada pasada dura
Para subir o BPM:|To raise the BPM:|Para subir el BPM:
passadas limpas seguidas|clean passes in a row|pasadas limpias seguidas
Sem tempo fixo: toque em Concluir e salvar quando terminar.|No fixed time: tap Finish and save when you are done.|Sin tiempo fijo: toca Terminar y guardar cuando termines.
Microfone bloqueado: libere nas permissões do site e toque no 🎤.|Microphone blocked: allow it in the site permissions and tap 🎤.|Micrófono bloqueado: permítelo en los permisos del sitio y toca 🎤.
Nenhum microfone encontrado. Dá para treinar com autoavaliação.|No microphone found. You can still train with self-assessment.|No se encontró micrófono. Puedes entrenar con autoevaluación.
Este navegador não permite microfone aqui (use HTTPS).|This browser does not allow the microphone here (use HTTPS).|Este navegador no permite el micrófono aquí (usa HTTPS).
Sobre|About|Acerca de
Novidades|What's new|Novedades
Atualizar app|Update app|Actualizar app
Atualizando…|Updating…|Actualizando…
Sensibilidade|Sensitivity|Sensibilidad
Treinar|Train|Entrenar
Progresso|Progress|Progreso
Metrônomo|Metronome|Metrónomo
Notas|Notes|Notas
Acordes|Chords|Acordes
Afinador|Tuner|Afinador
Ajustes|Settings|Ajustes
YouRock – treino de guitarra que escuta você|YouRock – guitar practice that listens to you|YouRock – práctica de guitarra que te escucha
Bora treinar 🎸|Let's practice 🎸|¡A practicar! 🎸
Treino que escuta você, ajusta a velocidade e mostra onde evoluir.|Practice that listens to you, adjusts the speed and shows where you improve.|Práctica que te escucha, ajusta la velocidad y te muestra dónde mejoras.
Sequência|Streak|Racha
Nível atual|Current level|Nivel actual
Treino de hoje|Today's workout|Entrenamiento de hoy
Escolhido pelos seus pontos fracos e pelo que você não pratica há mais tempo.|Chosen from your weak spots and what you haven't practiced in a while.|Elegido según tus puntos débiles y lo que hace más tiempo no practicas.
↻ Gerar outro|↻ Generate another|↻ Generar otro
Salvar como rotina|Save as routine|Guardar como rutina
Insights|Insights|Observaciones
Minhas rotinas|My routines|Mis rutinas
+ Nova|+ New|+ Nueva
Aquecimento 10 min|10-min warm-up|Calentamiento 10 min
Velocidade e solo|Speed and solo|Velocidad y solo
Ritmo e acordes|Rhythm and chords|Ritmo y acordes
Ainda sem dados. Faça seu primeiro treino para eu começar a analisar seus pontos fortes e fracos.|No data yet. Do your first workout so I can start analyzing your strengths and weaknesses.|Aún sin datos. Haz tu primer entrenamiento para que empiece a analizar tus puntos fuertes y débiles.
Você ainda não treinou hoje. Dez minutos já mantêm o hábito.|You haven't practiced today. Ten minutes already keeps the habit going.|Todavía no has practicado hoy. Diez minutos ya mantienen el hábito.
Meta semanal batida! 🎯|Weekly goal reached! 🎯|¡Meta semanal alcanzada! 🎯
Primeiro treino|First workout|Primer entrenamiento
10 horas de prática|10 hours of practice|10 horas de práctica
Mestre da precisão (≥95%)|Accuracy master (≥95%)|Maestro de la precisión (≥95%)
Explorador: 5 focos|Explorer: 5 focuses|Explorador: 5 enfoques
Meta semanal|Weekly goal|Meta semanal
Novo para você|New for you|Nuevo para ti
Buscar exercício…|Search exercise…|Buscar ejercicio…
Todos|All|Todos
★ Favoritos|★ Favorites|★ Favoritos
Todos os níveis|All levels|Todos los niveles
Nada encontrado.|Nothing found.|No se encontró nada.
Vazia: adicione exercícios na Biblioteca.|Empty: add exercises from the Library.|Vacía: añade ejercicios desde la Biblioteca.
Adicionar na rotina:|Add to routine:|Añadir a la rutina:
▶ Treinar|▶ Train|▶ Entrenar
+ Rotina|+ Routine|+ Rutina
precisão da passada|pass accuracy|precisión de la pasada
Como foi a última passada?|How was the last pass?|¿Cómo fue la última pasada?
Autoavaliação|Self-rating|Autoevaluación
✓ Limpa|✓ Clean|✓ Limpia
Concluir e salvar ▸|Finish and save ▸|Terminar y guardar ▸
Pular|Skip|Saltar
Reiniciar|Restart|Reiniciar
■ Parar|■ Stop|■ Parar
▶ Iniciar|▶ Start|▶ Iniciar
■ Parar demo|■ Stop demo|■ Parar demo
🔊 Demo|🔊 Demo|🔊 Demo
Pestana: F segurado, corda por corda|Barre chord: F held, string by string|Cejilla: F sostenido, cuerda por cuerda
Pestana na casa 1 (forma de Mi). Segure o acorde e toque nota a nota, de baixo para cima e de volta. Se alguma corda abafar, ajuste o dedo da pestana.|Barre on fret 1 (E shape). Hold the chord and pick each note, up and back down. If a string is muted, adjust your barre finger.|Cejilla en el traste 1 (forma de Mi). Mantén el acorde y toca nota a nota, hacia arriba y de vuelta. Si alguna cuerda suena apagada, ajusta el dedo de la cejilla.
Pestana: Bm segurado, corda por corda|Barre chord: Bm held, string by string|Cejilla: Bm sostenido, cuerda por cuerda
Pestana na casa 2 (forma de Lá menor). Mesma ideia do F: pressione com a lateral do indicador e deixe cada nota soar inteira.|Barre on fret 2 (A minor shape). Same idea as F: press with the side of your index finger and let every note ring out.|Cejilla en el traste 2 (forma de La menor). La misma idea que con F: presiona con el lateral del índice y deja sonar cada nota.
Troca F · C rasgueada|Strummed F · C change|Cambio F · C rasgueado
Quatro batidas em F (pestana) e quatro em C (aberto), alternando. Prepare o indicador antes do tempo 1 de cada acorde.|Four beats of F (barre), four of C (open), alternating. Get your index finger ready before beat 1 of each chord.|Cuatro golpes en F (cejilla) y cuatro en C (abierto), alternando. Prepara el índice antes del tiempo 1 de cada acorde.
Troca F · Bb · C rasgueada|Strummed F · Bb · C change|Cambio F · Bb · C rasgueado
Três acordes que aparecem juntos em muitas músicas: F e Bb com pestana, C aberto. A pestana desliza uma casa e a forma muda de Mi para Lá.|Three chords that show up together in many songs: F and Bb with a barre, open C. The barre moves and the shape changes from E to A.|Tres acordes que aparecen juntos en muchas canciones: F y Bb con cejilla, C abierto. La cejilla se desplaza y la forma cambia de Mi a La.
Formas móveis: forma de Mi em F · G · A|Moveable shapes: E shape on F · G · A|Formas móviles: forma de Mi en F · G · A
O mesmo desenho de pestana deslizando pelo braço (casas 1, 3 e 5). Quem sabe uma forma sabe todos os acordes maiores.|The same barre shape sliding up the neck (frets 1, 3 and 5). If you know one shape, you know every major chord.|La misma forma de cejilla deslizándose por el mástil (trastes 1, 3 y 5). Quien conoce una forma conoce todos los acordes mayores.
Formas móveis: forma de Lá em Bb · C · D|Moveable shapes: A shape on Bb · C · D|Formas móviles: forma de La en Bb · C · D
A forma de Lá com pestana nas casas 1, 3 e 5. A fundamental fica na corda 5 (Lá): é dela que vem o nome do acorde.|The A shape barred on frets 1, 3 and 5. The root sits on string 5 (A) and gives the chord its name.|La forma de La con cejilla en los trastes 1, 3 y 5. La fundamental está en la cuerda 5 (La) y da nombre al acorde.
Rasgueado pop com pestana (F · Bm)|Pop strum with barre chords (F · Bm)|Rasgueo pop con cejilla (F · Bm)
Padrão de pop com pausa no tempo 2, alternando F e Bm. Solte um pouco a pressão da pestana entre as batidas para descansar a mão.|A pop pattern with a pause on beat 2, alternating F and Bm. Ease the barre pressure a little between strums to rest your hand.|Un patrón pop con pausa en el tiempo 2, alternando F y Bm. Afloja un poco la presión de la cejilla entre golpes para descansar la mano.
Progressão com pestana: F · Bb · Gm · C|Barre chord progression: F · Bb · Gm · C|Progresión con cejilla: F · Bb · Gm · C
Quatro acordes em ciclo, três deles com pestana (Gm usa a forma de Mi menor na casa 3). Troque sem parar o ritmo, mesmo que o acorde saia imperfeito.|Four chords in a loop, three of them barred (Gm uses the E minor shape on fret 3). Change without stopping the rhythm, even if the chord is imperfect.|Cuatro acordes en bucle, tres con cejilla (Gm usa la forma de Mi menor en el traste 3). Cambia sin parar el ritmo, aunque el acorde no salga perfecto.
Escutando|Listening|Escuchando
🎤 Ativar microfone|🎤 Enable microphone|🎤 Activar micrófono
🚀 Auto-velocidade|🚀 Auto speed|🚀 Auto-velocidad
% de precisão|% accuracy|% de precisión
🎉 Treino completo!|🎉 Workout complete!|🎉 ¡Entrenamiento completo!
Dica: use fones para o clique do metrônomo não entrar no microfone. Barra de espaço inicia/para.|Tip: use headphones so the metronome click doesn't reach the microphone. Space bar starts/stops.|Consejo: usa auriculares para que el clic del metrónomo no entre en el micrófono. La barra espaciadora inicia/para.
Fila de hoje|Today's queue|Cola de hoy
divisões por tempo|divisions per beat|divisiones por tiempo
não iniciado|not started|sin empezar
tempo total|total time|tiempo total
sessões|sessions|sesiones
dias seguidos|days in a row|días seguidos
maior BPM limpo|best clean BPM|mejor BPM limpio
Últimos 30 dias|Last 30 days|Últimos 30 días
Foco e precisão|Focus and accuracy|Enfoque y precisión
Evolução por exercício|Progress by exercise|Progreso por ejercicio
Treine para ver a evolução.|Practice to see your progress.|Practica para ver tu progreso.
Conquistas|Achievements|Logros
Carregar dados de exemplo|Load sample data|Cargar datos de ejemplo
Exportar JSON|Export JSON|Exportar JSON
Apagar tudo|Delete everything|Borrar todo
Dados de exemplo carregados|Sample data loaded|Datos de ejemplo cargados
Toque uma corda solta|Play an open string|Toca una cuerda al aire
Tom de referência:|Reference tone:|Tono de referencia:
Meu nível|My level|Mi nivel
Automático (pelo seu domínio dos exercícios)|Automatic (based on your mastery of the exercises)|Automático (según tu dominio de los ejercicios)
Usar o ritmo de aprendizado de cada nível (recomendado). Desmarque para usar os valores manuais abaixo.|Use each level's learning pace (recommended). Uncheck to use the manual values below.|Usar el ritmo de aprendizaje de cada nivel (recomendado). Desmarca para usar los valores manuales de abajo.
Precisão para a passada contar como limpa:|Accuracy for a pass to count as clean:|Precisión para que una pasada cuente como limpia:
Passadas limpas seguidas para subir o BPM:|Clean passes in a row to raise the BPM:|Pasadas limpias seguidas para subir el BPM:
Quanto subir/descer o BPM:|How much to raise/lower the BPM:|Cuánto subir/bajar el BPM:
Latência do dispositivo:|Device latency:|Latencia del dispositivo:
Calibrar automaticamente|Calibrate automatically|Calibrar automáticamente
Precisa de microfone e alto-falante (sem fones). Compensa o atraso entre ouvir o clique e o som voltar.|Needs a microphone and speaker (no headphones). Compensates the delay between hearing the click and the sound coming back.|Necesita micrófono y altavoz (sin auriculares). Compensa el retraso entre oír el clic y que vuelva el sonido.
Contagem regressiva antes de começar|Countdown before starting|Cuenta atrás antes de empezar
Sem contagem|No countdown|Sin cuenta atrás
Cada número aparece junto com um clique do metrônomo; a primeira nota vem logo depois do 1.|Each number appears with a metronome click; the first note comes right after the 1.|Cada número aparece con un clic del metrónomo; la primera nota llega justo después del 1.
Rótulo das bolinhas no braço|Label of the dots on the fretboard|Etiqueta de los puntos en el mástil
Nome da nota|Note name|Nombre de la nota
Número da casa|Fret number|Número de traste
Nomes das notas|Note names|Nombres de las notas
Cifra (C D E F G A B)|Letters (C D E F G A B)|Cifrado (C D E F G A B)
Solfejo (Dó Ré Mi Fá Sol Lá Si)|Solfège (Do Re Mi Fa Sol La Ti)|Solfeo (Do Re Mi Fa Sol La Si)
Acidentes|Accidentals|Alteraciones
Sustenidos (C#, D#…)|Sharps (C#, D#…)|Sostenidos (C#, D#…)
Bemóis (Db, Eb…)|Flats (Db, Eb…)|Bemoles (Db, Eb…)
Modo canhoto (espelha o braço)|Left-handed mode (mirrors the neck)|Modo zurdo (refleja el mástil)
Teste do microfone|Microphone test|Prueba del micrófono
Ligue, toque uma corda solta e veja: o nível deve passar de ~20%, a nota detectada deve bater com a corda e cada palhetada deve contar um ataque.|Turn it on, play an open string and check: the level should pass ~20%, the detected note should match the string and each pick should count one attack.|Actívalo, toca una cuerda al aire y mira: el nivel debe pasar de ~20 %, la nota detectada debe coincidir con la cuerda y cada púa debe contar un ataque.
🎤 Ligar teste|🎤 Start test|🎤 Iniciar prueba
■ Parar teste|■ Stop test|■ Parar prueba
nota detectada|detected note|nota detectada
frequência|frequency|frecuencia
ataques (últimos 6 s)|attacks (last 6 s)|ataques (últimos 6 s)
Sinal fraco: aproxime o microfone, aumente o ganho/volume de entrada do sistema ou toque mais forte.|Weak signal: move the microphone closer, raise the system input gain/volume or play harder.|Señal débil: acerca el micrófono, sube la ganancia/volumen de entrada del sistema o toca más fuerte.
Sinal alto demais (pode saturar): afaste um pouco ou reduza o ganho de entrada.|Signal too loud (may clip): move away a bit or lower the input gain.|Señal demasiado alta (puede saturar): aléjate un poco o reduce la ganancia de entrada.
Nível bom.|Good level.|Buen nivel.
Nome da rotina:|Routine name:|Nombre de la rutina:
Rotina salva|Routine saved|Rutina guardada
Apagar esta rotina?|Delete this routine?|¿Borrar esta rutina?
Novo nome:|New name:|Nuevo nombre:
Crie uma rotina primeiro|Create a routine first|Crea una rutina primero
Microfone ligado. Use fones para o clique não ser captado.|Microphone on. Use headphones so the click isn't picked up.|Micrófono activado. Usa auriculares para que no se capte el clic.
Não consegui acessar o microfone. Dá para treinar com autoavaliação.|Couldn't access the microphone. You can still practice with self-rating.|No pude acceder al micrófono. Puedes practicar con autoevaluación.
Sem acesso ao microfone|No microphone access|Sin acceso al micrófono
Esse é o último exercício|That is the last exercise|Es el último ejercicio
Calibrando… fique em silêncio, sem fones|Calibrating… stay quiet, no headphones|Calibrando… permanece en silencio, sin auriculares
Não ouvi os cliques. Aumente o volume e tente de novo.|I didn't hear the clicks. Raise the volume and try again.|No oí los clics. Sube el volumen e inténtalo de nuevo.
Apagar todos os seus dados? Isso não pode ser desfeito.|Delete all your data? This cannot be undone.|¿Borrar todos tus datos? Esto no se puede deshacer.
permissão negada (libere o microfone no navegador).|permission denied (allow the microphone in the browser).|permiso denegado (permite el micrófono en el navegador).
nenhum microfone encontrado.|no microphone found.|no se encontró ningún micrófono.
use localhost ou HTTPS.|use localhost or HTTPS.|usa localhost o HTTPS.
Mecânica|Mechanics|Mecánica
Palhetada|Picking|Púa
Solo|Solo|Solo
Legato|Legato|Legato
Sweep|Sweep|Sweep
Ritmo|Rhythm|Ritmo
Nível I|Level I|Nivel I
Nível II|Level II|Nivel II
Nível III|Level III|Nivel III
Nível IV|Level IV|Nivel IV
Fundamentos|Fundamentals|Fundamentos
Consolidação|Consolidation|Consolidación
Técnica|Technique|Técnica
Domínio|Mastery|Dominio
10–15 min por dia, 5×/semana|10–15 min a day, 5×/week|10–15 min al día, 5×/semana
15–25 min por dia, 5×/semana|15–25 min a day, 5×/week|15–25 min al día, 5×/semana
25–40 min por dia, 5–6×/semana|25–40 min a day, 5–6×/week|25–40 min al día, 5–6×/semana
40–60 min por dia, 6×/semana|40–60 min a day, 6×/week|40–60 min al día, 6×/semana
Coordenação das duas mãos, palhetada alternada e os primeiros acordes. Uma nota por clique do metrônomo, em andamento lento. O objetivo é soar limpo, não rápido.|Two-hand coordination, alternate picking and the first chords. One note per metronome click, at a slow tempo. The goal is to sound clean, not fast.|Coordinación de las dos manos, púa alterna y los primeros acordes. Una nota por clic del metrónomo, a tempo lento. El objetivo es sonar limpio, no rápido.
Troca de cordas com palhetada alternada, digitações menos óbvias, primeiro legato, primeiros arpejos de acordes e rasgueados com síncopa. A partir daqui, duas notas por clique (colcheias).|String changes with alternate picking, less obvious fingerings, first legato, first chord arpeggios and syncopated strumming. From here on, two notes per click (eighth notes).|Cambios de cuerda con púa alterna, digitaciones menos obvias, primer legato, primeros arpegios de acordes y rasgueos con síncopa. A partir de aquí, dos notas por clic (corcheas).
Contratempo, saltos de terça e de corda, trinados com abertura maior e tremolo. Exige relaxamento e controle em velocidades médias.|Offbeats, thirds and string skipping, trills with a wider stretch and tremolo. Demands relaxation and control at medium speeds.|Contratiempo, saltos de tercera y de cuerda, trinos con mayor abertura y trémolo. Exige relajación y control a velocidades medias.
Primeiro sweep, economy picking, sequências longas, outras posições do braço e funk em semicolcheias. Pede precisão de 90% ou mais.|First sweep, economy picking, long sequences, other positions on the neck and sixteenth-note funk. Calls for 90% accuracy or more.|Primer sweep, economy picking, secuencias largas, otras posiciones del mástil y funk en semicorcheas. Pide una precisión del 90 % o más.
Um dedo por casa, subindo corda por corda. Mantenha a mão relaxada e as notas limpas.|One finger per fret, climbing string by string. Keep your hand relaxed and the notes clean.|Un dedo por traste, subiendo cuerda por cuerda. Mantén la mano relajada y las notas limpias.
Cromático ida e volta|Chromatic there and back|Cromático ida y vuelta
Quatro casas, quatro dedos, em todas as cordas.|Four frets, four fingers, on every string.|Cuatro trastes, cuatro dedos, en todas las cuerdas.
Palhetada alternada – cordas A/D/G/B|Alternate picking – A/D/G/B strings|Púa alterna – cuerdas A/D/G/B
Pra baixo e pra cima, sempre alternando. Palheta relaxada.|Down and up, always alternating. Relaxed pick.|Hacia abajo y hacia arriba, siempre alternando. Púa relajada.
Tremolo picking|Tremolo picking|Tremolo picking
Oito palhetadas na mesma nota. Cada palhetada precisa soar (usa detecção de ataque).|Eight picks on the same note. Every pick has to sound (uses attack detection).|Ocho púas en la misma nota. Cada púa tiene que sonar (usa detección de ataque).
Salto de cordas|String skipping|Salto de cuerdas
Pule uma corda mantendo a palhetada alternada.|Skip a string while keeping alternate picking.|Salta una cuerda manteniendo la púa alterna.
Economy em 3 notas por corda (Mi menor, casa 12)|Economy with 3 notes per string (E minor, 12th fret)|Economy con 3 notas por cuerda (Mi menor, traste 12)
Mesma escala em 3 notas por corda, agora na região da casa 12 (Mi menor). Varra a palheta ao trocar de corda na mesma direção.|Same scale in 3 notes per string, now around the 12th fret (E minor). Sweep the pick when changing strings in the same direction.|Misma escala en 3 notas por cuerda, ahora en la zona del traste 12 (Mi menor). Barre la púa al cambiar de cuerda en la misma dirección.
Pentatônica menor – posição 1|Minor pentatonic – position 1|Pentatónica menor – posición 1
Subir e descer a escala de Lá menor pentatônica.|Go up and down the A minor pentatonic scale.|Sube y baja la escala pentatónica de La menor.
Pentatônica em grupos de 4|Pentatonic in groups of 4|Pentatónica en grupos de 4
Sequência 1-2-3-4, 2-3-4-5... na escala.|Sequence 1-2-3-4, 2-3-4-5... on the scale.|Secuencia 1-2-3-4, 2-3-4-5... en la escala.
Pentatônica menor – posição 2|Minor pentatonic – position 2|Pentatónica menor – posición 2
A mesma escala de Lá menor pentatônica, agora na casa 7. Aprenda a forma nova sem olhar a anterior.|The same A minor pentatonic scale, now at fret 7. Learn the new shape without looking at the previous one.|La misma escala de La menor pentatónica, ahora en el traste 7. Aprende la forma nueva sin mirar la anterior.
Pentatônica menor – posição 3|Minor pentatonic – position 3|Pentatónica menor – posición 3
Terceira forma da pentatônica, na casa 10. Note onde ela se encaixa entre as outras posições.|Third pentatonic shape, at fret 10. Notice where it fits between the other positions.|Tercera forma de la pentatónica, en el traste 10. Fíjate dónde encaja entre las otras posiciones.
Escala blues menor – Lá|A minor blues scale|Escala blues menor – La
Pentatônica com a "blue note" (Mib) na corda Lá. Passe por ela sem parar: é a nota do blues.|Pentatonic with the "blue note" (Eb) on the A string. Pass through it without stopping: it is the blues note.|Pentatónica con la "blue note" (Mib) en la cuerda La. Pasa por ella sin detenerte: es la nota del blues.
Pentatônica em grupos de 3|Pentatonic in groups of 3|Pentatónica en grupos de 3
Sequências de 3 notas deslizando pela pentatônica, no mesmo estilo dos grupos de 4.|Sequences of 3 notes sliding along the pentatonic, in the same style as the groups of 4.|Secuencias de 3 notas deslizándose por la pentatónica, igual que los grupos de 4.
Pentatônica maior – Lá|Major pentatonic – A|Pentatónica mayor – La
Escala de som aberto e alegre (country, rock clássico). Fica na casa 4 a 7.|Open, cheerful sounding scale (country, classic rock). Sits at frets 4 to 7.|Escala de sonido abierto y alegre (country, rock clásico). Está en los trastes 4 a 7.
3 notas por corda em terças|3 notes per string in thirds|3 notas por cuerda en terceras
Saltos de uma nota na escala de Lá menor em 3 notas por corda. Boa base para frases melódicas.|One-note skips on the A minor scale in 3 notes per string. A good base for melodic phrases.|Saltos de una nota en la escala de La menor en 3 notas por cuerda. Buena base para frases melódicas.
3 licks clássicos na pentatônica|3 classic pentatonic licks|3 licks clásicos en la pentatónica
Três frases curtas de 8 notas, repetidas duas vezes cada. Toque como frase, não como escala.|Three short 8-note phrases, each repeated twice. Play it as a phrase, not as a scale.|Tres frases cortas de 8 notas, repetidas dos veces cada una. Tócalo como frase, no como escala.
Pentatônica ligando posições 1 e 2|Pentatonic linking positions 1 and 2|Pentatónica uniendo posiciones 1 y 2
Sobe pela diagonal, saindo da posição 1 e chegando à posição 2. É assim que o solo anda pelo braço.|Climbs diagonally, leaving position 1 and arriving at position 2. This is how a solo travels along the neck.|Sube en diagonal, saliendo de la posición 1 y llegando a la posición 2. Así es como el solo recorre el mástil.
Mi dórico – 3 notas por corda (casa 7)|E dorian – 3 notes per string (fret 7)|Mi dórico – 3 notas por cuerda (traste 7)
Modo dórico: som menor com a 6ª maior (Dó#). Muito usado em rock, funk e fusion.|Dorian mode: minor sound with a major 6th (C#). Widely used in rock, funk and fusion.|Modo dórico: sonido menor con la 6ª mayor (Do#). Muy usado en rock, funk y fusión.
Lá menor harmônica – casa 5|A harmonic minor – fret 5|La menor armónica – traste 5
Menor com sétima maior (Sol#). Cuidado com o salto entre Fá e Sol#, que dá o som neoclássico.|Minor with a major seventh (G#). Watch the jump between F and G#, which gives the neoclassical sound.|Menor con séptima mayor (Sol#). Cuidado con el salto entre Fa y Sol#, que da el sonido neoclásico.
Slide 5-7-9 por corda|Slide 5-7-9 per string|Slide 5-7-9 por cuerda
Palhete só a primeira nota e deslize o dedo para as casas seguintes sem soltar a corda.|Pick only the first note and slide your finger to the next frets without lifting off the string.|Puntea solo la primera nota y desliza el dedo hacia los trastes siguientes sin soltar la cuerda.
Pentatônica em legato|Pentatonic in legato|Pentatónica en legato
Palhete só a primeira nota de cada corda; a segunda sai com martelinho ou puxada.|Pick only the first note on each string; the second comes from a hammer-on or pull-off.|Puntea solo la primera nota de cada cuerda; la segunda sale con hammer-on o pull-off.
Legato em 3 notas por corda|Legato with 3 notes per string|Legato con 3 notas por cuerda
Martelinho e puxada com três dedos em cada corda. Só a primeira nota de cada corda é palhetada.|Hammer-ons and pull-offs with three fingers on each string. Only the first note of each string is picked.|Hammer-on y pull-off con tres dedos en cada cuerda. Solo se puntea la primera nota de cada cuerda.
Legato cromático 1-2-3-4|Chromatic legato 1-2-3-4|Legato cromático 1-2-3-4
Os quatro dedos em casas vizinhas, só com martelinho e puxada. Cuide da força do dedo mínimo.|All four fingers on neighbouring frets, using only hammer-ons and pull-offs. Watch the strength of your pinky.|Los cuatro dedos en trastes vecinos, solo con hammer-on y pull-off. Cuida la fuerza del meñique.
Legato em sequências de 6 notas|Legato in 6-note sequences|Legato en secuencias de 6 notas
Três notas em cada corda, trocando de corda sem perder o ritmo. Palhete só a primeira de cada corda.|Three notes on each string, changing strings without losing the beat. Pick only the first note of each string.|Tres notas en cada cuerda, cambiando de cuerda sin perder el ritmo. Puntea solo la primera de cada cuerda.
Sweep de 3 cordas – Am|Sweep on 3 strings – Am|Sweep de 3 cuerdas – Am
Arpejo de Lá menor nas três cordas agudas. Um único movimento de palheta, sem bloquear a nota anterior.|A minor arpeggio on the three high strings. One continuous pick motion, without cutting the previous note.|Arpegio de La menor en las tres cuerdas agudas. Un único movimiento de púa, sin cortar la nota anterior.
Sweep de 4 cordas – Am|Sweep on 4 strings – Am|Sweep de 4 cuerdas – Am
Arpejo de Lá menor em quatro cordas. Cada nota soa limpa e sem se misturar com a seguinte.|A minor arpeggio on four strings. Each note sounds clean without blending into the next.|Arpegio de La menor en cuatro cuerdas. Cada nota suena limpia y sin mezclarse con la siguiente.
Sweep de 5 cordas – Am|Sweep on 5 strings – Am|Sweep de 5 cuerdas – Am
Arpejo de Lá menor em cinco cordas, na casa 5 a 7. Prepare o próximo dedo antes da palheta chegar.|A minor arpeggio on five strings, at frets 5 to 7. Prepare the next finger before the pick arrives.|Arpegio de La menor en cinco cuerdas, en los trastes 5 a 7. Prepara el siguiente dedo antes de que llegue la púa.
Arpejo C maior (6 cordas)|C major arpeggio (6 strings)|Arpegio de Do mayor (6 cuerdas)
O sweep de seis cordas em Dó maior. Compare o som maior com o arpejo de Lá menor.|The six-string sweep in C major. Compare the major sound with the A minor arpeggio.|El sweep de seis cuerdas en Do mayor. Compara el sonido mayor con el arpegio de La menor.
Palhetada só para baixo|Downstroke-only picking|Púa solo hacia abajo
Toque todas as notas com palhetadas para baixo, sem alternar. Cria um som firme e constante.|Play every note with a downstroke, without alternating. It builds a firm and steady sound.|Toca todas las notas con púa hacia abajo, sin alternar. Crea un sonido firme y constante.
Palhetada inside e outside|Inside and outside picking|Púa inside y outside
Alterne entre duas cordas vizinhas em padrões que fazem a palheta passar por dentro ou por fora.|Alternate between two neighbouring strings in patterns where the pick moves inside or outside.|Alterna entre dos cuerdas vecinas en patrones donde la púa pasa por dentro o por fuera.
Pedal point com corda solta|Pedal point with open string|Pedal point con cuerda al aire
A corda Lá solta serve de base e alterna com notas na corda Ré. Mantenha a palhetada alternada.|The open A string is the base and alternates with notes on the D string. Keep your picking alternate.|La cuerda La al aire sirve de base y alterna con notas en la cuerda Re. Mantén la púa alternada.
Arpejo Em · Am dedilhado|Fingerpicked Em · Am arpeggio|Arpegio Em · Am con los dedos
Dois acordes abertos, tocados nota a nota de baixo para cima e de volta. Deixe as notas soarem.|Two open chords played one note at a time, up and back down. Let the notes ring.|Dos acordes abiertos tocados nota a nota, hacia arriba y de vuelta. Deja que las notas suenen.
Arpejo G · Em · C · D dedilhado|Fingerpicked G · Em · C · D arpeggio|Arpegio G · Em · C · D con los dedos
A sequência mais comum do pop em quatro acordes abertos. Prepare o próximo acorde antes de trocar.|The most common pop sequence in four open chords. Prepare the next chord before changing.|La secuencia más común del pop en cuatro acordes abiertos. Prepara el siguiente acorde antes de cambiar.
Arpejo Am · Dm · E dedilhado|Fingerpicked Am · Dm · E arpeggio|Arpegio Am · Dm · E con los dedos
A progressão menor clássica (i, iv, V). Observe como o acorde E resolve para o Am.|The classic minor progression (i, iv, V). Notice how the E chord resolves back to Am.|La progresión menor clásica (i, iv, V). Observa cómo el acorde E resuelve en Am.
Power chords E5 · A5 · D5 (nota a nota)|Power chords E5 · A5 · D5 (note by note)|Power chords E5 · A5 · D5 (nota a nota)
Duas notas por acorde (fundamental e quinta). Base do rock: toque limpo, sem encostar nas outras cordas.|Two notes per chord (root and fifth). The base of rock: play cleanly without touching the other strings.|Dos notas por acorde (fundamental y quinta). La base del rock: toca limpio, sin rozar las otras cuerdas.
Arpejo F (pestana) · C|F (barre) · C arpeggio|Arpegio F (cejilla) · C
O primeiro acorde com pestana. Pressione com a lateral do indicador e deixe todas as notas soarem.|The first barre chord. Press with the side of your index finger and let every note ring.|El primer acorde con cejilla. Presiona con el lateral del índice y deja que todas las notas suenen.
Arpejo Bm (pestana) · G · D|Bm (barre) · G · D arpeggio|Arpegio Bm (cejilla) · G · D
Pestana na casa 2 com a forma de Lá menor. Depois volte para acordes abertos sem perder o tempo.|Barre at fret 2 with the A minor shape. Then return to open chords without losing the beat.|Cejilla en el traste 2 con la forma de La menor. Luego vuelve a acordes abiertos sin perder el tiempo.
C maior em duas formas (aberto e casa 3)|C major in two shapes (open and fret 3)|Do mayor en dos formas (abierto y traste 3)
O mesmo acorde de Dó maior, primeiro aberto e depois com a forma de Lá na casa 3. É a ideia do sistema CAGED.|The same C major chord, first open and then with the A shape at fret 3. This is the idea behind the CAGED system.|El mismo acorde de Do mayor, primero abierto y luego con la forma de La en el traste 3. Es la idea del sistema CAGED.
Rasgueado em semínimas ↓ ↓ ↓ ↓|Quarter-note strumming ↓ ↓ ↓ ↓|Rasgueo en negras ↓ ↓ ↓ ↓
Uma batida para baixo por tempo, em um único acorde. O primeiro passo antes de usar a mão para cima.|One downstroke per beat on a single chord. The first step before using the upstroke.|Un golpe hacia abajo por tiempo sobre un solo acorde. El primer paso antes de usar el golpe hacia arriba.
Palm mute em colcheias (power chord)|Palm mute in eighth notes (power chord)|Palm mute en corcheas (power chord)
Apoie a lateral da mão direita perto da ponte para abafar. Colcheias constantes, todas para baixo.|Rest the side of your picking hand near the bridge to mute. Steady eighth notes, all downstrokes.|Apoya el lateral de la mano derecha cerca del puente para apagar. Corcheas constantes, todas hacia abajo.
Síncopa pop (pausa no 2)|Pop syncopation (rest on 2)|Síncopa pop (pausa en el 2)
O tempo 2 fica em silêncio e a mão continua se movendo. Esse é o ritmo de muitas músicas pop.|Beat 2 stays silent while your hand keeps moving. This is the rhythm of many pop songs.|El tiempo 2 queda en silencio y la mano sigue moviéndose. Es el ritmo de muchas canciones pop.
Semicolcheias contínuas|Continuous sixteenth notes|Semicorcheas continuas
Quatro batidas por tempo, alternando baixo e cima. Mão relaxada e movimento pequeno.|Four strums per beat, alternating down and up. Relaxed hand and small motion.|Cuatro golpes por tiempo, alternando abajo y arriba. Mano relajada y movimiento pequeño.
Galope (colcheia + 2 semicolcheias)|Gallop (eighth + two sixteenths)|Galope (corchea + 2 semicorcheas)
Uma batida longa e duas curtas em cada tempo. O ritmo clássico do heavy metal.|One long strum and two short ones on every beat. The classic heavy metal rhythm.|Un golpe largo y dos cortos en cada tiempo. El ritmo clásico del heavy metal.
Pentatônica em terças|Pentatonic in thirds|Pentatónica en terceras
Saltos de uma nota sobre a escala, ótimo para frases.|Skipping a note over the scale, great for phrases.|Saltos de una nota sobre la escala, ideal para frases.
3 notas por corda – Lá menor|3 notes per string – A minor|3 notas por cuerda – La menor
A escala natural em 3 notas por corda, subindo e descendo.|The natural scale in 3 notes per string, up and down.|La escala natural en 3 notas por cuerda, subiendo y bajando.
3nps em grupos de 3|3nps in groups of 3|3nps en grupos de 3
Sequências de 3 notas deslizando pela escala.|Sequences of 3 notes sliding along the scale.|Secuencias de 3 notas deslizándose por la escala.
Hammer-on e pull-off 5-7-8|Hammer-on and pull-off 5-7-8|Hammer-on y pull-off 5-7-8
Só a primeira nota é palhetada; o resto vem dos dedos.|Only the first note is picked; the rest comes from the fingers.|Solo se puntea la primera nota; el resto sale de los dedos.
Alterne rápido entre duas casas só com martelinho e puxada.|Alternate quickly between two frets using only hammer-ons and pull-offs.|Alterna rápido entre dos trastes solo con hammer-on y pull-off.
Arpejo Am (6 cordas, subir e descer)|Am arpeggio (6 strings, up and down)|Arpegio Am (6 cuerdas, subir y bajar)
Deslize a palheta de forma contínua pelas cordas, uma nota por corda.|Glide the pick continuously across the strings, one note per string.|Desliza la púa de forma continua por las cuerdas, una nota por cuerda.
Arpejo Am repetido|Repeated Am arpeggio|Arpegio Am repetido
Duas voltas seguidas, com ênfase na limpeza.|Two rounds in a row, focusing on clean notes.|Dos vueltas seguidas, con énfasis en la limpieza.
Dois acordes, um padrão de dedilhado. Deixe as notas soarem.|Two chords, one fingerpicking pattern. Let the notes ring.|Dos acordes, un patrón de punteo. Deja que las notas suenen.
Rasgueado básico ↓ ↓↑ ↑↓↑|Basic strumming ↓ ↓↑ ↑↓↑|Rasgueo básico ↓ ↓↑ ↑↓↑
O padrão clássico do pop/folk.|The classic pop/folk pattern.|El patrón clásico del pop/folk.
Colcheias contínuas|Continuous eighth notes|Corcheas continuas
Mão constante pra baixo e pra cima.|Constant hand motion down and up.|Mano constante hacia abajo y hacia arriba.
Contratempo (reggae)|Offbeat (reggae)|Contratiempo (reggae)
Acentue o "e" de cada tempo.|Accent the "and" of each beat.|Acentúa el "y" de cada tiempo.
Funk 16 com abafado|Sixteenth-note funk with muting|Funk a 16 con apagado
Abafe com a mão esquerda nos "x" e mantenha a mão direita contínua.|Mute with the left hand on the "x" and keep the right hand going.|Apaga con la mano izquierda en las "x" y mantén la mano derecha continua.
Troca de acordes Em–Am|Chord change Em–Am|Cambio de acordes Em–Am
Uma passada por compasso, só dois acordes. Troque de acorde antes do próximo tempo 1.|One strum per bar, just two chords. Change chord before the next beat 1.|Una pasada por compás, solo dos acordes. Cambia de acorde antes del próximo tiempo 1.
Troca de acordes Am–C–G–Em|Chord change Am–C–G–Em|Cambio de acordes Am–C–G–Em
Uma passada por compasso, agora com quatro acordes. Troque antes do próximo tempo 1.|One strum per bar, now with four chords. Change before the next beat 1.|Una pasada por compás, ahora con cuatro acordes. Cambia antes del próximo tiempo 1.
Palhetada alternada em corda solta|Alternate picking on an open string|Púa alterna en cuerda al aire
Repita a corda Si solta com palhetadas ↓↑ constantes. Só a mão da palheta trabalha: pulso relaxado, movimento pequeno.|Repeat the open B string with constant ↓↑ picks. Only the picking hand works: relaxed wrist, small movement.|Repite la cuerda Si al aire con púas ↓↑ constantes. Solo trabaja la mano de la púa: muñeca relajada, movimiento pequeño.
Spider Walk misto (1-3-2-4 + 4-2-3-1)|Mixed Spider Walk (1-3-2-4 + 4-2-3-1)|Spider Walk mixto (1-3-2-4 + 4-2-3-1)
Duas digitações alternadas na mesma passada, sem perder o tempo.|Two fingerings alternating in the same pass, without losing the beat.|Dos digitaciones alternadas en la misma pasada, sin perder el tiempo.
Economy em grupos de 4|Economy in groups of 4|Economy en grupos de 4
Sequências de 4 notas pela escala, varrendo a palheta nas trocas de corda.|Sequences of 4 notes along the scale, sweeping the pick on string changes.|Secuencias de 4 notas por la escala, barriendo la púa en los cambios de cuerda.
Dó|Do|Do
Dó#|Do#|Do#
Ré|Re|Re
Ré#|Re#|Re#
Mi|Mi|Mi
Fá|Fa|Fa
Fá#|Fa#|Fa#
Sol|Sol|Sol
Sol#|Sol#|Sol#
Lá|La|La
Lá#|La#|La#
Si|Ti|Si
Réb|Reb|Reb
Mib|Mib|Mib
Solb|Solb|Solb
Láb|Lab|Lab
Sib|Tib|Sib
Só os tempos|Beats only|Solo los tiempos
Colcheias (2 por tempo)|Eighth notes (2 per beat)|Corcheas (2 por tiempo)
Tercinas (3 por tempo)|Triplets (3 per beat)|Tresillos (3 por tiempo)
Semicolcheias (4 por tempo)|Sixteenth notes (4 per beat)|Semicorcheas (4 por tiempo)
Tempos por compasso|Beats per bar|Tiempos por compás
Subdivisão|Subdivision|Subdivisión
Volume:|Volume:|Volumen:
Acentuar o primeiro tempo do compasso|Accent the first beat of the bar|Acentuar el primer tiempo del compás
Treino de velocidade (acelera sozinho)|Speed trainer (speeds up by itself)|Entrenador de velocidad (acelera solo)
Subir|Raise by|Subir
BPM a cada|BPM every|BPM cada
compassos, até|bars, up to|compases, hasta
BPM|BPM|BPM
Tap tempo|Tap tempo|Tap tempo
▶ Iniciar|▶ Start|▶ Iniciar
Barra de espaço inicia/para. Toque em "Tap tempo" no ritmo que quiser para descobrir o BPM.|Space bar starts/stops. Tap "Tap tempo" at any rhythm you like to find the BPM.|La barra espaciadora inicia/para. Toca "Tap tempo" al ritmo que quieras para descubrir el BPM.
Notas da Guitarra|Guitar Notes|Notas de la Guitarra
Toque em uma nota para ouvir e ver todas as posições dela no braço.|Tap a note to hear it and see all its positions on the neck.|Toca una nota para oírla y ver todas sus posiciones en el mástil.
Todas|All|Todas
Mostrar|Show|Mostrar
Todas as notas|All notes|Todas las notas
Só naturais (sem #/b)|Naturals only (no #/b)|Solo naturales (sin #/b)
Casas|Frets|Trastes
Rótulo|Label|Etiqueta
Cordas soltas|Open strings|Cuerdas al aire
Da mais fina (1ª) para a mais grossa (6ª). Nomes em cifra e, ao lado, no seu estilo de nomes.|From the thinnest (1st) to the thickest (6th). Names in letters and, next to them, in your chosen naming style.|De la más fina (1ª) a la más gruesa (6ª). Nombres en cifrado y, al lado, en tu estilo de nombres.
Regras rápidas|Quick rules|Reglas rápidas
A casa 12 repete a nota da corda solta (uma oitava acima).|The 12th fret repeats the open-string note (one octave higher).|El traste 12 repite la nota de la cuerda al aire (una octava más arriba).
Entre notas naturais há 2 casas (1 tom), exceto entre|Between natural notes there are 2 frets (1 whole tone), except between|Entre notas naturales hay 2 trastes (1 tono), excepto entre
Mi–Fá|Mi–Fa|Mi–Fa
Si–Dó|Ti–Do|Si–Do
, que têm 1 casa (meio tom).|, which are 1 fret apart (a semitone).|, que están a 1 traste (un semitono).
A mesma nota aparece em várias cordas: use as chips acima para ver onde.|The same note appears on several strings: use the chips above to see where.|La misma nota aparece en varias cuerdas: usa los botones de arriba para ver dónde.
Buscador de Acordes|Chord Finder|Buscador de Acordes
Digite o nome (Am, F#m7, Bb, C7, G/B, Dsus4…) ou escolha a nota e o tipo.|Type the name (Am, F#m7, Bb, C7, G/B, Dsus4…) or pick the note and type.|Escribe el nombre (Am, F#m7, Bb, C7, G/B, Dsus4…) o elige la nota y el tipo.
Digite um acorde: Am7, C#dim, G/B…|Type a chord: Am7, C#dim, G/B…|Escribe un acorde: Am7, C#dim, G/B…
Não reconheci esse acorde. Exemplos: Am, F#m7, Bb, C7, G/B, Dsus4.|I didn't recognize that chord. Examples: Am, F#m7, Bb, C7, G/B, Dsus4.|No reconocí ese acorde. Ejemplos: Am, F#m7, Bb, C7, G/B, Dsus4.
Não encontrei uma digitação simples (até 4 dedos) para esse acorde com essa nota no baixo.|I couldn't find a simple fingering (up to 4 fingers) for this chord with that bass note.|No encontré una digitación sencilla (hasta 4 dedos) para este acorde con esa nota en el bajo.
▶ Ouvir acorde|▶ Hear chord|▶ Escuchar acorde
▶ Ouvir|▶ Hear|▶ Escuchar
Ouvir|Listen|Escuchar
Notas:|Notes:|Notas:
Fórmula:|Formula:|Fórmula:
Posição aberta|Open position|Posición abierta
Maior|Major|Mayor
Menor|Minor|Menor
Dominante com sétima|Dominant seventh|Dominante con séptima
Maior com sétima maior|Major seventh|Mayor con séptima mayor
Menor com sétima|Minor seventh|Menor con séptima
Menor com sétima maior|Minor-major seventh|Menor con séptima mayor
Maior com sexta|Major sixth|Mayor con sexta
Menor com sexta|Minor sixth|Menor con sexta
Suspenso 2|Suspended 2|Suspendido 2
Suspenso 4|Suspended 4|Suspendido 4
Sétima suspensa|Suspended seventh|Séptima suspendida
Maior com nona|Major with ninth|Mayor con novena
✗ Com erros|✗ With errors|✗ Con errores
Com erros|With errors|Con errores
Dominante com nona|Dominant ninth|Dominante con novena
Menor com nona|Minor ninth|Menor con novena
Diminuto|Diminished|Disminuido
Diminuto com sétima|Diminished seventh|Disminuido con séptima
Meio-diminuto|Half-diminished|Semidisminuido
Aumentado|Augmented|Aumentado
Power chord (quinta)|Power chord (fifth)|Power chord (quinta)
`;
const DICT = {};
D_RAW.trim().split('\n').forEach(l => { const p = l.split('|'); if (p.length >= 3) { const k = p[0]; DICT[k] = [k, p[p.length - 2], p[p.length - 1]]; } });

// trechos (aplicados em textos dinâmicos, do mais longo ao mais curto)
const F_RAW = `
Este nível é mais avançado que o seu momento. Recomendo dominar antes|This level is more advanced than where you are now. I recommend mastering first|Este nivel es más avanzado que tu momento actual. Recomiendo dominar antes
(hoje:|(today:|(hoy:
Você pode treinar mesmo assim.|You can still practice it.|Aun así puedes practicarlo.
notas por clique (colcheias)|notes per click (eighth notes)|notas por clic (corcheas)
nota por clique|note per click|nota por clic
notas por clique|notes per click|notas por clic
divisões por|divisions per|divisiones por
começar em|start at|empezar en
não iniciado|not started|sin empezar
precisão|accuracy|precisión
clique|click|clic
exerc.|ex.|ej.
Mecânica|Mechanics|Mecánica
Palhetada|Picking|Púa
Ritmo|Rhythm|Ritmo
Você dominou|You mastered|Has dominado
Adicionado a|Added to|Añadido a
Latência:|Latency:|Latencia:
Falhou:|Failed:|Falló:
permissão negada (libere o microfone no navegador).|permission denied (allow the microphone in the browser).|permiso denegado (permite el micrófono en el navegador).
nenhum microfone encontrado.|no microphone found.|no se encontró ningún micrófono.
use localhost ou HTTPS.|use localhost or HTTPS.|usa localhost o HTTPS.
. Pronto para avançar para o Nível|. Ready to move on to Level|. Listo para avanzar al Nivel
exercícios dominados. Faltam|exercises mastered. Still needed:|ejercicios dominados. Faltan
para liberar o próximo nível.|to unlock the next level.|para desbloquear el siguiente nivel.
do Nível|of Level|del Nivel
Sequência de|Streak of|Racha de
dias seguidos. Consistência vale mais que sessões longas e raras.|days in a row. Consistency beats long, rare sessions.|días seguidos. La constancia vale más que sesiones largas y raras.
Ponto fraco:|Weak spot:|Punto débil:
% de precisão). Vou priorizar isso no treino do dia.|% accuracy). I'll prioritize this in today's workout.|% de precisión). Lo priorizaré en el entrenamiento del día.
% de precisão)|% accuracy)|% de precisión)
Pouca prática em:|Little practice in:|Poca práctica en:
. Um treino equilibrado evita lacunas.|. A balanced workout avoids gaps.|. Un entrenamiento equilibrado evita lagunas.
Platô em|Plateau in|Meseta en
": sem evolução há 3 sessões em|": no progress for 3 sessions at|": sin progreso en 3 sesiones en
BPM. Tente baixar 10%, mudar a subdivisão ou treinar em blocos de 30 s.|BPM. Try lowering by 10%, changing the subdivision or practicing in 30 s blocks.|BPM. Prueba a bajar un 10 %, cambiar la subdivisión o practicar en bloques de 30 s.
Evolução em|Progress in|Progreso en
BPM limpos desde a primeira sessão.|clean BPM since the first session.|BPM limpios desde la primera sesión.
Meta semanal:|Weekly goal:|Meta semanal:
Não treinado há|Not practiced for|Sin practicar desde hace
dia(s)|day(s)|día(s)
Autoavaliação: libera ao fim de cada passada|Self-rating: unlocks at the end of each pass|Autoevaluación: se habilita al final de cada pasada
notas ≈|notes ≈|notas ≈
% – voltando para|% – going back to|% – volviendo a
% limpo ×|% clean ×|% limpio ×
Salvo:|Saved:|Guardado:
% de precisão|% accuracy|% de precisión
BPM limpos|clean BPM|BPM limpios
Exercício dominado|Exercise mastered|Ejercicio dominado
liberado!|unlocked!|desbloqueado!
Começar treino|Start workout|Empezar entrenamiento
Sessão guiada|Guided session|Sesión guiada
exercícios|exercises|ejercicios
Sugerido:|Suggested:|Sugerido:
seu melhor limpo:|your best clean:|tu mejor limpio:
Notas por clique:|Notes per click:|Notas por clic:
(padrão do nível)|(level default)|(predeterminado del nivel)
Treino de|Workout of|Entrenamiento del
Siga a trilha em ordem. Um nível é recomendado como concluído quando você domina|Follow the path in order. A level is recommended as complete when you master|Sigue la ruta en orden. Se recomienda dar un nivel por completado cuando dominas
% dos exercícios (BPM limpo ≥|% of the exercises (clean BPM ≥|% de los ejercicios (BPM limpio ≥
% da meta).|% of the target).|% de la meta).
precisão ≥|accuracy ≥|precisión ≥
passadas limpas para subir|clean passes to level up|pasadas limpias para subir
↑ passo de|↑ step of|↑ paso de
você está aqui|you are here|estás aquí
Nível|Level|Nivel
tempo|beat|tiempo
tempos|beats|tiempos
min por dia|min a day|min al día
Casa|Fret|Traste
pestana|barre|cejilla
baixo em|bass on|bajo en
dedos|fingers|dedos
dedo|finger|dedo
Domínio|Mastery|Dominio
`;
const FRAG = F_RAW.trim().split('\n').map(l => { const p = l.split('|'); return [p[0], p[1], p[2]]; }).sort((a, b) => b[0].length - a[0].length);

const RULES = [
  [/^Trinados (.+)$/, 'Trills $1', 'Trinos $1'],
  [/^meta (\d+) BPM$/, 'target $1 BPM', 'meta $1 BPM'],  [/^Arpejo Am \| C dedilhado$/, 'Fingerpicked Am | C arpeggio', 'Arpegio Am | C con los dedos'],
  [/^Meta semanal: (\d+) de (\d+) min \((\d+)%\)\.$/, 'Weekly goal: $1 of $2 min ($3%).', 'Meta semanal: $1 de $2 min ($3 %).'],
  [/^Nível (\w+) \((.+)\): (\d+\/\d+) exercícios dominados\. Faltam (\d+) para liberar o próximo nível\.$/, 'Level $1 ($2): $3 exercises mastered. $4 more to unlock the next level.', 'Nivel $1 ($2): $3 ejercicios dominados. Faltan $4 para desbloquear el siguiente nivel.'],
  [/^Nível (\w+) \((.+)\)$/, 'Level $1 ($2)', 'Nivel $1 ($2)'],
  [/^(\d+) exercícios$/, '$1 exercises', '$1 ejercicios'],
  [/^a partir do Nível (\w+)$/, 'from Level $1', 'a partir del Nivel $1'],
  [/^Exercícios do Nível (\w+) \((\d+)\)$/, 'Level $1 exercises ($2)', 'Ejercicios del Nivel $1 ($2)'],
  [/^Pergunta (\d+) de (\d+)$/, 'Question $1 of $2', 'Pregunta $1 de $2'],
  [/^Pontuação: (\d+) de (\d+)\. Você pode mudar o nível quando quiser em Ajustes\.$/, 'Score: $1 of $2. You can change your level whenever you want in Settings.', 'Puntuación: $1 de $2. Puedes cambiar el nivel cuando quieras en Ajustes.'],
  [/^Último resultado: Nível (\w+)$/, 'Last result: Level $1', 'Último resultado: Nivel $1'],
  [/^1 tempo \((.+)\)$/, '1 beat ($1)', '1 tiempo ($1)'],
  [/^(\d+) tempos \((.+)\)$/, '$1 beats ($2)', '$1 tiempos ($2)'],
  [/^0 a (\d+)$/, '0 to $1', '0 a $1'],
];
const DEF_FOCUS = null;

function trCore(c) {
  if (LI === 0) return c;
  const d = DICT[c]; if (d) return d[LI];
  for (const r of RULES) { if (r[0].test(c)) return c.replace(r[0], r[LI]); }
  // "A · B · C": traduz cada parte
  if (c.includes(' · ')) { const o = c.split(' · ').map(trCore).join(' · '); if (o !== c) return o; }
  // prefixo de número/emoji/símbolo: "1. ", "🏆 ", "✗ "
  const pm = /^((?:\d+\.\s)|[^A-Za-zÀ-ú0-9"]+)(.+)$/s.exec(c);
  if (pm && pm[1].trim()) { const o = trCore(pm[2]); if (o !== pm[2]) return pm[1] + o; }
  // "Nome (detalhe)"
  const sm = /^(.+?) \(([^()]*)\)$/.exec(c);
  if (sm && DICT[sm[1]] && DICT[sm[1]][LI] !== sm[1]) return DICT[sm[1]][LI] + ' (' + trCore(sm[2]) + ')';
  let o = c, hit = false;
  for (const f of FRAG) { if (o.includes(f[0])) { o = o.split(f[0]).join(f[LI]); hit = true; } }
  o = o.replace(/"([^"]+)"/g, (m, x) => { const t = trCore(x); if (t !== x) hit = true; return '"' + t + '"'; });
  if (!hit) return c;
  return o.replace(/\s+/g, ' ');
}
function tr(s) {
  if (LI === 0 || s == null) return s;
  s = String(s); const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s); if (!m[2]) return s;
  return m[1] + trCore(m[2]) + m[3];
}

// ---- DOM ----
const DONE = new WeakMap();
const ATTRS = ['placeholder', 'title', 'aria-label'];
function trNode(n) {
  if (n.nodeType === 3) { if (DONE.get(n) === n.data) return; const t = tr(n.data); if (t !== n.data) n.data = t; DONE.set(n, n.data); return; }
  if (n.nodeType !== 1) return;
  if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
  for (const a of ATTRS) { if (n.hasAttribute(a)) { const v = n.getAttribute(a), t = tr(v); if (t !== v) n.setAttribute(a, t); } }
  for (const c of n.childNodes) trNode(c);
}
function trAll() { trNode(document.body); document.title = tr(document.title); }

if (LI !== 0) {
  document.documentElement.lang = LANG;
  const mo = new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') trNode(m.target); else m.addedNodes.forEach(trNode); } });
  const start = () => { mo.observe(document.body, { childList: true, subtree: true, characterData: true }); trAll(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  const _p = window.prompt.bind(window), _c = window.confirm.bind(window), _a = window.alert.bind(window);
  window.prompt = (m, d) => _p(tr(m), d); window.confirm = m => _c(tr(m)); window.alert = m => _a(tr(m));
}
document.addEventListener('DOMContentLoaded', () => { const s = document.getElementById('langSel'); if (s) s.value = LANG; });
if (document.readyState !== 'loading') { const s = document.getElementById('langSel'); if (s) s.value = LANG; }
function setLang(l) { try { localStorage.setItem('fretforge.lang', l); } catch (e) {} location.reload(); }
document.addEventListener('change', e => { if (e.target && e.target.id === 'langSel') setLang(e.target.value); });
