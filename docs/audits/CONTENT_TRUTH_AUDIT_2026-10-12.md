# PANCHVANI — factual integrity and useful-content audit

Status: Wave 0 implemented, further factual auditing pending.
Scope: live indexable sitemap (3,350 pages as of 2026-10-12), not all routable future pages.
Goal: establish whether facts, dates, local calculations and decision-making content are correct and useful.

## What the current quality gate actually proves
The existing rendered content audit verifies sitemap fetch success, self-canonical, indexability,
hreflang, disclaimer-style copy, superficial length and normalized textual similarity.
This does NOT establish factual correctness, original research, accurate festival timings
or meaningful value for users.

## Wave plan and priority
1. **Daily / Choghadiya (P1):** multi-city/date astronomical invariants, verified Swiss Ephemeris
   sampling with independently transcribed dated sources, solar/lunar events with civil dates.
2. **Festival pages (P1):** independently source date/region/observance criteria; check
   Tithi, Nakshatra, actual Muhurat vs sunrise/daylight *reference*; avoid fabricated ritual windows.
3. **Muhurat (P1):** independently assess ceremony eligibility and selected Tithi/Nakshatra,
   reconsider meaning of planning score/100, avoid presenting heuristic as certified muhurat.
4. **Vrat / Calendar (P2):** cross-check moon phases and observance precedence at sunrise,
   year/month turnovers including Adhika/Purnimanta vs Amanta.
5. **Regional / tools / knowledge (P2):** genuine local distinctions, languages, verified tool
   calculations and source evidence.
6. **All URLs (P2):** content specificity, per-family decision usefulness and effective information
   gain, normalize location tokens when assessing similarity; preserve indexability policy.

## Confirmed architectural risks requiring review
- `lib/panchang.ts` uses fallback Julian dates if `sweRiseTrans` fails and falls back to
  sunrise minus ~29.5 days when previous new Moon resolution fails. These must not be
  silently published as facts; replace in a scoped patch after checking date/city coverage.
- `lib/festivals.ts` dates are a manually maintained 2026/2027 ledger; automatic lunar calculation
  does not independently establish observance dates in all traditions/regions.
- `lib/muhurat.ts` 0–100 is an internally weighted heuristic based on clean windows and source counts,
  not an external, universally validated measure of auspiciousness.
- The external Panchang regression fixture covers a handful of city/date observations, not
  all 25 active cities and all listed dates.
- Unique wording is not proof of genuine unique information or decision-making value.

## Wave 1: fail-closed astronomical calculations
- Solar rise/set and next sunrise are validated for success, finite Julian time, expected
  India-local civil date, event ordering and plausible night/day length.
- Missing sunrise, sunset, next sunrise, Tithi or Nakshatra transitions and previous
  new moon can no longer be silently replaced with invented fallback Julian times.
- Moonrise/moonset may remain explicitly unavailable; no invented time is substituted.
- Independent source facts remain separated from production app logic.
- The audit expands from 5 dates per active city to 24 dates spanning seasonal extremes,
  calendar rollover, leap day and festival transitions. Night Choghadiya handoff is
  checked for adjacent-day continuity.
- Choghadiya weekday sequences are independently cross-checked against
  https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html?lang=en
  (audit-only source, not reproduced on public pages).
- Passing Wave 1 does not certify every single city/date/festival observance.

## Wave 0 controls
`tests/fixtures/content-truth-references.ts`: external source observations; don't update to satisfy a test.
`scripts/content-truth-checks.ts`: chronology/invariants and independent snapshot comparison.
`npm run audit:truth`: 25 city x 5 event dates plus source comparisons; JSON audit artifact.
`Content Truth Audit` workflow: weekly + manual + changed-code push.
A sampled PASS is NOT certification of 3,350 URLs; failures remain visible and actionable.

## Sourcing policy
Use cited, date-stamped source per festival/district and record different traditions.
Swiss Ephemeris position calculations and validated external observance rules must be
treated separately. For public pages, show only specific, verified user-facing facts;
do not replace missing calculations with fabricated ritual clocks or generic text.
Public pages do not gain disclaimer-style boilerplate from this audit.

## Safe deployment
Never bulk-create new URLs, expand cities, or globally change robots/canonical during
content integrity work. Patch by family, with before/after tests, quality gate and
controlled GSC outcome tracking. Report unresolved source conflicts explicitly.

## First independently detected semantic conflict
On 2026-09-14 Ahmedabad's Ganesh Chaturthi festival date, the source reports
Chaturthi begins approximately 07:06 local time *after sunrise*. The actual
sunrise-state is Tritiya, ending approximately 07:08 in Panchvani. This is not
an astronomical mismatch. Festival pages that show only sunrise Tithi beside
the festival date can mislead users without explicitly showing the transition.
Follow up in Wave 2 with a general festival-rule-aware presentation of
festival-Tithi transition (no per-city hardcoded SEO text).


## Wave 2E — Raksha Bandhan Bhadra / Vishti (2026-10-13)
- In Shukla Purnima, Vishti = Bhadra occupies the first half;
  Bava is the second half. Thus Purnima + Bava **at sunrise** confirms
  Bhadra finished before that sunrise. The code does NOT infer Bhadra start/end.
- Conservative planning interval is sunrise to earlier of Purnima end
  and local sunset, and only when the Purnima end date/clock is valid.
  On Vishti sunrise, non-Purnima or unknown Karana, **no Rakhi window** is shown.
- Verify Delhi, Mumbai, Pune, Hyderabad, Kolkata 2026 and Delhi 2027
  against dated Rakhi observations; 25-city × both years matrix must
  verify status and not claim contradictory generic Choghadiya Muhurat.
- This is a *source-constrained Rakhi planning interval*, NOT an exact
  Bhadra start/end engine, Mukha/Puchha calculation or personalised
  eligibility certificate.
- Drik source Rakhi 2026: https://www.drikpanchang.com/hindu-festivals/rakhi/rakhi.html?time-format=24hour
- Drik source New Delhi 2027: https://www.drikpanchang.com/festivals/raksha-bandhan/raksha-bandhan-date-time.html?geoname-id=1261481&year=2027
