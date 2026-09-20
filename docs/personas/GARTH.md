# Garth — Heuristic Reference Player

## Plain-language description

Garth is the Simulator's diagnostic reference player. He is deliberately different from Dolly, Johnny, and Kenny: rather than trying to imitate a recognizable human playing style, he can use broad knowledge of the current lyric board and hand to search the legal moves for promising short-term outcomes.

Garth is called a **heuristic reference** because his move selection is based on a scoring function and limited look-ahead. He does not exhaustively search every possible future sequence.

## Engine behavior

For each play opportunity, Garth considers every hand tile that can legally be placed on an existing active lyric line. When opening a new line, he ranks eligible candidates by how many current-hand words they can accommodate and examines the strongest candidates first. This bounded look-ahead keeps large simulation batches practical.

Candidate moves are scored primarily by:

1. immediate completion of a lyric line;
2. the number of additional hand tiles that the resulting line can accept;
3. progress made toward completing the line; and
4. a small cost for opening a new line.

After each move, the legal move set is evaluated again. Completed lines immediately free their rows, consistent with the simulator's normal rules.

## Why Garth exists

Garth provides a stable diagnostic reference for questions such as:

- Is a song demonstrably solvable under a given deal?
- How much does a human-style persona leave on the table relative to a more informed heuristic?
- Is a difficult result primarily caused by the song's word pool or by the persona's strategy?

A Garth win demonstrates that the heuristic found a winning play sequence for that deal. A Garth loss does **not** prove that no winning sequence exists.

## Future Hank persona

**Hank** is reserved for a future mathematically guaranteed solver. Hank should use an exhaustive or otherwise formally complete search of the legal game state, so that a reported loss can support a statement that no solution exists under the modeled rules. That work is intentionally separate from Garth.
