# Song Library Migration

The project is moving from `/json` to `/song_library` so the folder has a clear purpose: it contains the maintained song data used by Lyric Solitaire.

The current application loader supports both locations during the transition. The intended final layout is:

```text
song_library/
├── song_catalog.json
├── bryan_zach/
├── foo_fighters/
├── green_day/
└── swift_taylor/
```

The lyric JSON and word-count JSON files themselves remain project-owner maintained data. They are not generated or rewritten by the simulator.
