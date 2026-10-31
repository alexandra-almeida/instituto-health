-- 0003: tabela `batimentos`, para o despertador do banco ter o que gravar.
--
-- Cole TUDO de uma vez no SQL Editor do Supabase. Roda em uma transação (tudo
-- ou nada) e pode ser repetido sem erro. NÃO insere nenhum dado: a linha única
-- nasce no primeiro disparo do cron (GET /api/cron/manter-ativo), que faz
-- upsert dela.
--
-- Por quê: o Supabase gratuito pausou o projeto duas vezes por pouca atividade,
-- mesmo com o cron lendo `perfis` uma vez por dia. A documentação não diz se
-- leitura conta como atividade nem qual é o limite. Então o cron passa a GRAVAR
-- (e depois ler) uma linha aqui, com mais frequência. Não há garantia de que
-- baste; a solução definitiva é o plano Pro (plano, seção 12).
--
-- Segurança, igual à 0001 e à 0002: RLS ligado e NENHUMA política para anon e
-- authenticated, mais `revoke all`. Só o backend acessa, com a chave secreta.

begin;

-- Uma única linha (id sempre 1); `ultimo_em` é a data do último disparo do cron
create table if not exists public.batimentos (
  id smallint primary key default 1,
  ultimo_em timestamptz not null default now(),
  constraint batimentos_linha_unica check (id = 1)
);

alter table public.batimentos enable row level security;

revoke all on table public.batimentos from anon, authenticated;

commit;
