/*
 * Lyric Solitaire — Hank Solver API
 *
 * RESPONSIBILITY:
 * Provide the public Hank entry point, reconstruct the exact seeded deal,
 * and package the exhaustive search result for the Hank UI and exports.
 */
(function (global) {
    "use strict";

    function replaySolution(gameDefinition, seed, solution) {
        let state = global.LyricSolitaireHankRules.createInitialState(gameDefinition, seed);
        for (const step of solution || []) {
            if (step.kind === "ROUND_END") {
                if (global.LyricSolitaireHankRules.legalMoves(state, gameDefinition).length !== 0) {
                    return { valid: false, error: `Round ${step.round} ended while a legal move remained.` };
                }
                if (state.round !== step.round || state.round >= gameDefinition.mode.maxRounds) {
                    return { valid: false, error: `Invalid round transition at round ${step.round}.` };
                }
                state = global.LyricSolitaireHankRules.drawRound({
                    ...state,
                    phase: "DRAW",
                    previousRoundPlayed: state.currentRoundPlayed,
                    currentRoundPlayed: 0,
                    round: state.round + 1
                }, gameDefinition);
                continue;
            }
            if (step.kind !== "MOVE") return { valid: false, error: "Unknown solution step." };
            if (state.round !== step.round) return { valid: false, error: `Move round mismatch at ${step.round}.` };
            const legal = global.LyricSolitaireHankRules.legalMoves(state, gameDefinition);
            if (!legal.some(move => move.type === step.type && move.lineId === step.lineId && move.word === step.word)) {
                return { valid: false, error: `Illegal solution move: ${step.type} ${step.lineId} ${step.word}.` };
            }
            state = global.LyricSolitaireHankRules.applyMove(state, step, gameDefinition);
        }
        return { valid: global.LyricSolitaireHankRules.isWin(state, gameDefinition), state };
    }

    function solveWithHank(options) {
        const gameDefinition = options.gameDefinition;
        const seed = Number(options.seed);
        const initialState = global.LyricSolitaireHankRules.createInitialState(gameDefinition, seed);
        const searchResult = global.LyricSolitaireHankSearch.search(
            gameDefinition,
            initialState,
            options.limits || {}
        );
        const replay = searchResult.result === "SEARCH_WIN"
            ? replaySolution(gameDefinition, seed, searchResult.solution)
            : null;
        if (replay && !replay.valid) {
            throw new Error(`Hank solution replay failed: ${replay.error || "solution did not reach a win"}`);
        }
        return {
            solver: "Hank — Exhaustive Solver",
            solverVersion: global.LyricSolitaireProject?.hankVersion || "0.1.9",
            rulesVersion: gameDefinition.rulesVersion,
            game: {
                mode: gameDefinition.mode,
                songs: gameDefinition.songs,
                totalSourceWords: gameDefinition.totalSourceWords,
                sourceLineCount: gameDefinition.sourceLines.length
            },
            seed,
            result: searchResult.result,
            proofStatus: searchResult.proofStatus,
            searchComplete: searchResult.searchComplete,
            initialState: global.LyricSolitaireHankState.canonicalizeState(initialState),
            stats: searchResult.stats,
            solution: searchResult.solution,
            solutionValidated: replay ? replay.valid : false
        };
    }

    global.LyricSolitaireHankSolver = { solveWithHank, replaySolution };
})(window);
