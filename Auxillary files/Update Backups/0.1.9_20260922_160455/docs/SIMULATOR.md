# Simulator Lab

**Simulator version: 0.1.7**

## Purpose

The Simulator Lab is a research and balance-testing tool. It uses the maintained lyric JSON and word-count JSON data and retains complete individual trials so results can be examined later without rerunning an experiment.

## Personas

The simulator now contains three deliberately different decision-making models:

- **Dolly — Aggressive Row Filler:** aggressively completes active lines, but adapts new-line opening as the game advances and the hand becomes crowded.
- **Johnny — Walks the Line:** plays as many words as possible but opens no more than one new lyric line per round.
- **Kenny — The Gambler:** favors existing active lines first, then takes substantially more new-line risk; in Round 1 he targets nine or ten active lines when the mode permits it.

The detailed implementation logic is documented separately in `docs/personas/`.

## Experiment setup

Experiment Setup filters in this order:
1. Genre(s)
2. Artist(s)
3. Song(s)
4. Persona
5. Difficulty / Mode
6. Experiment Name (auto-generated; editable)
7. Trials
8. Random Seed

Song selection supports multiple songs. When more than one song is selected, their physical word pools and distinct lyric-line occurrences are combined into one simulation bundle.

## Deterministic seeds

The entered Random Seed is a **base seed**. Trial `i` receives a deterministic random stream derived from that seed and the trial index. Therefore, the same experiment inputs should reproduce the same trial collection.

Changing any of these can change results:
- selected song(s)
- persona
- difficulty/mode
- trial count
- random seed
- simulation engine version

## Draw and hand capacity

The requested draw is:

- Round 1: 12
- Later rounds: `(13 - Round) + previous round words played`

The requested draw is then capped by:
- remaining physical word-pool size
- available hand capacity

For example, with a 40-tile Standard hand, a player holding 39 tiles at the start of a round can draw only one additional tile even if the calculated requested draw is 10.

## Modes

| Mode | Rows | Hand Limit | Maximum Rounds |
|---|---:|---:|---:|
| Easy / Open | 12 | 50 | 12 |
| Standard | 10 | 40 | 10 |
| Hard | 8 | 30 | 8 |

## Round trace

Each trial records requested draw, actual draw, hand size before and after play, words played, completed lines, active lines, pool remaining, and the number of new lines opened during the round. It also records per-round playability diagnostics. These metrics count physical tiles, so duplicate words count as separate tiles:

- `playableOnExistingLines`: physical tiles that can be accommodated by the remaining word demand on already-active lines. Duplicate copies are capped by the number of matching slots, so three copies of a word with only one matching slot count as one playable tile.
- `playableByOpeningNewLine`: physical tiles not accommodated by existing lines that match remaining demand on at least one candidate unopened line. This is an opportunity count, not a guarantee that every candidate line will actually be opened.
- `playedOnExistingLines`: tiles actually played onto lines that were already active.
- `playedByOpeningNewLine`: tiles actually played by opening a new line.
- `playableTilesRemainingUnplayed`: tiles still in the hand after the play phase that could legally be played either on an active line or by opening a new line, ignoring persona-specific reluctance to open a row.

The final metric is especially useful for determining whether a persona is actually holding back playable tiles. The first two metrics are a start-of-round snapshot; the two `played...` metrics record what actually happened during the play phase.

## Export

Use the **Export Results (JSON)** button to export the complete browser session. The optional Experiment Name is retained in the JSON record and contributes to the downloaded filename.

Filenames include a timestamp, so multiple exports on the same calendar day receive distinct names.

The export retains every experiment and every individual trial. This is intentional: later analysis should not require rerunning an experiment.

## Reset

Reset clears the page display but does not erase completed experiments from the browser session.

## Endgame behavior

Persona differences are strongest in the earlier rounds. In the second-to-last round, personas become more willing to open new lines because it is the last meaningful setup opportunity. In the final round, all personas use the same maximum-play rule: existing-line plays remain first priority, but persona-specific restrictions on opening new lines are suspended. A legal new line may be opened whenever a row is available.

## Lyric foresight

New-line selection includes limited look-ahead. The simulator rewards a candidate lyric line when the opening word also makes several other words already in the hand playable. This models the advantage of a player who knows the song and can recognize a productive line before opening it. Kenny receives the strongest foresight weight, Dolly an intermediate weight, and Johnny a lighter weight.

## Experiment naming

Experiment Name is automatically generated from the current song selection, persona, mode, trial count, and random seed, for example: `Everlong — Dolly — Standard — 10 trials — Seed 32451`. The field remains editable. A manually edited name is captured for that experiment; after the experiment is run, subsequent parameter changes generate a fresh name for the next experiment.

## Diagnostic Reference Persona — Garth

**Garth — Heuristic Reference Player** is a permanent diagnostic persona. Garth is not intended to represent a typical human playing style. Instead, he uses the simulator's full knowledge of the current lyric lines and hand to evaluate legal moves and look for promising short-term cascades.

Garth's heuristic gives strong priority to: 

1. completing a lyric line immediately;
2. maximizing additional words in the current hand that can use the resulting line;
3. advancing a line toward completion; and
4. avoiding unnecessary new-line openings when otherwise comparable moves exist.

Garth evaluates the current legal move set repeatedly after each play. This makes him useful as a reference point when comparing the human-style personas, but **Garth is not a mathematical proof of solvability**. A Garth loss does not prove that a deal is unsolvable.

### Future Guaranteed Persona — Hank

The project reserves **Hank** as the name for a future mathematically guaranteed solver. Hank should only be introduced after the solver can be defined precisely and validated as an exhaustive/complete search under the simulator's actual rules. Until then, Garth remains the upper-reference diagnostic.
