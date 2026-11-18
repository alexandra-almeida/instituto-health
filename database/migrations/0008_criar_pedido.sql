-- 0008: função que cria o pedido e os itens de uma vez só (passo 12 do plano).
-- Cole inteiro no SQL Editor do Supabase DEPOIS da 0007 (usa as colunas
-- entrega_tipo, frete_servico_id e os prazos). Depois rode
-- database/conferencias/0008_criar_pedido.sql.
--
-- Por que uma função: o cliente do Supabase não tem transação. Com a função, o
-- pedido e os itens entram juntos ou nenhum entra (um pedido sem itens nunca
-- existe). Quem calcula os valores é o backend (preço sempre do servidor); a
-- função só grava. As regras da tabela (total = subtotal + frete, retirada sem
-- frete, endereço completo no envio) continuam valendo e recusam o que estiver
-- errado.
--
-- Só o service_role executa (o backend); anon e authenticated não.

begin;

create or replace function public.criar_pedido(p_pedido jsonb, p_itens jsonb)
returns table (r_id uuid, r_numero bigint)
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_numero bigint;
begin
  if jsonb_typeof(p_itens) is distinct from 'array'
     or jsonb_array_length(p_itens) = 0 then
    raise exception 'pedido sem itens';
  end if;

  insert into public.pedidos (
    perfil_id, email, tabela_de_precos, forma_pagamento,
    subtotal, frete, total,
    frete_servico, frete_servico_id, frete_prazo_min, frete_prazo_max,
    entrega_tipo, entrega_nome, entrega_telefone,
    entrega_cep, entrega_rua, entrega_numero, entrega_complemento,
    entrega_bairro, entrega_cidade, entrega_estado
  ) values (
    nullif(p_pedido ->> 'perfil_id', '')::uuid,
    p_pedido ->> 'email',
    p_pedido ->> 'tabela_de_precos',
    p_pedido ->> 'forma_pagamento',
    (p_pedido ->> 'subtotal')::numeric,
    (p_pedido ->> 'frete')::numeric,
    (p_pedido ->> 'total')::numeric,
    nullif(p_pedido ->> 'frete_servico', ''),
    nullif(p_pedido ->> 'frete_servico_id', '')::integer,
    nullif(p_pedido ->> 'frete_prazo_min', '')::integer,
    nullif(p_pedido ->> 'frete_prazo_max', '')::integer,
    p_pedido ->> 'entrega_tipo',
    p_pedido ->> 'entrega_nome',
    p_pedido ->> 'entrega_telefone',
    nullif(p_pedido ->> 'entrega_cep', ''),
    nullif(p_pedido ->> 'entrega_rua', ''),
    nullif(p_pedido ->> 'entrega_numero', ''),
    nullif(p_pedido ->> 'entrega_complemento', ''),
    nullif(p_pedido ->> 'entrega_bairro', ''),
    nullif(p_pedido ->> 'entrega_cidade', ''),
    nullif(p_pedido ->> 'entrega_estado', '')
  )
  returning public.pedidos.id, public.pedidos.numero into v_id, v_numero;

  insert into public.itens_pedido (
    pedido_id, sku, nome, variacao, quantidade, preco_unitario
  )
  select v_id, i.sku, i.nome, nullif(i.variacao, ''), i.quantidade,
         i.preco_unitario
  from jsonb_to_recordset(p_itens) as i (
    sku text, nome text, variacao text, quantidade integer,
    preco_unitario numeric
  );

  return query select v_id, v_numero;
end;
$$;

revoke all on function public.criar_pedido(jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.criar_pedido(jsonb, jsonb) to service_role;

commit;
