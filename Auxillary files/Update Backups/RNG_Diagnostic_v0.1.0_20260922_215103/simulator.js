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
 *   Garth — Heuristic Reference Player
 *     A diagnostic player with broad knowledge of the lyric state. Garth
 *     evaluates legal active-line moves and a bounded set of promising
 *     new-line moves using completion, progress, and short look-ahead. Garth
 *     is intentionally a
 *     heuristic, not a mathematically guaranteed solver.
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
        },
        heuristic_reference: {
            name: "Garth — Heuristic Reference Player",
            description: "A diagnostic reference player that uses broader information about the current lyric state and hand than the human-style personas. Garth searches legal moves for promising immediate completions and near-term cascades.",
            strategy: "Evaluate every legal hand tile against every usable active or newly opened lyric line; favor completing lines, then maximizing near-term hand playability and progress. Garth is a heuristic reference, not a mathematically guaranteed solver."
        }
    };

    const CONFIG = {
        version: "0.1.8",
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
        const finalRound = round === gameConfig.maxRounds;
        const secondToLastRound = round === gameConfig.maxRounds - 1;

        if (activeCount >= gameConfig.maxRows) return false;

        // Endgame rule: in the final round all personas use every legal opening
        // opportunity. Personality differences are intentionally suspended.
        if (finalRound) return true;

        if (persona === "walks_the_line") {
            // Johnny remains conservative, but recognizes that the second-to-last
            // round is the last meaningful setup opportunity before the final push.
            return secondToLastRound ? openedThisRound < 2 : openedThisRound < 1;
        }

        if (persona === "gambler") {
            if (round === 1) return activeCount < Math.min(gameConfig.maxRows, 10);
            return true;
        }

        // Dolly: early aggression, followed by a dynamic safety margin. In the
        // second-to-last round she relaxes that safety margin by one row.
        let targetRows;
        if (round === 1) targetRows = gameConfig.maxRows;
        else if (round <= 3) targetRows = Math.max(1, gameConfig.maxRows - 1);
        else targetRows = Math.max(1, gameConfig.maxRows - 2);

        if (secondToLastRound) targetRows = Math.min(gameConfig.maxRows, targetRows + 1);

        const handPressure = handLength / gameConfig.maxHand;
        if (handPressure >= 0.85 && !secondToLastRound) targetRows = Math.max(1, targetRows - 2);
        else if (handPressure >= 0.70 && !secondToLastRound) targetRows = Math.max(1, targetRows - 1);

        return activeCount < targetRows;
    }

    function countHandWords(hand) {
        const counts = new Map();
        hand.forEach(tile => counts.set(tile.key, (counts.get(tile.key) || 0) + 1));
        return counts;
    }

    /*
     * Count physical tiles by available line capacity, not merely by word-key
     * compatibility. This prevents duplicate copies of a word from inflating
     * the diagnostic when only one matching slot remains on the board.
     */
    function countPlayableTiles(hand, activeLines, allLines, completedIds, allowNewLine) {
        const handCounts = countHandWords(hand);
        const existingDemand = new Map();

        activeLines.forEach(line => {
            line.remaining.forEach((count, key) => {
                existingDemand.set(key, (existingDemand.get(key) || 0) + count);
            });
        });

        let existingLine = 0;
        handCounts.forEach((count, key) => {
            existingLine += Math.min(count, existingDemand.get(key) || 0);
        });

        let newLine = 0;
        if (allowNewLine) {
            const activeIds = new Set(activeLines.map(line => line.id));
            const candidateDemand = new Map();
            allLines.forEach(line => {
                if (activeIds.has(line.id) || completedIds.has(line.id)) return;
                line.remaining.forEach((count, key) => {
                    candidateDemand.set(key, (candidateDemand.get(key) || 0) + count);
                });
            });

            handCounts.forEach((count, key) => {
                // Only count copies that are not already satisfiable by an active
                // line. This is a physical-tile opportunity count, not a promise
                // that all candidate lines will actually be opened.
                const remainingCopies = Math.max(0, count - Math.min(count, existingDemand.get(key) || 0));
                newLine += Math.min(remainingCopies, candidateDemand.get(key) || 0);
            });
        }

        return { existingLine, newLine, total: existingLine + newLine };
    }

    /*
     * Choose a new line using limited lyric foresight. A human who knows the
     * song can recognize that one opening word may unlock several other words
     * already in hand. The base strategy still favors short lines, while a
     * modest look-ahead score rewards candidate lines that match additional
     * hand tiles after the opening word.
     */
    function chooseNewLineWithForesight(allLines, activeLines, completedIds, wordKey, hand, random, foresightWeight) {
        const activeIds = new Set(activeLines.map(line => line.id));
        const candidates = allLines.filter(line =>
            !activeIds.has(line.id) && !completedIds.has(line.id) && lineCanUseWord(line, wordKey)
        );
        if (!candidates.length) return null;

        const handCounts = countHandWords(hand);
        let bestScore = -Infinity;
        let best = [];

        candidates.forEach(line => {
            let unlock = 0;
            line.remaining.forEach((count, key) => {
                const copies = handCounts.get(key) || 0;
                unlock += Math.min(count, copies);
            });
            // The opening word itself is already accounted for by the candidate
            // test. Reward additional words that become usable after opening it.
            const additionalUnlock = Math.max(0, unlock - 1);
            const shortLineBonus = 1 / Math.max(1, line.wordCount);
            const score = additionalUnlock * foresightWeight + shortLineBonus;
            if (score > bestScore) { bestScore = score; best = [line]; }
            else if (score === bestScore) best.push(line);
        });

        return cloneLine(best[Math.floor(random() * best.length)]);
    }

    /*
     * Garth move scoring: evaluate a legal move by the state it creates.
     * This is deliberately local/heuristic. It does not search the complete
     * future game tree, so it must never be described as a guaranteed solver.
     */
    function countLineHandCoverage(line, hand, ignoredIndex) {
        const handCounts = new Map();
        hand.forEach(function (tile, index) {
            if (index === ignoredIndex) return;
            handCounts.set(tile.key, (handCounts.get(tile.key) || 0) + 1);
        });
        let coverage = 0;
        line.remaining.forEach(function (count, key) {
            coverage += Math.min(count, handCounts.get(key) || 0);
        });
        return coverage;
    }

    function countPotentialLineCompletions(line, hand, ignoredIndex) {
        const remaining = new Map(line.remaining);
        if (ignoredIndex >= 0 && hand[ignoredIndex]) {
            const key = hand[ignoredIndex].key;
            const count = remaining.get(key) || 0;
            if (count <= 1) remaining.delete(key);
            else remaining.set(key, count - 1);
        }
        let missing = 0;
        remaining.forEach(count => { missing += count; });
        return missing;
    }

    function chooseGarthMove(hand, activeLines, allLines, completedIds, gameConfig, random) {
        const moves = [];
        const activeIds = new Set(activeLines.map(line => line.id));
        const canOpen = activeLines.length < gameConfig.maxRows;

        hand.forEach(function (tile, handIndex) {
            activeLines.forEach(function (line) {
                if (!lineCanUseWord(line, tile.key)) return;
                const missingAfter = countPotentialLineCompletions(line, hand, handIndex);
                const coverage = countLineHandCoverage(line, hand, handIndex);
                const completion = missingAfter === 0 ? 1 : 0;
                const progress = line.wordCount - missingAfter;
                const score =
                    completion * 100000 +
                    coverage * 1000 +
                    progress * 25 -
                    missingAfter * 3;
                moves.push({ score, handIndex, target: line, opens: false });
            });

            if (canOpen) {
                const candidates = allLines.filter(function (line) {
                    return !activeIds.has(line.id) && !completedIds.has(line.id) && lineCanUseWord(line, tile.key);
                });

                // Limit the expensive look-ahead to the most promising new-line
                // candidates. This keeps Garth practical for large trial counts
                // while retaining a broad heuristic search rather than reducing
                // the persona to the human-style shortest-line rule.
                candidates.sort(function (a, b) {
                    const aCoverage = countLineHandCoverage(a, hand, handIndex);
                    const bCoverage = countLineHandCoverage(b, hand, handIndex);
                    return bCoverage - aCoverage || a.wordCount - b.wordCount;
                });
                candidates.slice(0, 12).forEach(function (line) {
                    const candidate = cloneLine(line);
                    const missingAfter = countPotentialLineCompletions(candidate, hand, handIndex);
                    const coverage = countLineHandCoverage(candidate, hand, handIndex);
                    const completion = missingAfter === 0 ? 1 : 0;
                    const progress = candidate.wordCount - missingAfter;
                    const score =
                        completion * 100000 +
                        coverage * 1000 +
                        progress * 25 -
                        missingAfter * 3 -
                        50;
                    moves.push({ score, handIndex, target: candidate, opens: true });
                });
            }
        });

        if (!moves.length) return null;
        let bestScore = Math.max(...moves.map(move => move.score));
        const best = moves.filter(move => move.score === bestScore);
        return best[Math.floor(random() * best.length)];
    }

    function playGarthHand(
        hand, activeLines, allLines, completedIds, completedLines,
        random, gameConfig
    ) {
        let playedThisTurn = 0;
        let playedOnExistingLines = 0;
        let playedByOpeningNewLine = 0;
        let openedThisRound = 0;

        while (true) {
            const move = chooseGarthMove(hand, activeLines, allLines, completedIds, gameConfig, random);
            if (!move) break;

            if (move.opens) {
                activeLines.push(move.target);
                openedThisRound += 1;
            }

            if (!playWordIntoLine(move.target, hand[move.handIndex].key)) break;
            hand.splice(move.handIndex, 1);
            playedThisTurn += 1;
            if (move.opens) playedByOpeningNewLine += 1;
            else playedOnExistingLines += 1;

            const compacted = compactCompletedLines(activeLines, completedIds, completedLines);
            activeLines.length = 0;
            compacted.forEach(line => activeLines.push(line));
        }

        const endingPlayability = countPlayableTiles(
            hand, activeLines, allLines, completedIds,
            activeLines.length < gameConfig.maxRows
        );

        return {
            playedThisTurn,
            playedOnExistingLines,
            playedByOpeningNewLine,
            openedThisRound,
            startingPlayableOnExistingLines: 0,
            startingPlayableByOpeningNewLine: 0,
            playableTilesRemainingUnplayed: endingPlayability.total
        };
    }

    function playHand(
        hand, activeLines, allLines, completedIds, completedLines,
        random, gameConfig, persona, round
    ) {
        let playedThisTurn = 0;
        let playedOnExistingLines = 0;
        let playedByOpeningNewLine = 0;
        let openedThisRound = 0;
        let changed = true;

        if (persona === "heuristic_reference") {
            return playGarthHand(
                hand, activeLines, allLines, completedIds, completedLines,
                random, gameConfig
            );
        }

        // Snapshot the hand at the start of the play phase. These counts are
        // deliberately tile counts, so duplicate words are counted as separate
        // physical tiles. The metrics are used to distinguish actual play from
        // persona restrictions on opening new lines.
        const startingPlayability = countPlayableTiles(
            hand, activeLines, allLines, completedIds,
            activeLines.length < gameConfig.maxRows
        );

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
                    const target = chooseNewLineWithForesight(allLines, activeLines, completedIds, tile.key, hand, random, 1.5);
                    if (target && playWordIntoLine(target, tile.key)) {
                        activeLines.push(target);
                        openedThisRound += 1;
                        hand.splice(openingIndex, 1);
                        playedThisTurn += 1;
                        playedByOpeningNewLine += 1;
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
                let openedNewLineForPlay = false;

                if (!target && mayOpenNewLine(persona, {
                    round, handLength: hand.length, gameConfig, activeLines, openedThisRound
                })) {
                    target = chooseNewLineWithForesight(allLines, activeLines, completedIds, wordKey, hand, random, persona === "gambler" ? 2.0 : persona === "aggressive_row_filler" ? 1.5 : 1.0);
                    if (target) {
                        activeLines.push(target);
                        openedThisRound += 1;
                        openedNewLineForPlay = true;
                    }
                }

                if (!target || !playWordIntoLine(target, wordKey)) continue;

                hand.splice(handIndex, 1);
                handIndex -= 1;
                playedThisTurn += 1;
                if (openedNewLineForPlay) playedByOpeningNewLine += 1;
                else playedOnExistingLines += 1;
                changed = true;

                const compacted = compactCompletedLines(activeLines, completedIds, completedLines);
                activeLines.length = 0;
                compacted.forEach(line => activeLines.push(line));
            }
        }

        const endingPlayability = countPlayableTiles(
            hand, activeLines, allLines, completedIds,
            activeLines.length < gameConfig.maxRows
        );

        return {
            playedThisTurn,
            playedOnExistingLines,
            playedByOpeningNewLine,
            openedThisRound,
            startingPlayableOnExistingLines: startingPlayability.existingLine,
            startingPlayableByOpeningNewLine: startingPlayability.newLine,
            playableTilesRemainingUnplayed: endingPlayability.total
        };
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
                openedNewLines: playResult.openedThisRound,
                playableOnExistingLines: playResult.startingPlayableOnExistingLines,
                playableByOpeningNewLine: playResult.startingPlayableByOpeningNewLine,
                playedOnExistingLines: playResult.playedOnExistingLines,
                playedByOpeningNewLine: playResult.playedByOpeningNewLine,
                playableTilesRemainingUnplayed: playResult.playableTilesRemainingUnplayed
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
