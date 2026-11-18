-- 0005: preço cheio dos produtos exclusivos de profissional.
-- Cole inteiro no SQL Editor do Supabase. Depois rode
-- database/conferencias/0005_preco_cheio_exclusivos.sql.
--
-- Por que uma coluna nova: `preco` é o preço PÚBLICO e a regra
-- `produtos_exclusivo_sem_preco_publico` (migração 0002) exige que exclusivo de
-- profissional tenha `preco` nulo. O preço cheio do exclusivo é CONFIDENCIAL
-- (nunca vai para o site) e só o servidor lê, para calcular o pedido do
-- profissional aprovado (30% sobre o preço cheio, ver o plano). Por isso fica
-- numa coluna à parte, sem afrouxar a regra do preço público.
--
-- Nenhum dado é alterado: a coluna nasce nula. Os valores entram depois, pelo
-- `npm run seed:precos-cheios` (simulação por padrão).

begin;

alter table public.produtos
  add column if not exists preco_cheio numeric(10, 2)
    check (preco_cheio is null or preco_cheio > 0);

comment on column public.produtos.preco_cheio is
  'Preço cheio do exclusivo de profissional (confidencial; nunca no site). Nulo = sem preço, o produto não pode ser vendido.';

-- Um produto tem preço público OU preço cheio de exclusivo, nunca os dois.
-- (Em Postgres não existe "add constraint if not exists": confere antes.)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.produtos'::regclass
      and conname = 'produtos_um_preco_so'
  ) then
    alter table public.produtos
      add constraint produtos_um_preco_so
      check (preco is null or preco_cheio is null);
  end if;

  -- Preço cheio só existe em produto exclusivo de profissional.
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.produtos'::regclass
      and conname = 'produtos_preco_cheio_so_exclusivo'
  ) then
    alter table public.produtos
      add constraint produtos_preco_cheio_so_exclusivo
      check (preco_cheio is null or exclusivo_profissional);
  end if;
end
$$;

commit;
