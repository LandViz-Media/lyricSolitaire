# Changelog

## [0.1.3.2] — 2026-09-02

### Fixed
- Fixed the lyric generator metadata parser to use the maintained source format:
  Artist, Song Title, Album, Year, Genre.
- Fixed the generator so Artist and Song Title are no longer reversed when JSON is generated.

### Added
- Added Raw GitHub URL loading to the lyric generator.
- Added file-browser and pasted-text source options to the generator workflow.
- Added automatic artist-key/folder detection using existing entries in
  `song_library/song_catalog.json`, with a surname-first fallback for new artists.
- Added generator version `0.1.3.2` to the shared project version configuration.

### Changed
- Updated generator instructions and source-text examples to match the established
  five-line lyric source convention.
- Kept the artist key editable after automatic detection.

### Repository Cleanup
- Removed the obsolete `/json` song-data location and retired the old lyric-generator tool path.
- Removed obsolete backup/update files from the active repository; project history is now maintained in this changelog.

### Data
- No new song was added in this release. Dolly Parton / 9 to 5 remains intentionally
  out of the maintained song library until it can be regenerated with the corrected generator.

## [0.1.3.1] — 2026-09-02

### Fixed
- Corrected the v0.1.3 overlay so all required JavaScript dependencies are
  actually installed.
- Fixed the blank Artist, Song, and Persona controls caused by the missing
  JavaScript dependency tree.
- Added explicit cache-busting to simulator JavaScript references.
- Added the current simulator version to every individual trial.
- Kept experiment data in browser memory instead of localStorage, avoiding
  quota failures for 1,000-trial experiments.

### Added
- First named persona: **Dolly — Aggressive Row Filler**.
- Single session-wide **Export Results (JSON)** workflow.
- Persona metadata and filtering.
- Initial Results Viewer session-file support.
- Shared navigation between Home, Simulator, Generator, and Results.

### Important
v0.1.3 was not a valid testing release because its installer package did not
reliably install the JavaScript dependency tree. Do not use v0.1.3 as the
baseline for experiments. Use v0.1.3.1.

## [0.1.3] — 2026-09-02

Initial persona, single-session export, results viewer, generator, and shared
navigation work.

## Data Changelog

New songs discovered or added to `/song_library` may be recorded here.
