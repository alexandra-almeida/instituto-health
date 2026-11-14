-- Conferência da migração 0004. Rode DEPOIS de colar a migração.
-- NÃO é uma migração: só lê o catálogo do banco, não altera nada.
--
-- Uma linha por verificação. Todas as linhas devem mostrar ok = true. Se
-- alguma mostrar false (ou vazio), me avise qual.

select n, verificacao, coalesce(ok, false) as ok
from (
  values
    (1, 'perfis tem as colunas email, telefone e registro_profissional',
      (select count(*) = 3 from information_schema.columns
        where table_schema = 'public' and table_name = 'perfis'
          and column_name in ('email', 'telefone', 'registro_profissional'))),
    (2, 'todo perfil que tem usuário no Auth ficou com e-mail preenchido',
      not exists (
        select 1 from public.perfis p
        join auth.users u on u.id = p.id
        where p.email is null and u.email is not null
      )),
    (3, 'índice por tipo, situação e data existe',
      exists (
        select 1 from pg_indexes
        where schemaname = 'public' and tablename = 'perfis'
          and indexname = 'perfis_tipo_status_criado_idx'
      )),
    (4, 'a tabela avaliacoes_perfil existe',
      to_regclass('public.avaliacoes_perfil') is not null),
    (5, 'RLS ligado em avaliacoes_perfil',
      (select c.relrowsecurity from pg_class c
        where c.oid = to_regclass('public.avaliacoes_perfil'))),
    (6, 'nenhuma política em avaliacoes_perfil',
      not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'avaliacoes_perfil'
      )),
    (7, 'anon e authenticated sem privilégio em avaliacoes_perfil',
      not exists (
        select 1 from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'avaliacoes_perfil'
          and grantee in ('anon', 'authenticated')
      )),
    (8, 'regra do motivo (aprovado sem motivo, recusado com 3 a 300) existe',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.avaliacoes_perfil')
          and conname = 'avaliacoes_perfil_motivo_check'
      )),
    (9, 'a função avaliar_perfil existe',
      to_regprocedure('public.avaliar_perfil(uuid, text, text, uuid)')
        is not null),
    (10, 'só o service_role executa avaliar_perfil',
      has_function_privilege('service_role',
        'public.avaliar_perfil(uuid, text, text, uuid)', 'execute')
      and not has_function_privilege('anon',
        'public.avaliar_perfil(uuid, text, text, uuid)', 'execute')
      and not has_function_privilege('authenticated',
        'public.avaliar_perfil(uuid, text, text, uuid)', 'execute'))
) as v(n, verificacao, ok)
order by n;
