# Changelog

All notable Lyric Solitaire development changes are recorded here.

## [0.1.2] — 2026-09-02

### Added
- Added simulator-version provenance to every individual trial.
- Added an explicit Simulator Version field to the current experiment display.
- Added simulator-version filtering to the Results Viewer.
- Established v0.1.2 as the clean baseline for the next systematic test campaign.

### Clarified
- `Export Results (JSON)` is the canonical permanent experiment record.
- `Export Session History` is a browser convenience export and is not required for normal testing.
- Reset is optional between experiments because Run Simulation starts a fresh experiment.

### Testing
- Standard/Hard mode parameters are now applied by the v0.1.1+ simulation engine.
- Older v0.1.0 Standard/Hard records remain historical and should not be treated as valid evidence for those modes.

## [0.1.1] — 2026-09-02

### Added
- Complete individual-trial collections in simulator exports.
- All-words-used tracking.
- Initial Results Viewer.
- Centralized simulator-version display.

### Fixed
- Standard and Hard mode configuration in the simulation engine.
- Deterministic seed progression.
- Automatic clearing when a new simulation begins.

## [0.1.0] — 2026-09-02

Initial Simulator Lab release.

## Data Changelog

New songs discovered or added to `/song_library` may be recorded here. Lyric and word-count source files remain maintained by the project owner.
