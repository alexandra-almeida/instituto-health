-- Conferência da migração 0005. Rode DEPOIS de colar a migração.
-- NÃO é uma migração: só lê o catálogo do banco, não altera nada e não mostra
-- nenhum preço.
--
-- Uma linha por verificação. Todas as linhas devem mostrar ok = true. Se
-- alguma mostrar false (ou vazio), me avise qual.

select n, verificacao, coalesce(ok, false) as ok
from (
  values
    (1, 'produtos tem a coluna preco_cheio (numeric 10,2, aceita nulo)',
      exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'produtos'
          and column_name = 'preco_cheio'
          and data_type = 'numeric'
          and numeric_precision = 10 and numeric_scale = 2
          and is_nullable = 'YES'
      )),
    (2, 'regra: preco_cheio precisa ser maior que zero',
      -- O Postgres guarda a regra normalizada, com o zero escrito
      -- "(0)::numeric": CHECK (((preco_cheio IS NULL) OR (preco_cheio >
      -- (0)::numeric))). Por isso a busca é por padrão, não pelo texto exato.
      exists (
        select 1 from pg_constraint
        where conrelid = 'public.produtos'::regclass and contype = 'c'
          and pg_get_constraintdef(oid) ~* 'preco_cheio\s*>\s*\(?0'
      )),
    (3, 'regra: preço público OU preço cheio, nunca os dois',
      exists (
        select 1 from pg_constraint
        where conrelid = 'public.produtos'::regclass
          and conname = 'produtos_um_preco_so'
      )),
    (4, 'regra: preço cheio só em exclusivo de profissional',
      exists (
        select 1 from pg_constraint
        where conrelid = 'public.produtos'::regclass
          and conname = 'produtos_preco_cheio_so_exclusivo'
      )),
    (5, 'a regra antiga do preço público continua (exclusivo sem preço público)',
      exists (
        select 1 from pg_constraint
        where conrelid = 'public.produtos'::regclass
          and conname = 'produtos_exclusivo_sem_preco_publico'
      )),
    (6, 'nenhum produto tinha preço cheio antes da carga (coluna nasce vazia)',
      -- Depois do seed:precos-cheios --aplicar esta linha passa a mostrar false
      -- de propósito; rode a conferência ANTES da carga.
      not exists (select 1 from public.produtos where preco_cheio is not null)),
    (7, 'o catálogo não mudou (201 produtos, 82 exclusivos)',
      (select count(*) = 201 from public.produtos)
      and (select count(*) = 82 from public.produtos where exclusivo_profissional)),
    (8, 'anon e authenticated continuam sem privilégio em produtos',
      not exists (
        select 1 from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'produtos'
          and grantee in ('anon', 'authenticated')
      ))
) as v(n, verificacao, ok)
order by n;
