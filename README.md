# Lyric Solitaire

Lyric Solitaire is a digital card/word game in which players build song
lyrics from individual word tiles.

The game is being developed as a digital playtesting environment for testing
the game's rules, balance, scoring system, and song data before any final
physical game implementation.

## Project Status

**Current version: Prototype v0.1.1**

The project currently contains:

- The public cover page.
- The initial game interface shell.
- A working Lyrics JSON Generator.
- A working game simulator for testing Easy/Open Mode assumptions.
- Initial song and word-count JSON data.

The gameplay interface itself is still under development.

## Play the Prototype

- [Lyric Solitaire Cover Page](https://landviz-media.github.io/lyricSolitaire/)
- [Lyric Solitaire Game Prototype](https://landviz-media.github.io/lyricSolitaire/game.html)
- [Game Simulator](https://landviz-media.github.io/lyricSolitaire/tools/simulator/)
- [Lyrics JSON Generator](https://landviz-media.github.io/lyricSolitaire/tools/lyrics-json-generator/)

## Development Tools

### Lyrics JSON Generator

The Lyrics JSON Generator turns structured lyric text files into:

1. Lyrics JSON
2. Word Count JSON

The source format is:

```text
Artist
Song Title
Album
Year
Genre

[Verse]
Lyrics...
Lyrics...

[Chorus]
Lyrics...
Lyrics...
```

The generator preserves:

- Artist
- Song title
- Album
- Year
- Genre
- Named lyric sections
- Individual lyric-line occurrences
- Physical word counts
- Unique word counts
- Punctuation counts

### Game Simulator

The Game Simulator tests game balance and solvability using the actual
Lyrics JSON and Word Count JSON files in the repository.

The first simulator target is Easy / Open Mode.

Current assumptions modeled by the simulator:

- 12 active lyric rows
- 50-tile player inventory
- 12 maximum rounds
- Initial draw of 12 tiles
- Later draws use the agreed previous-play formula
- Actual draws are capped by pool size and inventory capacity
- Played words leave the player's hand
- Unplayed words remain held
- Completed lines immediately free a row
- Duplicate lyric-line occurrences remain separate
- An aggressive player attempts to play every usable tile
- Scoring is not yet modeled

The simulator is intended to help us answer questions such as:

- Can a player complete a single song?
- Can a player complete multiple songs?
- How quickly does the 50-tile inventory fill?
- How much of the physical word pool remains?
- How many lyric lines can be completed?
- Does the draw formula create runaway hand growth?
- Is the game winnable within the planned number of rounds?

## Game Concept

Players receive individual word tiles drawn from a pool created from the
selected songs.

Players use those words to reconstruct lyric lines displayed on the game
board.

A word tile can be:

- **Played** into a lyric line.
- **Held** in the player's inventory.

There is no discard mechanism.

Once a physical word tile has been drawn from the pool, it remains either
in the player's hand or in a completed/played lyric line.

## Game Modes

### Easy / Open Mode

The board provides up to 12 open lyric rows.

Players can select a word and work with candidate lyric lines containing that
word.

### Standard Mode

Planned board size:

- 10 lyric rows

### Hard Mode

Planned board size:

- 8 lyric rows

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

Individual lyric lines remain separate occurrences even when two lines contain
identical text.

This is important because the game treats each occurrence as a distinct
playable lyric line.

## Current Song Data

The repository currently contains song data for:

- Zach Bryan
- Taylor Swift / Bon Iver

The current data includes:

- `Quittin' Time`
- `Pink Skies`
- `Appetite`
- `Overtime`
- `exile`

## Project Structure

```text
lyricSolitaire/
├── index.html
├── game.html
├── README.md
├── changelog.md
│
├── images/
│
├── css/
│   └── game.css
│
├── tools/
│   ├── lyrics-json-generator/
│   │   ├── index.html
│   │   ├── css/
│   │   │   └── generator.css
│   │   └── js/
│   │       └── generator.js
│   │
│   └── simulator/
│       ├── index.html
│       ├── css/
│       │   └── simulator.css
│       └── js/
│           └── simulator-ui.js
│
├── js/
│   ├── main.js
│   ├── components/
│   └── utilities/
│       ├── lyricsParser.js
│       └── simulator.js
│
└── json/
    ├── bryan_zach/
    └── swift_taylor/
```

## Development Conventions

Every JavaScript component we update should contain:

1. A responsibility comment at the top of the file.
2. Comments explaining important sections of code.
3. Comments explaining non-obvious game rules.
4. Clear function responsibilities.

The simulator deliberately separates:

- **Simulation engine** — `js/utilities/simulator.js`
- **Simulator interface** — `tools/simulator/js/simulator-ui.js`

This allows the same simulation engine to be reused later by automated tests
or other development tools.

## Versioning

Prototype versions identify the state of the project being tested.

Current prototype:

**v0.1.1**

Development history is maintained in [`changelog.md`](changelog.md).

## License

Development project by Christopher J. Seeger.

Additional licensing and distribution information will be established as the
project approaches release.
