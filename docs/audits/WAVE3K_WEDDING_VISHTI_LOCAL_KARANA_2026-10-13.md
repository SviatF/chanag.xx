# Wave 3K — Date-accurate Vishti (Bhadra) exclusion for Wedding timing windows

**Date:** 2026-10-13  
**Scope:** Wedding-specific, time-scoped Karana avoidance. This is a partial Panchang Shuddhi check, **not** a new marriage day/month certification.

## Confirmed defect

The existing engine clipped favorable daytime Choghadiya and Abhijit windows to the sunrise-active Tithi/Nakshatra ends and excluded Rahu Kalam/Yamaganda/Gulika. It *did not exclude Vishti Karana (Bhadra)* — even when a Wedding score was high and the correct later-day Karana had become Vishti.

Two independently published descriptions confirm that Vishti is prohibited within the wedding selection convention:
- [Drik Panchang: Panchang Shuddhi for Marriage](https://www.drikpanchang.com/shubh-dates/info/choosing-auspicious-marriage-date.html?lang=en) — marriage list excludes Vishti, Shakuni, Chatushpada and Nagava.
- [AstroSage: marriage eligibility and forbidden Karanas](https://www.astrosage.com/2021/marriage-dates-2021.asp) — independently names Vishti, Shakuni, Chatushpad and Nag; other customs may differ.
- [Drik Panchang Mumbai daily 2026-10-13](https://www.drikpanchang.com/panchang/month-panchang.html?geoname-id=1275339) — illustrates Karana changing within one civil date: Taitila until 10:46, then Garaja until 23:27.
- [AstroLeaf Mumbai 2026-10-13](https://astroleaf.in/panchang/mumbai-maharashtra-india/2026-10-13/) — Taitila ending 10:47, independent corroboration of the clock boundary.

## Fix
1. Upgrade Muhurat precomputed shard **V3 → V4** with the genuine Swiss Ephemeris `karana`, `karanaEnd` and `karanaEndDate` fields. Keep the 48-shard / 338-dataset shape, original indexed URL set, all original Tithi/Nakshatra evidence and city-specific coordinates.
2. For **Wedding only**, after clipping to sunrise Tithi and Nakshatra continuity:
   - If sunrise Karana is **Vishti**, exclude the actual interval until `karanaEnd`.
   - If sunrise Karana is **Vanija** and `karanaEnd` is earlier than the parent `tithiEnd`, the following moveable Karana is **Vishti**: exclude that precise interval through the Tithi's end. Do not assume a fixed 6-hour duration or a noon cutoff.
   - Also exclude sunrise-active Shakuni, Chatushpada, Naga (as documented by both providers), although these should not normally pass the configured sunrise Wedding Tithi gate.
   - If end times, civil dates, known Karana name or Karana≤Tithi chronology are missing/invalid, **fail closed**: do not show unverified Wedding timing windows.
3. Recompute all wedding window scores **after** removing prohibited intervals, rather than keeping a score based on time later deleted by Bhadra.
4. Keep all other event profiles unchanged; Griha Pravesh and Vehicle Purchase require their own convention/source review before adopting the same exclusions.
5. Render the excluded Bhadra intervals in Wedding local-exclusions table and explain the city-specific filter alongside the score evidence. The `100/100` score remains **only** a window-availability metric, not a certified ritual Muhurat.
6. Amend full-shard Truth Audit: verify each Wedding row against the same lunar + Bhadra clips, ensure zero overlap, validate every V4 Karana boundary, and report amount of source-window time removed.

## Acceptance and non-goals
- 48/48 compressed V4 shards and 338 local city-month datasets updated using Swiss Ephemeris; all names and end instants date-consistent.
- Synthetic regression must prove the important distinct scenarios: sunrise Vishti that ends midmorning; Vanija→Vishti during the same Tithi, late-night cross-date event; Vanija that ends *with* its Tithi (no Vishti); malformed evidence (no windows); no mutation of underlying references.
- Verify all existing 2025–2027 Marathi Wedding month closures remain 0 and are never reopened by window filtering.
- Pass 3,326/3,326 indexed sitemap checks, canonical/hreflang and near-duplicate SEO gate, and production Vinext build.
- Exact local Guru/Shukra Asta boundaries, remaining prohibited Yoga, Lagna, festival/Vrat rules, GSC 716 noindex exports and any non-Marathi community convention are **still open**. A successful engineering check does not certify those.

**Do not apply this Vishti rule as an all-day ban or falsely extrapolate it to all Indian ceremonies.**
