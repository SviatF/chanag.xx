# Gold Rate — Indexing Readiness Runbook

This runbook is the final manual gate for the Panchvani Gold Rate cluster. It does **not** enable indexing. `GOLD_RATE_INDEXING_ENABLED` must remain `false` until every item below is confirmed in production.

## 1. Production infrastructure verification

Use `/admin/gold-rate/validation-log` in the production deployment for the runtime-visible checks, then confirm the Cloudflare-only checks in the Cloudflare dashboard.

- [ ] Data transport is healthy in production. If `GOLD_RATE_DATA_URL` is configured as an external override, the admin readiness screen must show it as reachable and returning a valid Gold Rate dataset. If the native KV pipeline is used, KV is the canonical transport and the external override may remain unset.
- [ ] Gold Rate KV storage is configured in production and historical observations are being persisted.
- [ ] Confirm **3–5 consecutive real `:17` cron executions** in Cloudflare Workers production logs. Persisted observations in the admin screen are supporting evidence, not a replacement for this log check.
- [ ] `GOLD_RATE_INDEXING_ENABLED=false` is explicitly set in the production environment.
- [ ] In staging, force the primary spot source to fail and confirm the fallback source is used; then force all live inputs to fail and confirm the site serves the last-known-good rate rather than zero/blank data. Record the test date in the release/PR notes.

**Clock rule:** the 14-day production validation period is not considered started until every infrastructure item above is green.

## 2. Daily IBJA validation workflow

Production never scrapes IBJA. Each working day:

1. Open `/admin/gold-rate/validation-log`.
2. Enter the published IBJA 999 benchmark as **₹ per 10g** for the date.
3. The system compares it to Panchvani's `benchmarkComparable24k`, which is **pre-GST 24K per gram**.
4. IBJA 999 is converted to per gram and compared on the same GST-exclusive basis.
5. Review the table and aggregate summary on the same screen.

Pass criteria:

- minimum 14 calendar days elapsed;
- minimum configured benchmark observations (default 10);
- average absolute deviation ≤ 2%;
- no individual validation day > 5%.

Comparable basis shown in admin:

`Panchvani pre-GST 24K / g ↔ IBJA 999 GST-exclusive / g`

## 3. Demand-approved cities

Candidate cities live in `config/gold-rate-city-approvals.json`. Approval is deliberately manual.

For each candidate:

1. Compare city-specific gold-rate demand in Google Trends for India using a consistent time range and peer set.
2. Do not approve from population alone.
3. Record the city with a reason and evidence note:

```bash
node scripts/approve-gold-rate-cities.mjs approve mumbai \
  --reason "high gold-rate search demand; metro bullion hub" \
  --evidence "Google Trends India · 12 months · checked YYYY-MM-DD · peer set: Delhi/Chennai/Bengaluru/Hyderabad"
```

Review:

```bash
node scripts/approve-gold-rate-cities.mjs list
node scripts/approve-gold-rate-cities.mjs env
```

The `env` command prints the exact `GOLD_RATE_INDEX_CITIES=...` value generated only from approved entries. Committing an approval does **not** switch indexing on.

## 4. Final indexing enablement checklist

Before changing `GOLD_RATE_INDEXING_ENABLED` to `true`, manually confirm every item:

- [ ] At least 14 continuous calendar days of production data are stored.
- [ ] Average IBJA deviation is ≤ 2%.
- [ ] No individual validation day has deviation > 5%.
- [ ] `GOLD_RATE_INDEX_CITIES` is populated only from cities marked approved in `config/gold-rate-city-approvals.json`.
- [ ] After the flag is enabled, verify `/sitemap-goldrate.xml` manually and count the URLs. It must contain only the hub, calculator and approved city URLs. Do **not** submit it yet if any unexpected URL appears.
- [ ] Manually inspect 3–5 random approved city pages: correct H1, direct-answer block, working 7/30-day trend, correct methodology copy, and the disclaimer at the bottom of page-specific content rather than in the hero.
- [ ] Submit `sitemap-goldrate.xml` separately in Google Search Console. Do not merge it into the existing sitemap submission flow.
- [ ] Start the same weekly GSC/indexation review cycle used for the other Panchvani SEO clusters immediately after submission.

## 5. Safety rules

- Do not change the formula or data sources as part of launch approval.
- Do not enable indexing before the checklist is complete.
- Do not add monetization/affiliate links during this validation phase.
- Do not expand Gold Rate changes into Muhurat, Daily Panchang or other page families.
