#!/bin/bash
# Lyric Solitaire — Build Song Catalog
# Local-only catalog builder. No song_library files are uploaded anywhere.
set -euo pipefail

REPO=$(osascript <<'APPLESCRIPT'
tell application "Finder"
  activate
  set chosenFolder to choose folder with prompt "Select your local Lyric Solitaire repository folder:"
  return POSIX path of chosenFolder
end tell
APPLESCRIPT
)

REPO="${REPO%/}"
if [[ ! -f "$REPO/game.html" || ! -d "$REPO/song_library" ]]; then
  osascript -e 'display alert "Lyric Solitaire repository not found" message "Please select the repository folder containing game.html and song_library/." as critical'
  exit 1
fi

python3 - "$REPO" <<'PY'
import json, os, re, shutil, sys, tempfile
from datetime import datetime
from pathlib import Path

repo = Path(sys.argv[1]).resolve()
library = repo / "song_library"
catalog_path = library / "song_catalog.json"


def slugify(value):
    value = str(value or "").strip().lower()
    value = value.replace("’", "'").replace("‘", "'")
    value = re.sub(r"['`´]", "", value)
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_") or "untitled"


def norm(value):
    value = str(value or "").lower()
    value = value.replace("’", "'").replace("‘", "'")
    return re.sub(r"[^a-z0-9]+", "", value)


def read_json(path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def source_metadata(path):
    lines = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").replace("\r", "\n").split("\n")
    if len(lines) < 5:
        raise ValueError(f"{path.name}: source has fewer than five metadata lines")
    artist, title, album, year_text, genre = [x.strip() for x in lines[:5]]
    if not artist or not title:
        raise ValueError(f"{path.name}: Artist and Song Title are required")
    try:
        year = int(year_text)
    except ValueError:
        year = None
    return {"artist": artist, "title": title, "album": album, "year": year, "genre": genre}


# Read the previous catalog only as a compatibility aid. The new catalog is rebuilt
# from the actual song-library files; entries missing from the library are not retained.
old = {}
old_artists = {}
if catalog_path.exists():
    try:
        data = read_json(catalog_path)
        for a in data.get("artists", []):
            if a.get("name") and a.get("key"):
                old_artists[a["name"].strip().lower()] = a["key"]
        for s in data.get("songs", []):
            key = (str(s.get("artist", "")).strip().lower(), str(s.get("title", "")).strip().lower())
            old[key] = s
    except Exception as exc:
        print(f"WARNING: existing catalog could not be read: {exc}")

artists = {}
songs = []
warnings = []
errors = []

for artist_dir in sorted(p for p in library.iterdir() if p.is_dir() and not p.name.startswith(".")):
    txt_files = sorted(artist_dir.glob("*.txt"))
    if not txt_files:
        continue
    folder_key = artist_dir.name
    for txt in txt_files:
        try:
            meta = source_metadata(txt)
        except Exception as exc:
            errors.append(str(exc)); continue
        artist = meta["artist"]
        artist_key = old_artists.get(artist.lower(), folder_key)
        if artist_key != folder_key:
            warnings.append(f"{txt.relative_to(repo)}: catalog key {artist_key!r} differs from folder {folder_key!r}; preserving existing key")
        artists[artist_key] = artist

        base = slugify(meta["title"])
        lyrics = artist_dir / f"{base}_lyrics.json"
        counts = artist_dir / f"{base}_word_count.json"
        if not lyrics.exists(): errors.append(f"{txt.relative_to(repo)}: missing {lyrics.name}")
        if not counts.exists(): errors.append(f"{txt.relative_to(repo)}: missing {counts.name}")
        if errors and (not lyrics.exists() or not counts.exists()):
            continue
        try:
            ld = read_json(lyrics); wd = read_json(counts)
        except Exception as exc:
            errors.append(f"{txt.relative_to(repo)}: invalid JSON: {exc}"); continue
        for label, obj in (("lyrics", ld), ("word count", wd)):
            for field in ("artist", "title", "album", "year", "genre"):
                if obj.get(field) != meta[field]:
                    errors.append(f"{txt.relative_to(repo)}: {label} JSON {field!r} does not match TXT metadata")
        if not isinstance(wd.get("words"), list):
            errors.append(f"{counts.relative_to(repo)}: missing word list")
        else:
            # Older maintained word-count JSON files store the word list but do
            # not store summary totals; calculate those values for the catalog.
            calculated_total = sum(int(item.get("count", 0)) for item in wd["words"] if isinstance(item, dict))
            calculated_unique = len(wd["words"])
            if wd.get("totalWords") is not None and int(wd["totalWords"]) != calculated_total:
                errors.append(f"{counts.relative_to(repo)}: totalWords does not match word list")
            if wd.get("uniqueWords") is not None and int(wd["uniqueWords"]) != calculated_unique:
                errors.append(f"{counts.relative_to(repo)}: uniqueWords does not match word list")
        image_candidates = [p for p in artist_dir.iterdir() if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg"} and not p.stem.lower().endswith("_lg")]
        exact = [p for p in image_candidates if norm(p.stem) == norm(meta["album"])]
        old_entry = old.get((artist.lower(), meta["title"].lower()))
        if old_entry is None:
            # If an artist credit has changed (for example a featured artist was
            # added to the source metadata), preserve the prior catalog ID/artwork
            # by matching the song title within the same artist folder/key.
            old_entry = next((entry for entry in old.values()
                              if isinstance(entry, dict)
                              and str(entry.get("title", "")).strip().lower() == meta["title"].lower()
                              and str(entry.get("artistKey", "")) == folder_key), None)
        album_art = None
        if exact:
            album_art = exact[0]
        elif old_entry and old_entry.get("albumArt"):
            candidate = repo / old_entry["albumArt"]
            if candidate.exists(): album_art = candidate
        if album_art is None:
            errors.append(f"{txt.relative_to(repo)}: no album-art thumbnail matching album {meta['album']!r}")
        if album_art:
            try:
                from PIL import Image
                with Image.open(album_art) as im:
                    if im.size != (200, 200):
                        warnings.append(f"{album_art.relative_to(repo)}: artwork is {im.size[0]}×{im.size[1]}; current standard is 200×200")
            except Exception as exc:
                warnings.append(f"{album_art.relative_to(repo)}: could not inspect dimensions ({exc})")

        old_id = old_entry.get("id") if old_entry else None
        song_id = old_id or f"{slugify(artist)}__{base}"
        entry = {
            "id": song_id,
            "artist": artist,
            "artistKey": artist_key,
            "title": meta["title"],
            "year": meta["year"],
            "genre": meta["genre"],
            "album": meta["album"],
            "lyrics": str(lyrics.relative_to(repo)).replace(os.sep, "/"),
            "wordCount": str(counts.relative_to(repo)).replace(os.sep, "/"),
            "albumArt": str(album_art.relative_to(repo)).replace(os.sep, "/") if album_art else None,
        }
        songs.append(entry)

# Duplicate checks
ids = {}
for s in songs:
    if s["id"] in ids:
        errors.append(f"duplicate song id {s['id']!r}: {ids[s['id']]} and {s['title']}")
    ids[s["id"]] = s["title"]

if errors:
    print("\nCATALOG BUILD FAILED")
    for e in errors: print(f"  ✗ {e}")
    print(f"\nDiscovered {len(songs)} complete song record(s) across {len(artists)} artist(s).")
    sys.exit(2)

songs.sort(key=lambda s: (s["artist"].lower(), s["title"].lower()))
artist_list = [{"key": k, "name": artists[k]} for k in sorted(artists, key=lambda k: artists[k].lower())]
new_catalog = {
    "version": "1.0",
    "description": "Composite song manifest for Lyric Solitaire. Generated from the maintained song_library.",
    "maintenance": "Generated locally by Build_Song_Catalog.command from song_library source files and generated song data.",
    "artists": artist_list,
    "songs": songs,
}

if catalog_path.exists():
    backup_dir = repo / "Auxillary files" / "Update Backups" / datetime.now().strftime("%Y%m%d-%H%M%S-catalog")
    backup_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(catalog_path, backup_dir / "song_catalog.json")

fd, tmp = tempfile.mkstemp(prefix="song_catalog.", suffix=".json", dir=str(library))
os.close(fd)
try:
    Path(tmp).write_text(json.dumps(new_catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    os.replace(tmp, catalog_path)
finally:
    if os.path.exists(tmp): os.unlink(tmp)

print("CATALOG BUILD SUCCESSFUL")
print(f"  ✓ {len(songs)} songs across {len(artists)} artists")
print(f"  ✓ Catalog written: {catalog_path.relative_to(repo)}")
if warnings:
    print("\nWARNINGS")
    for w in warnings: print(f"  ⚠ {w}")
else:
    print("  ✓ No warnings")
PY

STATUS=$?
if [[ $STATUS -eq 0 ]]; then
  osascript -e 'display notification "song_catalog.json rebuilt successfully." with title "Lyric Solitaire"'
fi
exit $STATUS
