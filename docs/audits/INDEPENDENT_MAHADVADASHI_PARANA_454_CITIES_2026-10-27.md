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
