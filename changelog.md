# Changelog

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
