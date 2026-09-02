/* Survey content — sections 1–5 of the team doc
   "Pilot_Participant_Facing_Materials_EN_PT" (verbatim). survey/index.html
   renders these in order. Section 4 Portuguese items are the validated
   Brazilian adaptation (Figueira et al., 2019) — do not reword. */

const SCALE_INTENSITY = {
  en: ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'],
  pt: ['Nada', 'Um pouco', 'Moderadamente', 'Muito', 'Extremamente'],
};

const TEMPTING_ACTIVITIES = [
  { id: 1,  en: 'Message or chat with friends (e.g. WhatsApp)',   pt: 'Mandar mensagem ou conversar com amigos (ex.: WhatsApp)' },
  { id: 2,  en: 'Watch short videos (e.g. TikTok, Kwai, Reels)',   pt: 'Assistir a vídeos curtos (ex.: TikTok, Kwai, Reels)' },
  { id: 3,  en: 'Scroll through social media (e.g. Instagram)',    pt: 'Rolar o feed das redes sociais (ex.: Instagram)' },
  { id: 4,  en: 'Play video games (e.g., Free Fire)',              pt: 'Jogar videogame (ex.: Free Fire)' },
  { id: 5,  en: 'Watch a live stream',                             pt: 'Assistir a uma live' },
  { id: 6,  en: 'Watch series or anime (Netflix)',                 pt: 'Assistir a séries ou animes (ex.: Netflix)' },
  { id: 7,  en: 'Play sports (e.g., soccer)',                      pt: 'Praticar esportes (ex.: jogar bola)' },
  { id: 8,  en: 'Hang out with friends',                           pt: 'Sair com os amigos' },
  { id: 9,  en: 'Watch YouTube videos',                            pt: 'Assistir a vídeos no YouTube' },
  { id: 10, en: 'Listen to music',                                 pt: 'Ouvir música' },
  { id: 11, en: 'Other (please write):',                           pt: 'Outra (escreva qual):', other: true },
];

const SURVEYS = [
  {
    id: 'goal_value',
    type: 'likert',
    title: { en: 'Academic Goal Value', pt: 'Valor do Objetivo Acadêmico' },
    instructions: { en: 'Please indicate how true each statement is of you.',
                    pt: 'Indique o quanto cada frase é verdadeira para você.' },
    scale: SCALE_INTENSITY,
    items: [
      { id: 1, en: 'Doing well in school is important to me.', pt: 'Ir bem na escola é importante para mim.' },
      { id: 2, en: 'I care a lot about getting good grades.', pt: 'Eu me importo muito em tirar boas notas.' },
      { id: 3, en: 'Being successful in school is an important part of who I am.', pt: 'Ter sucesso na escola é uma parte importante de quem eu sou.' },
    ],
  },
  {
    id: 'tempting_top3',
    type: 'top3',
    title: { en: 'Tempting Activities', pt: 'Atividades Tentadoras' },
    instructions: {
      en: 'Think about times when you should be studying but could do something fun instead. What are the top three activities you would most want to do? Choose three from the list below.',
      pt: 'Pense nos momentos em que você deveria estar estudando, mas poderia fazer algo divertido em vez disso. Quais são as três atividades que você mais gostaria de fazer? Escolha três da lista abaixo.',
    },
    activities: TEMPTING_ACTIVITIES,
  },
  {
    id: 'tempting_ratings',
    type: 'piped_likert',      // one block per activity chosen in tempting_top3
    title: { en: 'Tempting Activities — Ratings', pt: 'Atividades Tentadoras — Avaliação' },
    instructions: { en: 'For each of the three activities you chose, please answer the two questions below.',
                    pt: 'Para cada uma das três atividades que você escolheu, responda às duas perguntas abaixo.' },
    scale: SCALE_INTENSITY,   // coded 1–5 (team note: confirm vs. 0–5)
    items: [
      { id: 'enjoy',    en: 'In general, how much do you enjoy this activity?', pt: 'Em geral, o quanto você gosta desta atividade?' },
      { id: 'tempting', en: 'When you need to study, how tempting is it to do this activity instead?', pt: 'Quando você precisa estudar, o quão tentador é fazer esta atividade em vez de estudar?' },
    ],
  },
  {
    id: 'bscs',
    type: 'likert',
    title: { en: 'About You', pt: 'Sobre Você' },
    instructions: { en: 'Please indicate how much each statement is like you.',
                    pt: 'Indique o quanto cada frase se parece com você.' },
    scale: {
      en: ['Not at all like me', 'Not like me', 'Somewhat like me', 'Like me', 'Very much like me'],
      pt: ['Não parece nada comigo', 'Não parece comigo', 'Parece mais ou menos comigo', 'Parece comigo', 'Parece totalmente comigo'],
    },
    items: [
      { id: 1,  en: 'I am good at resisting temptation.', pt: 'Tenho facilidade em resistir a tentações.' },
      { id: 2,  en: 'I have a hard time breaking bad habits.', pt: 'Tenho dificuldade em acabar com maus hábitos.' },
      { id: 3,  en: 'I am lazy.', pt: 'Sou preguiçoso.' },
      { id: 4,  en: 'I say inappropriate things.', pt: 'Costumo dizer coisas inapropriadas.' },
      { id: 5,  en: 'I do certain things that are bad for me, if they are fun.', pt: 'Faço certas coisas que podem me prejudicar, se elas forem divertidas.' },
      { id: 6,  en: 'I refuse things that are bad for me.', pt: 'Recuso coisas que são prejudiciais a mim.' },
      { id: 7,  en: 'I wish I had more self-discipline.', pt: 'Gostaria de ser mais disciplinado.' },
      { id: 8,  en: 'People would say that I have iron self-discipline.', pt: 'As pessoas costumam dizer que sou muito disciplinado.' },
      { id: 9,  en: 'Pleasure and fun sometimes keep me from getting work done.', pt: 'Prazer e diversão às vezes me impedem de completar minhas tarefas.' },
      { id: 10, en: 'I have trouble concentrating.', pt: 'Tenho dificuldade para me concentrar.' },
      { id: 11, en: 'I am able to work effectively toward long-term goals.', pt: 'Consigo trabalhar de forma eficaz em direção a objetivos de longo-prazo.' },
      { id: 12, en: 'Sometimes I cannot stop myself from doing something, even if I know it is wrong.', pt: 'Às vezes não consigo deixar de fazer algo, mesmo sabendo que aquilo é errado.' },
      { id: 13, en: 'I often act without thinking through all the alternatives.', pt: 'Frequentemente, ajo sem pensar em todas as alternativas.' },
    ],
  },
  {
    id: 'strategy_use',
    type: 'likert',
    title: { en: 'What You Do', pt: 'O Que Você Faz' },
    instructions: {
      en: 'Think about the past two weeks. When you needed to study or complete schoolwork, manage a strong emotion or interpersonal conflict, or resist another temptation or strong urge, how often did you actually do each of the following?',
      pt: 'Pense nas últimas duas semanas. Quando você precisou estudar ou fazer tarefas da escola, lidar com uma emoção forte ou um conflito com alguém, ou resistir a alguma outra tentação ou vontade forte, com que frequência você realmente fez cada uma das coisas a seguir?',
    },
    scale: {
      en: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
      pt: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Quase sempre'],
    },
    items: [
      { id: 1,  en: "When I need to study, I go somewhere quiet, like the library, where I won't run into distractions.", pt: 'Quando preciso estudar, vou para um lugar tranquilo, como a biblioteca, onde não vou encontrar distrações.' },
      { id: 2,  en: "I choose to do homework in places where my phone and games aren't around.", pt: 'Escolho fazer as tarefas em lugares onde meu celular e meus jogos não estão por perto.' },
      { id: 3,  en: 'I stay away from people or situations that I know will get me angry or into trouble.', pt: 'Fico longe de pessoas ou situações que eu sei que vão me irritar ou me meter em problemas.' },
      { id: 4,  en: 'When I expected to face a temptation, I avoided places or situations where it would be difficult to resist.', pt: 'Quando eu sabia que ia enfrentar uma tentação, evitei lugares ou situações em que seria difícil resistir.' },
      { id: 5,  en: "When I study, I shut off my phone or put it somewhere I can't easily reach it.", pt: 'Quando estudo, desligo o celular ou deixo ele em um lugar difícil de alcançar.' },
      { id: 6,  en: 'I use apps or settings that block distracting websites and games while I work.', pt: 'Uso aplicativos ou configurações que bloqueiam sites e jogos que distraem enquanto estou estudando.' },
      { id: 7,  en: 'When a conversation starts getting heated, I change the topic to cool things down.', pt: 'Quando uma conversa começa a esquentar, mudo de assunto para acalmar as coisas.' },
      { id: 8,  en: 'I keep tempting things out of sight so I will be less likely to give in.', pt: 'Deixo as coisas que me tentam fora da minha vista para ter menos chance de ceder.' },
      { id: 9,  en: 'When my phone buzzes during homework, I keep my eyes on my work.', pt: 'Quando meu celular vibra durante a tarefa, continuo com os olhos no que estou fazendo.' },
      { id: 10, en: "When something is distracting me, I focus my attention on something else so I don't think about it.", pt: 'Quando algo está me distraindo, foco minha atenção em outra coisa para não pensar naquilo.' },
      { id: 11, en: 'When someone says something that upsets me, I put my attention on something else instead of dwelling on it.', pt: 'Quando alguém diz algo que me chateia, coloco minha atenção em outra coisa em vez de ficar remoendo.' },
      { id: 12, en: "When I'm craving something I shouldn't have, I focus my attention on something else until the craving passes.", pt: 'Quando estou com muita vontade de algo que não devo, foco minha atenção em outra coisa até a vontade passar.' },
      { id: 13, en: "When I don't feel like doing homework, I remind myself what will happen if I don't do it.", pt: 'Quando não estou com vontade de fazer a tarefa, lembro a mim mesmo(a) o que vai acontecer se eu não fizer.' },
      { id: 14, en: 'When a task feels boring, I try to think about it in a way that makes it feel more meaningful or interesting.', pt: 'Quando uma tarefa parece chata, tento pensar nela de um jeito que a torne mais significativa ou interessante.' },
      { id: 15, en: "When I really want something I shouldn't have, I think about its downsides to make it less appealing.", pt: 'Quando quero muito algo que não devo, penso nos lados ruins disso para que fique menos atraente.' },
      { id: 16, en: "When I'm mad at someone, I try to see it differently—like maybe they're just having a bad day.", pt: 'Quando estou com raiva de alguém, tento ver a situação de outro jeito — talvez a pessoa só esteja tendo um dia ruim.' },
      { id: 17, en: "When I'm tempted to use my phone while studying, I force myself not to—I rely on willpower.", pt: 'Quando fico tentado(a) a usar o celular enquanto estudo, me obrigo a não usar — conto com a minha força de vontade.' },
      { id: 18, en: "When I have to study but don't want to, I make myself do it anyway.", pt: 'Quando tenho que estudar mas não quero, me obrigo a estudar mesmo assim.' },
      { id: 19, en: 'When someone provokes me, I hold in my anger instead of snapping back.', pt: 'Quando alguém me provoca, seguro a raiva em vez de revidar.' },
      { id: 20, en: "When I really want something I shouldn't have, I just tell myself 'no' and resist the urge.", pt: 'Quando quero muito algo que não devo, simplesmente digo “não” para mim mesmo(a) e resisto à vontade.' },
    ],
  },
];
