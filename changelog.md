# Changelog

## [0.1.3] — 2026-09-02

### Added
- Added the first named simulator persona: **Dolly — Aggressive Row Filler**.
- Added persona metadata to experiment records and individual trials.
- Added a single-session export workflow for multiple experiments.
- Added complete individual-trial retention without localStorage.
- Added the first Results Viewer header artwork.
- Added shared tool navigation between Home, Simulator, Generator, and Results.
- Added a new `generator.html` interface for converting maintained lyric `.txt` files into lyric and word-count JSON.
- Added simulator-version filtering and persona filtering to the Results Viewer.
- Added cache-busting to simulator JavaScript references.

### Changed
- Export Results is now the single permanent export control.
- Browser refresh starts a new simulator session.
- The previous session-history/localStorage approach is no longer used for full experiment data.

### Testing
- v0.1.3 is the first clean baseline for the large systematic test campaign.
