/*
 * Lyric Solitaire — Song Catalog Loader
 *
 * Responsibility:
 * Loads the composite song catalog that points the application to the
 * maintained song-library JSON files.
 *
 * The project owner maintains /song_library. The loader falls back to the
 * legacy /json location only so an in-progress migration does not break the
 * application.
 */
window.LyricSolitaireSongCatalog = {
    urls: [
        "song_library/song_catalog.json",
        "json/song_catalog.json"
    ],

    _activeCatalogSource: null,

    async load() {
        let lastError = null;

        for (const url of this.urls) {
            try {
                const response = await fetch(url, { cache: "no-store" });

                if (!response.ok) {
                    lastError = new Error(`${url}: HTTP ${response.status}`);
                    continue;
                }

                const data = await response.json();
                this._activeCatalogSource =
                    url.startsWith("song_library/") ? "song_library" : "json";
                data._catalogSource = url;
                return data;
            } catch (error) {
                lastError = error;
            }
        }

        throw new Error(
            `Unable to load song catalog. ${lastError?.message || ""}`
        );
    },

    resolveDataPath(path) {
        const value = String(path);

        if (
            this._activeCatalogSource === "json" &&
            value.startsWith("song_library/")
        ) {
            return value.replace(/^song_library\//, "json/");
        }

        if (value.startsWith("song_library/")) {
            return value;
        }

        return value.replace(/^json\//, "song_library/");
    }
};
