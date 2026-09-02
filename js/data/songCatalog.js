/*
 * Lyric Solitaire — Song Catalog Loader
 *
 * Responsibility:
 * Loads the composite song catalog from /song_library and provides path
 * resolution for the lyric and word-count JSON files.
 *
 * /song_library is the maintained source-data location.
 */
window.LyricSolitaireSongCatalog = {
    catalogUrl: "song_library/song_catalog.json",
    catalog: null,

    async load() {
        const response = await fetch(
            `${this.catalogUrl}?v=${window.LyricSolitaireProject.simulatorVersion}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(
                `Unable to load song catalog: HTTP ${response.status}`
            );
        }

        this.catalog = await response.json();
        return this.catalog;
    },

    resolveDataPath(path) {
        const value = String(path || "");

        if (value.startsWith("song_library/")) {
            return value;
        }

        // Compatibility for older catalog entries.
        return value.replace(/^json\//, "song_library/");
    }
};
