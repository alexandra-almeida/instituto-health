-- Conferência da migração 0001. Rode DEPOIS de colar a migração.
-- NÃO é uma migração: só lê o catálogo do banco, não altera nada.
--
-- Consulta A: uma linha por verificação. Todas as linhas devem mostrar
-- ok = true. Se alguma mostrar false (ou vazio), me avise qual.

select n, verificacao, coalesce(ok, false) as ok
from (
  values
    (1, 'tabela perfis existe',
      to_regclass('public.perfis') is not null),
    (2, 'tabela comprovantes_profissionais existe',
      to_regclass('public.comprovantes_profissionais') is not null),
    (3, 'RLS ligado em perfis',
      (select relrowsecurity from pg_class
        where oid = to_regclass('public.perfis'))),
    (4, 'RLS ligado em comprovantes_profissionais',
      (select relrowsecurity from pg_class
        where oid = to_regclass('public.comprovantes_profissionais'))),
    (5, 'nenhuma política nas duas tabelas',
      not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename in ('perfis', 'comprovantes_profissionais')
      )),
    (6, 'nenhuma política em storage.objects ligada ao bucket',
      not exists (
        select 1 from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and (coalesce(qual, '') ilike '%comprovantes-profissionais%'
            or coalesce(with_check, '') ilike '%comprovantes-profissionais%')
      )),
    (7, 'anon e authenticated sem privilégio nas duas tabelas',
      not exists (
        select 1 from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name in ('perfis', 'comprovantes_profissionais')
          and grantee in ('anon', 'authenticated')
      )),
    (8, 'perfis.id aponta para auth.users com on delete cascade',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.perfis')
          and contype = 'f'
          and confrelid = to_regclass('auth.users')
          and confdeltype = 'c'
      )),
    (9, 'comprovantes.perfil_id aponta para perfis com on delete cascade',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.comprovantes_profissionais')
          and contype = 'f'
          and confrelid = to_regclass('public.perfis')
          and confdeltype = 'c'
      )),
    (10, 'trigger de updated_at em perfis',
      exists (
        select 1 from pg_trigger
        where tgrelid = to_regclass('public.perfis')
          and tgname = 'perfis_definir_updated_at'
          and not tgisinternal
      )),
    (11, 'bucket comprovantes-profissionais existe',
      exists (
        select 1 from storage.buckets
        where id = 'comprovantes-profissionais'
      )),
    (12, 'bucket é privado',
      (select not public from storage.buckets
        where id = 'comprovantes-profissionais')),
    (13, 'bucket com limite de 10 MB (10485760 bytes)',
      (select file_size_limit = 10485760 from storage.buckets
        where id = 'comprovantes-profissionais')),
    (14, 'bucket aceita exatamente jpeg, png, heic e pdf',
      (select allowed_mime_types @> array['image/jpeg', 'image/png',
                                          'image/heic', 'application/pdf']
          and allowed_mime_types <@ array['image/jpeg', 'image/png',
                                          'image/heic', 'application/pdf']
        from storage.buckets
        where id = 'comprovantes-profissionais'))
) as v (n, verificacao, ok)
order by n;

-- Consulta B (opcional, rode separada): colunas das duas tabelas, para você
-- ler com os olhos os tipos, nulos e defaults.
--
-- select table_name, ordinal_position as pos, column_name, data_type,
--        is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('perfis', 'comprovantes_profissionais')
-- order by table_name, ordinal_position;
