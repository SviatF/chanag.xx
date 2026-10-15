# PANCHVANI Wave 3AS — same-UTC coordinate parity and implementation root-cause isolation

**Research only. No public V6 activation or ritual-day updates.**

## Critical Wave 3AR results that triggered this work

Across 9,322 precisely bracketed JPL/Swiss physical transitions, Solar Rashi had a maximum JPL-vs-pure-TypeScript Swiss delay of **1,354.368 seconds** (22m 34s). Native Swiss C vs pure TypeScript Swiss also differed by **up to 929.182 seconds** (15m 29s) on the same Solar Rashi roots. The other families differ less but still materially near sunrise. This invalidates a blanket assumption that two implementations named *Swiss Ephemeris Lahiri* calculate identical physical transition times.

## Wave 3AS: identify the *component* that diverges

- Recalculate the same **actual UTC instants** used by the SHA-pinned 2026–2028 JPL Solar Rashi root table (all 36), the most divergent twelve roots in each lunar/sidereal family, plus independent fixed-time controls.
- Record both Sun and Moon tropical *apparent ecliptic* positions, sidereal positions, speeds, and effective Lahiri transformation = tropical minus sidereal using `@typescriptify/sweph`, `SEFLG_MOSEPH|SEFLG_SPEED`, `SE_SIDM_LAHIRI`.
- Repeat all calculations in separately pinned native Swiss Ephemeris C `pyswisseph==2.10.3.2`, **same UT instant and flags**. Check native `calc_ut` agrees with `calc(UT+DeltaT)` and report the native Delta-T values.
- Decompose every source difference by the exact identity **Δsidereal = Δtropical − ΔeffectiveLahiri**, keeping the circular 0°/360° arithmetic safe. This distinguishes ephemeris/position drift from coordinate-frame/ayanamsa convention drift without inventing a correction factor.
- Fail CI if the source or timestamp is missing, identical Sun/Moon Lahiri convention breaks, a coordinate is nonfinite, or the decomposition does not close. Produce per-body maximum/mean/median arcsecond difference and raw values in an archived JSON report.
- **No numerical “fix” is applied until the source code / reference-frame cause is resolved.** A linear correction to transition clocks is NOT physically justified; fixing a few festival labels would risk new errors at the next boundary.

## Exact hold points

The JPL DE440s physical Sun and Moon coordinate events are a separate referenced source. The Lahiri frame of the JPL sidereal catalog still uses Swiss-derived six-hour apparent correction anchors. Moon phase/Tithi is independent of ayanamsa, but Nakshatra, Yoga, Rashi, month naming and Samvat depend on accepted sidereal conventions. Calendar-visible V5, all Vrat/Festival/Muhurat decisions and SEO remain unchanged.

Next steps after inspecting the same-UT decomposition: resolve the source version/time-scale/coordinate-frame error at its implementation; independently verify a stated ayanamsa convention against a *third approved reference*; regenerate versioned source data and revalidate sunset/sunrise-sensitive and ritual calculations before release.
