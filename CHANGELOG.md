# Changelog

All notable changes to this project are documented here.
Each release tag `vX.Y.Z` publishes the section headed `## [X.Y.Z]` as its release notes.

## [2.0.3]

### Fixed
- Atributos que a ficha não tem salvos (fichas criadas antes do atributo existir) contam 1 na rolagem, como a ficha mostra, em vez de 0. Habilidades não mudam.

## [2.0.2]

### Added
- Cards de tooltip para itens nas fichas, nos compêndios e na barra lateral, com cores correspondentes ao tipo de ator ou item quando identificado.
- Descrições longas nos cards podem ser percorridas com a roda do mouse sobre o item.

### Fixed
- Poderes arrastados do compêndio mantêm sua disciplina e a tornam visível na ficha.
- Cards longos se ajustam ao espaço disponível na tela; imagens das descrições são reduzidas e centralizadas nos cards e nas fichas de item.

## [2.0.1]
###Added
**Filepicker in Settings**: Filepicker added to the header and background fields in the system settings.

## [2.0.0]

###Fixed
**Placeholders**: Fix Settings Placeholders Inputs.

###Changed
**Redesign Sheet**: Redesign of the character sheet in the tabs and window style.

## [1.0.11]

### Added
- **External Floating Tab Dock on Left Edge**: Character sheet navigation tabs now float outside the window on the left edge, freeing 100% of the internal usable width for sheet data and removing the previous rigid offset.
- **Image Pickers in Actor Settings**: Replaced legacy Foundry tag with text inputs and dedicated browse buttons integrated into LoomVTT's native `FilePickerWindow`, allowing users to easily customize actor header and background images.

### Changed
- **Seamless Window Header Integration**: The `.loom-window-header` is now positioned with a translucent gradient overlay on top of the sheet header artwork, unifying the top of the window as a single visual block while providing padding protection for window controls.

### Fixed
- **Disciplines, Ceremonies, and Rituals Tree**: Vertical connection lines are now continuous without gaps, horizontal branches extend flush to power icons, and tree roots connect cleanly under category icons without piercing through them.
- **Conditions and Custom Rolls Layout**: Responsive side-by-side flex layout on wider sheets, plus safety padding (`padding-bottom: 50px`) on tabs to prevent content from being clipped by the bottom actor type banner (`.sheet-banner`).
- **Clean Active Tab Styling**: Removed artificial side-bar accent indicators on active tabs, maintaining a clean, native Loom interface aesthetic.

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
