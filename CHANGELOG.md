# Changelog

All notable changes to this project are documented here.
Each release tag `vX.Y.Z` publishes the section headed `## [X.Y.Z]` as its release notes.

## [Unreleased]

## [1.0.11]

### Added
- **Dock de Abas Flutuante Externo à Esquerda**: A barra de navegação das fichas de personagem agora flutua externamente à esquerda da janela, liberando 100% da largura útil interna para os dados do personagem e eliminando o offset rígido anterior.
- **Seletor de Imagens nas Configurações do Ator**: Substituída a tag legada do Foundry por campos de entrada e botões integrados à `FilePickerWindow` nativa do LoomVTT, permitindo alterar com facilidade a imagem de cabeçalho e a imagem de fundo do personagem.

### Changed
- **Integração Visual do Cabeçalho com a Janela**: O `.loom-window-header` agora é posicionado de forma translúcida sobre a arte do cabeçalho da ficha, unificando o topo da janela como um bloco visual único e contínuo, com respiro de padding para não obstruir controles de janela.

### Fixed
- **Árvore de Disciplinas, Cerimônias e Rituais**: Conexões verticais contínuas sem falhas, ramificações horizontais estendidas até encostar nos ícones de poder e alinhamento sob o nó pai sem cortar os ícones.
- **Painel de Condições e Rolagens Personalizadas**: Ajustada a disposição para acomodar itens lado a lado em telas largas e adicionado espaçamento inferior de segurança (`padding-bottom: 50px`) na aba para prevenir que elementos sejam encobertos pela barra inferior do tipo de ator (`.sheet-banner`).
- **Remoção de Indicadores Artificiais**: Eliminadas barras laterais artificiais na aba ativa, mantendo estilo limpo e condizente com a interface nativa do Loom.

## [1.0.10]

### Changed
- **Dados 3D nativos**: o sistema agora descreve seus dados (cor e símbolo de cada face) ao motor via `Loom.dice3d` e informa quais dados da rolagem são de fome, fúria ou desespero. Uma configuração de cliente escolhe símbolos simples ou coloridos. Os presets e hooks do antigo módulo de dados foram removidos.

## [1.0.9]

### Fixed
- **Latência Zero na Seleção de Poderes**: Eliminada a cadeia de 5 requisições REST sequenciais e reloads que causavam atraso/delay ao selecionar disciplinas e poderes (VTM), dons e poderes de dons (WTA), e vantagens e talentos (HTR). A interface agora atualiza a árvore e os detalhes instantaneamente (0ms) via estado otimista em memória com renderização síncrona, e persiste a seleção em segundo plano por fila serializada em um único update no ator.

## [1.0.8]

### Fixed
- **Humanidade**: Clique esquerdo avança o ciclo (vazio → mancha → caixa preenchida) e clique direito cura manchas ou insere caixa preenchida diretamente, sem travas indevidas de edição da ficha.
- **Contadores de Vitalidade e Força de Vontade**: Suporte aprimorado a clique esquerdo (marca/avança dano) e clique direito (cura dano direto) com atualização visual instantânea e debounce resiliente para persistência.
- **Seleção de Disciplinas e Poderes**: Validação resiliente de disciplinas na árvore e sincronização imediata do painel de detalhes no ator.
- **Modificadores Situacionais**: Removida a aparição de Potência de Sangue como modificador de dados; mantido exclusivamente o Surto de Sangue (aplicável a atributos), especializações de perícias e vantagens/desvantagens de itens.
- **Layout do Cabeçalho e LESS**: O cabeçalho do personagem (`actor-header`) agora preenche 100% da largura até o canto superior esquerdo da janela, eliminando a faixa preta e mantendo a integridade e espaçamento das abas verticais; fontes LESS sincronizadas e CSS compilado via Gulp.

## [1.0.7]

### Fixed
- Especializações de perícias em modificadores de rolagem, ocultação de potência de sangue zerada e correção da seleção de dados para rerrolagem de Força de Vontade.

### Changed
- Dice are registered through the engine's Loom.dice.registerTerm when available; falls back to CONFIG.Dice.terms on older engines.

## [1.0.5]

### Fixed
- Apply pool-category modifiers to standalone skill rolls and only once when categories are combined.

## [1.0.4]

### Fixed
- Prevent Quality and Defect item modifiers from being counted twice in rolls.

## [1.0.3]

### Fixed
- Keep long item descriptions inside a scrollable editor and make item titles readable.
- Align sheet item icons and headings, and give editable notes fields more writing space.
- Improve group sheet title sizing and experience table readability without clipping its columns.
- Make item drag-and-drop into sheets more reliable and route dropped items to the right section.

## [0.1.2]

### Changed
- Keep the distributed stylesheet reproducible from the organized LESS modules and retain the pre-sync CSS backup outside version control.

## [0.1.1]

### Fixed
- Limit non-owner actor sheets to biography and public notes, with private notes stored per user.
- Show the failure margin in Portuguese and Italian roll cards and restore success/failure colors across chat card layouts.
- Run world data migrations once per migration step and wait for document/settings writes to finish.
- Preserve the tested stylesheet while restoring per-system and per-component LESS sources.

## [0.1.0]

Native ruleset for **LoomVTT** supporting Vampire: The Masquerade 5th Edition, Werewolf: The Apocalypse 5th Edition, and Hunter: The Reckoning 5th Edition.

### Highlights
- **Native LoomVTT Architecture:** Built to run directly on LoomVTT without external runtime dependencies.
- **Full Splat Support:** Dedicated character sheets and mechanical systems for Vampires, Ghouls, Werewolves, Hunters, Mortals, and SPCs.
- **Automated Dice Mechanics:** Hunger dice, Rage checks, Desperation, Remorse rolls, Rouse checks, Frenzy rolls, and Willpower re-rolls.
- **Embedded Items & Disciplines:** Full support for Disciplines, Edges, Perks, Talismans, Gifts, Clans, Tribes, and Creeds.
- **Integrated Compendiums:** Pre-compiled SQLite databases for Conditions and Macros ready for instant loading.
- **Multi-language Support:** English, Portuguese (Brasil), Spanish, French, German, and Italian.
