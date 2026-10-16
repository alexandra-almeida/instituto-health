# database

Tudo o que é banco de dados (Supabase) fica aqui.

- `migrations/`: scripts SQL que criam e alteram tabelas, políticas e buckets.
  Um arquivo por mudança, com numeração em ordem (`0001_...sql`, `0002_...sql`).
  Cada migração é colada manualmente no SQL Editor do Supabase, uma por vez e
  na ordem numérica. Não usamos a CLI do Supabase.
- `seeds/`: scripts de carga de dados, como a carga dos produtos a partir de
  `frontend/src/data/tulipia-produtos.json` (passo 10 de `docs/plano-backend.md`).
- `conferencias/`: consultas que SÓ LEEM o banco, para conferir depois de colar uma
  migração (um arquivo por migração, mesmo número). Não são migrações.

Nenhuma chave do Supabase entra nesta pasta nem no git.
