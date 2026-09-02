/*
 * Lyric Solitaire — Project Version and Persona Configuration
 *
 * Responsibility:
 * Stores project/tool versions and the named simulator personas. The UI and
 * exported experiment records read version/persona information from here.
 */
window.LyricSolitaireProject = {
    gameVersion: "0.1.0",
    simulatorVersion: "0.1.3",
    dataSchemaVersion: "1.3",

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
