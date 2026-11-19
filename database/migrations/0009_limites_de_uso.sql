-- 0009: limite de tentativas por IP (cotação de frete, criação de pedido e as
-- próximas rotas públicas). Ver "Limite de tentativas por IP" no plano.
-- Cole inteiro no SQL Editor do Supabase. Depois rode
-- database/conferencias/0009_limites_de_uso.sql.
--
-- A Vercel não garante a mesma instância entre requisições, então o contador
-- mora no banco. A chave é um HASH (o IP nunca é guardado em claro): quem calcula
-- o hash, com um segredo do servidor, é o backend. Só o service_role acessa.

begin;

create table if not exists public.limites_de_uso (
  chave text primary key check (char_length(chave) between 8 and 128),
  janela_inicio timestamptz not null default now(),
  contagem integer not null default 0 check (contagem >= 0),
  atualizado_em timestamptz not null default now()
);

create index if not exists limites_de_uso_janela_idx
  on public.limites_de_uso (janela_inicio);

alter table public.limites_de_uso enable row level security;
revoke all on table public.limites_de_uso from anon, authenticated;

-- Registra uma tentativa de forma atômica (uma só chamada, sem corrida). Devolve
-- se passou do limite e em quantos segundos a janela recomeça. Janela fixa: ela
-- reinicia quando passa o tempo desde o início.
create or replace function public.registrar_tentativa(
  p_chave text, p_limite integer, p_janela_segundos integer
) returns table (r_excedeu boolean, r_espera_segundos integer)
language plpgsql
set search_path = ''
as $$
declare
  v_contagem integer;
  v_inicio timestamptz;
begin
  if p_limite < 1 or p_janela_segundos < 1 then
    raise exception 'limite ou janela invalidos';
  end if;

  insert into public.limites_de_uso as l (chave, janela_inicio, contagem)
  values (p_chave, now(), 1)
  on conflict (chave) do update
    set contagem = case
          when l.janela_inicio <= now() - make_interval(secs => p_janela_segundos)
            then 1 else l.contagem + 1 end,
        janela_inicio = case
          when l.janela_inicio <= now() - make_interval(secs => p_janela_segundos)
            then now() else l.janela_inicio end,
        atualizado_em = now()
  returning l.contagem, l.janela_inicio into v_contagem, v_inicio;

  return query select
    v_contagem > p_limite,
    greatest(1, ceil(extract(epoch from
      (v_inicio + make_interval(secs => p_janela_segundos) - now())))::integer);
end;
$$;

-- Apaga as janelas vencidas (chamada pela rotina agendada que já existe)
create or replace function public.limpar_limites_vencidos(p_idade_segundos integer)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_apagadas integer;
begin
  delete from public.limites_de_uso
   where janela_inicio < now() - make_interval(secs => p_idade_segundos);
  get diagnostics v_apagadas = row_count;
  return v_apagadas;
end;
$$;

revoke all on function public.registrar_tentativa(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.registrar_tentativa(text, integer, integer)
  to service_role;
revoke all on function public.limpar_limites_vencidos(integer)
  from public, anon, authenticated;
grant execute on function public.limpar_limites_vencidos(integer)
  to service_role;

commit;
