# Simulator Lab

**Simulator version: 0.1.6**

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
6. Experiment Name (optional)
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

- `playableOnExistingLines`: tiles in the hand at the start of the play phase that can be placed on an already-active line.
- `playableByOpeningNewLine`: tiles in the hand at the start of the play phase that cannot use an existing line but can be placed by opening another line, when a row is available.
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
