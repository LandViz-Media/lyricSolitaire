#!/usr/bin/env python3
"""
Lyric Solitaire — Lyric Data Audit

Responsibility:
    Read-only validation of the source-to-tile data pipeline.

This tool does NOT edit, rename, delete, or regenerate song-library files.
It compares maintained TXT sources against generated lyrics JSON,
word-count JSON, and song_catalog.json, and reports token/Unicode anomalies.
"""

from __future__ import annotations

import argparse
import collections
import datetime as dt
import html
import json
import os
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

AUDIT_VERSION = "0.1.0"

APOSTROPHE_VARIANTS = "’‘ʼʻ`´"
ZERO_WIDTH = {"\u200b", "\u200c", "\u200d", "\ufeff"}
SUSPICIOUS_SPACE = {"\u00a0", "\u202f", "\u2007"}
DASH_VARIANTS = {"\u2010", "\u2011", "\u2012", "\u2013", "\u2014", "\u2212"}


def normalize_unicode(text: str) -> str:
    """Mirror the current generator's documented normalization behavior."""
    result = unicodedata.normalize("NFKC", text)
    result = re.sub(r"[’‘ʼʻ`´]", "'", result)
    result = result.replace("е", "e").replace("Е", "E")
    return result


def is_letter_or_mark(ch: str) -> bool:
    category = unicodedata.category(ch)
    return category.startswith("L") or category.startswith("M")


def tokenize_line(line: str) -> list[str]:
    """Equivalent to the generator's Unicode word pattern without third-party modules."""
    words: list[str] = []
    i = 0
    n = len(line)
    while i < n:
        if not is_letter_or_mark(line[i]):
            i += 1
            continue
        start = i
        i += 1
        while i < n and is_letter_or_mark(line[i]):
            i += 1
        if i < n and line[i] in "'’":
            j = i + 1
            while j < n and is_letter_or_mark(line[j]):
                j += 1
            # The JS pattern allows an apostrophe followed by zero or more letters/marks.
            i = j
        words.append(line[start:i])
    return words


def word_key(word: str) -> str:
    return word.casefold()


def counts_from_lines(lines: list[str]) -> collections.Counter[str]:
    counts: collections.Counter[str] = collections.Counter()
    for line in lines:
        for word in tokenize_line(line):
            counts[word_key(word)] += 1
    return counts


def display_word(word: str) -> str:
    return word[:1].upper() + word[1:] if word else word


def json_word_counts(data: dict[str, Any]) -> collections.Counter[str]:
    counts: collections.Counter[str] = collections.Counter()
    for item in data.get("words", []):
        if not isinstance(item, dict) or "word" not in item or "count" not in item:
            continue
        counts[word_key(str(item["word"]))] += int(item["count"])
    return counts


def read_json(path: Path) -> tuple[Any | None, str | None]:
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f), None
    except Exception as exc:
        return None, f"{type(exc).__name__}: {exc}"


def source_metadata_and_lines(path: Path) -> tuple[dict[str, Any], list[str], str, list[dict[str, Any]]]:
    raw = path.read_text(encoding="utf-8")
    normalized = normalize_unicode(raw)
    lines = normalized.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    while lines and lines[-1].strip() == "":
        lines.pop()
    metadata = {
        "artist": lines[0].strip() if len(lines) > 0 else "",
        "title": lines[1].strip() if len(lines) > 1 else "",
        "album": lines[2].strip() if len(lines) > 2 else "",
        "year": lines[3].strip() if len(lines) > 3 else "",
        "genre": lines[4].strip() if len(lines) > 4 else "",
    }
    lyric_lines: list[str] = []
    parsed_sections: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    source_line_records: list[dict[str, Any]] = []
    for idx, line in enumerate(lines[5:], start=6):
        stripped = line.strip()
        if stripped == "":
            continue
        match = re.fullmatch(r"\[([^\]]+)\]", stripped)
        if match:
            current = {"type": match.group(1).strip(), "lyrics": []}
            parsed_sections.append(current)
            continue
        if current is None:
            current = {"type": "Verse", "lyrics": []}
            parsed_sections.append(current)
        current["lyrics"].append(stripped)
        lyric_lines.append(stripped)
        source_line_records.append({"sourceLine": idx, "section": current["type"], "text": stripped})
    return metadata, lyric_lines, raw, source_line_records


def metadata_year(value: Any) -> str:
    return str(value) if value is not None else ""


def rel(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return str(path)


def catalog_paths(root: Path) -> tuple[dict[str, Any] | None, list[str]]:
    warnings: list[str] = []
    path = root / "song_library" / "song_catalog.json"
    if not path.exists():
        return None, ["Missing maintained catalog: song_library/song_catalog.json"]
    data, err = read_json(path)
    if err:
        return None, [f"Catalog JSON error: {err}"]
    if not isinstance(data, dict) or not isinstance(data.get("songs"), list):
        return None, ["Catalog JSON does not contain a songs array."]
    return data, warnings


def analyze_unicode(raw: str) -> dict[str, Any]:
    codepoints = collections.Counter()
    categories = collections.Counter()
    apostrophes: list[dict[str, Any]] = []
    zero_width: list[dict[str, Any]] = []
    odd_spaces: list[dict[str, Any]] = []
    dashes: list[dict[str, Any]] = []
    digits: list[dict[str, Any]] = []
    confusables: list[dict[str, Any]] = []

    for pos, ch in enumerate(raw):
        cat = unicodedata.category(ch)
        categories[cat] += 1
        if ord(ch) > 127:
            codepoints[f"U+{ord(ch):04X}"] += 1
        item = {"position": pos, "character": ch, "codepoint": f"U+{ord(ch):04X}", "name": unicodedata.name(ch, "UNKNOWN")}
        if ch in APOSTROPHE_VARIANTS:
            apostrophes.append(item)
        if ch in ZERO_WIDTH:
            zero_width.append(item)
        if ch in SUSPICIOUS_SPACE:
            odd_spaces.append(item)
        if ch in DASH_VARIANTS:
            dashes.append(item)
        if ch.isdigit():
            digits.append(item)
        if ch in {"е", "Е"}:
            confusables.append(item)

    normalized = normalize_unicode(raw)
    return {
        "nonAsciiCodepoints": dict(codepoints),
        "unicodeCategories": dict(categories),
        "apostropheVariants": apostrophes,
        "zeroWidthCharacters": zero_width,
        "nonStandardSpaces": odd_spaces,
        "dashVariants": dashes,
        "digitCharacters": digits,
        "confusableCyrillicE": confusables,
        "normalizationChangedSource": normalized != raw,
    }


def line_records_from_lyrics(data: dict[str, Any]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for section_index, section in enumerate(data.get("sections", []), start=1):
        section_type = str(section.get("type", ""))
        for line_index, text in enumerate(section.get("lyrics", []), start=1):
            records.append({
                "sectionIndex": section_index,
                "section": section_type,
                "lineIndex": line_index,
                "text": str(text),
            })
    return records


def mismatch_words(expected: collections.Counter[str], actual: collections.Counter[str]) -> list[dict[str, Any]]:
    rows = []
    for key in sorted(set(expected) | set(actual)):
        e, a = expected.get(key, 0), actual.get(key, 0)
        if e != a:
            rows.append({"word": key, "expected": e, "actual": a, "difference": a - e})
    return rows


def compare_song(root: Path, source: Path, lyrics_path: Path, word_path: Path, catalog_entry: dict[str, Any] | None) -> dict[str, Any]:
    result: dict[str, Any] = {
        "source": rel(root, source),
        "lyricsJson": rel(root, lyrics_path),
        "wordCountJson": rel(root, word_path),
        "status": "PASS",
        "errors": [],
        "warnings": [],
        "mismatches": {"metadata": [], "words": [], "lines": []},
        "unicode": {},
        "summary": {},
    }

    metadata, source_lines, raw, source_records = source_metadata_and_lines(source)
    result["unicode"] = analyze_unicode(raw)
    lyrics, lyrics_err = read_json(lyrics_path)
    word_data, word_err = read_json(word_path)
    if lyrics_err:
        result["errors"].append(f"Lyrics JSON: {lyrics_err}")
    if word_err:
        result["errors"].append(f"Word-count JSON: {word_err}")
    if result["errors"]:
        result["status"] = "ERROR"
        return result

    # Metadata comparison.
    for key in ("artist", "title", "album", "year", "genre"):
        source_value = metadata[key]
        json_value = lyrics.get(key, "")
        if key == "year":
            source_value = str(source_value)
            json_value = metadata_year(json_value)
        else:
            source_value = str(source_value)
            json_value = str(json_value)
        if source_value != json_value:
            result["mismatches"]["metadata"].append({"field": key, "source": source_value, "lyricsJson": json_value})

    json_lines = line_records_from_lyrics(lyrics)
    source_lines_text = [r["text"] for r in source_records]
    json_lines_text = [r["text"] for r in json_lines]
    max_len = max(len(source_lines_text), len(json_lines_text))
    for i in range(max_len):
        s = source_lines_text[i] if i < len(source_lines_text) else None
        j = json_lines_text[i] if i < len(json_lines_text) else None
        if s != j:
            result["mismatches"]["lines"].append({
                "lineNumber": i + 1,
                "source": s,
                "lyricsJson": j,
                "sourceTokens": tokenize_line(s) if s is not None else [],
                "jsonTokens": tokenize_line(j) if j is not None else [],
            })

    source_counts = counts_from_lines(source_lines)
    lyrics_counts = counts_from_lines(json_lines_text)
    word_counts = json_word_counts(word_data)
    result["mismatches"]["words"] = mismatch_words(source_counts, word_counts)
    result["summary"] = {
        "sourceLineCount": len(source_lines),
        "lyricsJsonLineCount": len(json_lines_text),
        "sourceWordCount": sum(source_counts.values()),
        "lyricsJsonWordCount": sum(lyrics_counts.values()),
        "wordCountJsonPhysicalTiles": sum(word_counts.values()),
        "sourceUniqueWords": len(source_counts),
        "lyricsJsonUniqueWords": len(lyrics_counts),
        "wordCountJsonUniqueWords": len(word_counts),
        "sectionsSource": len({r["section"] for r in source_records}),
        "sectionsJson": len(lyrics.get("sections", [])),
    }

    if source_counts != lyrics_counts:
        result["warnings"].append("Source TXT and lyrics JSON tokenize to different word inventories.")
    if source_counts != word_counts:
        result["errors"].append("Source TXT and word-count JSON have different physical tile inventories.")
    if len(source_lines_text) != len(json_lines_text):
        result["errors"].append("Source TXT and lyrics JSON have different lyric-line counts.")
    if result["mismatches"]["metadata"]:
        result["errors"].append("Source metadata does not match lyrics JSON metadata.")
    if result["mismatches"]["lines"]:
        result["errors"].append("Source TXT and lyrics JSON have line-by-line mismatches.")

    if result["unicode"]["zeroWidthCharacters"]:
        result["warnings"].append("Zero-width characters detected.")
    if result["unicode"]["nonStandardSpaces"]:
        result["warnings"].append("Non-standard whitespace detected.")
    if result["unicode"]["confusableCyrillicE"]:
        result["warnings"].append("Cyrillic e/E confusable characters detected and normalized by the generator.")
    if result["unicode"]["normalizationChangedSource"]:
        result["warnings"].append("Unicode normalization changes the source text before tokenization.")
    if result["unicode"]["apostropheVariants"]:
        result["warnings"].append("Apostrophe variants detected; generator normalization converts them to ASCII apostrophe.")
    if result["unicode"]["digitCharacters"]:
        result["warnings"].append("Digit characters are present in source text; digits are not word tiles under the generator tokenizer.")

    if result["errors"]:
        result["status"] = "ERROR"
    elif result["warnings"]:
        result["status"] = "WARN"
    return result


def audit(root: Path) -> dict[str, Any]:
    root = root.resolve()
    library = root / "song_library"
    report: dict[str, Any] = {
        "auditVersion": AUDIT_VERSION,
        "generatedAt": dt.datetime.now().astimezone().isoformat(timespec="seconds"),
        "projectRoot": str(root),
        "readOnly": True,
        "catalog": {"status": "UNKNOWN", "errors": [], "warnings": []},
        "songs": [],
        "orphanSources": [],
        "orphanLyricsJson": [],
        "orphanWordCountJson": [],
        "catalogValidation": {"missingFiles": [], "invalidReferences": [], "duplicateIds": []},
    }
    if not library.is_dir():
        report["catalog"]["errors"].append("song_library directory is missing.")
        return report

    catalog, cat_warnings = catalog_paths(root)
    report["catalog"]["warnings"].extend(cat_warnings)
    catalog_songs = catalog.get("songs", []) if catalog else []
    by_lyrics_rel = {}
    by_title_artist = {}
    ids = collections.Counter()
    for entry in catalog_songs:
        if not isinstance(entry, dict):
            continue
        ids[str(entry.get("id", ""))] += 1
        by_lyrics_rel[str(entry.get("lyrics", ""))] = entry
        by_title_artist[(str(entry.get("artist", "")).casefold(), str(entry.get("title", "")).casefold())] = entry
    report["catalogValidation"]["duplicateIds"] = [k for k, v in ids.items() if k and v > 1]

    txt_files = sorted(p for p in library.rglob("*.txt") if p.name != "MIGRATION.txt")
    lyrics_files = sorted(library.rglob("*_lyrics.json"))
    word_files = sorted(library.rglob("*_word_count.json"))
    lyrics_by_rel = {rel(root, p): p for p in lyrics_files}
    word_by_rel = {rel(root, p): p for p in word_files}
    matched_txt: set[Path] = set()
    matched_lyrics: set[Path] = set()
    matched_words: set[Path] = set()

    # Audit each generated lyrics JSON, using the TXT whose metadata matches when possible.
    for lyrics_path in lyrics_files:
        lyrics, err = read_json(lyrics_path)
        if err or not isinstance(lyrics, dict):
            result = {"source": None, "lyricsJson": rel(root, lyrics_path), "wordCountJson": None, "status": "ERROR", "errors": [f"Cannot read lyrics JSON: {err or 'invalid JSON'}"], "warnings": [], "mismatches": {}, "unicode": {}, "summary": {}}
            report["songs"].append(result)
            continue
        artist = str(lyrics.get("artist", ""))
        title = str(lyrics.get("title", ""))
        candidates = []
        artist_dir = lyrics_path.parent
        for txt in txt_files:
            if txt.parent == artist_dir:
                try:
                    meta, _, _, _ = source_metadata_and_lines(txt)
                    if meta["artist"].casefold() == artist.casefold() and meta["title"].casefold() == title.casefold():
                        candidates.append(txt)
                except Exception:
                    pass
        source = candidates[0] if candidates else None
        if source:
            matched_txt.add(source)
        word_path = lyrics_path.with_name(lyrics_path.name.replace("_lyrics.json", "_word_count.json"))
        if not word_path.exists():
            # Catalog may point elsewhere; fall back to same-directory matching by metadata.
            for wp in word_files:
                if wp.parent == artist_dir:
                    wd, _ = read_json(wp)
                    if isinstance(wd, dict) and str(wd.get("artist", "")).casefold() == artist.casefold() and str(wd.get("title", "")).casefold() == title.casefold():
                        word_path = wp
                        break
        if word_path.exists():
            matched_words.add(word_path)
        else:
            word_path = Path("__MISSING__")
        if source and word_path.exists():
            matched_lyrics.add(lyrics_path)
            entry = by_title_artist.get((artist.casefold(), title.casefold()))
            result = compare_song(root, source, lyrics_path, word_path, entry)
        else:
            result = {
                "source": rel(root, source) if source else None,
                "lyricsJson": rel(root, lyrics_path),
                "wordCountJson": rel(root, word_path) if word_path.exists() else None,
                "status": "ERROR",
                "errors": ([] if source else ["No matching source TXT found by artist/title"]) + ([] if word_path.exists() else ["No matching word-count JSON found"]),
                "warnings": [], "mismatches": {"metadata": [], "words": [], "lines": []}, "unicode": {}, "summary": {}
            }
        report["songs"].append(result)

    for txt in txt_files:
        if txt not in matched_txt:
            report["orphanSources"].append(rel(root, txt))
    for lp in lyrics_files:
        if lp not in matched_lyrics and not any(s.get("lyricsJson") == rel(root, lp) for s in report["songs"]):
            report["orphanLyricsJson"].append(rel(root, lp))
    for wp in word_files:
        if wp not in matched_words:
            report["orphanWordCountJson"].append(rel(root, wp))

    # Validate every catalog reference, independently of song matching.
    if catalog:
        report["catalog"]["status"] = "PASS"
        for entry in catalog_songs:
            if not isinstance(entry, dict):
                report["catalogValidation"]["invalidReferences"].append({"entry": entry, "problem": "Catalog song entry is not an object"})
                continue
            for field in ("lyrics", "wordCount", "albumArt"):
                value = entry.get(field)
                if not value:
                    report["catalogValidation"]["invalidReferences"].append({"id": entry.get("id"), "field": field, "problem": "Missing catalog path"})
                    continue
                target = root / str(value)
                if not target.exists():
                    report["catalogValidation"]["missingFiles"].append({"id": entry.get("id"), "field": field, "path": str(value)})
            lyrics_rel = str(entry.get("lyrics", ""))
            lp = root / lyrics_rel
            if lp.exists():
                data, err = read_json(lp)
                if err or not isinstance(data, dict):
                    report["catalogValidation"]["invalidReferences"].append({"id": entry.get("id"), "field": "lyrics", "problem": err or "Invalid JSON"})
                else:
                    for field in ("artist", "title", "album", "year", "genre"):
                        if str(entry.get(field, "")) != str(data.get(field, "")):
                            report["catalogValidation"]["invalidReferences"].append({"id": entry.get("id"), "field": field, "problem": "Catalog metadata differs from lyrics JSON", "catalog": entry.get(field), "lyricsJson": data.get(field)})
        if report["catalogValidation"]["missingFiles"] or report["catalogValidation"]["invalidReferences"] or report["catalogValidation"]["duplicateIds"]:
            report["catalog"]["status"] = "ERROR"
    return report


def html_report(report: dict[str, Any]) -> str:
    songs = report["songs"]
    passed = sum(s.get("status") == "PASS" for s in songs)
    warned = sum(s.get("status") == "WARN" for s in songs)
    errored = sum(s.get("status") == "ERROR" for s in songs)
    def esc(x: Any) -> str:
        return html.escape(str(x if x is not None else ""))
    rows = []
    for s in songs:
        sm = s.get("summary", {})
        rows.append(f"<tr><td>{esc(Path(s.get('source') or '').name)}</td><td>{esc(s.get('status'))}</td><td>{sm.get('sourceWordCount','')}</td><td>{sm.get('wordCountJsonPhysicalTiles','')}</td><td>{sm.get('sourceLineCount','')}</td><td>{len(s.get('mismatches',{}).get('words',[]))}</td><td>{len(s.get('mismatches',{}).get('lines',[]))}</td><td>{len(s.get('warnings',[]))}</td></tr>")
    detail = []
    for s in songs:
        if s.get("status") == "PASS" and not s.get("warnings"):
            continue
        detail.append(f"<details><summary><strong>{esc(Path(s.get('source') or s.get('lyricsJson') or '').name)}</strong> — {esc(s.get('status'))}</summary>")
        detail.append("<h4>Errors</h4><ul>" + "".join(f"<li>{esc(x)}</li>" for x in s.get("errors", [])) + "</ul>")
        detail.append("<h4>Warnings</h4><ul>" + "".join(f"<li>{esc(x)}</li>" for x in s.get("warnings", [])) + "</ul>")
        words = s.get("mismatches", {}).get("words", [])
        if words:
            detail.append("<h4>Per-word mismatches</h4><table><tr><th>Word</th><th>Expected</th><th>Actual</th><th>Difference</th></tr>" + "".join(f"<tr><td>{esc(w['word'])}</td><td>{w['expected']}</td><td>{w['actual']}</td><td>{w['difference']:+d}</td></tr>" for w in words) + "</table>")
        lines = s.get("mismatches", {}).get("lines", [])
        if lines:
            detail.append("<h4>Line-by-line mismatches</h4><table><tr><th>Line</th><th>Source</th><th>Lyrics JSON</th><th>Source tokens</th><th>JSON tokens</th></tr>" + "".join(f"<tr><td>{x['lineNumber']}</td><td>{esc(x['source'])}</td><td>{esc(x['lyricsJson'])}</td><td>{esc(' | '.join(x['sourceTokens']))}</td><td>{esc(' | '.join(x['jsonTokens']))}</td></tr>" for x in lines) + "</table>")
        u = s.get("unicode", {})
        detail.append("<h4>Unicode / tokenization checks</h4><pre>" + esc(json.dumps(u, indent=2, ensure_ascii=False)) + "</pre>")
        detail.append("</details>")
    cv = report.get("catalogValidation", {})
    catalog_block = f"<h2>Catalog validation</h2><p>Status: <strong>{esc(report['catalog'].get('status'))}</strong></p><pre>{esc(json.dumps(cv, indent=2, ensure_ascii=False))}</pre>"
    return f"""<!doctype html><html><head><meta charset='utf-8'><title>Lyric Data Audit</title><style>
body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:32px;line-height:1.45;color:#222}} h1{{margin-bottom:4px}} .meta{{color:#666}} table{{border-collapse:collapse;width:100%;margin:12px 0 24px}} th,td{{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}} th{{background:#eee}} details{{margin:16px 0;padding:8px;border:1px solid #ccc;border-radius:6px}} pre{{white-space:pre-wrap;background:#f6f6f6;padding:12px;overflow:auto}} .pass{{color:#176b35}} .warn{{color:#8a5a00}} .error{{color:#9b1c1c}}
</style></head><body><h1>Lyric Solitaire — Lyric Data Audit</h1><div class='meta'>Audit v{AUDIT_VERSION} · {esc(report['generatedAt'])}<br>Project: {esc(report['projectRoot'])}<br><strong>Read-only source scan:</strong> no song-library files were modified.</div>
<h2>Summary</h2><p>Songs: {len(songs)} · <span class='pass'>PASS {passed}</span> · <span class='warn'>WARN {warned}</span> · <span class='error'>ERROR {errored}</span></p>
<table><tr><th>Song source</th><th>Status</th><th>Source words</th><th>Physical tiles</th><th>Lines</th><th>Word mismatches</th><th>Line mismatches</th><th>Warnings</th></tr>{''.join(rows)}</table>
{catalog_block}<h2>Detailed diagnostics</h2>{''.join(detail) or '<p>All scanned songs passed without warnings.</p>'}
<h2>Orphans</h2><pre>{esc(json.dumps({k:report[k] for k in ('orphanSources','orphanLyricsJson','orphanWordCountJson')}, indent=2, ensure_ascii=False))}</pre>
</body></html>"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only Lyric Solitaire source/data audit")
    parser.add_argument("project_root", help="Path to lyricSolitaire project root")
    parser.add_argument("--output", default=None, help="Output directory for JSON/HTML reports")
    args = parser.parse_args()
    root = Path(args.project_root).expanduser().resolve()
    report = audit(root)
    out = Path(args.output).expanduser().resolve() if args.output else root / "Auxillary files" / "Lyric Data Audit"
    out.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    json_path = out / f"lyric_data_audit_{stamp}.json"
    html_path = out / f"lyric_data_audit_{stamp}.html"
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    html_path.write_text(html_report(report), encoding="utf-8")
    print(f"Lyric Data Audit v{AUDIT_VERSION}")
    print(f"Project: {root}")
    print(f"Songs: {len(report['songs'])}")
    for status in ("PASS", "WARN", "ERROR"):
        print(f"{status}: {sum(s.get('status') == status for s in report['songs'])}")
    print(f"Catalog: {report['catalog'].get('status')}")
    print(f"JSON report: {json_path}")
    print(f"HTML report: {html_path}")
    print("No song-library files were modified.")
    try:
        os.system("open " + __import__('shlex').quote(str(html_path)))
    except Exception:
        pass
    return 0 if all(s.get("status") != "ERROR" for s in report["songs"]) and report["catalog"].get("status") != "ERROR" else 2

if __name__ == "__main__":
    raise SystemExit(main())
