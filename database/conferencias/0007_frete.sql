-- Conferência da migração 0007. Rode DEPOIS de colar a migração.
-- NÃO é uma migração: só lê o catálogo do banco, não altera nada.
--
-- Uma linha por verificação. Todas as linhas devem mostrar ok = true. Se
-- alguma mostrar false (ou vazio), me avise qual.

select n, verificacao, coalesce(ok, false) as ok
from (
  values
    (1, 'as 2 tabelas novas existem',
      (select count(*) from pg_class c
        join pg_namespace s on s.oid = c.relnamespace
        where s.nspname = 'public' and c.relkind = 'r'
          and c.relname in ('produtos_logistica', 'etiquetas_envio')) = 2),
    (2, 'RLS ligado nas 2 tabelas novas',
      (select count(*) from pg_class c
        join pg_namespace s on s.oid = c.relnamespace
        where s.nspname = 'public' and c.relrowsecurity
          and c.relname in ('produtos_logistica', 'etiquetas_envio')) = 2),
    (3, 'nenhuma política nas 2 tabelas novas',
      not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename in ('produtos_logistica', 'etiquetas_envio')
      )),
    (4, 'anon e authenticated sem privilégio nas 2 tabelas novas',
      not exists (
        select 1 from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name in ('produtos_logistica', 'etiquetas_envio')
          and grantee in ('anon', 'authenticated')
      )),
    (5, 'produtos_logistica: sku é a chave e aponta para produtos',
      exists (
        select 1 from pg_constraint
        where conrelid = 'public.produtos_logistica'::regclass and contype = 'p'
      )
      and exists (
        select 1 from pg_constraint
        where conrelid = 'public.produtos_logistica'::regclass and contype = 'f'
          and confrelid = 'public.produtos'::regclass
      )),
    (6, 'produtos_logistica tem peso_g, origem_do_peso e so_retirada',
      (select count(*) = 3 from information_schema.columns
        where table_schema = 'public' and table_name = 'produtos_logistica'
          and column_name in ('peso_g', 'origem_do_peso', 'so_retirada'))),
    (7, 'pedidos ganhou entrega_tipo, frete_servico_id e os dois prazos',
      (select count(*) = 4 from information_schema.columns
        where table_schema = 'public' and table_name = 'pedidos'
          and column_name in ('entrega_tipo', 'frete_servico_id',
                              'frete_prazo_min', 'frete_prazo_max'))),
    (8, 'os 6 campos de endereço de pedidos aceitam nulo (retirada)',
      (select count(*) = 6 from information_schema.columns
        where table_schema = 'public' and table_name = 'pedidos'
          and column_name in ('entrega_cep', 'entrega_rua', 'entrega_numero',
                              'entrega_bairro', 'entrega_cidade',
                              'entrega_estado')
          and is_nullable = 'YES')),
    (9, 'nome e telefone da entrega continuam obrigatórios',
      (select count(*) = 2 from information_schema.columns
        where table_schema = 'public' and table_name = 'pedidos'
          and column_name in ('entrega_nome', 'entrega_telefone')
          and is_nullable = 'NO')),
    (10, 'as 3 regras novas de pedidos existem',
      (select count(*) = 3 from pg_constraint
        where conrelid = 'public.pedidos'::regclass
          and conname in ('pedidos_entrega_envio_com_endereco',
                          'pedidos_retirada_sem_frete',
                          'pedidos_prazo_do_frete_confere'))),
    (11, 'a regra antiga total = subtotal + frete continua',
      exists (
        select 1 from pg_constraint
        where conrelid = 'public.pedidos'::regclass
          and conname = 'pedidos_total_confere'
      )),
    (12, 'etiquetas_envio: uma linha por volume (único por pedido e volume)',
      exists (
        select 1 from pg_constraint
        where conrelid = 'public.etiquetas_envio'::regclass
          and conname = 'etiquetas_envio_um_por_volume'
      )),
    (13, 'etiquetas_envio apaga junto com o pedido (cascade)',
      exists (
        select 1 from pg_constraint
        where conrelid = 'public.etiquetas_envio'::regclass and contype = 'f'
          and confrelid = 'public.pedidos'::regclass and confdeltype = 'c'
      )),
    (14, 'updated_at em dia nas 2 tabelas novas (gatilhos)',
      (select count(*) = 2 from pg_trigger
        where tgname in ('produtos_logistica_definir_updated_at',
                         'etiquetas_envio_definir_updated_at')
          and not tgisinternal)),
    (15, 'nenhum pedido existente foi alterado (todos seguem como envio)',
      not exists (select 1 from public.pedidos where entrega_tipo <> 'envio'))
) as v(n, verificacao, ok)
order by n;
