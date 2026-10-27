# PANCHVANI full 454-city independent Mahadvadashi and Parana research

Scope: 454 cities x 2026 and 2027, 908 city-years. 16 partitioned CI jobs independently compute sunrise/Arunodaya Tithis and Parana clock bounds with Swiss Ephemeris, then compare with the original pinned GCal binary's event dates and local times. Original GCal source is **comparison data only**.

## Required honesty
- The native GCal XML has festival fasts for Purnima, Navami and Ashtami that are **not** Ekadashi. They are filtered out, correcting earlier PR #149 research's 86 raw "mismatch" count.
- Structural candidate recognition handles Unmilani, Trisprsha, Vyanjuli, Paksha-vardhini; no claim of completely independent religious approval.
- Four Nakshatra-based Mahadvadashi (Jaya, Jayanti, Vijaya, Papanasini) are deliberately marked for special-rule review rather than computed by a Tithi-only classifier.
- Pure Parana clock calculator computes start = max(sunrise, first quarter of Dvadashi) and end = min(end of Dvadashi, sunrise + first third daylight), and preserves "after" lower-bound-only formats.
- Dvadashi already expired by sunrise and subtype-specific Nakshatra restrictions require special validation; no automatic public approval.
- GCal coordinate arguments are rounded to whole arcminutes; source and Swiss latitude/longitude are compared at <=0.01 degrees.
- All failed Swiss calculations and all missing time bounds become explicit research gaps; never replaced with guessed values.
- Source algorithm: https://www.gopal.home.sk/gcal/docs/GCalVaisnavaCalculation.pdf ; independent tradition reference: https://iskcondesiretree.com/page/unmilani-mahadvadasi

Until 908/908 full source comparisons and all subtype/time residuals are reviewed, `independentlyCertified=false`, and no production date selection uses this module.

## Original PR #150 evidence audit (16 JSON ZIP artifacts, 2026-10-27)

The source run [40543511377](https://github.com/SviatF/chanag.xx/actions/runs/40543511377) completed all 908/908 city-years across 454 cities. Aggregation of all 16 raw JSON artifacts, not just CI green badges, showed:

| Research metric | PR #150 baseline |
|---|---:|
| GCal Ekadashi-eligible fasts | 22,246 |
| Non-Ekadashi GCal fasts excluded | 2,724 |
| Candidate date mismatches | 3,630 (2,215 GCal fasts missed, 1,415 independent-only dates) |
| Mahadvadashi subtype gaps | 343 / 2,765 (256 are Vijaya) |
| Ordinary Parana numeric start/end pairs | 18,016 / 18,016 |
| Maximum residual within paired subset | 3 minutes for each endpoint |
| Parana events without numeric comparison | 4,230 (4,211 special-rule review; 19 nonnumeric/open-ended) |

Large recurring date clusters: 2027-10-26 (454 GCal fasts missed), 2027-07-30 (415 missed), 2026-08-23 (333 independent-only), 2027-09-11/12 (256 independent-only plus 256 missed).

**Methodology correction in follow-up research branch:** The PR #150 annual script selected the Parana special-rule method using the GCal subtype, leaking oracle classification into independent logic. Follow-up changes route methods exclusively from the independent classifier's kind, allow numerical residuals only where source and independent classifiers both identify an ordinary case, and record method provenance. They require a new full 908-year CI run: the PR #150 counts above must not be presented as validated post-correction results. A new aggregation job rejects incomplete or duplicate shards and produces a single CI artifact. It intentionally does **not** interpret research-job success as zero ritual mismatches.

No public Panchang, Ekadashi, Muhurat, V6 or SEO indexation is promoted.
