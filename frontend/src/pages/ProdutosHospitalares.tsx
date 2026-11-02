import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import BlocoAtacado from '../components/descartaveis/BlocoAtacado'
import DescartavelCard from '../components/descartaveis/DescartavelCard'
import { SearchIcon } from '../components/icons'
import ScrollReveal from '../components/ScrollReveal'
import { useCart } from '../context/useCart'
import {
  CATEGORIAS_DESCARTAVEIS,
  DESCARTAVEIS,
  MARCAS_DESCARTAVEIS,
} from '../data/descartaveis'
import { filtrarDescartaveis, paraCarrinho } from '../lib/descartaveis'

// Descartáveis para clínicas (rota /produtos-hospitalares): a lista real da
// Juliana, com carrinho (o mesmo da Tulípia), filtro por categoria e por marca e
// busca por nome. Preço único, sem preço de profissional. Dados em
// data/descartaveis.json; o bloco de atacado e licitações fica no topo.
function ProdutosHospitalares() {
  const { addItem } = useCart()
  const [categoria, setCategoria] = useState('')
  const [marca, setMarca] = useState('')
  const [busca, setBusca] = useState('')

  const produtos = useMemo(
    () => filtrarDescartaveis(DESCARTAVEIS, { categoria, marca, busca }),
    [categoria, marca, busca],
  )
  const comFiltro = categoria !== '' || marca !== '' || busca.trim() !== ''

  function limparFiltros() {
    setCategoria('')
    setMarca('')
    setBusca('')
  }

  function adicionar(
    produtoId: string,
    variacaoSku: string,
    quantidade: number,
  ) {
    const produto = DESCARTAVEIS.find((p) => p.id === produtoId)
    const variacao = produto?.variacoes.find((v) => v.sku === variacaoSku)
    if (produto && variacao)
      addItem(paraCarrinho(produto, variacao), quantidade)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-10"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-1 w-12 rounded-full bg-dourado-health" />
        <h1 className="font-flatline text-3xl leading-tight text-emerald-dark sm:text-4xl">
          Descartáveis Para Clínicas
        </h1>
        <p className="max-w-xl text-sm text-emerald-dark/70 sm:text-base">
          Luvas, itens de atendimento, papéis, copa, higiene e limpeza, sacos e
          embalagens para o dia a dia da sua clínica.
        </p>
      </div>

      <BlocoAtacado />

      <div className="mx-auto mt-10 max-w-md lg:max-w-lg">
        <label className="relative block">
          <span className="sr-only">Buscar produto por nome</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#04452E]/50" />
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar produto por nome..."
            className="w-full rounded-full border border-[#04452E]/15 bg-white py-2.5 pr-4 pl-10 text-sm text-[#04452E] placeholder:text-[#04452E]/40 focus:border-[#CAA02D] focus:ring-2 focus:ring-[#CAA02D]/30 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {['', ...CATEGORIAS_DESCARTAVEIS].map((opcao) => {
          const selecionada = categoria === opcao
          return (
            <button
              key={opcao || 'todas'}
              type="button"
              onClick={() => setCategoria(opcao)}
              aria-pressed={selecionada}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selecionada
                  ? 'border-dourado-health bg-dourado-health text-emerald-dark'
                  : 'border-emerald-dark/15 text-emerald-dark hover:border-dourado-health/50'
              }`}
            >
              {opcao || 'Todas'}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex justify-center">
        <label className="flex items-center gap-2 text-sm text-emerald-dark/80">
          Marca
          <select
            value={marca}
            onChange={(event) => setMarca(event.target.value)}
            className="rounded-full border border-[#04452E]/15 bg-white px-4 py-2 text-sm text-[#04452E] focus:border-[#CAA02D] focus:ring-2 focus:ring-[#CAA02D]/30 focus:outline-none"
          >
            <option value="">Todas as marcas</option>
            {MARCAS_DESCARTAVEIS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p
        className="mt-8 text-center text-sm text-emerald-dark/70"
        aria-live="polite"
      >
        {produtos.length === 0
          ? 'Nenhum produto encontrado.'
          : `${produtos.length} produto${produtos.length > 1 ? 's' : ''}`}
      </p>

      {produtos.length === 0 && comFiltro && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={limparFiltros}
            className="rounded-full border border-emerald-dark/20 px-5 py-2 text-sm font-medium text-emerald-dark transition-colors hover:border-dourado-health"
          >
            Limpar filtros
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 3xl:gap-6">
        {produtos.map((produto, index) => (
          <ScrollReveal key={produto.id} delay={(index % 4) * 0.06}>
            <DescartavelCard
              produto={produto}
              onAdicionar={(variacaoSku, quantidade) =>
                adicionar(produto.id, variacaoSku, quantidade)
              }
            />
          </ScrollReveal>
        ))}
      </div>
    </motion.section>
  )
}

export default ProdutosHospitalares
