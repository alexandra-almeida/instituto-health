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
- Banco, arquivos e e-mail de confirmação: Supabase, criado pelo Marketplace
  da Vercel no time da cliente (cobrança na fatura da Vercel dela), plano
  gratuito para começar, região São Paulo. Acessado só pelo backend.
- Gateway de pagamento: PagBank.
- Fluxo do cadastro profissional mantém a ordem das telas atuais
  (commit a70448b): Perfil > Dados > Comprovante > Confirmação de e-mail > Sucesso.
- Migrações SQL: versionadas em `supabase/migrations/`. A Alexandra cola cada
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
- O frontend ganha `src/lib/api.ts` (um único ponto de chamada HTTP) e um
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
  Semeada a partir de `src/data/tulipia-produtos.json`.
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
`image/heic`, `application/pdf`, limite de 10 MB.

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

- Trocar os `TODO(backend)` de `Cadastro.tsx` (4), `Login.tsx` (2) e
  `Checkout.tsx` (1) por chamadas a `src/lib/api.ts`.
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

Frontend: nenhuma chave. Só o rewrite de `/api` (e o proxy do Vite em dev).

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
- Transportadora (Manda Bem ou Melhor Envio): aguardando a Juliana.
- SMTP próprio (Resend): depende do domínio.
- Passagem do Supabase para o plano Pro (backups, sem pausa por inatividade)
  antes de receber pedidos reais.
- Conta PagBank de produção da Juliana.
- Limite de tentativas (rate limit) nas rotas de autenticação: definir a
  solução, já que memória local não funciona em Functions.

## Progresso

- [x] Passo 1 (08/10/2026): verificações da seção 3 sem conflito com o plano
  (Express sem configuração, com `src/app.ts` como entrypoint; corpo máximo de
  4,5 MB; duração padrão de 300 s no Pro) e esqueleto do `backend/` com
  `GET /api/saude`.
