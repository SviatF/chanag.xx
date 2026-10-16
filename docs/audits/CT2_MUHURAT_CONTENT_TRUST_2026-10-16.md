# PANCHVANI CT2 — Muhurat Content Truth and Ranking Trust (2026-10-16)

## Problem and scope
In the V5 system, month-city candidate lists are created from sunrise Tithi/Nakshatra rules and screened daytime intervals. The 0–100 value is the *site-owned daytime-window availability* score, **not an independent religious ceremony eligibility score**. A ranked 100/100 date may fail unverified Guru/Shukra Asta, region/community rules, Lagna and other event-specific exclusions. Only narrow Maharashtra city × event × month closures are independently source-reviewed. Other months are unresolved, not implicitly approved.

## Implemented: avoid implied approval, keep actual informational content
- Dated city and Mumbai-baseline month pages identify themselves as `data-ritual-status="candidate-only"`.
- Their JSON-LD publishes a neutral CollectionPage describing screening limitations; removes the `ItemList` of rank-ordered dates labelled "Planning Score" which could be parsed as fully endorsed Muhurat dates.
- Preserve the already distinct city/month fact narration and existing prominent **NOT verified ceremony dates** notice, rather than inject additional repeated paragraphs or homogenized labels. The existing on-page score evidence explains that 0–100 is window availability. The annual top-results labels are clarified to refer to clock-window screening, not event permission.
- Annual summary labels top outcomes as screened clock-window results rather than recommended ceremony dates.
- New read-only rendered-HTML scanner `scripts/muhurat-content-trust.mjs` examines **all indexable Muhurat month/year pages** from the normal sitemap. It rejects candidate pages without explicit status/limitations or with rated ceremony schema. Separates verified Marathi convention-specific closure pages from unverified candidates.
- Enforced in the existing full `content-quality-report.json` and CI gate; unit tests include dangerous schema and good/bad examples.
- **No** modification to engines, physical date values, V5 precomputed shards, JPL V6, canonical, sitemap, robots or automatic `noindex`.

## Not proved / next steps
Passing CT2 means no *known misleading ranking presentation*, not verified ritual correctness. Independent city/observance comparisons and actual GSC Coverage/Googlebot evidence are still needed. No claim that this patch fixes September's near-zero search impressions.

Merge only if Quality CI plus full 3,326 rendered sitemap audit show zero regressions and no remaining high-similarity issues. CT1 PR #130 deliberately remains unmerged because it introduced severe normalized Daily duplication when synthetic geo text was removed; do not fold CT1 into this release.

## CI review and content-similarity correction
The first full 3,326-page CI check found 7, then 3 high-similarity Muhurat city-page pairs after mass-rewording score labels and inserting a generic caution. Both intermediate versions were withheld. The release candidate removes those *new generic wording changes* in month pages, while retaining machine-readable candidate-only evidence and the prominent existing user-facing verification notice. Do not lower the similarity threshold or invent geographic fillers to pass this gate.
