# PANCHVANI Wave 3G — Muhurat publisher-method conflicts and independent festival checks
**Date:** 2026-10-13  
**Scope:** read-only publisher reconciliation plus source-specific corrections to misleading house-entry page copy; no unsourced calendar arithmetic changes.

## Confirmed findings (not universal astrological truth)

| URL | Issue | Expected by explicitly named convention | Current representation / conflicting publishers | Risk | Outcome |
|---|---|---|---|---|---|
| `/muhurat/griha-pravesh/2026/08/pune` | A general calendar lists house-entry dates while Pune Drik and Marathi calendar list none | **0 under the reviewed Marathi-calendar convention** | Drik Pune 0; Marathi Hindu Blog 0; GaneshaSpeaks publishes 15/17 Aug 2026 for another general method | HIGH — universal interpretation error | Keep convention-specific zero; explicitly disclose competing method, no nationwide claim |
| `/muhurat/griha-pravesh/2026/09/pune` | Same methodological conflict | **0 under reviewed Marathi convention** | Drik Pune 0; Marathi Hindu Blog 0; GaneshaSpeaks lists 17 Sep among others | HIGH | Same; record contradictory evidence |
| `/muhurat/griha-pravesh/2026/10/pune` | Same methodological conflict | **0 under reviewed Marathi convention** | Drik Pune 0; Marathi Hindu Blog 0; GaneshaSpeaks lists 23 Oct among others | HIGH | Same; record contradictory evidence |
| `/muhurat/griha-pravesh/2026/10/mumbai` | Previous rendered text ended with "confirmed marriage recommendation" on a *house-entry* page | "Griha Pravesh recommendation" | Actual shared JSX string said marriage regardless of ceremony | CONFIRMED copy bug | Fixed with event-sensitive wording and regression |
| `/muhurat/griha-pravesh/2026/10/mumbai` | Canonical title said generic "No Traditional Marathi Dates" without ceremony | "No Customary Marathi House-Entry Dates" | Generic calendar-agnostic title | MEDIUM factual ambiguity | Metadata corrected for Griha only |
| `/muhurat/wedding/2027/08/mumbai` through `/10/mumbai` | Lack of independently located non-Drik source for calendar-month exclusion | 0 traditional Marathi wedding dates | Previously multiple 2027 references, some secondary or non-Maharashtra | HIGH source confidence gap | Added GaneshaSpeaks 2027 independent calendar; no change to existing source-reviewed convention |
| `/festivals/ganesh-chaturthi/2026/mumbai` | One independent festival publisher | 2026-09-14 | Drik maintained 2026-09-14; Prokerala agrees | MEDIUM independent coverage | Added distinct second-publisher check |
| `/festivals/ganesh-chaturthi/2027/mumbai` and five 2027 October festivals | One primary publisher | Maintain 2027-09-04, Oct 09, Oct 18, Oct 29, Oct 30, Oct 31 | Drik source ledger; Prokerala Hindu 2027 calendar agrees | MEDIUM independent coverage | Added six distinct second-publisher checks, not new indexable URLs |

### Sources and calculation methodology

**2026 house-entry source conflict**
- [Drik Panchang — Pune 2026 Griha Pravesh](https://www.drikpanchang.com/shubh-dates/griha-pravesh-dates-with-muhurat.html?geoname-id=1259229) — no Shubh days in Aug–Oct; documents restricted lunar months, Guru/Shukra Tara Asta, weekdays and other ceremony-specific Panchang Shuddhi.
- [Hindu Blog — Marathi Griha Pravesh 2026](https://www.hindu-blog.com/2023/11/marathi-griha-pravesh-dates-2024.html) — zero in Aug, Sep, Oct, explicitly contextualizes Marathi community practice.
- [GaneshaSpeaks — Griha Pravesh 2026](https://www.ganeshaspeaks.com/muhurat/2026/griha-pravesh-muhurat/) — lists dates in all those months; its underlying selection method and locale must be reconciled before substituting those dates for the customary Marathi page. Neither the Drik/Marathi **zero** nor the alternative **nonzero** may be generalized to all households.

**2026 and 2027 wedding corroboration**
- [GaneshaSpeaks 2026 marriage calendar](https://www.ganeshaspeaks.com/muhurat/2026/marriage-muhurat/): August, September, October 0.
- [GaneshaSpeaks 2027 marriage calendar](https://www.ganeshaspeaks.com/muhurat/2027/marriage-muhurat/): August, September, October 0.
- These two records are *independent second-source month-level corroborations*. Exact local Chaturmas boundary instants or planetary Asta intervals for Mumbai remain unproved by them.

**2026/27 festival independent cross-check**
- [Prokerala Ganesh Chaturthi](https://www.prokerala.com/festivals/ganesh-chaturthi.html): 2026-09-14 and 2027-09-04.
- [Prokerala 2027 Hindu calendar](https://www.prokerala.com/calendar/hinducalendar-2027.html): 2027 Ganesh Sep 04, Dussehra Oct 09, Karwa Chauth Oct 18, Diwali Oct 29, Govardhan Oct 30, Bhai Dooj Oct 31.
- Seven festival-year records receive a *second publisher*; the full 38-record dataset is not yet corroborated by 2–3 independent publishers per event and region. The website's primary dataset and SEO activation policy are unchanged.

### Planetary Asta — findings, not speculative blocking
- The existing `lib/muhurat.ts` does **not** compute precise Guru/Shukra Tara Asta for each city, so favorable clock scores are only astronomy-first candidate availability, **not formal ceremonial eligibility**.
- Drik [2027 Guru Asta Mumbai](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206) publishes Aug 19 19:34–Sep 13 05:46 Mumbai local. [2026 Guru Asta Alibag](https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?time-format=24plushour) publishes July 17 evening through the morning of August 11 (the 24+ hour clock uses next-day labels). These are location-specific *single-publisher* records, not yet independently reproduced for PANCHVANI's own latitude/longitude/method.
- Do **not** confuse Shukra Vakri (retrograde motion) with Shukra Tara Asta (combustion / apparent solar proximity). Independent traditions/methods can differ in angular-separation thresholds, Shishutva and Vriddhatva exclusions.
- No broad 2025–27 Shukra/Guru Asta rule was inserted: doing so with unverified day boundaries can manufacture new false negatives.

## Patch / automated controls
1. Runtime `VerifiedMuhuratClosurePage`: ceremony-sensitive explanations and explicit general-calendar disagreement in the house-entry section; names of competing providers kept outside public runtime.
2. Correct `generateMetadata()` titles for 2026 Marathi Griha pages without changing URL or robots.
3. Audit-only `tests/fixtures/marathi-griha-pravesh-2026-evidence.ts`: records three alternative publisher example dates; test fails if we erase the contradiction.
4. Audit-only marriage fixture: two additional independent cross-publisher confirmations (2026/27).
5. Festival second-publisher fixture: seven distinct festival-year checks; script reports and **fails** if dates mismatch, source domains are not independent, or the second-source keys are duplicated.
6. Maintain full historical `38/38` primary festival ledger; do not misrepresent seven new references as full independent verification of every regional festival date.

## Remaining work (priority)
**P0** — independently verify Shukra/Guru combustion start/end for multiple cities and 2025–2027 with *matching observer and formula*, plus formal regional marriage/month exceptions; only then add a city/event/time-scoped prohibition engine.  
**P1** — Yoga/Karana transitions and regional lunar month boundaries, other Muhurat events; complete independent festival source matrix and tradition variants; live source review of actual URL content beyond current small test sample.  
**P1 SEO** — 716 alleged noindex URLs and 99.81% visibility decline need actual Google Search Console source records. Do not adjust sitemap/indexing based only on a count.  
**P2** — E-E-A-T author/reviewer/source history after data correctness, not before.

### Acceptance
PR CI pass (unit tests, festival truth audit, Muhurat truth audit, full 3,350 canonical/semantic structural checks), merge only when green. Independent production spot-check metadata/body after deployment. A green pipeline **does not certify religious dates** outside the enumerated external calendar comparisons.
