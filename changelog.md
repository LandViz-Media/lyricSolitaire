# Lyric Solitaire Changelog

All notable development changes to Lyric Solitaire are recorded here.

The project is currently in prototype development. Version numbers identify
the state of the prototype being tested rather than a public release.

---

## Prototype v0.1.1 — 2026-09-01

### Game Simulator

Added the first functional game-balance simulator.

The simulator uses the actual repository Lyrics JSON and Word Count JSON
files rather than hand-entered song statistics.

Added:

- `js/utilities/simulator.js`
- `tools/simulator/index.html`
- `tools/simulator/css/simulator.css`
- `tools/simulator/js/simulator-ui.js`

### Simulation Rules

The first simulator target is Easy / Open Mode.

The simulator models:

- 12 active lyric rows
- 50-tile player inventory
- 12 maximum rounds
- Initial draw of 12 tiles
- Subsequent draw formula based on previous-round words played
- Inventory-cap draw limiting
- Physical word-pool depletion
- Word placement
- Held words
- Duplicate lyric-line occurrences
- Immediate completion of lyric lines
- Immediate freeing of completed rows
- Aggressive play strategy

The simulator does **not** model scoring yet because completion-line and
section-bonus scoring rules remain under discussion.

### Simulation Strategy

The simulated player attempts to play every usable word.

When a word cannot be played into an active line, the simulator may open a
new lyric line containing that word when an active row is available.

The simulator prefers lines that are closer to completion in order to model
the aggressive strategy discussed during prototype balancing.

### Reproducibility

Added a seeded random-number generator to the simulator interface so a test
run can be reproduced using the same seed.

### Documentation

- Updated README to document the simulator.
- Updated the current project version to `v0.1.1`.
- Added simulator links to the development tools section.

---

## Prototype v0.1.0 — 2026-09-01

### Project Structure

- Established `index.html` as the public cover / landing page.
- Established `game.html` as the game prototype interface.
- Established `css/game.css` for game styling.
- Established component-based JavaScript structure under `js/components/`.
- Established utility scripts under `js/utilities/`.
- Established lyric JSON storage under `json/`.
- Established `tools/lyrics-json-generator/` as the project data-authoring tool.

### Game Interface

- Corrected `game.html` so it matches the existing game CSS selectors.
- Removed accidental Markdown code fences from the HTML.
- Added visible prototype version number.
- Added game status area for:
  - Round
  - Turns remaining
  - Score
- Added player word inventory area.
- Added lyric board area.
- Added completed-lines area.
- Added turn information for:
  - Draw
  - Played
  - Held
- Added End Turn control.

### Lyrics JSON Generator

- Imported the working JSBin Lyrics JSON Generator into the repository.
- Preserved the established five-line metadata format:
  - Artist
  - Song Title
  - Album
  - Year
  - Genre
- Preserved bracketed lyric sections.
- Preserved Unicode normalization.
- Preserved contraction-aware word tokenization.
- Preserved physical word counts.
- Preserved unique-word counts.
- Preserved punctuation counts.
- Preserved separate downloads for Lyrics JSON and Word Count JSON.
- Removed JSBin-specific wrapper and analytics code.

### Documentation

- Updated `README.md`.
- Established `changelog.md`.
- Established prototype versioning.
