import bgFisioterapiaSorriso from '../assets/hero-bg/bg-1-fisioterapia-sorriso.jpg'
import bgFisioterapiaExplicacao from '../assets/hero-bg/bg-2-fisioterapia-explicacao.jpg'
import bgMassagemFacial from '../assets/hero-bg/bg-3-massagem-facial.jpg'
import bgProcedimentoEstetico from '../assets/hero-bg/bg-4-procedimento-estetico.jpg'

export type ProcedimentoCategoria =
  | 'Corporal'
  | 'Facial'
  | 'Capilar'
  | 'Fisioterapia/Pós-operatório'
  | 'Bem-estar'

export const CATEGORIAS: ProcedimentoCategoria[] = [
  'Corporal',
  'Facial',
  'Capilar',
  'Fisioterapia/Pós-operatório',
  'Bem-estar',
]

export interface Procedimento {
  slug: string
  nome: string
  categoria: ProcedimentoCategoria
  descricao: string
  indicacoes?: string[]
  objetivos?: string[]
  informacoesAdicionais?: string
  atencao?: string
  intercorrencias?: string[]
  /** false só no Jato de Plasma — texto ainda parcial, recebido cortado,
   * aguardando o restante (indicações formais, objetivos, informações
   * adicionais e/ou atenção, no mesmo padrão dos demais). */
  completo: boolean
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}

// Nenhuma foto real foi enviada ainda para os procedimentos — cada
// categoria usa uma das fotos genéricas já existentes no site (mesmo
// banco de imagens do hero/vitrines), só como placeholder visual.
export const CATEGORIA_IMAGEM: Record<ProcedimentoCategoria, string> = {
  Corporal: bgFisioterapiaExplicacao,
  Facial: bgProcedimentoEstetico,
  Capilar: bgMassagemFacial,
  'Fisioterapia/Pós-operatório': bgFisioterapiaSorriso,
  'Bem-estar': bgMassagemFacial,
}

interface ProcedimentoInput extends Omit<Procedimento, 'slug' | 'completo'> {
  completo?: boolean
}

// Conteúdo real, fornecido pela Juliana (ver
// procedimentos-completo-organizado.md) — tom clínico cuidadoso mantido
// exatamente como enviado, sem reescrita ou simplificação da linguagem.
const PROCEDIMENTOS_INPUT: ProcedimentoInput[] = [
  // ---------------------------------------------------------------- CORPORAL
  {
    nome: 'Drenagem Linfática Corporal',
    categoria: 'Corporal',
    descricao:
      'Técnica manual composta por movimentos suaves, rítmicos e direcionados, realizados sobre a pele com o objetivo de favorecer o deslocamento da linfa pelos vasos linfáticos e auxiliar na redução de edema.',
    indicacoes: [
      'Edema e retenção de líquidos',
      'Sensação de peso e inchaço',
      'Pós-operatório, conforme liberação e orientação da equipe responsável',
      'Auxílio na recuperação tecidual',
      'Gestação, quando houver liberação e acompanhamento adequado',
      'Como recurso complementar em protocolos corporais',
    ],
    objetivos: [
      'Favorecer o fluxo linfático',
      'Auxiliar na redução do edema',
      'Promover sensação de leveza e bem-estar',
      'Contribuir para a recuperação dos tecidos',
    ],
    informacoesAdicionais:
      'A técnica deve ser adaptada à condição clínica e ao estado dos tecidos. No pós-operatório, a indicação, intensidade e momento de início devem considerar o procedimento realizado e a liberação do cirurgião.',
    atencao:
      'Deve-se ter cautela ou evitar a técnica em situações como infecção aguda, processos inflamatórios/infecciosos não controlados, suspeita de trombose e determinadas condições cardíacas ou renais, sendo necessária avaliação individual.',
  },
  {
    nome: 'Hidrolipocasia Ultrassônica',
    categoria: 'Corporal',
    descricao:
      'Procedimento corporal que associa a aplicação de solução em tecido subcutâneo, quando indicada, à utilização de ultrassom como recurso complementar, dentro de protocolos destinados a alterações localizadas.',
    indicacoes: [
      'Pode ser considerada em protocolos para determinadas alterações relacionadas à adiposidade localizada, após avaliação individual.',
    ],
    objetivos: [
      'Auxiliar em protocolos para gordura localizada',
      'Complementar estratégias de remodelação corporal',
    ],
    informacoesAdicionais:
      'Não deve ser apresentada como tratamento para emagrecimento ou substituição de alimentação adequada e atividade física. A técnica, substâncias utilizadas e parâmetros do ultrassom devem seguir protocolo seguro e habilitação profissional.',
  },
  {
    nome: 'Intradermoterapia Corporal',
    categoria: 'Corporal',
    descricao:
      'Técnica de aplicação de substâncias em planos superficiais da pele, utilizando múltiplas pequenas aplicações, de acordo com o objetivo do protocolo e a indicação profissional.',
    indicacoes: [
      'Pode ser utilizada em protocolos destinados a determinadas alterações corporais, desde que exista indicação específica para a substância e para a técnica empregada.',
    ],
    objetivos: [
      'Qualidade da pele',
      'Hidratação',
      'Aspecto de determinadas alterações corporais',
      'Protocolos de revitalização tecidual',
    ],
    informacoesAdicionais:
      'A escolha da substância, concentração, volume, profundidade, espaçamento das aplicações e número de sessões deve ser individualizada.',
    atencao:
      'Por envolver aplicação injetável, exige avaliação prévia, conhecimento anatômico, técnica asséptica e domínio das possíveis intercorrências.',
  },
  {
    nome: 'Microagulhamento Corporal',
    categoria: 'Corporal',
    descricao:
      'Técnica de microperfuração controlada aplicada à pele corporal, utilizada em protocolos específicos de remodelação e melhora da qualidade cutânea.',
    indicacoes: [
      'Cicatrizes',
      'Estrias',
      'Alterações de textura',
      'Irregularidades superficiais da pele',
    ],
    objetivos: [
      'Estimular resposta reparadora',
      'Favorecer remodelação tecidual',
      'Melhorar textura e aspecto da pele',
    ],
    informacoesAdicionais:
      'O protocolo deve considerar região corporal, espessura da pele, fototipo, presença de estrias ou cicatrizes e histórico de cicatrização do paciente.',
  },
  {
    nome: 'Tratamento de Estrias',
    categoria: 'Corporal',
    descricao:
      'As estrias são alterações lineares da pele relacionadas à ruptura e remodelação das fibras de colágeno e elastina. O tratamento busca melhorar sua textura, coloração e aspecto geral. Podem ser classificadas, de maneira geral, em estrias recentes (rubras) e estrias antigas (albas).',
    informacoesAdicionais:
      'A resposta ao tratamento varia conforme tempo de aparecimento, coloração, profundidade, localização, fototipo e capacidade individual de cicatrização. Entre os recursos que podem integrar protocolos estão microagulhamento, determinados peelings, tecnologias e outros procedimentos de estímulo de remodelação cutânea. É importante orientar o paciente de que o objetivo é melhorar a aparência das estrias, e não necessariamente eliminá-las completamente.',
  },
  {
    nome: 'Tratamento da Flacidez Facial e Corporal',
    categoria: 'Corporal',
    descricao:
      'A flacidez está relacionada à redução da qualidade e quantidade de componentes responsáveis pela sustentação dos tecidos, incluindo alterações de colágeno, elastina e tecido muscular, além das modificações decorrentes do envelhecimento e de variações de peso. O tratamento busca melhorar a firmeza, o contorno e a qualidade dos tecidos.',
    informacoesAdicionais:
      'A avaliação deve diferenciar flacidez cutânea, flacidez muscular, alterações relacionadas à gordura localizada e flacidez decorrente de grandes perdas de peso. Os protocolos podem utilizar diferentes recursos, como exercícios terapêuticos, tecnologias, procedimentos de estímulo de colágeno e tratamentos combinados, conforme a indicação. A escolha deve considerar idade, região, grau de flacidez, condição da pele e histórico do paciente.',
  },
  {
    nome: 'Tratamento da Celulite',
    categoria: 'Corporal',
    descricao:
      'A celulite, também denominada lipodistrofia ginóide, caracteriza-se por alterações na aparência da pele, especialmente em regiões como glúteos e coxas. Sua formação envolve múltiplos fatores, incluindo tecido adiposo, septos fibrosos, microcirculação e características da pele.',
    informacoesAdicionais:
      'O tratamento deve ser individualizado de acordo com o grau e as características predominantes. A avaliação pode considerar grau de celulite, flacidez associada, adiposidade localizada, edema, qualidade da pele, hábitos alimentares e nível de atividade física. Podem ser utilizados recursos manuais, tecnologias, exercícios e outros procedimentos, isoladamente ou em associação. Não existe um único protocolo universal para todos os casos.',
  },

  // ------------------------------------------------------------------ FACIAL
  {
    nome: 'Drenagem Linfática Facial',
    categoria: 'Facial',
    descricao:
      'Técnica manual realizada na região facial, cervical e áreas relacionadas à drenagem linfática, utilizando movimentos delicados e direcionados.',
    indicacoes: [
      'Edema facial',
      'Pós-procedimentos estéticos',
      'Pós-operatório facial, quando liberado',
      'Sensação de inchaço',
      'Auxílio na recuperação tecidual',
    ],
    objetivos: [
      'Auxiliar na redução do edema',
      'Favorecer a circulação linfática',
      'Promover relaxamento',
      'Melhorar a sensação de conforto facial',
    ],
    informacoesAdicionais:
      'A drenagem facial deve utilizar pressão suave, respeitando a anatomia e o estado dos tecidos. Em procedimentos recentes, deve-se considerar a fase de cicatrização antes da aplicação da técnica.',
  },
  {
    nome: 'Limpeza de Pele Regenerativa',
    categoria: 'Facial',
    descricao:
      'Protocolo de higienização e tratamento da pele que associa a limpeza profunda a recursos destinados à recuperação e manutenção da barreira cutânea. O protocolo pode ser personalizado de acordo com o estado e as necessidades da pele.',
    indicacoes: [
      'Pele com comedões',
      'Oleosidade excessiva',
      'Textura irregular',
      'Acúmulo de células córneas',
      'Pele desvitalizada',
      'Necessidade de revitalização e melhora da aparência cutânea',
    ],
    objetivos: [
      'Promover higienização profunda',
      'Auxiliar no controle da oleosidade',
      'Remover impurezas e comedões',
      'Melhorar textura e luminosidade',
      'Preservar e favorecer a recuperação da barreira cutânea',
    ],
    informacoesAdicionais:
      'A intensidade do protocolo deve ser definida de acordo com o fototipo, sensibilidade, integridade da barreira cutânea e presença de processos inflamatórios.',
  },
  {
    nome: 'Intradermoterapia Facial',
    categoria: 'Facial',
    descricao:
      'Procedimento que utiliza aplicações intradérmicas superficiais para introdução de substâncias selecionadas conforme a necessidade da pele e o objetivo terapêutico ou estético.',
    indicacoes: [
      'Hidratação e revitalização',
      'Melhora da qualidade da pele',
      'Protocolos voltados à textura e luminosidade',
      'Determinadas alterações estéticas',
    ],
    objetivos: [
      'Melhorar a qualidade cutânea',
      'Favorecer hidratação e revitalização',
      'Auxiliar na uniformidade da pele',
    ],
    informacoesAdicionais:
      'A indicação deve considerar fototipo, sensibilidade, condição da barreira cutânea, histórico do paciente e substâncias utilizadas.',
  },
  {
    nome: 'Dermaplaning (Facial)',
    categoria: 'Facial',
    descricao:
      'Técnica de esfoliação mecânica superficial realizada com instrumento específico, promovendo a remoção controlada de células córneas superficiais e pelos finos da face.',
    indicacoes: [
      'Textura cutânea irregular',
      'Pele opaca',
      'Acúmulo superficial de células córneas',
      'Necessidade de melhora da luminosidade',
      'Preparação da pele para determinados protocolos',
    ],
    objetivos: [
      'Promover renovação superficial',
      'Melhorar textura e luminosidade',
      'Proporcionar sensação de pele mais lisa e uniforme',
    ],
    informacoesAdicionais:
      'A técnica deve ser realizada sobre pele íntegra e após avaliação. Deve-se evitar em situações de infecção ativa, lesões abertas e determinadas condições inflamatórias.',
  },
  {
    nome: 'Microagulhamento Facial',
    categoria: 'Facial',
    descricao:
      'Procedimento realizado com dispositivo contendo microagulhas, produzindo microperfurações controladas na pele. Essas microlesões desencadeiam uma resposta reparadora e podem estimular processos relacionados à remodelação tecidual.',
    indicacoes: [
      'Cicatrizes atróficas de acne',
      'Alterações de textura',
      'Linhas finas',
      'Determinados casos de hiperpigmentação, conforme protocolo',
      'Melhora da qualidade geral da pele',
    ],
    objetivos: [
      'Estimular resposta regenerativa',
      'Favorecer remodelação do tecido',
      'Melhorar textura',
      'Auxiliar na uniformidade e qualidade da pele',
    ],
    informacoesAdicionais:
      'Profundidade, número de passadas e intervalo entre sessões devem ser individualizados. A técnica não deve ser realizada sobre pele com infecção ou inflamação ativa.',
  },
  {
    nome: 'Clareamento de Manchas — Face, Mãos e Braços',
    categoria: 'Facial',
    descricao:
      'Conjunto de estratégias destinadas à melhora de alterações de pigmentação da pele, buscando reduzir a intensidade e a extensão das manchas e promover maior uniformidade do tom cutâneo. Pode envolver protocolos tópicos, peelings, tecnologias, microagulhamento ou associações terapêuticas, conforme o diagnóstico e o tipo de hiperpigmentação.',
    informacoesAdicionais:
      'Antes do tratamento, é fundamental identificar a origem da alteração pigmentária, diferenciando, por exemplo, melasma, hiperpigmentação pós-inflamatória, lentigos e outras condições. O protocolo deve considerar fototipo, tipo e profundidade da pigmentação, sensibilidade cutânea, exposição solar, histórico de inflamação e uso de medicamentos e cosméticos. Fotoproteção diária é parte essencial do tratamento, especialmente em protocolos realizados em face, mãos e braços.',
  },
  {
    nome: 'Rejuvenescimento Facial',
    categoria: 'Facial',
    descricao:
      'Conjunto de procedimentos destinados à melhora dos sinais relacionados ao envelhecimento cutâneo, como linhas finas, alterações de textura, perda de luminosidade, flacidez e alterações da qualidade da pele. Pode envolver diferentes recursos, utilizados isoladamente ou associados, de acordo com a avaliação individual.',
    informacoesAdicionais:
      'O envelhecimento facial é multifatorial e envolve alterações da pele, tecido subcutâneo, músculos e estruturas de sustentação. Por isso, o planejamento deve considerar o rosto de maneira global. O protocolo pode contemplar recursos voltados para qualidade da pele, hidratação, textura, estímulo de colágeno, flacidez, linhas de expressão e contorno facial. A escolha dos procedimentos deve respeitar as características anatômicas e as expectativas do paciente.',
  },
  {
    nome: 'Subcisão',
    categoria: 'Facial',
    descricao:
      'A subcisão é uma técnica minimamente invasiva utilizada principalmente para tratar determinadas cicatrizes deprimidas e alterações de relevo da pele. O procedimento utiliza uma agulha ou instrumento específico para romper bandas fibrosas que tracionam a pele para planos mais profundos.',
    indicacoes: [
      'Cicatrizes atróficas deprimidas',
      'Algumas cicatrizes de acne',
      'Determinadas irregularidades de contorno',
      'Alterações fibróticas selecionadas',
    ],
    informacoesAdicionais:
      'A indicação depende do tipo e profundidade da cicatriz e da presença de fibrose. Pode ocorrer edema, equimose, dor, sensibilidade local e alterações temporárias da coloração. É necessário cuidado especial em pacientes com histórico de cicatrização inadequada ou tendência a alterações cicatriciais.',
  },
  {
    nome: 'Toxina Botulínica — Botox®',
    categoria: 'Facial',
    descricao:
      'A toxina botulínica é uma substância que atua temporariamente na transmissão neuromuscular, reduzindo a contração dos músculos nos locais em que é aplicada. Na estética facial, é utilizada principalmente para suavizar linhas de expressão dinâmicas, relacionadas à atividade muscular.',
    indicacoes: [
      'Linhas da testa',
      'Região glabelar',
      'Linhas perioculares',
      'Determinadas alterações relacionadas à hiperatividade muscular',
      'Outras indicações específicas conforme técnica e habilitação profissional',
    ],
    informacoesAdicionais:
      'O resultado é temporário e varia conforme dose utilizada, região tratada, características musculares, metabolismo individual e técnica de aplicação. A avaliação anatômica é fundamental para preservar a naturalidade da expressão facial. Possíveis efeitos adversos incluem dor, edema, equimose e, em alguns casos, efeitos decorrentes da difusão da toxina para músculos adjacentes. Importante: "Botox" é uma marca comercial; o termo técnico é toxina botulínica.',
  },
  {
    nome: 'Tratamento de Olheiras e Rejuvenescimento do Olhar',
    categoria: 'Facial',
    descricao:
      'As olheiras possuem diferentes causas e podem estar relacionadas à hiperpigmentação, alterações vasculares, sombra causada por depressões anatômicas, bolsas, flacidez ou combinação desses fatores. O tratamento busca melhorar a aparência da região periorbital e proporcionar aspecto mais descansado e rejuvenescido.',
    informacoesAdicionais:
      'É essencial identificar o tipo predominante de olheira antes da escolha do protocolo. A avaliação deve observar pigmentação, vascularização, bolsas, sulco lacrimal, flacidez e qualidade da pele. Por se tratar de uma região anatomicamente delicada, procedimentos devem ser realizados com avaliação criteriosa e conhecimento específico da anatomia periorbital.',
  },
  {
    nome: 'Jato de Plasma',
    categoria: 'Facial',
    descricao:
      'O jato de plasma é um recurso utilizado em procedimentos estéticos que promove uma ação localizada sobre a pele por meio de uma descarga de plasma. A energia gerada provoca uma estimulação controlada dos tecidos, podendo favorecer processos de renovação e remodelação da pele.',
    indicacoes: [
      'Flacidez cutânea facial e corporal',
      'Linhas finas e rugas',
      'Rejuvenescimento facial',
      'Flacidez das pálpebras e região periocular, conforme o equipamento e protocolo',
      'Cicatrizes de acne',
      'Estrias',
      'Manchas e alterações de pigmentação, em protocolos específicos',
      'Melhora da textura e uniformidade da pele',
      'Redução de pequenas lesões estéticas, quando o equipamento e a regulamentação profissional permitirem',
      'Estímulo à renovação e remodelação do colágeno',
    ],
    informacoesAdicionais:
      'Como age: a descarga de plasma gera uma ação térmica e/ou elétrica localizada, produzindo uma estimulação controlada da pele. O processo desencadeia mecanismos de reparação tecidual, podendo contribuir para remodelação de colágeno, melhora da textura e maior firmeza cutânea.',
    completo: false,
  },

  // ----------------------------------------------------------------- CAPILAR
  {
    nome: 'Intradermoterapia Capilar',
    categoria: 'Capilar',
    descricao:
      'Técnica de aplicação intradérmica superficial no couro cabeludo, utilizando substâncias selecionadas conforme a avaliação e o objetivo do tratamento.',
    indicacoes: [
      'Pode integrar protocolos destinados a determinadas alterações do couro cabeludo e dos fios, sempre após avaliação adequada da causa da queixa capilar.',
    ],
    objetivos: [
      'Auxiliar na saúde do couro cabeludo',
      'Complementar protocolos de tratamento capilar',
      'Favorecer condições adequadas para o crescimento e manutenção dos fios, conforme a indicação',
    ],
    informacoesAdicionais:
      'A queda capilar pode possuir diversas causas. A intradermoterapia não substitui investigação médica quando houver suspeita de alopecia, alterações hormonais, nutricionais ou doenças do couro cabeludo.',
  },
  {
    nome: 'Microagulhamento Capilar',
    categoria: 'Capilar',
    descricao:
      'Técnica que utiliza microperfurações controladas no couro cabeludo. Pode ser empregada isoladamente ou como parte de protocolos capilares específicos.',
    indicacoes: [
      'Pode ser utilizada como recurso complementar em determinados protocolos para alterações capilares, após avaliação da causa da queda ou alteração dos fios.',
    ],
    objetivos: [
      'Estimular resposta local de reparação',
      'Auxiliar na permeação de determinados ativos, quando tecnicamente indicado',
      'Complementar protocolos de tratamento capilar',
    ],
    informacoesAdicionais:
      'É fundamental investigar a origem da queda capilar antes de definir o protocolo. Casos de alopecia devem ser avaliados e acompanhados de acordo com sua etiologia.',
  },
  {
    nome: 'Pós-Transplante Capilar',
    categoria: 'Capilar',
    descricao:
      'Acompanhamento especializado realizado após transplante capilar, com objetivo de auxiliar na recuperação do couro cabeludo e orientar os cuidados durante o período pós-operatório.',
    indicacoes: [
      'Pacientes submetidos a transplante capilar, sempre de acordo com as orientações da equipe médica responsável.',
    ],
    objetivos: [
      'Auxiliar no controle do edema',
      'Favorecer conforto durante a recuperação',
      'Orientar cuidados com o couro cabeludo',
      'Auxiliar na manutenção das condições adequadas para recuperação da área transplantada',
      'Acompanhar a evolução do tecido',
    ],
    informacoesAdicionais:
      'Os cuidados variam conforme a técnica utilizada no transplante e as orientações do cirurgião. Técnicas manuais, aparelhos e produtos devem ser introduzidos somente quando houver segurança e liberação adequada.',
  },
  {
    nome: 'Alopecia Androgenética — Masculina e Feminina',
    categoria: 'Capilar',
    descricao:
      'A alopecia androgenética é uma forma comum de queda de cabelo caracterizada pela miniaturização progressiva dos folículos geneticamente predispostos, levando à redução da densidade capilar. Nos homens, é comum observar rarefação na região frontal e/ou superior do couro cabeludo. Nas mulheres, frequentemente ocorre redução difusa da densidade, principalmente na região central.',
    informacoesAdicionais:
      'O diagnóstico correto é fundamental, pois diferentes tipos de alopecia podem apresentar manifestações semelhantes. A avaliação pode envolver história clínica, exame do couro cabeludo, tricoscopia, investigação de fatores associados, quando indicada, e avaliação médica em casos que necessitem de diagnóstico ou tratamento medicamentoso. Procedimentos estéticos e recursos capilares podem atuar como tratamentos complementares, mas não substituem a investigação da causa da queda.',
  },
  {
    nome: 'Alopecia Areata',
    categoria: 'Capilar',
    descricao:
      'A alopecia areata é uma condição caracterizada pela perda de pelos ou cabelos em áreas delimitadas, geralmente formando placas bem definidas. Possui relação com mecanismos autoimunes. Pode apresentar evolução variável, com períodos de estabilização, recuperação ou surgimento de novas áreas.',
    informacoesAdicionais:
      'O diagnóstico deve ser realizado por profissional habilitado, especialmente porque outras doenças podem produzir áreas semelhantes de perda capilar. O tratamento depende da extensão, localização, duração e evolução do quadro. Em casos suspeitos ou diagnosticados, procedimentos estéticos devem ser considerados apenas como complementares e dentro de um plano terapêutico adequado.',
  },

  // ------------------------------------------- FISIOTERAPIA / PÓS-OPERATÓRIO
  {
    nome: 'Intradermoterapia para Processos Inflamatórios e Alívio da Dor (Fisioterapia)',
    categoria: 'Fisioterapia/Pós-operatório',
    descricao:
      'Recurso injetável que pode ser utilizado dentro de protocolos específicos para determinadas condições dolorosas ou inflamatórias, mediante avaliação clínica e definição adequada das substâncias.',
    indicacoes: [
      'A indicação depende da causa da dor, do processo inflamatório e do diagnóstico clínico. Pode integrar protocolos multidisciplinares para determinadas condições musculoesqueléticas.',
    ],
    objetivos: [
      'Auxiliar no controle da dor',
      'Modular processos inflamatórios',
      'Favorecer a recuperação funcional em situações selecionadas',
    ],
    informacoesAdicionais:
      'Não é adequado definir uma "fórmula padrão" para dor ou inflamação. A escolha das substâncias deve considerar diagnóstico, mecanismo da dor, contraindicações, medicamentos em uso e habilitação profissional.',
  },
  {
    nome: 'Procedimento Estético Injetável de Microvasos — PEIM',
    categoria: 'Fisioterapia/Pós-operatório',
    descricao:
      'Procedimento destinado ao tratamento estético de determinados microvasos/telangiectasias, realizado por meio da aplicação de substância esclerosante no vaso selecionado.',
    indicacoes: [
      'Telangiectasias e microvasos selecionados para tratamento estético',
      'Determinadas alterações vasculares superficiais após avaliação',
    ],
    objetivos: [
      'Promover a obliteração do vaso tratado e, posteriormente, sua reabsorção pelo organismo, reduzindo sua visibilidade.',
    ],
    informacoesAdicionais:
      'É indispensável realizar avaliação vascular e clínica antes do procedimento. O profissional deve conhecer anatomia vascular, indicação, técnica de aplicação, substância utilizada e manejo das intercorrências.',
    intercorrencias: [
      'Dor ou ardência',
      'Eritema',
      'Equimoses',
      'Hiperpigmentação',
      'Inflamação',
      'Tromboflebite superficial',
      'Reações alérgicas',
      'Extravasamento e lesão tecidual',
    ],
  },
  {
    nome: 'Pós-Operatório Facial',
    categoria: 'Fisioterapia/Pós-operatório',
    descricao:
      'Conjunto de recursos fisioterapêuticos e estéticos utilizados após procedimentos cirúrgicos faciais, com objetivo de auxiliar na recuperação dos tecidos e no controle das alterações decorrentes do procedimento.',
    indicacoes: [
      'Lifting facial',
      'Blefaroplastia',
      'Rinoplastia',
      'Otoplastia',
      'Cirurgias de contorno facial',
      'Outros procedimentos, conforme liberação médica',
    ],
    objetivos: [
      'Auxiliar no controle do edema',
      'Favorecer recuperação tecidual',
      'Reduzir desconfortos',
      'Auxiliar na mobilidade e qualidade dos tecidos',
      'Prevenir ou tratar alterações cicatriciais, quando indicado',
    ],
    informacoesAdicionais:
      'O protocolo deve ser individualizado conforme o tipo de cirurgia e a fase de cicatrização. A liberação do cirurgião é fundamental antes do início das técnicas.',
  },
  {
    nome: 'Pós-Operatório Corporal',
    categoria: 'Fisioterapia/Pós-operatório',
    descricao:
      'Programa de acompanhamento destinado a auxiliar a recuperação funcional e tecidual após procedimentos cirúrgicos corporais.',
    indicacoes: [
      'Lipoaspiração',
      'Abdominoplastia',
      'Mamoplastias',
      'Cirurgias de contorno corporal',
      'Outros procedimentos cirúrgicos, conforme indicação',
    ],
    objetivos: [
      'Auxiliar no controle do edema',
      'Favorecer mobilidade dos tecidos',
      'Auxiliar na recuperação da cicatriz',
      'Reduzir risco de determinadas alterações decorrentes da imobilidade e do processo cicatricial',
      'Promover conforto e recuperação funcional',
    ],
    informacoesAdicionais:
      'O tratamento deve respeitar as fases de cicatrização e as orientações do cirurgião. Técnicas e aparelhos não devem ser utilizados indiscriminadamente sobre áreas recém-operadas.',
  },

  // --------------------------------------------------------------- BEM-ESTAR
  {
    nome: 'Desintoxicação Metabólica',
    categoria: 'Bem-estar',
    descricao:
      'Termo utilizado em alguns protocolos estéticos e de bem-estar para designar estratégias voltadas à melhora de hábitos alimentares, hidratação, funcionamento intestinal e suporte às funções fisiológicas do organismo.',
    informacoesAdicionais:
      'É importante utilizar o conceito com responsabilidade. O organismo possui sistemas próprios de metabolização e eliminação de substâncias, principalmente por meio do fígado, rins, intestino, pulmões e pele. Por isso, protocolos de "detox" não devem ser apresentados como capazes de eliminar toxinas acumuladas de maneira inespecífica ou substituir tratamentos médicos. Um programa de cuidado metabólico pode envolver alimentação equilibrada, hidratação adequada, sono, atividade física, controle do consumo de álcool e ultraprocessados e acompanhamento nutricional quando necessário.',
  },
]

export const PROCEDIMENTOS: Procedimento[] = PROCEDIMENTOS_INPUT.map((item) => ({
  ...item,
  slug: slugify(item.nome),
  completo: item.completo ?? true,
}))

export function findProcedimentoBySlug(
  slug: string | undefined,
): Procedimento | undefined {
  return PROCEDIMENTOS.find((item) => item.slug === slug)
}

export function getProcedimentosPorCategoria(
  categoria: ProcedimentoCategoria,
): Procedimento[] {
  return PROCEDIMENTOS.filter((item) => item.categoria === categoria)
}
