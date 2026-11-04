# Instituto Health

Site institucional e e-commerce do Instituto Health (fisioterapia e estética, Juliana Gonella).
Desenvolvido por Alexandra Almeida (freelancer). Produção: https://healthinstituto.com.br

## Stack

- React 19 + TypeScript, Vite 8, Tailwind CSS v4, React Router 7, Motion, lucide-react
- Deploy na Vercel a cada push na `main`, com Root Directory `frontend` (`frontend/vercel.json` reescreve todas as rotas para `index.html`)
- Backend (Fase 2, em andamento: auth e despertador do banco prontos; pedidos e pagamento ainda não, ver "Progresso" no plano): Node + Express + TypeScript em `backend/`, em camadas (routes, controller, service, repository), publicado como segundo projeto na Vercel. Supabase (Postgres, Storage, Auth) acessado só pelo backend. Pagamento via Rede (e.Rede, Itaú), com crédito, débito e Pix (trocado do PagBank em 26/10/2026; ver "Progresso" no plano).
- ANTES de qualquer tarefa de backend, leia `docs/plano-backend.md` inteiro. Ele é a fonte da verdade; não dependa da memória da conversa.

## Domínio

- Domínio próprio ativo desde 31/10/2026: https://healthinstituto.com.br (o `www` redireciona para ele com 308, e `instituto-health.vercel.app` continua funcionando)
- DNS no Registro.br: registro A `@` apontando para a Vercel e CNAME `www`
- `ORIGEM_FRONTEND` (backend, na Vercel) tem os 3 endereços do site; o Site URL do Supabase é https://healthinstituto.com.br
- `canonical`, `og:url`, `og:image` e `twitter:image` do `frontend/index.html` já usam o domínio novo; `public/robots.txt` libera o site, bloqueia as páginas de conta e de compra e `/api/`, e aponta para o sitemap, e o `sitemap.xml` (páginas públicas, procedimentos e produtos Tulípia, sem conta nem compra) é gerado no build por `frontend/scripts/gerar-sitemap.mjs` com os mesmos slugs das rotas

## Estrutura do repositório

- `frontend/` — site (React/Vite); todos os comandos abaixo rodam dentro dele
- `backend/` — API Express, com `package.json` próprio
- `database/` — `migrations/` (SQL numerado, colado manualmente no SQL Editor do Supabase) e `seeds/` (scripts de carga de dados)
- `docs/` — planejamento

## Comandos (em `frontend/`)

- `npm run dev` — desenvolvimento (localhost:5173)
- `npm run build` — gera o `public/sitemap.xml` (script `prebuild`), checa os tipos e faz o build (rode antes de commitar)
- `npm run test` — testes (vitest) da lógica em `src/lib` (cliente da API, destino seguro do login, sitemap)
- `npm run sitemap` — gera só o `public/sitemap.xml` (ele não vai para o git)
- `npm run descartaveis` — regenera `src/data/descartaveis.json` a partir de `docs/descartaveis-lista-juliana.csv` (mantém os sku existentes, novos entram no fim)
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
- `frontend/src/context/` — carrinho (salvo em localStorage), navegação e sessão (`AuthContext`/`useAuth`, que pergunta `GET /api/auth/eu` ao backend; nada de sessão em localStorage)
- `frontend/src/lib/` — `api.ts` (único ponto de chamada HTTP ao backend, sempre caminhos `/api/...`), `destino.ts` (destino seguro depois do login, só caminhos internos), `codigo.ts` (código de 6 dígitos e intervalo de reenvio) `comprovante.ts` (tipos e tamanho aceitos no comprovante) e `conta.ts` (rótulos e datas de Minha Conta)
- `frontend/src/data/tulipia-produtos.json` — catálogo Tulípia (147 produtos), tipado em `tulipiaProducts.ts`
- `frontend/src/data/descartaveis.json` — descartáveis para clínicas (rota `/produtos-hospitalares`): 41 produtos e 52 variações, separados do catálogo Tulípia, tipados em `descartaveis.ts`; "A CONFIRMAR" nunca entra
- `frontend/src/data/procedimentos.ts` — 28 procedimentos (texto clínico da Juliana; não reescrever)
- `frontend/src/data/contact.ts` — WhatsApp e Instagram oficiais

## O que ainda é simulado

Cadastro, confirmação de e-mail, reenvio de código, login, redefinição de senha, envio do comprovante profissional e a página Minha Conta (`/minha-conta`, com reenvio do comprovante e Sair) já chamam o backend de verdade, por `frontend/src/lib/api.ts` (o arquivo do comprovante vai direto para uma URL assinada do Storage, nunca pelo corpo de uma chamada ao backend, e fica só em memória no navegador). O teste ponta a ponta com e-mail real depende do SMTP (Resend + domínio, ver plano). Os pontos que ainda faltam estão marcados com `TODO(backend)`:

- `frontend/src/pages/Checkout.tsx` — confirmar pedido; pagamento (Pix, crédito, débito) e frete são só interface. O CEP já usa o ViaCEP de verdade. "Até 3x sem juros" é valor de exemplo.

## Regras de negócio

- Preço profissional NUNCA vai no código do frontend. Quando houver backend, vem do servidor só para profissionais confirmados.
- Produtos com `exclusivoProfissional` ficam com preço oculto e compra desabilitada no modo Home Care.
- Dados de cartão nunca passam pelo nosso servidor (tokenização no gateway).
- SKU: todo produto de `frontend/src/data/tulipia-produtos.json` tem um campo `sku` fixo e único, que é o `id` do produto (URL `/tulipia/produto/:slug`, chave do carrinho, favoritos salvos no navegador e, no futuro, o banco). Produto novo entra com sku próprio, adicionado no FINAL da lista, e o sku de um produto existente NUNCA é alterado, mesmo que o nome, o tamanho ou a posição mudem. Sku novo segue o padrão `nome-tamanho-N` em minúsculas e sem acentos, com N = número do próximo índice livre, e não pode repetir nenhum existente.
- Descartáveis para clínicas: cada VARIAÇÃO tem sku próprio `desc-nome-da-variação-N` (prefixo `desc-` para nunca colidir com a Tulípia), congelado como os demais: nunca muda e novos entram no FIM de `descartaveis.json` (o script `npm run descartaveis` já faz isso). Preço único, sem preço de profissional. Marca e embalagem "A CONFIRMAR" ficam nulas, nunca aparecem no site. No carrinho, `productId` é o sku da variação. Fotos: arquivo em `frontend/src/assets/descartaveis/` com o slug do produto no nome (`luva-de-vinil-sem-po-vabene-m.webp`: slug do produto, mais `-` e a variação para uma foto por tamanho; sem a variação, uma foto para o produto inteiro) e `npm run descartaveis` liga sozinho; tamanho sem foto (PP) mostra a do P; `_reservas/` guarda foto que ainda não deve aparecer; são as fotos oficiais dos fabricantes, usadas como revendedor autorizado. Produto renomeado no CSV precisa entrar em `RENOMEADOS` no importador, senão o sku muda.
- Regra de preço do profissional, decidida com a Juliana em 26/10/2026 e ainda NÃO implementada: profissional aprovado tem 30% de desconto sobre o TOTAL da compra (conta aprovada obrigatória); cliente comum compra sem cadastro e sem desconto. Há perguntas em aberto (frete, promoções, descartáveis, preço cheio dos 82 exclusivos) e a pergunta se essa regra substitui a tabela `precos_profissionais`: ver `docs/plano-backend.md`. Não construir o módulo `pedidos` antes da resposta.
- Catálogo no banco (passo 10): o JSON do site continua sendo a fonte do catálogo e do preço público; o servidor calcula os pedidos com a cópia na tabela `produtos`. Depois de adicionar produto ou mudar nome, tamanho, preço público ou `exclusivoProfissional` no JSON (da Tulípia ou dos descartáveis; o seed lê os dois), rode em `backend/`: `npm run seed:produtos` (simulação) e, com o resumo conferido, `npm run seed:produtos -- --aplicar`. Sem isso o servidor recusa o item. A carga nunca apaga produto nem mexe em `ativo`. O preço de profissional só existe no banco (nunca no JSON nem no código do site): entra por `npm run seed:precos-profissionais`, a partir de uma planilha em `database/seeds/dados/`, que fica fora do git e NUNCA é commitada.

## Pendências (aguardando a Juliana)

- Transportadora (Manda Bem ou Melhor Envio). O gateway já foi decidido: Rede (e.Rede, desde 26/10/2026; antes era o PagBank). Aguardando também a habilitação de vendas online e o token com o gerente da Rede.
- Conteúdo: "Jato de Plasma" incompleto (`completo: false`), fotos, valor e duração dos procedimentos, detalhamento dos cursos
- Descartáveis: confirmar marca e embalagem dos itens "A CONFIRMAR" (as 4 embalagens ainda sem confirmação, dos Lençóis Hospitalares e dos Sacos de Lixo de 30 e 50 L, são OBRIGATÓRIAS antes do lançamento; e a pergunta: a Luva Nitrílica Rosa é vendida em G?), fotos e revisão dos textos do bloco de atacado e licitações (lista completa no plano)

## Fases

1. Frontend completo — concluída
2. Backend: pagamento, envio e cadastro real
3. Admin: estoque, pedidos, nota fiscal
4. Agendamentos, financeiro e cursos no admin
