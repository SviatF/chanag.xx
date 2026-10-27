# PANCHVANI — independent Ekadashi transfer, Nakshatra and Viddha Parana research

Date: 2026-10-27. Scope: **454 cities / 2026–2027 = 908 independent astronomical comparison units**. The code is research-only; it does not change public fasting or SEO dates.

## Scientific motivation and independent input provenance

The GCal run 40555537893 (PR #151, corrected source isolation) has 22,246 eligible Ekadashi source fasts and 3,630 comparison mismatches, plus 343 Mahadvadashi subtype gaps and 4,699 cases without a numeric Parana comparison.

Original GCal results are used **only after** independent candidate classification; they must not supply the Tithi sequence, Nakshatra or Parana method.

Independent observations use Swiss/Moshier solar rise and Sun/Moon Tithi, with Lahiri sidereal Moon Nakshatra sampled at each successive sunrise. GCal and Hari-bhakti-vilasa describe that Dashami on Arunodaya can invalidate a sunrise Ekadashi; Viddha fasts transfer to the next Dvadashi and Parana may occur on Trayodashi. Source references:
- https://www.gopal.home.sk/gcal/docs/GCalVaisnavaCalculation.pdf
- https://www.anantasatsang.org/scripture/radha-bhakti/hari-bhakti-vilasa/vilasa-12

## Focused regression examples (not ritual certifications)

| Delhi scenario | Observations | Source-observed fast candidate | Independent logic added |
|---|---|---|---|
| 2027-10-25/26 | 25: Ekadashi sunrise, Dashami Arunodaya; 26: Dvadashi sunrise | 2027-10-26 | Viddha transfer |
| 2027-07-29/30 | 29: Dashami sunrise; 30: Ekadashi Arunodaya, Dvadashi sunrise | 2027-07-30 | Ekadashi Kshaya / sunrise-skipped transfer |
| 2026-08-23/24 | Dvadashi persists at two successive sunrises | 2026-08-24 | Defer previous Ekadashi to Vyanjuli |
| 2027-06-14/15 | Following full-moon Tithi repeats at two sunrises | 2027-06-15 | Defer previous Ekadashi to Paksha-vardhini |
| 2027-09-11/12 | Bright Dvadashi with Lahiri Shravana at 12 and 13 sunrise | 2027-09-12 | Nakshatra-dependent Vijaya **candidate**, still unapproved |
| 2027-10-27 Parana | Trayodashi at sunrise; first third of daylight near 10:13 Delhi local | GCal sunrise-to-third-daylight rule | Compute earlier of independent Trayodashi end and one-third daylight |

**Safeguards:** candidate dates are never directly published, nor treated as validated for Smarta, Gaudiya Vaishnava and ISKCON interchangeably. Near-boundary cases, Nakshatra exceptions and source disagreements require explicit review.

## Comparison gates before any merge/promotion

1. All CI jobs and the downstream 16-shard aggregator must complete.
2. Confirm coverage **454 distinct city slugs** and **908 distinct city-years**, pinned GCal source evidence.
3. Record fresh totals for candidate, subtype and per-minute Parana matches; do not silently reuse PR #151 baseline.
4. Classify remaining mismatches by independent reason and exact local date, with explicit blocking status.
5. Keep independentlyCertified=false and publicRitualApproval=false, do not change V6, Muhurat, feeds or SEO publication.

This work is still an **independent screening implementation**, not a fully verified second ritual oracle.
