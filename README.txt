# Lyric Solitaire simulator files

Copy these files into the repository at:

- `simulator.html` -> repository root
- `json/song_catalog.json` -> existing `/json` directory
- `js/data/songCatalog.js` -> `js/data/`

The catalog currently references the songs found in `/json` when checked:
Zach Bryan (5), Foo Fighters (1), Green Day (1), Taylor Swift (1).

The simulator page loads the catalog and selected lyric/word-count JSON files.
It then uses `window.LyricSolitaireSimulator` from `js/utilities/simulator.js`
when that engine is available.

Future song additions:
1. Add the new lyric JSON and word-count JSON under `/json/<artistKey>/`.
2. Add the corresponding entry to `json/song_catalog.json`.
3. No simulator HTML changes should be necessary.
