/*
 * Lyric Solitaire — Simulation Test Result Logger
 *
 * Responsibility:
 * Converts one simulator run into a standardized JSON test-result record,
 * keeps a small browser-side history, and exports JSON files that can be
 * dropped into /test_results/ for later aggregation and visualization.
 *
 * The logger does not change simulation rules.
 */
window.LyricSolitaireTestLogger = {
  storageKey: "lyricSolitaire.simulator.testResults",

  createRecord({ version, experimentId, parameters, songs, result, sampleTrial }) {
    return {
      schemaVersion: "1.0",
      experimentId,
      timestamp: new Date().toISOString(),
      simulatorVersion: version,
      parameters,
      songs,
      results: {
        trialCount: result.trialCount,
        wins: result.wins,
        losses: result.trialCount - result.wins,
        winRate: result.winRate,
        averageRounds: result.averageRounds,
        averageDrawn: result.averageDrawn,
        averagePlayed: result.averagePlayed,
        averageHeld: result.averageHeld,
        averageCompletedLines: result.averageCompletedLines,
        averagePoolRemaining: result.averagePoolRemaining,
        averageActiveLines: result.averageActiveLines
      },
      sampleTrial: sampleTrial || null
    };
  },

  loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    } catch (error) {
      console.warn("Could not read simulator test history:", error);
      return [];
    }
  },

  saveRecord(record) {
    const history = this.loadHistory();
    history.push(record);

    // Keep browser history bounded. Exported files remain the permanent record.
    const trimmed = history.slice(-100);
    localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
    return trimmed.length;
  },

  downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

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
    const filename = `${record.experimentId}.json`;
    this.downloadJson(record, filename);
  },

  exportHistory() {
    const history = this.loadHistory();

    const exportObject = {
      schemaVersion: "1.0",
      exportedAt: new Date().toISOString(),
      resultCount: history.length,
      results: history
    };

    this.downloadJson(
      exportObject,
      `lyric-solitaire-simulator-history-${new Date().toISOString().slice(0, 10)}.json`
    );
  }
};
