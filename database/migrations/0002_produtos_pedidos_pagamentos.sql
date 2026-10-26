-- 0002: catálogo no banco, endereços, pedidos, itens, pagamentos e webhooks.
--
-- Cole TUDO de uma vez no SQL Editor do Supabase, DEPOIS da 0001 (usa a função
-- public.definir_updated_at e a tabela public.perfis). Roda em uma transação
-- (tudo ou nada) e pode ser repetido sem erro. NÃO insere nenhum dado: o
-- catálogo entra pela carga em database/seeds/.
--
-- Segurança, igual à 0001: RLS ligado e NENHUMA política para anon e
-- authenticated (acesso direto negado para todos), mais `revoke all` para não
-- depender de uma camada só. Só o backend acessa, com a chave secreta.
--
-- Valores sempre em numeric(10,2) (reais). Status e formas de pagamento são
-- text com check (e não enum), porque mudar um check depois é só uma migração
-- pequena, enquanto remover valor de enum é trabalhoso.

begin;

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------

-- Espelho, para o servidor, do que ele precisa saber de cada produto para
-- calcular um pedido: preço público e se é exclusivo de profissional. O sku é o
-- id congelado de frontend/src/data/tulipia-produtos.json (CLAUDE.md) e nunca
-- muda. Nome, categoria, fotos e textos continuam só no site.
create table if not exists public.produtos (
  sku text primary key check (char_length(btrim(sku)) > 0 and sku = btrim(sku)),
  nome text not null check (char_length(btrim(nome)) > 0),
  tamanho text not null default '',
  -- preço público; nulo nos exclusivos de profissional e em item sem preço
  preco numeric(10, 2) check (preco is null or preco >= 0),
  exclusivo_profissional boolean not null default false,
  -- false tira o produto da venda sem apagar o histórico dos pedidos antigos
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Regra de negócio: exclusivo de profissional nunca tem preço público
  constraint produtos_exclusivo_sem_preco_publico
    check (not exclusivo_profissional or preco is null)
);

-- Preço de profissional. Fica em tabela PRÓPRIA (e nunca no JSON nem no código
-- do site) para só sair do servidor para profissional aprovado. Quem preenche
-- é a carga a partir de uma planilha que NÃO vai para o git.
create table if not exists public.precos_profissionais (
  sku text primary key references public.produtos (sku) on delete cascade,
  preco numeric(10, 2) not null check (preco > 0),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Endereços salvos (mesmos campos do formulário do Checkout)
-- ---------------------------------------------------------------------------

-- cep e telefone guardam só dígitos (o service normaliza); estado em maiúsculas
create table if not exists public.enderecos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis (id) on delete cascade,
  nome_destinatario text not null check (char_length(btrim(nome_destinatario)) > 0),
  telefone text not null check (telefone ~ '^[0-9]{10,11}$'),
  cep text not null check (cep ~ '^[0-9]{8}$'),
  rua text not null,
  numero text not null,
  complemento text,
  bairro text not null,
  cidade text not null,
  estado text not null check (estado ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now()
);

create index if not exists enderecos_perfil_id_idx
  on public.enderecos (perfil_id);

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------

-- O endereço é COPIADO para o pedido (colunas entrega_*), não só referenciado,
-- para o histórico não mudar se a pessoa editar o endereço depois.
--
-- Preparado para decisões ainda em aberto, sem travar nelas:
--  * compra sem cadastro: perfil_id pode ser nulo e o e-mail fica SEMPRE no
--    pedido (também quando há conta). Se a conta for apagada, perfil_id vira
--    nulo e o pedido continua existindo (nota fiscal, histórico).
--  * frete real: frete é só o valor; frete_servico e codigo_rastreio ficam
--    nulos até haver transportadora.
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  -- Número para uso humano ("Pedido nº 1023"): sequencial, único e gerado pelo
  -- banco (o service nunca informa). Começa em 1001 para não parecer loja nova.
  -- O `id` (uuid) continua sendo a chave e o que vai nas URLs e nas relações.
  numero bigint generated always as identity (start with 1001) unique,
  perfil_id uuid references public.perfis (id) on delete set null,
  email text not null check (position('@' in email) > 1),
  -- qual tabela de preços o servidor usou (auditoria: preço profissional ou público)
  tabela_de_precos text not null check (tabela_de_precos in ('publico', 'profissional')),
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'pago', 'cancelado', 'enviado', 'entregue')),
  forma_pagamento text not null check (forma_pagamento in ('pix', 'credito', 'debito')),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  frete numeric(10, 2) not null default 0 check (frete >= 0),
  total numeric(10, 2) not null,
  frete_servico text,
  codigo_rastreio text,
  entrega_nome text not null check (char_length(btrim(entrega_nome)) > 0),
  entrega_telefone text not null check (entrega_telefone ~ '^[0-9]{10,11}$'),
  entrega_cep text not null check (entrega_cep ~ '^[0-9]{8}$'),
  entrega_rua text not null,
  entrega_numero text not null,
  entrega_complemento text,
  entrega_bairro text not null,
  entrega_cidade text not null,
  entrega_estado text not null check (entrega_estado ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pedidos_total_confere check (total = subtotal + frete)
);

create index if not exists pedidos_perfil_id_idx
  on public.pedidos (perfil_id, created_at desc);

-- nome, variacao e preco_unitario são COPIADOS do momento da compra: mudar o
-- catálogo depois não reescreve pedidos antigos. Apagar o pedido apaga os
-- itens; apagar um produto com pedidos é bloqueado (use ativo = false).
create table if not exists public.itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  sku text not null references public.produtos (sku) on delete restrict,
  nome text not null,
  variacao text,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10, 2) not null check (preco_unitario >= 0)
);

-- Uma linha por produto e variação em cada pedido (também serve de índice por
-- pedido_id)
create unique index if not exists itens_pedido_linha_unica
  on public.itens_pedido (pedido_id, sku, coalesce(variacao, ''));

-- ---------------------------------------------------------------------------
-- Pagamentos (PagBank)
-- ---------------------------------------------------------------------------

-- Um pedido pode ter mais de uma tentativa (cartão recusado e depois Pix). Dado
-- financeiro não some em cascata: apagar um pedido com pagamento é bloqueado.
-- status é o NOSSO andamento; pagbank_status guarda o texto cru do PagBank, para
-- conferir sem depender de adivinhar o mapeamento. Detalhes de Pix e cartão
-- (QR Code, validade) entram numa migração própria depois de lida a
-- documentação do PagBank.
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete restrict,
  pagbank_order_id text,
  pagbank_charge_id text,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_analise', 'pago', 'recusado', 'cancelado', 'estornado')),
  pagbank_status text,
  valor numeric(10, 2) not null check (valor > 0),
  forma text not null check (forma in ('pix', 'credito', 'debito')),
  parcelas smallint not null default 1 check (parcelas >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pagamentos_parcelas_so_no_credito
    check (forma = 'credito' or parcelas = 1)
);

create index if not exists pagamentos_pedido_id_idx
  on public.pagamentos (pedido_id);

-- Os identificadores do PagBank não se repetem (só valem quando preenchidos)
create unique index if not exists pagamentos_pagbank_order_id_idx
  on public.pagamentos (pagbank_order_id) where pagbank_order_id is not null;
create unique index if not exists pagamentos_pagbank_charge_id_idx
  on public.pagamentos (pagbank_charge_id) where pagbank_charge_id is not null;

-- Avisos do PagBank já recebidos, para não processar o mesmo aviso duas vezes.
-- evento_id é um texto livre e único: o service decide como montá-lo (o id do
-- aviso, ou charge + status) conforme o que a documentação do PagBank trouxer.
create table if not exists public.eventos_webhook (
  id uuid primary key default gen_random_uuid(),
  evento_id text not null unique check (char_length(evento_id) > 0),
  recebido_em timestamptz not null default now(),
  processado_em timestamptz
);

-- ---------------------------------------------------------------------------
-- updated_at em dia (função criada na 0001)
-- ---------------------------------------------------------------------------

drop trigger if exists produtos_definir_updated_at on public.produtos;
create trigger produtos_definir_updated_at
  before update on public.produtos
  for each row execute function public.definir_updated_at();

drop trigger if exists precos_profissionais_definir_updated_at
  on public.precos_profissionais;
create trigger precos_profissionais_definir_updated_at
  before update on public.precos_profissionais
  for each row execute function public.definir_updated_at();

drop trigger if exists pedidos_definir_updated_at on public.pedidos;
create trigger pedidos_definir_updated_at
  before update on public.pedidos
  for each row execute function public.definir_updated_at();

drop trigger if exists pagamentos_definir_updated_at on public.pagamentos;
create trigger pagamentos_definir_updated_at
  before update on public.pagamentos
  for each row execute function public.definir_updated_at();

-- ---------------------------------------------------------------------------
-- Segurança: RLS ligado, nenhuma política, nenhum privilégio para anon e
-- authenticated (a chave secreta do backend não é afetada)
-- ---------------------------------------------------------------------------

alter table public.produtos enable row level security;
alter table public.precos_profissionais enable row level security;
alter table public.enderecos enable row level security;
alter table public.pedidos enable row level security;
alter table public.itens_pedido enable row level security;
alter table public.pagamentos enable row level security;
alter table public.eventos_webhook enable row level security;

revoke all on table public.produtos from anon, authenticated;
revoke all on table public.precos_profissionais from anon, authenticated;
revoke all on table public.enderecos from anon, authenticated;
revoke all on table public.pedidos from anon, authenticated;
revoke all on table public.itens_pedido from anon, authenticated;
revoke all on table public.pagamentos from anon, authenticated;
revoke all on table public.eventos_webhook from anon, authenticated;

-- A sequência que gera pedidos.numero também recebe privilégios por padrão no
-- Supabase: tira de anon e authenticated
revoke all on sequence public.pedidos_numero_seq from anon, authenticated;

commit;
