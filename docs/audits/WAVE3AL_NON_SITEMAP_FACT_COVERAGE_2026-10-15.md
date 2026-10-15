# PANCHVANI — Wave 3AL: close the non-sitemap factual coverage blind spot

**Date:** 2026-10-15. **Production lunar engine:** V5. **JPL V6:** still staging, not approved for ritual use.

## Why this change

Wave 3AK compared Daily, monthly-calendar and Vrat HTML only where Daily URLs also appeared in sitemap. On the 3,326-page checked corpus, 1,449 comparisons matched and 11,959 references remained unmatched because their Daily destination URLs were outside the sitemap's intentionally short indexable-date window. This is **not** 11,959 incorrect pages. It is an incomplete direct-HTML evidence set.

It would be an SEO error to solve that by adding thousands of low-value Daily routes to the sitemap. Instead Wave 3AL separately requests a deterministic, city-stratified sample of 192 referenced non-sitemap Daily URLs from the local built server, then reconciles the resulting real public SSR data with the already collected monthly and Vrat reference rows. The URLs remain outside the sitemap and do not receive indexing approval.

## Additional factual invariants

An annual city Vrat list must now agree with a directly rendered Daily city/date page on:
- Exact sunrise **Tithi**.
- **Paksha** (Shukla or Krishna).
- Local **sunrise clock**.
- **Tithi end clock**.

Monthly tiles continue to compare their displayed Tithi and Nakshatra to Daily. The new gate fails for any contradiction or unreadable, non-200 sampled Daily route; it also fails if the direct URL evidence is absent from the report. The sample is reproducible by deterministic URL SHA-256, includes city diversity, separates month vs Vrat types and prioritizes any referenced Delhi / Kanpur / Patna boundary cases.

## Evidence and caveats

The full JSON report records `unlistedAudit.requested`, `verified`, `uniqueTargets`, `fetchErrors`, `sampledPaths`, and the updated cross-page matched/unmatched counts.

This is **not** exhaustive coverage of all previously unmatched references, not proof of correct JPL astronomy, and not ritual fasting or Muhurat certification. Retain explicit unverified counts and do not advertise 100% quality or uniqueness. V5/JPL near-sunrise model flips remain unresolved in production; V6's full sidereal and festival/ritual rules remain release blockers.

## Remaining finite release gates

1. Reconcile all model-dependent lunar, sidereal and convention fields on a consistent ephemeris and ayanamsa; prove exact known near-sunrise boundary cases and publish versioned provenance.
2. Recompute dependent Vrat/Festival/Muhurat tables and obtain convention-specific reviewer approval for any date used as a ritual recommendation.
3. Rebuild entire production data and invalidate affected SEO cache under one versioned release switch; verify no mixed V5/V6 outputs on canary routes, then controlled activation with rollback.

These are implementation/review deliverables, **not an infinite sequence of statistical audits**.
