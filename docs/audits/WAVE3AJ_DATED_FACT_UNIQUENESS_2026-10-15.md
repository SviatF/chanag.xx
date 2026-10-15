# PANCHVANI — Wave 3AJ: truthful dated daily content and rendered fact integrity
Date: 2026-10-15

## Confirmed defects corrected
1. **Calendar pages for historical and future dates still said "today" within on-page FAQ/FAQPage JSON-LD, daily interpretive text and timing headings** despite Wave 3AI correcting the HTML Title. Every Daily FAQ question/answer now identifies the actual India civil date, and the sunrise labels are explicitly sunrise states (not all-day claims).
2. **The local-day narrative classified Tithi/Nakshatra transitions by HH:MM alone, discarding `tithiEndDate`/`nakshatraEndDate`.** For a 01:25 transition on the following civil date this mistakenly described it as "opening daylight" on the current date. The generator now preserves the dated boundary, differentiating following-day and after-sunset transitions; impossible before-sunrise/missing dates are identified for source review.
3. **SEO page similarity only tested prose and metadata, not whether the primary rendered Tithi/Nakshatra/Yoga/Karana/sunrise/sunset cards were coherent.** A new audit extracts the **visible HTML card values** (not hidden SEO strings), checks required values, real HH:MM clock, sunrise-before-sunset, and a conservative physical daylight range (8–16 hours). Missing, repeated or invalid primary values now fail the full sitemap Quality gate.
4. Distinct full daily fact vectors by city and date are compared using **the actual six visible labels and values** without normalizing away numerical differences. If two cities share all six rounded outputs, the report includes explicit URL owners for human review. Such a match does NOT fail CI without independent evidence: two neighboring observer locations can legitimately share rounded data; inventing a different sunrise to force uniqueness would be unacceptable.

## What quality really means
- `dailyFactIntegrity.dailyPages`, `dailyFactIntegrity.failures`, `dailyFactIntegrity.identicalLocalFactGroups` are emitted in the existing full-sitemap `content-quality-report.json`.
- Invalid or absent full-sitemap Daily fact scans stop CI. Legitimate exact local fact collisions are **observational evidence**, not automatic defects.
- Generated locale text and schema FAQ reflect the **requested date**, not the build date.
- The old global text similarity, title/description identity and canonical/hreflang audits remain mandatory. They do not prove substantive originality or external publisher permission.

## Not yet certified
V6 remains **not published**. These fixes improve V5 page integrity and SEO honesty, not its geocentric astronomy. V5/JPL 226 near-sunrise disagreements and Hindu Month/Samvat/ritual rule dependencies still need reconciled before promotion. No new festival fasting or auspiciousness assertion is approved by this PR.

CI: exact-head vitest, full Next.js SSR corpus audit (all sitemap URLs), V5 Muhurat integrity, JPL reproducibility, Cloudflare vinext build. Review content-quality-report to identify the actual full-page factual error count.
