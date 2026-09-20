# Johnny — Walks the Line

## The person

Johnny is the steady player. He wants to use as many words as possible, but he does not want to spread himself across the whole board. He walks the line: keep working the lines already in front of him and introduce only one new lyric line in a round.

## Engine terminology

- **Active line priority:** A playable word is always placed into an existing active line before the engine considers opening a new line.
- **Unlimited active-line play:** Johnny continues scanning the hand while playable words remain, so the one-line restriction does not limit how many words he can play.
- **New-line allowance:** `openedThisRound < 1`. At most one new lyric-line occurrence may be opened during a round.
- **After allowance:** If a remaining word cannot be used by an existing active line after Johnny has opened his one new line, that physical tile stays in the hand.
- **New-line selection:** Candidate lines are chosen using the shared shortest-candidate mechanism, with random tie-breaking among the shortest eight.
- **Completion:** A completed line immediately frees its row, but that does not reset Johnny's one-new-line allowance for the current round.
- **Objective:** Maximize words played while controlling board expansion and reducing the risk of a saturated hand.


## Endgame behavior

In the second-to-last round, the persona becomes somewhat more willing to open a new line. In the final round, this persona follows the shared maximum-play rule and no longer applies its normal new-line restraint.

## Lyric foresight

When selecting a new line, the simulator gives some weight to how many additional words already in the hand that line would unlock. This models a player who knows the song rather than treating candidate lyric lines as equally useful.
