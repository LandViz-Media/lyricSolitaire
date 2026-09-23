#!/bin/bash
# Lyric Solitaire — Lyric Data Audit launcher
# Responsibility: choose a Lyric Solitaire project folder and run the read-only audit.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(osascript <<'APPLESCRIPT'
tell application "Finder"
    activate
    try
        set chosenFolder to choose folder with prompt "Select the Lyric Solitaire project folder"
        return POSIX path of chosenFolder
    on error number -128
        return ""
    end try
end tell
APPLESCRIPT
)"
if [[ -z "$PROJECT_ROOT" ]]; then
  echo "No folder selected."
  exit 0
fi
if [[ ! -f "$PROJECT_ROOT/game.html" || ! -d "$PROJECT_ROOT/song_library" ]]; then
  osascript -e 'display alert "Lyric Data Audit" message "The selected folder does not appear to be a Lyric Solitaire project root. It must contain game.html and song_library/." as critical'
  exit 1
fi
python3 "$SCRIPT_DIR/tools/lyric_data_audit.py" "$PROJECT_ROOT"
status=$?
if [[ $status -eq 0 ]]; then
  osascript -e 'display notification "Lyric Data Audit completed without errors." with title "Lyric Solitaire"'
else
  osascript -e 'display notification "Lyric Data Audit found one or more errors. Review the HTML report." with title "Lyric Solitaire"'
fi
exit $status
