# PANCHVANI Wave 3AO — global JPL sidereal transition catalog

2026-10-15 — Research/staging only. V5 remains production.

## Implemented

- Full UTC catalog covering calendar years 2026, 2027 and 2028: Nakshatra, all four Padas, Yoga, lunar Rashi and solar Rashi/Sankranti transitions. Nakshatra roots are literally every fourth Pada root.
- Actual JPL DE440s SPK geocentric apparent ecliptic Sun and Moon longitudes, Skyfield 1.55 with pinned kernel SHA256.
- The apparent Lahiri correction intentionally still follows the published Swiss/Moshier Lahiri convention. Six-hour source anchors cover 2025-12-30 through 2029-01-03. Exact direct Swiss UT is evaluated at the midpoint of every anchor pair to measure, not assume, interpolation error; 0.5 arcsec upper acceptance threshold.
- Three-hour initial brackets prove there are no skipped/reversed crossings. Twenty-five rounds of JPL bisection, then independent ±5-second crossing classification. Each root is archived as UTC epoch milliseconds and new event index. A validated binary lookup resolves calendar value without shipping JPL's 32 MB binary into user requests.
- A SHA256-bound read-only catalog reader checks source hashes, event order, modulo index increments, identical Pada/Nakshatra instants and research-only release flags.
- CI runs exact scientific generation and cross-checks global classifications at 15 real Wave3AN DE440s instants. Near-boundary differences remain unresolved research warnings, not automatically chosen labels.

## Not yet certified

- A global geocentric event stream is NOT an all-city sunrise/date census. The 454-city runtime comparison must separately use exact city sunrise conventions.
- Lahiri offset derives from Swiss; it is not independently validated from a JPL/IAU reference-frame definition. Measured midpoint interpolation accuracy is empirical, not an abstract worst-case proof.
- The dataset is an Actions artifact, not a committed production V6 shard. No real public routes/SEO assets are changed. Region/tradition-dependent Vrat, Parana, festival, Muhurat, Asta, Hindu Month and Samvat restrictions remain to be reviewed before activation.

## Finite release steps

1. Pin these global roots; compare all canonical city-date sunrise classifications with V5 and record physical near-boundary cases.
2. Recompute all dependent approved regional/ritual datasets from a consistent source and confirm manual reviewer gates where required.
3. Produce versioned production V6 assets, verify caches, do canary deployment with rollback. Never promote mixed or unapproved astrology.

Stop broad generic SEO audits; continue completing and validating concrete migration dependencies.
