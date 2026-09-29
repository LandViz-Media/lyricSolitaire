# Lyric Solitaire — Separate RNG Streams v0.1.18

This update separates the Simulator's deterministic random-number generation into two streams:

- **Tile-draw RNG** — physical pool shuffle and random-index tile draws.
- **Player-decision RNG** — persona tie-breaking and other random player choices.

The existing game mechanics are preserved. The tile stream uses the same per-trial seed as before,
so player-decision RNG calls no longer advance the tile-draw stream.

## Install

1. Double-click `Install_LyricSolitaire_RNG_Streams_v0.1.18.command`.
2. Select the local **Lyric Solitaire repository root** in the Finder dialog.
3. The installer backs up every changed file under:
   `Auxillary files/Update Backups/0.1.17_<timestamp>/`
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

This v0.1.12 build includes an opt-in **Tile RNG Diagnostic** checkbox in Simulator Lab.
When enabled, each trial records the tile RNG seed, initial shuffle RNG-call count, and every
physical tile draw in order. Each draw records its global draw index, round, within-round draw
index, word/key, RNG value, selected pool index, and pool size before removal.

Use this mode to compare Dolly, Kenny, Johnny, and Garth with the same song, mode, and seed.
The tile-draw sequence should remain identical across personas even when their decision RNG usage differs.


### Paired Tile RNG Diagnostic
The v0.1.12 diagnostic workflow can run Dolly and Kenny on the same song, mode, and seed and export one JSON comparison proving whether their tile-draw sequences are identical despite independent decision RNG usage.


## Paired Tile RNG Comparison Update

The paired Dolly/Kenny comparison now separates two diagnostics:

- **Tile-stream identity** compares `drawIndex`, `word`, `key`, `randomValue`, `poolIndex`, and `poolLengthBefore`. It intentionally ignores `round` and `roundDrawIndex`.
- **Round timing** separately compares `round` and `roundDrawIndex`, so different persona play rates can be reported without being mistaken for a different tile RNG stream.

The JSON retains the top-level `comparison.identical` field for compatibility; it represents physical tile-stream identity. Detailed results are available under `comparison.tileStream` and `comparison.roundTiming`.


### v0.1.12 — Decision Divergence Diagnostic
The paired Dolly/Kenny comparison now records persona decisions, persona-specific available legal moves, and the resulting game state. The comparison reports the first differing selected move and preserves the separate tile-stream and round-timing diagnostics.


### v0.1.13 — Decision Divergence Classification
The paired Dolly/Kenny comparison now distinguishes a genuinely different legal move from a move that is structurally the same but targets a different duplicate lyric-line instance. A duplicate-instance divergence has the same action, hand tile, word/key, and lyric text but a different `lineId`. The exported `decisionDivergence` record includes `reason` and `moveComparison` fields for this distinction.


### v0.1.18 — Opening Value Comparison Diagnostics

Adds a diagnostic-only before/after comparison for every hypothetical new-line opening. Each opening now records the specific physical hand tiles, words, and lyric lines that become newly playable after the opening. The diagnostic distinguishes opportunities on existing active lines from opportunities on newly available inactive lines, while preserving the v0.1.16 blocked-opening and aggregate playability metrics.

New fields include:
- `newlyPlayableOpportunityCount`
- `newlyPlayableWords`
- `newlyPlayableLines` with `handIndex`, `word`, `key`, `lineId`, `lineText`, and `source`
- `openingValueComparison` summary counts

The hypothetical comparison preserves each physical hand tile's original index so duplicate words remain distinguishable. No gameplay, RNG, persona behavior, or win logic is changed.

### v0.1.16 — Blocked New-Line Opening Diagnostics

Enumerates every hand tile that can open an inactive lyric line, including new-line-only tiles, and records whether each opening is allowed, blocked by persona policy, or blocked by row capacity. This diagnostic does not alter gameplay or RNG behavior.


Adds a non-invasive terminal-state audit for tiles that can both play on existing lines and open inactive lines. Each candidate opening reports hypothetical future physical-tile playability and whether the opening increases that playability.

### v0.1.14 — Consequential Decision Divergence

The paired Dolly/Kenny comparison now continues past the first decision divergence when that divergence is classified as `DUPLICATE_LINE_INSTANCE`. It reports the first later consequential move difference, rather than treating the duplicate line ID alone as the behavioral cause. The diagnostic also reports the first decision where the personas consume different physical tiles, including each tile's hand index, word, and key.

The new `comparison.firstConsequentialDivergence` record is diagnostic only and does not alter game rules or RNG behavior.


### v0.1.18 — Chain Value Diagnostic

Adds a diagnostic-only bounded chain explorer to every hypothetical new-line opening. After the opening, it follows subsequent playable physical hand tiles across active lyric lines through deterministic hypothetical branches. It reports chain depth, path steps, newly playable content, node counts, truncation, and top chains. It does not alter gameplay, persona decisions, or either RNG stream.
