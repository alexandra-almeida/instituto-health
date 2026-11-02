// Gera public/sitemap.xml a partir dos dados REAIS do site, para o sitemap nunca
// ficar desatualizado: roda sozinho antes do `npm run build` (script
// "prebuild") e também à mão, com `npm run sitemap`.
//
// Carrega src/data/procedimentos.ts e src/data/tulipiaProducts.ts pelo próprio
// Vite (ssrLoadModule), porque esses arquivos importam imagens e o JSON do
// catálogo, e o Node puro não sabe ler isso. Assim os slugs vêm do mesmo código
// que monta as rotas (slugify dos procedimentos e sku dos produtos), e o
// sitemap nunca aponta para um endereço que a rota não abre.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destino = resolve(raiz, 'public', 'sitemap.xml')

const servidor = await createServer({
  root: raiz,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

try {
  const { PROCEDIMENTOS } = await servidor.ssrLoadModule(
    '/src/data/procedimentos.ts',
  )
  const { ALL_PRODUCTS } = await servidor.ssrLoadModule(
    '/src/data/tulipiaProducts.ts',
  )
  const { caminhosPublicos, montarSitemap } = await servidor.ssrLoadModule(
    '/src/lib/sitemap.ts',
  )

  const caminhos = caminhosPublicos({
    procedimentos: PROCEDIMENTOS,
    produtos: ALL_PRODUCTS,
  })
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, montarSitemap(caminhos), 'utf8')
  console.log(
    `sitemap.xml gerado: ${caminhos.length} páginas (${PROCEDIMENTOS.length} procedimentos e ${ALL_PRODUCTS.length} produtos).`,
  )
} finally {
  await servidor.close()
}
