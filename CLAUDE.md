# Instituto Health

Site institucional e e-commerce do Instituto Health (fisioterapia e estética, Juliana Gonella).
Desenvolvido por Alexandra Almeida (freelancer). Produção: https://instituto-health.vercel.app

## Stack

- React 19 + TypeScript, Vite 8, Tailwind CSS v4, React Router 7, Motion, lucide-react
- Deploy na Vercel a cada push na `main`, com Root Directory `frontend` (`frontend/vercel.json` reescreve todas as rotas para `index.html`)
- Backend (Fase 2, ainda não implementado): Node + Express + TypeScript em `backend/`, em camadas (routes, controller, service, repository), publicado como segundo projeto na Vercel. Supabase (Postgres, Storage, Auth) acessado só pelo backend. Pagamento via PagBank.
- ANTES de qualquer tarefa de backend, leia `docs/plano-backend.md` inteiro. Ele é a fonte da verdade; não dependa da memória da conversa.

## Estrutura do repositório

- `frontend/` — site (React/Vite); todos os comandos abaixo rodam dentro dele
- `backend/` — API Express, com `package.json` próprio
- `database/` — `migrations/` (SQL numerado, colado manualmente no SQL Editor do Supabase) e `seeds/` (scripts de carga de dados)
- `docs/` — planejamento

## Comandos (em `frontend/`)

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

## Estrutura do frontend

- `frontend/src/pages/` — uma página por rota (rotas em `frontend/src/App.tsx`)
- `frontend/src/components/` — componentes; `tulipia/` é específico do catálogo
- `frontend/src/context/` — carrinho (salvo em localStorage) e navegação
- `frontend/src/data/tulipia-produtos.json` — catálogo Tulípia (147 produtos), tipado em `tulipiaProducts.ts`
- `frontend/src/data/procedimentos.ts` — 28 procedimentos (texto clínico da Juliana; não reescrever)
- `frontend/src/data/contact.ts` — WhatsApp e Instagram oficiais

## O que é simulado (sem backend)

Os pontos de integração estão marcados com `TODO(backend)`:

- `frontend/src/pages/Cadastro.tsx` — criar conta, reenviar código, confirmar e-mail, upload de comprovante profissional
- `frontend/src/pages/Checkout.tsx` — confirmar pedido; pagamento (Pix, crédito, débito) e frete são só interface. O CEP já usa o ViaCEP de verdade. "Até 3x sem juros" é valor de exemplo.
- `frontend/src/pages/Login.tsx` — formulário completo (e-mail, senha, "esqueci minha senha"), mas sem autenticação real; nunca simula login bem-sucedido nem redireciona

## Regras de negócio

- Preço profissional NUNCA vai no código do frontend. Quando houver backend, vem do servidor só para profissionais confirmados.
- Produtos com `exclusivoProfissional` ficam com preço oculto e compra desabilitada no modo Home Care.
- Dados de cartão nunca passam pelo nosso servidor (tokenização no gateway).
- SKU: todo produto de `frontend/src/data/tulipia-produtos.json` tem um campo `sku` fixo e único, que é o `id` do produto (URL `/tulipia/produto/:slug`, chave do carrinho, favoritos salvos no navegador e, no futuro, o banco). Produto novo entra com sku próprio, adicionado no FINAL da lista, e o sku de um produto existente NUNCA é alterado, mesmo que o nome, o tamanho ou a posição mudem. Sku novo segue o padrão `nome-tamanho-N` em minúsculas e sem acentos, com N = número do próximo índice livre, e não pode repetir nenhum existente.

## Pendências (aguardando a Juliana)

- Transportadora (Manda Bem ou Melhor Envio). O gateway já foi decidido: PagBank.
- Transferência do projeto para a conta Vercel dela e domínio próprio (ao trocar, atualizar `canonical`, `og:url` e também `og:image`/`twitter:image` no `frontend/index.html`)
- Conteúdo: "Jato de Plasma" incompleto (`completo: false`), fotos, valor e duração dos procedimentos, detalhamento dos cursos

## Fases

1. Frontend completo — concluída
2. Backend: pagamento, envio e cadastro real
3. Admin: estoque, pedidos, nota fiscal
4. Agendamentos, financeiro e cursos no admin
