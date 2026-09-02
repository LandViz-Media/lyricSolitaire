# Simulator Lab

**Simulator version: 0.1.1**

The simulator is a balance and solvability research tool, not the final player-facing game engine.

## Important v0.1.1 correction

The v0.1.0 interface offered Easy, Standard, and Hard, but the simulation engine was still using the Easy configuration. Therefore, v0.1.0 experiments labeled Standard or Hard should be considered historical interface tests rather than valid evidence for those modes.

Beginning with v0.1.1:

| Mode | Rows | Hand Limit | Maximum Rounds |
|---|---:|---:|---:|
| Easy / Open | 12 | 50 | 12 |
| Standard | 10 | 40 | 10 |
| Hard | 8 | 30 | 8 |

## Reset

Reset is **not needed between normal experiments**. Pressing Run Simulation starts a fresh experiment and clears the previous displayed results. Reset is for intentionally clearing the current page state.

## Experiment Records

A v0.1.1 export preserves the complete individual trial collection. Each record also stores the rules parameters, song metadata, aggregate results, and:

- `allWordsUsedTrials`
- `allWordsUsedRate`
- `everAllWordsUsed`

This allows future histograms and distributions to be calculated without rerunning the experiment.

## Results Viewer

`results.html` is the first-generation viewer. It loads multiple exported result JSON files by file picker or drag-and-drop and can compare experiment summaries and display a trial histogram.

The viewer is intentionally file-based for now. Later we can build a master dataset from all files in `/test_results/` and add song comparisons, mode comparisons, distributions, simulator-version comparisons, and challenge-model diagnostics.

## Testing Workflow

1. Select song(s), mode, trials, and seed.
2. Press **Run Simulation**. Reset is not necessary first.
3. Review aggregate results and the sample trace.
4. Export the complete JSON result.
5. Put the JSON file in `/test_results/`.
6. Once enough tests accumulate, load them into `results.html` for comparison.
