import { motion } from 'motion/react'
import julianaRetrato from '../assets/juliana/juliana-retrato-sem-botoes.jpg'
import { WHATSAPP_NUMBER } from '../data/contact'

const MESSAGE = 'Olá! Gostaria de saber mais sobre os atendimentos da Juliana Gonella.'

const ATENDIMENTOS = [
  'Estética Facial',
  'Estética Corporal',
  'Estética Capilar',
  'Técnicas Minimamente Invasivas',
]

// Título discreto de subseção — mesmo tratamento (barrinha dourada + texto)
// já usado no resto do site (ver SectionLabel em Home.tsx), só alinhado à
// esquerda pra acompanhar o corpo de texto abaixo dele.
function SubsectionTitle({ children }: { children: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="h-1 w-10 rounded-full bg-dourado-health" />
      <h2 className="font-flatline text-xl text-emerald-dark sm:text-2xl">
        {children}
      </h2>
    </div>
  )
}

// Página própria "Sobre" — a rota /juliana-gonella era só uma página de
// exemplo (placeholder); o conteúdo real da bio já existia era só o
// resumo usado no card da home (ver AboutHealthSection em Home.tsx).
// Aqui ele ganha uma página inteira, um pouco mais completa.
function Sobre() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-10"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <img
          src={julianaRetrato}
          alt="Juliana Gonella"
          className="h-32 w-32 shrink-0 rounded-full border-4 border-dourado-health/40 object-cover shadow-sm sm:h-40 sm:w-40"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="h-1 w-12 rounded-full bg-dourado-health" />
          <h1 className="font-flatline text-3xl leading-tight text-emerald-dark sm:text-4xl">
            Sobre a Juliana Gonella
          </h1>
        </div>
      </div>

      {/* Corpo do texto em coluna à esquerda (mais legível pro conteúdo
          mais longo) — só o cabeçalho acima (foto + título) fica
          centralizado, mantendo o tratamento visual original. */}
      <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-10 text-left">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-emerald-dark/80 sm:text-base">
            Juliana Gonella é fisioterapeuta, especialista e mestre, com uma
            trajetória que une décadas de atuação clínica à formação
            acadêmica de excelência. Fisioterapeuta formada pela
            Universidade de Araraquara (Uniara), é especialista em
            Neuropediatria e Motricidade pela Universidade Federal de São
            Carlos (UFSCar) e em Fisioterapia Dermato Funcional pela
            Universidade Gama Filho (UGF), além de Mestre em Biotecnologia
            em Medicina Regenerativa e Química Medicinal, uma combinação
            rara que une o rigor científico da saúde à sensibilidade da
            estética.
          </p>
          <p className="text-sm text-emerald-dark/80 sm:text-base">
            Por 16 anos (2009–2025), Juliana formou novas gerações de
            profissionais como professora universitária no curso de
            Estética e Cosmética da Uniara, lecionando Estética Facial,
            Técnicas Minimamente Invasivas, Tricologia, Fisiologia e
            Dermatopatologia, além de supervisionar estágios. É também
            autora de artigos científicos e de capítulo de livro na área de
            biotecnologia, conhecimento que hoje se traduz em cada
            atendimento e cada produto recomendado no Instituto Health.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <SubsectionTitle>O Instituto Health</SubsectionTitle>
          <p className="text-sm text-emerald-dark/80 sm:text-base">
            Desde 2013, Juliana é proprietária e gerente do Health Instituto
            de Saúde Integrada, nascido para reunir, em um só espaço,
            fisioterapia, estética e pilates com o mesmo padrão de cuidado
            técnico e humano.
          </p>
          <p className="text-sm text-emerald-dark/80 sm:text-base">
            Ao longo dos anos, o Instituto ampliou sua atuação e hoje é
            também distribuidor oficial da Tulípia, levando dermocosméticos
            de alta performance tanto para profissionais quanto para
            clientes finais, além de oferecer produtos de higiene,
            perfumaria, descartáveis e acessórios para clínicas e
            profissionais de Estética e Fisioterapia.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <SubsectionTitle>Atendimentos</SubsectionTitle>
          <p className="text-sm text-emerald-dark/80 sm:text-base">
            Juliana atende pessoalmente nas áreas de:
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-emerald-dark/80 marker:text-dourado-health sm:text-base">
            {ATENDIMENTOS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <SubsectionTitle>Health Academy</SubsectionTitle>
          <p className="text-sm text-emerald-dark/80 sm:text-base">
            A vocação de formar profissionais nunca deixou de fazer parte da
            trajetória de Juliana. Hoje, ela leva essa experiência para
            dentro do próprio Instituto através da Health Academy,
            ministrando cursos nas áreas de Estética Facial, Corporal,
            Capilar e Técnicas Minimamente Invasivas, formação prática,
            guiada por quem une know-how científico e vivência de mais de
            uma década em sala de aula universitária.
          </p>
        </div>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`}
          target="_blank"
          rel="noreferrer"
          className="font-flatline mt-2 inline-flex items-center justify-center self-center rounded-full bg-dourado-health px-8 py-3 text-sm leading-none text-emerald-dark transition-colors hover:bg-dourado-claro"
        >
          Falar pelo WhatsApp
        </a>
      </div>
    </motion.section>
  )
}

export default Sobre
