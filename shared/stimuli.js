/* Task 1 activity stimuli (N = 90) and the fixed Task 1 trial order.
   Source: the team's Drive folder "Task1_activity_illustrations"
   (index.csv, 2026-10-28) and "Task1_trial_list_60x60.csv". Each activity
   has one illustrated card, shared/activity_images/<cat>/<id>.png
   (1254 × 1254, Portuguese label printed under the illustration). The same
   card is used in the ratings and in Task 1. */

const ACTIVITIES = [
  // Study activities (goal)
  { id: 'study_01', cat: 'study', en: "Explain a difficult idea in your own words", pt: "Explicar uma ideia difícil com suas próprias palavras" },
  { id: 'study_02', cat: 'study', en: "Teach the material to a friend", pt: "Ensinar a matéria para um amigo" },
  { id: 'study_03', cat: 'study', en: "Work through a difficult problem step by step", pt: "Resolver uma questão difícil passo a passo" },
  { id: 'study_04', cat: 'study', en: "Practice questions without looking at your notes", pt: "Resolver questões sem consultar suas anotações" },
  { id: 'study_05', cat: 'study', en: "Close your notes and write down three key ideas you remember", pt: "Fechar suas anotações e escrever três ideias principais que você consegue lembrar" },
  { id: 'study_06', cat: 'study', en: "Make a list of questions you still have", pt: "Listar todas as suas dúvidas" },
  { id: 'study_07', cat: 'study', en: "Think aloud as you solve a problem", pt: "Pensar em voz alta enquanto resolve uma questão" },
  { id: 'study_08', cat: 'study', en: "Ask a classmate for help with the material", pt: "Pedir ajuda a um colega com a matéria" },
  { id: 'study_09', cat: 'study', en: "Quiz each other on the material", pt: "Fazer perguntas um ao outro sobre a matéria" },
  { id: 'study_10', cat: 'study', en: "Make a study plan for the quiz", pt: "Fazer um plano de estudos para a prova" },
  { id: 'study_11', cat: 'study', en: "Set a study goal for the next 30 minutes", pt: "Definir uma meta de estudo para os próximos 30 minutos" },
  { id: 'study_12', cat: 'study', en: "Practice the questions you got wrong before", pt: "Praticar as questões que você errou antes" },
  { id: 'study_13', cat: 'study', en: "Check your answers and correct your mistakes", pt: "Conferir suas respostas e corrigir seus erros" },
  { id: 'study_14', cat: 'study', en: "Work on a sample test", pt: "Fazer uma prova de prática" },
  { id: 'study_15', cat: 'study', en: "Create questions that could appear on the quiz", pt: "Criar questões que poderiam aparecer na prova" },
  { id: 'study_16', cat: 'study', en: "Use an educational app to practice the material", pt: "Usar um aplicativo educativo para praticar a matéria" },
  { id: 'study_17', cat: 'study', en: "Watch a tutorial about a difficult topic", pt: "Assistir a uma videoaula sobre um assunto difícil" },
  { id: 'study_18', cat: 'study', en: "Review the topics you know the least", pt: "Revisar os assuntos que você menos domina" },
  { id: 'study_19', cat: 'study', en: "Try the question again without looking at the example", pt: "Tentar resolver a questão novamente sem consultar o exemplo" },
  { id: 'study_20', cat: 'study', en: "Go through the teacher's review sheet", pt: "Estudar pelo roteiro de revisão do professor" },
  { id: 'study_21', cat: 'study', en: "Review your class notes", pt: "Rever suas anotações da aula" },
  { id: 'study_22', cat: 'study', en: "Reread the textbook chapter", pt: "Reler o capítulo do livro" },
  { id: 'study_23', cat: 'study', en: "Make a summary of the material", pt: "Fazer um resumo da matéria" },
  { id: 'study_24', cat: 'study', en: "Study with digital flashcards", pt: "Estudar com flashcards digitais" },
  { id: 'study_25', cat: 'study', en: "Watch a review video lesson", pt: "Assistir a uma videoaula de revisão" },
  { id: 'study_26', cat: 'study', en: "Highlight the key points", pt: "Marcar os pontos principais" },
  { id: 'study_27', cat: 'study', en: "Make a mind map of the topic", pt: "Fazer um mapa mental da matéria" },
  { id: 'study_28', cat: 'study', en: "Memorize the key definitions", pt: "Decorar as definições principais" },
  { id: 'study_29', cat: 'study', en: "Organize your notes and add any missing information", pt: "Organizar suas anotações e acrescentar as informações que faltam" },
  { id: 'study_30', cat: 'study', en: "Solve the exercises in the book", pt: "Resolver os exercícios do livro" },
  // Entertainment activities (temptation)
  { id: 'entertainment_01', cat: 'entertainment', en: "Scroll Instagram Reels", pt: "Rolar os Reels do Instagram" },
  { id: 'entertainment_02', cat: 'entertainment', en: "Check Instagram Stories", pt: "Ver os Stories do Instagram" },
  { id: 'entertainment_03', cat: 'entertainment', en: "Look at your friends' posts", pt: "Ver as publicações dos seus amigos" },
  { id: 'entertainment_04', cat: 'entertainment', en: "Watch YouTube Shorts", pt: "Assistir a Shorts no YouTube" },
  { id: 'entertainment_05', cat: 'entertainment', en: "Watch TikTok videos", pt: "Ver vídeos no TikTok" },
  { id: 'entertainment_06', cat: 'entertainment', en: "Play a match of Free Fire", pt: "Jogar uma partida de Free Fire" },
  { id: 'entertainment_07', cat: 'entertainment', en: "Play Minecraft", pt: "Jogar Minecraft" },
  { id: 'entertainment_08', cat: 'entertainment', en: "Play console soccer (FIFA)", pt: "Jogar FIFA" },
  { id: 'entertainment_09', cat: 'entertainment', en: "Watch an episode of your series", pt: "Assistir a um episódio da série" },
  { id: 'entertainment_10', cat: 'entertainment', en: "Watch anime", pt: "Assistir a um anime" },
  { id: 'entertainment_11', cat: 'entertainment', en: "Watch a streamer's live", pt: "Assistir à live de um streamer" },
  { id: 'entertainment_12', cat: 'entertainment', en: "Watch your YouTuber's new video", pt: "Ver o vídeo novo do seu youtuber" },
  { id: 'entertainment_13', cat: 'entertainment', en: "Watch reaction videos", pt: "Assistir a vídeos de reação" },
  { id: 'entertainment_14', cat: 'entertainment', en: "Listen to your favorite playlist", pt: "Ouvir sua playlist favorita" },
  { id: 'entertainment_15', cat: 'entertainment', en: "Watch music videos", pt: "Assistir a clipes de música" },
  { id: 'entertainment_16', cat: 'entertainment', en: "Watch soccer highlights", pt: "Assistir aos melhores momentos do futebol" },
  { id: 'entertainment_17', cat: 'entertainment', en: "Chat in the WhatsApp group", pt: "Conversar no grupo do WhatsApp" },
  { id: 'entertainment_18', cat: 'entertainment', en: "Send voice messages to friends", pt: "Mandar áudios para os amigos" },
  { id: 'entertainment_19', cat: 'entertainment', en: "Video call a friend", pt: "Fazer uma chamada de vídeo" },
  { id: 'entertainment_20', cat: 'entertainment', en: "Go to a friend's house", pt: "Ir à casa de um amigo" },
  { id: 'entertainment_21', cat: 'entertainment', en: "Go to the mall with friends", pt: "Ir ao shopping com os amigos" },
  { id: 'entertainment_22', cat: 'entertainment', en: "Go out to eat with friends", pt: "Sair para comer com os amigos" },
  { id: 'entertainment_23', cat: 'entertainment', en: "Order a snack on iFood", pt: "Pedir um lanche no iFood" },
  { id: 'entertainment_24', cat: 'entertainment', en: "Play soccer outside", pt: "Jogar bola lá fora" },
  { id: 'entertainment_25', cat: 'entertainment', en: "Play volleyball", pt: "Jogar vôlei" },
  { id: 'entertainment_26', cat: 'entertainment', en: "Ride a bike", pt: "Andar de bicicleta" },
  { id: 'entertainment_27', cat: 'entertainment', en: "Go for a swim", pt: "Ir nadar" },
  { id: 'entertainment_28', cat: 'entertainment', en: "Take a nap", pt: "Tirar uma soneca" },
  { id: 'entertainment_29', cat: 'entertainment', en: "Play a card or board game", pt: "Jogar um jogo de cartas ou de tabuleiro" },
  { id: 'entertainment_30', cat: 'entertainment', en: "Look at clothes/ sneakers online", pt: "Ver roupas ou tênis online" },
  // Neutral activities (chores)
  { id: 'neutral_01', cat: 'neutral', en: "Water the plants", pt: "Regar as plantas" },
  { id: 'neutral_02', cat: 'neutral', en: "Fold the laundry", pt: "Dobrar as roupas" },
  { id: 'neutral_03', cat: 'neutral', en: "Sweep the floor", pt: "Varrer o chão" },
  { id: 'neutral_04', cat: 'neutral', en: "Wash the dishes", pt: "Lavar a louça" },
  { id: 'neutral_05', cat: 'neutral', en: "Take out the trash", pt: "Levar o lixo para fora" },
  { id: 'neutral_06', cat: 'neutral', en: "Make your bed", pt: "Arrumar a cama" },
  { id: 'neutral_07', cat: 'neutral', en: "Clean the windows", pt: "Limpar os vidros da janela" },
  { id: 'neutral_08', cat: 'neutral', en: "Organize the closet", pt: "Organizar o guarda-roupa" },
  { id: 'neutral_09', cat: 'neutral', en: "Match the clean socks", pt: "Parear as meias limpas" },
  { id: 'neutral_10', cat: 'neutral', en: "Wipe the kitchen table", pt: "Limpar a mesa da cozinha" },
  { id: 'neutral_11', cat: 'neutral', en: "Refill your water bottle", pt: "Encher sua garrafa de água" },
  { id: 'neutral_12', cat: 'neutral', en: "Organize the bookshelf", pt: "Organizar a estante" },
  { id: 'neutral_13', cat: 'neutral', en: "Hang up the clothes", pt: "Estender as roupas no varal" },
  { id: 'neutral_14', cat: 'neutral', en: "Put away the dishes", pt: "Guardar a louça" },
  { id: 'neutral_15', cat: 'neutral', en: "Dust the shelves", pt: "Tirar o pó da estante" },
  { id: 'neutral_16', cat: 'neutral', en: "Sweep the yard", pt: "Varrer o quintal" },
  { id: 'neutral_17', cat: 'neutral', en: "Clean your sneakers", pt: "Limpar seu tênis" },
  { id: 'neutral_18', cat: 'neutral', en: "Sort the recycling", pt: "Separar o lixo reciclável" },
  { id: 'neutral_19', cat: 'neutral', en: "Untangle the cables", pt: "Desembaraçar os fios" },
  { id: 'neutral_20', cat: 'neutral', en: "Sharpen your pencils", pt: "Apontar seus lápis" },
  { id: 'neutral_21', cat: 'neutral', en: "Buy bread at the bakery", pt: "Comprar pão na padaria" },
  { id: 'neutral_22', cat: 'neutral', en: "Set the table", pt: "Pôr a mesa" },
  { id: 'neutral_23', cat: 'neutral', en: "Feed the pet", pt: "Dar comida para o seu animal de estimação" },
  { id: 'neutral_24', cat: 'neutral', en: "Organize a kitchen drawer", pt: "Arrumar a gaveta da cozinha" },
  { id: 'neutral_25', cat: 'neutral', en: "Clean the mirror", pt: "Limpar o espelho" },
  { id: 'neutral_26', cat: 'neutral', en: "Fold the towels", pt: "Dobrar as toalhas" },
  { id: 'neutral_27', cat: 'neutral', en: "Clean the fan", pt: "Limpar o ventilador" },
  { id: 'neutral_28', cat: 'neutral', en: "Straighten the sofa cushions", pt: "Ajeitar as almofadas do sofá" },
  { id: 'neutral_29', cat: 'neutral', en: "Check the mailbox", pt: "Olhar a caixa de correio" },
  { id: 'neutral_30', cat: 'neutral', en: "Peel vegetables for dinner", pt: "Descascar os legumes do jantar" },
];
const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map(a => [a.id, a]));

/* Task 1 main trials, in this fixed order for every student (team decision
   10/30: 60 trials, sides balanced): [trial_id, source_trial, side_swapped,
   trial_type, left activity, right activity]. Picked from the team's
   Task1_trial_list_60x60 (source_trial = its row) so that each study
   activity is the goal twice — once vs. an entertainment activity, once vs.
   a chore, once on each side — and every entertainment activity and every
   chore appears exactly once. 30 goal–temptation + 30 goal–neutral; goal on
   the left in 15 of each type (and within ±2 in each half); 14 trials have
   their sides swapped relative to the source list. Same list as
   shared/task1_trial_list_60.csv. */
const TASK1_TRIAL_LIST = [
  [1, 1, true, 'goal_neutral', 'neutral_23', 'study_21'],
  [2, 2, false, 'goal_neutral', 'neutral_20', 'study_24'],
  [3, 5, true, 'goal_temptation', 'study_18', 'entertainment_24'],
  [4, 8, false, 'goal_neutral', 'neutral_03', 'study_30'],
  [5, 10, false, 'goal_temptation', 'entertainment_16', 'study_29'],
  [6, 11, false, 'goal_neutral', 'neutral_21', 'study_05'],
  [7, 12, true, 'goal_neutral', 'study_08', 'neutral_28'],
  [8, 14, true, 'goal_neutral', 'study_29', 'neutral_01'],
  [9, 15, false, 'goal_temptation', 'entertainment_04', 'study_04'],
  [10, 16, false, 'goal_neutral', 'study_02', 'neutral_07'],
  [11, 17, true, 'goal_temptation', 'study_11', 'entertainment_12'],
  [12, 21, false, 'goal_neutral', 'study_17', 'neutral_06'],
  [13, 22, false, 'goal_temptation', 'entertainment_20', 'study_14'],
  [14, 23, false, 'goal_temptation', 'entertainment_17', 'study_20'],
  [15, 24, false, 'goal_temptation', 'entertainment_07', 'study_16'],
  [16, 26, true, 'goal_temptation', 'study_12', 'entertainment_01'],
  [17, 28, false, 'goal_temptation', 'entertainment_10', 'study_22'],
  [18, 29, false, 'goal_temptation', 'entertainment_30', 'study_23'],
  [19, 31, false, 'goal_neutral', 'neutral_11', 'study_12'],
  [20, 33, false, 'goal_temptation', 'study_09', 'entertainment_02'],
  [21, 34, false, 'goal_neutral', 'neutral_10', 'study_11'],
  [22, 35, false, 'goal_neutral', 'neutral_26', 'study_18'],
  [23, 36, false, 'goal_temptation', 'entertainment_23', 'study_28'],
  [24, 37, false, 'goal_temptation', 'study_21', 'entertainment_27'],
  [25, 41, false, 'goal_temptation', 'entertainment_26', 'study_08'],
  [26, 44, true, 'goal_temptation', 'study_24', 'entertainment_13'],
  [27, 46, true, 'goal_neutral', 'study_20', 'neutral_24'],
  [28, 51, false, 'goal_neutral', 'neutral_30', 'study_25'],
  [29, 57, true, 'goal_temptation', 'study_15', 'entertainment_05'],
  [30, 58, false, 'goal_neutral', 'study_04', 'neutral_19'],
  [31, 62, true, 'goal_neutral', 'neutral_08', 'study_13'],
  [32, 63, false, 'goal_temptation', 'study_07', 'entertainment_19'],
  [33, 64, false, 'goal_neutral', 'neutral_16', 'study_10'],
  [34, 65, false, 'goal_neutral', 'study_28', 'neutral_18'],
  [35, 67, false, 'goal_temptation', 'study_25', 'entertainment_25'],
  [36, 70, false, 'goal_neutral', 'neutral_27', 'study_06'],
  [37, 71, false, 'goal_neutral', 'study_26', 'neutral_02'],
  [38, 72, true, 'goal_temptation', 'study_10', 'entertainment_03'],
  [39, 73, true, 'goal_neutral', 'neutral_13', 'study_09'],
  [40, 74, true, 'goal_neutral', 'study_01', 'neutral_14'],
  [41, 77, false, 'goal_neutral', 'neutral_05', 'study_07'],
  [42, 78, false, 'goal_neutral', 'study_14', 'neutral_12'],
  [43, 80, false, 'goal_temptation', 'entertainment_29', 'study_19'],
  [44, 84, false, 'goal_temptation', 'entertainment_14', 'study_17'],
  [45, 85, false, 'goal_temptation', 'entertainment_18', 'study_27'],
  [46, 87, false, 'goal_temptation', 'study_05', 'entertainment_08'],
  [47, 91, false, 'goal_temptation', 'entertainment_21', 'study_02'],
  [48, 93, false, 'goal_neutral', 'study_22', 'neutral_04'],
  [49, 98, false, 'goal_temptation', 'study_06', 'entertainment_15'],
  [50, 99, false, 'goal_temptation', 'entertainment_11', 'study_01'],
  [51, 104, false, 'goal_temptation', 'study_30', 'entertainment_28'],
  [52, 105, false, 'goal_temptation', 'entertainment_09', 'study_26'],
  [53, 106, false, 'goal_neutral', 'study_16', 'neutral_29'],
  [54, 110, false, 'goal_neutral', 'study_27', 'neutral_22'],
  [55, 112, false, 'goal_neutral', 'neutral_25', 'study_15'],
  [56, 113, false, 'goal_neutral', 'study_19', 'neutral_09'],
  [57, 115, true, 'goal_temptation', 'study_03', 'entertainment_06'],
  [58, 116, false, 'goal_neutral', 'study_23', 'neutral_15'],
  [59, 117, false, 'goal_neutral', 'neutral_17', 'study_03'],
  [60, 118, false, 'goal_temptation', 'study_13', 'entertainment_22'],
].map(([trial_id, source_trial, side_swapped, trial_type, left, right]) =>
  ({ trial_id, source_trial, side_swapped, trial_type, left: ACTIVITY_BY_ID[left], right: ACTIVITY_BY_ID[right] }));

/* Pictures. The card already shows the (Portuguese) label, so pages show
   the card alone, with no caption, in every language. */
const activityImgSrc = act => Session.ROOT + 'shared/activity_images/' + act.cat + '/' + act.id + '.png';
const activityImgFile = act => act.cat + '/' + act.id + '.png';
function activityPic(act){
  return `<span class="pic"><img src="${activityImgSrc(act)}" alt="${act.pt.replace(/"/g, '&quot;')}" draggable="false"></span>`;
}
const activityCaption = act => '';

/* Video preview stimuli for the Task 2 rating block: the current Task 2
   playlist (shared/videos.js), thumbnails from YouTube. */
const VIDEO_STIMULI = VIDEOS.map(v => ({ id: v.id, cat: v.cat, thumb: 'https://img.youtube.com/vi/' + v.id + '/hqdefault.jpg' }));
