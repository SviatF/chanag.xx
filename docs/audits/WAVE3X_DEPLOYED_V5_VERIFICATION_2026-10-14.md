# Wave 3X — deployed Panchang V5 correctness controls

**Verified on:** 2026-10-14. Research/software integrity only, NOT certification of every regional ritual or fasting date.

## Actual deployed production evidence

[GitHub public fetch verification](https://github.com/SviatF/chanag.xx/actions/runs/38640157667) independently requested **8/8 named production URLs**, all HTTP 200 with correct same-address canonical values, UT-correct calendar Tithi and zero stale V4 indicators. Current version header in this runner was `85f12bc9-72ff-4b80-bef6-e2cfa19c2f90`.

- Delhi annual Purnima 2026: **12** sunrise observations; **2026-06-30 absent**.
- Delhi 2026-06-30: Krishna Pratipada, not erroneous sunrise Purnima.
- Thane 2026-08-25: Trayodashi.
- Kanpur 2026-11-21: Dwadashi (not asserting Ekadashi fast invalid).
- Bhopal 2026-12-24: Pratipada.
- Patna 2027-01-31: Dashami **with publisher disagreement disclosed**.
- Kolkata 2027-08-05: Chaturthi.
- Lucknow 2027-09-17: Dwitiya **with publisher minute-precision ambiguity disclosed**.

**SEO distinction:** 6/8 of these archive/future daily URLs intentionally return `noindex` under the independently controlled rolling priority-city/indexation policy. The only two `index` routes in this selected list were annual Delhi Purnima and the Kanpur day. The new audit records `robotsNoindex` but never claims that noindex means incorrect lunar math. Do not lift noindex just to make audit green; a 200 response also does not guarantee indexing by Google.

## New autonomous regression watch
`scripts/live-v5-astronomy-audit.mjs --strict` checks the **user-facing** exact HTML pages without URL query cache busters, verifies the exact local Tithi markers, canonicals and presence of source warnings, and emits `artifacts/live-v5-astronomy-evidence.json`. A separate read-only GitHub Actions job runs daily (04:40 UTC) and can run manually. It flags stale deploys and broken source warnings as a failed workflow, without changing the site or inventing astronomical truth. The proof artifact is kept for 21 days.

## Evidence limits and unresolved release work

1. **0/300** independently city/method-matched Guru/Shukra Asta cases; research only. A model agreement or same publisher mirrored twice cannot certify wedding eligibility.
2. **31/38** festival-year dates have only one maintained publisher, **7/38** have a second date-level publication (not exact ritual/Puja window validation). Janmashtami 2027 Smarta/Vaishnava observance and Parana selection still lack independently verified city-specific method concordance.
3. Patna **2027-01-31** Navami/Dashami is disputed by city-bound secondary times near sunrise. Correct UT math and a matching header do not prove independent published sunrise/tithi boundary agreement. Keep the visible notice.
4. Ekadashi at sunrise, true Ekadashi vrat selection, Dashami Vedha and Parana are separate religious event selectors.
5. SEO corpus passing zero structural/duplicate failures is not proof of Google indexing or search visibility growth; requires Search Console export and field measurement.
6. These eight URLs are **targeted high-risk examples only**, not a statistical assertion about all calendar dates or 50-city 2025–2028 data.

Do not advertise all religious/calendar results as 100% accurate until independent evidence and tradition-specific methodology are pinned. Current deterministic CI is a strong correctness gate but not a universal third-party validation.
