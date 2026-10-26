# database

Tudo o que é banco de dados (Supabase) fica aqui.

- `migrations/`: scripts SQL que criam e alteram tabelas, políticas e buckets.
  Um arquivo por mudança, com numeração em ordem (`0001_...sql`, `0002_...sql`).
  Cada migração é colada manualmente no SQL Editor do Supabase, uma por vez e
  na ordem numérica. Não usamos a CLI do Supabase.
- `seeds/`: scripts de carga de dados (passo 10 de `docs/plano-backend.md`). Rodam
  dentro de `backend/`, em simulação por padrão e só gravam com `--aplicar`:
  `npm run seed:produtos` (catálogo, a partir de
  `frontend/src/data/tulipia-produtos.json`) e `npm run seed:precos-profissionais`
  (preço de profissional, a partir de uma planilha CSV em `seeds/dados/`, pasta
  que está no `.gitignore`; veja `seeds/precos-profissionais.exemplo.csv`). A
  lógica fica em `seeds/lib/` e é testada em `backend/tests/`.
- `conferencias/`: consultas que SÓ LEEM o banco, para conferir depois de colar uma
  migração (um arquivo por migração, mesmo número). Não são migrações.

Nenhuma chave do Supabase entra nesta pasta nem no git.
