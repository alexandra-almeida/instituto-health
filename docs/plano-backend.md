# Plano do backend — Instituto Health (Fase 2)

Este arquivo é a fonte da verdade do backend. Leia-o inteiro antes de qualquer
tarefa de backend e NÃO dependa da memória da conversa. Se algo aqui estiver
errado ou incompleto, pare e avise a Alexandra em vez de supor.

Estado em 06/10/2026: nada do backend foi implementado. O projeto do site já
foi transferido para o time da cliente na Vercel ("Health Instituto de Saúde
Integrada", plano Pro). O banco do Supabase foi criado em 06/10/2026 pelo
Marketplace da Vercel, dentro desse time: recurso `instituto-health-db`, plano
gratuito, região São Paulo (gru1). Ele está VAZIO (sem tabelas, políticas ou
buckets) e ainda não está conectado a nenhum projeto da Vercel. Não use nem
cite nenhum projeto Supabase anterior. Atualize a seção "Progresso"
no fim deste arquivo a cada passo concluído.

## 1. Decisões fechadas

- Escopo desta fase: cadastro/login e pagamento. Frete real fica para depois
  (transportadora ainda não escolhida pela cliente).
- Backend separado do frontend, em camadas (routes, controller, service,
  repository). O frontend NUNCA fala direto com o Supabase nem com o PagBank.
- Linguagem e framework: Node + Express + TypeScript, na pasta `backend/`
  deste mesmo repositório, com `package.json` próprio.
- Hospedagem: Vercel, como um SEGUNDO projeto apontando para `backend/`
  (Root Directory). Sem servidor dedicado.
  Projeto do backend: `healthinstituto-api`
  (https://healthinstituto-api.vercel.app), no time "Health Instituto de Saúde
  Integrada", Root Directory `backend`. O projeto do site é o `instituto-health`
  (Root Directory `frontend`).
- Banco, arquivos e e-mail de confirmação: Supabase, criado pelo Marketplace
  da Vercel no time da cliente (cobrança na fatura da Vercel dela), plano
  gratuito para começar, região São Paulo. Acessado só pelo backend.
- Gateway de pagamento: PagBank.
- Fluxo do cadastro profissional mantém a ordem das telas atuais
  (commit a70448b): Perfil > Dados > Comprovante > Confirmação de e-mail > Sucesso.
- Migrações SQL: versionadas em `database/migrations/`. A Alexandra cola cada
  uma manualmente no SQL Editor. Não configurar a CLI do Supabase.
- SMTP próprio (Resend) só depois que o domínio existir. Até lá, e-mail
  embutido do Supabase, que tem limite baixo por hora (só para testes).

## 2. Arquitetura

```
backend/
  src/
    modules/
      auth/
        auth.routes.ts
        auth.controller.ts
        auth.service.ts
        auth.schemas.ts
      perfis/            (mesma estrutura)
      comprovantes/      (mesma estrutura)
      produtos/          (mesma estrutura)
      pedidos/           (mesma estrutura)
      pagamentos/
        pagamentos.routes.ts
        pagamentos.controller.ts
        pagamentos.service.ts
        pagamentos.schemas.ts
        pagamentos.webhook.ts
        pagbank.client.ts
    repositories/        um arquivo por tabela (perfis.repository.ts, ...)
    middlewares/         autenticar, exigirAdmin, validar, tratarErros
    lib/                 supabase.ts (clientes), erros.ts, cookies.ts
    config/              env.ts (lê e valida as variáveis de ambiente)
    app.ts               monta o Express (sem listen), exportado para a Vercel
    server.ts            listen local, só para desenvolvimento
  tests/
```

Responsabilidade de cada camada (não misturar):

- routes: só declara caminho, middlewares e qual controller atende.
- controller: lê a requisição já validada, chama UM service, monta a resposta
  HTTP. Sem regra de negócio e sem acesso a banco.
- service: regras de negócio. Não conhece `req`/`res`. Chama repositories e
  clients.
- repository: única camada que acessa o Postgres/Storage do Supabase.
- client (`pagbank.client.ts`): única parte que faz chamadas HTTP ao PagBank.
- schemas: validação de entrada com zod. Todo endpoint valida o corpo.

Padrões:

- Erros de negócio são classes próprias (`ErroDeNegocio` com código e status).
  O middleware `tratarErros` converte para JSON `{ erro: { codigo, mensagem } }`,
  com mensagem em português pronta para exibir. Erros inesperados viram 500
  com mensagem genérica; o detalhe vai só para o log.
- Logs nunca contêm senha, token, dados de cartão nem conteúdo de comprovante.
- Mesmos padrões de código do CLAUDE.md (Prettier, comentários e commits em
  português).
- Testes com vitest para os services (regras de negócio), com repositories e
  clients simulados.

## 3. Como frontend e backend se conectam

- O frontend chama sempre caminhos relativos `/api/...`.
- Produção: o `vercel.json` do FRONTEND ganha um rewrite de `/api/(.*)` para a
  URL do projeto do backend, ANTES do rewrite geral da SPA. Assim navegador e
  API ficam na mesma origem: sem CORS e com cookies de primeira parte.
- Desenvolvimento: proxy do Vite de `/api` para `http://localhost:3333`.
- Sessão: o backend guarda os tokens da sessão em cookies `httpOnly`, `Secure`,
  `SameSite=Lax`. O JavaScript do site nunca vê os tokens e nada de sessão vai
  para o localStorage.
- Proteção contra CSRF: aceitar só `Content-Type: application/json` nas rotas
  que alteram dados e conferir o cabeçalho `Origin`.
- O frontend ganha `frontend/src/lib/api.ts` (um único ponto de chamada HTTP) e um
  `AuthContext`/`useAuth` no mesmo padrão do `CartContext`/`useCart`.

VERIFICAR NO PASSO 1, na documentação oficial da Vercel, antes de escrever
código: (a) a forma atual recomendada de publicar um app Express; (b) o limite
de tamanho do corpo das requisições e de duração das Functions no plano em uso.
Se algo contrariar este plano, pare e avise.

## 4. Banco de dados

Segurança: RLS LIGADO em todas as tabelas e SEM nenhuma política para `anon`
e `authenticated`, ou seja, acesso direto negado para todos. Só o backend
acessa, com a chave service role, que fica apenas nas variáveis de ambiente
do projeto do backend. O bucket de arquivos é privado.

Tabelas (nomes fixos, não renomear):

- `perfis`: `id uuid` (PK, FK `auth.users(id)` on delete cascade), `nome text`,
  `tipo text` ('profissional' | 'homecare'), `status text` ('pendente' |
  'aprovado' | 'recusado'), `is_admin boolean default false`, `created_at`,
  `updated_at`.
- `comprovantes_profissionais`: `id uuid`, `perfil_id uuid` (FK perfis, cascade),
  `storage_path text`, `enviado_em timestamptz`.
- `produtos`: `sku text` (PK), `nome`, `tamanho`, `preco numeric(10,2)` (preço
  público, pode ser nulo), `exclusivo_profissional boolean`, `ativo boolean`.
  Semeada a partir de `frontend/src/data/tulipia-produtos.json`.
- `precos_profissionais`: `sku text` (PK, FK produtos), `preco numeric(10,2)`.
- `enderecos`: `id`, `perfil_id`, `cep`, `rua`, `numero`, `complemento`,
  `bairro`, `cidade`, `estado`, `nome_destinatario`, `telefone`, `created_at`
  (mesmos campos do formulário do Checkout.tsx).
- `pedidos`: `id`, `perfil_id`, endereço COPIADO no pedido (não só FK, para o
  histórico não mudar se o endereço for editado), `status`, `forma_pagamento`,
  `subtotal`, `frete`, `total`, `created_at`, `updated_at`.
- `itens_pedido`: `id`, `pedido_id` (cascade), `sku`, `nome`, `variacao`,
  `quantidade` (> 0), `preco_unitario`.
- `pagamentos`: `id`, `pedido_id`, `pagbank_order_id`, `pagbank_charge_id`,
  `status`, `valor`, `forma`, `created_at`, `updated_at`.
- `eventos_webhook`: `id`, identificador do evento do PagBank (único),
  `recebido_em`, `processado_em`. Serve para não processar o mesmo aviso
  duas vezes.

Bucket: `comprovantes-profissionais`, privado, tipos `image/jpeg`, `image/png`,
`image/heic`, `application/pdf`, limite de 10 MB. (A API só gera URL de envio
para jpeg, png e pdf; ver "Pendências" sobre o `image/heic` que sobrou aqui.)

Regras de negócio que os services garantem:

- `homecare` nasce com `status = 'aprovado'`; `profissional` nasce `pendente`.
- `status`, `tipo` e `is_admin` NUNCA vêm do corpo da requisição do usuário.
  Só um admin altera `status`. Enquanto não existe painel (Fase 3), a
  aprovação é manual, pelo Table Editor do Supabase.
- Preço profissional só é devolvido para `tipo = 'profissional'` e
  `status = 'aprovado'`.
- O usuário não altera nem apaga um comprovante enviado. Reenvio cria um
  arquivo novo.

SKU dos produtos: congelar os `id` atuais de `tulipiaProducts.ts` (que incluem
o índice do array) gravando cada um como campo `sku` no JSON. Antes de commitar,
conferir por script que os 147 `sku` são idênticos aos `id` calculados hoje e
todos únicos, e que a URL `/tulipia/produto/:slug` e a chave do carrinho usam
esse mesmo valor. Depois disso `tulipiaProducts.ts` lê `p.sku`.

## 5. Autenticação

O backend usa o Supabase Auth por baixo. Endpoints:

- `POST /api/auth/cadastro` { perfil, nome, email, senha }: cria o usuário
  (dispara o código de 6 dígitos por e-mail) e a linha em `perfis`. Se a
  criação do perfil falhar, desfaz a criação do usuário.
- `POST /api/auth/confirmar-email` { email, codigo }: valida o código e abre a
  sessão (grava os cookies).
- `POST /api/auth/reenviar-codigo` { email }.
- `POST /api/auth/login` { email, senha }: abre a sessão.
- `POST /api/auth/logout`.
- `GET /api/auth/eu`: devolve usuário e perfil da sessão atual (ou 401).
- `POST /api/auth/esqueci-senha` { email }: envia código de recuperação.
  Responde sempre com sucesso, exista ou não a conta.
- `POST /api/auth/redefinir-senha` { email, codigo, novaSenha }.

Detalhes obrigatórios:

- Recuperação de senha também por código de 6 dígitos (não por link), para
  reaproveitar a tela de código e não depender de URLs de redirecionamento.
- E-mail já cadastrado: verificar o comportamento REAL do Supabase (com
  confirmação de e-mail ativa ele pode não retornar erro) e tratar o caso sem
  revelar mais do que o necessário.
- O Supabase só libera novo código a cada 60 s: subir `RESEND_COOLDOWN_SECONDS`
  do Cadastro.tsx de 30 para 60.
- Middleware `autenticar`: valida o token do cookie, renova a sessão quando
  expirar e coloca usuário e perfil na requisição. `exigirAdmin` confere
  `is_admin` no banco.
- Senha mínima de 8 caracteres, validada no backend também.

## 6. Comprovante profissional

- Na tela do comprovante, o arquivo fica só em memória (estado React).
- Depois que `confirmar-email` der certo (já com sessão), o frontend envia o
  arquivo automaticamente.
- O arquivo NÃO passa pelo corpo de uma requisição ao backend (o limite de
  tamanho das Functions da Vercel é menor que 10 MB; confirmar o valor no
  passo 1). Fluxo:
  1. `POST /api/comprovantes/url-de-envio` { tipo, tamanho }: o backend valida
     tipo e tamanho e devolve uma URL assinada de upload do Storage, com o
     caminho `{perfil_id}/{uuid}.{extensão}` (sem o nome original).
  2. O navegador envia o arquivo direto para essa URL.
  3. `POST /api/comprovantes/confirmar` { caminho }: o backend confere que o
     arquivo existe e pertence ao usuário e grava em
     `comprovantes_profissionais`.
- Se o envio falhar ou o arquivo se perder (página recarregada), a conta segue
  criada e a página Minha Conta oferece reenviar.

## 7. Pedidos e pagamento (PagBank)

ANTES de escrever código desta etapa, leia a documentação oficial atual do
PagBank (API de pedidos/cobranças, Pix, cartão, webhooks, ambiente sandbox) e
apresente à Alexandra um resumo do que será usado. Não implemente a partir de
memória.

Princípios que não mudam:

- O total é SEMPRE calculado no servidor, a partir dos `sku` e quantidades,
  com os preços da tabela `produtos` (ou `precos_profissionais` para
  profissional aprovado). Preço vindo do navegador é ignorado.
- Itens `exclusivo_profissional` só entram no pedido de profissional aprovado.
- Dados de cartão nunca chegam ao nosso backend em texto puro: o navegador
  criptografa/tokeniza com a biblioteca oficial do PagBank e o backend recebe
  só o resultado.
- A chave do PagBank é secreta e fica só no backend.
- Um pedido só vira "pago" a partir da confirmação do PagBank (webhook), nunca
  por uma chamada do navegador. Ao receber o aviso, o backend consulta o
  pedido na API do PagBank para confirmar o status antes de alterar o banco.
- Webhook idempotente (tabela `eventos_webhook`) e com a verificação de
  autenticidade que a documentação do PagBank indicar.
- Desenvolver e testar tudo no sandbox. Produção só com a conta PagBank da
  Juliana (CNPJ da clínica).
- Parcelamento, juros e débito seguem o que o PagBank oferecer de fato;
  o "até 3x sem juros" atual é só exemplo.
- Frete: enquanto não houver transportadora, manter a regra de frete estimado
  que o Checkout.tsx usa hoje, movida para o service de pedidos.

Endpoints previstos (ajustar após ler a documentação):

- `POST /api/pedidos` { itens, endereco, formaPagamento, dadosDoPagamento }
- `GET /api/pedidos/:id` (dono do pedido ou admin)
- `GET /api/pedidos` (lista do usuário logado)
- `POST /api/pagamentos/webhook` (chamado pelo PagBank)
- `GET /api/produtos/precos-profissionais` (só profissional aprovado)

## 8. Frontend

- Trocar os `TODO(backend)` de `frontend/src/pages/Cadastro.tsx` (4), `Login.tsx` (2) e
  `Checkout.tsx` (1) por chamadas a `frontend/src/lib/api.ts`.
- `AuthProvider` em `App.tsx`, ao lado de `CartProvider` e `NavProvider`.
- Header: deslogado continua levando a `/cadastro`; logado leva a
  `/minha-conta`.
- Nova página `/minha-conta`: e-mail, nome, tipo e status (ex.: "Profissional,
  em análise"), reenvio de comprovante quando faltar, botão Sair.
- Nova página `/redefinir-senha`: e-mail, código e nova senha.
- `PedidoConfirmado.tsx` passa a mostrar o pedido real (Pix: QR Code e
  copia-e-cola; cartão: status).
- Erros da API aparecem no mesmo padrão visual que o Cadastro já usa.

## 9. Variáveis de ambiente

Backend (projeto do backend na Vercel e `backend/.env` local, nunca no git):
as variáveis do Supabase, `PAGBANK_TOKEN`, `PAGBANK_AMBIENTE` (sandbox | producao), `ORIGEM_FRONTEND`,
`COOKIE_SECRET` (se necessário).

Variáveis do Supabase: a integração do Marketplace cria e sincroniza as
variáveis no projeto da Vercel a que o banco for conectado (ex.: `SUPABASE_URL`,
`SUPABASE_SECRET_KEY`, chave publicável, `POSTGRES_URL`). Use os NOMES REAIS
que a integração criar; confira-os no painel antes de escrever `config/env.ts`.
O banco deve ser conectado SOMENTE ao projeto do backend, nunca ao do frontend.
A chave secreta (secret/service role) nunca vai para chat, git ou frontend.

Decidido (16/10/2026): o backend usa `SUPABASE_URL` e `SUPABASE_SECRET_KEY`
(a integração também criou `SUPABASE_SERVICE_ROLE_KEY`, as chaves `anon` e
publicável, `SUPABASE_JWT_SECRET`, as `POSTGRES_*` e cópias com prefixo
`NEXT_PUBLIC_`; o backend não usa essas). O `config/env.ts` lê e valida só
essas duas.

Toda tabela nova, em qualquer migração futura, além de `enable row level
security` e nenhuma política, precisa de `revoke all on table ... from anon,
authenticated`: o Supabase concede privilégios a esses papéis nas tabelas novas
do schema `public`, então a negação não deve depender só do RLS. Incluir
também as tabelas da `0002` e conferir na consulta de `database/conferencias/`.

Frontend: nenhuma chave. Só o rewrite de `/api` (e o proxy do Vite em dev).

`CRON_SECRET` (passo 5b): segredo do despertador diário, só no projeto do
backend na Vercel (Production). Criado pela Alexandra no painel. Opcional:
sem ele a API sobe normal e só a rota do cron responde 401.

`ORIGEM_FRONTEND` (passo 6): origens do site autorizadas a chamar a API,
separadas por vírgula (hoje `https://instituto-health.vercel.app`; depois
entra o domínio próprio). Só no projeto do backend. Obrigatória em produção:
sem ela a API recusa todo POST de `/api/auth`.

Commitar `backend/.env.example` com os nomes e sem valores.

## 10. Ordem de implementação

Um passo por vez. Cada passo: conversa NOVA no Claude Code, ler CLAUDE.md e
este arquivo, implementar só o passo, rodar build, lint e testes, mostrar o
resultado, esperar aprovação, commitar, atualizar "Progresso". Todo SQL é
mostrado à Alexandra, que revisa e cola no SQL Editor; esperar a confirmação
dela antes de seguir.

Etapa A — Base
1. Verificações da seção 3; esqueleto do `backend/` (Express, TypeScript,
   config de env, tratamento de erros, `GET /api/saude`), rodando local.
2. Publicar o backend como segundo projeto na Vercel; rewrite de `/api` no
   frontend e proxy do Vite. Teste: `/api/saude` responde em produção pelo
   domínio do site. O projeto do backend deve ter a região das Functions
   fixada em `gru1` (São Paulo), a mesma do banco (o padrão da Vercel é
   `iad1`, nos EUA). Conferir no painel depois do primeiro deploy.
3. Migração `0001`: `perfis` e `comprovantes_profissionais`, com RLS ligado
   sem políticas, e o bucket privado.

Etapa B — Cadastro e login
4. SKU estável no JSON (seção 4), só frontend.
5. Módulo `auth` (cadastro, confirmar e-mail, reenviar código) com testes.
5b. Passo extra, LOGO APÓS o commit do passo 5, em commit separado dos
   arquivos do auth: "despertador" diário para o Supabase gratuito não pausar
   por inatividade. Decidido em 21/10/2026; implementado em 22/10/2026 (ver
   "Progresso"). Desenho aprovado:
   - `GET /api/cron/manter-ativo`, em módulo próprio `modules/cron/` (routes,
     controller, service), seguindo a arquitetura da seção 2.
   - Protegida: só aceita se o cabeçalho `Authorization` for
     `Bearer <CRON_SECRET>` (é como o Cron da Vercel chama). Sem o cabeçalho
     certo, 401. Comparar o segredo em tempo constante.
   - Faz uma leitura leve no Supabase (ex.: `select id` em `perfis` com
     `limit 1`, ou `head` com contagem) e responde `{ ok: true }`. Não grava
     nada.
   - `backend/vercel.json` com `crons`, uma vez por dia (ex.: `0 9 * * *`).
   - `CRON_SECRET`: variável nova no projeto `healthinstituto-api`
     (Production). A Alexandra cria o valor no painel da Vercel; no repositório
     só entra o nome em `backend/.env.example`, sem valor. O valor nunca vai
     para chat, git nem log. É OPCIONAL, até em produção: se faltar, a API
     sobe normal e só a rota do cron responde 401 (com um aviso no log, sem
     valor). Se definida, no mínimo 16 caracteres.
   - Teste com vitest: 401 sem cabeçalho e com cabeçalho errado, 200 com o
     certo (Supabase simulado).
   - Remover ou manter o despertador quando o Supabase passar para o plano Pro
     (ver seção 12), antes do lançamento.
6. Módulo `auth` (login, logout, eu, esqueci e redefinir senha) com testes.
7. Frontend: `api.ts`, `AuthContext`, ligar Cadastro e Login, página
   `/redefinir-senha`.
8. Módulo `comprovantes` e envio automático após a confirmação de e-mail.
9. Header reativo e página `/minha-conta`.

Etapa C — Pedidos e pagamento
10. Migração `0002`: `produtos`, `precos_profissionais`, `enderecos`,
    `pedidos`, `itens_pedido`, `pagamentos`, `eventos_webhook`; script de
    carga dos produtos a partir do JSON.
11. Leitura da documentação do PagBank e resumo para aprovação (sem código).
12. Módulo `pedidos`: criação com total calculado no servidor, com testes.
13. `pagbank.client.ts` e pagamento por Pix no sandbox.
14. Webhook e atualização de status.
15. Cartão de crédito no sandbox (e débito, se o PagBank oferecer de forma
    viável).
16. Frontend: ligar Checkout e PedidoConfirmado.

## 11. Tarefas manuais da Alexandra

- Banco já criado (`instituto-health-db`). Falta conectá-lo ao projeto do
  backend na Vercel (Storage > instituto-health-db > Connect to Project),
  depois que esse projeto existir (passo 2). Nunca conectar ao projeto do site.
- Colar cada migração no SQL Editor do Supabase.
- Supabase, Authentication: modelos de e-mail de confirmação e de recuperação
  usando `{{ .Token }}` (código) em vez de link; conferir código de 6 dígitos;
  senha mínima de 8.
- Vercel: criar o projeto do backend (Root Directory `backend`) e cadastrar as
  variáveis de ambiente. A chave service role nunca vai para chat, git ou
  frontend.
- PagBank: criar conta de testes (sandbox) e gerar o token.

## 12. Pendências e decisões em aberto

- Comprar exige conta? (login obrigatório no checkout ou compra como
  visitante). Decidir antes do passo 12.
- Comprovantes de profissionais recusados: por quanto tempo guardar
  (decisão da Juliana; sugestão: apagar após 90 dias).
- Exclusão de conta e dos arquivos (LGPD): implementar antes de abrir o
  cadastro ao público.
- Limpeza periódica de arquivos órfãos no bucket `comprovantes-profissionais`:
  arquivos enviados à URL assinada mas nunca confirmados (sem linha em
  `comprovantes_profissionais`) e com mais de 24 h devem ser apagados, por
  exemplo por um job do Cron da Vercel. Até lá, o limite de 10 arquivos por
  pasta (passo 8) contém o estrago.
- Bucket `comprovantes-profissionais` ainda lista `image/heic` em
  `allowed_mime_types` (migração 0001, já aplicada e conferida). O backend e o
  site aceitam só JPEG, PNG e PDF desde 24/10/2026, então o bucket aceita um
  pouco mais do que o necessário (sem risco, a API nunca gera URL para HEIC).
  Na próxima migração (0002) restringir o bucket a jpeg, png e pdf e ajustar a
  linha 14 da conferência `database/conferencias/0001_perfis_comprovantes.sql`.
  Sem urgência. (A antiga pendência de visualizar HEIC no painel admin deixou
  de existir.)
- Transportadora (Manda Bem ou Melhor Envio): aguardando a Juliana.
- SMTP próprio (Resend): depende do domínio.
- Passagem do Supabase para o plano Pro (backups, sem pausa por inatividade)
  antes de receber pedidos reais. Ao migrar, decidir se o despertador do passo
  5b é removido (rota, `crons` e `CRON_SECRET`) ou mantido.
- Conta PagBank de produção da Juliana.
- Limite de tentativas (rate limit) nas rotas de autenticação (login,
  redefinir-senha, confirmar-email, cadastro, reenvio): OBRIGATÓRIO antes do
  lançamento. Definir a solução, já que memória local não funciona em
  Functions. Até lá só vale o limite próprio do Supabase.
- Teste ponta a ponta dos passos 5 a 9 (cadastro, código por e-mail, login,
  recuperação de senha, comprovante) com e-mail real: fica para DEPOIS do SMTP
  (Resend + domínio). O e-mail embutido do Supabase tem limite baixo e pode
  não entregar. Até lá, só testes com Supabase simulado.

## Progresso

- [x] Passo 1 (08/10/2026): verificações da seção 3 sem conflito com o plano
  (Express sem configuração, com `src/app.ts` como entrypoint; corpo máximo de
  4,5 MB; duração padrão de 300 s no Pro) e esqueleto do `backend/` com
  `GET /api/saude`.
- [x] Reorganização do repositório (14/10/2026): site movido para `frontend/`
  (Root Directory da Vercel = `frontend`), criada a pasta `database/` com
  `migrations/` e `seeds/`. Os caminhos `src/...` citados neste plano referem-se
  a `frontend/src/...`.
- [x] Passo 2 (15/10/2026): projeto `healthinstituto-api` criado na Vercel
  (Root Directory `backend`); `/api/saude` responde 200 em produção; rewrite de
  `/api/(.*)` para o backend em `frontend/vercel.json`, antes do rewrite da SPA,
  e proxy de `/api` para `http://localhost:3333` em `frontend/vite.config.ts`.
  Região das Functions confirmada em `gru1` (15/10/2026, após novo deploy do
  backend): o cabeçalho `X-Vercel-Id` de `/api/saude` mostra `gru1::gru1::`.
  Pelo site, `/api/saude` responde 200 e `/api/xyz` responde 404 em JSON do
  backend.
- [x] Passo 3 (16/10/2026): migração `database/migrations/0001_perfis_comprovantes.sql`
  (`perfis`, `comprovantes_profissionais`, trigger de `updated_at`, RLS ligado
  sem políticas, `revoke all` para `anon` e `authenticated`, bucket privado
  `comprovantes-profissionais` de 10 MB) colada no SQL Editor; a conferência
  `database/conferencias/0001_perfis_comprovantes.sql` deu as 14 linhas com
  `ok = true`. Acréscimos aprovados: `status` com default `pendente`, `revoke
  all` e `nome` não vazio.
- [x] Passo 4 (16/10/2026): campo `sku` gravado em cada produto de
  `frontend/src/data/tulipia-produtos.json` e `tulipiaProducts.ts` passou a usar
  `p.sku` como id (a função `slugify` foi removida). Conferido por script: 148
  produtos (não 147: o Hidrasol Fluid entrou depois do plano), 148 sku únicos,
  todos idênticos aos ids calculados antes, na mesma ordem. URL, carrinho e
  favoritos continuam usando `product.id`, portanto o mesmo valor. A regra de
  sku fixo para produtos novos está no `CLAUDE.md`.
- [x] Passo 5 (commit 5fb5cea): módulo `auth` com cadastro, confirmar e-mail e
  reenviar código, 37 testes com o Supabase simulado. O e-mail com o código sai
  pelo `auth.resend({ type: 'signup' })` depois de `admin.createUser` com a
  conta não confirmada. Teste real com e-mail pendente (ver seção 12).
- [x] Passo 6 (22/10/2026): login, logout, `GET /api/auth/eu`, esqueci a senha e
  redefinir senha (código de 6 dígitos, `verifyOtp` tipo `recovery`), com os
  middlewares `autenticar` (renova a sessão pelo cookie de renovação) e
  `exigirAdmin` (confere `is_admin` no banco) e o `protegerOrigem` (CSRF) em
  todo POST de `/api/auth`. `ORIGEM_FRONTEND` aceita uma lista separada por
  vírgula; em produção, sem Origin, Origin fora da lista ou variável vazia, a
  API recusa com 403 (falha fechado). Redefinir senha encerra todas as sessões
  do usuário (`admin.signOut` global) e não abre sessão nova. 101 testes com o
  Supabase simulado. Pendente: o modelo de e-mail "Reset password" no Supabase
  precisa usar `{{ .Token }}`, como o de confirmação; teste real depois do
  SMTP.
- [x] Passo 5b (22/10/2026): despertador diário do Supabase gratuito. Rota
  `GET /api/cron/manter-ativo` (módulo `cron`), protegida por
  `Authorization: Bearer <CRON_SECRET>` com comparação em tempo constante,
  faz só um `select id` em `perfis` com `limit 1` e responde `{ ok: true }`.
  `backend/vercel.json` (arquivo novo, não existia) com `crons` às 09:00 UTC
  (06:00 em Brasília). `CRON_SECRET` opcional: se faltar, só a rota do cron
  responde 401. 122 testes com o Supabase simulado. FALTA a Alexandra criar a
  variável `CRON_SECRET` no painel e fazer novo deploy. Remover ou manter o
  despertador quando o Supabase passar para o plano Pro (seção 12).
- [x] Reaplicação da migração 0001 (22/10/2026): o banco do projeto
  `hykxvlngsiwhjxknuytz` estava sem as tabelas; a `0001` foi colada de novo no
  SQL Editor e a conferência `database/conferencias/0001_perfis_comprovantes.sql`
  deu as 14 linhas com `ok = true`. Não está pendente.
- [x] Passo 7 (22/10/2026): frontend ligado ao auth. `frontend/src/lib/api.ts`
  (único ponto de chamada HTTP; erro da API vira `ApiError` com `codigo`,
  `mensagem` e `status`), `AuthContext`/`useAuth` (pergunta `GET /api/auth/eu` ao
  abrir o site; nada de sessão em localStorage), Cadastro e Login reais e a
  página `/redefinir-senha` (e-mail, depois código e nova senha, sem abrir
  sessão). `RESEND_COOLDOWN_SECONDS` subiu de 30 para 60. Decisões:
  - Home Care cria a conta ao enviar a tela de dados; Profissional guarda os
    dados só em memória e cria a conta em "Finalizar Cadastro" (ou ao virar
    Home Care), para ninguém ficar com conta de tipo errado.
  - Login volta para `?destino=` ou `state.from`, só se for caminho interno
    (`lib/destino.ts`, contra open redirect); senão vai para `/`. No passo 9 o
    padrão passa a ser `/minha-conta`.
  - Conta não confirmada no login abre `/cadastro` direto na confirmação do
    código, com o reenvio liberado.
  - O arquivo do comprovante fica em memória no Cadastro até depois do
    `confirmar-email`; o envio em si é o passo 8 (`TODO(backend)` no ponto).
  - Testes: vitest no frontend (`npm run test`), só para `api.ts` e
    `destino.ts`, com `fetch` simulado. A interface foi checada por build e
    lint; o fluxo no navegador contra a API real fica para depois do SMTP.
- [x] Passo 8 (22/10/2026): comprovantes. Backend: módulo `comprovantes`
  (`POST /api/comprovantes/url-de-envio`, `POST /api/comprovantes/confirmar`,
  `GET /api/comprovantes`), todas com sessão e os POST com `protegerOrigem`.
  O caminho no bucket é gerado pelo backend (`<id da sessão>/<uuid>.<ext>`, a
  extensão sai do tipo); só profissional `pendente` ou `recusado` envia
  (homecare 403, aprovado 409). Valida tipo (jpeg, png, heic, pdf) e tamanho
  (até 10 MB) e, na confirmação, só grava se o arquivo existe no bucket, com
  tamanho, tipo e extensão coerentes e a assinatura do conteúdo (primeiros
  bytes) batendo com o tipo; arquivo inválido é apagado do bucket. Limites: 5
  registrados e 10 arquivos na pasta por pessoa. Confirmar duas vezes é
  idempotente. O módulo nunca altera o status do perfil (o service não recebe o
  repository de perfis). Frontend: `api.enviarComprovante` (URL de envio, PUT
  direto na URL assinada sem cookies, confirmação), envio automático depois do
  `confirmar-email` e tela de sucesso com os estados enviando, enviado e erro
  com "Tentar enviar de novo". Se a página for fechada, o arquivo se perde: o
  reenvio fica em Minha Conta (passo 9, usa o `GET /api/comprovantes`). Até lá
  não há tela para escolher outro arquivo. Testes com Supabase simulado no
  backend e `fetch` simulado no frontend. Teste real parcial (usuário
  confirmado pelo admin, sem e-mail) feito depois do commit, ver abaixo.
- [x] Teste real parcial do passo 8 (24/10/2026), sem e-mail, no projeto
  `hykxvlngsiwhjxknuytz`: usuário já confirmado pelo admin
  (`teste-comprovante@example.com`), login pelo backend de verdade, URL de envio,
  `PUT` de um PDF pequeno direto na URL assinada com corpo cru (o Storage
  aceitou), confirmação (201), confirmação repetida (200, mesmo id), listagem,
  recusa de arquivo inexistente, de caminho de outra pessoa, de tamanho acima de
  10 MB e de HTML rotulado como PDF (apagado do bucket), e o status do perfil
  seguiu `pendente`. O teste achou um bug que os testes simulados não pegaram:
  para arquivo inexistente a SDK devolve `exists` com `data=false` JUNTO com um
  erro, e o repository tratava o erro como falha (500 em vez de 400
  `arquivo_nao_encontrado`). Corrigido, com teste do repository no formato real
  da resposta, e o teste real repetido deu tudo certo. No fim tudo foi apagado e
  conferido (bucket, `comprovantes_profissionais`, `perfis` por cascade e o
  usuário no Auth, com a mesma quantidade de usuários de antes).
- [x] Ajuste de HEIC (24/10/2026): o comprovante aceita só `image/jpeg`,
  `image/png` e `application/pdf`, no campo de arquivo do Cadastro, na validação
  do navegador e no backend (schema, extensão, assinatura e caminho). O iPhone
  converte a foto para JPEG sozinho quando o campo só lista esses tipos.
- [x] Passo 9 (25/10/2026): Header reativo e página `/minha-conta`. O ícone de
  conta leva a `/cadastro` deslogado e a `/minha-conta` logado, com um pontinho
  dourado e o rótulo "Minha conta". Minha Conta mostra nome, e-mail e tipo e
  andamento da conta ("Profissional, em análise" e afins), o comprovante do
  profissional não aprovado (lista dos enviados, ou "Falta enviar o comprovante
  profissional." com o seletor já aberto; "Enviar outro comprovante" quando já
  existe um) e o botão Sair. O reenvio usa o mesmo `api.enviarComprovante` do
  Cadastro, via o componente `SeletorDeComprovante` extraído de lá. Sem sessão,
  vai para `/login?destino=/minha-conta`. O login sem destino na URL agora leva
  a `/minha-conta` (`destinoDoLogin`; destino inválido continua indo para `/`).
  Na tela de sucesso do Cadastro, o profissional com erro no envio ou sem
  arquivo ganha o link "Ir para Minha conta". Testes (vitest) das funções puras
  em `lib/conta.ts` e de `destinoDoLogin`.
