-- Conferência da migração 0003. Rode DEPOIS de colar a migração.
-- NÃO é uma migração: só lê o catálogo do banco, não altera nada.
--
-- Uma linha por verificação. Todas as linhas devem mostrar ok = true. Se
-- alguma mostrar false (ou vazio), me avise qual.

select n, verificacao, coalesce(ok, false) as ok
from (
  values
    (1, 'a tabela batimentos existe',
      to_regclass('public.batimentos') is not null),
    (2, 'RLS ligado em batimentos',
      (select c.relrowsecurity from pg_class c
        where c.oid = to_regclass('public.batimentos'))),
    (3, 'nenhuma política em batimentos',
      not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'batimentos'
      )),
    (4, 'anon e authenticated sem privilégio em batimentos',
      not exists (
        select 1 from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'batimentos'
          and grantee in ('anon', 'authenticated')
      )),
    (5, 'id é a chave primária e só aceita o valor 1 (linha única)',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.batimentos') and contype = 'p'
      )
      and exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.batimentos')
          and conname = 'batimentos_linha_unica'
      )),
    (6, 'ultimo_em é timestamptz e não aceita nulo',
      exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'batimentos'
          and column_name = 'ultimo_em'
          and data_type = 'timestamp with time zone'
          and is_nullable = 'NO'
      ))
) as v(n, verificacao, ok)
order by n;
