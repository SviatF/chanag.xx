# PANCHVANI Wave 3AH — versioned, isolated V6 release staging

**Date:** 2026-10-15. **Public release:** V5 only. **Staged mathematical source:** pinned JPL DE440s 6° half-Tithi roots from Wave 3AG. This stage is migration implementation, **not** an independent certification of Hindu calendrical or tradition-specific selections.

## Implemented
- `lib/v6-calendar-staging.ts` now defines an immutable `v5-swiss-moshier` production selector and a separate `v6-jpl-de440s` research version. A V6 public activation attempt **throws**, not silently falls back. There is no user query, environment flag, public route or Cloudflare deployment selector that can unlock it.
- `getStagedV6Daily` overlays only JPL-derived sunrise Tithi, Karana and exact dated boundaries on the unchanged V5 day. It enforces **the same India civil date and rounded sunrise clock** between independent JPL lunar data and Swiss solar rise. The returned object prominently records all retained V5 data and cannot certify the combined Panchang.
- `getStagedV6VratYear` derives all sunrise Ekadashi / Purnima / Amavasya observations directly from that very same shared JPL sunrise classification. It preserves weekday, local sunrise, end-date/time, repeated sunrise and stable ordering; it never certifies fast, Mahadvadashi or Parana.
- `getStagedV6MuhuratMonth` produces per-day inputs with identical JPL Tithi/Karana/boundaries as staged Daily. **No scored or approved Muhurat** is derived from the hybrid data. The V5 live ranker and 48 shipped V5 shards are untouched.
- A deterministic cache namespace contains V6 engine ID, staging schema 6, *exact committed JPL roots SHA256*, and city/coordinate/month. A V5 schema-5 shard, wrong JPL provenance, or missing `publicReleaseAllowed:false` is rejected as a V6 staging object.
- `scripts/wave3ah-precompute-v6-staging.ts` creates separate compressed research artifacts under `artifacts/wave3ah-v6-staging/`; it does **not** write to `generated/`. Default sample builds actual Delhi 2026-06, Kanpur 2026-11 and Patna 2027-01 and asserts the three known exact-source model flips, while annual Kanpur 2026 Ekadashi is verified against the common JPL source. `--all` enumerates the *committed* V5 registry's complete city-month set, checks city coordinates and generates versioned V6 research shards. It does not imply new Muhurat rankings are approved.
- `.github/workflows/wave3ah-v6-staging.yml` runs sample staging and uploads research artifacts on PRs; a manually dispatched `all` mode can produce the complete staged replacement data set without modifying production files. The existing Quality workflow still validates V5 production and independent JPL source.

## Release criteria — NOT met by staging
1. Reconcile JPL phase with **all** other relevant sidereal dependencies: Nakshatra/Yoga, Hindu month based on previous new moon, Samvat year start and illumination. Merely overlaying sunrise phase onto V5 is a deliberately *mixed* preview.
2. Independently review affected festival and vrata *ritual* selection, including arunodaya/Vedha, Smarta/Vaishnava/ISKCON and Parana. Do not invent ritual approval from precise astronomy.
3. Run the manual `--all` staging build, verify coverage, hashes, all 48 month artifacts, 338 target city-month snapshots (or the actual current registry count), and every known near-sunrise flip. Confirm candidate scores/wedding restrictions through their own reviewer gates.
4. Only once all above gates are met, create a separately reviewed V6-only production `generated/` shard set and a versioned release switch; verify all SEO routes, cache invalidation and Cloudflare Workers before activating a controlled rollout and supporting rollback.

Until the gates are met, production `getPanchang`, `calculateVratCalendar`, `getMonthlyMuhurat` and all 48 version-5 month shards remain unchanged. **Staged output is not a replacement calendar for users**. No JPL-based ritual or other sidereal calculations should be described as independently validated.

Related: PR #114 (Wave 3AG), issue #82, and the versioned CI staging workflow.
