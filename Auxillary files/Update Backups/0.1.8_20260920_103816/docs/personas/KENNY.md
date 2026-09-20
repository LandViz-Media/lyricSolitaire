# Kenny — The Gambler

## The person

Kenny is the gambler. He sees possibilities everywhere and is willing to take much more opening risk than the other players. In the opening round he may build a very wide board—nine or ten lines when the mode permits it. He is not completely reckless, though: if a word can advance an existing line, he plays it there before using that word to gamble on another line.

## Engine terminology

- **Active line priority:** Existing active-line matches always take precedence over new-line opening.
- **Opening behavior:** When no active line can use the word, Kenny may open a new line whenever an active row is available.
- **Round 1 target:** Kenny deliberately continues opening lines until he reaches nine or ten active lines, subject to the mode's maximum row count and available playable candidates.
- **Post-opening behavior:** After Round 1, Kenny continues to permit new-line openings whenever a row is available, making him substantially more expansion-oriented than Dolly or Johnny.
- **New-line selection:** Candidate lines use the shared shortest-candidate mechanism, with random tie-breaking among the shortest eight.
- **Completion:** Completed lines immediately free rows, which Kenny can use for additional opening opportunities.
- **Objective:** Maximize opportunity and word utilization by accepting a high risk of board expansion and hand saturation.


## Endgame behavior

In the second-to-last round, the persona becomes somewhat more willing to open a new line. In the final round, this persona follows the shared maximum-play rule and no longer applies its normal new-line restraint.

## Lyric foresight

When selecting a new line, the simulator gives some weight to how many additional words already in the hand that line would unlock. This models a player who knows the song rather than treating candidate lyric lines as equally useful.
