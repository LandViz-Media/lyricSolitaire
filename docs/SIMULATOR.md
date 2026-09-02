# Simulator Lab

**Simulator version: 0.1.2**

The simulator is a balance and solvability research tool, not the final player-facing game engine.

## v0.1.2

Simulator v0.1.2 is the clean baseline for the next test campaign.

### Experiment identity
- The simulator version appears in the page header.
- The simulator version appears in the current experiment panel.
- Every individual trial contains `simulatorVersion`.
- Every exported experiment contains `simulatorVersion`.

### Mode configuration
- Easy / Open: 12 rows, 50-tile hand limit, 12 rounds.
- Standard: 10 rows, 40-tile hand limit, 10 rounds.
- Hard: 8 rows, 30-tile hand limit, 8 rounds.

### Results
Every exported experiment retains the complete individual-trial collection, plus aggregate measures and:
- `allWordsUsedTrials`
- `allWordsUsedRate`
- `everAllWordsUsed`

### Reset
Reset is not required between normal experiments. Pressing Run Simulation starts a fresh experiment. Reset is only for intentionally clearing the current page.

### Export workflow
Use **Export Results (JSON)** for the permanent test record. Put that file in `/test_results/`.

**Export Session History** is a convenience export of browser-local history. It is not the primary test-archive workflow.

## Results Viewer

`results.html` loads exported experiment JSON files and provides initial comparison and histogram capabilities. It can filter by song, mode, and simulator version.

As the test collection grows, the viewer can be expanded to compare songs and modes and calculate challenge-level diagnostics.

## Testing rule

Do not compare v0.1.0 Standard/Hard experiments directly with v0.1.2 Standard/Hard experiments as though they used the same rules. v0.1.0 displayed those modes but its engine remained Easy-only.
