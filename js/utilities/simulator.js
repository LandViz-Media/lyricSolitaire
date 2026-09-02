/*
 * ============================================================
 * Lyric Solitaire — Game Simulation Utility
 * ============================================================
 *
 * RESPONSIBILITY:
 * Simulate complete Lyric Solitaire games using lyric JSON and word-count
 * JSON data.
 *
 * This file contains game-state and simulation logic only. It does not create
 * or manipulate the simulator interface.
 *
 * IMPORTANT:
 * Simulator v0.1.1 is the first version in which Easy, Standard, and Hard
 * actually change the simulation configuration.
 *
 * MODE CONFIGURATION:
 *   Easy / Open : 12 rows, 50-tile hand, 12 rounds
 *   Standard    : 10 rows, 40-tile hand, 10 rounds
 *   Hard        :  8 rows, 30-tile hand,  8 rounds
 *
 * The current simulator intentionally uses an aggressive simulated player.
 * It is a balance/solvability research tool, not the final game engine.
 *
 * Scoring is not modeled yet.
 * ============================================================
 */
(function (global) {
    "use strict";

    const MODE_CONFIG = {
        easy: {
            label: "Easy / Open",
            maxRows: 12,
            maxHand: 50,
            maxRounds: 12
        },
        standard: {
            label: "Standard",
            maxRows: 10,
            maxHand: 40,
            maxRounds: 10
        },
        hard: {
            label: "Hard",
            maxRows: 8,
            maxHand: 30,
            maxRounds: 8
        }
    };

    const CONFIG = {
        version: "0.1.1",
        initialDraw: 12,
        defaultMode: "easy",
        modes: MODE_CONFIG
    };

    function getModeConfig(mode) {
        return MODE_CONFIG[mode] || MODE_CONFIG.easy;
    }

    /*
     * Normalize lyric words so matching is consistent across punctuation
     * and typographic apostrophes.
     */
    function normalizeWord(word) {
        return String(word || "")
            .normalize("NFKC")
            .replace(/[’‘ʼʻ`´]/g, "'")
            .replace(/е/g, "e")
            .replace(/Е/g, "E")
            .toLocaleLowerCase();
    }

    /*
     * Tokenize lyric lines while preserving common contractions.
     */
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

    /*
     * Expand the word-count JSON into physical word tiles.
     * A count of 14 for "my" produces fourteen physical tiles.
     */
    function buildPhysicalPool(wordCountData) {
        const pool = [];

        (wordCountData.words || []).forEach(function (item) {
            const count = Math.max(0, Number(item.count) || 0);

            for (let i = 0; i < count; i += 1) {
                pool.push({
                    word: item.word,
                    key: normalizeWord(item.word)
                });
            }
        });

        return pool;
    }

    /*
     * Preserve every lyric-line occurrence separately. Repeated chorus text
     * therefore remains multiple distinct candidate lines.
     */
    function buildLineOccurrences(lyricsData) {
        const lines = [];
        let occurrenceId = 0;

        (lyricsData.sections || []).forEach(function (section, sectionIndex) {
            (section.lyrics || []).forEach(function (text, lineIndex) {
                const required = wordFrequency(text);

                lines.push({
                    id: occurrenceId,
                    sectionIndex: sectionIndex,
                    section: section.type || "Verse",
                    lineIndex: lineIndex,
                    text: text,
                    required: required,
                    remaining: new Map(required),
                    wordCount: Array.from(required.values()).reduce(
                        function (sum, count) {
                            return sum + count;
                        },
                        0
                    ),
                    placed: 0
                });

                occurrenceId += 1;
            });
        });

        return lines;
    }

    function cloneLine(line) {
        return {
            id: line.id,
            sectionIndex: line.sectionIndex,
            section: line.section,
            lineIndex: line.lineIndex,
            text: line.text,
            required: new Map(line.required),
            remaining: new Map(line.required),
            wordCount: line.wordCount,
            placed: 0
        };
    }

    function shuffle(array, random) {
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }

        return array;
    }

    /*
     * Current agreed draw progression:
     *   Round 1 = 12
     *   Later round = (13 - Round) + Previous Round Words Played
     *
     * Example:
     *   Round 2 after 12 played = 11 + 12 = 23.
     */
    function calculateDraw(round, previousPlayed) {
        if (round === 1) {
            return CONFIG.initialDraw;
        }

        return Math.max(0, (13 - round) + previousPlayed);
    }

    function lineCanUseWord(line, wordKey) {
        return (line.remaining.get(wordKey) || 0) > 0;
    }

    /*
     * Aggressive strategy:
     *   1. Prefer an active line already closest to completion.
     *   2. Prefer uses of the selected word that advance that line.
     *   3. Use randomness only to break ties.
     */
    function chooseActiveLine(activeLines, wordKey, random) {
        const candidates = activeLines.filter(function (line) {
            return lineCanUseWord(line, wordKey);
        });

        if (candidates.length === 0) {
            return null;
        }

        let bestScore = -Infinity;
        let best = [];

        candidates.forEach(function (line) {
            let remainingWords = 0;

            line.remaining.forEach(function (count) {
                remainingWords += count;
            });

            const usesOfWord = line.remaining.get(wordKey) || 0;
            const progressScore =
                (line.wordCount - remainingWords) * 100 -
                remainingWords * 10 +
                usesOfWord * 5;

            if (progressScore > bestScore) {
                bestScore = progressScore;
                best = [line];
            } else if (progressScore === bestScore) {
                best.push(line);
            }
        });

        return best[Math.floor(random() * best.length)];
    }

    /*
     * Easy/Open candidate behavior: when a word cannot be used by an active
     * line, an open row may introduce a new lyric line containing that word.
     */
    function chooseNewLine(
        allLines,
        activeLines,
        completedIds,
        wordKey,
        random
    ) {
        const activeIds = new Set(
            activeLines.map(function (line) {
                return line.id;
            })
        );

        const candidates = allLines.filter(function (line) {
            return (
                !activeIds.has(line.id) &&
                !completedIds.has(line.id) &&
                lineCanUseWord(line, wordKey)
            );
        });

        if (candidates.length === 0) {
            return null;
        }

        // Short lines are favored because they can free a row faster.
        candidates.sort(function (a, b) {
            return a.wordCount - b.wordCount;
        });

        const topCandidates = candidates.slice(
            0,
            Math.min(8, candidates.length)
        );

        return cloneLine(
            topCandidates[Math.floor(random() * topCandidates.length)]
        );
    }

    function playWordIntoLine(line, wordKey) {
        const remaining = line.remaining.get(wordKey) || 0;

        if (remaining <= 0) {
            return false;
        }

        if (remaining === 1) {
            line.remaining.delete(wordKey);
        } else {
            line.remaining.set(wordKey, remaining - 1);
        }

        line.placed += 1;
        return true;
    }

    function isLineComplete(line) {
        return line.remaining.size === 0;
    }

    /*
     * Completed rows leave the active board immediately.
     */
    function compactCompletedLines(
        activeLines,
        completedIds,
        completedLines
    ) {
        const remaining = [];

        activeLines.forEach(function (line) {
            if (isLineComplete(line)) {
                completedIds.add(line.id);
                completedLines.push(line);
            } else {
                remaining.push(line);
            }
        });

        return remaining;
    }

    function drawTiles(pool, hand, requestedAmount, random, gameConfig) {
        const availableCapacity = gameConfig.maxHand - hand.length;

        const actualAmount = Math.min(
            requestedAmount,
            pool.length,
            Math.max(0, availableCapacity)
        );

        const drawn = [];

        for (let i = 0; i < actualAmount; i += 1) {
            const index = Math.floor(random() * pool.length);
            drawn.push(pool.splice(index, 1)[0]);
        }

        return drawn;
    }

    /*
     * Aggressively play the hand until no additional word can be placed.
     */
    function aggressivelyPlayHand(
        hand,
        activeLines,
        allLines,
        completedIds,
        completedLines,
        random,
        gameConfig
    ) {
        let playedThisTurn = 0;
        let changed = true;

        while (changed) {
            changed = false;

            for (let handIndex = 0; handIndex < hand.length; handIndex += 1) {
                const tile = hand[handIndex];
                const wordKey = tile.key;

                let target = chooseActiveLine(
                    activeLines,
                    wordKey,
                    random
                );

                if (
                    !target &&
                    activeLines.length < gameConfig.maxRows
                ) {
                    target = chooseNewLine(
                        allLines,
                        activeLines,
                        completedIds,
                        wordKey,
                        random
                    );

                    if (target) {
                        activeLines.push(target);
                    }
                }

                if (!target) {
                    continue;
                }

                if (!playWordIntoLine(target, wordKey)) {
                    continue;
                }

                // The physical tile has been played.
                hand.splice(handIndex, 1);
                handIndex -= 1;
                playedThisTurn += 1;
                changed = true;

                const compacted = compactCompletedLines(
                    activeLines,
                    completedIds,
                    completedLines
                );

                activeLines.length = 0;
                compacted.forEach(function (line) {
                    activeLines.push(line);
                });
            }
        }

        return playedThisTurn;
    }

    /*
     * Run one complete simulated game under the selected mode.
     */
    function simulateGame(songBundle, options) {
        const random = options.random;
        const mode = options.mode || CONFIG.defaultMode;
        const gameConfig = getModeConfig(mode);

        const allLines = songBundle.lines;
        const pool = songBundle.pool.slice();

        shuffle(pool, random);

        const hand = [];
        const activeLines = [];
        const completedLines = [];
        const completedIds = new Set();

        let previousPlayed = 0;
        let totalDrawn = 0;
        let totalPlayed = 0;

        const rounds = [];

        for (
            let round = 1;
            round <= gameConfig.maxRounds;
            round += 1
        ) {
            /*
             * If the pool is empty, all remaining progress depends on the hand.
             * There is no new draw, but there is also no new round needed.
             */
            if (pool.length === 0) {
                break;
            }

            const requestedDraw = calculateDraw(
                round,
                previousPlayed
            );

            const handBeforeDraw = hand.length;

            const drawn = drawTiles(
                pool,
                hand,
                requestedDraw,
                random,
                gameConfig
            );

            drawn.forEach(function (tile) {
                hand.push(tile);
            });

            totalDrawn += drawn.length;

            const playedThisRound = aggressivelyPlayHand(
                hand,
                activeLines,
                allLines,
                completedIds,
                completedLines,
                random,
                gameConfig
            );

            totalPlayed += playedThisRound;
            previousPlayed = playedThisRound;

            const completedBeforeRound = rounds.reduce(
                function (sum, item) {
                    return sum + item.completed;
                },
                0
            );

            rounds.push({
                round: round,
                requestedDraw: requestedDraw,
                actualDraw: drawn.length,
                handBeforeDraw: handBeforeDraw,
                handAfterPlay: hand.length,
                played: playedThisRound,
                completed: completedLines.length - completedBeforeRound,
                activeLines: activeLines.length,
                poolRemaining: pool.length
            });

            if (pool.length === 0) {
                break;
            }
        }

        const totalWordsInSource = allLines.reduce(
            function (sum, line) {
                return sum + line.wordCount;
            },
            0
        );

        const completedWords = completedLines.reduce(
            function (sum, line) {
                return sum + line.wordCount;
            },
            0
        );

        /*
         * A win means all source lyric words were successfully placed into
         * completed lyric lines. This remains independent of scoring.
         */
        const won = completedWords === totalWordsInSource;

        return {
            simulatorVersion: CONFIG.version,
            won: won,
            mode: mode,
            modeLabel: gameConfig.label,
            maxRows: gameConfig.maxRows,
            maxHand: gameConfig.maxHand,
            maxRounds: gameConfig.maxRounds,
            roundsPlayed: rounds.length,
            totalSourceWords: totalWordsInSource,
            totalDrawn: totalDrawn,
            totalPlayed: totalPlayed,
            held: hand.length,
            completedLines: completedLines.length,
            activeLines: activeLines.length,
            poolRemaining: pool.length,
            rounds: rounds
        };
    }

    function prepareSongBundle(lyricsData, wordCountData) {
        const pool = buildPhysicalPool(wordCountData);
        const lines = buildLineOccurrences(lyricsData);

        const sourceWordTotal = lines.reduce(
            function (sum, line) {
                return sum + line.wordCount;
            },
            0
        );

        const poolWordTotal = pool.length;

        return {
            title: lyricsData.title,
            artist: lyricsData.artist,
            album: lyricsData.album,
            year: lyricsData.year,
            genre: lyricsData.genre,
            pool: pool,
            lines: lines,
            sourceWordTotal: sourceWordTotal,
            poolWordTotal: poolWordTotal,
            poolMatchesLyrics: sourceWordTotal === poolWordTotal
        };
    }

    /*
     * Combine selected songs into one physical pool and one collection of
     * distinct lyric-line occurrences.
     */
    function combineSongBundles(bundles) {
        const combinedPool = [];
        const combinedLines = [];

        bundles.forEach(function (bundle, bundleIndex) {
            bundle.pool.forEach(function (tile) {
                combinedPool.push({
                    word: tile.word,
                    key: tile.key,
                    songIndex: bundleIndex
                });
            });

            bundle.lines.forEach(function (line) {
                const cloned = cloneLine(line);
                cloned.songIndex = bundleIndex;
                cloned.id = `${bundleIndex}-${line.id}`;
                combinedLines.push(cloned);
            });
        });

        const sourceWordTotal = combinedLines.reduce(
            function (sum, line) {
                return sum + line.wordCount;
            },
            0
        );

        return {
            title: bundles.map(function (bundle) {
                return bundle.title;
            }).join(" + "),
            artist: bundles.map(function (bundle) {
                return bundle.artist;
            }).filter(function (value, index, array) {
                return array.indexOf(value) === index;
            }).join(", "),
            pool: combinedPool,
            lines: combinedLines,
            sourceWordTotal: sourceWordTotal,
            poolWordTotal: combinedPool.length,
            poolMatchesLyrics: sourceWordTotal === combinedPool.length
        };
    }

    /*
     * Every individual trial is retained. This is necessary for later
     * histograms and distribution analysis.
     */
    function runTrials(songBundle, trialCount, randomFactory, options) {
        const trials = [];
        const mode = options?.mode || CONFIG.defaultMode;

        for (let i = 0; i < trialCount; i += 1) {
            trials.push(
                simulateGame(songBundle, {
                    random: randomFactory(),
                    mode: mode
                })
            );
        }

        function average(field) {
            return (
                trials.reduce(function (sum, result) {
                    return sum + result[field];
                }, 0) / Math.max(1, trials.length)
            );
        }

        const wins = trials.filter(function (result) {
            return result.won;
        }).length;

        const allWordsUsedTrials = trials.filter(function (trial) {
            return (
                Number(trial.totalPlayed) ===
                Number(trial.totalSourceWords)
            );
        }).length;

        return {
            trialCount: trials.length,
            wins: wins,
            winRate: wins / Math.max(1, trials.length),
            averageRounds: average("roundsPlayed"),
            averageDrawn: average("totalDrawn"),
            averagePlayed: average("totalPlayed"),
            averageHeld: average("held"),
            averageCompletedLines: average("completedLines"),
            averagePoolRemaining: average("poolRemaining"),
            averageActiveLines: average("activeLines"),
            allWordsUsedTrials: allWordsUsedTrials,
            allWordsUsedRate:
                allWordsUsedTrials / Math.max(1, trials.length),
            everAllWordsUsed: allWordsUsedTrials > 0,
            trials: trials
        };
    }

    global.LyricSolitaireSimulator = {
        CONFIG: CONFIG,
        MODE_CONFIG: MODE_CONFIG,
        getModeConfig: getModeConfig,
        normalizeWord: normalizeWord,
        tokenizeLine: tokenizeLine,
        buildPhysicalPool: buildPhysicalPool,
        buildLineOccurrences: buildLineOccurrences,
        prepareSongBundle: prepareSongBundle,
        combineSongBundles: combineSongBundles,
        calculateDraw: calculateDraw,
        simulateGame: simulateGame,
        runTrials: runTrials
    };
})(window);
