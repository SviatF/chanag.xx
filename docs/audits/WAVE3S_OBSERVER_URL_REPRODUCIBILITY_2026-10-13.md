# PANCHVANI Wave 3S — Asta observer-city URL reproducibility and source integrity

**Review date:** 2026-10-13. **Research-only.** No approval of ritual Muhurat or publication of unverified Asta dates.

## A concrete, reproducible provenance problem
During source research, the **same Drik Panchang URL**:

`https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206`

was observed in different retrieval contexts displaying **different observer cities and different times**.

| Retrieval context | Rendered observer | Jupiter Asta start | Jupiter Asta end | Displayed civil time |
|---|---|---|---|---|
| Indexed source result | **Mumbai, Maharashtra, India** | 2027-08-19 **19:34** | 2027-09-13 **05:46** | India |
| Direct page fetch of same address | **Washington, D.C., United States** | 2027-08-12 **20:46** | 2027-09-13 **05:58** | U.S. Eastern local time |

Source URL (Mumbai search evidence / distinct fresh open): [Drik 2027 Jupiter](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206).

The direct fetch used a different retrieval context; we have not established its exact cookies, network origin or observer-selection mechanism. **We cannot claim that a city name in search results is permanently bound by this URL.** Nor is `year=3206` demonstrably a Gregorian 2027 parameter, so do not infer location or Gregorian year from that query string alone. The locality and local time zone are critical when interpreting a *city-specific* astronomical event. **Never subtract U.S. local clocks from IST clocks as raw minutes.**

The indexed and page-fetch values are historical snapshots, not continuously queried external APIs. This is an example of **source-observer instability**, not a claim that one publisher made an astronomical error.

## Implemented safeguards
- `lib/asta-city-source-reproducibility.ts`: validates recorded source observations (HTTPS, Gregorian civil date/time, year, stated city and timezone, dated capture context), groups the **canonical identical URLs**, flags when they produced different rendered cities, and classifies matching legacy source ledger records as **not URL-pinned**.
- `tests/fixtures/asta-city-source-captures.ts`: four explicit source snapshots (Mumbai and Washington for the exact same Jupiter page, plus separate Latur and Wardha 2027 Venus pages). No made-up city-bound minute times.
- `lib/asta-reference-audit.ts`: **tightened the "comparison-ready" gate**. Two publishers are insufficient on their own. A `publisher-pinned` reference now requires **explicit reviewer-stated observer URL proof**: a city-specific token literally present in the URL, same city as reviewed source, and at least two separately reviewed fetches. This is a reviewer evidence prerequisite, **not** independent runtime verification of third-party location behavior.
- Two equally timed **fixed-angular** publishers no longer yield `comparison-ready` for **observer visibility**. Both must use `observer-sensitive` methods and meet the observer binding gate.
- Same-publisher conflicting copies now yield `publisher-internal-conflict`, not whichever contradictory snapshot happened to overwrite the other.
- Legacy Wave 3J `assessAstaEvidenceForFiltering` can no longer return `readyForCeremonyFiltering:true` solely from domain count.
- `scripts/asta-wave3s-source-reproducibility.ts`: analyzes the current original core city × 2025–27 × Jupiter/Venus **300 cases**, with an explicit four-city priority matrix and a JSON triage of source failures. Saves `artifacts/asta-wave3s-local-source-reproducibility.json`.
- `npm run audit:asta-city-sources` is required in GitHub Quality. The CI artifact `asta-wave3s-city-source-reproducibility` contains the report, captures and unresolved-city reasons.

## External discovery that is *not* a city-pinned replacement
[VedicTithi Jupiter 2026](https://vedictithi.com/astrology-events/combustion/jupiter) displays **July 14 18:04 → Aug 13 15:53** and states the 11° threshold; [VedicTithi Venus 2027](https://vedictithi.com/astrology-events/combustion/venus?year=2027) displays **July 6 20:42 → September 17 22:48** with a 10° threshold. The pages show Ujjain in the header and do not explicitly certify a stable **observer-locality permalink or time-zone independent of user context**.

Thus VedicTithi is promising as another **published fixed-angle** convention check and deserves an independently repeated timezone review. Do **not** merge these minute times into the observer-local Drik evidence ledger or claim they are 2nd local Asta references.

## Evidence required before any release
1. A publicly documented, immutable city/observer identifier in source address or API query; repeatedly fetched in **separate** review contexts with the exact same observer ID and location heading, and historical capture proof.
2. At least **two independently authored same-city/same-phenomenon same-calendar-year minute references** (not two mirrors, different planets, or shared upstream ephemeris calculations).
3. Explicit method distinction: angular combustion, physical naked-eye heliacal disappearance/reappearance, or Drik's unpublished location-dependent Asta convention. One is not equal to another.
4. Geophysical/astronomical uncertainty and tradition-specific Wedding/Griha eligibility/Lagna independently reviewed. No `unknown → permitted` shortcut.

Until these are satisfied, all 300 city × year × planet comparisons remain unresolved. Publisher agreement is a source-verification research observation, **not** an eligibility statement.

## Production / SEO safety
No changes to `lib/muhurat.ts` computations, V4 month shards, other Panchang calculations, public routes, SEO canonicals, sitemap, robots, noindex or regional ritual claims. The audit is admin/research-only via CLI and CI JSON artifact; it creates no newly indexable URLs. SEO content-quality passing cannot establish recovery in Google Search Console or ritual accuracy.

Next research priority under [issue #82](https://github.com/SviatF/chanag.xx/issues/82): independently establish city permalink semantics and the actual published event definition with a second independent city-pinned source. If none exists, **remain unresolved** and do not introduce ritual date exclusions.
