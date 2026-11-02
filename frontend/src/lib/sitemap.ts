// Monta o sitemap.xml do site (sem React, para poder ser testado). O script
// scripts/gerar-sitemap.mjs usa estas funções com os dados reais no `build`.

export const SITE_URL = 'https://healthinstituto.com.br'

interface DadosDoSitemap {
  procedimentos: ReadonlyArray<{ slug: string }>
  /** `id` é o sku do produto, o mesmo valor da rota /tulipia/produto/:slug */
  produtos: ReadonlyArray<{ id: string }>
}

// Só páginas públicas. Carrinho, checkout, pedido confirmado, cadastro, login,
// Minha Conta e redefinir senha ficam de fora de propósito (páginas de conta e
// de compra não devem aparecer no Google).
export function caminhosPublicos({ procedimentos, produtos }: DadosDoSitemap) {
  return [
    '/',
    '/procedimentos',
    ...procedimentos.map((p) => `/procedimentos/${encodeURIComponent(p.slug)}`),
    '/tulipia',
    ...produtos.map((p) => `/tulipia/produto/${encodeURIComponent(p.id)}`),
    '/produtos-hospitalares',
    '/teleconsulta',
    '/cursos',
    '/sobre',
    '/politica-de-privacidade',
  ]
}

function escaparXml(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function montarSitemap(caminhos: readonly string[], base = SITE_URL) {
  const urls = caminhos
    .map(
      (caminho) =>
        `  <url>\n    <loc>${escaparXml(base + caminho)}</loc>\n  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
