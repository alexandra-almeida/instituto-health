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

- Escopo desta fase: cadastro/login e pagamento. O frete real (Melhor Envio,
  decidido em 16/11/2026) tem plano próprio, ver "Frete (Melhor Envio)" no fim
  deste arquivo.
- Backend separado do frontend, em camadas (routes, controller, service,
  repository). O frontend NUNCA fala direto com o Supabase nem com a Rede.
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
- Gateway de pagamento: Rede (e.Rede, Itaú), com crédito, débito e Pix.
  Decisão de 26/10/2026: a Juliana contratou a Rede (maquininha a caminho) e
  o pedido de habilitação de vendas online (e.Rede) e do token vai ao gerente.
  HISTÓRICO: até 25/10/2026 o gateway decidido era o PagBank; a troca foi
  registrada na seção "Progresso". As menções ao PagBank que restam neste
  plano são histórico (ou nomes de colunas da 0002, renomeados na 0006).
- Fluxo do cadastro profissional mantém a ordem das telas atuais
  (commit a70448b): Perfil > Dados > Comprovante > Confirmação de e-mail > Sucesso.
- Migrações SQL: versionadas em `database/migrations/`. A Alexandra cola cada
  uma manualmente no SQL Editor. Não configurar a CLI do Supabase.
- SMTP próprio (Resend): ATIVO desde 14/11/2026 (ver "E-mail: SMTP próprio e
  contato" no fim deste arquivo). O e-mail embutido do Supabase não é mais
  usado.

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
        rede.client.ts
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
- client (`rede.client.ts`): única parte que faz chamadas HTTP à Rede.
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
- `pedidos`: `id`, `numero` (sequencial, único e gerado pelo banco a partir de
  1001, para uso humano: "Pedido nº 1023"), `perfil_id` (pode ser nulo: compra
  sem cadastro ou conta apagada), `email`, endereço COPIADO no pedido (não só
  FK, para o histórico não mudar se o endereço for editado), `status`,
  `forma_pagamento`, `subtotal`, `frete`, `total`, `created_at`, `updated_at`.
- `itens_pedido`: `id`, `pedido_id` (cascade), `sku`, `nome`, `variacao`,
  `quantidade` (> 0), `preco_unitario`.
- `pagamentos`: `id`, `pedido_id`, `pagbank_order_id`, `pagbank_charge_id`,
  `status`, `valor`, `forma`, `created_at`, `updated_at`. (Nomes da migração
  0002, ainda com o prefixo `pagbank_`. A 0006 os renomeia para nomes neutros
  `gateway_order_id`, `gateway_charge_id` e `gateway_status`, ver "Progresso".)
- `eventos_webhook`: `id`, identificador do evento do gateway (único),
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

## 7. Pedidos e pagamento (Rede / e.Rede)

Troca de gateway em 26/10/2026: PagBank saiu e a Rede (e.Rede, Itaú) entrou.
O resumo do PagBank feito em 26/10/2026 ficou sem uso.

ANTES de escrever código desta etapa, leia a documentação oficial atual do
e.Rede (developer.userede.com.br: autorização de crédito e débito, 3DS, Pix,
notificações, cancelamento, ambiente sandbox) e apresente à Alexandra um resumo
do que será usado. Não implemente a partir de memória.

Princípios que não mudam:

- O total é SEMPRE calculado no servidor, a partir dos `sku` e quantidades,
  com os preços da tabela `produtos` (ou `precos_profissionais` para
  profissional aprovado). Preço vindo do navegador é ignorado. ATENÇÃO: desde
  16/11/2026 o preço do profissional é 30% sobre o preço CHEIO, item a item, e
  não uma lista por produto; ver "Regra de preço do profissional". Sobre o que
  acontece com `precos_profissionais`, há uma pergunta aberta para a Juliana.
- Itens `exclusivo_profissional` só entram no pedido de profissional aprovado
  (confirmado pela Juliana em 16/11/2026: o aprovado PODE comprá-los).
- Produto sem preço aplicável NUNCA é vendido, e o service recusa o pedido
  (não é uma regra que o banco garanta sozinho). Vale para: produto NÃO
  exclusivo com `preco` nulo (sem preço público); produto `ativo = false`;
  exclusivo, ou qualquer item para profissional, sem linha em
  `precos_profissionais` no caso de a venda exigir preço profissional. Nunca se
  cai para outro preço, nem para zero, quando o preço certo não existe.
- Dados de cartão PASSAM pelo nosso backend (decidido em 09/11/2026, ver
  "Regras obrigatórias do módulo de pagamento" abaixo): a Rede não tem página de
  pagamento hospedada, e a autorização recebe `cardNumber` e `securityCode` no
  corpo, numa chamada servidor a servidor (manual v1.32). A regra antiga
  ("nunca chegam ao backend em texto puro") foi substituída por regras de
  manuseio rígidas.
- As credenciais da Rede (PV e chave de integração) são secretas e ficam só no
  backend. O `access_token` OAuth dura 24 minutos e nunca vai para log nem
  para o navegador.
- Um pedido só vira "pago" a partir da confirmação da Rede, nunca por uma
  chamada do navegador. No Pix, ao receber o aviso, o backend consulta a
  transação na API da Rede (por TID) para confirmar o status antes de alterar o
  banco. No crédito e no débito, o resultado vem na resposta da autorização
  (ver o resumo do passo 11).
- Aviso idempotente (tabela `eventos_webhook`) e com a verificação de
  autenticidade que a documentação da Rede indicar (o resumo do passo 11 diz o
  que existe e o que não existe).
- Desenvolver e testar tudo no sandbox. Produção só com a conta Rede da
  Juliana (CNPJ da clínica).
- Parcelamento, juros e débito seguem o que a Rede oferecer de fato;
  o "até 3x sem juros" atual é só exemplo.
- Frete: Melhor Envio, decidido em 16/11/2026 (ver "Frete (Melhor Envio)" no
  fim). O frete nunca vem do navegador: o servidor cota de novo ao criar o
  pedido e o frete entra no total SEM desconto. O Checkout.tsx hoje só mostra
  "Frete: A calcular" (não existe regra de frete estimado para mover).

Endpoints previstos (ajustar após ler a documentação):

- `POST /api/pedidos` { itens, endereco, formaPagamento, dadosDoPagamento }
- `GET /api/pedidos/:id` (dono do pedido ou admin)
- `GET /api/pedidos` (lista do usuário logado)
- `POST /api/pagamentos/webhook` (chamado pela Rede)
- `GET /api/produtos/precos-profissionais` (só profissional aprovado)

### Resposta da Rede (09/11/2026)

- PV de e-commerce **110115600** criado (duplicado do PV físico, o da
  maquininha). É ele que o backend usa; o PV físico não entra.
- As condições comerciais passam a valer em até 2 dias úteis a partir de
  09/11/2026. Conferir com o gerente se já valem antes de testar em produção.
- A **chave de integração** é gerada pela Juliana no portal da Rede, com o login
  master. Ela NUNCA vai para chat, git, e-mail ou frontend: entra só como
  variável de ambiente no projeto da API na Vercel (`healthinstituto-api`),
  colada pela própria Juliana. Nomes adotados: `REDE_PV`,
  `REDE_CHAVE_INTEGRACAO` e `REDE_AMBIENTE` (`sandbox` | `producao`). A
  Alexandra e o Claude não veem o valor da chave.
- **3DS 2.0 e tokenização de bandeira** são contratados no portal da Rede (Para
  vender > E-commerce). O custo é por bandeira, conforme a documentação:
  https://developer.userede.com.br/e-rede#documentacao-3d-secure2-0 (valores
  ainda não registrados aqui; conferir na contratação).
- A Rede NÃO tem página de pagamento hospedada: os dados do cartão passam pelo
  nosso backend (regras abaixo).

### Taxas informadas pela Rede (09/11/2026)

| Forma | Taxa |
| --- | --- |
| Pix | 0,91% |
| Crédito à vista (Visa e Mastercard) | 2,64% |
| Débito | 1,01% |

Outras bandeiras e o crédito parcelado ainda não foram registrados: a confirmar
com a Rede antes de definir o parcelamento do Checkout ("até 3x sem juros" segue
sendo valor de exemplo). Taxa de 3DS e de tokenização: ver acima.

### Regras obrigatórias do módulo de pagamento

Valem para todo código que toque em cartão (`pagamentos`, `rede.client.ts`, a
rota de pedidos e os testes). Estão também no `CLAUDE.md`.

1. Número do cartão, validade e CVV só existem em memória, durante a
   requisição. Nunca são gravados em banco, log, mensagem de erro, Sentry ou
   analytics (nem em teste, fixture ou arquivo de exemplo, a não ser os cartões
   de teste públicos da Rede no sandbox).
2. Logs e erros mascaram o cartão: no máximo os 4 últimos dígitos. O corpo da
   requisição de pagamento não pode ser registrado inteiro (nem pelo
   middleware de log, nem num `catch` que imprima o `req.body`).
3. Só HTTPS. A rota de pagamento não aceita GET nem cache (`Cache-Control:
   no-store`, e nenhuma resposta repete dados do cartão).
4. Salvar cartão do cliente só via tokenização da Rede, nunca por conta
   própria. Sem tokenização contratada e implementada, não existe "salvar
   cartão".
5. Fluxo 3DS: o cliente vai ao banco e volta; por isso o pedido precisa do
   estado "aguardando autenticação" (ver o impacto na migração 0006 abaixo).

### Impacto do 3DS na migração 0006 (só anotado; a 0006 NÃO foi criada)

- `pedidos.status` hoje aceita `aguardando_pagamento`, `pago`, `cancelado`,
  `enviado` e `entregue`. Precisa de um estado novo, `aguardando_autenticacao`:
  o pedido existe, o cartão foi enviado à Rede e o cliente está no banco.
  Mudar a regra `check` do `status` exige apagar e recriar a restrição na 0006.
- `pagamentos.status` (`pendente`, `em_analise`, `pago`, `recusado`,
  `cancelado`, `estornado`) provavelmente precisa do mesmo estado, ou o
  pagamento fica `pendente` enquanto o pedido está em autenticação. Decidir na
  leitura da documentação do 3DS.
- Quem volta do banco chega por uma URL nossa; o backend confirma o resultado
  com a Rede (por TID) antes de marcar `pago`, nunca pelo que o navegador diz.
- Pedido que fica em `aguardando_autenticacao` e é abandonado precisa expirar
  (cancelar e liberar), possivelmente por tarefa agendada: definir o prazo.
- Se a 3DS devolver dados que precisem ser guardados (identificador da
  autenticação, resultado), entram em colunas de `pagamentos` na mesma 0006.
  Nunca dado de cartão.

### Sandbox (pendente, 11/11/2026)

Ainda não se sabe como se obtêm as credenciais de teste. O site oficial da
documentação (developer.userede.com.br) respondeu 403 à leitura automática e a
busca na web não trouxe a página oficial. Pistas indiretas, SEM confirmação: os
SDKs de terceiros usam o par PV e chave com um ambiente `sandbox` (o mesmo par
nos dois ambientes?). Próximo passo: a Alexandra abre a documentação no
navegador e cola aqui a seção de sandbox, ou pergunta ao gerente da Rede. Nada
foi cadastrado em lugar nenhum.

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
as variáveis do Supabase, `REDE_PV` (clientId), `REDE_CHAVE_INTEGRACAO`
(clientSecret), `REDE_AMBIENTE` (sandbox | producao), `ORIGEM_FRONTEND`,
(nomes definidos em 09/11/2026, valores só na Vercel e colados pela Juliana; antes do 26/10/2026 eram
`PAGBANK_TOKEN` e `PAGBANK_AMBIENTE`),
`COOKIE_SECRET` (se necessário) e, para o aviso de novo comprovante (tela de
aprovação, Fase 3), `RESEND_API_KEY` (ver "E-mail: SMTP próprio e contato").
Frete (já cadastradas na Vercel em 16/11/2026, só Production): `MELHOR_ENVIO_TOKEN`
(Secret) e `MELHOR_ENVIO_AMBIENTE` (`producao` lá; `sandbox` no `.env` local, com
um token de sandbox separado). Ver "Frete (Melhor Envio)".

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
5b. (SUBSTITUÍDO em 31/10/2026: o cron agora grava e lê a tabela `batimentos`,
   a cada 6 horas, ver "Incidente" no fim; o desenho abaixo é o histórico.)
   Passo extra, LOGO APÓS o commit do passo 5, em commit separado dos
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
11. Leitura da documentação da Rede (e.Rede) e resumo para aprovação (sem
    código). (Trocado de PagBank para Rede em 26/10/2026.)
    Itens a confirmar nessa leitura, além do que o resumo já cobrir:
    - O CPF/CNPJ do comprador é obrigatório (no Pix e no cartão)? Se for,
      entra numa migração `0006` com a coluna em `pedidos` (e o formulário do
      Checkout passa a pedir). A 0002 NÃO tem essa coluna.
    - Como o aviso (webhook) se identifica, para decidir como montar o
      `eventos_webhook.evento_id` (id do aviso ou charge + status).
    - Quais dados de Pix (QR Code, copia-e-cola, validade) e de cartão precisam
      ser guardados; se precisarem de colunas, entram na mesma `0006`.
12. Módulo `pedidos`: criação com total calculado no servidor, com testes.
13. `rede.client.ts` e pagamento por Pix no sandbox.
14. Aviso (webhook) do Pix e atualização de status.
15. Cartão de crédito no sandbox (e débito, se a Rede oferecer de forma
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
- Rede: o PV de e-commerce 110115600 já existe (09/11/2026). A Juliana gera a
  chave de integração no portal da Rede (login master) e cola `REDE_PV`,
  `REDE_CHAVE_INTEGRACAO` e `REDE_AMBIENTE` no projeto `healthinstituto-api` da
  Vercel, ela mesma (a chave não passa por chat, git, e-mail nem frontend).
  Contratar 3DS 2.0 e tokenização no portal (Para vender > E-commerce). Como
  obter as credenciais de sandbox: ver "Sandbox (pendente)" na seção 7.

## 12. Pendências e decisões em aberto

- Comprar exige conta? (login obrigatório no checkout ou compra como
  visitante). Decidir antes do passo 12.
- Comprovantes de profissionais recusados: por quanto tempo guardar
  (decisão da Juliana; sugestão: apagar após 90 dias).
- Exclusão de conta e dos arquivos (LGPD): implementar antes de abrir o
  cadastro ao público. Lembrete do passo 10: apagar a conta apaga perfil,
  endereços salvos e comprovantes (cascade), mas NÃO apaga os pedidos
  (`pedidos.perfil_id` vira nulo e o pedido fica, por causa de nota fiscal e
  histórico) e pedido com pagamento não pode ser apagado (`restrict`). Os
  pedidos guardam e-mail, nome, telefone e endereço de entrega; ao implementar a
  exclusão, decidir com a Juliana o prazo de guarda e se esses dados são
  anonimizados depois dele.
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
- Transportadora: DECIDIDA em 16/11/2026, Melhor Envio. Plano em "Frete
  (Melhor Envio)"; faltam dados (endereço da clínica, remetente, pesos e
  medidas, aprovar a lista de descartáveis só com retirada).
- Preço cheio dos 82 exclusivos (a Juliana vai mandar a tabela) e as 2
  perguntas da regra de preço: ver "Regra de preço do profissional". Bloqueiam
  o módulo `pedidos`.
- Passagem do Supabase para o plano Pro (backups, sem pausa por inatividade)
  antes de receber pedidos reais. Ao migrar, decidir se o despertador do passo
  5b é removido (rota, `crons`, tabela `batimentos` e `CRON_SECRET`) ou
  mantido.
  DECISÃO PENDENTE DA JULIANA (registrada em 31/10/2026): a Alexandra vai
  levar a ela. Motivo: o plano gratuito já pausou o projeto duas vezes, e em
  uma delas a restauração voltou SEM as tabelas (foi preciso colar a 0001 de
  novo, ver o registro de 22/10/2026). Com a pausa, o site fica sem cadastro e
  sem login, e o deploy do backend quebra (integração do Marketplace não
  provisiona). Projetos em plano pago não pausam por inatividade (documentação
  do Supabase). Tem custo mensal, na fatura da Vercel dela.
- Credenciais de produção da Rede da Juliana (e.Rede habilitado no PV dela).
- Cartão pelo nosso backend: DECIDIDO em 09/11/2026 (a Rede não tem página
  hospedada). Valem as regras obrigatórias da seção 7. Ainda em aberto: a
  contratação do 3DS 2.0 e da tokenização (custo por bandeira) e o sandbox.
- Limite de tentativas (rate limit) nas rotas de autenticação (login,
  redefinir-senha, confirmar-email, cadastro, reenvio) e na rota pública
  `/api/saude/banco`: OBRIGATÓRIO antes do lançamento. Definir a solução, já que memória local não funciona em
  Functions. Até lá só vale o limite próprio do Supabase.

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
- [x] Passo 10, migração (25/10/2026): `database/migrations/0002_produtos_pedidos_pagamentos.sql`
  (`produtos`, `precos_profissionais`, `enderecos`, `pedidos` com `numero`
  sequencial a partir de 1001, `itens_pedido`, `pagamentos` e `eventos_webhook`,
  RLS ligado sem políticas e `revoke` para `anon` e `authenticated`, inclusive na
  sequência do `numero`) colada no SQL Editor do projeto `hykxvlngsiwhjxknuytz`
  ("Success. No rows returned"); a conferência
  `database/conferencias/0002_produtos_pedidos_pagamentos.sql` deu as 19 linhas
  com `ok = true`. Preparada para compra sem cadastro (`perfil_id` nulo, e-mail
  sempre no pedido) e para o frete real (colunas nulas). Decisões aprovadas:
  status do pedido `aguardando_pagamento`, `pago`, `cancelado`, `enviado`,
  `entregue`; preço profissional também em produtos não exclusivos; apagar a
  conta mantém o pedido (lembrete de LGPD na seção 12).
- [x] Passo 10, carga (25/10/2026): `npm run seed:produtos` e
  `npm run seed:precos-profissionais`, em `backend/`, com a lógica em
  `database/seeds/lib/` e testes em `backend/tests/`. Simulação por padrão,
  `--aplicar` para gravar, nunca apagam nada. O catálogo foi APLICADO em
  25/10/2026 (149 produtos gravados) e conferido relendo o banco: 149 produtos;
  82 exclusivos de profissional, todos com preço nulo; 67 não exclusivos, todos
  com preço público, de R$ 35,90 a R$ 646,00; 0 não exclusivos sem preço; os 149
  com `ativo = true`; `precos_profissionais` vazia. Uma nova simulação deu 0
  novos, 0 alterados e 149 iguais. Os 5 preços que pareciam ter mais de 2 casas
  (71,1 quatro vezes e 67,15) eram só ruído de ponto flutuante: já são exatos.
  AINDA FALTA carregar os preços de profissional, quando a Juliana entregar a
  lista (`seed:precos-profissionais`, planilha fora do git).
- [x] Push dos commits do passo 10 (26/10/2026): `7967581..442ebe1` na `main`;
  os deploys dos dois projetos (`instituto-health` e `healthinstituto-api`)
  ficaram Ready.
- [x] Troca de gateway (26/10/2026): PagBank saiu, entrou a Rede (e.Rede, Itaú)
  com crédito, débito e Pix. Motivo: a Juliana já contratou a Rede (maquininha
  a caminho). O pedido de habilitação de vendas online (e.Rede) e do token vai
  ao gerente. Um resumo da documentação do PagBank chegou a ser feito e não
  será usado. Ajustados neste arquivo: seções 1, 2, 4, 7, 9, 10, 11 e 12 e o
  `CLAUDE.md`. O código da migração 0002 e a conferência ainda citam
  `pagbank_*` (a migração já foi aplicada e não se edita).
- [ ] Migração 0006 (pagamentos; foi a 0003 até 31/10/2026, a 0004 até 14/11/2026, quando a 0004 passou a ser a aprovação de cadastros, e a 0005 até 18/11/2026, quando a 0005 passou a ser o preço cheio dos exclusivos; a 0003 virou
  `0003_batimentos`; a escrever, SQL a ser mostrado à Alexandra antes): além de
  `cpf_cnpj`/dados de Pix que o resumo do passo 11 indicar, renomear em
  `pagamentos` as colunas `pagbank_order_id` para `gateway_order_id`,
  `pagbank_charge_id` para `gateway_charge_id` e `pagbank_status` para
  `gateway_status`, e os índices `pagamentos_pagbank_order_id_idx` e
  `pagamentos_pagbank_charge_id_idx` para `pagamentos_gateway_order_id_idx` e
  `pagamentos_gateway_charge_id_idx`. Ajustar na mesma entrega a conferência
  `database/conferencias/0002_...sql` (linhas 112 a 116) ou criar a da 0006.
  Na Rede o TID (até 20 caracteres) faz o papel do id de transação; ver o
  resumo do passo 11 para o que cada coluna guarda.
- [ ] Passo 11 (26/10/2026, em andamento): leitura do manual oficial do e.Rede
  v1.32 (23/03/2026) e resumo apresentado à Alexandra, sem código. A decisão do
  cartão pelo servidor foi tomada em 09/11/2026 (ver seção 7).
- [x] Resposta da Rede (09/11/2026), registrada em 11/11/2026 sem código de
  pagamento: PV de e-commerce 110115600 (duplicado do PV físico), condições
  comerciais em até 2 dias úteis, chave de integração gerada pela Juliana e
  colada por ela na Vercel (`REDE_PV`, `REDE_CHAVE_INTEGRACAO`,
  `REDE_AMBIENTE`), 3DS 2.0 e tokenização contratados no portal, taxas (Pix
  0,91%, crédito à vista 2,64% Visa e Master, débito 1,01%) e as 5 regras
  obrigatórias do módulo de pagamento (seção 7, e no `CLAUDE.md`). O impacto
  do 3DS na migração 0006 (estado `aguardando_autenticacao`) está anotado na
  seção 7; a 0006 continua por escrever.
- [x] E-mail e teste real de cadastro (14/11/2026): SMTP próprio ativo e o
  fluxo de cadastro profissional testado de ponta a ponta com e-mail real (ver
  "E-mail: SMTP próprio e contato"). Resolve as notas antigas "teste real
  depois do SMTP" deste arquivo (passos 5 a 9 e modelo "Reset password").
- [ ] Sandbox da Rede: descobrir como se obtêm as credenciais de teste (ver
  "Sandbox (pendente)" na seção 7). Sem criar conta em lugar nenhum até a
  Alexandra decidir.

## Frontend: procedimentos (30/10/2026)

Tarefa separada do backend, registrada aqui porque este é o arquivo de
acompanhamento do projeto.

- [x] Abas da página /procedimentos reorganizadas (ordem: Corporal, Facial,
  Capilar, Fisioterapia, Pós-operatório, Bem-estar). "Fisioterapia/Pós-operatório"
  virou duas abas. PEIM e Desintoxicação Metabólica passaram para Corporal. Pós-Operatório
  Facial e Corporal passaram para Pós-operatório, com os nomes de antes. Nenhum
  procedimento foi apagado nem renomeado (o slug da URL vem do nome). A página
  Sobre lista as categorias novas sozinha, pois lê `CATEGORIAS`.
- [x] Fotos por procedimento (campo `imagem` em `data/procedimentos.ts`; sem ele
  vale a foto da categoria). Primeiro 15 fotos da pasta `procedimentos-novas/`
  e, em 31/10/2026, mais 22: hoje os 37 procedimentos têm foto própria.
  A Juliana APROVOU todas as fotos novas em 31/10/2026, inclusive as que têm
  texto dentro (jalecos bordados, "Pilates" na parede, "Ultrassom Estético" na
  tela, quadro de coração na Neuropediatria). O texto delas fica ilegível no
  círculo do card (112 px); só serve como imagem.
  Ficam na pasta, SEM uso e FORA do git: `jato-de-plasma.webp`,
  `desintoxicacao-metabolica.webp` (versão antiga, com texto) e
  `laser-corporal.webp` (nenhum procedimento cita laser). A Desintoxicação
  Metabólica usa `desintoxicacao-metabolica-2`.
- [x] `FadedImage` com `loading="lazy"` e `decoding="async"`.

### Para a Juliana revisar

Textos novos, escritos como RASCUNHO, curtos e sem indicação, duração nem
contraindicação (só o que o nome já diz). Todos precisam da revisão dela:

- Fisioterapia: Neuropediatria, Neurologia adulto, Ortopedia, Pilates,
  Condicionamento físico.
- Pós-operatório: Pós-operatório de cirurgias ortopédicas e neurológicas.
- Bem-estar: Liberação miofascial, Ventosaterapia, Massagem relaxante.

Fotos a confirmar com ela:

- A foto de radiofrequência (`radiofrequencia-facial-corporal`) está em
  "Tratamento da Flacidez Facial e Corporal". Ela deve confirmar se combina com
  o tratamento de flacidez dela (o texto não cita radiofrequência).
- As 5 fotos reais (`drenagem-linfatica-corporal`, `drenagem-linfatica-facial`,
  `intradermoterapia-corporal`, `microagulhamento-corporal` e `laser-corporal`)
  têm estilo diferente das 12 geradas. Trocar depois por versões no mesmo
  estilo, se a Juliana quiser. A licença dessas 5 fotos está por confirmar.
- Pós-Operatório Corporal e Pós-Operatório Facial usam fotos com pontos e
  hematomas à mostra; ela deve confirmar que quer essas imagens no site.
- Nenhum procedimento depende mais da foto genérica da categoria
  (`CATEGORIA_IMAGEM`), que continua no código só como reserva para
  procedimentos futuros sem foto.

### Melhoria futura (não agora)

Gerar versões menores das fotos (cerca de 600 px de largura) para os cards da
listagem, se a página /procedimentos ficar pesada no celular. Hoje são 37 fotos
de 87 a 142 KB (cerca de 3,6 MB no total), carregadas aos poucos com `lazy`.
Os originais ficam para a página de detalhe.

## Incidente: Supabase pausado por inatividade (31/10/2026)

- O Supabase gratuito pausou de novo em 31/10/2026, mesmo com o despertador do
  passo 5b ativo. Os logs da Vercel (que só guardam desde 26/10 às 19h09)
  mostram `GET /api/cron/manter-ativo` com 200 em 27, 28, 29 e 30/10 (06h00 de
  Brasília) e com 500 em 31/10 (`Falha ao consultar perfis`, banco já pausado).
  Os dias 25 e 26/10 não têm log disponível. Nenhum 401 apareceu.
- Os redeploys do backend de 31/10 falharam enquanto o banco estava pausado
  (dois deploys com status Error, por volta de 10h14 e 10h48, segundo a
  Alexandra com a mensagem "integration resources failed to provision": a
  integração do Marketplace não consegue provisionar o recurso com o banco
  pausado). O deploy seguinte (por volta de 10h55) ficou Ready, depois que o
  banco voltou. Enquanto o banco estiver pausado, NÃO adianta refazer o deploy:
  primeiro restaurar o projeto no painel do Supabase.
- Causa: não confirmada. A documentação do Supabase só diz que projetos
  gratuitos com "low activity" em 7 dias são pausados e que alguns pedidos ao
  banco por dia costumam bastar, sem garantia; não define o limite nem se
  leitura conta. O cron fazia 1 leitura por dia e o site quase não tem tráfego
  que toque o banco.
- Decisões de 31/10/2026:
  - A (Supabase Pro): decisão pendente da Juliana, ver seção 12.
  - B (aprovado): migração `0003_batimentos` (só a tabela `batimentos`, com uma
    linha única, RLS ligado, sem políticas e `revoke` para `anon` e
    `authenticated`; conferência em `database/conferencias/0003_batimentos.sql`).
    O cron passa a fazer upsert dessa linha com a data de agora e depois lê de
    volta (500 se a leitura não confirmar a gravação), e o schedule vai de
    `0 9 * * *` para `0 */6 * * *` (a cada 6 horas, UTC; a equipe da Vercel é
    Pro). Não há garantia de que baste. A 0003 original (pagamentos) virou 0004, em 14/11/2026 0005 (a 0004 passou a ser a aprovação de cadastros) e, em 18/11/2026, 0006 (a 0005 passou a ser o preço cheio dos exclusivos).
  - C (aprovado): monitor externo gratuito (UptimeRobot), criado pela
    Alexandra (passo a passo dado na conversa), com 3 monitores a cada 5
    minutos: `https://healthinstituto-api.vercel.app/api/saude` (API no ar),
    `https://healthinstituto.com.br/api/saude` (domínio novo, passando pela
    regra de reescrita do site) e
    `https://healthinstituto-api.vercel.app/api/saude/banco` (banco
    respondendo), este com a palavra-chave `"status":"ok"`.
    `GET /api/saude/banco` foi feita na mesma entrega do B: pública, só LÊ a
    linha única da tabela `batimentos` e responde `{ "status": "ok", "ultimo":
    <data ISO do último batimento> }` (`ultimo` vai `null` se o cron ainda não
    rodou). Sem nenhum dado de cliente. Banco fora do ar: 503 com o JSON padrão
    `banco_indisponivel`, sem detalhe do banco. Sem cache (`Cache-Control:
    no-store`). O monitor chamar essa rota a cada 5 minutos avisa se o Supabase
    pausar e também gera cerca de 288 leituras por dia no banco. Elas PODEM
    ajudar a manter o projeto ativo, mas a documentação não diz se leitura
    conta como atividade; a aposta principal continua sendo a gravação do
    cron. Rota pública que consulta o banco: o limite de tentativas da seção 12
    deve cobri-la também.
  - D: a Alexandra vai procurar os e-mails do Supabase (aviso e confirmação da
    pausa) e passar as datas, para separar "o cron não bastou" de "o aviso já
    tinha sido emitido antes de o cron funcionar".

## Frontend: Header e botão Voltar ao topo (31/10/2026)

- [x] Botão "Voltar ao topo" (`components/BackToTop.tsx`, montado no App): fixo
  no canto inferior esquerdo (o WhatsApp fica no direito), aparece depois de
  400 px de rolagem, sobe suave e sem animação se o sistema pedir "reduzir
  movimento". Verde com seta dourada, `aria-label="Voltar ao topo"`.
- [x] O ícone de pessoa do Header saiu (a Juliana não entendeu o que era) e foi
  trocado por texto, sem pontinho dourado em nenhuma faixa:
  - abaixo de 480 px: "Entrar" (deslogado, para `/cadastro`) ou "Olá!"
    (logado, para `/minha-conta`), no espaço exato do ícone antigo (40 px);
  - a partir de 480 px: o texto completo ("Cadastre-se" / "Olá, Nome!");
  - o menu hambúrguer vale até 1279 px (antes era até 1023 px) e o menu
    completo só a partir de 1280 px, porque em 1024 a ~1140 px o nome do
    instituto ficava cortado. O primeiro item do menu hambúrguer é sempre o
    texto completo da conta, em destaque (fundo verde).
  Conferido em 1024, 1100, 1180, 1279, 1280, 1366 e 1440 px, deslogado e logado
  (inclusive com um primeiro nome de 23 letras): o nome do instituto aparece
  inteiro, em 1 linha de 295 px.
  O primeiro nome (`primeiroNome`, `lib/conta.ts`) é cortado em 96 px com
  reticências, para um nome longo não apertar a marca. Enquanto a sessão carrega
  aparece uma pílula cinza no lugar, para não piscar "Entrar" e trocar.
- [x] Resolvido em 31/10/2026: o corte do nome do instituto de 1024 a ~1140 px
  (que já existia) sumiu ao usar o menu hambúrguer até 1279 px. Continua em
  aberto só a marca em 320 px, que já quebrava em 3 linhas antes e segue igual.

## Domínio próprio (31/10/2026)

- O site está em https://healthinstituto.com.br desde 31/10/2026. O `www`
  redireciona para ele com 308, e `instituto-health.vercel.app` continua
  funcionando.
- DNS no Registro.br: registro A `@` apontando para a Vercel e CNAME `www`.
- `ORIGEM_FRONTEND` (projeto `healthinstituto-api` na Vercel) agora tem os 3
  endereços do site (o da Vercel, o domínio novo e o `www`), conforme
  informado pela Alexandra; o texto da seção 9 que diz "hoje
  `instituto-health.vercel.app`" fica como histórico.
- Site URL do Supabase trocado para https://healthinstituto.com.br (feito pela
  Alexandra no painel). O link do e-mail de confirmação e de recuperação usa
  esse endereço; o fluxo atual é por código de 6 dígitos, então nada depende
  dele ainda.
- `frontend/index.html`: `canonical`, `og:url`, `og:image` e `twitter:image`
  trocados para o domínio novo (mesmos caminhos).
- `robots.txt` (libera o site, com `Disallow` para `/carrinho`, `/checkout`,
  `/pedido-confirmado`, `/cadastro`, `/login`, `/minha-conta`,
  `/redefinir-senha` e `/api/`, e aponta para o sitemap) e `sitemap.xml`
  criados em 02/11/2026. O sitemap é gerado a cada `npm run build` (script `prebuild`) por
  `frontend/scripts/gerar-sitemap.mjs`, que lê os dados reais pelo Vite, então
  usa os mesmos slugs das rotas: 194 páginas (8 fixas, 37 procedimentos e 149
  produtos Tulípia, inclusive os exclusivos de profissional, que são públicos
  sem preço). Não entram carrinho, checkout, pedido confirmado, cadastro, login,
  Minha Conta nem redefinir senha. O arquivo gerado não vai para o git. A página
  de contato não existe (os contatos são o WhatsApp e o Instagram).

## Descartáveis para clínicas (02/11/2026)

Página `/produtos-hospitalares` com a lista real da Juliana (arquivo
`docs/descartaveis-lista-juliana.csv`, 52 linhas), separada do catálogo da
Tulípia.

- [x] Dados em `frontend/src/data/descartaveis.json`, gerado do CSV por
  `npm run descartaveis` (`frontend/scripts/importar-descartaveis.mjs`, roda à
  mão, fora do build). Linhas com o mesmo nome e a mesma marca viram um produto
  só: **41 produtos e 52 variações** (tamanhos das luvas, fragrâncias do
  sabonete). Nome igual com marca diferente (água sanitária 5 L, papel
  higiênico 30 m) continua em produtos separados.
- [x] sku de cada VARIAÇÃO: `desc-nome-da-variação-N` (N de 0 a 51). O prefixo
  `desc-` impede colisão com a Tulípia. Congelado como na Tulípia: nunca muda,
  novos entram no fim; o script mantém os sku existentes ao rodar de novo e um
  teste (`frontend/src/lib/descartaveis.test.ts`) guarda a lista dos 52.
- [x] Preço único, sem preço de profissional por produto. Todos os 52 têm preço
  e vão para o carrinho (o mesmo da Tulípia; `productId` é o sku da variação).
- [x] Página: bloco "Compras em atacado e licitações" no topo (texto RASCUNHO
  para a Juliana revisar, botão do WhatsApp com "Olá! Gostaria de um orçamento
  para compra em atacado/licitação."), busca por nome, filtro por categoria e
  por marca, e em cada card a escolha da variação (sem pré-seleção), a
  quantidade (vale para o carrinho e para o WhatsApp), "Adicionar ao carrinho"
  e o botão "Atacado ou licitação? Fale com a gente" (WhatsApp com produto,
  variação e quantidade). Sem foto, cada categoria usa um ícone neutro.
- [x] A prévia da Home ("Descartáveis Para Clínicas") passou a usar as
  categorias e três produtos reais; antes tinha itens inventados.
- [x] Marca e embalagem "A CONFIRMAR" não aparecem no site nem no JSON (campo
  nulo): o site mostra só o que está confirmado.
- [x] Seed: `npm run seed:produtos` agora lê a Tulípia E os descartáveis (uma
  linha em `produtos` por variação: `nome` = nome + marca, `tamanho` = variação
  + embalagem confirmada, `preco` = preço único, `exclusivo_profissional` =
  falso) e recusa a carga se um sku se repetir entre as duas listas.
  SIMULAÇÃO de 02/11/2026: 201 produtos nos JSON, 149 no banco; 52 novos (todos
  descartáveis), 0 alterados, 149 iguais (a Tulípia não muda), 0 ausentes.
  **APLICADO em 03/11/2026** (`npm run seed:produtos -- --aplicar`: 52 novos,
  0 atualizados) e conferido lendo o banco de volta: 201 produtos no total, 52
  com sku `desc-`, 149 da Tulípia intactos (82 exclusivos, 67 com preço
  público), os 52 descartáveis todos com preço (de 3,50 a 86,90),
  `exclusivo_profissional` falso e `ativo` verdadeiro, nenhum sku repetido. Uma
  nova simulação deu 0 novos, 0 alterados e 201 iguais.

### OBRIGATÓRIO antes do lançamento

- Confirmar com a Juliana as **embalagens dos 4 produtos** que hoje ficam à
  venda sem dizer o que vem na caixa (decisão de 02/11/2026: ficam à venda por
  enquanto porque o checkout ainda não está ligado). Sem isso o cliente vê o
  preço sem saber a quantidade: Lençol Hospitalar 50x50 e 70x50 ("rolo?") e
  Saco de Lixo 30 L e 50 L ("5x20" quer dizer 5 pacotes com 20?).
  Já confirmadas pela caixa do fabricante em 03/11/2026 (saíram das listas de
  marca e de embalagem a confirmar): as 4 luvas, Luva de Vinil Sem Pó, Luva
  Viniflex Sem Pó, Luva Nitrílica Rosa e Luva de Látex com Pó, todas
  **Vabene** e "**Caixa com 100**".

### Pendências do CSV para a Juliana

- **Marca a confirmar (11 produtos):** Abaixador de Língua, Máscara de TNT
  Tripla Branca com Elástico, Touca de TNT Branca Sanfonada, Lençol de Maca com
  Elástico, Papel Toalha Interfolha 2 Dobras 100% 20x21, Filtro de Café de
  Papel 103 e 102, Saco de Lixo 20 L, 30 L, 50 L e 100 L.
- **Embalagem a confirmar (4 produtos):** a lista acima do OBRIGATÓRIO.
- **PERGUNTA para a Juliana: a Luva Nitrílica Rosa é vendida em tamanho G? Se
  for, qual o preço?** A lista de preços só tem PP, P e M, então o site NÃO
  tem a variação G. Existe foto da caixa G, guardada em reserva (ver "Fotos dos
  descartáveis").
- **Outras dúvidas do CSV:** o Copo Descartável de 180 ml estava com "$ 4,95"
  (sem o R); a espessura do Saco Plástico Virgem 35x45 é 0,6 ou 0,06?; o Saco de
  Lixo 30 L (R$ 81,89) está caro perto do de 20 L (R$ 18,81).
- **PERGUNTAS para a Juliana sobre as fotos (03/11/2026):**
  1. **A máscara da foto é Prevemax.** Essa é a marca da Máscara de TNT Tripla
     Branca com Elástico e da Touca de TNT Branca Sanfonada? (A marca dos dois
     produtos está "A CONFIRMAR" e a mesma foto foi usada nos dois.)
  2. **A foto do papel higiênico BOB Premium mostra o pacote de 4 rolos** (30 m
     x 10 cm cada); a lista é de **16 rolos**. A foto vale para a embalagem
     de 16, ou é preciso uma foto do pacote com 16?
  3. (Resolvida em 03/11/2026) As fotos das fragrâncias Frutas Vermelhas e
     Pistache do Sabonete Líquido 5 L (Harmoniex) chegaram e foram ligadas:
     hoje as três fragrâncias têm foto própria.
  4. **A foto do Cloro Gel 5 L (Harmoniex) parece gerada por IA**: o texto do
     rótulo está embaralhado. Trocar pela foto oficial.
  5. **Limpador Perfumado 120 ml (Coala): quais fragrâncias ela vende?** A
     foto mostra 8 (Lavanda, Citronela, Chá Branco, The Queen, Sol do Brasil,
     Eucalipto Citriodora, Orquídea Negra e Bambu) e o produto está como um só,
     sem variação. Se vender mais de uma, vira variação (cada uma com sku).
  6. **O Desinfetante Candura 2 L da foto é Pinho.** É essa a fragrância que
     ela vende?
  7. **A foto do Sabão em Pó Multiação 800 g (Triex) mostra 3 pacotes**, e o
     produto é 1 pacote. Trocar por uma foto de um pacote só.
  8. **Faltam fotos de 5 produtos:** as Bobinas Picotadas Reforçadas 20x30 e
     25x35 (Lider) e os Sacos de Lixo 30 L, 50 L e 100 L.
  9. **A foto de 4 produtos difere da lista** (ligadas em 04/11/2026; quando ela
     responder, corrigir marca ou embalagem no CSV, sem mudar o sku, e rodar o
     seed, que mostrará os alterados):
     - **Água Sanitária 1 L:** a foto é **Super Cândida** (4 frascos); a lista
       diz Candura. Qual é a marca?
     - **Água Sanitária 5 L (Harcclin):** o rótulo da foto é **Cloro Líquido
       Harcclin**; a lista diz Água Sanitária. É o mesmo produto?
     - **Saco de Lixo 20 L:** a foto é **Kit 50 un** (reforçado); a lista é
       pacote com 100. Qual é a embalagem?
     - **Bobina Picotada Reforçada 30x40:** a foto é **FlexBag** (500 un); a
       lista diz Lider. Qual é a marca?
- **Fotos:** 36 produtos têm foto: as 4 luvas Vabene (uma por tamanho), o
  Sabonete Líquido 5 L (Harmoniex), uma por fragrância, e 31 produtos com uma
  foto só. Os outros 5 (lista na pergunta 8) usam o ícone da categoria. Veja a
  seção seguinte.
- **Texto do bloco de atacado e licitações e a frase de apresentação da
  página:** rascunhos, para a Juliana revisar.

## Regra de preço do profissional (26/10/2026, revista em 16/11/2026)

Registrada em 16/11/2026. **Ainda NÃO implementada**: o site, o carrinho, o
banco e o backend não aplicam desconto nenhum, e o módulo `pedidos` (passo 12)
não foi construído.

Histórico: em 26/10/2026 a Juliana decidiu "30% de desconto sobre o TOTAL da
compra para profissional aprovado" e ficaram perguntas em aberto (frete,
promoções, descartáveis, preço cheio dos 82 exclusivos). Em 16/11/2026 ela
respondeu, e a regra abaixo SUBSTITUI a do total.

### Decisões da Juliana (16/11/2026)

1. **Profissional APROVADO pode comprar os produtos exclusivos.** Home Care e
   visitante continuam sem comprá-los (preço oculto, compra desabilitada).
2. **30% de desconto para profissional aprovado, só sobre os produtos Tulípia
   do pedido** (não sobre o total do pedido). Exige conta aprovada.
3. **Descartáveis (skus `desc-`) não têm desconto, nem para profissional.** No
   pedido misto, o desconto incide só sobre os itens Tulípia.
4. **O frete NÃO entra no desconto:** é cobrado cheio.
5. **Não soma com promoção.** Para cada item Tulípia vale o MAIOR desconto
   entre (a) o preço promocional vigente e (b) 30% sobre o preço CHEIO. Nunca
   30% em cima do preço promocional. O cálculo é por item, a partir do preço
   cheio, e é feito no servidor: preço vindo do navegador é ignorado.

Fórmula, por item Tulípia, para profissional aprovado (em centavos inteiros, nunca
em ponto flutuante):

```
preco_com_30 = preco_cheio - 30%      (o desconto é arredondado no centavo)
preco_final  = promocao_vigente existe ? menor(promocao_vigente, preco_com_30)
                                       : preco_com_30
```

Exemplos para os testes (os dois são casos reais de 16/11/2026):

| Produto | Cheio | Promoção | 30% sobre o cheio | Fica |
| --- | --- | --- | --- | --- |
| Niacine+ | 149,00 | 104,30 | 104,30 | 104,30 |
| Resilience | 139,00 | 125,10 | 97,30 | 97,30 |

No primeiro a promoção é igual ao desconto de 30%; no segundo ela é menor (10%)
e o profissional paga 97,30, não 30% sobre 125,10 (que daria 87,57).

### No site

- No card de um produto exclusivo, para o profissional aprovado: botão de
  comprar NORMAL. O desconto aparece no carrinho e no checkout, não no card.
- O preço de profissional nunca vai no código do frontend: vem do servidor, só
  para profissional aprovado (regra que já existia).
- Hoje o seletor "Profissional / Home Care" da /tulipia é só um filtro de
  vitrine, sem conta. A compra de exclusivos e o desconto dependem de conta
  aprovada, checada no servidor.

### Efeito no resto do plano

- O princípio "o total é calculado no servidor" (passo 12) continua; o que muda
  é a conta: o preço cheio vem de `produtos.preco`, e o desconto é calculado por
  item como acima, em vez de ler um preço pronto em `precos_profissionais`.
- Frete (quando houver transportadora) entra no total SEM desconto.
- Itens `desc-` entram sempre ao preço único, mesmo para profissional, e o
  service de pedidos NÃO pode recusar um descartável por falta de linha em
  `precos_profissionais`.

### Em aberto (não construir o módulo `pedidos` antes da resposta)

- **Preço cheio dos 82 produtos exclusivos**, que hoje não têm preço no
  catálogo (preço nulo no banco e no site). A Juliana vai mandar a tabela. Sem
  ela não há como calcular os 30% desses itens.

### Perguntas para a Juliana (lista atualizada em 16/11/2026)

Respondidas e retiradas: se o desconto inclui o frete (não inclui), se soma com
promoção (não soma, vale o maior), se vale para os descartáveis (não vale).

1. **A tabela com o preço cheio dos 82 exclusivos** (decisão dela de mandar).
2. Pelas decisões acima, o desconto sai sempre do preço cheio, então a lista de
   preços de profissional por produto (tabela `precos_profissionais` e o script
   `seed:precos-profissionais`) parece não ser mais necessária. **Confirmar?**
   Até a resposta, nada é apagado e o seed não é usado.
3. **O preço promocional vale também para o cliente comum** (Home Care e
   visitante), sem desconto de profissional? Hoje a regra só diz como a
   promoção se combina com os 30%.

Pendência técnica (observação da Alexandra/Claude, não é pergunta): o servidor
precisa saber o preço promocional VIGENTE de cada sku para aplicar a regra 5, e
isso hoje não existe em lugar nenhum (o site e o banco só têm o preço cheio; as
promoções do Esquenta Black são só texto e filtro na página). Definir onde
guardar (por exemplo uma tabela de promoções com sku, preço e período) antes de
construir o passo 12.

### Fotos dos descartáveis (03/11/2026)

- **Origem:** as fotos dos descartáveis são as **oficiais dos fabricantes**,
  usadas pelo Instituto como **representante**, que compra direto do
  fabricante (esclarecido pela Alexandra em 04/11/2026).
- **Como acrescentar uma foto:** colocar o arquivo (webp, jpg ou png) em
  `frontend/src/assets/descartaveis/`, com o **slug do produto** no nome, e rodar
  `npm run descartaveis` (dentro de `frontend/`). O importador liga a foto
  sozinho e grava o nome do arquivo no JSON; o site resolve a URL. Só vale a
  pasta em si, não as subpastas: `frontend/src/assets/descartaveis/_reservas/`
  guarda foto que ainda não deve aparecer.
  - O slug é o nome do produto em minúsculas, sem acento e com hífens, mais a
    marca quando ela está confirmada: `luva-de-vinil-sem-po-vabene`. Se o
    produto não tem marca confirmada, só o nome, e só vale se o nome for único
    na lista.
  - **Uma foto para o produto inteiro:** `slug-do-produto.webp`.
  - **Uma foto por variação** (um tamanho de luva, uma fragrância): o slug do
    produto + `-` + a variação, como `luva-viniflex-sem-po-vabene-m.webp`. O
    card troca a foto conforme o tamanho escolhido; antes de escolher mostra a
    do M, ou a primeira que existir. Tamanho sem foto própria mostra a do
    tamanho mais próximo que tem (o PP sem foto mostra a do P). Variação que
    não é tamanho (fragrância) sem foto mostra a da primeira variação que tem
    (o Sabonete Líquido 5 L: Frutas Vermelhas e Pistache mostram a da Erva
    Doce). Produto com uma foto só continua como está.
  - **Foto que serve a mais de um produto** (a máscara e a touca, os dois
    lençóis hospitalares): um arquivo só tem um nome, então a ligação é feita à
    mão na lista `FOTOS_COMPARTILHADAS` do importador
    (`frontend/scripts/importar-descartaveis.mjs`): arquivo -> nomes dos
    produtos. O importador avisa se o arquivo ou o produto não existir.
  - O importador avisa na tela de qualquer arquivo da pasta que não casou com
    nenhum produto, e um teste falha se sobrar foto sem ligação.
- **Ligadas hoje:** as 4 luvas Vabene, uma foto por tamanho: Luva de Vinil
  Sem Pó e Luva Viniflex Sem Pó (P, M e G), Luva Nitrílica Rosa (P e M; o PP
  mostra a do P) e Luva de Látex com Pó (P, M e G; o PP mostra a do P). A foto
  única da Vinil, que era cópia exata da P, foi apagada em 03/11/2026.
- **Ligadas em 03/11/2026 (12 fotos, as oficiais dos fabricantes):**
  - pelo nome do arquivo (renomeadas para o slug): Abaixador de Língua, Lençol
    de Maca com Elástico, Papel Toalha Interfolha 2 Dobras 100% 20x21 e Extra
    Luxo 20x21 (Grampel), Papel Higiênico Folha Dupla Premium 30 m (BOB), Folha
    Dupla 30 m (Qualite) e (Personal Vip), Copo Descartável 50 ml e 180 ml
    Branco (Faça Fácil) e, por variação, o Sabonete Líquido 5 L (Harmoniex)
    Erva Doce;
  - à mão, uma foto para dois produtos: `mascara-e-touca-tnt.webp` (Máscara de
    TNT Tripla Branca com Elástico e Touca de TNT Branca Sanfonada) e
    `lencol-hospitalar-rolo.webp` (Lençol Hospitalar 50x50 e 70x50, Classpel).
- **Ligadas em 03/11/2026, segunda leva (15 fotos, as oficiais dos
  fabricantes):**
  - pelo nome do arquivo (renomeadas para o slug): Sabão em Pó Primavera 800 g
    (Tixan), Sabão em Pó Multiação 800 g (Triex), Limpador Perfumado 120 ml
    (Coala), Desinfetante 5 L Algas (Harcclin), Desinfetante 2 L (Candura),
    Cloro Gel 5 L (Harmoniex), Sabonete Líquido 500 ml com Pump Ameixa Dourada
    (Coala), Sabonete Líquido 5 L (Harmoniex) nas variações Pistache e Frutas
    Vermelhas, Água Sanitária 2 L (Triex), Água Sanitária 5 L (Triex) e (Gopabo),
    Filtro de Café de Papel 102 e 103;
  - à mão, uma foto para dois produtos: `saco-plastico-virgem.webp` (Saco
    Plástico Virgem 35x45 Espessura 0,6 e 40x60 Espessura 0,12, Araplast).
- **Ligadas em 04/11/2026, terceira leva (4 fotos):** Água Sanitária 1 L
  (Candura), Água Sanitária 5 L (Harcclin), Saco de Lixo 20 L 40x59 Preto e
  Bobina Picotada Reforçada 30x40 (Lider), todas pelo nome do arquivo
  (renomeadas para o slug). A foto de cada uma difere da lista (pergunta 9).
- **Testes de foto:** o Vitest tem o cache de módulos em disco desligado
  (`fsModuleCache: false` em `frontend/vitest.config.ts`), porque com ele ligado
  uma foto nova na pasta não aparecia na lista dos testes.
- **Luva Viniflex Sem Pó:** o nome foi corrigido de "Vinilflex" para "Viniflex"
  (grafia da marca). Os sku **não mudaram** (continuam `desc-luva-vinilflex-sem-po-N`):
  o importador tem uma lista de renomeados para ligar o nome novo ao sku antigo.
  A embalagem passou a "Caixa com 100".
- **Banco:** a marca e a embalagem das 4 luvas e o nome da Viniflex alteram
  13 linhas de `produtos` (campos `nome` e `tamanho`; os sku não mudam).
  **APLICADO em 04/11/2026** (`npm run seed:produtos -- --aplicar`: 0 novos, 13
  atualizados) e conferido lendo o banco de volta: 201 produtos, 52 com sku
  `desc-`, nenhum "Vinilflex" nem "A CONFIRMAR" em nome ou tamanho, preços e
  `exclusivo_profissional` intactos. Nova simulação: 0 novos, 0 alterados e 201
  iguais.
- **Foto em reserva:** `_reservas/luva-nitrilica-rosa-vabene-g.webp` (a caixa G
  da Luva Nitrílica Rosa). Não aparece no site porque a lista de preços não tem
  a variação G; ver a PERGUNTA para a Juliana acima. Se ela vender em G, criar a
  variação no CSV (com o preço), mover o arquivo para a pasta de fotos e rodar
  `npm run descartaveis`.
- **Detalhe das fotos:** a caixa da Luva de Vinil traz "luvas de vinil
  industrial" e "uso profissional, food"; vale a Juliana conferir se esse texto
  da caixa combina com o uso em clínica.

## E-mail: SMTP próprio e contato (14/11/2026)

### SMTP do Supabase Auth (Resend)

- Resend com o domínio `healthinstituto.com.br` verificado, região São Paulo
  (`sa-east-1`). No Registro.br: DKIM, SPF e DMARC (`p=none`, só monitora, não
  rejeita).
- O Supabase Auth envia por SMTP em `smtp.resend.com`, porta 465, com o
  remetente "Instituto Health" <naoresponda@healthinstituto.com.br>. A
  credencial do SMTP fica só no painel do Supabase (nunca neste arquivo, no
  git, no chat ou no frontend).
- Recebimento pelo Resend DESLIGADO, para não conflitar com o encaminhamento do
  contato (abaixo).

### Modelos de e-mail do Supabase

- Em português, com `{{ .Token }}` (código de 6 dígitos, sem link): Confirm
  signup e Reset password.
- Os dois HTML ficam em `docs/emails/` só como REFERÊNCIA. Quem vale é o que
  está no painel do Supabase (Authentication > Emails): qualquer mudança é
  feita LÁ, e depois a cópia em `docs/emails/` é atualizada para não divergir.
  (Os arquivos entram quando a Alexandra enviar o conteúdo.)

### Teste real

Cadastro profissional feito e APROVADO com e-mail real (14/11/2026): o código
de 6 dígitos chegou, a confirmação funcionou e o envio do comprovante também.

### Contato do site

- `contato@healthinstituto.com.br` encaminha para
  `contato.healthinstituto@gmail.com` pelo Forward Email: no Registro.br, MX
  `mx1.forwardemail.net` e `mx2.forwardemail.net` e o TXT `forward-email`.

### Aviso de novo comprovante (ainda não implementado)

Quando a tela de aprovação existir (Fase 3), o backend avisará por e-mail que
há comprovante novo. A chave do Resend para isso será `RESEND_API_KEY` no
projeto `healthinstituto-api` da Vercel, SÓ no ambiente Production e marcada
como Sensitive, cadastrada pela Alexandra. Nunca no chat, no git ou no
frontend, e o valor não aparece em log nem em resposta da API.

## Tela de cadastros (admin) (14/11/2026)

Aprovar profissionais e consultar quem se cadastrou. Plano aprovado pela
Alexandra com 6 decisões; backend, e-mails e frontend prontos e commitados.
**A migração `0004_aprovacao_cadastros` ainda NÃO foi criada** (o SQL foi
mostrado à Alexandra para revisão antes de virar arquivo).

### Ordem para colocar no ar (importante)

1. Colar a migração 0004 no SQL Editor do Supabase. O backend novo grava e lê a
   coluna `perfis.email` e chama a função `avaliar_perfil`: SEM a migração, o
   cadastro e a tela quebram. Por isso a migração vem ANTES do push.
2. Colar o SQL que torna a Juliana e a Bia admin (abaixo).
3. Cadastrar `RESEND_API_KEY` no projeto `healthinstituto-api` da Vercel (só
   Production e Sensitive, pela Alexandra). Sem ela tudo funciona e só não
   saem os e-mails.
4. Push e conferir os deploys.

### Quem acessa

- Só `perfis.is_admin = true`. No backend, todas as rotas `/api/admin` passam
  por `protegerOrigem`, `autenticar` e `exigirAdmin` (que lê `is_admin` no
  banco a cada chamada; nada que vem do navegador decide). Respostas com
  `Cache-Control: no-store`.
- No frontend, `/admin/cadastros` fica atrás de `RotaDeAdmin`: deslogado vai
  ao login, quem não é admin vê "Você não tem permissão para ver esta página."
  O link "Cadastros" (com o número de pendentes) aparece no header e em Minha
  Conta só para admin.
- `GET /api/auth/eu` e os logins devolvem `ehAdmin` dentro de `perfil`: é só
  uma dica para a tela (decisão 1). O `is_admin` em si nunca sai do banco, e o
  backend confere de novo em cada rota admin.
- Não existe tela para virar admin. SQL (a Alexandra revisa e cola):

```sql
-- 1) conferir: deve listar exatamente as 2 contas
select p.id, p.nome, u.email, p.is_admin
from public.perfis p join auth.users u on u.id = p.id
where lower(u.email) in ('EMAIL_DA_JULIANA', 'EMAIL_DA_BIA');

-- 2) tornar admin
update public.perfis set is_admin = true
where id in (select id from auth.users
             where lower(email) in ('EMAIL_DA_JULIANA', 'EMAIL_DA_BIA'));

-- 3) conferir o resultado
select p.nome, u.email, p.is_admin
from public.perfis p join auth.users u on u.id = p.id where p.is_admin;
```

### Rotas (módulo `modules/admin`, camadas routes, controller, service, repository)

| Rota | Função |
| --- | --- |
| `GET /api/admin/resumo` | contagens: profissionais por situação e Home Care |
| `GET /api/admin/profissionais?status=&busca=&pagina=` | 20 por página, mais recentes primeiro, com total |
| `GET /api/admin/homecare?busca=&pagina=` | só consulta (nome, e-mail, telefone, data) |
| `GET /api/admin/comprovantes/:id/url` | URL assinada de 5 minutos; nunca o arquivo |
| `POST /api/admin/profissionais/:id/aprovar` | aprova |
| `POST /api/admin/profissionais/:id/recusar` | recusa, com `motivo` obrigatório (3 a 300 caracteres) |

- Entradas validadas com zod (`validar` no corpo e `validarEntrada` na query e
  nos parâmetros). A busca é por nome ou e-mail e escapa os curingas do LIKE e
  a sintaxe do filtro do PostgREST (`lib/busca.ts`).
- LGPD: as respostas só levam o necessário (id, nome, e-mail, telefone,
  registro, datas, situação e, nas decididas, quem decidiu, quando e o motivo).
  Nunca senha, token, endereço, dado de pagamento nem o caminho do arquivo.
- Decisão e histórico acontecem juntos na função `avaliar_perfil` do banco, e só
  valem se o cadastro ainda está pendente: duas pessoas decidindo ao mesmo
  tempo, só a primeira vale (a outra recebe 409).
- Ver comprovante: o backend gera a URL assinada (5 minutos) só para admin; o
  navegador abre uma aba nova (sem referência à aba de origem). O arquivo nunca
  passa pelo corpo da resposta.

### As 6 decisões (aprovadas em 14/11/2026)

1. `ehAdmin` no `/eu` (acima).
2. `telefone` e `registro_profissional` existem como colunas vazias; o
   formulário de cadastro NÃO muda neste pedido, então a tela só mostra esses
   campos quando houver valor (hoje nunca). Quando o cadastro passar a pedir,
   é só preencher as colunas.
3. Coluna `perfis.email`, preenchida no cadastro e recuperada dos perfis
   existentes na migração. É uma CÓPIA do e-mail de `auth.users`: **se um dia
   existir troca de e-mail, essa coluna precisa ser atualizada junto** (também
   anotado no `perfis.repository.ts`).
4. Esta é a `0004_aprovacao_cadastros`; a de pagamentos virou `0005` e, em
   18/11/2026, `0006` (a `0005` passou a ser o preço cheio dos exclusivos).
5. Profissional recusado que reenvia um comprovante volta para "pendente"
   (`comprovantes.service`, só depois de gravar o comprovante).
6. Abas Aprovados e Recusados são só leitura (sem desfazer).

### Migração 0004 (a criar)

`perfis`: colunas `email`, `telefone` e `registro_profissional` (opcionais) e
um índice por tipo, situação e data. Tabela `avaliacoes_perfil` (histórico:
perfil, decisão, motivo, quem decidiu, quando; RLS ligado, sem política, sem
privilégios para anon e authenticated). Função `avaliar_perfil` (só
`service_role` executa). O histórico guarda recusa, reenvio e aprovação, não só
a última decisão.

### E-mails (Resend)

- `RESEND_API_KEY` é opcional no `env`: sem ela a API sobe e só registra um
  aviso, sem enviar. O cliente é um `fetch` à API do Resend (sem SDK).
- Para `contato@healthinstituto.com.br`, a cada comprovante novo confirmado:
  "Novo profissional aguardando aprovação", só com o nome e o link para
  `/admin/cadastros` (sem anexo e sem dado sensível).
- Para o profissional, ao ser aprovado ("Seu cadastro foi aprovado") e ao ser
  recusado ("Não conseguimos aprovar seu cadastro", com o motivo e como
  reenviar em Minha Conta). Remetente "Instituto Health"
  <naoresponda@healthinstituto.com.br>. Textos em
  `modules/notificacoes/notificacoes.textos.ts`, em português, sem travessão,
  com o que vem de uma pessoa escapado no HTML.
- Falha no envio NUNCA desfaz a decisão nem o envio do comprovante: vai para o
  log só com o tipo do aviso (sem nome, e-mail, motivo ou comprovante).

### Testes e verificação

- Backend: 392 testes (403 nos não admin em todas as rotas, aprovar muda o
  status, recusar exige motivo, URL assinada só para admin, falha de e-mail
  não desfaz, reenvio do recusado, busca escapada, formato das respostas).
- Frontend: funções puras em `lib/admin.ts` e a estrutura da rota; 276 testes.
- No navegador (API simulada) em 390 e 1440 px: abas, busca com espera,
  paginação, confirmação, motivo obrigatório, conflito 409, aba com o
  comprovante, sem rolagem lateral e botões de 44 px.

### Pendências desta tela

- Colar a 0004 e o SQL de admin e cadastrar a chave do Resend (ordem acima).
- O cadastro ainda não pede telefone nem registro profissional.
- Minha Conta não mostra o motivo da recusa (ele vai só por e-mail).
- A tela e os e-mails ainda não foram testados com a API e o Resend de verdade.

## Frete (Melhor Envio) (18/11/2026)

Só PLANO. Nenhum código, migração ou variável foi criada. O módulo de frete NÃO
bloqueia nem é bloqueado pelo passo 12 (`pedidos`) até a parte da etiqueta (F7);
a cotação (F1 a F5) pode vir antes.

Fonte técnica: documentação oficial (docs.melhorenvio.com.br), lida em
18/11/2026: cotação, carrinho, status da etiqueta, sandbox, FAQ e permissões. O
que a documentação não deixa claro vira "teste no sandbox" (lista abaixo), não
suposição.

### Decisões da Juliana (16/11/2026)

1. **Sem frete grátis.** O cliente sempre paga o frete. O frete NUNCA entra no
   desconto do profissional (já era a decisão 4 da regra de preço): total do
   pedido = itens (com o desconto) + frete cheio.
2. **"Retirar na clínica (Rincão, SP)"**, grátis, como opção no checkout.
3. **Sem entrega local** (nenhuma opção própria de entrega na cidade).
4. **Correios e transportadoras do Melhor Envio**: o cliente escolhe, vendo o
   preço e o prazo de cada opção.
5. **Prazo de postagem: 1 dia útil após o pagamento.** O que o cliente vê é o
   prazo da transportadora + 1 dia útil (por exemplo, 3 a 4 dias úteis na
   cotação viram "4 a 5 dias úteis").
6. **Quem posta é a Bia.** Ela paga e imprime a etiqueta no PAINEL do Melhor
   Envio. O site nunca paga nem gera etiqueta.
7. **A clínica emite NF-e.** A Bia informa a chave da nota no painel antes de
   pagar a etiqueta (ver "Nota fiscal e declaração de conteúdo": isto tem um
   ponto a testar).
8. **Descartáveis pesados ou líquidos só têm retirada** (lista proposta abaixo,
   aguardando aprovação). Pedido com qualquer um deles só pode escolher retirada.

### Chaves e permissões

- `MELHOR_ENVIO_TOKEN` (Secret) e `MELHOR_ENVIO_AMBIENTE = producao`, já
  cadastradas pela Alexandra no projeto `healthinstituto-api`, só Production.
  Previews e o local NÃO têm essas chaves.
- O token tem só `cart-read`, `cart-write`, `orders-read`, `shipping-calculate`
  e `shipping-tracking`. NÃO tem `shipping-checkout`, `shipping-generate` nem
  `shipping-print`: o site não consegue pagar nem gerar etiqueta, nem por bug.
  O client do Melhor Envio no backend só conhece as 4 operações abaixo (lista
  fechada, com teste que falha se aparecer outra rota):

| Operação | Rota do Melhor Envio | Permissão |
| --- | --- | --- |
| Cotar | `POST /api/v2/me/shipment/calculate` | `shipping-calculate` |
| Pôr a etiqueta no carrinho | `POST /api/v2/me/cart` | `cart-write` |
| Conferir o carrinho (evitar duplicar) | `GET /api/v2/me/cart` | `cart-read` |
| Status e rastreio | `POST /api/v2/me/shipment/tracking` e `GET /api/v2/me/orders/:id` | `shipping-tracking`, `orders-read` |

- **Ambientes.** Produção: `https://melhorenvio.com.br`; sandbox:
  `https://sandbox.melhorenvio.com.br`. Desenvolvimento e testes usam SÓ o
  sandbox, com um token separado no `backend/.env` local (a Alexandra cria; fora
  do git). Nunca o de produção. Proteção no `config/env.ts`: com
  `NODE_ENV` diferente de `production`, `MELHOR_ENVIO_AMBIENTE=producao` faz a
  API se recusar a subir. O padrão sem variável é `sandbox`.
- **Cabeçalhos em toda chamada:** `Authorization: Bearer <token>`,
  `Accept: application/json`, `Content-Type: application/json` e o
  **`User-Agent` OBRIGATÓRIO** com o nome da aplicação e um e-mail de contato
  técnico: `Instituto Health (contato@healthinstituto.com.br)`.
- **Validade do token (atenção):** a documentação diz que o token tem prazo
  (a data fica dentro do próprio token, campo `exp`). Token expirado derruba a
  cotação e a etiqueta em silêncio. A Alexandra decodifica o token localmente
  (sem mostrar o valor), anota a data de validade aqui no plano e cria um
  lembrete 15 dias antes. O client trata `401 Unauthenticated` como "token
  inválido ou vencido": loga só isso e avisa a clínica por e-mail (Resend).
- **Limite de uso:** 250 requisições por minuto por usuário. A cotação é uma
  rota pública, então precisa do limite de tentativas por IP que já está na
  lista de pendências obrigatórias antes do lançamento.
- Sem `MELHOR_ENVIO_TOKEN` a API sobe normal: a cotação devolve só a retirada e
  loga um aviso (mesmo padrão do `RESEND_API_KEY`). O site nunca quebra por
  falta de frete.

### Fluxo

1. **Checkout.** Depois que o CEP preenche o endereço (ViaCEP, já funciona), o
   navegador chama `POST /api/frete/cotacao`. O servidor monta os volumes (peso
   e medidas), consulta o Melhor Envio e devolve as opções + "Retirar na
   clínica". O frete nunca vem do navegador.
2. **Criar o pedido** (passo 12). O navegador manda só a escolha
   (`{ tipo: 'envio', servicoId }` ou `{ tipo: 'retirada' }`). O servidor COTA DE
   NOVO, acha o serviço escolhido e grava o frete desse momento. Se o serviço não
   existir mais ou o preço mudou, responde 409 com as opções novas, para o cliente
   confirmar.
3. **Pedido pago** (passos 14 e 15). O servidor coloca a(s) etiqueta(s) no
   carrinho do Melhor Envio (`cart-write`) com remetente, destinatário, serviço
   escolhido, volumes e produtos. Falha aqui NUNCA desfaz o pagamento: marca o
   erro e avisa a clínica por e-mail.
4. **A Bia** abre o painel do Melhor Envio, informa a chave da NF-e, paga e
   imprime a etiqueta, e posta.
5. **Rastreio.** O servidor consulta o status (`shipping-tracking`) e mostra o
   código em Minha Conta. Quando todas as etiquetas estão postadas, o pedido
   passa a `enviado`; quando entregues, `entregue`.
6. **Retirada.** Sem etiqueta. O pedido pago fica à espera; a Bia marca como
   entregue (tela de admin da Fase 3; até lá, no Table Editor).

### Rotas

- `POST /api/frete/cotacao` (pública, `no-store`, protegida por
  `protegerOrigem`). Corpo: `{ cep: "14850000", itens: [{ sku, quantidade }] }`.
  Resposta:

```
{
  "soRetirada": false,
  "motivoSoRetirada": null,
  "opcoes": [
    { "servicoId": 1, "servico": "PAC", "transportadora": "Correios",
      "preco": 37.79, "prazoMinDias": 9, "prazoMaxDias": 10, "volumes": 1 }
  ],
  "retirada": { "disponivel": true, "enderecoCurto": "Clínica, Rincão, SP", "...": "..." },
  "freteIndisponivel": false
}
```

  `prazoMinDias` e `prazoMaxDias` já incluem o dia útil de postagem. O preço usa
  `custom_price` e o prazo usa `custom_delivery_range` do Melhor Envio (a
  documentação recomenda os campos `custom_*`: eles trazem os acréscimos de preço
  e de prazo que a Bia configurar no painel). Serviços que o Melhor Envio devolve
  com `error`, e os de preço nulo, são descartados. Ordem: preço crescente.
  Erros: 400 (CEP ou itens inválidos), 422 (sku inexistente, inativo ou sem
  peso). Se o Melhor Envio falhar, responde 200 com `opcoes: []`,
  `freteIndisponivel: true` e a retirada, para o cliente nunca ficar sem saída.
  Limites: no máximo 50 linhas e 99 unidades por linha.
- Dentro de `POST /api/pedidos` (passo 12): o campo `entrega`, como no fluxo
  acima. Para retirada, o endereço de entrega deixa de ser obrigatório (ver
  migração).
- `GET /api/pedidos/:id/rastreio` (dono do pedido ou admin): devolve, por
  etiqueta, status, código e link de rastreio. Atualiza com o Melhor Envio no
  máximo a cada 15 minutos por pedido (consulta sob demanda, sem Cron), e só
  enquanto houver etiqueta não entregue.
- Interna (sem rota HTTP): `criarEtiquetasNoCarrinho(pedidoId)`, chamada pela
  confirmação de pagamento.
- Admin (Fase 3, não agora): lista de pedidos pagos sem etiqueta paga, com a
  idade (a etiqueta no carrinho vence em 20 dias), "refazer etiqueta" e "marcar
  retirada concluída".

### Camadas e arquivos

- `backend/src/lib/melhorEnvio.client.ts`: único ponto que fala com o Melhor
  Envio. `fetch` com tempo limite de 8 s, cabeçalhos acima, lista fechada de
  rotas, erro tratado sem registrar corpo, token nem dados do destinatário.
  Sem repetição automática no POST do carrinho (não é idempotente).
- `backend/src/modules/frete/`: `frete.routes.ts`, `frete.controller.ts`,
  `frete.schemas.ts` (zod), `frete.service.ts` e funções puras para testar:
  `pesos.ts` (peso estimado), `embalagem.ts` (escolha de caixas e volumes),
  `regras.ts` (só retirada e prazo +1 dia útil) e `clinica.ts` (CEP de origem,
  endereço e remetente; dados não secretos).
- `backend/src/repositories/`: `logistica.repository.ts` (peso e só retirada por
  sku) e `envios.repository.ts` (etiquetas).
- `modules/notificacoes`: dois avisos novos por e-mail (Resend), para
  `contato@healthinstituto.com.br`: "Pedido pago, etiqueta não entrou no
  carrinho" e "Token do Melhor Envio inválido ou vencido". Falha de e-mail nunca
  quebra nada, como nos demais.
- `config/env.ts`: `MELHOR_ENVIO_TOKEN` (opcional) e `MELHOR_ENVIO_AMBIENTE`
  (`sandbox` | `producao`, padrão `sandbox`). Nomes entram no
  `backend/.env.example`, sem valor.
- Frontend (F6): `api.ts` ganha `frete.cotar`; o `Checkout.tsx` mostra as opções
  (escolha obrigatória), o "Retirar na clínica" e troca "Frete: A calcular" pelo
  valor. Nenhuma mensagem de frete grátis em lugar nenhum.

### Migração `0007_frete` (a criar; SQL mostrado à Alexandra antes do arquivo)

A `0006` é a de pagamentos, ainda não criada (a `0005` é o preço cheio dos
exclusivos, ver "Preço cheio dos exclusivos"). As duas mexem em `pedidos` em
colunas diferentes, então a ordem de colar não importa; a segunda a ser criada
confere a anterior.

- `produtos_logistica`: `sku` (PK, FK `produtos`), `peso_g integer` (1 a 30000),
  `origem_do_peso` (`estimado` | `medido`), `so_retirada boolean default false`,
  `updated_at`. Tabela à parte para o `seed:produtos` não precisar saber de
  logística. Carga por `npm run seed:logistica` (simulação por padrão e
  `--aplicar`, como os outros seeds): calcula o peso estimado e a regra de só
  retirada, e NUNCA sobrescreve linha `medido`.
- `pedidos`: `entrega_tipo` (`envio` | `retirada`, padrão `envio`); colunas
  `entrega_cep`, `entrega_rua`, `entrega_numero`, `entrega_bairro`,
  `entrega_cidade` e `entrega_estado` deixam de ser `not null`, com um `check`
  que as exige quando `entrega_tipo = 'envio'` (nome e telefone continuam
  obrigatórios nos dois, para avisar da retirada); `frete_servico_id integer`,
  `frete_prazo_min integer` e `frete_prazo_max integer` (o que foi mostrado ao
  cliente). `frete`, `frete_servico` e `codigo_rastreio` JÁ existem desde a
  `0002` e continuam: `frete_servico` guarda o rótulo ("Correios PAC" ou
  "Retirada na clínica").
- `etiquetas_envio` (uma linha por VOLUME, porque Correios, J&T e Loggi não
  aceitam vários volumes numa só chamada do carrinho: ver "Volumes"):
  `id`, `pedido_id` (FK, cascade), `volume_indice`, `volume jsonb` (altura,
  largura, comprimento em cm e peso em g), `melhor_envio_id text`, `protocolo
  text`, `status` (`pendente`, `no_carrinho`, `paga`, `gerada`, `postada`,
  `entregue`, `cancelada`, `expirada`, `erro`), `codigo_rastreio`,
  `consultado_em`, `erro text` (mensagem curta nossa, nunca o corpo da
  resposta), `created_at`, `updated_at`; único em (`pedido_id`,
  `volume_indice`).
- Em todas as tabelas novas: RLS ligado, nenhuma política e `revoke all` para
  `anon` e `authenticated` (regra da seção 9). Conferência em
  `database/conferencias/0007_frete.sql`.
- Não guarda o corpo das respostas do Melhor Envio nem documento de ninguém.

### Peso e medidas (o dado que falta)

Até a Bia medir, valem ESTIMATIVAS, sempre marcadas como `estimado`, que
cobrem 100% do catálogo para a cotação nunca travar:

- **Peso por produto, a partir do campo `tamanho`** (Tulípia). Fórmula
  provisória: conteúdo + 12% + tara do frasco ou pote (até 60 ml ou g: 35 g; até
  150: 50 g; até 300: 70 g; acima disso: 100 g; potes de 1 kg: 120 g).
  Exemplos: `50ml` dá 91 g; `300ml` dá 406 g; `1kg` dá 1240 g.
  Casos especiais: `N ampolas de Mml` (N x (M x 1,1 + 6 g) + 60 g de caixa);
  `3 sachês` (90 g); `1 un` (40 g, faixas de cabelo); `30g cada` (2 x 30 g + 60
  g); `kit` e `kit (3 itens)`: 37 produtos SEM peso inferível pelo tamanho. O
  peso do kit sai do número de itens (cerca de 230 g por item), que a Tulípia
  informa no nome do kit no site dela ("2 itens", "5 produtos"); proponho
  extrair essa contagem por script e conferir à mão.
- **Descartáveis** (52 variações): peso a partir da embalagem (por exemplo
  `Pacote 1 kg` = 1000 g; `Bobina aprox. 1,3 kg` = 1300 g; `Galão 5 L` = 5300 g;
  `Caixa com 100` de luvas = 450 g). Os que a embalagem não diz (caixas e
  pacotes "com N" de papel, copos, sacos) começam com um chute e são os
  primeiros da planilha da Bia.
- **Caixas padrão** (provisórias, para a Bia medir as reais):

| Caixa | Medidas (C x L x A) | Peso máximo de produtos | Peso da caixa vazia |
| --- | --- | --- | --- |
| Pequena | 20 x 15 x 10 cm | 1,0 kg | 100 g |
| Média | 30 x 22 x 15 cm | 3,0 kg | 200 g |
| Grande | 40 x 30 x 25 cm | 8,0 kg | 400 g |

  Respeitam os mínimos dos Correios (conferir no sandbox) e ficam num arquivo de
  configuração (`caixas.ts`), não no banco: são 3 linhas, e trocar é um commit.
- **Escolha dos volumes** (função pura, testada): cada unidade ocupa um volume
  estimado (peso x 1,6) e a caixa só se enche até 60%. Ordena do maior para o
  menor, usa a menor caixa em que tudo cabe (peso e volume); se nenhuma serve,
  fecha caixas Grandes e repete com o resto, e a última vira a menor que
  couber. Peso do volume = produtos + caixa vazia. A cotação vai no modo
  `volumes` (nós empacotamos), não no modo `products` (o Melhor Envio
  empacota), porque precisamos dos MESMOS volumes na hora do carrinho.
- **Planilha para a Bia** (`docs/frete-medidas.csv`, a gerar quando o plano for
  aprovado): duas abas em CSV.
  1. Caixas reais: `caixa;comprimento_cm;largura_cm;altura_cm;peso_vazia_g;
     peso_max_produtos_g`, com as 3 linhas acima para ela corrigir.
  2. Produtos: `sku;nome;tamanho;peso_estimado_g;peso_real_g;observacao`, com 201
     linhas e o estimado preenchido. Ela pesa na balança só o que estiver errado
     e começa pelos mais vendidos. O `seed:logistica` lê o CSV preenchido e marca
     `medido`.

### Descartáveis só com retirada (proposta para você aprovar)

Regra da Juliana: pesados ou líquidos (água sanitária, cloro, desinfetante, sabão
em pó, limpadores de 2 L ou mais). Aplicada à categoria "Higiene e limpeza", são
**13 skus**:

- Sabonete Líquido 5 L (3 fragrâncias):
  `desc-sabonete-liquido-5-l-erva-doce-28`,
  `desc-sabonete-liquido-5-l-frutas-vermelhas-29`,
  `desc-sabonete-liquido-5-l-pistache-30`
- Cloro Gel 5 L: `desc-cloro-gel-5-l-32`
- Desinfetante: `desc-desinfetante-2-l-33` (2 L) e
  `desc-desinfetante-5-l-algas-34` (5 L Algas)
- Sabão em Pó 800 g: `desc-sabao-em-po-multiacao-800-g-36` e
  `desc-sabao-em-po-primavera-800-g-37`
- Água Sanitária 5 L (3 marcas): `desc-agua-sanitaria-5-l-gopabo-38`,
  `desc-agua-sanitaria-5-l-harcclin-39`, `desc-agua-sanitaria-5-l-triex-40`
- Água Sanitária 2 L e 1 L: `desc-agua-sanitaria-2-l-41` e
  `desc-agua-sanitaria-1-l-42`

Ficam FORA (envio normal) e peço a sua confirmação:

- `desc-sabonete-liquido-500-ml-com-pump-ameixa-dourada-31` (500 ml, leve);
- `desc-limpador-perfumado-120-ml-35` (120 ml, bem abaixo de 2 L).

Pontos para decidir: (a) a Água Sanitária de **1 L** e o Sabão em Pó de **800 g**
são leves, mas entraram porque a Juliana citou "água sanitária" e "sabão em pó"
sem limite de tamanho; se ela quiser enviar esses, saem da lista; (b) não
incluí os pesados que não são líquidos (Bobinas Picotadas de 1,3 a 2,5 kg e
Sacos Plásticos Virgem de 1 kg), nem os volumosos e leves (Papel Toalha de 1000
folhas, Papel Higiênico de 16 rolos), que seguem por caixa Grande; me diga se
algum deve ser só retirada.

A regra vive em `produtos_logistica.so_retirada`, carregada pelo seed a partir
de uma lista de skus no código (`regras.ts`), com teste que falha se um sku da
lista deixar de existir.

### Volumes

Correios, J&T e Loggi não aceitam mais de um volume por chamada do carrinho:
cotação com N volumes vira N chamadas, e portanto N etiquetas e N códigos de
rastreio no mesmo pedido (por isso `etiquetas_envio` é uma linha por volume).
As caixas padrão existem justamente para a maioria dos pedidos caber em UM
volume. Pedidos com mais de um volume mostram, em Minha Conta, um rastreio por
volume.

### Nota fiscal e declaração de conteúdo (ponto a testar)

A clínica emite NF-e, então o envio é COMERCIAL: a documentação do carrinho
exige a chave em `options.invoice.key` e a inscrição estadual em
`from.state_register`. Mas a NF-e é emitida depois do pagamento, então o nosso
servidor não conhece a chave quando põe a etiqueta no carrinho. Desde 06/04/2026
a API também exige o campo `products` completo (nome, quantidade e valor
unitário, que vêm de `itens_pedido`, já com o desconto) por causa da DC-e.

Plano A (o que a Juliana descreveu): o servidor põe a etiqueta no carrinho SEM a
chave; a Bia informa a chave no painel antes de pagar. **Precisa ser testado no
sandbox:** o Melhor Envio aceita o carrinho sem a chave? Vira "declaração de
conteúdo" e depois dá para trocar por NF-e no painel? Plano B, se o teste falhar:
a Bia cola a chave numa tela nossa (admin, Fase 3) e só então o servidor põe a
etiqueta no carrinho já com `invoice.key`. O plano B muda a ordem do passo 3 do
fluxo, não o resto.

### Pontos que só o teste responde (sandbox: Correios e Jadlog, saldo fictício)

1. Carrinho aceito sem `invoice.key` (Plano A).
2. Cotação com vários `volumes`: o preço devolvido é a soma deles?
3. Medidas mínimas e máximas dos Correios para as 3 caixas.
4. Campo `agency`: é obrigatório para Latam Cargo, Azul Cargo e Buslog quando o
   token é gerado no painel (o nosso é). Combinar com a Bia quais transportadoras
   ela quer ativas na conta; as que exigem agência ficam desligadas até ela
   escolher a agência.
5. Duplicidade: se a chamada do carrinho cair no meio, o `GET /me/cart` (com a
   marca do pedido em `options.tags`) tem de achar a etiqueta antes de tentar de
   novo.
6. Formato do status (`posted`, `delivered`...) e do `tracking` no nosso fluxo.
7. Se o token do painel realmente funciona só com as 5 permissões que ele tem.

Limites que a documentação informa e o plano respeita: a etiqueta no carrinho
vence em 20 dias se não for paga (a Bia precisa pagar antes; o admin da Fase 3
mostra a idade); depois de paga, 20 dias para gerar; depois de gerada, 20 dias
(7 nos Correios) para postar. O sandbox simula só Correios e Jadlog, então o
código não pode ter regra específica de outras transportadoras além das duas
exceções documentadas (agência e volumes).

### Testes (vitest, Melhor Envio simulado; nunca chama a API real no CI)

- `embalagem` e `pesos` (puras): peso estimado por tipo de tamanho (ml, g, kg,
  ampolas, sachês, un, cada, kit com N itens); escolha da menor caixa; divisão em
  várias caixas; peso do volume com a caixa vazia; item sem peso é recusado.
- `regras`: pedido com qualquer sku só retirada vira `soRetirada` e a cotação
  nem chama o Melhor Envio; prazo + 1 dia útil; o frete não entra no desconto
  do profissional (junto ao módulo de pedidos: total = itens com desconto + frete
  cheio, em centavos).
- `POST /api/frete/cotacao` (supertest): CEP e itens inválidos; sku inexistente;
  ordenação por preço; serviço com `error` descartado; uso de `custom_price` e
  `custom_delivery_range`; preço enviado pelo navegador ignorado; sem token só a
  retirada; falha do Melhor Envio devolve 200 com `freteIndisponivel`; `no-store`;
  `protegerOrigem`.
- `melhorEnvio.client`: cabeçalhos (inclui o `User-Agent` exato), tempo limite,
  `401` vira "token inválido", NENHUMA rota fora da lista de 4 operações, token e
  dados do destinatário nunca aparecem em log nem em erro.
- `env`: `producao` fora de `production` não sobe; padrão `sandbox`.
- Etiqueta (F7): monta o corpo do carrinho (remetente, destinatário, `products`
  com valores já descontados, `volumes`, `tags`); uma chamada por volume nos
  Correios; não duplica quando a etiqueta já existe; falha marca `erro` e envia o
  aviso sem desfazer o pagamento; rastreio atualiza no máximo a cada 15 minutos e
  muda o status do pedido para `enviado` e `entregue`.
- Seed de logística: simulação não grava; nunca sobrescreve `medido`; a lista de
  só retirada só tem skus que existem.
- Teste manual no sandbox (roteiro, não automatizado), com o token de sandbox.

### Ordem proposta (um passo por vez, com a regra da seção 10)

- F1: este plano (aprovado) e o registro das decisões. Commit só da
  documentação.
- F2: migração `0007_frete` (SQL mostrado antes de criar o arquivo) e o
  `seed:logistica`, com a planilha da Bia gerada.
- F3: `melhorEnvio.client` + variáveis de ambiente + roteiro de testes no
  sandbox (responde os 7 pontos acima ANTES de seguir).
- F4: `pesos`, `embalagem` e `regras` (puras, com testes).
- F5: `POST /api/frete/cotacao`.
- F6: frontend do Checkout (opções, retirada e total com frete).
- F7: etiqueta no carrinho, depois do passo 14 (pagamento confirmado).
- F8: rastreio e Minha Conta.
- F9: admin de envios (Fase 3).

### O que falta de dados (lista)

1. **Endereço completo da clínica (Rincão, SP):** CEP de origem, rua, número,
   bairro, horário e telefone da retirada. Serve para o "Retirar na clínica" e
   para o remetente.
2. **Remetente do carrinho:** razão social, CNPJ, inscrição estadual (obrigatória
   no envio comercial; "ISENTO" se for o caso), telefone e e-mail.
3. **Medidas e pesos reais:** planilha da Bia (acima).
4. **Contagem de itens dos 37 kits** (a Tulípia informa; extraio por script).
5. **Transportadoras desejadas** e, se a Bia quiser Latam, Azul ou Buslog, a
   agência de postagem.
6. **Seguro:** declarar o valor dos produtos (`insurance_value` = soma dos itens
   pagos, sem o frete)? Aumenta o preço do frete em troca de ressarcimento em
   caso de extravio. Sugestão: declarar.
7. **Validade do token** de produção (data do `exp`), para o lembrete.
8. **Token do sandbox** no `backend/.env` (a Alexandra cria) e a conta sandbox
   com a documentação aceita.
9. **Aprovar a lista de 13 skus** (só retirada).
10. **Limite de tentativas** nas rotas públicas (já pendente; a cotação passa a
    ser mais uma que depende dele).
