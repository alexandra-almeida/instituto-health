// Detalhes de produto (descrição, benefícios, ativos, indicações, modo de
// uso, avisos e INCI), exibidos na página de detalhe. Todos os campos são
// opcionais: produto sem entrada aqui continua com o texto genérico de
// generateDescription(). Para detalhar outro produto, basta adicionar uma
// entrada em PRODUCT_DETAILS, sem mexer em componente.
//
// Chave: `${nome}|${tamanho}`, igual a productImages.ts e productGallery.ts.
// Textos vêm da página oficial do produto em tulipia.com.br (revendedora
// autorizada). Sem travessões; os avisos de uso entram na íntegra.

export interface ProdutoAtivo {
  /** quando preenchido, agrupa ativos sob um subtítulo (ex: "Fase 1") */
  grupo?: string
  nome: string
  descricao: string
}

export interface ProdutoBeneficio {
  titulo: string
  texto?: string
}

export interface ProdutoInci {
  /** rótulo quando há mais de uma fórmula (ex: "Fase 1") */
  rotulo?: string
  texto: string
}

export interface ProdutoDetalhes {
  /** parágrafos; quando presente, substitui o texto genérico */
  descricao?: string[]
  beneficios?: ProdutoBeneficio[]
  principiosAtivos?: ProdutoAtivo[]
  indicacoes?: string[]
  /** passos ou orientações, um item por linha */
  modoDeUso?: string[]
  /** avisos de segurança, exibidos em destaque e na íntegra */
  avisos?: string[]
  inci?: ProdutoInci[]
}

const AVISO_ALERGENICIDADE =
  'Antes de usar qualquer produto, faça uma prova de alergenicidade aplicando uma pequena quantidade no antebraço ou atrás da orelha. Espere 35 minutos e depois lave o local.'

export const PRODUCT_DETAILS: Record<string, ProdutoDetalhes> = {
  'Dermo CaHA - Monodose Facial|3 ampolas de 5ml': {
    descricao: [
      'Fluido concentrado de uso tópico com Nano Hidroxiapatita de Cálcio e ativos antioxidantes que contribuem para a bioestimulação de colágeno e elastina que recupera a firmeza, elasticidade e potencializa o rejuvenescimento da pele.',
      'O Dermo CaHA Monodose Facial é um fluido profissional de uso tópico formulado com Nano Hidroxiapatita de Cálcio associado a ativos antioxidantes e revitalizantes, como Nano Genisteína, Nano Resveratrol e Extrato de Lúpulo. Sua tecnologia foi desenvolvida para contribuir com a bioestimulação de colágeno e elastina, auxiliando na recuperação da firmeza, sustentação e qualidade da pele. A textura fluida de alto deslizamento permite que o produto seja integrado a protocolos estéticos profissionais.',
      'Indicado para peles que apresentam sinais de perda de densidade, flacidez e alterações na textura, o produto auxilia na recuperação da estrutura cutânea, devolvendo a firmeza em peles com aspecto "derretido". Sua textura fluida de alto deslizamento facilita a aplicação e melhora a distribuição dos ativos e maior precisão durante o protocolo.',
      'Produto de uso exclusivamente tópico. A fórmula é livre de fragrância, corantes, silicones, álcool etílico, parabenos e sulfatos.',
    ],
    beneficios: [
      {
        titulo: 'Potencializa o rejuvenescimento',
        texto:
          'Auxilia na melhora da estrutura e da qualidade da pele, reduzindo rugas e linhas de expressão para uma aparência mais rejuvenescida.',
      },
      {
        titulo: 'Melhora da firmeza e sustentação da pele',
        texto:
          'Contribui para uma pele com aparência mais estruturada e resistente.',
      },
      {
        titulo: 'Manutenção da elasticidade cutânea',
        texto:
          'Auxilia a pele a recuperar sua capacidade natural de flexibilidade.',
      },
      {
        titulo: 'Melhora da textura',
        texto: 'Ajuda a tornar a superfície da pele mais uniforme e refinada.',
      },
      {
        titulo: 'Aumenta a hidratação',
        texto:
          'Favorece a manutenção da hidratação da pele e contribui para uma aparência mais viçosa.',
      },
      {
        titulo: 'Potencializa o clareamento',
        texto:
          'Age nas áreas escurecidas para um tom de pele mais homogêneo e equilibrado.',
      },
      {
        titulo: 'Sensação de pele mais preenchida',
        texto: 'Potencializa a densidade e estrutura da pele.',
      },
    ],
    principiosAtivos: [
      {
        nome: 'Extrato de Lúpulo',
        descricao:
          'Acalma, hidrata, reduz a vermelhidão e age contra o estresse oxidativo, devolvendo o equilíbrio e uniformidade da pele.',
      },
      {
        nome: 'Nano Genisteína',
        descricao:
          'Atua no equilíbrio da pele, devolve a densidade e estimula a sustentação da pele para um aspecto mais jovem, liso e radiante.',
      },
      {
        nome: 'Nano Hidroxiapatita de Cálcio',
        descricao:
          'Ativo mineral que estimula a produção de colágeno, devolve a densidade perdida e a firmeza estrutural para um contorno definido e uma pele visivelmente mais jovem.',
      },
      {
        nome: 'Nano Resveratrol',
        descricao:
          'Um antioxidante mais potente, atua diretamente nos alvos celulares para neutralizar o envelhecimento, blindar a pele contra danos externos e devolver luminosidade.',
      },
    ],
    indicacoes: [
      'Antiage',
      'Clareamento e uniformização da pele',
      'Facial',
      'Flacidez',
      'Hidratação',
      'Rugas',
    ],
    modoDeUso: [
      'Aplique todo o conteúdo do Dermo CaHA Monodose Facial sobre a área desejada, conforme protocolo de escolha. Não é necessário remover.',
    ],
    avisos: [
      'Produto de uso tópico. Não é injetável. Contraindicado para intradermoterapia.',
      AVISO_ALERGENICIDADE,
    ],
    inci: [
      {
        texto:
          'ÁGUA, HIDROXIAPATITA, EXTRATO DE LÚPULO, ÓLEO DA SEMENTE DE ROMÃ, GENISTEÍNA, RESVERATROL, GLICEROL, CROSPOLÍMERO-6 DE POLIACRILATO, ÁCIDO BENZOICO, ÁLCOOL BENZÍLICO, ÉSTER DE ÁCIDO C12-20 PEG-8, ÁCIDO DESIDROACÉTICO, ÁCIDO LÁCTICO, POLISSORBATO 80, SORBATO DE POTÁSSIO, PROPILENOGLICOL, BENZOATO DE SÓDIO, OLEATO DE SORBITANO, FENOXIETANOL, ÓLEO VEGETAL.',
      },
    ],
  },

  'ExoGenetic PDRN - Monodose Facial|3 ampolas de 3ml': {
    descricao: [
      'Fluido profissional concentrado com duplo PDRN e arquitetura bioenergética que prolonga a longevidade da pele. Indicada para peles com perda de vitalidade, textura irregular, linhas de expressão e diminuição da densidade cutânea.',
      'O ExoGenetic PDRN Monodose Facial inaugura uma nova abordagem na estética profissional ao integrar prejuvenescimento e rejuvenescimento em uma fórmula tópica desenvolvida para protocolos avançados, indicado para peles com perda de vitalidade, textura irregular, linhas de expressão, diminuição da densidade cutânea e aparência de pele cansada.',
      'Sua arquitetura bioenergética combina duplo PDRN (animal e vegetal), exossomos biomiméticos associados a 12 peptídeos, Niacinamida, Glutationa e Ácido Hialurônico; e ativadores de energia celular, como NMN e NAD+, formando uma estratégia que vai além do estímulo isolado. A proposta é atuar sob uma nova lógica que considera três pilares essenciais da pele: estrutura, comunicação celular e energia.',
      'O PDRN de origem animal atua na organização da estrutura cutânea, enquanto o PDRN vegetal de arroz está associado a processos que contribuem para uma aparência mais descansada e revitalizada, responsável pelo efeito conhecido como "sono da beleza". Essa combinação amplia o espectro de atuação da fórmula em uma abordagem que prolonga a longevidade e melhora a qualidade global da pele.',
      'Inspirado na convergência entre prejuvenescimento e rejuvenescimento, o ExoGenetic PDRN Monodose Facial foi desenvolvido para preservar a vitalidade da pele ao longo do tempo e, em sincronia, melhorar sinais já perceptíveis de desgaste cutâneo.',
      'Produto de uso exclusivamente tópico, indicado para protocolos profissionais. A fórmula é livre de fragrância, corantes, silicones, óleos, álcool, parabenos e sulfatos.',
    ],
    beneficios: [
      {
        titulo: 'Aparência de pele mais descansada e revitalizada',
        texto:
          'A presença do PDRN vegetal de arroz está associada à ativação de receptores que estão relacionados aos processos naturais de reparo cutâneo, o que entrega uma pele com aparência mais descansada, luminosa e revitalizada. Efeito conhecido como "sono da beleza".',
      },
      {
        titulo: 'Prolonga a longevidade da pele',
        texto:
          'Com moléculas que estimulam os mecanismos de reparo e energia, o produto atua para preservar o funcionamento natural da pele, prolongando sua juventude ao longo do tempo.',
      },
      {
        titulo: 'Refinamento da textura',
        texto:
          'A combinação de bioativos da fórmula torna a superfície da pele mais uniforme com sensação de suavidade e refinamento da textura.',
      },
      {
        titulo: 'Redensificação cutânea',
        texto:
          'Os ativos presentes na fórmula fortalecem a estrutura da pele, favorecendo uma aparência mais densa e consistente.',
      },
      {
        titulo: 'Redução de linhas de expressão',
        texto:
          'Com o suporte à organização estrutural da pele, a fórmula auxilia na redução de linhas de expressão e promove um aspecto mais liso e harmonioso.',
      },
      {
        titulo: 'Vitalidade e energia celular',
        texto:
          'Os ativadores energéticos auxiliam na manutenção da atividade cutânea e contribuem para uma pele mais responsiva, com aparência revitalizada e menos sinais de desgaste.',
      },
      {
        titulo: 'Melhora global da qualidade da pele',
        texto:
          'Favorece uma evolução contínua da pele, com aparência mais revitalizada e resistente ao longo do tempo.',
      },
    ],
    principiosAtivos: [
      {
        nome: '12 peptídeos',
        descricao:
          'Uma combinação estratégica de 12 peptídeos que impulsiona a comunicação entre as células. Atua no reparo intenso, controla o envelhecimento celular e dispara uma produção massiva de colágeno.',
      },
      {
        nome: 'Ácido Hialurônico',
        descricao:
          'O Ácido Hialurônico é um dos ativos cosméticos mais completos para a pele. Com ação antioxidante, firmadora, preenchedora e hidratante, é capaz de proporcionar sustentação, evitando a flacidez e suavizando as linhas e os sinais de expressão.',
      },
      {
        nome: 'Exossomas',
        descricao:
          'Vesículas extracelulares que atuam como mensageiros na pele. Otimizam a comunicação e a vitalidade celular, contribuindo para a firmeza, elasticidade e um aspecto radiante.',
      },
      {
        nome: 'Micro PDRN',
        descricao:
          'Ativo derivado do DNA purificado do salmão. Ele atua como um fator de crescimento, promovendo a regeneração celular, a produção de colágeno e elastina e a hidratação intensa da pele.',
      },
      {
        nome: 'NAD+',
        descricao:
          'Molécula vital que mantém o bom funcionamento das células, ajudando-as a gerar energia para todas as funções celulares, como a produção de colágeno e o reparo do DNA.',
      },
      {
        nome: 'Niacinamida',
        descricao:
          'Forma estável da vitamina B3 que uniformiza o tom da pele, controla a oleosidade, fortalece a barreira cutânea e potencializa a retenção de hidratação.',
      },
      {
        nome: 'NMN',
        descricao:
          'Precursor do NAD+ que otimiza o metabolismo cutâneo. Contribui para a vitalidade e resistência da pele, conferindo um aspecto energizado e com viço.',
      },
      {
        nome: 'PDRN de Arroz',
        descricao:
          'A potência regeneradora dos polinucleotídeos em versão vegetal. O PDRN de Arroz restaura a estrutura da pele, promove hidratação profunda e devolve a firmeza e o viço com máxima biocompatibilidade.',
      },
    ],
    indicacoes: ['Antiage', 'Facial', 'Flacidez', 'Revitalização', 'Rugas'],
    modoDeUso: [
      'Aplique todo o conteúdo do ExoGenetic PDRN Monodose Facial sobre a área desejada, conforme protocolo de escolha. Não é necessário remover.',
    ],
    avisos: [
      'Produto de uso tópico. Não é injetável. Contraindicado para intradermoterapia.',
      AVISO_ALERGENICIDADE,
    ],
    inci: [
      {
        texto:
          'ÁGUA, 1,2-HEXANODIOL, ACETIL GLICIL SH-OLIGOPEPTÍDEO-118 SP AMIDA, ACETIL HEXAPEPTÍDEO-8, COBRE TRIPEPTÍDEO-1, GLUTATIONA, GLICEROL, NICOTINAMIDA, NADIDA, MONONUCLEOTÍDEO DE NICOTINAMIDA, OLIGOPEPTÍDEO 34, OLIGOPEPTÍDEO 7, PALMITOIL PENTAPEPTÍDEO-4, PALMITOIL SH-HEPTAPEPTÍDEO-14 ASPARTIL HIDROXITRIPTOFANO, PALMITOIL TETRAPEPTÍDEO-7, SH-OLIGOPEPTÍDEO-1, SH-OLIGOPEPTÍDEO-2, SH-OLIGOPEPTÍDEO-5, SH-POLIPEPTÍDEO-9, ÁCIDO DESOXIRRIBONUCLEICO SÓDICO, HIALURONATO DE SÓDIO, FENOXIETANOL, FOSFATO TAMPONADO SALINO, POLOXÂMERO 407, BENZOATO DE SÓDIO, SORBATO DE POTÁSSIO, PPG-5 CETETE-20, AMINOMETILPROPANOL, CAPRILILGLICOL, EDETATO DISSÓDICO.',
      },
    ],
  },

  'Black Secret - Peeling Facial 2 Fases|30g cada': {
    descricao: [
      'Peeling profissional em duas fases com esfoliação tripla e ativos clareadores potentes. Ideal para pele com marcas*, cicatrizes, rugas e linhas de expressão. Protocolo inovador, seguro e de alta eficácia com resultados visíveis logo nas primeiras sessões.',
      'O Black Secret Peeling Facial é a nova geração dos peelings profissionais. Com tecnologia e ativos consagrados pela ciência dermocosmética, sua fórmula inovadora traz o equilíbrio entre segurança e performance, unindo a esfoliação química, física e enzimática a um blend clareador de alta potência. Clareia com precisão, além de atuar sobre a textura irregular e sinais de envelhecimento, inclusive linhas finas e marcas*. A descamação controlada garante segurança e eficácia, promovendo uma pele mais luminosa, uniforme, sem marcas* e rejuvenescida em poucas sessões.',
      'O Black Secret Peeling Facial chega para compor a prestigiada linha Black Secret, especialmente desenvolvida para entregar exclusividade e alta eficiência aos protocolos de peeling, com produtos pensados minuciosamente para potencializar resultados.',
      'Feito exclusivamente para profissionais, o protocolo em duas fases promove uma esfoliação completa (química, física e enzimática), seguida de uma potente ação clareadora com ativos de última geração. A Fase 1 é responsável por remover impurezas, afinar a camada superficial da pele e estimular a permeabilidade dos ativos, preparando o terreno para a ação intensiva da Fase 2. Na Fase 2, ativos como Retinol, Retinal, Brightenyl e Ácido Kójico atuam de forma sinérgica para uniformizar o tom, suavizar marcas* e revelar uma pele mais luminosa, firme e rejuvenescida.',
      'Com descamação controlada, o protocolo é perfeito para peles com tonalidade irregular, marcas persistentes*, cicatrizes, poros dilatados, textura espessa e sinais de envelhecimento.',
      '*O termo "marcas" se refere às marcas provenientes do sol e/ou da acne.',
    ],
    beneficios: [
      { titulo: 'Clareia e uniformiza a textura da pele' },
      { titulo: 'Possui ação clareadora potente' },
      { titulo: 'Promove esfoliação tripla' },
      { titulo: 'Estimula o rejuvenescimento' },
      { titulo: 'Reduz linhas de expressão' },
      { titulo: 'Diminui a oleosidade e previne a acne' },
      { titulo: 'Reduz marcas de acne' },
    ],
    principiosAtivos: [
      {
        grupo:
          'Fase 1: prepara a pele com esfoliação química, física e enzimática',
        nome: 'Ácido Salicílico',
        descricao:
          'Promove esfoliação química. Previne a formação de acne. Promove o afinamento da camada superficial da pele. Desobstrui os poros.',
      },
      {
        grupo:
          'Fase 1: prepara a pele com esfoliação química, física e enzimática',
        nome: 'Ácido Glicólico',
        descricao:
          'Esfoliante químico. Favorece a síntese de colágeno. Aumenta a permeabilidade cutânea. Controla a oleosidade.',
      },
      {
        grupo:
          'Fase 1: prepara a pele com esfoliação química, física e enzimática',
        nome: 'Bromelina e Papaína',
        descricao:
          'Esfoliação enzimática. Uniformiza a pele suavemente. Melhora o brilho cutâneo. Controla a oleosidade. Previne o aparecimento da acne.',
      },
      {
        grupo:
          'Fase 1: prepara a pele com esfoliação química, física e enzimática',
        nome: 'Cristal de Quartzo',
        descricao:
          'Promove esfoliação física. Revitalização cutânea. Remove impurezas. Favorece a absorção de ativos. Melhora a textura da pele.',
      },
      {
        grupo:
          'Fase 1: prepara a pele com esfoliação química, física e enzimática',
        nome: 'Espiculite',
        descricao:
          'Alta tecnologia para otimizar a ação de ativos. Promove esfoliação física. Suaviza a textura. Promove vitalidade. Contribui para o viço da pele.',
      },
      {
        grupo: 'Fase 2: clareamento de alta potência',
        nome: 'Retinol',
        descricao:
          'Reduz rugas e imperfeições profundas. Poderosa sinergia anti-envelhecimento. Ativa o ciclo de renovação da pele. Reduz a aparência de poros dilatados. Entrega uniformidade no tom da pele.',
      },
      {
        grupo: 'Fase 2: clareamento de alta potência',
        nome: 'Retinal',
        descricao:
          'Estimula intensamente a produção de colágeno. Potencializa a firmeza, elasticidade e textura da pele. Potente na revitalização da pele. Ação rejuvenescedora com precisão.',
      },
      {
        grupo: 'Fase 2: clareamento de alta potência',
        nome: 'Cybright®',
        descricao:
          'Alta ação clareadora nas variações de tonalidade. Realça o brilho natural da pele. Contribui para uma aparência equilibrada e com viço. Ajuda a refinar a superfície da pele.',
      },
      {
        grupo: 'Fase 2: clareamento de alta potência',
        nome: 'Brightenyl®',
        descricao:
          'Clareia a pele. Uniformiza a pele. Melhora a luminosidade. Reforça o equilíbrio cutâneo. Protege contra efeitos nocivos de poluentes.',
      },
      {
        grupo: 'Fase 2: clareamento de alta potência',
        nome: 'Ácido Diglicosil Gálico',
        descricao:
          'Promove luminosidade. Reduz variações de tonalidade. Protege contra estresses oxidativos. Melhora o viço.',
      },
      {
        grupo: 'Fase 2: clareamento de alta potência',
        nome: 'Ácido Kójico',
        descricao:
          'Propriedades clareadoras e antioxidantes. Clareia a pele. Uniformiza o tom da pele. Combate os radicais livres. Reduz sinais de envelhecimento.',
      },
    ],
    indicacoes: [
      'Cicatrizes de acne',
      'Clareamento e uniformização da pele',
      'Controle da oleosidade',
    ],
    modoDeUso: [
      'Fase 1: aplique a Fase 1 em toda a área, dividindo-a por quadrantes, e realize movimentos circulares até a completa absorção do produto. Deixe agir por 10 minutos e, em seguida, remova o excesso do filme formado suavemente com algodão umedecido em água para que o produto seguinte possa ser absorvido.',
      'Fase 2: com a área completamente seca, aplique uma camada da Fase 2 nas regiões desejadas. Deixe agir de 6 a 8 horas, respeitando a tolerância da pele.',
      'Frequência: uma vez a cada 15 ou 21 dias, a depender da avaliação profissional.',
      'Para obter ótimos resultados, recomendamos seguir o protocolo profissional completo feito para o produto que está anexado na embalagem.',
    ],
    avisos: [
      'Não indicado para gestantes nem para lactantes.',
      'A tolerância individual ao ácido deve ser sempre respeitada. Em caso de desconforto intenso antes do tempo indicado, neutralize o ácido imediatamente com água. Redobre a atenção em fototipos IV, V e VI. Oriente o cliente a não puxar ou esfregar a pele, e usar o protetor solar obrigatoriamente. O tempo de uso após a abertura da embalagem é de 3 meses.',
      AVISO_ALERGENICIDADE,
    ],
    inci: [
      {
        rotulo: 'Fase 1',
        texto:
          'ÁGUA, COPOLÍMERO DE ACRILOILDIMETILTAURATO DE AMÔNIO/VP, ÁCIDO LÁTICO, BROMELINA, CRISTAIS DE QUARTZO, ESPONJA HIDROLIZADA, ADIPATO DE DIBUTILA, ÁCIDO GLICÓLICO, PENTAERITRITIL TETRA-DI-T-BUTIL HIDROXI-HIDROCINAMATO, ÁCIDO SALICÍLICO, METABISSULFITO DE SÓDIO, ETILHEXILGLICERINA, PAPAÍNA, FENOXIETANOL.',
      },
      {
        rotulo: 'Fase 2',
        texto:
          'ÁGUA, COPOLÍMERO DE ACRILOILDIMETILTAURATO DE AMÔNIO/VP, RETINOL, EXTRATO DE CYSTOSEIRA TAMARISCISFOLIA, ÁCIDO KÓJICO, HIDROXIAPATITA, GLICERINA, ÁCIDO DIGLICOSIL GÁLICO, RETINAL, ÁCIDO SALICÍLICO, ADIPATO DE DIBUTILA, ÁCIDO GLICÓLICO, POLISSORBATO 20, DIMETIL ISOSSORBIDA, PENTAERITRITIL TETRA-DI-T-BUTIL HIDROXI-HIDROCINAMATO, BHT, METABISSULFITO DE SÓDIO, ETILHEXILGLICERINA, BHA, FENOXIETANOL.',
      },
    ],
  },
}

export function getProductDetails(
  nome: string,
  tamanho: string,
): ProdutoDetalhes | undefined {
  return PRODUCT_DETAILS[`${nome}|${tamanho}`]
}
