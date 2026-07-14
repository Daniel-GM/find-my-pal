# Find My Pal

Aplicação web para jogadores de Palworld consultarem Pals, descobrirem combinações de breeding, organizarem pacotes de criação, verem drops, montarias e builds recomendadas.

## O que o projeto tem

- **Breeding Tree** — escolha um Pal alvo e visualize todas as combinações possíveis de pais que podem gerá-lo, com filtros por elemento, ordenação por poder e busca por nome.
- **Lista de Pals** — grid/lista completa dos Pals com busca, filtros por elemento e work suitability.
- **Pacotes** — crie pacotes personalizados (ex: "plantação", "mineração", "cozinha") e salve combinações de breeding dentro deles.
- **Concluídos** — marque combinações como feitas; elas vão para uma lista separada e podem ser desmarcadas a qualquer momento.
- **Mounts** — consulte montarias por tipo (ground, flying, water), com nível de sela, velocidade, stamina e habilidade.
- **Boss Drops** — veja quais itens cada Pal dropa e quais Pals dropam um item específico.
- **Crafting Planner** — calcule materiais brutos e etapas de craft em ordem de dependência (com rotas alternativas).
- **Builds** — sugestões de builds pré-montadas baseadas em partner skills (melee, sniper, miner, lumberjack, tank, speedrunner).
- **Tema Claro/Escuro** — alternância completa de tema, com escuro como padrão.
- **Internacionalização** — suporte a inglês (en) e português do Brasil (pt-BR).
- **Persistência local** — pacotes e combinações concluídas são salvas no `localStorage`.

## Tecnologias

- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (componentes base)
- [Vitest](https://vitest.dev/) (testes unitários)
- [ESLint](https://eslint.org/) com regras type-aware

## Estrutura do projeto

```
findMyPal/
├── app/              # Aplicação React (código-fonte principal)
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis por feature
│   │   ├── data/         # Dados dos Pals, drops, montarias e skills (JSON + TS)
│   │   ├── lib/          # Helpers, lógica de breeding, imagens, elementos
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── hooks/        # Hooks customizados
│   │   └── i18n/         # Traduções e contexto de idioma
│   ├── package.json
│   └── README.md
├── data/raw/         # Dados brutos/batches usados na montagem da base
├── .gitignore
└── README.md
```

## Como rodar

```bash
cd app
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Scripts úteis

```bash
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção
npm run lint      # ESLint
npm run test      # Vitest em modo watch
npm run test:run  # Vitest uma única vez
npm run update:crafting  # valida/normaliza o catálogo de craft
```

## Testes

O projeto usa Vitest. Os testes estão em `app/src/**/__tests__/` e cobrem helpers de breeding, elementos, drops, mounts, Pals, partner skills, imagens e o planejador de crafting.

```bash
cd app
npm run test:run
```

## Deploy

O build de produção é gerado em `app/dist/`:

```bash
cd app
npm run build
```

A pasta `deploy-dist/` foi removida da raiz porque o build pode ser regenerado a qualquer momento. Se for fazer deploy manual, basta copiar o conteúdo de `app/dist/` para o servidor.

## Dados

Os dados dos Pals, drops, montarias e partner skills foram extraídos de fontes da comunidade (paldb.cc, wiki.gg, palpedia) e consolidados nos arquivos dentro de `app/src/data/`.

Os arquivos brutos utilizados durante a construção da base estão em `data/raw/`.

### Crafting catalog

O catálogo versionado vive em `app/src/data/json/crafting.json` (`schemaVersion: 1`).

- **Fonte principal desta release:** páginas PalDB rotuladas como v1.0.0 (2026-07-10), com IDs estáveis alinhados a códigos do jogo / Technology IDs da Pocketpair quando disponíveis.
- **Não misturar** quantidades conflitantes da wiki.gg com PalDB no mesmo snapshot.
- Metadados `gameVersion`, `generatedAt` e `sources[]` são exibidos na UI e cobertos por testes.
- Para atualizar: coloque um snapshot revisado em `.memory/scratch/` (gitignored), depois rode:

```bash
cd app
node scripts/update-crafting-data.mjs ../.memory/scratch/crafting-raw.json
```

O script valida IDs, referências, quantidades positivas, defaults e entidades selecionáveis; em seguida escreve o JSON normalizado.