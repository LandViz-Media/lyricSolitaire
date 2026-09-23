# Lyric Data Audit

## Purpose

The Lyric Data Audit is a read-only diagnostic tool for the Lyric Solitaire song-data pipeline. It checks whether the maintained lyric source text, generated lyrics JSON, generated word-count JSON, physical tile inventory, and song catalog remain consistent.

It does not regenerate, edit, rename, move, or delete any song-library file.

## Running it

Double-click `Audit_Lyric_Data.command`. A Finder folder picker asks for the Lyric Solitaire project root. The selected folder must contain `game.html` and `song_library/`.

Reports are written to:

`Auxillary files/Lyric Data Audit/`

The tool produces both a JSON report for machine inspection and an HTML report for human review. The HTML report opens automatically when possible.

## Tests

For each song, the audit checks:

1. Source TXT metadata against lyrics JSON metadata.
2. Source lyric-line count against lyrics JSON line count.
3. Source line text against lyrics JSON line text, in order.
4. Source word-frequency inventory against lyrics JSON tokenization.
5. Source word-frequency inventory against word-count JSON physical tile counts.
6. Total physical word count conservation.
7. Unique-word counts.
8. Unicode normalization changes.
9. Apostrophe variants and contractions.
10. Zero-width characters and non-standard whitespace.
11. Dash variants.
12. Digit characters. Digits are reported because the generator tokenizer does not create numeric word tiles.
13. Confusable Cyrillic `е`/`Е` characters that the generator currently normalizes.
14. Catalog file existence and catalog metadata against lyrics JSON metadata.
15. Duplicate catalog IDs and orphan source/generated files.

## Interpretation

`PASS` means the core source/data comparisons passed. A song can still carry warnings for Unicode or tokenization conditions that the current generator intentionally normalizes.

`WARN` means no core inventory error was found, but the report contains a diagnostic condition worth reviewing.

`ERROR` means a source/data conservation, line, metadata, JSON, or catalog-reference problem was found.

A `SEARCH_INCOMPLETE` Hank result is not changed or reinterpreted by this audit. The audit only tests the data supplied to the game tools.
