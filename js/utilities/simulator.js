/*
 * ============================================================
 * Lyric Solitaire — Game Simulation Utility
 * ============================================================
 *
 * RESPONSIBILITY:
 * Simulate complete Lyric Solitaire games using the actual song
 * Lyrics JSON and Word Count JSON files.
 *
 * This file contains game-state and simulation logic only.
 * It does not create or manipulate the simulator interface.
 *
 * IMPORTANT SIMULATION ASSUMPTIONS:
 * - Easy / Open Mode is the initial simulation target.
 * - Easy / Open Mode has 12 active lyric rows.
 * - The player's inventory is capped at 50 physical word tiles.
 * - Round 1 draws 12 tiles.
 * - For later rounds:
 *       Draw = (13 - Round) + Previous Round Words Played
 * - Actual draw is capped by both the remaining pool and available
 *   inventory space.
 * - A drawn tile is never discarded. It is either played or held.
 * - The simulated player is intentionally aggressive.
 * - A word is played whenever an active line can use it.
 * - If a word cannot be used by an active line, the player may open
 *   a new lyric line containing that word if a row is available.
 * - Completed lines immediately free their row.
 * - Scoring is intentionally NOT modeled yet because the exact
 *   completion-line and section-bonus rules remain under discussion.
 *
 * This simulator is therefore a balance/solvability tool, not yet
 * the final game engine.
 * ============================================================
 */

(function (global) {
    "use strict";

    const CONFIG = {
        version: "0.1.1",
        mode: "Easy / Open",
        maxRows: 12,
        maxHand: 50,
        maxRounds: 12,
        initialDraw: 12
    };

    /*
     * Normalize a word in the same general way as the Lyrics JSON
     * Generator so the simulator can match word tiles to lyric words.
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
     * Tokenize lyric lines while preserving contractions such as:
     * I've, can't, Quittin', lady's, and we'll.
     */
    function tokenizeLine(line) {
        const pattern = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]*)?/gu;
        return String(line || "").match(pattern) || [];
    }

    /*
     * Create a frequency map from a lyric line.
     *
     * Example:
     * "my hand and my side"
     * becomes:
     * my: 2
     * hand: 1
     * and: 1
     * side: 1
     */
    function wordFrequency(line) {
        const counts = new Map();

        tokenizeLine(line).forEach(function (word) {
            const key = normalizeWord(word);
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return counts;
    }

    /*
     * Convert Word Count JSON into an array representing the physical
     * tiles. If "my" has a count of 14, fourteen physical "my" tiles
     * are placed in the pool.
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
     * Create one playable lyric-line occurrence.
     *
     * Each occurrence remains separate even when two lines have
     * identical text. This preserves the game's rule that duplicate
     * lyric lines are distinct candidates.
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
                    wordCount: Array.from(required.values())
                        .reduce(function (sum, count) {
                            return sum + count;
                        }, 0),
                    placed: 0
                });

                occurrenceId += 1;
            });
        });

        return lines;
    }

    /*
     * Clone a line occurrence for a particular simulated game.
     * The source catalog must remain untouched between trials.
     */
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

    /*
     * Fisher-Yates shuffle.
     *
     * A supplied random function allows repeatable simulations when
     * the simulator UI provides a seed.
     */
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
     * Find the next draw amount according to the current agreed
     * draw rule.
     *
     * Round 1:
     *     12
     *
     * If all 12 are played:
     * Round 2:
     *     12 - 1 + 12 = 23
     *
     * If all 23 are played:
     * Round 3:
     *     11 - 1 + 23 = 33
     */
    function calculateDraw(round, previousPlayed) {
        if (round === 1) {
            return CONFIG.initialDraw;
        }

        return Math.max(0, (13 - round) + previousPlayed);
    }

    /*
     * Test whether an active lyric line can accept a particular word.
     */
    function lineCanUseWord(line, wordKey) {
        return (line.remaining.get(wordKey) || 0) > 0;
    }

    /*
     * Select the best active line for a word.
     *
     * Aggressive strategy:
     * 1. Prefer lines that are closest to completion.
     * 2. Prefer lines where this word fills a larger portion of
     *    the remaining requirement.
     * 3. Break ties randomly.
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

            /*
             * Higher progress is better. A small remaining word count
             * receives a strong preference because completing a line
             * immediately frees a row.
             */
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
     * Select a new lyric occurrence containing a word.
     *
     * This models Easy/Open behavior: when the player has a word that
     * cannot be played into an existing line, an open row can be used
     * to introduce a candidate line containing that word.
     */
    function chooseNewLine(allLines, activeLines, completedIds, wordKey, random) {
        const activeIds = new Set(activeLines.map(function (line) {
            return line.id;
        }));

        const candidates = allLines.filter(function (line) {
            return !activeIds.has(line.id) &&
                !completedIds.has(line.id) &&
                lineCanUseWord(line, wordKey);
        });

        if (candidates.length === 0) {
            return null;
        }

        /*
         * Prefer shorter lines because they are more likely to complete
         * quickly, while retaining randomness among similarly useful
         * candidates.
         */
        candidates.sort(function (a, b) {
            return a.wordCount - b.wordCount;
        });

        const topCount = Math.min(8, candidates.length);
        const topCandidates = candidates.slice(0, topCount);

        return cloneLine(
            topCandidates[Math.floor(random() * topCandidates.length)]
        );
    }

    /*
     * Play one physical word tile into a line.
     */
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

    /*
     * Determine whether all words in a line have been played.
     */
    function isLineComplete(line) {
        return line.remaining.size === 0;
    }

    /*
     * Remove completed lines immediately and record them.
     */
    function compactCompletedLines(activeLines, completedIds, completedLines) {
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

    /*
     * Draw physical tiles from the pool, respecting the 50-tile
     * player inventory limit.
     */
    function drawTiles(pool, hand, requestedAmount, random) {
        const availableCapacity = CONFIG.maxHand - hand.length;
        const actualAmount = Math.min(
            requestedAmount,
            pool.length,
            availableCapacity
        );

        const drawn = [];

        for (let i = 0; i < actualAmount; i += 1) {
            const index = Math.floor(random() * pool.length);
            drawn.push(pool.splice(index, 1)[0]);
        }

        return drawn;
    }

    /*
     * Add a physical tile to the player's hand.
     */
    function addToHand(hand, tile) {
        hand.push(tile);
    }

    /*
     * Attempt to play as many hand tiles as possible.
     *
     * This is deliberately aggressive. It repeatedly scans the hand,
     * playing usable words, opening new lines when possible, and
     * immediately processing completed lines.
     */
    function aggressivelyPlayHand(
        hand,
        activeLines,
        allLines,
        completedIds,
        completedLines,
        random
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

                if (!target && activeLines.length < CONFIG.maxRows) {
                    const newLine = chooseNewLine(
                        allLines,
                        activeLines,
                        completedIds,
                        wordKey,
                        random
                    );

                    if (newLine) {
                        activeLines.push(newLine);
                        target = newLine;
                    }
                }

                if (!target) {
                    continue;
                }

                if (!playWordIntoLine(target, wordKey)) {
                    continue;
                }

                /*
                 * The physical tile has now been played and is removed
                 * from the player's hand.
                 */
                hand.splice(handIndex, 1);
                handIndex -= 1;

                playedThisTurn += 1;
                changed = true;

                /*
                 * A completed line immediately leaves the active board,
                 * freeing a row for another candidate line.
                 */
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
     * Run one complete simulated game.
     */
    function simulateGame(songBundle, options) {
        const random = options.random;

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

        for (let round = 1; round <= CONFIG.maxRounds; round += 1) {
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
                random
            );

            drawn.forEach(function (tile) {
                addToHand(hand, tile);
            });

            totalDrawn += drawn.length;

            const playedThisRound = aggressivelyPlayHand(
                hand,
                activeLines,
                allLines,
                completedIds,
                completedLines,
                random
            );

            totalPlayed += playedThisRound;
            previousPlayed = playedThisRound;

            rounds.push({
                round: round,
                requestedDraw: requestedDraw,
                actualDraw: drawn.length,
                handBeforeDraw: handBeforeDraw,
                handAfterPlay: hand.length,
                played: playedThisRound,
                completed: completedLines.length -
                    rounds.reduce(function (sum, item) {
                        return sum + item.completed;
                    }, 0),
                activeLines: activeLines.length,
                poolRemaining: pool.length
            });

            /*
             * Stop when there are no physical tiles left to draw and
             * there is no possibility of another turn.
             */
            if (pool.length === 0) {
                break;
            }
        }

        const totalWordsInSource = allLines.reduce(function (sum, line) {
            return sum + line.wordCount;
        }, 0);

        const completedWords = completedLines.reduce(
            function (sum, line) {
                return sum + line.wordCount;
            },
            0
        );

        /*
         * A "win" for simulation purposes means every lyric word in the
         * selected songs was successfully placed into completed lines.
         *
         * This is intentionally separate from final scoring.
         */
        const won = completedWords === totalWordsInSource;

        return {
            won: won,
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

    /*
     * Build a reusable song bundle from the two JSON files.
     */
    function prepareSongBundle(lyricsData, wordCountData) {
        const pool = buildPhysicalPool(wordCountData);
        const lines = buildLineOccurrences(lyricsData);

        const sourceWordTotal = lines.reduce(function (sum, line) {
            return sum + line.wordCount;
        }, 0);

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
     * Combine multiple songs into one physical word pool and one set
     * of lyric-line occurrences.
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
            sourceWordTotal: combinedLines.reduce(function (sum, line) {
                return sum + line.wordCount;
            }, 0),
            poolWordTotal: combinedPool.length,
            poolMatchesLyrics: combinedLines.reduce(function (sum, line) {
                return sum + line.wordCount;
            }, 0) === combinedPool.length
        };
    }

    /*
     * Run multiple trials and return aggregate statistics.
     */
    function runTrials(songBundle, trialCount, randomFactory) {
        const trials = [];

        for (let i = 0; i < trialCount; i += 1) {
            const result = simulateGame(
                songBundle,
                {
                    random: randomFactory()
                }
            );

            trials.push(result);
        }

        const average = function (field) {
            return trials.reduce(function (sum, result) {
                return sum + result[field];
            }, 0) / Math.max(1, trials.length);
        };

        return {
            trialCount: trials.length,
            wins: trials.filter(function (result) {
                return result.won;
            }).length,
            winRate: trials.filter(function (result) {
                return result.won;
            }).length / Math.max(1, trials.length),
            averageRounds: average("roundsPlayed"),
            averageDrawn: average("totalDrawn"),
            averagePlayed: average("totalPlayed"),
            averageHeld: average("held"),
            averageCompletedLines: average("completedLines"),
            averagePoolRemaining: average("poolRemaining"),
            averageActiveLines: average("activeLines"),
            trials: trials
        };
    }

    /*
     * Public API.
     *
     * Exposing the simulator through one namespace keeps it usable by:
     * - the browser simulator tool
     * - future automated tests
     * - future game-development utilities
     */
    global.LyricSolitaireSimulator = {
        CONFIG: CONFIG,
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
