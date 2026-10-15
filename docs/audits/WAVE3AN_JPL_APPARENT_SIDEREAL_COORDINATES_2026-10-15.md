# PANCHVANI Wave 3AN — JPL DE440s apparent Sun/Moon sidereal candidate

**2026-10-15 • Research-only. Production remains V5.** This wave builds a usable JPL-coordinate sidereal classification component and feeds it real, pinned high-precision positions from CI. It does NOT yet generate an all-city runtime interpolation grid, monthly transition roots, or an approved public V6 engine.

## New coordinate pipeline

1. Select exact research instants from the already-pinned DE440s 6° root table (actual observed city sunrise plus immediately preceding true new moon). Eight city/date reference scenarios yield 16 unique instants, without guessing a month length.
2. Generate independent Swiss/Moshier tropical and Lahiri-sidereal Sun/Moon positions at each **exact same Julian UT instant**, with `sweCalcUt` and `SE_SIDM_LAHIRI`. Derive a single **effective apparent Lahiri offset** from Sun tropical-minus-sidereal, rather than incorrectly subtracting a *mean* ayanamsa from an *apparent* JPL longitude. Record the Moon-based offset too; enforce discrepancy sanity bounds.
3. In Python Skyfield==1.55, SHA-verify the complete 32 MB `de440s.bsp` and calculate **geocentric apparent ecliptic-of-date Sun/Moon longitudes**. Prove their difference agrees within 1e-9 degrees with independently evaluated `skyfield.almanac.moon_phase` on all test instants.
4. Pass source-stamped JPL apparent longitudes + exact-instant Lahiri correction into `getJplSiderealCandidate`. Calculate Nakshatra, Pada (1–4), Moon Rashi, solar Rashi, Yoga and phase from one consistent JPL coordinate pair. The candidate is blocked by default for ritual or production use.
5. Check against the actual published Swiss/Moshier coordinates at those instants, separately recording **source-based label changes**, angular residuals, and boundary-sensitive results. **Within 0.02° of any Nakshatra, Pada, Rashi, Yoga, or lunar phase boundary requires review.** No artificial rounding or cross-city content substitutions.

## What the automated tests prove

- JPL binary and version provenance for the **underlying astronomical positions**, not only random synthetic longitude fixtures.
- Coordinate-frame consistency with the existing pinned JPL Tithi transition table (away from exact roots).
- Explicit Lahiri offset, not mixing mean ayanamsa with apparent longitude.
- Correct circular wrap, Nakshatra/Pada/Yoga/Rashi indices, and negative tests for invalid ephemerides or source mismatches.
- No changes to production Panchang/Vrat/Muhurat, SEO routes or committed V5 shards.

## What remains non-certified

Swiss/Moshier Lahiri is still the **ayanamsa source**; while the astronomical Sun/Moon geocentric positions are JPL, the *full reference-frame convention is not independently JPL/IAU reconciled*. The 16-instant check does not represent all 454 cities or all transitions in 2026–2028. A candidate near a boundary is not automatically wrong or right. Next steps are JPL position coverage with explicitly measured interpolation error and transition root finding, independent ayanamsa/frame review, all-city dawn parity, accurate V6 cache/shard versioning, then regional festival/Vrat/Muhurat ritual approvals. The public engine stays V5 until separately approved.

**Non-negotiable:** a green CI for this limited sample may be used as evidence of the candidate pipeline, **not** as a claim that all PANCHVANI dates are correct, all user-facing content is original, or V6 is ready to activate.
