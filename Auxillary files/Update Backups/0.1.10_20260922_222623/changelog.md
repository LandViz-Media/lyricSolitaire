# Changelog

## [0.1.8] — 2026-09-20

### Simulator
- Added **Garth — Heuristic Reference Player** as a permanent diagnostic persona.
- Garth evaluates legal moves across the current hand and lyric board rather than following a human-style row-opening rule.
- Garth rewards immediate line completion, then near-term hand coverage/progress, with a small penalty for opening a new line.
- Garth remains deterministic under the simulator's seeded trial streams.
- Clearly documented Garth as a heuristic reference rather than a guaranteed solver.
- Kept the existing Dolly, Johnny, Kenny, and final-round rules unchanged.

### Future / Deferred
- Reserved the name **Hank — Guaranteed Solver** for a future mathematically guaranteed search/solver persona.
- Hank is intentionally not implemented in 0.1.8; the next design step is to determine whether an exhaustive or provably complete search is computationally practical across the simulator's song sizes and modes.

## [0.1.7] — 2026-09-20

### Changed
- Added automatic Experiment Name generation from current song selection, persona, mode, trial count, and random seed.
- Kept Experiment Name editable; a manually edited name is captured for that experiment, while the next experiment returns to automatic naming after the run.
- Added a second-to-last-round endgame adjustment for all personas.
- Added a universal final-round maximum-play rule that suspends persona-specific new-line restrictions.
- Added limited lyric foresight when selecting new lines: candidate lines that unlock multiple words already in the hand receive additional weight. This models the advantage of knowing the song.
- Corrected playability diagnostics so duplicate physical copies of a word are not all counted as playable when fewer matching slots exist on the board.
- Bumped the simulator to 0.1.7 and export schema to 1.3.3.

### Diagnostics
- Per-round playability metrics now distinguish physical tile capacity from simple word-key compatibility.


## [0.1.6] — 2026-09-19

### Simulator Diagnostics
- Added per-round playability metrics to every simulated trial.
- Recorded how many physical tiles were playable on existing active lines at the start of the play phase.
- Recorded how many tiles required opening a new line to become playable at the start of the play phase.
- Recorded how many tiles were actually played on existing lines versus by opening a new line.
- Recorded how many playable tiles remained unplayed after the play phase, using a persona-independent definition of legal playability.
- Kept duplicate word occurrences as separate physical tiles in all diagnostic counts.
- Bumped the simulator version to 0.1.6 and the exported experiment schema to 1.3.2.

### Research Purpose
- These diagnostics are intended to distinguish genuine persona restraint from simple lack of legal plays, especially when investigating whether a persona is holding playable tiles before the final rounds.


## [0.1.5] — 2026-09-07

### Simulator
- Made seeded trial creation explicitly deterministic: trial `i` receives a reproducible random stream derived from the entered base seed and trial index.
- Added three named simulator personas: **Dolly — Aggressive Row Filler**, **Johnny — Walks the Line**, and **Kenny — The Gambler**.
- Reworked persona execution so existing active-line matches always receive priority before a new lyric line can be opened.
- Added Dolly's adaptive new-line target and hand-pressure behavior to reduce unnecessary board saturation as a game progresses.
- Added Johnny's one-new-line-per-round constraint.
- Added Kenny's high-risk opening behavior, including a Round 1 target of nine or ten active lines when the selected mode permits it.
- Added `openedNewLines` to each round trace for persona analysis.

### Experiment Exports
- Added an optional **Experiment Name** field.
- Experiment names are retained in exported experiment records.
- Export filenames now include a descriptive slug and timestamp, preventing same-day filename collisions.
- Preserved complete session/trial export behavior.

### Documentation
- Added detailed persona files under `docs/personas/`. Each begins with a plain-language description followed by engine implementation terminology.
- Updated Simulator documentation and project discussion log with the new persona model and deterministic-testing decision.

## [0.1.4] — 2026-09-04



### Simulator
- Added Genre(s) as the first Experiment Setup filter, before Artist(s).
- Genre choices are derived from the current song catalog; selecting genre(s) filters the available artists and songs.
- Song selector now displays song titles only; artist context remains available through the separate Artist(s) selector.
- Updated simulator header treatment to use the shared Lyric Solitaire tool-header artwork and corrected the header alignment/left-edge spacing.
- Preserved the existing simulation engine, persona system, session logging, and result schema.

### Results Viewer
- Updated the Results Viewer header to match the visual language of the Simulator, using the shared tool-header artwork derived from the Lyric Solitaire cover graphic.
- Added the simulator version badge to the Results Viewer header.

### Generator
- Updated the Generator header to match the shared Simulator/Results visual design while retaining its existing v0.1.4.4 generation behavior.

### Project Memory
- Added `PROJECT_DISCUSSION_LOG.md` as the durable record of project discussions, decisions, rationale, issues, and deferred ideas.

### Data
- The user reports that `Get Back` by The Beatles has been added to `song_library` and the catalog has been updated on GitHub.
- No song-library data is modified by this release.

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

## [0.1.9] — 2026-09-22

### Hank Solver
- Added **Hank — Exhaustive Game Analysis** as a separate solver UI and engine rather than a fifth Simulator persona.
- Added `hank.html`, launched from Simulator Lab with **Solve This Game with Hank ↗**.
- The Simulator passes only selected song IDs, mode, and seed; Hank independently loads the song data and reconstructs the exact seeded game.
- Recreated the Simulator's seeded 32-bit random generator, Fisher-Yates shuffle, and random-index physical-tile draws as explicit Hank state transitions.
- Added canonical game-state representation, legal move generation, state transitions, memoization, and conservative exhaustive depth-first search.
- Added explicit proof statuses: `PROVEN_SOLVABLE`, `PROVEN_UNSOLVABLE`, and `SEARCH_INCOMPLETE`.
- Added configurable maximum-state and maximum-time limits so incomplete searches are never mislabeled as unsolvable.
- Added solution-trace and initial-state export information.
- Hank does not use Dolly, Johnny, Kenny, or Garth strategy restrictions.

### Architecture
- Kept Simulator Lab focused on batch simulation and persona comparison.
- Kept Hank as an independent exact-analysis instrument.
- Added `docs/HANK.md` documenting the solver contract and Simulator handoff.

### Data
- Inspected the available `song_library` before the update. No song-library files are modified by this release.

## [Lyric Data Audit 0.1.0] — 2026-09-23

### Added
- Added a read-only **Lyric Data Audit** for validating the song source-to-tile pipeline.
- Added Finder folder selection through `Audit_Lyric_Data.command`.
- Added per-song source/JSON/physical-tile conservation checks.
- Added per-word frequency mismatch reporting and line-by-line lyric comparison.
- Added Unicode normalization, apostrophe, zero-width character, whitespace, dash, digit, and confusable-character diagnostics.
- Added `song_catalog.json` file/reference and metadata validation.
- Added JSON and HTML audit reports under `Auxillary files/Lyric Data Audit/`.

### Safety
- The audit never regenerates, edits, renames, moves, or deletes files in `song_library`.

## [Lyric Data Audit 0.1.0] — 2026-09-23

### Added
- Added a read-only **Lyric Data Audit** for validating the song source-to-tile pipeline.
- Added Finder folder selection through `Audit_Lyric_Data.command`.
- Added per-song source/JSON/physical-tile conservation checks.
- Added per-word frequency mismatch reporting and line-by-line lyric comparison.
- Added Unicode normalization, apostrophe, zero-width character, whitespace, dash, digit, and confusable-character diagnostics.
- Added `song_catalog.json` file/reference and metadata validation.
- Added JSON and HTML audit reports under `Auxillary files/Lyric Data Audit/`.

### Safety
- The audit never regenerates, edits, renames, moves, or deletes files in `song_library`.
