# Lyric Solitaire

Lyric Solitaire is a digital card/word game in which players build song
lyrics from individual word tiles.

The game is being developed as a digital playtesting environment for testing
the game's rules, balance, scoring system, and song data before any final
physical game implementation.

## Project Status

**Current version: Prototype v0.1.0**

Lyric Solitaire is currently in active prototype development.

The current version establishes the game's web interface and JavaScript
component architecture. Game mechanics are being implemented and tested
incrementally.

## Play the Prototype

The project is hosted using GitHub Pages.

- [Lyric Solitaire Cover Page](https://landviz-media.github.io/lyricSolitaire/)
- [Lyric Solitaire Game Prototype](https://landviz-media.github.io/lyricSolitaire/game.html)

The cover page is intentionally separate from the game interface.

## Game Concept

Players receive individual word tiles drawn from a pool created from the
selected songs.

Players use those words to reconstruct lyric lines displayed on the game
board.

A word tile can be:

- **Played** into a lyric line.
- **Held** in the player's inventory.

There is no discard mechanism. Once a physical word tile has been drawn from
the pool, it remains either in the player's hand or in a completed/played
lyric line.

## Game Modes

The planned game modes are:

### Easy / Open Mode

The board provides up to 12 open lyric rows.

At the beginning of a turn, available rows can be populated with candidate
lyric lines associated with the player's selected word.

Players can select a word, examine candidate lyric lines containing that word,
and decide where to play it.

### Standard Mode

Planned board size:

- 10 lyric rows

Standard Mode will introduce additional constraints compared with Easy/Open
Mode.

### Hard Mode

Planned board size:

- 8 lyric rows

Hard Mode will provide the most restrictive play environment.

The exact differences between Standard and Hard Mode are still under
development.

## Songs and Lyric Data

Songs are stored as JSON files.

Each song contains metadata and lyric sections such as:

- Verse
- Chorus
- Bridge
- Intro
- Outro

Example structure:

```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "year": 2024,
  "genre": "Country",
  "sections": [
    {
      "type": "Verse",
      "lyrics": [
        "Example lyric line"
      ]
    }
  ]
}
```

Individual lyric lines remain separate occurrences even when two lines contain
identical text.

This is important because the game treats each occurrence as a distinct
playable lyric line.

## Current Song Data

The prototype currently includes song data from:

- Zach Bryan
- Taylor Swift

Current test songs include:

- `Quittin' Time`
- `Pink Skies`
- `exile`

Additional songs and artists will be added as the game develops.

## Project Structure

```text
lyricSolitaire/
├── index.html
├── game.html
├── README.md
├── changelog.md
│
├── images/
│   └── lyric-solitaire-coming-soon.png
│
├── css/
│   └── game.css
│
├── js/
│   ├── main.js
│   │
│   ├── components/
│   │   ├── completedLines.js
│   │   ├── gameControls.js
│   │   ├── gameSetup.js
│   │   ├── lyricBoard.js
│   │   ├── lyricGrid.js
│   │   ├── playerHand.js
│   │   ├── scoreBoard.js
│   │   ├── scoring.js
│   │   ├── soloPlay.js
│   │   ├── ui.js
│   │   ├── utility.js
│   │   └── wordPool.js
│   │
│   └── utilities/
│       ├── lyricsParser.js
│       └── simulator.js
│
└── json/
    ├── bryan_zach/
    └── swift_taylor/
```

## Development Architecture

The game is intentionally divided into components so individual systems can
be developed and tested independently.

### `gameSetup.js`

Responsible for artist selection, genre filtering, song selection, game mode
selection, loading song statistics, and preparing a new game.

### `wordPool.js`

Responsible for building the physical word pool, tracking individual word
tiles, drawing tiles, and maintaining the remaining pool.

### `playerHand.js`

Responsible for the player word inventory, displaying word tiles, selecting
words, tracking held words, and removing played words from the hand.

### `lyricBoard.js`

Responsible for managing active lyric rows, tracking open and occupied rows,
and replacing completed rows.

### `lyricGrid.js`

Responsible for rendering lyric lines, displaying individual word positions,
highlighting candidate words, and locking successfully played words.

### `completedLines.js`

Responsible for moving completed lines out of the active board, displaying
completed lyric lines, and supporting scoring feedback.

### `scoring.js`

Responsible for word-placement scoring, completed-line scoring, section
bonuses, and future scoring rules.

### `scoreBoard.js`

Responsible for displaying the current score and scoring information.

### `gameControls.js`

Responsible for End Turn, New Game, pause/resume controls, and other
game-level controls.

### `soloPlay.js`

Responsible for coordinating the solo game flow.

### `lyricsParser.js`

Development utility for converting source lyric text into the project's
standard JSON format.

### `simulator.js`

Development utility for testing game balance and determining whether songs or
song combinations are mathematically playable under the current rules.

## Development Conventions

Every JavaScript component should contain:

1. A responsibility comment at the top of the file.
2. Comments explaining important sections of code.
3. Comments explaining non-obvious game rules.
4. Clear function responsibilities.

Game rules should be documented in code when implementation details could
otherwise obscure the reason for a particular behavior.

## Versioning

Prototype versions identify the state of the game being tested.

The current prototype is:

**v0.1.0**

Development history is maintained in [`changelog.md`](changelog.md).

## License

Development project by Christopher J. Seeger.

Additional licensing and distribution information will be established as the
project approaches release.
