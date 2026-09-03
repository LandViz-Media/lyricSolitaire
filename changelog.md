# Changelog

## [0.1.4] — 2026-09-03

### Added
- Reworked the Lyric Generator song workflow so a song is generated from two required local source assets: the maintained lyric `.txt` file and its album-art thumbnail.
- Added album-art selection and validation for PNG/JPG/JPEG files. The current standard is exactly 200×200 pixels; `_lg` artwork is reserved for a future larger-art convention.
- Added a complete local-library catalog builder that scans the selected `song_library` directory and generates a fresh `song_catalog.json` from the files actually present.
- Added catalog validation/reporting for artist count, song count, generated JSON coverage, album-art coverage, missing files, and nonstandard album-art dimensions.

### Changed
- The catalog is now treated as a derived manifest rather than an incrementally edited file. This supports generating multiple new artists/songs locally before publishing everything together without losing earlier additions.
- Existing artist keys are preserved when rebuilding the catalog, including featured-artist cases such as Taylor Swift feat. Bon Iver.
- Album-art matching first uses the album name within the song's artist folder and falls back to the existing catalog mapping when needed.
- Generator instructions now recommend: generate all songs locally → place JSON files in `song_library` → rebuild one complete catalog → push the complete library to GitHub.

### Fixed
- Removed the generator's previous instruction to manually update `song_catalog.json` after each song.

### Testing Notes
- The current repository library contains 6 artists and 10 lyric source files.
- The current library scan identifies album-art files for all 10 songs, but two existing thumbnails are not yet at the 200×200 standard and will be reported by the new validator: Cyndi Lauper artwork is 250×250 and Dolly Parton artwork is 344×344.


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
## [0.1.3.2] — 2026-09-02

### Changed
- Rebuilt the Lyric Generator interface with a clearer five-step workflow and a visual design consistent with the Simulator and Results tools.
- Added Raw GitHub URL loading alongside local `.txt` file browsing and pasted lyric text.
- Updated the generator to use the maintained source format: **Artist, Song Title, Album, Year, Genre**.
- Added automatic artist-key detection using the existing `song_catalog.json` when an artist is already registered, with derived keys for new artists.
- Added an explicit `generatorVersion` to the shared project version configuration.

### Fixed
- Corrected the generator's metadata parsing bug that treated the first line as the song title and the second line as the artist.
- Updated the source-format instructions and placeholder text to match the established `song_library` convention.

### Notes
- No song-library data was changed in this release. New or changed songs should continue to be verified against `song_library/` before catalog updates.

## v0.1.4.1 — Generator parse-error fix and JavaScript split
- Fixed the Parse Selected Song error caused by the new generator controller still referencing the removed `#source` textarea.
- Local TXT selection now stores the selected source text in generator state and parsing uses that state directly.
- Moved generator controller JavaScript out of `generator.html` into `js/generator.js` for maintainability.
- Kept the v0.1.4 album-art validation and complete local-library catalog rebuild workflow unchanged.

## [0.1.4.3] — 2026-09-03

### Changed
- Simplified the lyric generator so it generates only the two song JSON files; catalog construction is now handled by a separate local Mac command utility.
- Moved generator JavaScript into `js/generator.js`.

### Added
- Required album-art selection before song generation.
- PNG, JPG, and JPEG album-art validation with an exact 200×200 pixel requirement.
- Album-art preview and validation status in the generator.
- Documented `_lg` as the reserved suffix for future larger artwork versions.
- Added `Build_Song_Catalog.command`, a local-only catalog builder for `song_library/`.

### Fixed
- Removed the browser-based local-library catalog scan, avoiding the need to grant the generator access to the entire `song_library`.
