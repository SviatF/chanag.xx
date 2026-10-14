# PANCHVANI Wave 3AD — JPL DE440s third-ephemeris reconciliation

2026-10-14. The task is to resolve actual contradictory astronomical sunrise-Tithi results, not to rerun the same engine and declare victory.

## Existing independently measured conflict

At **Patna 2027-01-31**, using the same observer but different astronomical algorithms:

| Model | Sunrise IST | Navami → Dashami IST | Sunrise Tithi |
| --- | --- | --- | --- |
| PANCHVANI V5 Swiss/Moshier \`sweCalcUt\` | 06:33:40 | 06:33:30 | Krishna Dashami |
| Independent Astronomy Engine 2.1.19 (Brown/ILE lunar theory) | 06:33:33 | 06:34:54 | Krishna Navami |

The sunrise clocks differ by ~7 s; the phase roots differ by ~84 s. Thus the local Tithi label cannot be considered independently verified, irrespective of whether external websites display rounded 06:33/06:34 clock values. **Do not overwrite V5 or the source-warning based on two conflicting calculations.**

## Third astronomical source

The CI downloads **JPL DE440s** SPK binary directly from JPL (SSD primary, NAIF fallback), checks the SPK magic and expected size, records its byte-for-byte SHA256, and evaluates it using pinned **Skyfield 1.55** (Python 3.12, research only). DE440s covers 1849–2150. It is a different high-precision solar/lunar numerical ephemeris from Swiss's Moshier approximation and Brown's Improved Lunar Ephemeris.

Source provenance:
- JPL kernel: \`https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp\` (fallback \`https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440s.bsp\`). The file is downloaded into a **temporary GitHub runner artifact directory** and not committed or deployed.
- Skyfield: \`https://rhodesmill.org/skyfield/almanac.html\`. \`almanac.moon_phase(ephemeris,t)\` uses the geocentric **apparent difference of ecliptic longitudes** (Moon minus Sun) in the ecliptic/equinox of date. It must not be replaced with vector angular separation.
- Solar rise: \`almanac.find_risings(observer, sun, ...)\` is USNO approximate apparent upper-limb sunrise (geometric solar center about -50 arcminutes, standard refraction, sea-level observer). **The Swiss atmospheric parameters remain different.**
- Times are UTC with separately converted IST, using the Skyfield built-in timescale/ΔT approximations (no remote service dependency); source Julian time scale assumptions are disclosed.

## Reproducible machine checks

- \`scripts/wave3ad-swiss-baseline.ts\` builds city-coordinates/UTC baseline for **Patna 2027-01-31, Kanpur 2026-11-21, Lucknow 2027-09-17** from unchanged production math, plus eight 3AB/3AC Vedha screens (two calendar days across Delhi, Kanpur, Mumbai, Chennai). It identifies which 12° Tithi root is closest to each sunrise.
- \`scripts/wave3ad-jpl-de440s-oracle.py\` independently computes sunrise and JPL Tithi root to sub-second bisection resolution. Prints difference \`JPL − Swiss\` in seconds, phase and Tithi at both solar clock instants, and whether the third model agrees on the named lunar day.
- The same JPL method checks the **96-min-before-sunrise** Tithi at both the Swiss and JPL solar clock for all eight Vedha cases, and independently checks Ekadashi on the JPL solar rise.
- CI artifact: \`wave3ad-jpl-de440s-third-ephemeris\` — JSON report, Swiss baseline, source provenance and source SHA256. Kernel itself is not included in artifacts.

## Correctness and decision rules

1. The JPL SPK must be valid, parseable and date-covered; do not substitute an online forum screenshot or an opaque third-party quote.
2. All 3 boundary cases and 8 Vedha cases must actually execute. Fail CI on missing Sun/Moon outputs, invalid Tithi root bracket and *egregious* discrepancies (sunrise >15 min; phase transition >1h) that indicate incompatible implementation. A meaningful 1–100 s disagreement is reported rather than hidden.
3. This release **does not edit** \`lib/panchang.ts\`, \`lib/vrat.ts\`, V5 precomputed calendar shards, festival records, Muhurat scoring, fasting dates, Parana windows or sitemap/SEO gates.
4. Even if JPL supports one side, the **precise third-model result is evidence of relative model accuracy, not an ISKCON/Smarta method**. Audit sources, comparable apparent/astrometric frame conventions, observer latitude, elevation, pressure/refraction and ΔT before any broad production change.
5. If the JPL reference gives a stable criterion for the boundary disagreement, the follow-up must explicitly assess the **number of all currently indexed city-days with a transition inside the affected model error envelope**, not mass-rewrite thousands of unrelated Tithi/ritual records.

## Release conditions

Exact PR SHA must pass all Panchang tests, JPL model computation, complete 3326 URL rendered content gate and Cloudflare Workers build before merge. This is a **research-only, no-calendar-mutation** stage.

Open issue #82 remains open for unresolved independent time-second comparisons, Smarta/ISKCON ritual selectors and Guru/Shukra Asta validation.


## Measured results — real CI run #38654437117

**Kernel:** official JPL DE440s, 32MB class SPK binary, SHA256 \`c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2\`. SHA now checked in both GitHub download step and research executable; a silently changed JPL kernel will fail CI. Source code: Skyfield 1.55, JPL DE440s numerical ephemeris.

All clocks below are **IST**, and deltas are independent JPL minus Swiss/Moshier V5. Intermodel offsets in calculated boundary times are not the same as an absolute uncertainty interval.

| City & Gregorian date | Swiss sunrise | JPL sunrise | Swiss Tithi boundary | JPL Tithi boundary | Signed JPL−Swiss boundary | Sunrise Tithi by each model |
| --- | --- | --- | --- | --- | --- | --- |
| Patna, 2027-01-31 | 06:33:40.748 | 06:33:34.599 | 06:33:30.643 | 06:34:15.581 | **+44.938 s** | Swiss Dashami; JPL Navami |
| Kanpur, 2026-11-21 | 06:31:57.425 | 06:31:51.135 | 06:31:19.850 | 06:32:01.530 | **+41.680 s** | Swiss Dwadashi; JPL Ekadashi |
| Lucknow, 2027-09-17 | 05:52:26.078 | 05:52:19.732 | 05:51:38.289 | 05:52:18.899 | **+40.610 s** | both Dwitiya |

**Inter-model disagreement has a pattern** (40.6–44.9 s earlier boundaries in Swiss/Moshier at these sample events). This does not automatically prove Moshier has a uniform 40–45 s bias across all future dates, lunar phases, or all cities; a larger representative sample and consistent observational method would be needed.

**Patna:** third high-precision JPL ephemeris independently supports Navami at both JPL and Swiss solar rise instants. This agrees in *classification* with Astronomy Engine, though their lunar transition estimates differ: **JPL 06:34:15.581 vs Brown/ILE 06:34:54** (~38 s). JPL result is a strong research signal that V5 sunrise label should be independently re-evaluated; not an automatic selector or a ritual ruling.

**Kanpur:** third model also supports Ekadashi at sunrise, versus Swiss Dwadashi. **Crucially this does not directly prove an ISKCON/Smarta fasting date** without the full tradition rule selection, pre-dawn/Parana clocks, Kshaya/Mahadwadashi reviews.

**Lucknow:** JPL sunrise 05:52:19.732 minus lunar transition 05:52:18.899 = **0.833 seconds**. This is a near-zero geometrical model margin. A location-specific atmospheric refraction assumption, altitude or observer coordinate can move sunrise and even flip the day classification. Avoid a misleading independent-certification claim.

**Eight earlier Dashami-at-Arunodaya screens**: 8/8 remain mathematically true under JPL phase and JPL solar rise. These are not fast-day certifications.

### What is actually closed versus still open
- **Closed:** Real third ephemeris is executable in CI; valid official binary is pinned and verified; differences and source method are publicly reported; all three previously disputed days now expose exact JPL comparisons in their dedicated notices; code CI/SEO validates visibility and integrity.
- **Not closed:** A deterministic full recalculation of *all* boundary-sensitive daily/monthly/festival/Vrat snapshots using a chosen high-precision lunar theory, including migration and user documentation. Before mass migration, compare JPL with Swiss ephemeris using equivalent apparent/geocentric flags, sunrise definition, time scales and effect size. Then decide which production engine to use, generate fresh build artifacts, and inspect changed ritual results **separately**.
- **Never inferred:** 8 confirmed fast days, verified Smarta/ISKCON observance, Guru/Shukra Asta, auspicious wedding/Griha Pravesh dates, or a blanket guarantee that every sunrise Tithi is correct.
