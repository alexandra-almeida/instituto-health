-- Conferência da migração 0002. Rode DEPOIS de colar a migração.
-- NÃO é uma migração: só lê o catálogo do banco, não altera nada.
--
-- Uma linha por verificação. Todas as linhas devem mostrar ok = true. Se
-- alguma mostrar false (ou vazio), me avise qual.

select n, verificacao, coalesce(ok, false) as ok
from (
  values
    (1, 'as 7 tabelas existem',
      (select count(*) from pg_class c
        join pg_namespace s on s.oid = c.relnamespace
        where s.nspname = 'public' and c.relkind = 'r'
          and c.relname in ('produtos', 'precos_profissionais', 'enderecos',
                            'pedidos', 'itens_pedido', 'pagamentos',
                            'eventos_webhook')) = 7),
    (2, 'RLS ligado nas 7 tabelas',
      (select count(*) from pg_class c
        join pg_namespace s on s.oid = c.relnamespace
        where s.nspname = 'public' and c.relrowsecurity
          and c.relname in ('produtos', 'precos_profissionais', 'enderecos',
                            'pedidos', 'itens_pedido', 'pagamentos',
                            'eventos_webhook')) = 7),
    (3, 'nenhuma política nas 7 tabelas',
      not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename in ('produtos', 'precos_profissionais', 'enderecos',
                            'pedidos', 'itens_pedido', 'pagamentos',
                            'eventos_webhook')
      )),
    (4, 'anon e authenticated sem privilégio nas 7 tabelas',
      not exists (
        select 1 from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name in ('produtos', 'precos_profissionais', 'enderecos',
                             'pedidos', 'itens_pedido', 'pagamentos',
                             'eventos_webhook')
          and grantee in ('anon', 'authenticated')
      )),
    (5, 'produtos: sku é a chave primária',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.produtos') and contype = 'p'
      )),
    (6, 'produtos: exclusivo de profissional nunca tem preço público',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.produtos')
          and conname = 'produtos_exclusivo_sem_preco_publico'
      )),
    (7, 'precos_profissionais.sku aponta para produtos com on delete cascade',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.precos_profissionais')
          and contype = 'f'
          and confrelid = to_regclass('public.produtos')
          and confdeltype = 'c'
      )),
    (8, 'enderecos.perfil_id aponta para perfis com on delete cascade',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.enderecos')
          and contype = 'f'
          and confrelid = to_regclass('public.perfis')
          and confdeltype = 'c'
      )),
    (9, 'pedidos.perfil_id aponta para perfis com on delete set null',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.pedidos')
          and contype = 'f'
          and confrelid = to_regclass('public.perfis')
          and confdeltype = 'n'
      )),
    (10, 'pedidos: total = subtotal + frete',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.pedidos')
          and conname = 'pedidos_total_confere'
      )),
    (11, 'itens_pedido.pedido_id aponta para pedidos com on delete cascade',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.itens_pedido')
          and contype = 'f'
          and confrelid = to_regclass('public.pedidos')
          and confdeltype = 'c'
      )),
    (12, 'itens_pedido.sku aponta para produtos com on delete restrict',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.itens_pedido')
          and contype = 'f'
          and confrelid = to_regclass('public.produtos')
          and confdeltype = 'r'
      )),
    (13, 'itens_pedido: uma linha por pedido, sku e variação',
      exists (
        select 1 from pg_indexes
        where schemaname = 'public' and tablename = 'itens_pedido'
          and indexname = 'itens_pedido_linha_unica'
      )),
    (14, 'pagamentos.pedido_id aponta para pedidos com on delete restrict',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.pagamentos')
          and contype = 'f'
          and confrelid = to_regclass('public.pedidos')
          and confdeltype = 'r'
      )),
    (15, 'pagamentos: ids do PagBank únicos quando preenchidos',
      (select count(*) from pg_indexes
        where schemaname = 'public' and tablename = 'pagamentos'
          and indexname in ('pagamentos_pagbank_order_id_idx',
                            'pagamentos_pagbank_charge_id_idx')) = 2),
    (16, 'eventos_webhook.evento_id é único',
      exists (
        select 1 from pg_constraint
        where conrelid = to_regclass('public.eventos_webhook')
          and contype = 'u'
      )),
    (17, 'triggers de updated_at nas 4 tabelas que têm a coluna',
      (select count(*) from pg_trigger
        where not tgisinternal
          and tgname in ('produtos_definir_updated_at',
                         'precos_profissionais_definir_updated_at',
                         'pedidos_definir_updated_at',
                         'pagamentos_definir_updated_at')) = 4),
    (18, 'a função definir_updated_at (da 0001) existe',
      to_regprocedure('public.definir_updated_at()') is not null),
    (19, 'pedidos.numero: identidade always, única, a partir de 1001 e sequência sem acesso para anon e authenticated',
      exists (
        select 1 from pg_attribute a
        where a.attrelid = to_regclass('public.pedidos')
          and a.attname = 'numero'
          and a.attidentity = 'a'
      )
      and exists (
        select 1 from pg_constraint c
        where c.conrelid = to_regclass('public.pedidos')
          and c.contype = 'u'
          and c.conkey = array[(
            select a.attnum from pg_attribute a
            where a.attrelid = to_regclass('public.pedidos')
              and a.attname = 'numero'
          )]
      )
      and (select s.start_value from pg_sequences s
            where s.schemaname = 'public'
              and s.sequencename = 'pedidos_numero_seq') = 1001
      and not has_sequence_privilege(
        'anon', 'public.pedidos_numero_seq', 'USAGE,SELECT,UPDATE')
      and not has_sequence_privilege(
        'authenticated', 'public.pedidos_numero_seq', 'USAGE,SELECT,UPDATE'))
) as v (n, verificacao, ok)
order by n;

-- Consulta B (opcional, rode separada): colunas das 7 tabelas, para você ler
-- com os olhos os tipos, nulos e defaults.
--
-- select table_name, ordinal_position as pos, column_name, data_type,
--        is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('produtos', 'precos_profissionais', 'enderecos',
--                      'pedidos', 'itens_pedido', 'pagamentos',
--                      'eventos_webhook')
-- order by table_name, ordinal_position;
