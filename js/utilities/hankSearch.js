/*
 * Lyric Solitaire — Hank Search Utility
 *
 * RESPONSIBILITY:
 * Exhaustively search the legal Hank state graph with conservative safe
 * pruning and memoization. No heuristic ranking is used to declare a game
 * solvable or unsolvable.
 */
(function (global) {
    "use strict";

    const RULES = global.LyricSolitaireHankRules;
    const STATE = global.LyricSolitaireHankState;

    const SEARCH_WIN = "SEARCH_WIN";
    const SEARCH_LOSS = "SEARCH_LOSS";
    const SEARCH_INCOMPLETE = "SEARCH_INCOMPLETE";

    function search(gameDefinition, initialState, limits) {
        const started = performance.now();
        const maxStates = Math.max(1, Number(limits?.maxStates) || 1000000);
        const maxMilliseconds = Math.max(1, Number(limits?.maxMilliseconds) || 30000);
        const memo = new Map();
        const stats = { statesVisited: 0, memoHits: 0, prunedStates: 0, maxDepth: 0, elapsedMilliseconds: 0 };
        let incomplete = false;

        function limitReached() {
            return stats.statesVisited >= maxStates || performance.now() - started >= maxMilliseconds;
        }

        function visit(state, depth) {
            stats.maxDepth = Math.max(stats.maxDepth, depth);
            if (limitReached()) { incomplete = true; return { result: SEARCH_INCOMPLETE, solution: [] }; }
            stats.statesVisited += 1;

            if (RULES.isWin(state, gameDefinition)) return { result: SEARCH_WIN, solution: [] };
            if (RULES.isTerminalLoss(state, gameDefinition)) {
                stats.prunedStates += 1;
                return { result: SEARCH_LOSS, solution: [] };
            }

            const key = STATE.makeStateKey(state);
            const cached = memo.get(key);
            if (cached) { stats.memoHits += 1; return cached; }

            const moves = RULES.legalMoves(state, gameDefinition);
            if (!moves.length) {
                if (state.pool.length === 0 || state.round >= gameDefinition.mode.maxRounds) {
                    const loss = { result: SEARCH_LOSS, solution: [] };
                    memo.set(key, loss);
                    return loss;
                }
                const nextRound = RULES.drawRound({
                    ...state,
                    phase: "DRAW",
                    previousRoundPlayed: state.currentRoundPlayed,
                    currentRoundPlayed: 0,
                    round: state.round + 1
                }, gameDefinition);
                const child = visit(nextRound, depth + 1);
                if (child.result === SEARCH_WIN) {
                    const win = {
                        result: SEARCH_WIN,
                        solution: [{ kind: "ROUND_END", round: state.round }, ...child.solution]
                    };
                    memo.set(key, win);
                    return win;
                }
                memo.set(key, child);
                return child;
            }

            for (const move of moves) {
                if (limitReached()) { incomplete = true; return { result: SEARCH_INCOMPLETE, solution: [] }; }
                const childState = RULES.applyMove(state, move, gameDefinition);
                const child = visit(childState, depth + 1);
                if (child.result === SEARCH_WIN) {
                    const win = {
                        result: SEARCH_WIN,
                        solution: [{ kind: "MOVE", round: state.round, ...move }, ...child.solution]
                    };
                    memo.set(key, win);
                    return win;
                }
                if (child.result === SEARCH_INCOMPLETE) {
                    incomplete = true;
                    return child;
                }
            }

            const loss = { result: SEARCH_LOSS, solution: [] };
            memo.set(key, loss);
            return loss;
        }

        const result = visit(initialState, 0);
        stats.elapsedMilliseconds = Math.round(performance.now() - started);
        return {
            result: result.result,
            proofStatus: result.result === SEARCH_WIN ? "PROVEN_SOLVABLE" :
                result.result === SEARCH_LOSS ? "PROVEN_UNSOLVABLE" : "SEARCH_INCOMPLETE",
            searchComplete: !incomplete,
            stats,
            solution: result.solution
        };
    }

    global.LyricSolitaireHankSearch = { search, SEARCH_WIN, SEARCH_LOSS, SEARCH_INCOMPLETE };
})(window);
