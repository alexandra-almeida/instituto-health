import { LayoutGroup, MotionConfig } from 'motion/react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import Footer from './components/Footer'
import FooterSimple from './components/FooterSimple'
import Header from './components/Header'
import ScrollReveal from './components/ScrollReveal'
import { CartProvider } from './context/CartContext'
import { NavProvider } from './context/NavContext'
import Cadastro from './pages/Cadastro'
import Carrinho from './pages/Carrinho'
import Cursos from './pages/Cursos'
import Home from './pages/Home'
import Procedimentos from './pages/Procedimentos'
import ProcedimentoDetalhe from './pages/ProcedimentoDetalhe'
import ProdutosHospitalares from './pages/ProdutosHospitalares'
import Sobre from './pages/Sobre'
import Teleconsulta from './pages/Teleconsulta'
import Tulipia from './pages/Tulipia'
import TulipiaProduto from './pages/TulipiaProduto'

// A rota é a mesma (/tulipia/produto/:slug) ao navegar de um produto pra
// outro (ex: clicando num "produto relacionado"), então o React Router
// reaproveita a MESMA instância de TulipiaProduto em vez de remontar —
// o `key={slug}` aqui força o remount, resetando galeria/variação/favorito
// sozinho a cada troca de produto, sem precisar de efeito nem ref.
function TulipiaProdutoRoute() {
  const { slug } = useParams<{ slug: string }>()
  return <TulipiaProduto key={slug} />
}

// Mesmo padrão do TulipiaProdutoRoute acima: força remount ao trocar de
// slug (ex: navegando de /procedimentos/botox pra /procedimentos/drenagem),
// já que a rota em si não muda.
function ProcedimentoDetalheRoute() {
  const { slug } = useParams<{ slug: string }>()
  return <ProcedimentoDetalhe key={slug} />
}

function App() {
  // Footer completo (contato/horário/pagamento) só na home — nas demais
  // páginas usa o rodapé enxuto (marca + redes sociais + copyright).
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    // reducedMotion="never": por padrão o Motion respeita a preferência do
    // sistema operacional "reduzir movimento" (prefers-reduced-motion) e,
    // quando ativada, encolhe TODAS as animações para quase instantâneas —
    // era isso que fazia a intro da home parecer "pular" direto pro final.
    // Forçando "never" as animações sempre rodam por completo, com a
    // duração real definida no código.
    <MotionConfig reducedMotion="never">
      <NavProvider>
        <CartProvider>
          <LayoutGroup>
            <div className="min-h-screen w-full overflow-x-clip overflow-y-clip bg-offwhite">
              <Header />
              <main className="mx-auto w-full max-w-375 px-4 md:px-6">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/tulipia" element={<Tulipia />} />
                  <Route
                    path="/tulipia/produto/:slug"
                    element={<TulipiaProdutoRoute />}
                  />
                  <Route
                    path="/produtos-hospitalares"
                    element={<ProdutosHospitalares />}
                  />
                  <Route path="/procedimentos" element={<Procedimentos />} />
                  <Route
                    path="/procedimentos/:slug"
                    element={<ProcedimentoDetalheRoute />}
                  />
                  <Route path="/teleconsulta" element={<Teleconsulta />} />
                  <Route path="/cursos" element={<Cursos />} />
                  <Route path="/sobre" element={<Sobre />} />
                  <Route path="/carrinho" element={<Carrinho />} />
                  <Route path="/cadastro" element={<Cadastro />} />

                  {/* Rotas antigas, redirecionadas pras equivalentes novas —
                      pra não quebrar links que já existam por aí (favoritos,
                      anúncios, etc.). /servicos virou 3 páginas separadas
                      (Procedimentos/Teleconsulta/Cursos); redireciona pra
                      Procedimentos, a mais próxima do que "Serviços" era. */}
                  <Route
                    path="/servicos"
                    element={<Navigate to="/procedimentos" replace />}
                  />
                  <Route
                    path="/juliana-gonella"
                    element={<Navigate to="/sobre" replace />}
                  />
                </Routes>
              </main>
              <ScrollReveal>{isHome ? <Footer /> : <FooterSimple />}</ScrollReveal>
            </div>
          </LayoutGroup>
        </CartProvider>
      </NavProvider>
    </MotionConfig>
  )
}

export default App
