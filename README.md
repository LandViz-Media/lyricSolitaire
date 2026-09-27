# Lyric Solitaire — Separate RNG Streams v0.1.10

This update separates the Simulator's deterministic random-number generation into two streams:

- **Tile-draw RNG** — physical pool shuffle and random-index tile draws.
- **Player-decision RNG** — persona tie-breaking and other random player choices.

The existing game mechanics are preserved. The tile stream uses the same per-trial seed as before,
so player-decision RNG calls no longer advance the tile-draw stream.

## Install

1. Double-click `Install_LyricSolitaire_RNG_Streams_v0.1.10.command`.
2. Select the local **Lyric Solitaire repository root** in the Finder dialog.
3. The installer backs up every changed file under:
   `Auxillary files/Update Backups/0.1.10_<timestamp>/`
4. Run the Simulator normally.

The installer does **not** modify `song_library/` or its contents.

## Recommended validation

Run:

- Song: Everlong
- Persona: Dolly
- Mode: Easy / Open
- Trials: 1000
- Seed: 32451

Export the results so the new RNG behavior can be compared with the previous diagnostic export.

## Tile RNG Diagnostic

This v0.1.10 build includes an opt-in **Tile RNG Diagnostic** checkbox in Simulator Lab.
When enabled, each trial records the tile RNG seed, initial shuffle RNG-call count, and every
physical tile draw in order. Each draw records its global draw index, round, within-round draw
index, word/key, RNG value, selected pool index, and pool size before removal.

Use this mode to compare Dolly, Kenny, Johnny, and Garth with the same song, mode, and seed.
The tile-draw sequence should remain identical across personas even when their decision RNG usage differs.


### Paired Tile RNG Diagnostic
The v0.1.10 diagnostic workflow can run Dolly and Kenny on the same song, mode, and seed and export one JSON comparison proving whether their tile-draw sequences are identical despite independent decision RNG usage.


## Paired Tile RNG Comparison Update

The paired Dolly/Kenny comparison now separates two diagnostics:

- **Tile-stream identity** compares `drawIndex`, `word`, `key`, `randomValue`, `poolIndex`, and `poolLengthBefore`. It intentionally ignores `round` and `roundDrawIndex`.
- **Round timing** separately compares `round` and `roundDrawIndex`, so different persona play rates can be reported without being mistaken for a different tile RNG stream.

The JSON retains the top-level `comparison.identical` field for compatibility; it represents physical tile-stream identity. Detailed results are available under `comparison.tileStream` and `comparison.roundTiming`.
