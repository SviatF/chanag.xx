# PANCHVANI — Critical Muhurat Data-Truth Audit (focused first pass)
Date: 2026-10-13 · Work tracking: #82 · Code: PR #83

## Scope and evidence limitation
This is **not** an independently completed audit of every URL. It is a prioritized, reproducible diagnosis of a confirmed wedding-eligibility defect and adjacent risk inventory. Previous 3,350 URL quality checks verified structure, duplication and internal calculation consistency, **not** external ritual correctness. Source disagreement is preserved instead of hidden.

## High-priority finding matrix

| URL / family | Incorrect / missing factor | Expected for documented tradition | Actual before correction | Evidence | Status | Priority |
|---|---|---|---|---|---|---|
| /muhurat/wedding/2026/10/mumbai | Chaturmas month-level marriage prohibition not checked | 0 traditionally recommended dates under customary Marathi wedding calendar | 5 Tithi/Nakshatra-screened dates, Oct 12 as 100/100 leading **availability** score | Hindu Blog Maharashtra 2026; Drik Panchang Chanda Maharashtra 2026; Live PanditJi Delhi Oct 2026 | Confirmed scoped defect; PR #83 patch | CRITICAL |
| /muhurat/wedding/2026/10 | Mumbai baseline inherits same ceremony-policy gap | Same customary Marathi interpretation stated explicitly for Mumbai baseline | 5 lunar/date screen results | Same published evidence (method conflict remains) | Confirmed scoped defect; PR #83 patch | CRITICAL |
| /muhurat/wedding/{year}/{month}/{city} | No curated event-specific Chaturmas, Shukra/Guru Tara Asta, community-specific allowed solar/lunar month rules | Requires source-reviewed year/locality/tradition matrix | Sunrise Tithi/Nakshatra + Choghadiya/Abhijit exclusions only | Source-code `lib/muhurat.ts`; Drik ceremony methodology | **Systemic code omission verified**, exact false-positive count unknown | CRITICAL |
| Other Muhurat events | Ritual-specific exclusions and full Panchang Shuddhi not certified | Per-event Yoga, Karana, weekday, Lagna, planetary conditions | Only selected sunrise lunar and daytime factors | Code inspection, previous Wave 3 notes | Unverified individual URL accuracy | HIGH |
| /panchang/{city}/{date} | Need cross-publisher validation of each ephemeris and named convention | City-local Swiss Ephemeris/IST sunrise, Tithi, Nakshatra, Yoga, Karana transitions | Local lat/lng and rise/set computed; Yoga/Karana currently sampled at sunrise | `lib/panchang.ts`, `lib/india-time.ts` | Independent full accuracy not established | HIGH |
| /calendar and regional/ | Calendar systems differ by region | Marathi/Gujarati Amanta, northern Purnimanta, Tamil/Malayalam solar conventions | Separate `calendar-conventions.ts` / `regional-calendar.ts` already implement several variants | Source-code inspection | Feature exists; correctness still needs external matrix | HIGH |
| robots/sitemaps | Possible over/underexclusion | Verified content truth + canonical/200/real GSC history before changing | `seo-policy.ts` index windows keyed to India-local date; 3,350 last audited sitemap | Code & CI; GSC unavailable | Claimed 716 noindex cannot be independently confirmed | MEDIUM |

## Independent sources and contradictory methods
1. Marathi Hindu Blog 2026 [Maharashtra-specific]: https://www.hindu-blog.com/2025/05/marathi-vivah-muhurat-in-2026-marriage.html — Oct 0; explicitly acknowledges modern community differences and local pandit exceptions.
2. Drik Panchang 2026 [Chanda, Maharashtra — NOT Mumbai]: https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0 — Oct 0, labels prohibited solar months and Shukra Tara Asta; needs separately reviewed Mumbai-local dates.
3. LivePanditJi [Delhi calculation]: https://www.livepanditji.com/muhurat/marriage/october-2026/ — Oct 0 due to Chaturmas.
4. Contradiction: AstroSage https://t.astrosage.com/2026/marriage-muhurat-2026.asp — lists Oct 4–6. Do not claim independent unanimity or override all Indian traditions based on this single convention.

The Marathi-specific source and the two calendar cross-checks support a **narrow conventional Mumbai default**. Other traditions remain independently open; an override/UI tradition selector must be reviewed before generalizing this closure.

**Terminology correction:** Shukra Vakri (Venus retrograde) and Shukra Tara Asta (Venus combustion/visibility condition) are NOT interchangeable. Exact 2025–2027 local Asta times and peri-combustion exclusions must be source-verified before encoding.

## Code flaw and immediate repair
In `lib/muhurat.ts`, `getMonthlyMuhurat` loops over every sunrise-scanned date, accepts allowed `Tithi && Nakshatra`, clips favorable daytime intervals by lunar end, subtracts Rahu/Yamaganda/Gulika, assigns a numerical **window availability** score and ranks. The valid astronomical math never checks whether the selected ceremony is conventionally allowed *at all* in that month. This is the source of the five false-positive wedding date suggestions in October 2026 for the reviewed Marathi calendar. Other claimed temple/tradition full Shuddhi is not implemented.

PR #83:
- Introduces `getVerifiedMuhuratClosure()` as an explicit event × civil month × exact city × named convention gate, currently **only** wedding, Mumbai, Oct 2026.
- `getMonthlyMuhurat` returns no ceremony-qualified wedding rows **before** window scoring when a reviewed closure applies.
- City and Mumbai-baseline pages render *informational Chaturmas evidence*, with zero wedding dates and precise scope; do not claim none matched lunar filters or show 100/100 wedding score.
- No new city, year, sitemap, robots, canonical, festival or V3 shard changes.
- Additional regression to protect other years/cities/event types from unreviewed extrapolation.

## Verification protocol
1. PR targeted Vitest, Muhurat Truth Audit, full Next.js/build/quality CI.
2. Compare `/muhurat/wedding/2026/10/mumbai` before (5 rows and 100/100 first) to after (0 customary Marathi marriage dates, explicit Chaturmas and tradition distinction, no ritual score).
3. Compare Mumbai baseline `/muhurat/wedding/2026/10` after (same closure).
4. Check `/muhurat/vehicle-purchase/2026/10/mumbai` unaffected; and `/muhurat/wedding/2026/10/delhi` not silently rewritten on the basis of Mumbai evidence. Both remain separate audit targets.
5. Verify canonical and robots stay unchanged and sitemap count stable. Inspect public live content after merge; Cloudflare build success alone does not prove live HTML propagation.
6. Next work: dated 2025–2027 marriage calendar regional matrix and Shukra/Guru Asta method; then per-ceremony rules; finally indexation/GSC review from verified exported records.

## SEO / data limitations
The reported 99.81% Google visibility loss has not been causally attributed to this single defect; verify Search Console trends, indexed URL inventory, manual actions, updates, duplicate/soft 404 response, and crawl history separately. GSC Wizard connector returned `payment_required` (subscription/trial ended) at audit time, so the **716 noindex count cannot be verified from GSC**. Do not alter robots or sitemap based only on that reported count.


## Wave 3C follow-up — documented additional 2026 Maharashtra Chaturmas closures

PR #83 protected **Mumbai October 2026**, but a reviewed Marathi-year calendar and another Maharashtra-specific panchang both report no customary wedding Muhurat days in **August or September** as well. This is a distinct dated follow-up, not a blanket extrapolation to 2025/2027, other states or other wedding traditions.

| URL | Category | Previous engine behavior | Expected customary Marathi result | Independent evidence | Action |
|---|---|---|---|---|---|
| `/muhurat/wedding/2026/08/mumbai` | Chaturmas and marriage eligibility | Generic Tithi/Nakshatra clock screen, ignoring customary marriage month exclusion | **0 customary wedding dates**, with why-and-tradition explanation | Hindu Blog 2026 Maharashtra month listing, Drik Panchang Chanda Maharashtra 2026 Aug | Explicit scope-only closure + SSR gate |
| `/muhurat/wedding/2026/09/mumbai` | Chaturmas and marriage eligibility | Generic Tithi/Nakshatra clock screen, ignoring customary marriage month exclusion | **0 customary wedding dates**, with why-and-tradition explanation | Hindu Blog 2026 Maharashtra month listing, Drik Panchang Chanda Maharashtra 2026 Sep | Explicit scope-only closure + SSR gate |
| `/muhurat/wedding/2026/10/mumbai` | Chaturmas and marriage eligibility | Prior 5 rows, best 100/100 from clock-only score | **0 customary wedding dates** | Hindu Blog, Drik Panchang Chanda, LivePanditJi Delhi; conflicting AstroSage | PR #83 + expanded SSR gate |

Reference: [Marathi Vivah Muhurat 2026](https://www.hindu-blog.com/2025/05/marathi-vivah-muhurat-in-2026-marriage.html) and [Drik Maharashtra 2026](https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0), city **Chanda not Mumbai**. These independently support customary calendar-month exclusions, but do not validate minute-level Mumbai Panchang astronomy. [LivePanditJi August 2026](https://www.livepanditji.com/muhurat/marriage/august-2026/) is a third check with a **Delhi rather than Mumbai** calculation.

Verified custom scope now covers Mumbai only, wedding only, 2026 months 08/09/10, no nationwide prohibition. Time-zone, Shukra/Guru Tara Asta, eclipse, Yoga/Karana and year-family eligibility audits remain **OPEN**. Next PR must rely on reviewed evidence rather than generic score-derived claims.

### New CI regression guard
`scripts/verify-reviewed-muhurat-ssr.mjs` checks actual local Next.js SSR on six routes (3 months × city/baseline) for HTTP 200, traditional date count 0, month-dependent Chaturmas explanation, tradition-specific nuance and absence of generic 100/100 or five-date ranking. It runs before the existing full sitemap content quality gate. This validates the built code **locally**, not publicly cached live HTML. Post-deployment fresh live inspection still required.
