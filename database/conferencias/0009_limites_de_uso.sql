-- Conferência da migração 0009. Rode DEPOIS de colar a migração.
-- NÃO é uma migração: só lê o catálogo do banco, não altera nada.
--
-- Uma linha por verificação. Todas as linhas devem mostrar ok = true. Se
-- alguma mostrar false (ou vazio), me avise qual.

select n, verificacao, coalesce(ok, false) as ok
from (
  values
    (1, 'a tabela limites_de_uso existe, com chave, janela_inicio e contagem',
      to_regclass('public.limites_de_uso') is not null
      and (select count(*) = 3 from information_schema.columns
            where table_schema = 'public' and table_name = 'limites_de_uso'
              and column_name in ('chave', 'janela_inicio', 'contagem'))),
    (2, 'RLS ligado em limites_de_uso',
      (select c.relrowsecurity from pg_class c
        where c.oid = to_regclass('public.limites_de_uso'))),
    (3, 'nenhuma política em limites_de_uso',
      not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'limites_de_uso'
      )),
    (4, 'anon e authenticated sem privilégio em limites_de_uso',
      not exists (
        select 1 from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'limites_de_uso'
          and grantee in ('anon', 'authenticated')
      )),
    (5, 'as 2 funções existem e só o service_role executa',
      to_regprocedure('public.registrar_tentativa(text, integer, integer)') is not null
      and to_regprocedure('public.limpar_limites_vencidos(integer)') is not null
      and has_function_privilege('service_role',
        'public.registrar_tentativa(text, integer, integer)', 'execute')
      and has_function_privilege('service_role',
        'public.limpar_limites_vencidos(integer)', 'execute')
      and not has_function_privilege('anon',
        'public.registrar_tentativa(text, integer, integer)', 'execute')
      and not has_function_privilege('authenticated',
        'public.registrar_tentativa(text, integer, integer)', 'execute')
      and not has_function_privilege('anon',
        'public.limpar_limites_vencidos(integer)', 'execute')
      and not has_function_privilege('authenticated',
        'public.limpar_limites_vencidos(integer)', 'execute')),
    (6, 'as funções usam search_path vazio (sem atalho de esquema)',
      (select count(*) = 2 from pg_proc
        where oid in (
          to_regprocedure('public.registrar_tentativa(text, integer, integer)'),
          to_regprocedure('public.limpar_limites_vencidos(integer)')
        )
        and exists (
          select 1 from unnest(proconfig) as c where c like 'search_path=%'
        )))
) as v(n, verificacao, ok)
order by n;
