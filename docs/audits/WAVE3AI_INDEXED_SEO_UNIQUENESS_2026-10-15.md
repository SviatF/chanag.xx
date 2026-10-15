# PANCHVANI — Wave 3AI: indexed-page identity and concrete uniqueness controls
Date: 2026-10-15

## Why this is a real correctness gap
The full rendered-content audit already checks canonical owners, structural signals and 3-gram similarity within same-intent city clusters. It **does not** guarantee that every separately indexed URL has a unique HTML title or meta description, or that metadata describes the URL's intended calendar date. Date-only differences can also evade checks that normalize away dates and times.

Before this patch every historical and future /panchang/{city}/{YYYY-MM-DD} page was titled **"Today Panchang in {city} — {date}"**, factually misleading for dates other than today.

## Implemented controls
1. All dated Panchang titles explicitly identify location and date without labeling every date "today": "{City} Panchang for {YYYY-MM-DD} — Tithi, Nakshatra & Sunrise".
2. The rendered HTML audit now reads actual HTML `<title>` and `<meta name="description">` attributes, decodes entities and normalizes whitespace/case. It searches for **exact collision groups across ALL indexable programmatic page families** (not just same-family/same-date sibling routes).
3. It rejects missing or multiple HTML titles/descriptions for programmatic pages and verifies that dated Daily Panchang title, description and H1 include the requested date.
4. The **full rendered sitemap** quality gate rejects duplicate SEO titles, duplicate meta descriptions, omitted date identities, missing metadata or missing SEO-identity audit results. Synthetic tests cover both collisions and good location/date distinctions.
5. Support/navigation pages are not subjected to programmatic title audits; non-indexable pages are excluded from programmatic collisions rather than being falsely treated as indexed duplicates.

## Not claimed
- A unique title/description is **not sufficient** for genuinely original editorial prose, astronomy accuracy, GSC indexing or eligibility under Google's helpful-content policies.
- Calendar claims still require independent high-precision astronomy checks and ritual-specific source review. JPL V6 is currently **staging only**, and this patch does not modify V5 or V6 mathematical data.
- Similarity normalization can downplay the importance of real numerical differences; retaining the existing shingle-based structural/content controls is intentional. The new metadata gate is additive, not a replacement.
- Do not mass-index a city/date simply because it passes these checks. Low-value near-identical pages should remain nonindex until independently useful local information is available.

## Verification
- `npm test` includes new Wave 3AI metadata regression fixtures.
- Full Quality CI must pass Next.js SSR, full sitemap `content-quality-audit.mjs`, `content-quality-gate.mjs`, Vinext Cloudflare and the previous JPL source reproducibility gates before merge.
- Save `content-quality-report.json` CI artifact to establish actual collision counts and examples.
