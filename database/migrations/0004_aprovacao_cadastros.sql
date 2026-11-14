-- 0004: aprovação de cadastros (tela /admin/cadastros).
-- Cole inteiro no SQL Editor do Supabase ANTES de subir o backend novo.
-- Depois rode database/conferencias/0004_aprovacao_cadastros.sql.

begin;

-- Dados que a tela mostra. email é CÓPIA de auth.users (busca e listagem):
-- se um dia existir troca de e-mail, atualizar esta coluna junto.
alter table public.perfis
  add column if not exists email text,
  add column if not exists telefone text,
  add column if not exists registro_profissional text;

update public.perfis p
   set email = lower(u.email)
  from auth.users u
 where u.id = p.id and p.email is null;

create index if not exists perfis_tipo_status_criado_idx
  on public.perfis (tipo, status, created_at desc);

-- Histórico das decisões (recusa, reenvio e aprovação ficam todos)
create table if not exists public.avaliacoes_perfil (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis (id) on delete cascade,
  decisao text not null check (decisao in ('aprovado', 'recusado')),
  motivo text,
  avaliador_id uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  constraint avaliacoes_perfil_motivo_check check (
    (decisao = 'aprovado' and motivo is null)
    or (decisao = 'recusado' and motivo is not null
        and char_length(btrim(motivo)) between 3 and 300)
  )
);
create index if not exists avaliacoes_perfil_perfil_id_idx
  on public.avaliacoes_perfil (perfil_id, criado_em desc);

alter table public.avaliacoes_perfil enable row level security;
revoke all on table public.avaliacoes_perfil from anon, authenticated;

-- Decide sobre um profissional PENDENTE e grava o histórico, tudo ou nada.
-- false = não estava pendente (ou não é profissional): nada mudou.
create or replace function public.avaliar_perfil(
  p_perfil uuid, p_decisao text, p_motivo text, p_avaliador uuid
) returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_linhas integer;
begin
  if p_decisao not in ('aprovado', 'recusado') then
    raise exception 'decisao invalida';
  end if;
  update public.perfis
     set status = p_decisao
   where id = p_perfil and tipo = 'profissional' and status = 'pendente';
  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then
    return false;
  end if;
  insert into public.avaliacoes_perfil (perfil_id, decisao, motivo, avaliador_id)
  values (p_perfil, p_decisao, p_motivo, p_avaliador);
  return true;
end;
$$;

revoke all on function public.avaliar_perfil(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.avaliar_perfil(uuid, text, text, uuid)
  to service_role;

commit;
