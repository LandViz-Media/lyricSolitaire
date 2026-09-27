# Lyric Solitaire 0.1.9 Update

This update introduces **Hank — Exhaustive Game Analysis**, a separate solver for analyzing one exact seeded Lyric Solitaire game.

## Included

- `simulator.html` — adds **Solve This Game with Hank ↗**
- `hank.html` — independent Hank Solver interface
- `js/utilities/hankState.js`
- `js/utilities/hankRules.js`
- `js/utilities/hankSearch.js`
- `js/utilities/hankSolver.js`
- `js/config/projectVersion.js`
- `docs/HANK.md`
- `docs/SIMULATOR.md`
- `changelog.md`
- `PROJECT_DISCUSSION_LOG.md`
- `Install_LyricSolitaire_0.1.9.command`

## Simulator → Hank workflow

The Simulator remains the batch simulation environment for Dolly, Johnny, Kenny, and Garth.

When a selected game needs exact analysis, click **Solve This Game with Hank ↗**. The browser opens a separate Hank tab containing the selected song(s), mode, and seed. Hank independently reconstructs the seeded game and performs the search.

The Simulator does **not** run Hank internally, and Hank does **not** depend on a Simulator trial result.

## Hank results

Hank reports one of three statuses:

- **PROVEN SOLVABLE**
- **PROVEN UNSOLVABLE**
- **SEARCH INCOMPLETE**

The last status is used whenever a state-count or time limit prevents complete enumeration.

## Install

Double-click `Install_LyricSolitaire_0.1.9.command` on macOS and select the local Lyric Solitaire repository root. The installer backs up changed files into `Auxillary files/Update Backups/0.1.9_<timestamp>/` before copying the update.

No song-library files are changed by this update.
