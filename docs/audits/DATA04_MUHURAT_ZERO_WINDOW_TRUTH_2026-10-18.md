# DATA-04 — Muhurat sunrise-matched days with no actual retained reference interval

## Confirmed model/data-state error
Before this change, `lib/muhurat.ts` included every day whose **sunrise** Tithi and Nakshatra matched a configured candidate profile, even when the first Tithi/Nakshatra change or the local Rahu/Yamaganda/Gulika and wedding Karana exclusions removed **every daytime window**. Such a date received `0/100 · Limited` and still occupied a numbered ranked row, `#1` when the month had no other candidate. This reports a date without any computed timing as a "top local fit."

## Source distinction
Drik Panchang explicitly warns that marriage selection requires location-specific Nakshatra, Yoga and Karana Shuddhi, solar/lunar months and Guru/Shukra Asta; even its traditional Panchang Shuddhi layer is not full Lagna Shuddhi: <https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0>. Our Tithi/Nakshatra + daytime reference model is far narrower. Dropping zero-window dates from *this limited ranking* is a mathematical consistency fix, not proof that a ceremony is prohibited on those dates.

## Actual correction
- Preserve the sunrise lunar-match count and exact ISO dates discarded by timing.
- Never include an excluded/zero-window date in the returned rankable `rows` for the location and event.
- Display the discarded date set and explain that no **model reference interval** survived. The absence of a modeled daytime interval is not certification that all traditional wedding/house-entry times are unavailable.
- Correct empty-month content, explanations, first-ranked result and table fallbacks. Keep existing month-level source-reviewed Marathi closures separate and authoritative only for their explicitly reviewed convention.
- No ephemeris change, no numeric fake adjustment, no 2027 Asta import, no expansion of religious rule claims, and no sitemap/indexability policy change.

## Proof and gates
`tests/data04-muhurat-zero-window-truth.test.ts` reconciles an entire Mumbai month, day by day, against the existing precomputed real city snapshots, both wedding and vehicle screens, checks a synthesized early-ending lunar state, and verifies differentiated empty-state content. The generated 48 committed Muhurat datasets are unchanged because the error lived in the downstream selector and display.

Merge only after complete Quality CI, Festival Truth Audit if configured, Next build, 3,326 rendered-page quality gate, and Cloudflare PR build pass.
