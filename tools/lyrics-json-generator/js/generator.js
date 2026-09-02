/*
    RESPONSIBILITY:
    Convert a Lyric Solitaire source lyrics text file into:
    1. Lyrics JSON
    2. Word Count JSON

    The generator is a development/data-authoring tool. It does not
    contain game-play logic.

    SOURCE FORMAT:
    Artist
    Song Title
    Album
    Year
    Genre

    [Verse]
    Lyric line
    Lyric line

    [Chorus]
    Lyric line
    Lyric line
*/

const lyricsUrlInput = document.getElementById("lyricsUrl");
const loadButton = document.getElementById("loadLyrics");
const downloadLyricsButton = document.getElementById("downloadLyrics");
const downloadWordsButton = document.getElementById("downloadWords");
const preview = document.getElementById("preview");
const status = document.getElementById("status");

// These hold the most recently generated datasets for downloading.
let lyricsData = null;
let wordCountData = null;


// ----------------------------------------------------------
// UNICODE NORMALIZATION
// ----------------------------------------------------------

function normalizeUnicode(text) {
    // Normalize Unicode composition so equivalent characters are consistent.
    let result = text.normalize("NFKC");

    // Convert common curly/alternate apostrophes to a standard apostrophe.
    result = result.replace(/[’‘ʼʻ`´]/g, "'");

    // Correct occasional Cyrillic e characters that visually resemble Latin e.
    result = result.replace(/е/g, "e");
    result = result.replace(/Е/g, "E");

    return result;
}


// ----------------------------------------------------------
// WORD TOKENIZER
// ----------------------------------------------------------

function tokenizeLine(line) {
    /*
        Unicode-aware word matching.

        Apostrophes inside words remain part of the word, which preserves
        contractions and lyric words such as "I've", "can't", and "Quittin'".
    */
    const pattern = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]*)?/gu;

    return line.match(pattern) || [];
}


// ----------------------------------------------------------
// DISPLAY WORD
// ----------------------------------------------------------

function displayWord(word) {
    if (!word) {
        return word;
    }

    return word.charAt(0).toUpperCase() + word.slice(1);
}


// ----------------------------------------------------------
// PARSE SOURCE FILE
// ----------------------------------------------------------

function parseLyricsFile(rawText) {
    const text = normalizeUnicode(rawText);

    // Normalize line endings so Windows, Mac, and Unix files behave alike.
    const lines = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n");

    // Ignore trailing empty lines.
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
        lines.pop();
    }

    /*
        Metadata:
        Line 1 = Artist
        Line 2 = Title
        Line 3 = Album
        Line 4 = Year
        Line 5 = Genre
    */
    const artist = lines[0]?.trim() || "";
    const title = lines[1]?.trim() || "";
    const album = lines[2]?.trim() || "";
    const yearText = lines[3]?.trim() || "";
    const genre = lines[4]?.trim() || "";

    const year = /^\d{4}$/.test(yearText)
        ? Number(yearText)
        : yearText;

    const sections = [];
    let currentSection = null;

    // Lyric content begins after the five metadata lines.
    for (let i = 5; i < lines.length; i++) {
        const line = lines[i].trim();

        // Blank lines separate sections in the source but are not lyric text.
        if (line === "") {
            continue;
        }

        // Any [Section Name] marker begins a new section.
        const sectionMatch = line.match(/^\[([^\]]+)\]$/);

        if (sectionMatch) {
            currentSection = {
                type: sectionMatch[1].trim(),
                lyrics: []
            };

            sections.push(currentSection);
            continue;
        }

        // If lyric text appears before a section marker, keep it rather than
        // silently discarding it.
        if (!currentSection) {
            currentSection = {
                type: "Verse",
                lyrics: []
            };

            sections.push(currentSection);
        }

        currentSection.lyrics.push(line);
    }

    return {
        title: title,
        artist: artist,
        album: album,
        year: year,
        genre: genre,
        sections: sections
    };
}


// ----------------------------------------------------------
// CREATE WORD COUNT JSON
// ----------------------------------------------------------

function createWordCountJson(lyricsData, originalText) {
    /*
        Map:
        lowercase word -> physical occurrence count
    */
    const wordCounts = new Map();

    lyricsData.sections.forEach(section => {
        section.lyrics.forEach(line => {
            const words = tokenizeLine(line);

            words.forEach(word => {
                const key = word.toLocaleLowerCase();

                if (wordCounts.has(key)) {
                    wordCounts.set(key, wordCounts.get(key) + 1);
                } else {
                    wordCounts.set(key, 1);
                }
            });
        });
    });

    // Convert the map into the project's word-count array format.
    const words = Array.from(wordCounts.entries())
        .map(([key, count]) => ({
            word: displayWord(key),
            count: count
        }))
        .sort((a, b) =>
            a.word.localeCompare(
                b.word,
                undefined,
                { sensitivity: "base" }
            )
        );

    /*
        Preserve the existing punctuation counts from the working JSBin
        generator. The source is normalized before counting.
    */
    const normalized = normalizeUnicode(originalText);

    const punctuation = {
        "?": (normalized.match(/\?/g) || []).length,
        "!": (normalized.match(/!/g) || []).length,
        ".": (normalized.match(/\./g) || []).length
    };

    return {
        title: lyricsData.title,
        artist: lyricsData.artist,
        album: lyricsData.album,
        year: lyricsData.year,
        genre: lyricsData.genre,
        words: words,
        punctuation: punctuation
    };
}


// ----------------------------------------------------------
// LOAD LYRICS FILE
// ----------------------------------------------------------

async function loadLyrics() {
    const url = lyricsUrlInput.value.trim();

    if (!url) {
        status.textContent = "Please enter a lyrics URL.";
        return;
    }

    status.textContent = "Loading lyrics...";
    downloadLyricsButton.disabled = true;
    downloadWordsButton.disabled = true;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const rawText = await response.text();

        lyricsData = parseLyricsFile(rawText);
        wordCountData = createWordCountJson(lyricsData, rawText);

        let totalWords = 0;

        wordCountData.words.forEach(item => {
            totalWords += item.count;
        });

        const sectionCount = lyricsData.sections.length;

        const lineCount = lyricsData.sections.reduce(
            (total, section) => total + section.lyrics.length,
            0
        );

        preview.textContent = rawText;

        /*
            innerHTML is used here only for the same simple metadata display
            provided by the working JSBin version.
        */
        status.innerHTML = `
            <strong>Successfully loaded.</strong>
            <br><br>
            <strong>Artist:</strong> ${lyricsData.artist}
            <br>
            <strong>Title:</strong> ${lyricsData.title}
            <br>
            <strong>Album:</strong> ${lyricsData.album}
            <br>
            <strong>Year:</strong> ${lyricsData.year}
            <br>
            <strong>Genre:</strong> ${lyricsData.genre}
            <br><br>
            <strong>Sections:</strong> ${sectionCount}
            <br>
            <strong>Lyric Lines:</strong> ${lineCount}
            <br>
            <strong>Total Words:</strong> ${totalWords}
            <br>
            <strong>Unique Words:</strong> ${wordCountData.words.length}
        `;

        downloadLyricsButton.disabled = false;
        downloadWordsButton.disabled = false;

    } catch (error) {
        console.error(error);

        status.innerHTML = `
            <span class="error">
                Error loading lyrics: ${error.message}
            </span>
        `;
    }
}


// ----------------------------------------------------------
// DOWNLOAD JSON
// ----------------------------------------------------------

function downloadJson(data, filename) {
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob(
        [json],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


// ----------------------------------------------------------
// CREATE FILENAME
// ----------------------------------------------------------

function makeFilename(title, suffix) {
    return title
        .replace(/[^\p{L}\p{N}]+/gu, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase()
        + "_" + suffix + ".json";
}


// ----------------------------------------------------------
// DOWNLOAD LYRICS JSON
// ----------------------------------------------------------

downloadLyricsButton.addEventListener("click", function () {
    if (!lyricsData) {
        return;
    }

    const filename = makeFilename(
        lyricsData.title,
        "lyrics"
    );

    downloadJson(lyricsData, filename);
});


// ----------------------------------------------------------
// DOWNLOAD WORD COUNT JSON
// ----------------------------------------------------------

downloadWordsButton.addEventListener("click", function () {
    if (!wordCountData) {
        return;
    }

    const filename = makeFilename(
        wordCountData.title,
        "word_count"
    );

    downloadJson(wordCountData, filename);
});


// ----------------------------------------------------------
// LOAD BUTTON
// ----------------------------------------------------------

loadButton.addEventListener("click", loadLyrics);
