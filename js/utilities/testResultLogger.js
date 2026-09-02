/*
 * Lyric Solitaire — Simulation Test Result Logger
 *
 * Responsibility:
 * Creates, stores, and exports complete simulator experiment records.
 *
 * All individual trials are retained so later tools can create histograms,
 * compare distributions, inspect outliers, and evaluate challenge levels.
 */
window.LyricSolitaireTestLogger = {
    storageKey: "lyricSolitaire.simulator.testResults",

    createRecord({
        version,
        experimentId,
        parameters,
        songs,
        result
    }) {
        const trials = result.trials || [];

        const allWordsUsedTrials = trials.filter(function (trial) {
            return (
                Number(trial.totalPlayed) ===
                Number(trial.totalSourceWords)
            );
        }).length;

        const wins = trials.filter(function (trial) {
            return trial.won === true;
        }).length;

        const wordsPlayed = trials.map(function (trial) {
            return Number(trial.totalPlayed) || 0;
        });

        const completedLines = trials.map(function (trial) {
            return Number(trial.completedLines) || 0;
        });

        return {
            schemaVersion: "1.1",
            experimentId: experimentId,
            timestamp: new Date().toISOString(),
            simulatorVersion: version,
            parameters: { ...parameters },
            songs: songs,
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
                wins: wins,
                losses: trials.length - wins,
                winRate: wins / Math.max(1, trials.length),
                averageRounds: result.averageRounds,
                averageDrawn: result.averageDrawn,
                averagePlayed: result.averagePlayed,
                averageHeld: result.averageHeld,
                averageCompletedLines: result.averageCompletedLines,
                averagePoolRemaining: result.averagePoolRemaining,
                averageActiveLines: result.averageActiveLines,

                // These are useful even if a future definition of "win"
                // changes.
                allWordsUsedTrials: allWordsUsedTrials,
                allWordsUsedRate:
                    allWordsUsedTrials / Math.max(1, trials.length),
                everAllWordsUsed: allWordsUsedTrials > 0,

                bestWordsPlayed: wordsPlayed.length
                    ? Math.max(...wordsPlayed)
                    : 0,
                worstWordsPlayed: wordsPlayed.length
                    ? Math.min(...wordsPlayed)
                    : 0,
                bestCompletedLines: completedLines.length
                    ? Math.max(...completedLines)
                    : 0,
                worstCompletedLines: completedLines.length
                    ? Math.min(...completedLines)
                    : 0
            },

            // Complete individual trial collection.
            trials: trials,

            // Convenient trace for quick inspection.
            sampleTrial: trials[0] || null
        };
    },

    loadHistory() {
        try {
            return JSON.parse(
                localStorage.getItem(this.storageKey) || "[]"
            );
        } catch (error) {
            console.warn("Could not read simulator test history:", error);
            return [];
        }
    },

    saveRecord(record) {
        const history = this.loadHistory();
        history.push(record);

        // Browser history is a convenience. Exported JSON is the permanent
        // experiment record intended for /test_results/.
        localStorage.setItem(
            this.storageKey,
            JSON.stringify(history.slice(-100))
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
    },

    exportRecord(record) {
        this.downloadJson(
            record,
            `${record.experimentId}.json`
        );
    },

    exportHistory() {
        const history = this.loadHistory();

        this.downloadJson(
            {
                schemaVersion: "1.1",
                exportedAt: new Date().toISOString(),
                resultCount: history.length,
                results: history
            },
            `lyric-solitaire-simulator-history-${new Date().toISOString().slice(0, 10)}.json`
        );
    }
};
