/*
 * Lyric Solitaire — Hank Rules Utility
 *
 * RESPONSIBILITY:
 * Recreate the production deal and define every legal player move for Hank.
 * This module contains game rules only; search strategy belongs in hankSearch.js.
 */
(function (global) {
    "use strict";

    const STATE = global.LyricSolitaireHankState;

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
        const counts = {};
        tokenizeLine(line).forEach(word => {
            const key = normalizeWord(word);
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }

    /* Exact seeded RNG used by simulator.html, represented by explicit state. */
    function createRng(seed) {
        let t = (Number(seed) >>> 0) || 1;
        return {
            get state() { return t >>> 0; },
            next() {
                t = (t + 0x6D2B79F5) >>> 0;
                let x = t;
                x = Math.imul(x ^ (x >>> 15), x | 1);
                x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
                return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
            }
        };
    }

    function nextRandom(state) {
        let t = Number(state) >>> 0;
        t = (t + 0x6D2B79F5) >>> 0;
        let x = t;
        x = Math.imul(x ^ (x >>> 15), x | 1);
        x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
        return { state: t, value: ((x ^ (x >>> 14)) >>> 0) / 4294967296 };
    }

    function shuffle(pool, rng) {
        const result = pool.slice();
        for (let i = result.length - 1; i > 0; i -= 1) {
            const draw = rng.next();
            const j = Math.floor(draw * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function buildPhysicalPool(wordCountData) {
        const pool = [];
        (wordCountData.words || []).forEach(item => {
            const count = Math.max(0, Number(item.count) || 0);
            for (let i = 0; i < count; i += 1) pool.push(normalizeWord(item.word));
        });
        return pool;
    }

    function buildSourceLines(lyricsData) {
        const lines = [];
        let occurrenceId = 0;
        (lyricsData.sections || []).forEach((section, sectionIndex) => {
            (section.lyrics || []).forEach((text, lineIndex) => {
                const required = wordFrequency(text);
                lines.push({
                    lineId: String(occurrenceId++),
                    sectionIndex,
                    section: section.type || "Verse",
                    lineIndex,
                    text,
                    required,
                    wordCount: Object.values(required).reduce((sum, n) => sum + n, 0)
                });
            });
        });
        return lines;
    }

    function makeGameDefinition(bundles, modeConfig, rulesVersion) {
        const songs = bundles.map(bundle => ({
            id: bundle.id,
            title: bundle.title,
            artist: bundle.artist,
            album: bundle.album,
            year: bundle.year,
            genre: bundle.genre
        }));
        const sourceLines = [];
        const sourceWords = [];
        bundles.forEach((bundle, songIndex) => {
            bundle.lines.forEach(line => sourceLines.push({
                lineId: `${songIndex}-${line.lineId}`,
                songIndex,
                sectionIndex: line.sectionIndex,
                section: line.section,
                lineIndex: line.lineIndex,
                text: line.text,
                words: line.required
            }));
            bundle.pool.forEach(word => sourceWords.push(word));
        });
        return {
            rulesVersion: rulesVersion || "1.3.3",
            mode: {
                id: modeConfig.id,
                maxRows: modeConfig.maxRows,
                maxHand: modeConfig.maxHand,
                maxRounds: modeConfig.maxRounds,
                initialDraw: 12
            },
            songs,
            sourceLines,
            sourceWords,
            totalSourceWords: sourceWords.length
        };
    }

    function cloneLine(line) {
        return { lineId: line.lineId, remaining: { ...(line.remaining || line.words || {}) } };
    }

    function createInitialState(gameDefinition, seed) {
        let rng = createRng(seed);
        const shuffled = shuffle(gameDefinition.sourceWords, rng);
        const hand = {};
        const pool = shuffled.slice();
        const amount = Math.min(gameDefinition.mode.initialDraw, pool.length, gameDefinition.mode.maxHand);
        for (let i = 0; i < amount; i += 1) {
            const random = rng.next();
            const index = Math.floor(random * pool.length);
            const word = pool.splice(index, 1)[0];
            hand[word] = (hand[word] || 0) + 1;
        }
        return {
            phase: "PLAY",
            round: 1,
            previousRoundPlayed: 0,
            currentRoundPlayed: 0,
            hand,
            activeLines: [],
            unopenedLineIds: gameDefinition.sourceLines.map(line => line.lineId),
            pool,
            rngState: rng.state
        };
    }

    function hasWord(hand, word) { return (hand[word] || 0) > 0; }

    function legalMoves(state, gameDefinition) {
        const moves = [];
        const maxRows = gameDefinition.mode.maxRows;
        const handWords = Object.keys(state.hand).filter(word => state.hand[word] > 0).sort();

        // Every matching word on an existing line is a legal choice.
        state.activeLines.forEach(line => {
            handWords.forEach(word => {
                if ((line.remaining[word] || 0) > 0) {
                    moves.push({ type: "PLAY_ACTIVE", lineId: line.lineId, word });
                }
            });
        });

        // If a row is available, a word can open any still-unopened source line
        // that requires that word.
        if (state.activeLines.length < maxRows) {
            state.unopenedLineIds.forEach(lineId => {
                const source = gameDefinition.sourceLines.find(line => line.lineId === lineId);
                if (!source) return;
                handWords.forEach(word => {
                    if ((source.words[word] || 0) > 0) {
                        moves.push({ type: "OPEN_LINE", lineId, word });
                    }
                });
            });
        }
        return moves;
    }

    function decrementHand(hand, word) {
        const next = { ...hand };
        if (next[word] === 1) delete next[word];
        else next[word] -= 1;
        return next;
    }

    function applyMove(state, move, gameDefinition) {
        const next = STATE.cloneState(state);
        next.hand = decrementHand(state.hand, move.word);
        next.currentRoundPlayed = Number(state.currentRoundPlayed || 0) + 1;
        let target;
        if (move.type === "OPEN_LINE") {
            const source = gameDefinition.sourceLines.find(line => line.lineId === move.lineId);
            if (!source) throw new Error(`Unknown line ${move.lineId}`);
            target = cloneLine(source);
            next.activeLines.push(target);
            next.unopenedLineIds = next.unopenedLineIds.filter(id => id !== move.lineId);
        } else {
            target = next.activeLines.find(line => line.lineId === move.lineId);
            if (!target) throw new Error(`Unknown active line ${move.lineId}`);
        }
        if ((target.remaining[move.word] || 0) <= 0) throw new Error(`Illegal word ${move.word}`);
        if (target.remaining[move.word] === 1) delete target.remaining[move.word];
        else target.remaining[move.word] -= 1;

        // Completed lines immediately free their row, matching the production simulator.
        next.activeLines = next.activeLines.filter(line => Object.keys(line.remaining).length > 0);
        return next;
    }

    function drawRound(state, gameDefinition) {
        const next = STATE.cloneState(state);
        const requested = next.round === 1
            ? gameDefinition.mode.initialDraw
            : Math.max(0, (13 - next.round) + next.previousRoundPlayed);
        const capacity = Math.max(0, gameDefinition.mode.maxHand - Object.values(next.hand).reduce((s, n) => s + n, 0));
        const amount = Math.min(requested, capacity, next.pool.length);
        for (let i = 0; i < amount; i += 1) {
            const random = nextRandom(next.rngState);
            next.rngState = random.state;
            const index = Math.floor(random.value * next.pool.length);
            const word = next.pool.splice(index, 1)[0];
            next.hand[word] = (next.hand[word] || 0) + 1;
        }
        return next;
    }

    function countHand(state) { return Object.values(state.hand).reduce((s, n) => s + n, 0); }

    function isWin(state, gameDefinition) {
        // The production simulator defines success by completing every source
        // lyric line. Physical pool/hand state is not part of the win predicate.
        return state.activeLines.length === 0 && state.unopenedLineIds.length === 0;
    }

    function safeLowerBoundLoss(state, gameDefinition) {
        const remainingRequired = state.unopenedLineIds.length === 0
            ? 0
            : gameDefinition.sourceLines
                .filter(line => state.unopenedLineIds.includes(line.lineId))
                .reduce((sum, line) => sum + Object.values(line.words).reduce((s, n) => s + n, 0), 0);
        const activeRequired = state.activeLines.reduce((sum, line) =>
            sum + Object.values(line.remaining).reduce((s, n) => s + n, 0), 0);
        const available = countHand(state) + state.pool.length;
        return (remainingRequired + activeRequired) > available;
    }

    function isTerminalLoss(state, gameDefinition) {
        if (isWin(state, gameDefinition)) return false;
        if (state.round > gameDefinition.mode.maxRounds) return true;
        return safeLowerBoundLoss(state, gameDefinition);
    }

    global.LyricSolitaireHankRules = {
        normalizeWord, tokenizeLine, buildPhysicalPool, buildSourceLines,
        makeGameDefinition, createInitialState, legalMoves, applyMove,
        drawRound, isWin, isTerminalLoss, countHand
    };
})(window);
