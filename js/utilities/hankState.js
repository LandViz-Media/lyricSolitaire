/*
 * Lyric Solitaire — Hank State Utility
 *
 * RESPONSIBILITY:
 * Define the immutable/canonical state representation used by Hank's
 * exhaustive solver. This module deliberately does not depend on the
 * Simulator engine so Hank can independently verify a seeded game.
 */
(function (global) {
    "use strict";

    function cloneMapObject(value) {
        const result = {};
        Object.keys(value || {}).sort().forEach(key => {
            const count = Number(value[key]) || 0;
            if (count > 0) result[key] = count;
        });
        return result;
    }

    function cloneState(state) {
        return JSON.parse(JSON.stringify(state));
    }

    function canonicalizeState(state) {
        const activeLines = (state.activeLines || []).map(line => ({
            lineId: line.lineId,
            remaining: cloneMapObject(line.remaining)
        })).sort((a, b) => String(a.lineId).localeCompare(String(b.lineId)));

        const unopenedLineIds = [...(state.unopenedLineIds || [])]
            .map(String).sort((a, b) => a.localeCompare(b));

        const hand = cloneMapObject(state.hand);
        const pool = (state.pool || []).map(String);

        return {
            phase: state.phase,
            round: Number(state.round),
            previousRoundPlayed: Number(state.previousRoundPlayed),
            currentRoundPlayed: Number(state.currentRoundPlayed),
            hand,
            activeLines,
            unopenedLineIds,
            pool,
            rngState: Number(state.rngState) >>> 0
        };
    }

    function makeStateKey(state) {
        return JSON.stringify(canonicalizeState(state));
    }

    function getStateDiagnostics(state) {
        const handCount = Object.values(state.hand || {}).reduce((sum, n) => sum + Number(n || 0), 0);
        const poolCount = (state.pool || []).length;
        const activeCount = (state.activeLines || []).length;
        return {
            round: state.round,
            handCount,
            poolCount,
            activeLines: activeCount,
            unopenedLines: (state.unopenedLineIds || []).length,
            previousRoundPlayed: state.previousRoundPlayed,
            currentRoundPlayed: state.currentRoundPlayed,
            rngState: Number(state.rngState) >>> 0
        };
    }

    global.LyricSolitaireHankState = {
        cloneState,
        canonicalizeState,
        makeStateKey,
        getStateDiagnostics
    };
})(window);
