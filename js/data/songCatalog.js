/*
 * Lyric Solitaire
 * Song Catalog Loader
 *
 * Responsibility:
 * Loads the composite song manifest from /json/song_catalog.json so the
 * game and developer tools do not need hard-coded song file references.
 *
 * The /json directory remains the source of truth for lyric and word-count
 * data. When new songs are added, update song_catalog.json with their paths.
 */

window.LyricSolitaireSongCatalog = {
  url: "json/song_catalog.json",

  async load() {
    const response = await fetch(this.url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load song catalog: ${response.status}`);
    }

    return response.json();
  }
};
