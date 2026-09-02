# Simulator Lab

**Simulator Version: 0.1.0**

The simulator is a balance and solvability research tool, not the final player-facing game engine.

## Experiment Record

Each exported test result uses a stable JSON structure containing:

- experiment ID
- timestamp
- simulator version
- selected songs
- mode and gameplay parameters
- song statistics
- trial count
- wins / losses / win rate
- average rounds
- average words drawn / played / held
- average completed lines
- average pool remaining
- sample-trial trace

Export files belong in `test_results/`.

## Workflow

1. Select one or more songs.
2. Choose mode, trial count, and random seed.
3. Run the experiment.
4. Review the aggregate metrics and sample trace.
5. Export the JSON result.
6. Drop the exported JSON into `test_results/`.
7. Later, combine multiple result files for visualization and challenge-model development.

The browser cannot directly write files into the Git repository, so exporting JSON and placing the file into `test_results/` is intentional.
