# Modelos de e-mail do Supabase (referência)

Estes arquivos são só uma CÓPIA de referência dos modelos de e-mail do Supabase
Auth (em português, com `{{ .Token }}`: código de 6 dígitos, sem link):

- Confirm signup (confirmação de cadastro)
- Reset password (redefinição de senha)

O que vale é o que está no painel do Supabase (Authentication > Emails).
Qualquer mudança é feita LÁ; depois, atualize a cópia aqui para não divergir.

- `confirmar-cadastro.html` (Confirm signup)
- `redefinir-senha.html` (Reset password)

O assunto de cada e-mail está num comentário no topo do arquivo (no painel, o
assunto é um campo separado do corpo; o comentário não é colado no corpo).
Nada de chave, senha ou token real nos modelos: só variáveis do Supabase, como
`{{ .Token }}`.
