# 2026-10-26 PANCHVANI indexation stability repair

Evidence: Pre-GSC Live Audit [run 40304451828](https://github.com/SviatF/chanag.xx/actions/runs/40304451828) scanned 3,321 sitemap URLs and failed with nine NOINDEX_IN_SITEMAP and eight HREFLANG_NON_RECIPROCAL blockers. Another 12,821 linked targets are outside sitemap: 11,429 intentional exclusions, 885 possible candidates, 507 require review.

Root cause: the same rolling daily date eligibility drove current sitemap membership and metadata embedded in cached SSG/ISR pages. This can desynchronize as India time advances, and auto-retires previously eligible historical pages.

Remediation: stable, fixed reviewed metadata release cohort for baseline cities (2026-09-01 to 2027-03-31) and controlled/extra city dates (2026-10-09 to 2027-03-31). Keep the existing narrow rolling 14/45-day baseline and 3/14-day Wave 2 sitemap windows; never mass-enable unsupported cities, 2027 festival calendars, or ritual claims. Moving today's English Daily/region-city hreflang is withdrawn; ordinary visible language navigation remains, and time-stable Choghadiya hreflang stays.

### Required validation and release
- Run exact-head unit tests, Next/Vinext/Cloudflare builds.
- After deploy rerun live Pre-GSC; require zero NOINDEX_IN_SITEMAP and HREFLANG_NON_RECIPROCAL; if stale ISR survives deployment, revalidate affected exact paths safely.
- Review 885 potential indexable URLs and 507 unclassified, don't publish blindly.
- Re-evaluate extension of fixed release cohort before mid-February 2027, when rolling +45-day discovery approaches the 2027-03-31 ceiling.
- URL Inspection / GSC comparison must be evaluated separately; these repairs do not prove Google ranking recovery or festival/ceremony accuracy.
