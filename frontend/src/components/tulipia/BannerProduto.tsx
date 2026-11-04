import { Link } from 'react-router-dom'
import { findProductById, formatPrice } from '../../data/tulipiaProducts'
import { dadosDoCartao } from '../../lib/bannerProduto'
import BannerImagem from './BannerImagem'

interface BannerProdutoProps {
  /** sku do produto (campo `sku` do catálogo, igual ao `id`) */
  sku: string
  /** arte para telas a partir de 640px; o card fica sobre ela, à direita */
  desktop: string
  /** arte para telas pequenas; hoje é a mesma do desktop (ver BannerImagem) */
  mobile: string
  alt: string
  /** proporção real da arte, ex: `aspect-[1920/802]` */
  proporcao: string
}

// Banner de produto com um card por cima (HTML, não embutido na foto) que leva
// à página do produto. Nome, tamanho e exclusividade vêm do catálogo pelo sku.
//
// De 640px para cima o card fica sobre a imagem, à direita (a arte deve deixar
// esse lado livre; se uma arte nova cobrir o rosto ou o produto, ajuste
// `right`/`w` abaixo). No celular a imagem é pequena, então o card desce para
// debaixo dela, em largura total, cobrindo só a borda de baixo.
//
// Acessibilidade: a imagem e o botão são DOIS links irmãos para o mesmo
// destino (link dentro de link é inválido). A imagem mantém o alt; o botão
// ganha um nome que diz de qual produto se trata.
function BannerProduto({
  sku,
  desktop,
  mobile,
  alt,
  proporcao,
}: BannerProdutoProps) {
  const produto = findProductById(sku)
  if (!produto) return null

  const dados = dadosDoCartao(produto)
  const destino = `/tulipia/produto/${produto.id}`
  const nomeCompleto = [dados.marca, dados.nome].filter(Boolean).join(' ')

  return (
    <div className="relative">
      <Link
        to={destino}
        className="block w-full overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)]"
      >
        <BannerImagem
          desktop={desktop}
          mobile={mobile}
          alt={alt}
          proporcao={proporcao}
        />
      </Link>

      <div className="relative z-10 mx-3 -mt-6 flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-[0_6px_20px_-4px_rgba(4,32,18,0.2)] sm:absolute sm:top-1/2 sm:right-[3%] sm:mx-0 sm:mt-0 sm:w-[32%] sm:max-w-[300px] sm:-translate-y-1/2 sm:gap-1.5 sm:p-3 lg:right-[5%] lg:w-[28%] lg:gap-2 lg:p-5">
        <p className="font-flatline text-2xl leading-none text-verde-health sm:text-xl lg:text-3xl">
          {dados.marca}
        </p>
        <div className="font-inter flex flex-col gap-0.5 text-sm leading-snug text-verde-health/75 sm:text-xs lg:text-sm">
          {dados.nome && <span>{dados.nome}</span>}
          <span>{dados.tamanho}</span>
        </div>

        <hr className="my-1 w-full border-t border-verde-health/15" />

        {dados.exclusivo ? (
          <div className="font-inter flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-dourado-health uppercase">
              Exclusivo
            </span>
            <span className="text-sm text-verde-health sm:text-xs lg:text-sm">
              Produto para profissionais
            </span>
          </div>
        ) : (
          <p className="font-inter text-xl font-semibold text-verde-health lg:text-2xl">
            {formatPrice(dados.preco)}
          </p>
        )}

        <Link
          to={destino}
          aria-label={`Ver produto ${nomeCompleto}`}
          className="font-inter mt-1 inline-flex min-h-10 w-full items-center justify-center rounded-[10px] border border-verde-health px-4 text-sm font-medium text-verde-health transition-colors hover:bg-verde-health hover:text-off-white sm:min-h-0 sm:py-1.5 sm:text-xs lg:min-h-10 lg:text-sm"
        >
          Ver produto
        </Link>
      </div>
    </div>
  )
}

export default BannerProduto
