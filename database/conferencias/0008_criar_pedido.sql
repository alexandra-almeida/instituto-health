-- Conferência da migração 0008. Rode DEPOIS de colar a migração.
-- NÃO é uma migração: só lê o catálogo do banco, não altera nada (não cria
-- nenhum pedido).
--
-- Uma linha por verificação. Todas as linhas devem mostrar ok = true. Se
-- alguma mostrar false (ou vazio), me avise qual.

select n, verificacao, coalesce(ok, false) as ok
from (
  values
    (1, 'a função criar_pedido(jsonb, jsonb) existe',
      to_regprocedure('public.criar_pedido(jsonb, jsonb)') is not null),
    (2, 'só o service_role executa a função',
      has_function_privilege('service_role',
        'public.criar_pedido(jsonb, jsonb)', 'execute')
      and not has_function_privilege('anon',
        'public.criar_pedido(jsonb, jsonb)', 'execute')
      and not has_function_privilege('authenticated',
        'public.criar_pedido(jsonb, jsonb)', 'execute')),
    (3, 'a função usa search_path vazio (sem atalho de esquema)',
      exists (
        select 1 from pg_proc
        where oid = to_regprocedure('public.criar_pedido(jsonb, jsonb)')
          and exists (
            select 1 from unnest(proconfig) as c where c like 'search_path=%'
          )
      )),
    (4, 'a migração 0007 já foi colada (coluna entrega_tipo existe)',
      exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'pedidos'
          and column_name = 'entrega_tipo'
      )),
    (5, 'nenhum pedido foi criado por esta migração',
      (select count(*) = 0 from public.pedidos))
) as v(n, verificacao, ok)
order by n;
