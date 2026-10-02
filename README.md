# HEALTH — Instituto de Saúde Integrada

Site institucional e e-commerce do **Instituto Health**, unindo fisioterapia, estética, teleconsulta, cursos e um catálogo de produtos (Tulípia + descartáveis para clínicas) em um só lugar.

> *"Cuidado, conhecimento e soluções para a sua saúde e bem-estar."*

🔗 **Produção:** [instituto-health.vercel.app](https://instituto-health.vercel.app)

---

## Sobre o projeto

O Instituto Health é conduzido pela fisioterapeuta e esteticista **Juliana Gonella**, professora na Uniara. O site funciona como hub central da marca, organizando a comunicação em torno de 6 pilares:

- **Tulípia** — catálogo de dermocosméticos (representante oficial)
- **Descartáveis para Clínicas** — produtos hospitalares e descartáveis
- **Procedimentos** — cuidados presenciais (fisioterapia e estética)
- **Teleconsulta** — orientação individualizada por vídeo
- **Cursos** — formação e aperfeiçoamento em estética
- **Sobre a HEALTH** — a profissional e a história do Instituto

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Estilização | Tailwind CSS v4 |
| Animações | Motion (ex-Framer Motion) |
| Roteamento | React Router |
| Ícones | lucide-react |
| Deploy | Vercel |
| Versionamento | Git + GitHub |

---

## Identidade visual

Paleta oficial da marca (com hierarquia de uso definida em documento próprio):

| Cor | Hex | Uso |
|---|---|---|
| Verde Health | `#04452E` | Institucional principal |
| Verde Profundo | `#042012` | Fundos de alto contraste |
| Verde Esmeralda | `#0A7553` | Destaques e elementos gráficos |
| Verde Turquesa | `#2CAC87` | Acentos e detalhes |
| Dourado Health | `#CAA02D` | Assinatura premium |
| Dourado Claro | `#EEC35A` | Brilhos e acabamentos |
| Champagne | `#F6E99D` | Fundos suaves |
| Off-white | `#F8F5EE` | Fundo principal |
| Bronze Dourado | `#94530D` | Profundidade nos dourados |

Tipografia: fonte customizada **Flatline** nos catálogos de produto, com hierarquia serif/sans para títulos e corpo de texto no restante do site.

---

## Funcionalidades

### Home
- Animação de entrada da marca (logo montando em camadas: círculo, H, fita, folha, wordmark, subtítulo, tagline)
- Transição suave da logo para o header após a animação
- Seção "Os 6 Pilares" com acesso rápido a cada frente do Instituto
- Fotos de fundo sutis (baixa opacidade, bordas esmaecidas) ao longo da página

### Catálogo Tulípia (`/tulipia`)
- **147 produtos reais**, extraídos e mantidos atualizados a partir do site oficial da Tulípia
- Classificação em **3 dimensões independentes**: Categoria (tipo de produto), Cuidado (necessidade/objetivo), Linha (marca própria)
- Filtros: Todos / Por Categoria / Por Linha / Por Cuidado, com carrossel de ícones circulares
- Filtro "Por Tipo de Pele" (sensível, seca, oleosa, mista, acneica, madura)
- Alternância Home Care / Profissional (produtos exclusivos a profissionais ficam com preço oculto e compra desabilitada)
- Seção "Queridinhos" em destaque editorial
- Banners de linha (ProSkin, Dermo Estetic, Ampolas) com layout assimétrico
- Busca por nome
- Galeria de fotos por produto (carrossel, quando há mais de uma imagem)
- Página de detalhe própria por produto, com produtos relacionados

### Produtos Hospitalares / Descartáveis para Clínicas
- Catálogo próprio, mesma estrutura de carrinho compartilhada com a Tulípia

### Carrinho
- Compartilhado entre Tulípia e Descartáveis para Clínicas
- Duas formas de fechar o pedido: **Finalizar Compra** (checkout) ou **Finalizar pelo WhatsApp**

### Checkout (`/checkout`)
- Endereço com preenchimento automático via CEP
- Formas de pagamento: Pix, crédito e débito (somente interface)
- Frete estimado e página de pedido confirmado
- **Ainda sem backend**: não há cobrança real nem cálculo de frete com transportadora

### Cadastro e Login (`/cadastro`, `/login`)
- Cadastro Profissional / Home Care, com confirmação de e-mail e upload de comprovante profissional
- **Ainda sem backend**: o fluxo é só de interface, nenhum dado é salvo

### Procedimentos (`/procedimentos`)
- **28 procedimentos reais**, com texto clínico da Juliana e filtro por categoria
- Página de detalhe própria por procedimento, com CTA de agendamento via WhatsApp

### Teleconsulta, Cursos, Sobre
- Páginas dedicadas por pilar, com CTA de agendamento via WhatsApp

### Responsividade
- Construído mobile-first, testado em múltiplas larguras (320px a 1920px+)

---

## Estrutura de pastas

```
src/
├── assets/
│   ├── fonts/            # Fonte Flatline
│   ├── hero-bg/          # Fotos de fundo da home
│   ├── juliana/           # Fotos da Juliana e teleconsulta
│   ├── logo-parts/        # Peças da logo animada
│   ├── products/          # Fotos dos produtos Tulípia
│   └── tulipia-brand/     # Wordmark e selo de representante oficial
├── components/
│   └── tulipia/            # Componentes específicos do catálogo
├── context/                 # Carrinho e navegação (Context API)
├── data/                    # Catálogo, categorias, ícones, banners
├── pages/                   # Uma página por rota
└── main.tsx / App.tsx
```

---

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

### Scripts disponíveis

```bash
npm run dev        # ambiente de desenvolvimento
npm run build      # build de produção
npm run lint        # ESLint
npx tsc -b          # checagem de tipos
```

---

## Deploy

Hospedado na **Vercel**, com deploy automático a cada `git push` no branch `main`. O `vercel.json` redireciona todas as rotas para o `index.html`, para que links diretos (ex.: `/tulipia`) funcionem com o React Router.

```bash
git add .
git commit -m "descrição da mudança"
git push
```

---

## Roadmap

- [x] Fase 1 — Frontend completo (catálogos, cadastro e checkout em interface)
- [ ] Fase 2 — Backend: gateway de pagamento, integração com transportadora e cadastro real
- [ ] Fase 3 — Painel administrativo (estoque, pedidos, nota fiscal)
- [ ] Fase 4 — Agendamentos, financeiro e cursos no admin
- [ ] Domínio próprio e transferência do projeto para a conta Vercel do Instituto
- [ ] Conteúdo pendente (aguardando material da Juliana): procedimento "Jato de Plasma", fotos, valor e duração dos procedimentos, detalhamento dos cursos
- [ ] Stories patrocinados no Instagram, na mesma identidade visual

---

## Sobre a marca

**Tulípia** é usada no catálogo como representante oficial autorizada — logo, selo e fotos de produto usados com essa finalidade.

---

*Desenvolvido para o Instituto Health — Instituto de Saúde Integrada.*
