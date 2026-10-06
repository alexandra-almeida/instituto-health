# Instituto Health

Site institucional e e-commerce do Instituto Health (fisioterapia e estética, Juliana Gonella).
Desenvolvido por Alexandra Almeida (freelancer). Produção: https://instituto-health.vercel.app

## Stack

- React 19 + TypeScript, Vite 8, Tailwind CSS v4, React Router 7, Motion, lucide-react
- Deploy na Vercel a cada push na `main` (`vercel.json` reescreve todas as rotas para `index.html`)
- Backend (Fase 2, ainda não implementado): Node + Express + TypeScript em `backend/`, em camadas (routes, controller, service, repository), publicado como segundo projeto na Vercel. Supabase (Postgres, Storage, Auth) acessado só pelo backend. Pagamento via PagBank.
- ANTES de qualquer tarefa de backend, leia `docs/plano-backend.md` inteiro. Ele é a fonte da verdade; não dependa da memória da conversa.

## Comandos

- `npm run dev` — desenvolvimento (localhost:5173)
- `npm run build` — checagem de tipos + build (rode antes de commitar)
- `npm run lint` / `npm run format`

## Padrões

- Prettier: sem ponto e vírgula, aspas simples, vírgula final, 80 colunas
- Comentários em português, explicando o porquê das decisões
- Mensagens de commit em português, no imperativo ("Adiciona...", "Corrige...")
- Mobile-first; testar de 320px a 1920px
- Paleta: verde `#04452E`, dourado `#CAA02D`, off-white `#F8F5EE` (demais cores no README). Fonte Flatline nos catálogos.
- Não usar travessões nos textos visíveis do site

## Estrutura

- `src/pages/` — uma página por rota (rotas em `src/App.tsx`)
- `src/components/` — componentes; `tulipia/` é específico do catálogo
- `src/context/` — carrinho (salvo em localStorage) e navegação
- `src/data/tulipia-produtos.json` — catálogo Tulípia (147 produtos), tipado em `tulipiaProducts.ts`
- `src/data/procedimentos.ts` — 28 procedimentos (texto clínico da Juliana; não reescrever)
- `src/data/contact.ts` — WhatsApp e Instagram oficiais

## O que é simulado (sem backend)

Os pontos de integração estão marcados com `TODO(backend)`:

- `src/pages/Cadastro.tsx` — criar conta, reenviar código, confirmar e-mail, upload de comprovante profissional
- `src/pages/Checkout.tsx` — confirmar pedido; pagamento (Pix, crédito, débito) e frete são só interface. O CEP já usa o ViaCEP de verdade. "Até 3x sem juros" é valor de exemplo.
- `src/pages/Login.tsx` — formulário completo (e-mail, senha, "esqueci minha senha"), mas sem autenticação real; nunca simula login bem-sucedido nem redireciona

## Regras de negócio

- Preço profissional NUNCA vai no código do frontend. Quando houver backend, vem do servidor só para profissionais confirmados.
- Produtos com `exclusivoProfissional` ficam com preço oculto e compra desabilitada no modo Home Care.
- Dados de cartão nunca passam pelo nosso servidor (tokenização no gateway).

## Pendências (aguardando a Juliana)

- Transportadora (Manda Bem ou Melhor Envio). O gateway já foi decidido: PagBank.
- Transferência do projeto para a conta Vercel dela e domínio próprio (ao trocar, atualizar `canonical`, `og:url` e também `og:image`/`twitter:image` no `index.html`)
- Conteúdo: "Jato de Plasma" incompleto (`completo: false`), fotos, valor e duração dos procedimentos, detalhamento dos cursos

## Fases

1. Frontend completo — concluída
2. Backend: pagamento, envio e cadastro real
3. Admin: estoque, pedidos, nota fiscal
4. Agendamentos, financeiro e cursos no admin
