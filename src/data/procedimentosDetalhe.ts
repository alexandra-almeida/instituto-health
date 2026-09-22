import bgFisioterapiaExplicacao from '../assets/hero-bg/bg-2-fisioterapia-explicacao.jpg'
import bgMassagemFacial from '../assets/hero-bg/bg-3-massagem-facial.jpg'
import bgProcedimentoEstetico from '../assets/hero-bg/bg-4-procedimento-estetico.jpg'
import bgFisioterapiaSorriso from '../assets/hero-bg/bg-1-fisioterapia-sorriso.jpg'

export interface ServicoStep {
  title: string
  description: string
}

export interface ServicoFaqItem {
  question: string
  answer: string
}

export interface ProcedimentoDetalhe {
  slug: string
  title: string
  tagline: string
  heroImage: string
  oQueE: string
  comoFunciona: ServicoStep[]
  paraQuemE: string
  informacoesImportantes: string[]
  faq: ServicoFaqItem[]
  ctaLabel: string
  whatsappMessage: string
}

// Conteúdo de EXEMPLO — placeholder até a Juliana revisar e enviar o texto
// definitivo de cada procedimento. Estrutura e textos aqui servem só para
// validar o template <ServicoPage> e as rotas dinâmicas.
export const PROCEDIMENTOS_DETALHE: ProcedimentoDetalhe[] = [
  {
    slug: 'botox',
    title: 'Botox',
    tagline: 'Suavize linhas de expressão com um procedimento rápido e seguro.',
    heroImage: bgFisioterapiaSorriso,
    oQueE:
      'A toxina botulínica é aplicada em pontos específicos do rosto para relaxar a musculatura responsável pelas linhas de expressão, suavizando rugas dinâmicas (testa, glabela e pés de galinha) e prevenindo o aprofundamento de novos sulcos.',
    comoFunciona: [
      {
        title: 'Avaliação facial',
        description:
          'Análise da musculatura e das linhas de expressão para definir os pontos de aplicação.',
      },
      {
        title: 'Aplicação',
        description:
          'Pequenas injeções nos pontos definidos, procedimento rápido e com desconforto mínimo.',
      },
      {
        title: 'Acompanhamento',
        description:
          'Retorno em cerca de 15 dias para avaliar o resultado e, se necessário, fazer ajustes.',
      },
    ],
    paraQuemE:
      'Indicado para quem já apresenta linhas de expressão visíveis ou deseja preveni-las, geralmente a partir dos 25-30 anos. A avaliação individual define a indicação e a dosagem ideal.',
    informacoesImportantes: [
      'Resultado perceptível a partir do 3º ao 7º dia após a aplicação.',
      'Efeito com duração média de 4 a 6 meses.',
      'Evitar exercícios físicos intensos e deitar-se nas primeiras horas após a aplicação.',
      'Contraindicado durante gestação e amamentação.',
    ],
    faq: [
      {
        question: 'O procedimento dói?',
        answer:
          'O desconforto é mínimo — a maioria das pessoas relata apenas uma sensação de picada rápida durante a aplicação.',
      },
      {
        question: 'Quanto tempo dura a sessão?',
        answer: 'Em média de 20 a 30 minutos, sem necessidade de repouso posterior.',
      },
      {
        question: 'Posso voltar à rotina normal no mesmo dia?',
        answer:
          'Sim, é possível retomar as atividades do dia a dia logo em seguida, evitando apenas exercícios intensos e exposição solar prolongada.',
      },
    ],
    ctaLabel: 'Agendar avaliação para Botox',
    whatsappMessage: 'Olá! Gostaria de agendar uma avaliação para aplicação de Botox.',
  },
  {
    slug: 'peim',
    title: 'PEIM',
    tagline: 'Estímulo à produção de colágeno para uma pele mais firme e uniforme.',
    heroImage: bgMassagemFacial,
    oQueE:
      'O PEIM (Percutânea de Estímulo Intradérmico com Microagulhas) é uma técnica que utiliza microagulhamento para estimular a produção natural de colágeno e elastina, melhorando textura, firmeza e viço da pele.',
    comoFunciona: [
      {
        title: 'Preparo da pele',
        description: 'Limpeza e aplicação de anestésico tópico para maior conforto.',
      },
      {
        title: 'Microagulhamento',
        description:
          'Passagem do dispositivo com microagulhas na área tratada, criando microcanais que estimulam a regeneração.',
      },
      {
        title: 'Finalização',
        description:
          'Aplicação de ativos calmantes e orientações de cuidado para os dias seguintes.',
      },
    ],
    paraQuemE:
      'Indicado para quem busca melhorar textura da pele, poros dilatados, cicatrizes de acne e sinais iniciais de flacidez.',
    informacoesImportantes: [
      'Vermelhidão leve nas primeiras 24 a 48 horas é esperada.',
      'Recomenda-se protetor solar rigoroso após o procedimento.',
      'Resultados progressivos, geralmente em ciclo de 3 a 4 sessões.',
      'Evitar exposição solar direta na semana anterior e posterior ao procedimento.',
    ],
    faq: [
      {
        question: 'Quantas sessões são necessárias?',
        answer:
          'Em geral recomenda-se um protocolo de 3 a 4 sessões, com intervalo de 30 dias entre elas, mas isso varia por caso.',
      },
      {
        question: 'A pele fica com marcas depois?',
        answer:
          'É normal uma vermelhidão semelhante a uma leve queimadura de sol, que desaparece em 1 a 2 dias.',
      },
    ],
    ctaLabel: 'Agendar avaliação para PEIM',
    whatsappMessage: 'Olá! Gostaria de agendar uma avaliação para PEIM.',
  },
  {
    slug: 'drenagem',
    title: 'Drenagem Linfática',
    tagline: 'Alívio da retenção de líquidos e sensação de leveza corporal.',
    heroImage: bgProcedimentoEstetico,
    oQueE:
      'A drenagem linfática é uma técnica de massagem manual que estimula o sistema linfático, favorecendo a eliminação de líquidos retidos e toxinas, reduzindo o inchaço e proporcionando sensação de leveza.',
    comoFunciona: [
      {
        title: 'Avaliação',
        description: 'Identificação das áreas com maior retenção de líquido.',
      },
      {
        title: 'Massagem manual',
        description:
          'Movimentos suaves e ritmados, seguindo o trajeto dos vasos linfáticos.',
      },
      {
        title: 'Orientações finais',
        description: 'Recomendações de hidratação e hábitos para potencializar o resultado.',
      },
    ],
    paraQuemE:
      'Indicada para quem sente inchaço, pernas pesadas, retenção de líquidos ou está no período de recuperação pós-operatória (com liberação médica).',
    informacoesImportantes: [
      'Sessão dura em média 50 a 60 minutos.',
      'Recomenda-se boa hidratação após a sessão.',
      'Não é um procedimento estético invasivo — sem tempo de recuperação necessário.',
      'Em pós-operatório, seguir sempre a orientação do médico responsável.',
    ],
    faq: [
      {
        question: 'Com que frequência devo fazer?',
        answer:
          'Depende do objetivo: para bem-estar geral, sessões semanais ou quinzenais; em pós-operatório, a frequência é definida conforme orientação médica.',
      },
      {
        question: 'A drenagem emagrece?',
        answer:
          'Não. A técnica atua na retenção de líquidos, não na redução de gordura corporal.',
      },
    ],
    ctaLabel: 'Agendar drenagem linfática',
    whatsappMessage: 'Olá! Gostaria de agendar uma sessão de drenagem linfática.',
  },
  {
    slug: 'dermaplaning',
    title: 'Dermaplaning',
    tagline: 'Esfoliação física que renova a pele e potencializa outros cuidados.',
    heroImage: bgFisioterapiaExplicacao,
    oQueE:
      'O dermaplaning é uma técnica de esfoliação física que remove células mortas e a pelugem fina do rosto (buço), deixando a pele mais lisa, uniforme e com melhor absorção de ativos.',
    comoFunciona: [
      {
        title: 'Limpeza da pele',
        description: 'Higienização completa antes do procedimento.',
      },
      {
        title: 'Esfoliação',
        description:
          'Uso de uma lâmina específica em ângulo, deslizada suavemente sobre a pele.',
      },
      {
        title: 'Hidratação',
        description: 'Aplicação de ativos calmantes e protetor solar ao final.',
      },
    ],
    paraQuemE:
      'Indicado para quem busca uma pele mais lisa e uniforme, e para potencializar a absorção de outros tratamentos faciais.',
    informacoesImportantes: [
      'Procedimento indolor, sem tempo de recuperação.',
      'Uso de protetor solar é obrigatório nos dias seguintes.',
      'Não indicado para peles com acne ativa inflamada.',
      'A pelugem removida NÃO volta mais grossa — é um mito comum.',
    ],
    faq: [
      {
        question: 'O pelo volta mais grosso depois?',
        answer:
          'Não. Esse é um mito — o pelo volta com a mesma espessura de antes do procedimento.',
      },
      {
        question: 'Posso fazer maquiagem no mesmo dia?',
        answer: 'Sim, a pele fica pronta para receber maquiagem logo em seguida.',
      },
    ],
    ctaLabel: 'Agendar dermaplaning',
    whatsappMessage: 'Olá! Gostaria de agendar uma sessão de dermaplaning.',
  },
  {
    slug: 'peeling-coreano',
    title: 'Peeling Coreano',
    tagline: 'Renovação celular suave, com foco em luminosidade e uniformidade.',
    heroImage: bgMassagemFacial,
    oQueE:
      'O peeling coreano é uma técnica de esfoliação química suave, que promove a renovação das camadas superficiais da pele, resultando em mais luminosidade, uniformidade de tom e textura macia.',
    comoFunciona: [
      {
        title: 'Preparo',
        description: 'Limpeza profunda e avaliação do tipo de pele.',
      },
      {
        title: 'Aplicação do peeling',
        description:
          'Aplicação em camadas do produto esfoliante, com tempo de ação controlado.',
      },
      {
        title: 'Finalização',
        description: 'Neutralização e aplicação de ativos calmantes e hidratantes.',
      },
    ],
    paraQuemE:
      'Indicado para quem busca uniformizar o tom de pele, tratar manchas leves e recuperar viço, com uma técnica mais suave que peelings tradicionais.',
    informacoesImportantes: [
      'Pode haver descamação leve nos dias seguintes — parte esperada do processo.',
      'Uso de protetor solar é indispensável durante todo o tratamento.',
      'Geralmente indicado em protocolo de sessões espaçadas.',
      'Evitar exposição solar direta na semana anterior ao procedimento.',
    ],
    faq: [
      {
        question: 'A pele descama muito?',
        answer:
          'A descamação costuma ser leve e discreta, diferente de peelings mais agressivos — a rotina diária não costuma ser impactada.',
      },
      {
        question: 'Posso usar maquiagem durante o tratamento?',
        answer: 'Sim, desde que a pele não esteja com irritação ativa no momento.',
      },
    ],
    ctaLabel: 'Agendar peeling coreano',
    whatsappMessage: 'Olá! Gostaria de agendar uma sessão de peeling coreano.',
  },
  {
    slug: 'fisioterapia',
    title: 'Fisioterapia',
    tagline: 'Atendimento individualizado para alívio de dor e reabilitação.',
    heroImage: bgFisioterapiaExplicacao,
    oQueE:
      'Atendimento fisioterapêutico presencial, com avaliação individualizada e técnicas manuais para alívio de dor, reabilitação de lesões e melhora da mobilidade e do bem-estar geral do corpo.',
    comoFunciona: [
      {
        title: 'Avaliação inicial',
        description: 'Anamnese completa e avaliação postural e funcional.',
      },
      {
        title: 'Plano de tratamento',
        description:
          'Definição das técnicas e da frequência de sessões conforme o quadro apresentado.',
      },
      {
        title: 'Sessões de acompanhamento',
        description: 'Aplicação das técnicas manuais com reavaliação contínua da evolução.',
      },
    ],
    paraQuemE:
      'Indicado para quem sente dores musculares ou articulares, está em processo de reabilitação, ou busca melhorar postura e mobilidade no dia a dia.',
    informacoesImportantes: [
      'Trazer exames ou laudos médicos relacionados, se houver.',
      'Usar roupas confortáveis para a sessão.',
      'A frequência das sessões é definida na avaliação inicial.',
      'Em casos pós-cirúrgicos, é necessário encaminhamento médico.',
    ],
    faq: [
      {
        question: 'Preciso de encaminhamento médico?',
        answer:
          'Não é obrigatório para a maioria dos casos, mas é recomendado em situações pós-cirúrgicas ou de reabilitação específica.',
      },
      {
        question: 'Quanto tempo dura cada sessão?',
        answer: 'Em média de 45 a 60 minutos, variando conforme o plano de tratamento.',
      },
    ],
    ctaLabel: 'Agendar sessão de fisioterapia',
    whatsappMessage: 'Olá! Gostaria de agendar uma sessão de fisioterapia.',
  },
]

export function findProcedimentoBySlug(slug: string | undefined) {
  return PROCEDIMENTOS_DETALHE.find((item) => item.slug === slug)
}
