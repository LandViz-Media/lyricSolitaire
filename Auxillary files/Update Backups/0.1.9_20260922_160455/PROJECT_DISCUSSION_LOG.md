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

---

## 2026-09-07 — Simulator 0.1.5 / Persona Model

### Decisions
1. The simulator must use a deterministic random stream derived from the user-entered seed and trial index. Re-running the same experiment with the same song selection, mode, persona, trial count, and seed should reproduce the same trial collection.
2. The physical hand-cap rule is intentional: if a player begins a round with 39 tiles and the requested draw is 10 under a 50-tile hand limit, only one tile can be drawn. The requested draw is an upper bound; available hand capacity is an independent constraint.
3. The simulator must continue to support multiple selected songs. A combined experiment uses one combined physical word pool and distinct line occurrences from each selected song.
4. Experiment exports need an optional human-readable name. The name is stored in the experiment record and contributes to the downloaded filename.
5. Export filenames must include a timestamp so multiple exports on the same calendar day do not intentionally reuse the same filename.
6. Dolly remains the aggressive row-filler persona, but she gains adaptive restraint as the hand becomes crowded and as the game progresses.
7. Johnny — Walks the Line is a conservative comparison persona: maximize playable words but open at most one new lyric line per round.
8. Kenny — The Gambler is the high-risk comparison persona: existing active-line matches always win first, but otherwise he opens new lines aggressively and targets nine or ten active lines in Round 1 when possible.
9. Persona documentation should be maintained as separate files. Each persona file starts with a general description of the player, followed by technical engine terminology and implementation rules.

### Persona research purpose
The three personas are intentionally behaviorally distinct rather than merely different labels for the same engine. This allows experiments to ask whether observed lockups are caused primarily by song structure, board-opening behavior, hand saturation, or the interaction between those factors.

### Important draw-rule clarification
The requested draw is calculated from the round number and previous-round play. The actual draw is then capped by remaining pool size and available hand capacity. A player beginning a round with 39 tiles in a 40-tile Standard hand can draw only one tile, regardless of a larger requested draw. This is not a second hidden penalty; it is simply the inventory cap being enforced.

### Deferred analysis
The next research step remains a deterministic, word-by-word trace of representative trials. The persona comparison should be used to determine whether Dolly's lockup behavior is reduced by adaptive row management and how Johnny and Kenny differ under the same song, mode, and seed.


## 2026-09-19 — Simulator 0.1.6 / Per-Round Playability Diagnostics

### Decision
Add explicit per-round playability metrics before changing persona behavior further. The purpose is to determine whether personas are actually holding tiles that could be played on existing lines, versus simply holding tiles that cannot currently be played without opening another line.

### Metrics
- `playableOnExistingLines`: physical tiles playable on an existing active line at the start of the play phase.
- `playableByOpeningNewLine`: physical tiles that cannot use an existing line but can be played by opening a new line, when a row is available.
- `playedOnExistingLines`: physical tiles actually played onto already-active lines.
- `playedByOpeningNewLine`: physical tiles actually played by opening a new line.
- `playableTilesRemainingUnplayed`: physical tiles still playable after the persona finishes its play phase, using a persona-independent legal-play definition.

### Interpretation
The first two metrics are start-of-round opportunity counts; the `played...` metrics describe actual decisions. The remaining-playable count is the key diagnostic for identifying whether a persona is holding back tiles that it could legally play. Duplicate words are counted as separate physical tiles.

### Deferred Persona Rule Question
The second-to-last and final-round behavior remains a separate design question. These diagnostics should be examined first so that future persona changes are based on observed playability rather than assumptions about why tiles remain in hand.


## 2026-09-20 — Simulator 0.1.7 / Endgame, Foresight, and Duplicate-Tile Diagnostics

### Decisions
1. Persona differences apply primarily before the endgame. The second-to-last round is a transition round in which personas become somewhat more willing to open new lines.
2. The final round is a universal maximum-play round. All personas play every legal opportunity they can find; persona-specific restrictions on opening new lines are suspended when a row is available.
3. New-line selection includes limited lyric foresight. A candidate line is more attractive when opening it would make several additional words already in the hand playable. This models the advantage of a human who knows the song and can anticipate what a line will unlock.
4. The v0.1.6 playability metric could overcount duplicate physical tiles: if three copies of a word were in the hand but an active line had only one remaining slot for that word, all three copies were previously counted as playable. The diagnostic now caps existing-line playability by actual remaining word demand.
5. Experiment names are now generated from the current parameters and update when those parameters change. Manual edits are retained for the current experiment, then automatic naming resumes for the next experiment after the run.

### Research question
The simulator should distinguish three things: a tile that can be placed immediately on an existing line; a tile that becomes useful by opening a new line; and a tile that is technically compatible with a candidate line but is competing with duplicate copies or limited line capacity. These distinctions are important when interpreting persona behavior.

### Deferred question
The current foresight model is deliberately limited. It does not yet perform deep multi-step search across several possible line openings. Future analysis can determine whether stronger lyric knowledge should be modeled as a deeper look-ahead or whether the current lightweight advantage is sufficient.


## 2026-09-20 — Garth and Future Hank Reference Personas

### Decision
The Simulator will permanently include a diagnostic persona named **Garth — Heuristic Reference Player**. Garth is the renamed successor to the temporary Oracle/heuristic experiment used during the Everlong investigation.

Garth is explicitly a heuristic reference, not a mathematically guaranteed solver. He evaluates legal active-line moves plus a bounded set of promising new-line moves using immediate completion, near-term hand coverage, progress, and a small new-line cost. The intent is to provide a stronger reference point than the human-style personas without claiming exhaustive optimality.

### Future persona
The project also reserves **Hank** as the name for a future mathematically guaranteed persona. Hank should only be implemented after the search method is defined and validated as complete under the actual simulator rules. A future Hank loss could then be used as evidence of unsolvability for that modeled deal; Garth cannot make that claim.

### Implementation boundary
0.1.8 changes the simulator persona system and versioning/documentation only. Existing Dolly, Johnny, Kenny, draw rules, final-round rules, and song-library data are not intentionally changed.
