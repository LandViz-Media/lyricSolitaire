# Hank Solver

**Hank — Exhaustive Game Analysis** is a separate analytical tool for Lyric Solitaire. Hank is not a fifth Simulator persona. It analyzes one exact seeded game independently of the Simulator engine.

## Simulator handoff

From Simulator Lab, select the song(s), mode, and random seed, then choose **Solve This Game with Hank ↗**. Lyric Solitaire opens `hank.html` in a new browser tab and passes only the game-defining parameters in the URL.

Hank then loads the current song catalog and lyric data itself. It does not reuse the Simulator's current game state, trial result, or persona logic.

## Purpose

Hank answers three different questions:

- **PROVEN SOLVABLE** — Hank found a legal sequence that completes every source lyric line.
- **PROVEN UNSOLVABLE** — Hank exhausted the reachable legal state space without finding a winning sequence.
- **SEARCH INCOMPLETE** — the configured state or time limit stopped the search before the reachable state space was exhausted.

Only the first two statuses are proof results. A heuristic player's success or failure is not substituted for Hank's exhaustive search.

## Exact seeded reconstruction

The seeded game boundary is deliberately independent from player search:

1. Normalize the supplied seed using the same 32-bit rule as the Simulator.
2. Build the physical word pool from the word-count data.
3. Apply the Simulator's seeded Fisher-Yates shuffle.
4. Draw the initial 12 physical tiles using the same random-index removal rule.
5. Begin Hank's search at the first player-choice state.

Player moves do not consume random numbers. Random state advances only during shuffle and future draw phases.

## Search model

Hank searches legal player choices with depth-first search and memoization. It does not rank moves by a heuristic and then treat the selected path as proof.

A state records the game information needed to reproduce all future legal transitions, including:

- current round
- words played in the previous and current round
- hand word counts
- active lyric lines and their remaining words
- unopened source-line IDs
- ordered remaining physical pool
- exact seeded RNG state

Completed lines are removed immediately, freeing their rows.

## Resource limits

The Hank UI provides two safety limits:

- maximum states
- maximum search time

If either limit interrupts the search, Hank reports **SEARCH INCOMPLETE** rather than calling the game unsolvable.

## Solution traces

When Hank finds a winning path, the result contains the legal move sequence, including:

- round number
- `PLAY_ACTIVE` or `OPEN_LINE`
- source line ID
- word played

The exported proof JSON also records the reconstructed initial state and search statistics.

## Validation direction

Hank is being developed correctness-first. Validation includes exact seeded-state checks, tiny independently solved game cases, solution-trace replay, and regression checks against the existing Simulator personas.
