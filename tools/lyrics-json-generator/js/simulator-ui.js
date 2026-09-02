/*
 * ============================================================
 * Lyric Solitaire — Simulator Interface
 * ============================================================
 *
 * RESPONSIBILITY:
 * Load the repository's song data, collect simulation settings,
 * execute repeated simulations, and display the results.
 *
 * The actual simulation rules live in js/utilities/simulator.js.
 * ============================================================
 */

const SONG_CATALOG = [
    {
        id: "quittin-time",
        artist: "Zach Bryan",
        title: "Quittin' Time",
        lyrics: "../../json/bryan_zach/quittin_time_lyrics.json",
        words: "../../json/bryan_zach/quittin_time_word_count.json"
    },
    {
        id: "pink-skies",
        artist: "Zach Bryan",
        title: "Pink Skies",
        lyrics: "../../json/bryan_zach/pink_skies_lyrics.json",
        words: "../../json/bryan_zach/pink_skies_word_count.json"
    },
    {
        id: "appetite",
        artist: "Zach Bryan",
        title: "Appetite",
        lyrics: "../../json/bryan_zach/appetite_lyrics.json",
        words: "../../json/bryan_zach/appetite_word_count.json"
    },
    {
        id: "overtime",
        artist: "Zach Bryan",
        title: "Overtime",
        lyrics: "../../json/bryan_zach/overtime_lyrics.json",
        words: "../../json/bryan_zach/overtime_word_count.json"
    },
    {
        id: "exile",
        artist: "Taylor Swift feat. Bon Iver",
        title: "exile",
        lyrics: "../../json/swift_taylor/exile_lyrics.json",
        words: "../../json/swift_taylor/exile_word_count.json"
    }
];

const songSelection = document.getElementById("song-selection");
const loadStatus = document.getElementById("load-status");
const trialCountInput = document.getElementById("trial-count");
const seedInput = document.getElementById("seed");
const runButton = document.getElementById("run-simulation");
const resultsPanel = document.getElementById("results-panel");
const resultsSummary = document.getElementById("results-summary");
const roundResults = document.getElementById("round-results");

const loadedBundles = new Map();


/*
 * Render the known repository songs as selectable simulator inputs.
 */
function renderSongSelection() {
    songSelection.innerHTML = "";

    SONG_CATALOG.forEach(function (song) {
        const wrapper = document.createElement("div");
        wrapper.className = "song-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `song-${song.id}`;
        checkbox.value = song.id;

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.innerHTML = `
            <strong>${song.title}</strong>
            <span class="song-meta">${song.artist}</span>
        `;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        songSelection.appendChild(wrapper);
    });

    // Start with Quittin' Time selected because it is the primary
    // prototype song used during our rules testing.
    const defaultSong = document.getElementById("song-quittin-time");
    if (defaultSong) {
        defaultSong.checked = true;
    }
}


/*
 * Fetch one song's Lyrics JSON and Word Count JSON.
 */
async function loadSong(song) {
    if (loadedBundles.has(song.id)) {
        return loadedBundles.get(song.id);
    }

    const [lyricsResponse, wordsResponse] = await Promise.all([
        fetch(song.lyrics),
        fetch(song.words)
    ]);

    if (!lyricsResponse.ok) {
        throw new Error(`Unable to load ${song.title} lyrics JSON.`);
    }

    if (!wordsResponse.ok) {
        throw new Error(`Unable to load ${song.title} word-count JSON.`);
    }

    const lyricsData = await lyricsResponse.json();
    const wordCountData = await wordsResponse.json();

    const bundle =
        LyricSolitaireSimulator.prepareSongBundle(
            lyricsData,
            wordCountData
        );

    loadedBundles.set(song.id, bundle);

    return bundle;
}


/*
 * Load all currently selected songs.
 */
async function loadSelectedSongs() {
    const selectedIds = Array.from(
        songSelection.querySelectorAll(
            "input[type='checkbox']:checked"
        )
    ).map(function (input) {
        return input.value;
    });

    if (selectedIds.length === 0) {
        throw new Error("Select at least one song.");
    }

    const selectedSongs = SONG_CATALOG.filter(function (song) {
        return selectedIds.includes(song.id);
    });

    const bundles = [];

    for (const song of selectedSongs) {
        bundles.push(await loadSong(song));
    }

    return bundles;
}


/*
 * Create a seeded pseudo-random number generator.
 *
 * A seed makes a simulation run reproducible. This is useful when
 * comparing rule changes because the same seed can be used again.
 */
function createSeededRandom(seed) {
    let state = Number(seed) >>> 0;

    return function () {
        state += 0x6D2B79F5;

        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(
            t ^ (t >>> 7),
            t | 61
        );

        return (
            ((t ^ (t >>> 14)) >>> 0) /
            4294967296
        );
    };
}


/*
 * Create independent seeded random streams for multiple trials.
 */
function createRandomFactory(seed) {
    let trialSeed = Number(seed) >>> 0;

    return function () {
        trialSeed = (
            Math.imul(
                trialSeed ^ 0x9E3779B9,
                1664525
            ) + 1013904223
        ) >>> 0;

        return createSeededRandom(trialSeed);
    };
}


/*
 * Display aggregate results.
 */
function renderResults(summary, representative) {
    const percent = (summary.winRate * 100).toFixed(1);

    resultsSummary.innerHTML = `
        <div class="results-grid">
            <div class="result-card">
                <strong>Trials</strong>
                <span>${summary.trialCount}</span>
            </div>

            <div class="result-card">
                <strong>Win Rate</strong>
                <span>${percent}%</span>
            </div>

            <div class="result-card">
                <strong>Avg. Drawn</strong>
                <span>${summary.averageDrawn.toFixed(1)}</span>
            </div>

            <div class="result-card">
                <strong>Avg. Played</strong>
                <span>${summary.averagePlayed.toFixed(1)}</span>
            </div>

            <div class="result-card">
                <strong>Avg. Held</strong>
                <span>${summary.averageHeld.toFixed(1)}</span>
            </div>

            <div class="result-card">
                <strong>Avg. Completed Lines</strong>
                <span>${summary.averageCompletedLines.toFixed(1)}</span>
            </div>

            <div class="result-card">
                <strong>Avg. Pool Remaining</strong>
                <span>${summary.averagePoolRemaining.toFixed(1)}</span>
            </div>
        </div>
    `;

    roundResults.innerHTML = "";

    representative.rounds.forEach(function (round) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${round.round}</td>
            <td>${round.requestedDraw}</td>
            <td>${round.actualDraw}</td>
            <td>${round.played}</td>
            <td>${round.handAfterPlay}</td>
            <td>${round.completed}</td>
            <td>${round.activeLines}</td>
            <td>${round.poolRemaining}</td>
        `;

        roundResults.appendChild(row);
    });

    resultsPanel.hidden = false;
}


/*
 * Run the requested number of simulations.
 */
async function runSimulation() {
    runButton.disabled = true;
    loadStatus.textContent = "Loading selected song data...";

    try {
        const bundles = await loadSelectedSongs();
        const combined = LyricSolitaireSimulator.combineSongBundles(
            bundles
        );

        const trialCount = Math.max(
            1,
            Math.min(
                5000,
                Number.parseInt(
                    trialCountInput.value,
                    10
                ) || 100
            )
        );

        const seed = Number.parseInt(
            seedInput.value,
            10
        ) || 0;

        const randomFactory = createRandomFactory(seed);

        loadStatus.textContent =
            `Running ${trialCount} simulations...`;

        /*
         * Yield briefly so the browser can update the status message
         * before performing the simulation loop.
         */
        await new Promise(function (resolve) {
            setTimeout(resolve, 0);
        });

        const summary = LyricSolitaireSimulator.runTrials(
            combined,
            trialCount,
            randomFactory
        );

        /*
         * Show the first trial as a representative round-by-round
         * example. Aggregate statistics above are based on every trial.
         */
        renderResults(
            summary,
            summary.trials[0]
        );

        const validationMessage = combined.poolMatchesLyrics
            ? "Physical pool matches lyric word total."
            : "WARNING: physical pool and lyric word totals do not match.";

        loadStatus.textContent =
            `${validationMessage} Simulation complete.`;

    } catch (error) {
        console.error(error);

        loadStatus.textContent =
            `Simulation error: ${error.message}`;

        resultsPanel.hidden = true;

    } finally {
        runButton.disabled = false;
    }
}


/*
 * Initialize the simulator interface.
 */
renderSongSelection();
runButton.addEventListener("click", runSimulation);

loadStatus.textContent =
    "Song data is ready. Run a simulation.";
