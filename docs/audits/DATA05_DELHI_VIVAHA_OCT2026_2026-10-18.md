# DATA-05 — Verified New Delhi Oct 2026 wedding convention closure

Reviewed on 2026-10-18 against 3 separate publisher calendars with **exact Delhi / New Delhi location**. Source URLs and publisher wording: `tests/fixtures/delhi-wedding-oct2026-source-ledger.ts`.

## Confirmed user-facing conflict
`/muhurat/wedding/2026/10/delhi` currently (pre-fix) exposes **five sunrise-Tithi + Nakshatra screening candidates** including **2026-10-12 score 100/100**, yet 100 is internally a *daytime time-window supply score, not Vivaha approval*. This was explicitly caveated but remains a misleading top wedding "fit" alongside three independently published zero-approved-date calendars for Delhi.

## Source-verified correction
All three publisher references (Drik Panchang New Delhi 2026; PanchangTime New Delhi October 2026; MuhuratGuru Delhi October 2026) report **0 traditional approved Vivaha dates**. Their rules differ; do not assert identical minute clocks or unanimous reasons. Date-specific blockers include excluded solar months, wedding season/Chaturmas and Shukra Asta. The precise astronomy and tradition-specific rule verdict is **not** independently recalculated by PANCHVANI.

## Runtime implementation
- `getVerifiedMuhuratClosure("wedding",2026,10,cityBySlug("delhi"))` returns a reviewed Delhi-specific ceremonial verdict, not a blanket national rule.
- `getMonthlyMuhurat` returns `rows:[]` for **this exact city+event+month** rather than ranking 5 generic candidate days.
- The existing `VerifiedMuhuratClosurePage` renders **Delhi** and the published Hindu marriage convention, not falsely attributing the closure to Marathi tradition.
- No change to other October cities (incl. Ghaziabad, Faridabad), to Delhi in other months, to other ceremonies or to the astronomical daily Panchang.
- Current production uses V5 Moshier; this publication rule doesn't certify V6, Guru/Shukra combustion instants, personalized Lagna or full ceremony eligibility for all other dates.

## Deployment verification
Independent source fixture + exact scope regression tests, full `npm test`, Next reference build, Muhurat Truth Audit, full 3,326-page HTML/SEO quality gate and Cloudflare PR build. No merge on failure.
