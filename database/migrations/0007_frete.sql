-- 0007: frete (Melhor Envio). Ver "Frete (Melhor Envio)" no plano.
-- Cole inteiro no SQL Editor do Supabase. Depois rode
-- database/conferencias/0007_frete.sql.
--
-- O que faz (nenhum dado existente é alterado):
--  1) produtos_logistica: peso por produto, se é líquido (a Bia precisa de
--     embalagem vedada) e uma válvula "só retirada" (carregadas depois pelo
--     seed:logistica, com peso ESTIMADO até a Bia medir);
--  2) pedidos: tipo de entrega (envio ou retirada na clínica) e o que foi
--     mostrado ao cliente (serviço e prazo); o endereço de entrega deixa de ser
--     obrigatório na RETIRADA;
--  3) etiquetas_envio: uma linha por VOLUME (Correios, J&T e Loggi não aceitam
--     vários volumes numa só chamada do carrinho do Melhor Envio).
-- Depende da migração 0002 (pedidos e produtos). Pode ser colada antes ou
-- depois das migrações 0005 e 0006: não tocam nas mesmas colunas.

begin;

-- ---------------------------------------------------------------------------
-- 1) Logística por produto
-- ---------------------------------------------------------------------------
-- Tabela à parte para o seed:produtos não precisar saber de logística.
-- origem_do_peso: 'estimado' (calculado pelo tamanho) ou 'medido' (a Bia
-- pesou); a carga NUNCA sobrescreve um peso 'medido'.
create table if not exists public.produtos_logistica (
  sku text primary key references public.produtos (sku) on delete cascade,
  peso_g integer not null check (peso_g between 1 and 30000),
  origem_do_peso text not null default 'estimado'
    check (origem_do_peso in ('estimado', 'medido')),
  -- Líquido (água sanitária, cloro gel, desinfetante, sabonete líquido 5 L...):
  -- só avisa a Bia que o envio precisa de embalagem vedada. NÃO restringe a
  -- venda: todos os produtos podem ser enviados (decisão de 18/11/2026).
  liquido boolean not null default false,
  -- Válvula, sempre false por padrão: só liga se algum transportador recusar um
  -- produto específico no futuro (aí o pedido com ele só pode ser retirada).
  so_retirada boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists produtos_logistica_definir_updated_at
  on public.produtos_logistica;
create trigger produtos_logistica_definir_updated_at
  before update on public.produtos_logistica
  for each row execute function public.definir_updated_at();

-- ---------------------------------------------------------------------------
-- 2) Pedidos: envio ou retirada
-- ---------------------------------------------------------------------------
alter table public.pedidos
  add column if not exists entrega_tipo text not null default 'envio'
    check (entrega_tipo in ('envio', 'retirada')),
  -- o que foi mostrado ao cliente na cotação (id do serviço no Melhor Envio e o
  -- prazo já com o dia útil de postagem); nulos na retirada
  add column if not exists frete_servico_id integer,
  add column if not exists frete_prazo_min integer
    check (frete_prazo_min is null or frete_prazo_min >= 0),
  add column if not exists frete_prazo_max integer
    check (frete_prazo_max is null or frete_prazo_max >= 0);

-- Na retirada ninguém precisa informar endereço (nome e telefone continuam
-- obrigatórios, para avisar que o pedido está pronto). As regras de formato que
-- já existem (CEP com 8 dígitos, estado com 2 letras) seguem valendo quando o
-- campo é informado.
alter table public.pedidos
  alter column entrega_cep drop not null,
  alter column entrega_rua drop not null,
  alter column entrega_numero drop not null,
  alter column entrega_bairro drop not null,
  alter column entrega_cidade drop not null,
  alter column entrega_estado drop not null;

-- (Em Postgres não existe "add constraint if not exists": confere antes.)
do $$
begin
  -- Envio exige o endereço inteiro (o complemento continua opcional)
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.pedidos'::regclass
      and conname = 'pedidos_entrega_envio_com_endereco'
  ) then
    alter table public.pedidos
      add constraint pedidos_entrega_envio_com_endereco
      check (
        entrega_tipo = 'retirada'
        or (
          entrega_cep is not null and entrega_rua is not null
          and entrega_numero is not null and entrega_bairro is not null
          and entrega_cidade is not null and entrega_estado is not null
        )
      );
  end if;

  -- Retirada é grátis e não tem serviço nem prazo de transportadora
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.pedidos'::regclass
      and conname = 'pedidos_retirada_sem_frete'
  ) then
    alter table public.pedidos
      add constraint pedidos_retirada_sem_frete
      check (
        entrega_tipo <> 'retirada'
        or (
          frete = 0 and frete_servico_id is null
          and frete_prazo_min is null and frete_prazo_max is null
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.pedidos'::regclass
      and conname = 'pedidos_prazo_do_frete_confere'
  ) then
    alter table public.pedidos
      add constraint pedidos_prazo_do_frete_confere
      check (
        frete_prazo_min is null or frete_prazo_max is null
        or frete_prazo_min <= frete_prazo_max
      );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3) Etiquetas (uma por volume)
-- ---------------------------------------------------------------------------
-- Guarda só o que precisamos para acompanhar: nunca o corpo das respostas do
-- Melhor Envio, nem documento ou endereço de ninguém. `erro` é uma mensagem
-- curta NOSSA (sem dados do cliente).
create table if not exists public.etiquetas_envio (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  volume_indice smallint not null check (volume_indice >= 1),
  -- altura, largura e comprimento em cm e peso em g do volume enviado
  volume jsonb not null,
  melhor_envio_id text,
  protocolo text,
  status text not null default 'pendente'
    check (status in (
      'pendente', 'no_carrinho', 'paga', 'gerada', 'postada', 'entregue',
      'cancelada', 'expirada', 'erro'
    )),
  codigo_rastreio text,
  consultado_em timestamptz,
  erro text check (erro is null or char_length(erro) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint etiquetas_envio_um_por_volume unique (pedido_id, volume_indice)
);

create index if not exists etiquetas_envio_status_idx
  on public.etiquetas_envio (status, created_at);

drop trigger if exists etiquetas_envio_definir_updated_at
  on public.etiquetas_envio;
create trigger etiquetas_envio_definir_updated_at
  before update on public.etiquetas_envio
  for each row execute function public.definir_updated_at();

-- ---------------------------------------------------------------------------
-- Segurança das tabelas novas (regra da seção 9 do plano)
-- ---------------------------------------------------------------------------
alter table public.produtos_logistica enable row level security;
alter table public.etiquetas_envio enable row level security;

revoke all on table public.produtos_logistica from anon, authenticated;
revoke all on table public.etiquetas_envio from anon, authenticated;

commit;
