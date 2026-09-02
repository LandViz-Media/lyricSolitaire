# Game Rules and Balance Notes

This document is the working rules reference. Experimental assumptions may change as simulator results accumulate.

## Difficulty Modes

- Easy / Open: 12 active lyric rows.
- Standard: planned 10 active rows.
- Hard: planned 8 active rows.

## Inventory

Easy currently uses a 50 physical-word-tile player inventory limit. Standard and Hard limits remain under development.

## Draw Progression

Round 1 begins with 12 tiles. Later rounds use the working formula:

`Next Draw = (13 - Round) + Previous Round Words Played`

Actual draw is constrained by remaining pool tiles and available inventory space.

## Song Statistics

The player should see total physical words and unique words for the selected song or songs before starting play.

## Difficulty Rating

A future song challenge rating should be derived from measured song and gameplay characteristics rather than stored as a fixed subjective label. Candidate inputs include word frequency distribution, unique-word ratio, line lengths, repeated words, row count, turn count, draw progression, and hand limit.
