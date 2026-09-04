/*
 * Lyric Solitaire — Lyric Generator Controller
 *
 * Responsibility:
 * Converts the maintained five-line lyric source format into game-ready
 * lyrics JSON and physical word-count JSON. It also validates the required
 * 200×200 album-art thumbnail. Catalog construction is intentionally handled
 * by the separate local Build_Song_Catalog.command utility.
 */
const state = { lyrics: null, wordCounts: null, albumArt: null, sourceText: "", catalog: null };
const $ = id => document.getElementById(id);

function setStatus(text, kind = "") {
  $("status").textContent = text;
  $("status").className = `status ${kind}`;
}
function normalizeWord(word) { return String(word || "").normalize("NFKC").replace(/[’‘ʼʻ`´]/g, "'").toLocaleLowerCase(); }
function tokenize(text) { return String(text || "").match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]*)?/gu) || []; }
function slugify(text) { return String(text || "untitled").toLocaleLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
function deriveArtistKey(artist) {
  const name = String(artist || "").trim();
  const normalized = name.toLocaleLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  const words = normalized.split(/[-\s]+/).filter(Boolean);
  if (words.length >= 2) return `${words[words.length - 1]}_${words.slice(0, -1).join("_")}`;
  return slugify(normalized) || "artist";
}
async function loadCatalog() {
  try {
    const response = await fetch(`song_library/song_catalog.json?v=${window.LyricSolitaireProject.generatorVersion}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.catalog = await response.json();
  } catch (error) {
    console.warn("Song catalog could not be loaded; artist keys will be derived.", error);
    state.catalog = null;
  }
}
function artistKeyFor(artist) {
  const match = (state.catalog?.artists || []).find(a => String(a.name || "").trim().toLocaleLowerCase() === String(artist || "").trim().toLocaleLowerCase());
  if (match) return { key: match.key, source: "Existing catalog key" };
  return { key: deriveArtistKey(artist), source: "Derived from artist name" };
}
function parseSource(raw) {
  const lines = String(raw || "").replace(/\r\n?/g, "\n").split("\n");
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (lines.length < 5) throw new Error("Source text must contain at least five metadata lines.");
  const artist = (lines.shift() || "").trim();
  const title = (lines.shift() || "").trim();
  const album = (lines.shift() || "").trim();
  const yearText = (lines.shift() || "").trim();
  const genre = (lines.shift() || "").trim();
  if (!artist || !title) throw new Error("Artist and Song Title are required in the first two lines.");
  let year = Number.parseInt(yearText, 10);
  if (Number.isNaN(year)) year = null;
  const sections = []; let current = null;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^\[([^\]]+)\]$/);
    if (match) { current = { type: match[1].trim(), lyrics: [] }; sections.push(current); continue; }
    if (!current) { current = { type: "Verse", lyrics: [] }; sections.push(current); }
    current.lyrics.push(line);
  }
  const wordMap = new Map();
  for (const section of sections) for (const lyricLine of section.lyrics) for (const token of tokenize(lyricLine)) {
    const key = normalizeWord(token);
    if (!wordMap.has(key)) wordMap.set(key, { word: token, count: 0 });
    wordMap.get(key).count++;
  }
  const words = [...wordMap.values()].sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: "base" }));
  return {
    lyricsData: { title, artist, album, year, genre, sections },
    wordCountData: { title, artist, album, year, genre, totalWords: words.reduce((sum, w) => sum + w.count, 0), uniqueWords: words.length, words }
  };
}
function render() {
  const l = state.lyrics, w = state.wordCounts;
  if (!l || !w) return;
  $("title").textContent = l.title || "—"; $("artist").textContent = l.artist || "—"; $("album").textContent = l.album || "—"; $("year").textContent = l.year ?? "—"; $("genre").textContent = l.genre || "—";
  $("total").textContent = w.totalWords; $("unique").textContent = w.uniqueWords; $("sections").textContent = l.sections.length; $("lines").textContent = l.sections.reduce((n, s) => n + s.lyrics.length, 0);
  const base = slugify(l.title); $("baseName").textContent = base;
  const key = artistKeyFor(l.artist); $("artistKey").value = key.key; $("keySource").textContent = key.source;
  $("lyricsPreview").textContent = JSON.stringify(l, null, 2); $("wordPreview").textContent = JSON.stringify(w, null, 2);
  updateGenerateState();
}
function updateGenerateState() {
  $("downloadButton").disabled = !(state.lyrics && state.wordCounts && state.albumArt && state.albumArt.valid);
}
function parseCurrentSource() {
  try {
    const parsed = parseSource(state.sourceText || $("source").value);
    state.lyrics = parsed.lyricsData; state.wordCounts = parsed.wordCountData;
    render(); setStatus("Parsed successfully.", "ok");
  } catch (error) {
    console.error(error); state.lyrics = null; state.wordCounts = null; updateGenerateState(); setStatus(error.message, "error");
  }
}
async function loadText(text, label) {
  state.sourceText = text; $("source").value = text; parseCurrentSource();
  if (!$('status').classList.contains('error')) setStatus(`Loaded ${label}.`, "ok");
}
async function loadUrl() {
  const url = $("githubUrl").value.trim();
  if (!url) { setStatus("Enter a Raw GitHub URL first.", "warn"); return; }
  try {
    setStatus("Loading Raw GitHub file…"); const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`); await loadText(await response.text(), "Raw GitHub source");
  } catch (error) { console.error(error); setStatus(`Could not load URL: ${error.message}`, "error"); }
}
function download(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function validateAlbumArt(file) {
  if (!file) { state.albumArt = null; $("artPreview").removeAttribute("src"); $("artDetails").textContent = "No thumbnail selected."; $("artStatus").textContent = "Album art required before generation."; updateGenerateState(); return; }
  if (!/^image\/(png|jpe?g)$/i.test(file.type) && !/\.(png|jpe?g)$/i.test(file.name)) {
    state.albumArt = { valid: false }; $("artStatus").textContent = "Invalid format — use PNG, JPG, or JPEG."; updateGenerateState(); return;
  }
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = () => {
    const valid = img.naturalWidth === 200 && img.naturalHeight === 200;
    state.albumArt = { valid, name: file.name, width: img.naturalWidth, height: img.naturalHeight };
    $("artPreview").src = url;
    $("artDetails").textContent = `${file.name} · ${img.naturalWidth}×${img.naturalHeight} px`;
    $("artStatus").textContent = valid ? "✓ Valid 200×200 thumbnail" : "⚠ Thumbnail must be exactly 200×200 px.";
    $("artStatus").className = `key-source ${valid ? "ok" : "error"}`;
    updateGenerateState();
    if (!valid) setStatus("Album art must be exactly 200×200 pixels.", "error");
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { state.albumArt = { valid: false }; $("artStatus").textContent = "Could not read the image."; updateGenerateState(); URL.revokeObjectURL(url); };
  img.src = url;
}

$("fileInput").addEventListener("change", async e => { const file = e.target.files[0]; if (!file) return; try { await loadText(await file.text(), file.name); } catch (error) { setStatus(`Could not read file: ${error.message}`, "error"); } });
$("artInput").addEventListener("change", e => validateAlbumArt(e.target.files[0]));
$("loadUrlButton").addEventListener("click", loadUrl);
$("githubUrl").addEventListener("keydown", e => { if (e.key === "Enter") loadUrl(); });
$("parseButton").addEventListener("click", parseCurrentSource);
$("downloadButton").addEventListener("click", () => { if (!state.lyrics || !state.wordCounts || !state.albumArt?.valid) return; const base = slugify(state.lyrics.title); download(state.lyrics, `${base}_lyrics.json`); setTimeout(() => download(state.wordCounts, `${base}_word_count.json`), 350); });
$("artistKey").addEventListener("input", () => $("keySource").textContent = "Custom artist key");
(async () => { await loadCatalog(); $("version").textContent = `v${window.LyricSolitaireProject.generatorVersion}`; $("footerVersion").textContent = `v${window.LyricSolitaireProject.generatorVersion}`; })();
