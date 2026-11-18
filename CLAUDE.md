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

## E-mail

- Desde 14/11/2026 o Supabase Auth envia por SMTP próprio: Resend com o domínio `healthinstituto.com.br` verificado (região São Paulo, `sa-east-1`), DKIM, SPF e DMARC (`p=none`) no Registro.br; `smtp.resend.com:465`, remetente "Instituto Health" <naoresponda@healthinstituto.com.br>. A credencial do SMTP fica só no painel do Supabase.
- Modelos em português com `{{ .Token }}` (código de 6 dígitos, sem link): Confirm signup e Reset password. Os HTML em `docs/emails/` são só referência: qualquer mudança é feita no painel do Supabase (Authentication > Emails) e a cópia é atualizada depois.
- `contato@healthinstituto.com.br` encaminha para o Gmail da clínica pelo Forward Email (MX `mx1`/`mx2.forwardemail.net` e TXT `forward-email` no Registro.br). O recebimento pelo Resend fica DESLIGADO para não conflitar.
- Aviso de novo comprovante (tela de aprovação, ainda não feita): `RESEND_API_KEY` no projeto `healthinstituto-api`, só Production e Sensitive, cadastrada pela Alexandra. Nunca no chat, no git ou no frontend.

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
- `frontend/src/pages/AdminCadastros.tsx` e `frontend/src/components/admin/` — tela `/admin/cadastros` (aprovar profissionais e consultar Home Care), só para admin
- `frontend/src/data/procedimentos.ts` — 28 procedimentos (texto clínico da Juliana; não reescrever)
- `frontend/src/data/contact.ts` — WhatsApp e Instagram oficiais

## O que ainda é simulado

Cadastro, confirmação de e-mail, reenvio de código, login, redefinição de senha, envio do comprovante profissional e a página Minha Conta (`/minha-conta`, com reenvio do comprovante e Sair) já chamam o backend de verdade, por `frontend/src/lib/api.ts` (o arquivo do comprovante vai direto para uma URL assinada do Storage, nunca pelo corpo de uma chamada ao backend, e fica só em memória no navegador). O SMTP próprio (Resend) está ativo desde 14/11/2026 e o teste real de cadastro com e-mail real foi aprovado (ver seção "E-mail"). Os pontos que ainda faltam estão marcados com `TODO(backend)`:

- `frontend/src/pages/Checkout.tsx` — confirmar pedido; pagamento (Pix, crédito, débito) e frete são só interface. O CEP já usa o ViaCEP de verdade. "Até 3x sem juros" é valor de exemplo.

## Regras de negócio

- Preço profissional e preço cheio de exclusivo NUNCA vão no código do frontend nem no JSON do site (os exclusivos continuam com `preco` nulo lá). Vêm do servidor só para profissional aprovado, por `GET /api/produtos/precos-profissionais`.
- O repositório do GitHub é PÚBLICO (a Alexandra vai torná-lo privado): nenhum preço confidencial, planilha, chave ou segredo entra no git, nem em código, teste, log ou documento. Planilhas ficam em `database/seeds/dados/`, ignorado pelo git.
- Produtos com `exclusivoProfissional` ficam com preço oculto e compra desabilitada no modo Home Care.
- Cartão (decidido em 09/11/2026: a Rede não tem página de pagamento hospedada, então os dados do cartão PASSAM pelo nosso backend). Regras obrigatórias para TODO código de pagamento:
  1. Número do cartão, validade e CVV só em memória, durante a requisição; nunca gravados em banco, log, erro, Sentry ou analytics.
  2. Logs e erros mascaram o cartão (no máximo os 4 últimos dígitos); nunca registrar o corpo inteiro da requisição de pagamento.
  3. Só HTTPS; a rota de pagamento não aceita GET nem cache (`Cache-Control: no-store`).
  4. Salvar cartão do cliente só via tokenização da Rede, nunca por conta própria.
  5. Fluxo 3DS: o pedido precisa do estado "aguardando autenticação" (o cliente vai ao banco e volta); o impacto na migration 0006 está no plano (seção 7), e a 0006 ainda não foi criada.
- Credenciais da Rede: `REDE_PV`, `REDE_CHAVE_INTEGRACAO` e `REDE_AMBIENTE` (`sandbox` | `producao`) só como variáveis de ambiente do projeto da API na Vercel, coladas pela própria Juliana. A chave de integração NUNCA vai para chat, git, e-mail ou frontend, e o valor não aparece em resposta, log nem documento.
- SKU: todo produto de `frontend/src/data/tulipia-produtos.json` tem um campo `sku` fixo e único, que é o `id` do produto (URL `/tulipia/produto/:slug`, chave do carrinho, favoritos salvos no navegador e, no futuro, o banco). Produto novo entra com sku próprio, adicionado no FINAL da lista, e o sku de um produto existente NUNCA é alterado, mesmo que o nome, o tamanho ou a posição mudem. Sku novo segue o padrão `nome-tamanho-N` em minúsculas e sem acentos, com N = número do próximo índice livre, e não pode repetir nenhum existente.
- Descartáveis para clínicas: cada VARIAÇÃO tem sku próprio `desc-nome-da-variação-N` (prefixo `desc-` para nunca colidir com a Tulípia), congelado como os demais: nunca muda e novos entram no FIM de `descartaveis.json` (o script `npm run descartaveis` já faz isso). Preço único, sem preço de profissional. Marca e embalagem "A CONFIRMAR" ficam nulas, nunca aparecem no site. No carrinho, `productId` é o sku da variação. Fotos: arquivo em `frontend/src/assets/descartaveis/` com o slug do produto no nome (`luva-de-vinil-sem-po-vabene-m.webp`: slug do produto, mais `-` e a variação para uma foto por tamanho; sem a variação, uma foto para o produto inteiro) e `npm run descartaveis` liga sozinho; tamanho sem foto (PP) mostra a do P; `_reservas/` guarda foto que ainda não deve aparecer; foto que serve a mais de um produto entra em `FOTOS_COMPARTILHADAS` no importador; variação sem foto (fragrância) mostra a da primeira que tem; são as fotos oficiais dos fabricantes, usadas pelo Instituto como representante, que compra direto do fabricante. Produto renomeado no CSV precisa entrar em `RENOMEADOS` no importador, senão o sku muda.
- Regra de preço do profissional, decidida com a Juliana em 16/11/2026 e ainda NÃO implementada (detalhes, fórmula e exemplos no plano): profissional APROVADO pode comprar os exclusivos e tem 30% de desconto só sobre os produtos Tulípia do pedido; descartáveis (`desc-`) não têm desconto e o frete é cobrado cheio; não soma com promoção: por item vale o MAIOR desconto entre o preço promocional vigente e 30% sobre o preço CHEIO (nunca 30% sobre o promocional), calculado no servidor a partir do preço cheio (Niacine+ 149,00 com promo 104,30 fica 104,30; Resilience 139,00 com promo 125,10 fica 97,30). No card exclusivo o aprovado vê o botão de comprar normal; o desconto aparece no carrinho e no checkout. Cliente comum compra sem cadastro e sem desconto. Em aberto: a tabela com o preço cheio dos 82 exclusivos (a Juliana vai mandar), se `precos_profissionais` perde a função e o preço promocional para o cliente comum. Não construir o módulo `pedidos` antes disso.
- Catálogo no banco (passo 10): o JSON do site continua sendo a fonte do catálogo e do preço público; o servidor calcula os pedidos com a cópia na tabela `produtos`. Depois de adicionar produto ou mudar nome, tamanho, preço público ou `exclusivoProfissional` no JSON (da Tulípia ou dos descartáveis; o seed lê os dois), rode em `backend/`: `npm run seed:produtos` (simulação) e, com o resumo conferido, `npm run seed:produtos -- --aplicar`. Sem isso o servidor recusa o item. A carga nunca apaga produto nem mexe em `ativo`. O preço cheio dos exclusivos só existe no banco (coluna `produtos.preco_cheio`, migração 0005; nunca no JSON nem no código do site): entra por `npm run seed:precos-cheios` (simulação por padrão, `--aplicar` só com a aprovação da Alexandra), a partir de `database/seeds/dados/precos-exclusivos.csv` (colunas `categoria;produto;tamanho;preco_cheio;sku`), que fica fora do git e NUNCA é commitado; preço vazio = produto sem preço, não pode ser vendido. A tabela `precos_profissionais` e o `npm run seed:precos-profissionais` seguem parados até a Juliana confirmar se perdem a função (o preço do profissional é 30% sobre o preço cheio).

## Frete (Melhor Envio)

- Decidido com a Juliana em 16/11/2026, ainda NÃO implementado (plano completo, rotas, migração `0007_frete`, testes e dados que faltam em `docs/plano-backend.md`, seção "Frete (Melhor Envio)"). Não escrever código de frete sem ler a seção.
- Regras: SEM frete grátis (o cliente sempre paga) e o frete NUNCA entra no desconto do profissional; opção "Retirar na clínica (Rincão, SP)", grátis; sem entrega local; mostrar Correios e transportadoras do Melhor Envio com preço e prazo, e o cliente escolhe; prazo mostrado = prazo da transportadora + 1 dia útil de postagem; quem posta é a Bia, que paga e imprime a etiqueta no PAINEL do Melhor Envio; a clínica emite NF-e e a Bia informa a chave antes de pagar a etiqueta (ponto a testar no sandbox); descartáveis pesados ou líquidos só têm retirada (lista de 13 skus `desc-` proposta no plano, aguardando aprovação).
- O site NUNCA paga nem gera etiqueta. O token de produção só tem `cart-read`, `cart-write`, `orders-read`, `shipping-calculate` e `shipping-tracking` (sem `shipping-checkout`, `shipping-generate` nem `shipping-print`), e o client do Melhor Envio só conhece rotas dessa lista.
- Variáveis (só Production na Vercel, projeto `healthinstituto-api`): `MELHOR_ENVIO_TOKEN` (Secret) e `MELHOR_ENVIO_AMBIENTE` (`sandbox` | `producao`). Valores NUNCA no chat, git, log ou frontend. Desenvolvimento e testes usam SÓ o sandbox, com token separado no `backend/.env` local; nunca o de produção.
- Toda chamada ao Melhor Envio leva o cabeçalho `User-Agent` com o nome do app e o e-mail de contato (`Instituto Health (contato@healthinstituto.com.br)`); sem ele a API recusa.
- O servidor monta os volumes (peso e medidas) e calcula o frete; preço do navegador é ignorado e o frete é cotado de novo ao criar o pedido. Até a Bia medir: caixas padrão (pequena, média, grande) e peso estimado pelo campo `tamanho`, marcados como `estimado`.
- Correios, J&T e Loggi não aceitam vários volumes numa chamada do carrinho: um volume, uma etiqueta, um código de rastreio. O token do painel expira (a data está dentro do token): anotar a validade no plano e lembrar antes de vencer.

## Tela de cadastros (admin)

- `/admin/cadastros`: Profissionais (abas Pendentes, Aprovados e Recusados; aprovar e recusar só em Pendentes) e Home Care (só consulta). Busca por nome ou e-mail, 20 por página, mais recentes primeiro. Detalhes, rotas e decisões no plano ("Tela de cadastros (admin)").
- Só `perfis.is_admin = true`: o backend confere o banco a cada chamada em todas as rotas `/api/admin` (`exigirAdmin`). `ehAdmin` no `/api/auth/eu` é só dica de tela. Não existe tela para virar admin: é SQL colado pela Alexandra.
- A migração `0004_aprovacao_cadastros` (colunas `email`, `telefone` e `registro_profissional` em `perfis`, histórico `avaliacoes_perfil` e a função `avaliar_perfil`) PRECISA ser colada no Supabase ANTES do push, senão cadastro e tela quebram. Pagamentos virou a `0006` (a `0005` é o preço cheio dos exclusivos) e o frete, a `0007`.
- `perfis.email` é uma cópia do e-mail de `auth.users`: se um dia existir troca de e-mail, atualizar essa coluna junto.
- Comprovante: o admin só recebe URL assinada de 5 minutos, nunca o arquivo. E-mails (Resend, `RESEND_API_KEY`) nunca desfazem uma decisão se falharem.

## Pendências (aguardando a Juliana)

- Frete: transportadora DECIDIDA em 16/11/2026 (Melhor Envio, ver seção "Frete"); faltam endereço da clínica, remetente, pesos e medidas e a aprovação da lista de descartáveis só com retirada. O gateway já foi decidido: Rede (e.Rede, desde 26/10/2026; antes era o PagBank). Resposta da Rede em 09/11/2026: PV de e-commerce criado (110115600) e condições comerciais em até 2 dias úteis; falta a Juliana gerar a chave de integração no portal da Rede (login master) e colá-la na Vercel, e contratar 3DS 2.0 e tokenização. Ainda pendente: como obter as credenciais de sandbox (ver plano, seção 7).
- Conteúdo: "Jato de Plasma" incompleto (`completo: false`), fotos, valor e duração dos procedimentos, detalhamento dos cursos
- Descartáveis: confirmar marca e embalagem dos itens "A CONFIRMAR" (as 4 embalagens ainda sem confirmação, dos Lençóis Hospitalares e dos Sacos de Lixo de 30 e 50 L, são OBRIGATÓRIAS antes do lançamento; e a pergunta: a Luva Nitrílica Rosa é vendida em G?), fotos e revisão dos textos do bloco de atacado e licitações (lista completa no plano)

## Fases

1. Frontend completo — concluída
2. Backend: pagamento, envio e cadastro real
3. Admin: estoque, pedidos, nota fiscal
4. Agendamentos, financeiro e cursos no admin
