# Changelog

All notable changes to this project are documented here.
Each release tag `vX.Y.Z` publishes the section headed `## [X.Y.Z]` as its release notes.

## [Unreleased]

## [0.1.3]

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
