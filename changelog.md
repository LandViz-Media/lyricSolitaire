# Lyric Solitaire Changelog

All notable development changes to Lyric Solitaire are recorded here.

The project is currently in prototype development. Version numbers identify
the state of the prototype being tested rather than a public release.

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
- Preserved bracketed lyric sections such as `[Verse]`, `[Chorus]`,
  `[Bridge]`, `[Intro]`, and `[Outro]`.
- Preserved Unicode normalization.
- Preserved contraction-aware word tokenization.
- Preserved physical word counts.
- Preserved unique-word counts.
- Preserved punctuation counts.
- Preserved separate downloads for Lyrics JSON and Word Count JSON.
- Removed JSBin-specific wrapper code and external analytics code.

### Documentation

- Updated `README.md` to describe the project and its development tools.
- Added the Lyrics JSON Generator to the documented project structure.
- Established `changelog.md` as the chronological development record.
- Prototype versioning established at `v0.1.0`.

### Current Status

The game interface is an architectural prototype.

The Lyrics JSON Generator is now represented in the repository as a local
development tool.

The next major development task is the game simulator, using the actual song
JSON and word-count data to test game balance before implementing the complete
gameplay interface.
