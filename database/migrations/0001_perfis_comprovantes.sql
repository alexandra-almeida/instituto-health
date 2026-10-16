-- 0001: perfis, comprovantes_profissionais e bucket de comprovantes.
--
-- Cole TUDO de uma vez no SQL Editor do Supabase. Roda em uma transação (tudo
-- ou nada) e pode ser repetido sem erro. Só depende de objetos que o próprio
-- Supabase já traz: auth.users e storage.buckets.
--
-- Segurança: RLS ligado e NENHUMA política para anon e authenticated, ou seja,
-- acesso direto negado para todos. Só o backend acessa, com a chave secreta
-- (service role), que ignora o RLS. Ver docs/plano-backend.md, seção 4.

begin;

-- Mantém updated_at em dia. Genérica de propósito: as tabelas de pedidos e
-- pagamentos (migração 0002) reaproveitam esta mesma função. O search_path
-- vazio evita que um objeto de outro schema "sequestre" o now().
create or replace function public.definir_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- Perfil de cada usuário do Supabase Auth. Apagar o usuário apaga o perfil.
-- tipo, status e is_admin NUNCA vêm do corpo da requisição do usuário: quem
-- define é o service do backend (homecare nasce 'aprovado', profissional
-- nasce 'pendente'). O default 'pendente' é só uma rede de segurança: um
-- insert que esqueça o status nunca nasce aprovado.
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) > 0),
  tipo text not null check (tipo in ('profissional', 'homecare')),
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'recusado')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists perfis_definir_updated_at on public.perfis;
create trigger perfis_definir_updated_at
  before update on public.perfis
  for each row
  execute function public.definir_updated_at();

-- Registro dos comprovantes enviados por profissionais. O arquivo em si fica
-- no bucket; aqui só o caminho. Reenvio cria uma linha nova (o usuário não
-- altera nem apaga um comprovante enviado). Apagar o perfil apaga as linhas.
create table if not exists public.comprovantes_profissionais (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis (id) on delete cascade,
  storage_path text not null unique,
  enviado_em timestamptz not null default now()
);

create index if not exists comprovantes_profissionais_perfil_id_idx
  on public.comprovantes_profissionais (perfil_id);

-- RLS ligado e nenhuma política criada (de propósito, ver cabeçalho).
alter table public.perfis enable row level security;
alter table public.comprovantes_profissionais enable row level security;

-- Cinto e suspensório: o Supabase concede privilégios a anon e authenticated
-- nas tabelas novas do schema public. Sem o RLS isso já seria perigoso, então
-- tiramos também os privilégios, para a negação não depender de uma só camada.
-- A chave secreta (service role) não é afetada.
revoke all on table public.perfis from anon, authenticated;
revoke all on table public.comprovantes_profissionais from anon, authenticated;

-- Bucket privado dos comprovantes: só os tipos do plano e no máximo 10 MB
-- (10 * 1024 * 1024 bytes). Sem políticas em storage.objects: o envio usa URL
-- assinada gerada pelo backend, e a leitura também passa só pelo backend.
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'comprovantes-profissionais',
  'comprovantes-profissionais',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/heic', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

commit;
