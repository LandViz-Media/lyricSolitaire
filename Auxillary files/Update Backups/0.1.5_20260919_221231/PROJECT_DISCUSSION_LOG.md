# Lyric Solitaire — Project Discussion Log

> **Purpose:** Durable project memory for decisions, rationale, issues, experiments, and deferred ideas discussed during Lyric Solitaire development. This file is intentionally separate from `changelog.md`: the changelog records software changes; this log records the reasoning and decisions that should survive across conversations.

## Current Project State

### Current development focus
- Lyric Solitaire is being developed as a browser-based game with a separate Simulator Lab, Results Viewer, and lyric-data Generator.
- The Simulator is a development/research tool, not a second player-facing game.
- The local repository on the user's Mac is the working source for catalog construction and manual GitHub pushes.
- GitHub `main` is the source of truth for the current repository when its current state is available. Historical ZIPs or old uploaded files must not be treated as current repository state.
- `Auxillary files/` is personal storage and must not be cleaned up or deleted during repository audits.

### Current tool versions at the start of this update
- Simulator: `0.1.3.1` → this update moves it to `0.1.4`.
- Generator: `0.1.4.4` and retained as the generator version for this release.
- Catalog Builder: `0.1.4.5` local Mac command.
- Data schema: `1.3.1`.

---

## 2026-09-04 — Simulator 0.1.4 / Project Memory

### Decisions
1. Add a **Genre(s)** selector to Simulator Experiment Setup before Artist(s).
2. Genre choices are derived from the current catalog.
3. Selecting genre(s) filters the available artists; selecting artists then filters the available songs.
4. The Song(s) selector should display **song titles only**, not `Song — Artist`, because Artist(s) is already a separate selector.
5. The Simulator, Results Viewer, and Generator should share a common visual header treatment derived from the Lyric Solitaire cover artwork.
6. The Simulator header's left-edge/alignment issue should be corrected as part of the header revision rather than patched with an isolated margin.
7. The Results Viewer header should visually match the Simulator header.
8. The Generator header should also use the same visual design language.
9. Keep the existing simulation engine and experiment data model stable while making this UI revision.
10. Catalog generation remains a **manual local Mac `.command` workflow** for now. GitHub Actions are explicitly deferred.

### Rationale
- Genre is a useful experimental dimension and should be selected before narrowing the experiment to particular artists and songs.
- Repeating the artist name in every song option makes long song lists harder to scan and is redundant when Artist(s) is already selected.
- The three development tools should look like parts of the same application rather than three unrelated pages.
- The header graphic is derived from the main Lyric Solitaire artwork, so Simulator, Results, and Generator should share that visual lineage.
- The Simulator is being improved incrementally; UI changes should not silently alter simulation rules or result semantics.

### Deferred / future ideas
- Additional simulator personas beyond **Dolly — Aggressive Row Filler**.
- More sophisticated comparison/analysis of simulation results.
- Automatic catalog generation with GitHub Actions.
- Larger album artwork using the `_lg` filename convention.
- Further player-facing game development.

---

## Generator and Song Data Workflow

### Source format — established convention
Every maintained lyric `.txt` file uses exactly this metadata order:

1. Artist
2. Song Title
3. Album
4. Year
5. Genre
6. `[Section]` headings and lyric lines

The source `.txt` files should **not** be changed to compensate for generator bugs. Generator parsing must conform to this established source convention.

### Generator responsibilities
The Generator creates exactly two song data files from the maintained source:

- `<song>_lyrics.json`
- `<song>_word_count.json`

The Generator requires both the lyric `.txt` and the matching album-art thumbnail before normal song generation.

### Album-art convention
- Current maintained thumbnail standard: **200 × 200 pixels**.
- Accepted formats: PNG, JPG, JPEG.
- If larger artwork is introduced later, it will use the same base filename with `_lg` before the extension.
- The normal catalog artwork reference remains the standard thumbnail.

### Generator/catalog separation
The browser Generator does **not** scan or upload the complete local `song_library`. This was intentionally rejected because a large library would make directory uploading impractical and browser directory permissions introduced unnecessary complexity.

The Generator produces the two song JSON files. Catalog construction is a separate local operation.

---

## Catalog Builder Workflow

### Decision
`song_catalog.json` is a **derived manifest**, not an incrementally maintained document.

### Manual workflow
1. Add/maintain the `.txt` and album-art source files in the appropriate local artist folder.
2. Use the Generator to create the two JSON files.
3. Place those JSON files alongside the source files.
4. Repeat for as many new artists/songs as needed.
5. Run `Build_Song_Catalog.command` against the **local Lyric Solitaire repository root**.
6. The command backs up the previous catalog under `Auxillary files/Update Backups/`.
7. The command scans the complete local `song_library` and rebuilds `song_catalog.json`.
8. Review the validation report.
9. Push the complete repository to GitHub.

### Rationale
This avoids the synchronization problem that occurs when several new songs/artists are generated locally before any of them are pushed. A catalog built from the complete local library can include all of them regardless of generation order.

### Catalog validation goals
The catalog builder should identify:
- artists and artist keys
- songs
- lyrics JSON files
- word-count JSON files
- album artwork
- missing or orphaned files
- duplicate song IDs
- metadata mismatches
- artwork dimensions

The catalog builder should preserve established artist keys rather than inventing replacements.

### Catalog Builder 0.1.4.5
- Removed the Python/Pillow dependency.
- Uses macOS-native `sips` for image-dimension inspection.
- Produces deterministic ordering of artists and songs.
- The catalog builder is intentionally local and does not upload the song library.

---

## Generator Development History / Lessons

### Metadata parser bug
An earlier generator incorrectly treated line 1 as title and line 2 as artist. This was fixed so the parser follows Artist → Song Title → Album → Year → Genre.

### Firefox directory picker issue
The browser catalog prototype successfully saw 48 files but produced `0 songs across 0 artists` because the directory path representation did not reliably include the expected `song_library` path. This reinforced the decision to remove complete-library scanning from the browser Generator and use the local command-line catalog builder instead.

### Generator JavaScript organization
The Generator was moved from a large inline JavaScript block to a dedicated `js/generator.js` file. This is preferred for maintainability as the tool grows.

### Generator UI
The Generator was redesigned around a focused workflow: select source, parse/verify, generate the two song files, and preview the resulting JSON. Obsolete explanatory/footer material was removed from the bottom after the catalog workflow was separated into its own tool.

---

## Simulator Development History

### Simulator role
The Simulator is intended to answer development/research questions such as how game behavior changes with song pools, modes, and player strategies. It should retain detailed experiment data rather than becoming another version of the player game.

### Named persona
Current persona:
- **Dolly — Aggressive Row Filler**

Current strategy description:
- prefer active lyric lines closest to completion
- play every usable word
- open a new candidate line when an available row permits it
- favor shorter candidate lines when opening a row

### Current modes
| Mode | Rows | Hand Limit | Maximum Rounds |
|---|---:|---:|---:|
| Easy / Open | 12 | 50 | 12 |
| Standard | 10 | 40 | 10 |
| Hard | 8 | 30 | 8 |

### Existing result metrics
The Simulator currently records aggregate values including:
- trials
- wins
- win rate
- average rounds
- average words played
- all-words-used measures
- total words
- unique words
- physical pool
- average completed lines

It also retains complete individual trial collections in exported experiment records.

### Simulator UI issues identified before 0.1.4
- Header had undesirable left-side/alignment spacing.
- Song selector redundantly displayed artist names.
- Experiment Setup needed another filtering dimension and clearer hierarchy.
- Results presentation can be improved later without changing the engine.

### Simulator 0.1.4 direction
The first revision focuses on UI/filtering and shared visual identity, while preserving the simulation engine and result schema.

---

## Results Viewer

### Purpose
The Results Viewer is intended to support later comparison and analysis of exported simulation experiments. It should eventually support questions such as:
- song comparison
- mode comparison
- persona comparison
- distributions/histograms
- simulator-version comparison
- challenge-level development

### Current status
The Results Viewer supports file-based loading of exported experiment JSON. It does not modify the source experiment files.

### Header decision
The Results Viewer header should closely match the Simulator header and use the same artwork lineage rather than the older, visually different results-specific header treatment.

---

## Current Song Library / Data Notes

### User-reported current additions
- Cyndi Lauper / `Girls Just Want To Have Fun`
- Dolly Parton / `9 to 5`
- Tom Petty and the Heartbreakers / `Learning to Fly`
- The Beatles / `Get Back` — **added by the user and catalog updated on GitHub immediately before this 0.1.4 Simulator work**.

### Important low-word-count test case
The user specifically identified **Get Back** as an important future simulation test because it has a low total word count and a low number of unique words. Once the Simulator UI update is complete, return to simulation-result analysis and use this song as a useful contrast against larger/more varied word pools.

### Catalog metadata lesson
The catalog builder should derive metadata from maintained song data rather than silently correcting source values. For example, the historical `Foklore` value in the Exile data was a source-data typo. The user corrected the Exile lyrics/source data and regenerated the JSON with the correct album title, `Folklore`.

### Artist-key preservation
Established artist keys should be retained, including examples such as:
- Zach Bryan → `bryan_zach`
- Foo Fighters → `foo_fighters`
- Green Day → `green_day`
- Taylor Swift feat. Bon Iver → `swift_taylor`
- Dolly Parton → `parton_dolly`
- Cyndi Lauper → `lauper_cyndi`
- Tom Petty and the Heartbreakers → `petty_tom`

---

## Project Maintenance Rules

1. Inspect `song_library/` first when reconciling song data.
2. Treat the current GitHub `main` state as authoritative when available; do not substitute stale ZIP contents.
3. Never treat historical uploaded files as current repository files unless the user explicitly identifies them as such.
4. Do not modify or clean out `Auxillary files/` as part of ordinary repository cleanup.
5. Record substantive software changes in `changelog.md`.
6. Record important discussions, decisions, rationale, issues, and deferred ideas in this discussion log.
7. Every updated JS file should have a responsibility comment at the top and comments for important sections/functions/game rules.
8. Mac install/update packages should use a native folder picker and back up changed files automatically.
9. Do not change maintained lyric `.txt` source files to compensate for parser behavior; fix the parser.
10. Prefer actual program improvements over cleanup-only changes.

---

## Next Planned Work After Simulator 0.1.4

1. Complete and test the Simulator 0.1.4 UI/filter changes.
2. Verify the shared Simulator/Results/Generator header appearance.
3. Run fresh simulations after the update.
4. **Return to simulation-result analysis**, with `Get Back` as a deliberately useful low-word-count/low-unique-word test case.
5. Examine whether the existing metrics adequately distinguish songs with very different word-pool characteristics.
6. Only then decide which simulation-engine or persona changes are warranted.

---

## Open Questions / Future Ideas

- Should the Simulator eventually allow genre-only experiments without selecting an artist?
- Should genre filtering use exact genre tokens or support broader genre families?
- What additional personas best represent plausible human strategies?
- Which result metrics best predict perceived game difficulty?
- Should the Results Viewer eventually calculate song-level difficulty indices?
- Should GitHub Actions eventually rebuild and validate the catalog automatically?
- When should `_lg` album artwork be introduced, and what UI/data fields will reference it?

> **Maintenance note:** Add new dated entries rather than rewriting historical decisions. When a decision changes, record the new decision and explain what it supersedes.
