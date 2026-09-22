# Lyric Solitaire

Lyric Solitaire is a word-based solitaire game in which players reconstruct song lyrics using physical-style word tiles drawn from song-specific word pools.

The project is being developed as a browser-based digital playtesting environment. The goal is to develop the game rules, balance, scoring, and song-data system before finalizing a physical tabletop version.

## Play and Development Tools

- **Cover page:** https://landviz-media.github.io/lyricSolitaire/
- **Game prototype:** https://landviz-media.github.io/lyricSolitaire/game.html
- **Simulator Lab:** https://landviz-media.github.io/lyricSolitaire/simulator.html

## Current Development Status

The simulator is the current primary development tool. **Simulator v0.1.0** tests the Easy / Open Mode assumptions with real song lyric and word-count data.

The player-facing game interface is still under development.

## Core Game Idea

Players draw individual word tiles from a persistent pool created from the selected songs. Tiles are played into lyric lines or remain held in the player's inventory. There is currently no discard mechanism.

Completing a lyric line immediately frees its row. Easy / Open Mode allows a player to work from lyric-line candidates containing a selected word.

## Song Data

Song data is maintained in the `song_library/` directory. Lyric JSON and word-count JSON files are maintained by the project owner. The application uses `song_library/song_catalog.json` as a composite index so new songs can be added without hard-coding filenames throughout the game.

The song information exposed to the player will include metadata such as artist, title, album, year, genre, **total words**, and **unique words**.

Difficulty will eventually be calculated rather than assigned as a simple permanent label. The eventual difficulty model is expected to consider song characteristics together with game parameters such as starting rows, turn count, hand limit, draw progression, word distribution, repetition, and other measurable gameplay factors.

## Simulator Lab

The simulator separates the simulation engine from the developer interface:

- `js/utilities/simulator.js` — game simulation rules and state
- `simulator.html` — developer-facing experiment interface
- `js/utilities/testResultLogger.js` — standardized JSON result logging/export

Each experiment records its parameters and aggregate results. Exported JSON files can be placed in `test_results/` and later combined for analysis and visualization.

## Test Results

The `test_results/` directory is intended to contain exported simulator experiment records. This provides a growing evidence base for evaluating solvability and eventually developing a data-driven challenge rating for songs.

## Documentation

Additional rules, simulator notes, and development history belong in Markdown files such as `docs/GAME_RULES.md`, `docs/SIMULATOR.md`, and `changelog.md`, rather than in this README.

## Project Structure

```text
lyricSolitaire/
├── index.html                 # Cover / coming-soon page
├── game.html                  # Player-facing game prototype
├── simulator.html             # Simulator Lab
├── README.md                  # GitHub project description
├── changelog.md               # Development history
├── docs/                      # Supporting game/developer documentation
├── images/                    # Application artwork
├── css/                       # Stylesheets
├── js/
│   ├── config/                # Shared project configuration
│   ├── data/                  # Shared data/catalog loaders
│   ├── components/            # Game UI components
│   └── utilities/             # Parsers, simulation, logging utilities
├── song_library/              # Maintained lyric and word-count data
└── test_results/              # Exported simulator experiment records
```

## Development Convention

Every JavaScript file we update should have a clear responsibility comment at the top and comments explaining important code sections and non-obvious game rules.

## License

Development project by Christopher J. Seeger. Licensing and distribution details will be established as the project approaches release.
