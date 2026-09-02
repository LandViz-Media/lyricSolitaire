/*
 * Lyric Solitaire — Song Catalog Loader
 *
 * Responsibility:
 * Loads the composite song manifest and provides helper functions for the
 * simulator/game to locate lyric and word-count JSON files.
 *
 * Long-term data location:
 *   /song_library/
 *
 * During the one-time migration from the old /json folder, this loader will
 * fall back to /json when the song_library copy is not present.
 */
window.LyricSolitaireSongCatalog = {
  urls: ["song_library/song_catalog.json", "json/song_catalog.json"],

  async load() {
    let lastError = null;

    for (const url of this.urls) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          this._activeCatalogSource = url.startsWith("json/") ? "json" : "song_library";
          data._catalogSource = url;
          return data;
        }
        lastError = new Error(`${url}: ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Unable to load song catalog. Tried song_library/ and json/. ${lastError?.message || ""}`
    );
  },

  resolveDataPath(path) {
    if (String(path).startsWith("song_library/")) {
      return path;
    }
    return String(path).replace(/^json\//, "song_library/");
  }
};
