# Guia de evolução do Find My Pal

Este documento define o padrão oficial para novas telas, correções e refatorações do Find My Pal. Ele é próprio deste produto: não copiar regras, componentes ou tokens de outro sistema.

## Objetivo do produto

O Find My Pal é uma ferramenta de consulta e planejamento para jogadores de Palworld. A interface deve priorizar descoberta rápida, comparação de dados e execução de tarefas curtas com uma mão, sem perder a densidade necessária para uso em desktop.

## Princípios de interface

1. **Mobile primeiro, desktop adaptável.** Toda decisão começa no viewport compacto (320–767 px) e escala para tablet e desktop. Não criar uma versão mobile que dependa de zoom, arraste horizontal ou hover.
2. **Uma tarefa primária por tela.** O título e a primeira área de ação devem deixar claro o que o usuário consegue fazer ali. Detalhes e configurações secundárias ficam em filtros, folhas ou menus.
3. **Conteúdo antes da moldura.** Cards e superfícies devem organizar informação, não ocupar espaço apenas por decoração. Manter contraste, hierarquia e respiro.
4. **Toque previsível.** Toda ação importante precisa ter área de toque confortável, estado pressionado visível e feedback de sucesso/erro. Ícone sozinho deve ter nome acessível.
5. **Estado sempre compreensível.** Loading, vazio, erro, selecionado, desabilitado e concluído devem ser estados visuais explícitos; nunca depender apenas de cor.
6. **Preservar regras de negócio.** Ajuste visual não pode alterar cálculos, persistência, permissões, compartilhamento ou ordenação sem pedido específico.

## Shell responsivo

- Em desktop, manter a sidebar de 280 px e o conteúdo principal ao lado dela.
- Em telas abaixo de 768 px, usar a barra superior compacta e a navegação inferior persistente já existente em `Navbar.tsx`.
- A navegação inferior deve conter no máximo quatro destinos principais e uma entrada **Mais** para as demais áreas. Ela é navegação, nunca substitui uma ação de criação ou exclusão.
- Reservar `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)` para aparelhos com recorte ou indicador de gesto.
- O conteúdo não pode ficar escondido atrás da barra superior ou inferior. Todo novo shell fixo exige padding equivalente no conteúdo.
- Usar `min-width: 0` em filhos flex/grid que exibem texto e `minmax(0, 1fr)` para colunas fluidas.

## Breakpoints e layout

- **Compacto:** 320–767 px. Uma coluna, filtros em rolagem ou quebra controlada, ações agrupadas na zona inferior, modais como bottom sheet.
- **Médio:** 768–1099 px. Sidebar ou navegação lateral compacta, duas colunas quando o conteúdo realmente comportar.
- **Expandido:** 1100 px ou mais. Sidebar completa, grades com múltiplas colunas e painéis auxiliares.
- Preferir `clamp()`, `min()`, `max()`, `minmax(0, 1fr)` e `flex-wrap` a larguras fixas.
- Não usar `min-width` maior que o viewport em inputs, cards, tabelas, filtros ou editores.
- Tabelas densas devem ter uma alternativa responsiva: cards/linhas empilhadas ou rolagem horizontal localizada e indicada.
- Manter espaçamento base em múltiplos de 4/8 px; em mobile, usar margens laterais de 16 px como ponto de partida.

## Componentes e interação

- Alvos de toque: mínimo de 44×44 px para ações frequentes. Para controles compactos, garantir no mínimo 24×24 px com espaçamento suficiente; 48 px é preferível quando não prejudicar a densidade.
- Separar ações vizinhas por pelo menos 8 px e não colocar excluir/confirmar imediatamente ao lado de uma ação destrutiva sem confirmação.
- Todo botão precisa de `type="button"` quando estiver dentro de formulário, nome visível ou `aria-label`, e `:focus-visible` perceptível.
- Não depender de `:hover` para revelar informação ou ação. Hover é complemento para mouse; toque e teclado precisam funcionar sozinhos.
- Usar `button` para ações e `a`/navegação para destinos. Não usar `div` clicável sem necessidade.
- Para filtros com muitos itens, preferir rolagem horizontal com `overflow-x: auto`, chips de altura confortável e estado selecionado com cor + texto/borda.
- Formulários devem usar `inputMode` apropriado, labels visíveis e fonte mínima de 16 px em mobile para evitar zoom automático do navegador.
- Menus, pickers e diálogos devem permitir fechar com botão claro, Escape quando aplicável e toque fora quando isso não causar perda de dados.
- Em mobile, usar bottom sheet para seleção e edição curta; limitar a altura a `calc(100dvh - 16px)` e permitir rolagem interna.

## Dados, cards e densidade

- Cards de Pals, receitas, montarias e times devem manter nome, identificador, status e ação principal legíveis sem truncar o dado essencial.
- Usar `truncate` somente quando houver alternativa para consultar o valor completo (detalhe, tooltip acessível ou diálogo).
- Imagens de entidades precisam de `alt` significativo quando carregam informação; imagens decorativas usam `alt=""`.
- Gráficos, árvores e comparações precisam ter uma leitura linear ou resumo textual em telas estreitas.
- Estados vazios devem explicar o próximo passo. Erros devem explicar o que aconteceu e oferecer retry quando fizer sentido.

## Acessibilidade e qualidade

- Seguir WCAG 2.2 AA como base: foco não pode ficar oculto, ordem de teclado deve acompanhar a leitura, contraste e tamanho de alvo devem ser verificados.
- Não comunicar estado apenas por cor; combinar ícone, texto, borda, posição ou padrão.
- Respeitar `prefers-reduced-motion` para animações decorativas e evitar movimentos que impeçam a leitura.
- Testar em 320×667, 375×812, 412×915, 768×1024 e 1440×900. Verificar retrato e, quando fizer sentido, paisagem.
- Conferir: sem overflow horizontal acidental, barra fixa sem sobreposição, teclado sem cobrir o campo ativo, modal rolável, foco visível e ações principais alcançáveis pelo polegar.

## Processo obrigatório para futuras alterações

1. Identificar a tarefa primária e o estado de dados da tela antes de editar.
2. Inspecionar a tela em viewport compacto antes de decidir se uma regra deve ser global ou específica do componente.
3. Reutilizar tokens de `src/index.css`, `lucide-react`, componentes existentes e padrões já estabilizados.
4. Implementar a menor mudança que resolve o problema em mobile e preservar a composição desktop.
5. Validar tipos, lint/testes direcionados e build quando a alteração tocar shell, rotas, componentes compartilhados ou estilos globais.
6. Fazer uma revisão visual nos cinco viewports acima, incluindo estados vazio, carregando, erro, diálogo e conteúdo longo.
7. Registrar neste guia qualquer novo padrão de navegação, breakpoint ou componente que passe a ser obrigatório.

## Definição de pronto para uma atualização

Uma atualização de UI só está pronta quando: não cria overflow horizontal; não perde uma ação existente; funciona por toque, teclado e leitor de tela no nível adequado; preserva dark/light mode e idioma; apresenta loading/vazio/erro; passa validação técnica proporcional ao risco; e foi conferida visualmente no compacto e no expandido.

## Referências de mercado adotadas

- [Apple Human Interface Guidelines — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility): áreas de toque, espaçamento e uso confortável.
- [Apple Human Interface Guidelines — Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars): navegação de primeiro nível persistente em espaço limitado.
- [Material Design 3 — Canonical layouts](https://m3.material.io/foundations/layout/canonical-examples/overview): adaptação de scaffolds entre breakpoints.
- [Material Design — Interaction states](https://m3.material.io/foundations/interaction/states/overview): estados enabled, focused, pressed, disabled e hover.
- [W3C WCAG 2.2 — Target Size](https://www.w3.org/WAI/WCAG22/): tamanho e espaçamento mínimo para alvos de ponteiro.

Essas referências orientam decisões; o resultado final deve continuar reconhecível como Find My Pal e respeitar suas regras de negócio.
