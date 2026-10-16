# PANCHVANI Wave 3AU — source-constrained regional Sankranti calendar-day candidates

Date: 2026-10-16. **Research-only. Public V5, all published month dates, Sankranti festivals, Vrat, Samvat, Muhurat and SEO are unchanged.**

## Why this stage exists

Wave 3AT found **44 city-sunrise Solar Rashi classification differences** (36 cities 2027-07-17; 8 cities 2027-03-15) between SHA-locked JPL event streams generated with two different Swiss Lahiri source frames. A sunrise-sign difference is *not* a proof that a regional solar month, ritual date, or festival date must change.

The V5 regional profile in `lib/calendar-conventions.ts` currently exposes three different **civil-month assignment** conventions:

- Bengali (West Bengal site-model): the new sign is read at IST civil midnight, so an ingress belongs to the following civil month's first day. Bangladesh's reformed calendar is **not** evaluated by this model.
- Tamil (site-model): the sunset-based day decides whether the same date or following date begins the month.
- Malayalam / Kerala (site-model): the local sunrise-to-sunset daylight interval, with three-fifths as the threshold, decides whether the same or following day begins the month.

These are *descriptions of current application logic*, not independent certification that a particular publishing tradition, temple or regional authority approves the definitions. For example, Kerala almanacs and Bengali publishers may use other ayanamsa, day or institutional conventions.

## Implemented

1. Compare all **36 physical ingresses × 454 canonical Indian cities = 16,344 event-city pairs**, independently for original JPL and alternate native-C Lahiri event clocks, using actual Swiss upper-limb local sunrise and sunset with V5's observer/atmosphere settings. Compute IST civil-day assignments for each V5 regional rule.
2. Replay the 44 exact 3AT sunrise discrepancies against *both* original frozen JPL catalogs, require same UTC sunrise within 2.5 seconds and verify sign identities, hash provenance, full 454-city census, sign identity, and 2027-03-15/2027-07-17 geographic clusters.
3. Produce a machine-readable CI-only JSON artifact containing per-ingress geographic assignment counts and a source/reviewer queue for every candidate policy change, original 3AT dawn disagreement and policy cutoff sensitivity. Keep policy approval explicitly `false`; do not claim that a ritual date is validated.
4. Unit-test midnight/sunset/3⁄5 threshold semantics (including exact-boundary cases), rejection of invalid physical clocks and research-only release gating. Compile audit independently and fail Quality CI on mixed sources or incomplete evidence.

## Hold points before any V6 switch

- **Independent ayanamsa convention**: JPL+native Lahiri agreement to Swiss C's roots alone is not independent policy certification. Compare against a separately published, location- and year-specific calendar/source and document ephemeris/day definition.
- **Regional policy review**: review India regional/local interpretations for Bengali, Tamil and Kerala month starts, including sunset and 3/5 boundary cases. Avoid treating Bengal vs Bangladesh, or generalized sunrise signs, as synonymous.
- **Festival and ritual selection**: Sankranti auspicious periods, Pongal, Vishu, Makar Sankranti observances, Vikram/Gujarati/Shaka Samvat, Vrat/parana, Hindu Month, muhurat and city/year/date nuances require *separate* governing-method evidence and explicit reviewer signoff.
- **Broader astronomy**: resolve independent Tithi/Karana/Pada/Nakshatra/Yoga differences and remaining JS Swiss tropical coordinate drift before switching 2026–2028 shards.
- **Public SEO integrity**: keep 3,326 page SEO truth/uniqueness checks and the existing V5→V6 rollback workflow; CI pass does not certify calendar semantics.

Artifact: `artifacts/wave3au-sankranti-regional-rule-review.json`, created only by Quality CI after Wave 3AT. Requires `status=research-only`, `productionV6ReleaseAllowed=false`.

**Interpretation:** A regional date changing *under two different source methods* only identifies a high-priority reconciliation item; neither candidate should be automatically published without independent and regional verification.
