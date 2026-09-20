/*
 * Lyric Solitaire — Project Version Configuration
 *
 * Responsibility:
 * Stores application/tool versions and named simulator personas used by
 * the simulator UI and exported experiment records.
 */
window.LyricSolitaireProject = {
    gameVersion: "0.1.0",
    simulatorVersion: "0.1.5",
    generatorVersion: "0.1.4.4",
    dataSchemaVersion: "1.3.1",

    personas: [
        {
            id: "aggressive_row_filler",
            name: "Dolly — Aggressive Row Filler",
            description: "An aggressive player who likes finishing lyric lines quickly, but develops enough common sense to avoid filling every row when the hand is becoming crowded.",
            strategy: "Prioritize the most nearly complete active line; play every usable word; adapt the new-line target downward as the round advances or hand pressure rises; prefer short candidate lines when opening a row."
        },
        {
            id: "walks_the_line",
            name: "Johnny — Walks the Line",
            description: "A steady player who wants to use as many words as possible without spreading the board too quickly. He will open only one new lyric line per round.",
            strategy: "Always prefer a playable word on an existing active line; permit at most one new line opening per round; after the new-line allowance is used, hold otherwise playable-to-new-row words until a later round."
        },
        {
            id: "gambler",
            name: "Kenny — The Gambler",
            description: "A risk-taking player who is willing to build a very wide board early. He looks for opportunity everywhere, but still uses a word on an existing line before gambling on a new line.",
            strategy: "Prefer existing active-line matches first; when no active line can use the word, open a new line whenever a row is available; in Round 1 deliberately target 9 or 10 active lines when the mode permits, then continue taking substantially more opening risk."
        }
    ],

    defaultPersonaId: "aggressive_row_filler"
};
