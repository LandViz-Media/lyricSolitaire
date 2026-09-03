/*
 * Lyric Solitaire — Project Version Configuration
 *
 * Responsibility:
 * Stores application/tool versions and named simulator personas used by
 * the simulator UI, generator UI, and exported experiment records.
 */
window.LyricSolitaireProject = {
    gameVersion: "0.1.0",
    simulatorVersion: "0.1.3.1",
    generatorVersion: "0.1.4.3",
    dataSchemaVersion: "1.3.1",

    personas: [
        {
            id: "aggressive_row_filler",
            name: "Dolly — Aggressive Row Filler",
            description:
                "Prioritizes completing active lyric lines, freeing rows quickly, " +
                "and using newly available rows to introduce additional playable lines.",
            strategy:
                "Prefer active lines closest to completion; play every usable word; " +
                "when opening a row, favor shorter candidate lines."
        }
    ],

    defaultPersonaId: "aggressive_row_filler"
};
