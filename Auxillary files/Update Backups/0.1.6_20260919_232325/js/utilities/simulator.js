/*
 * ============================================================
 * Lyric Solitaire — Game Simulation Utility
 * ============================================================
 *
 * RESPONSIBILITY:
 * Simulate complete Lyric Solitaire games using lyric JSON and word-count
 * JSON data. This file contains game-state, draw, persona, and simulation
 * logic only; it does not create or manipulate the simulator interface.
 *
 * PERSONAS:
 *   Dolly — Aggressive Row Filler
 *     Aggressive line completion with adaptive restraint when the hand
 *     becomes crowded. She prioritizes active lines and uses new rows only
 *     when the current board/hand state makes that sensible.
 *
 *   Johnny — Walks the Line
 *     Plays as many usable words as possible, but opens at most one new
 *     lyric line per round. Existing active lines always have priority.
 *
 *   Kenny — The Gambler
 *     Takes substantially more opening risk. In Round 1 he deliberately
 *     builds a very broad board (9 or 10 lines when possible), while still
 *     always using a word on an existing active line before opening a new one.
 *
 * MODE CONFIGURATION:
 *   Easy / Open : 12 rows, 50-tile hand, 12 rounds
 *   Standard    : 10 rows, 40-tile hand, 10 rounds
 *   Hard        :  8 rows, 30-tile hand,  8 rounds
 *
 * Scoring is not modeled yet.
 * ============================================================
 */
(function (global) {
    "use strict";

    const MODE_CONFIG = {
        easy: { label: "Easy / Open", maxRows: 12, maxHand: 50, maxRounds: 12 },
        standard: { label: "Standard", maxRows: 10, maxHand: 40, maxRounds: 10 },
        hard: { label: "Hard", maxRows: 8, maxHand: 30, maxRounds: 8 }
    };

    const PERSONA_CONFIG = {
        aggressive_row_filler: {
            name: "Dolly — Aggressive Row Filler",
            description: "An aggressive player who likes finishing lyric lines quickly, but develops enough common sense to avoid filling every row when the hand is becoming crowded.",
            strategy: "Prioritize the most nearly complete active line; play every usable word; adapt the new-line target downward as the round advances or hand pressure rises; prefer short candidate lines when opening a row."
        },
        walks_the_line: {
            name: "Johnny — Walks the Line",
            description: "A steady player who wants to use as many words as possible without spreading the board too quickly. He will open only one new lyric line per round.",
            strategy: "Always prefer a playable word on an existing active line; permit at most one new line opening per round; after the new-line allowance is used, hold otherwise playable-to-new-row words until a later round."
        },
        gambler: {
            name: "Kenny — The Gambler",
            description: "A risk-taking player who is willing to build a very wide board early. He looks for opportunity everywhere, but still uses a word on an existing line before gambling on a new line.",
            strategy: "Prefer existing active-line matches first; when no active line can use the word, open a new line whenever a row is available; in Round 1 deliberately target 9 or 10 active lines when the mode permits, then continue taking substantially more opening risk than Dolly or Johnny."
        }
    };

    const CONFIG = {
        version: "0.1.5",
        initialDraw: 12,
        defaultMode: "easy",
        modes: MODE_CONFIG,
        personas: PERSONA_CONFIG,
        defaultPersona: "aggressive_row_filler"
    };

    function getModeConfig(mode) { return MODE_CONFIG[mode] || MODE_CONFIG.easy; }
    function getPersonaConfig(persona) { return PERSONA_CONFIG[persona] || PERSONA_CONFIG[CONFIG.defaultPersona]; }

    function normalizeWord(word) {
        return String(word || "").normalize("NFKC")
            .replace(/[’‘ʼʻ`´]/g, "'")
            .replace(/е/g, "e").replace(/Е/g, "E")
            .toLocaleLowerCase();
    }

    function tokenizeLine(line) {
        const pattern = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]*)?/gu;
        return String(line || "").match(pattern) || [];
    }

    function wordFrequency(line) {
        const counts = new Map();
        tokenizeLine(line).forEach(function (word) {
            const key = normalizeWord(word);
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        return counts;
    }

    function buildPhysicalPool(wordCountData) {
        const pool = [];
        (wordCountData.words || []).forEach(function (item) {
            const count = Math.max(0, Number(item.count) || 0);
            for (let i = 0; i < count; i += 1) {
                pool.push({ word: item.word, key: normalizeWord(item.word) });
            }
        });
        return pool;
    }

    function buildLineOccurrences(lyricsData) {
        const lines = [];
        let occurrenceId = 0;
        (lyricsData.sections || []).forEach(function (section, sectionIndex) {
            (section.lyrics || []).forEach(function (text, lineIndex) {
                const required = wordFrequency(text);
                lines.push({
                    id: occurrenceId++, sectionIndex, section: section.type || "Verse",
                    lineIndex, text, required, remaining: new Map(required),
                    wordCount: Array.from(required.values()).reduce((sum, count) => sum + count, 0),
                    placed: 0
                });
            });
        });
        return lines;
    }

    function cloneLine(line) {
        return {
            id: line.id, sectionIndex: line.sectionIndex, section: line.section,
            lineIndex: line.lineIndex, text: line.text, required: new Map(line.required),
            remaining: new Map(line.required), wordCount: line.wordCount, placed: 0
        };
    }

    function shuffle(array, random) {
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function calculateDraw(round, previousPlayed) {
        if (round === 1) return CONFIG.initialDraw;
        return Math.max(0, (13 - round) + previousPlayed);
    }

    function lineCanUseWord(line, wordKey) {
        return (line.remaining.get(wordKey) || 0) > 0;
    }

    function chooseActiveLine(activeLines, wordKey, random) {
        const candidates = activeLines.filter(line => lineCanUseWord(line, wordKey));
        if (!candidates.length) return null;
        let bestScore = -Infinity;
        let best = [];
        candidates.forEach(function (line) {
            let remainingWords = 0;
            line.remaining.forEach(count => { remainingWords += count; });
            const usesOfWord = line.remaining.get(wordKey) || 0;
            const progressScore = (line.wordCount - remainingWords) * 100 - remainingWords * 10 + usesOfWord * 5;
            if (progressScore > bestScore) { bestScore = progressScore; best = [line]; }
            else if (progressScore === bestScore) best.push(line);
        });
        return best[Math.floor(random() * best.length)];
    }

    function chooseNewLine(allLines, activeLines, completedIds, wordKey, random) {
        const activeIds = new Set(activeLines.map(line => line.id));
        const candidates = allLines.filter(line =>
            !activeIds.has(line.id) && !completedIds.has(line.id) && lineCanUseWord(line, wordKey)
        );
        if (!candidates.length) return null;
        candidates.sort((a, b) => a.wordCount - b.wordCount);
        const topCandidates = candidates.slice(0, Math.min(8, candidates.length));
        return cloneLine(topCandidates[Math.floor(random() * topCandidates.length)]);
    }

    function playWordIntoLine(line, wordKey) {
        const remaining = line.remaining.get(wordKey) || 0;
        if (remaining <= 0) return false;
        if (remaining === 1) line.remaining.delete(wordKey);
        else line.remaining.set(wordKey, remaining - 1);
        line.placed += 1;
        return true;
    }

    function isLineComplete(line) { return line.remaining.size === 0; }

    function compactCompletedLines(activeLines, completedIds, completedLines) {
        const remaining = [];
        activeLines.forEach(function (line) {
            if (isLineComplete(line)) {
                completedIds.add(line.id);
                completedLines.push(line);
            } else remaining.push(line);
        });
        return remaining;
    }

    function drawTiles(pool, hand, requestedAmount, random, gameConfig) {
        const availableCapacity = Math.max(0, gameConfig.maxHand - hand.length);
        const actualAmount = Math.min(requestedAmount, pool.length, availableCapacity);
        const drawn = [];
        for (let i = 0; i < actualAmount; i += 1) {
            const index = Math.floor(random() * pool.length);
            drawn.push(pool.splice(index, 1)[0]);
        }
        return drawn;
    }

    /*
     * Determine whether a persona is currently allowed to open another row.
     * Existing active-line matches are handled before this function is called.
     */
    function mayOpenNewLine(persona, context) {
        const { round, handLength, gameConfig, activeLines, openedThisRound } = context;
        const activeCount = activeLines.length;

        if (activeCount >= gameConfig.maxRows) return false;

        if (persona === "walks_the_line") {
            return openedThisRound < 1;
        }

        if (persona === "gambler") {
            if (round === 1) return activeCount < Math.min(gameConfig.maxRows, 10);
            // Kenny remains willing to use every available row after the opening round.
            return true;
        }

        // Dolly: early aggression, followed by a dynamic safety margin.
        let targetRows;
        if (round === 1) targetRows = gameConfig.maxRows;
        else if (round <= 3) targetRows = Math.max(1, gameConfig.maxRows - 1);
        else targetRows = Math.max(1, gameConfig.maxRows - 2);

        const handPressure = handLength / gameConfig.maxHand;
        if (handPressure >= 0.85) targetRows = Math.max(1, targetRows - 2);
        else if (handPressure >= 0.70) targetRows = Math.max(1, targetRows - 1);

        return activeCount < targetRows;
    }

    function playHand(
        hand, activeLines, allLines, completedIds, completedLines,
        random, gameConfig, persona, round
    ) {
        let playedThisTurn = 0;
        let openedThisRound = 0;
        let changed = true;

        while (changed) {
            changed = false;

            // Kenny's opening gambit: deliberately look for a hand word that
            // cannot advance an existing line so he can establish a broad
            // board early. If a word *can* advance an existing line, it is
            // never used to open a new line.
            if (persona === "gambler" && round === 1 && openedThisRound < Math.min(gameConfig.maxRows, 10)) {
                let openingIndex = -1;
                for (let i = 0; i < hand.length; i += 1) {
                    if (!chooseActiveLine(activeLines, hand[i].key, random)) {
                        const possible = chooseNewLine(allLines, activeLines, completedIds, hand[i].key, random);
                        if (possible) {
                            openingIndex = i;
                            break;
                        }
                    }
                }
                if (openingIndex >= 0) {
                    const tile = hand[openingIndex];
                    const target = chooseNewLine(allLines, activeLines, completedIds, tile.key, random);
                    if (target && playWordIntoLine(target, tile.key)) {
                        activeLines.push(target);
                        openedThisRound += 1;
                        hand.splice(openingIndex, 1);
                        playedThisTurn += 1;
                        changed = true;
                        const compacted = compactCompletedLines(activeLines, completedIds, completedLines);
                        activeLines.length = 0;
                        compacted.forEach(line => activeLines.push(line));
                        continue;
                    }
                }
            }

            for (let handIndex = 0; handIndex < hand.length; handIndex += 1) {
                const tile = hand[handIndex];
                const wordKey = tile.key;

                // Every persona gives existing active lines first priority.
                let target = chooseActiveLine(activeLines, wordKey, random);

                if (!target && mayOpenNewLine(persona, {
                    round, handLength: hand.length, gameConfig, activeLines, openedThisRound
                })) {
                    target = chooseNewLine(allLines, activeLines, completedIds, wordKey, random);
                    if (target) {
                        activeLines.push(target);
                        openedThisRound += 1;
                    }
                }

                if (!target || !playWordIntoLine(target, wordKey)) continue;

                hand.splice(handIndex, 1);
                handIndex -= 1;
                playedThisTurn += 1;
                changed = true;

                const compacted = compactCompletedLines(activeLines, completedIds, completedLines);
                activeLines.length = 0;
                compacted.forEach(line => activeLines.push(line));
            }
        }

        return { playedThisTurn, openedThisRound };
    }

    function simulateGame(songBundle, options) {
        const random = options.random;
        const mode = options.mode || CONFIG.defaultMode;
        const gameConfig = getModeConfig(mode);
        const persona = options.persona || CONFIG.defaultPersona;
        const allLines = songBundle.lines;
        const pool = songBundle.pool.slice();
        shuffle(pool, random);

        const hand = [], activeLines = [], completedLines = [], completedIds = new Set();
        let previousPlayed = 0, totalDrawn = 0, totalPlayed = 0;
        const rounds = [];

        for (let round = 1; round <= gameConfig.maxRounds; round += 1) {
            if (pool.length === 0) break;
            const requestedDraw = calculateDraw(round, previousPlayed);
            const handBeforeDraw = hand.length;
            const drawn = drawTiles(pool, hand, requestedDraw, random, gameConfig);
            drawn.forEach(tile => hand.push(tile));
            totalDrawn += drawn.length;

            const playResult = playHand(
                hand, activeLines, allLines, completedIds, completedLines,
                random, gameConfig, persona, round
            );
            const playedThisRound = playResult.playedThisTurn;
            totalPlayed += playedThisRound;
            previousPlayed = playedThisRound;

            const completedBeforeRound = rounds.reduce((sum, item) => sum + item.completed, 0);
            rounds.push({
                round, requestedDraw, actualDraw: drawn.length, handBeforeDraw,
                handAfterPlay: hand.length, played: playedThisRound,
                completed: completedLines.length - completedBeforeRound,
                activeLines: activeLines.length, poolRemaining: pool.length,
                openedNewLines: playResult.openedThisRound
            });

            if (pool.length === 0) break;
        }

        const totalWordsInSource = allLines.reduce((sum, line) => sum + line.wordCount, 0);
        const completedWords = completedLines.reduce((sum, line) => sum + line.wordCount, 0);
        const won = completedWords === totalWordsInSource;

        return {
            simulatorVersion: CONFIG.version,
            persona,
            personaLabel: getPersonaConfig(persona).name,
            won, mode, modeLabel: gameConfig.label,
            maxRows: gameConfig.maxRows, maxHand: gameConfig.maxHand, maxRounds: gameConfig.maxRounds,
            roundsPlayed: rounds.length, totalSourceWords: totalWordsInSource,
            totalDrawn, totalPlayed, held: hand.length,
            completedLines: completedLines.length, activeLines: activeLines.length,
            poolRemaining: pool.length, rounds
        };
    }

    function prepareSongBundle(lyricsData, wordCountData) {
        const pool = buildPhysicalPool(wordCountData);
        const lines = buildLineOccurrences(lyricsData);
        const sourceWordTotal = lines.reduce((sum, line) => sum + line.wordCount, 0);
        return {
            title: lyricsData.title, artist: lyricsData.artist, album: lyricsData.album,
            year: lyricsData.year, genre: lyricsData.genre, pool, lines,
            sourceWordTotal, poolWordTotal: pool.length,
            poolMatchesLyrics: sourceWordTotal === pool.length
        };
    }

    function combineSongBundles(bundles) {
        const combinedPool = [], combinedLines = [];
        bundles.forEach(function (bundle, bundleIndex) {
            bundle.pool.forEach(tile => combinedPool.push({ ...tile, songIndex: bundleIndex }));
            bundle.lines.forEach(function (line) {
                const cloned = cloneLine(line);
                cloned.songIndex = bundleIndex;
                cloned.id = `${bundleIndex}-${line.id}`;
                combinedLines.push(cloned);
            });
        });
        const sourceWordTotal = combinedLines.reduce((sum, line) => sum + line.wordCount, 0);
        return {
            title: bundles.map(bundle => bundle.title).join(" + "),
            artist: bundles.map(bundle => bundle.artist).filter((value, index, array) => array.indexOf(value) === index).join(", "),
            pool: combinedPool, lines: combinedLines, sourceWordTotal,
            poolWordTotal: combinedPool.length, poolMatchesLyrics: sourceWordTotal === combinedPool.length
        };
    }

    function runTrials(songBundle, trialCount, randomFactory, options) {
        const trials = [];
        const mode = options?.mode || CONFIG.defaultMode;
        const persona = options?.persona || CONFIG.defaultPersona;
        for (let i = 0; i < trialCount; i += 1) {
            trials.push(simulateGame(songBundle, { random: randomFactory(i), mode, persona }));
        }
        const average = field => trials.reduce((sum, result) => sum + result[field], 0) / Math.max(1, trials.length);
        const wins = trials.filter(result => result.won).length;
        const allWordsUsedTrials = trials.filter(trial => Number(trial.totalPlayed) === Number(trial.totalSourceWords)).length;
        return {
            trialCount: trials.length, wins, losses: trials.length - wins,
            winRate: wins / Math.max(1, trials.length),
            averageRounds: average("roundsPlayed"), averageDrawn: average("totalDrawn"),
            averagePlayed: average("totalPlayed"), averageHeld: average("held"),
            averageCompletedLines: average("completedLines"), averagePoolRemaining: average("poolRemaining"),
            averageActiveLines: average("activeLines"), allWordsUsedTrials,
            allWordsUsedRate: allWordsUsedTrials / Math.max(1, trials.length),
            everAllWordsUsed: allWordsUsedTrials > 0,
            bestWordsPlayed: trials.length ? Math.max(...trials.map(t => Number(t.totalPlayed) || 0)) : 0,
            worstWordsPlayed: trials.length ? Math.min(...trials.map(t => Number(t.totalPlayed) || 0)) : 0,
            bestCompletedLines: trials.length ? Math.max(...trials.map(t => Number(t.completedLines) || 0)) : 0,
            worstCompletedLines: trials.length ? Math.min(...trials.map(t => Number(t.completedLines) || 0)) : 0,
            trials
        };
    }

    global.LyricSolitaireSimulator = {
        CONFIG, MODE_CONFIG, PERSONA_CONFIG, getModeConfig, getPersonaConfig,
        normalizeWord, tokenizeLine, buildPhysicalPool, buildLineOccurrences,
        prepareSongBundle, combineSongBundles, calculateDraw, simulateGame, runTrials
    };
})(window);
