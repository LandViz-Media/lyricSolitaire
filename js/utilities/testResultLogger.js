/*
 * Lyric Solitaire — Simulation Session Logger
 *
 * Responsibility:
 * Keeps complete experiments in browser memory for the current session and
 * exports them as one JSON file. The browser's localStorage is intentionally
 * not used for full trial collections because 1,000+ trial runs can exceed
 * browser storage quotas.
 *
 * The repository's /test_results directory is the permanent archive.
 */
window.LyricSolitaireTestLogger = {
    session: [],

    createExperimentRecord({
        version,
        experimentId,
        sessionId,
        parameters,
        persona,
        songs,
        result
    }) {
        const trials = result.trials || [];

        const allWordsUsedTrials = trials.filter(function (trial) {
            return Number(trial.totalPlayed) === Number(trial.totalSourceWords);
        }).length;

        const wins = trials.filter(function (trial) {
            return trial.won === true;
        }).length;

        return {
            schemaVersion: "1.3",
            experimentId,
            sessionId,
            timestamp: new Date().toISOString(),
            simulatorVersion: version,

            persona: {
                id: persona.id,
                name: persona.name,
                description: persona.description
            },

            parameters: { ...parameters },
            songs,

            songTotals: {
                totalWords: songs.reduce(function (sum, song) {
                    return sum + (Number(song.total) || 0);
                }, 0),
                uniqueWords: songs.length === 1
                    ? Number(songs[0].unique) || 0
                    : null
            },

            results: {
                trialCount: trials.length,
                wins,
                losses: trials.length - wins,
                winRate: wins / Math.max(1, trials.length),
                averageRounds: result.averageRounds,
                averageDrawn: result.averageDrawn,
                averagePlayed: result.averagePlayed,
                averageHeld: result.averageHeld,
                averageCompletedLines: result.averageCompletedLines,
                averagePoolRemaining: result.averagePoolRemaining,
                averageActiveLines: result.averageActiveLines,
                allWordsUsedTrials,
                allWordsUsedRate:
                    allWordsUsedTrials / Math.max(1, trials.length),
                everAllWordsUsed: allWordsUsedTrials > 0,
                bestWordsPlayed: trials.length
                    ? Math.max(...trials.map(t => Number(t.totalPlayed) || 0))
                    : 0,
                worstWordsPlayed: trials.length
                    ? Math.min(...trials.map(t => Number(t.totalPlayed) || 0))
                    : 0,
                bestCompletedLines: trials.length
                    ? Math.max(...trials.map(t => Number(t.completedLines) || 0))
                    : 0,
                worstCompletedLines: trials.length
                    ? Math.min(...trials.map(t => Number(t.completedLines) || 0))
                    : 0
            },

            // Every individual trial is permanent once this session is exported.
            trials,
            sampleTrial: trials[0] || null
        };
    },

    addExperiment(record) {
        this.session.push(record);
        return record;
    },

    clearSession() {
        this.session = [];
    },

    exportSession(simulatorVersion) {
        if (!this.session.length) {
            throw new Error("There are no experiments to export yet.");
        }

        const output = {
            schemaVersion: "1.3",
            sessionId: this.session[0].sessionId,
            exportedAt: new Date().toISOString(),
            simulatorVersion,
            experimentCount: this.session.length,
            experiments: this.session
        };

        const date = new Date().toISOString().slice(0, 10);
        this.downloadJson(
            output,
            `lyric-solitaire-simulator-session-${date}.json`
        );
    },

    downloadJson(data, filename) {
        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
};
