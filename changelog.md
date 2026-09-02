# Lyric Solitaire Changelog

All notable development changes to Lyric Solitaire are recorded here.

The project is currently in prototype development. Version numbers identify
the state of the prototype being tested rather than a public release.

---

## Prototype v0.1.0 — 2026-09-01

### Project Structure

- Established `index.html` as the public cover / landing page.
- Established `game.html` as the actual game interface.
- Established `css/game.css` for game styling.
- Established component-based JavaScript structure under `js/components/`.
- Established utility scripts under `js/utilities/`.
- Established lyric JSON storage under `json/`.

### Game Interface

- Rebuilt `game.html` to match the existing CSS framework.
- Removed accidental Markdown code fences from the HTML.
- Added visible prototype version number.
- Added game status area for Round, Turns remaining, and Score.
- Added player word inventory area.
- Added lyric board area.
- Added completed-lines area.
- Added turn information for Draw, Played, and Held.
- Added End Turn control.

### JavaScript Architecture

The following component files are established as the initial game architecture:

- `completedLines.js`
- `gameControls.js`
- `gameSetup.js`
- `lyricBoard.js`
- `lyricGrid.js`
- `playerHand.js`
- `scoreBoard.js`
- `scoring.js`
- `soloPlay.js`
- `ui.js`
- `utility.js`
- `wordPool.js`

Development utilities:

- `lyricsParser.js`
- `simulator.js`

### Documentation

- Established `README.md` as the project description and developer-facing overview.
- Established `changelog.md` as the chronological development record.
- Prototype versioning established at `v0.1.0`.

### Current Status

The game interface is an architectural prototype.

The next development stage is to replace the JavaScript component placeholders
with the actual game setup, word-pool, player-hand, lyric-board, turn, and
scoring logic.
