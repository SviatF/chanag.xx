# PANCHVANI Wave 3AQ — exhaustive exact-sunrise / JPL V6 source census

**2026-10-15. Production remains V5. This is research evidence, not a ritual calendar release.**

## Exact scope (no approximated sunrise filter)

The canonical supported city set has **454 unique slugs**, with two repeated input rows (Alappuzha, Amreli) that share identical coordinates and are deduplicated strictly after validating every duplicated record. Three independent CI jobs cover 2026 (365), 2027 (365) and 2028 (366) **all India-local civil days** — exactly **497,584 physical Swiss/Moshier upper-limb sunrises**.

For *every one* of these moments, the auditor:
- directly evaluates Swiss `sweRiseTrans` at 00:00 IST, 1013.25 hPa, 25 °C, sea level and checks that the returned UTC instant belongs to the intended Indian civil date;
- reads the **same pinned JPL DE440s** 6° roots for Tithi, half-phase Karana, plus the Wave 3AO SHA-verified global JPL Nakshatra, Pada, Yoga, Moon Rashi, Sun Rashi event streams at that exact sunrise instant;
- verifies Nakshatra/Pada invariant, per-family nearest transition distance, event chronology, and each day's inclusion in the census. No NOAA approximation, city extrapolation, date skipping, or fabricated transition times;
- calculates V5 Swiss tropical/sidereal Sun/Moon coordinates for every sunrise **within 10 minutes of ANY JPL root**, plus deterministic independent non-boundary controls every 97 days. Differences near the boundary are preserved as discrepancies, not claimed to be V5 errors.
- records every model mismatch per family, annually and in a bounded detailed report with complete SHA-256 digests for all classification and sensitive/mismatching rows. Huge routine output never enters the website bundle.

The exact source artifacts are reconstructed from SHA-pinned DE440s via Skyfield and measured 6-hour Lahiri anchors before each yearly census. Each yearly workflow has an independent pass gate, and a final job downloads all three reports and rejects an incomplete **497,584**-sunrise corpus or a mixed source identity.

## Failure policy / what is NOT proved

Missing physical sunrise, wrong IST date, invalid JPL event state or time, missing year, city duplicate with different coordinates, incomplete count, missing mandatory Swiss comparison controls, and non-adjacent V5/JPL model disagreement **fail the workflow**. Adjacent disagreements and actual sunrise-near boundary cases are published to research artifacts for examination, not automatically corrected.

This is a complete **sunrise coverage** audit for 2026–2028; it is **not** a full Swiss-versus-JPL comparison on every day, independent certification of the Lahiri ayanamsa, all-time coverage, verified Amanta/Purnimanta/Samvat, festival/fasting/Parana, Muhurat or Guru/Shukra Asta. The JPL frame keeps a Swiss Lahiri convention, and sunrise remains Swiss by deliberate V5 method parity. No production V6 loader/routing, V5 Muhurat precomputed shard, sitemap, SEO content, or ritual date was changed.

## Next concrete release action

Use year-specific disagreement and boundary rows to reconcile exact source frame and regional calendars; then implement **versioned staging shards for all downstream consumers** and test festival/Vrat/Muhurat decisions with independent ritual methodology before any public release. A green Quality workflow is necessary but never sufficient to declare every date correct.
