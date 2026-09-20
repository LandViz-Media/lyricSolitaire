# Dolly — Aggressive Row Filler

## The person

Dolly is an aggressive, completion-oriented player. She sees an unfinished lyric line as an opportunity to make progress and likes freeing rows quickly so another useful line can enter play. Unlike a purely reckless player, however, Dolly has some common sense: when the hand becomes crowded or the game advances, she becomes more selective about opening additional lines.

## Engine terminology

- **Active line priority:** A word that can be played into an existing active line is always evaluated before opening a new line.
- **Active-line scoring:** Candidate active lines are scored using current progress, remaining words, and the number of remaining copies of the selected word. The highest-scoring line is preferred.
- **Adaptive row target:** Dolly does not automatically fill every available row throughout the game.
  - Round 1: target up to the mode's maximum rows.
  - Rounds 2–3: target one fewer than the mode maximum.
  - Later rounds: target two fewer than the mode maximum.
- **Hand-pressure adjustment:** When the hand reaches 70% of its capacity, Dolly reduces the target by one additional row. At 85% capacity she reduces it by two additional rows.
- **New-line selection:** When a word cannot be used by an active line and the adaptive target has not been reached, Dolly may open a new candidate line.
- **Candidate preference:** New-line candidates are sorted by lyric length and selected from the shortest eight candidates, with random tie-breaking.
- **Completion:** A completed line immediately leaves the active board and frees a row.
- **Objective:** Maximize useful word placement and completed-line turnover without allowing aggressive row opening to unnecessarily saturate the hand.


## Endgame behavior

In the second-to-last round, the persona becomes somewhat more willing to open a new line. In the final round, this persona follows the shared maximum-play rule and no longer applies its normal new-line restraint.

## Lyric foresight

When selecting a new line, the simulator gives some weight to how many additional words already in the hand that line would unlock. This models a player who knows the song rather than treating candidate lyric lines as equally useful.
