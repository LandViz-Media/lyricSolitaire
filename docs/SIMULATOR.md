# Simulator Lab

**Simulator version: 0.1.3**

## Persona

The simulator now records a named persona. The first persona is:

**Dolly — Aggressive Row Filler**

Dolly represents the current decision-making strategy: prefer active lines
closest to completion, play every usable word, and when opening a new row favor
shorter candidate lines.

The persona is recorded in each experiment and each trial so alternate
decision-making strategies can later be compared without ambiguity.

## Session workflow

Run as many experiments as desired during one browser session. Complete
individual trial collections stay in browser memory rather than localStorage.

Press the single **Export Results (JSON)** button when the session is ready.
The exported JSON contains every experiment and every individual trial from
that session.

Refresh the browser to start a new session.

## Why localStorage is not used

Full 1,000-trial collections can exceed browser storage quotas. The simulator
therefore keeps experiment data in memory until export. The downloaded JSON is
the permanent record for `/test_results/`.

## Mode configuration

| Mode | Rows | Hand Limit | Maximum Rounds |
|---|---:|---:|---:|
| Easy / Open | 12 | 50 | 12 |
| Standard | 10 | 40 | 10 |
| Hard | 8 | 30 | 8 |

## Cache busting

Simulator JavaScript references use the simulator version as a query string,
so new releases are more likely to bypass stale browser/GitHub Pages caches.
