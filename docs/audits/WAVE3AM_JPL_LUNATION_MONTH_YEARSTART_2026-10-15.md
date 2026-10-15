# PANCHVANI Wave 3AM — JPL-anchored lunar months and Samvat staging

Date: 2026-10-15. Production remains **V5 Swiss/Moshier**; V6 activation is **blocked**.

## Implemented, not just audited

- `jplNewMoonBoundaries` extracts only the physical 6° roots with half-phase index **0**, i.e. Amavasya → Shukla Pratipada, from the **same immutable DE440s 4,512-root event stream** already used by staged Tithi and Karana.
- `jplLunationAtMs` finds exact *previous*, *next*, *next-next* new moons; enforces sequence, coverage and plausible synodic lengths. It throws rather than inventing an extrapolated date.
- `jplLunarMonthCandidate` anchors Amanta/Purnimanta and Adhika candidate calculations to those exact JPL new moons. Its **sidereal Sun at each event still uses UT-correct Swiss/Moshier with Lahiri**. Consequently these are reproducible *hybrid research candidates*, not independently JPL-confirmed month names.
- `jplNewYearCandidate` uses the same JPL root for Chaitra Shukla Pratipada and Gujarati Kartika Shukla Pratipada candidate boundary calculations. It selects the local-sunrise date, retains documented kshaya fallback and refuses ambiguous year roots. Sidereal solar-sign selection is still unapproved.
- The V6-only Daily staging record now includes the JPL-rooted lunar month **research evidence** but does not overwrite public Hindu Month, Samvat, or festival selection.
- The main Quality workflow generates a machine-readable comparison against V5 for 8 known/independent day cases and 12 regional year-start cases, pins the JPL hash, records disagreements, and archives its artifact. The comparison **does not** declare agreement merely because two models are similar.

## Must still be finished before V6 release

1. Derive **sidereal Sun and Moon from a consistent, specified JPL reference system and an agreed Lahiri ayanamsa** and independently validate Nakshatra, Pada, Rashi, Yoga and lunar month labels, including adhika/ksaya.
2. Reconcile city/year boundary conventions for Vikram, Gujarati and Shaka Samvat and dependent festival/Vrat rules, with regional-methodology evidence and reviewer signoff.
3. Recompute the complete V6-dependent Muhurat/Festival/Vrat shard set; validate tradition-specific Asta, Parana, arunodaya and ceremony restrictions.
4. Run an all-city/year regression with versioned runtime loader and controlled rollback. **No live switch before these gates.**

Technical SEO uniqueness and cross-page internal agreement do not prove the astronomical model is independently correct.
