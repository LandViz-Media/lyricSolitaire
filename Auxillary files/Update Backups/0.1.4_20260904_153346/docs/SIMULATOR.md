# Simulator Lab

**Simulator version: 0.1.3.1**

## First named persona

**Dolly — Aggressive Row Filler**

Dolly represents the current simulator decision-making strategy:
- prefer active lyric lines closest to completion
- play every usable word
- open a new candidate line when an available row permits it
- favor shorter candidate lines when opening a row

The persona is recorded at the experiment and individual-trial levels so
alternate strategies can later be compared directly.

## Session workflow

Run as many experiments as desired during one browser session. The simulator
keeps complete experiment data in memory rather than localStorage.

Use the single **Export Results (JSON)** button when the session is ready.
The resulting JSON contains every experiment from that session and every
individual trial in each experiment.

Refresh the browser to begin a new session.

## Reset

Reset only clears the page display. It does not need to be pressed between
experiments.

## Modes

| Mode | Rows | Hand Limit | Maximum Rounds |
|---|---:|---:|---:|
| Easy / Open | 12 | 50 | 12 |
| Standard | 10 | 40 | 10 |
| Hard | 8 | 30 | 8 |

## Results

Every experiment records aggregate values plus:
- complete individual trial collection
- `allWordsUsedTrials`
- `allWordsUsedRate`
- `everAllWordsUsed`
- simulator version
- persona and persona description
- mode and rule parameters

## Cache Busting

Simulator JavaScript references include the simulator version in their query
string so browser/GitHub Pages caches are less likely to serve an older
JavaScript file after an update.
