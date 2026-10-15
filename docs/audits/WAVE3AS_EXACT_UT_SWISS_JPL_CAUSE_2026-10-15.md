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

## Confirmed identical-time root-cause decomposition (99 physical UTC instants)

The first reproducible native C vs pure TypeScript Swiss measurement across 99 source-locked instants, including all 36 JPL Solar Rashi roots, found:

| Comparison | Largest absolute angular residual |
|---|---:|
| JS vs native **Delta-T** | **0.000000 seconds** |
| Sun tropical apparent ecliptic longitude | **54.872393 arcseconds** |
| Moon tropical apparent ecliptic longitude | **34.569666 arcseconds** |
| Sun/Moon *effective Lahiri* (tropical minus sidereal) | **17.284824 arcseconds** |
| Sun sidereal longitude | **37.850182 arcseconds** |
| Moon sidereal longitude | **17.284842 arcseconds** |

**Further direct source-code and native mean-ayanamsa test:** for all 99 UTC measurements, the `@typescriptify/sweph` *effective* Lahiri correction matches `pyswisseph.get_ayanamsa_ut(jd)`, i.e. the **native MEAN Lahiri**, to floating-point numerical precision (maximum discrepancy less than 1e-6 arcseconds in the initial evidence). By contrast, native C `tropical - sidereal apparent` differs from native mean by **5.421327–17.284824 arcseconds**. This establishes a specific **mean-versus-apparent sidereal-reference convention mismatch** contributing to Solar Rashi / Nakshatra / Yoga. It does **not** explain the separately measured **up to 54.872393 arcseconds tropical solar-position drift**; that remains an independent ephemeris/coordinate-model discrepancy.

**Delta-T is identical** at the measured instants; an UT↔ET correction cannot explain 929 seconds of root-clock divergence. Real differences exist in both the tropical sky-position output and in the Lahiri transformation. Therefore one cannot simply subtract 929 seconds or shift the event timestamps of all Solar Rashi dates.

### Implemented parallel frame-correction experiment

Wave 3AS now regenerates an **alternate six-hour Lahiri grid using native Swiss Ephemeris C** at all original anchor instants. It verifies the reviewed original input SHA, measures native Sun–Moon frame equivalence and interpolated midpoint error, and **does not overwrite** the original Wave3AO Lahiri/JPL source. Using the *same JPL DE440s binary and same precise root-solving algorithm*, it generates an independent alternate set of 7,096 lunar/solar sidereal transitions, then compares clock differences with the original and all 36 native-C Solar Rashi transitions. This is a test of the consequence of changing the reference-frame source, not a certification of the convention.

**Results of the full alternate calibration experiment (all 4,401 six-hour anchors and 7,096 JPL events):** the native-C Lahiri correction differs from the pure-TypeScript input by a maximum **17.400236 arcsec** across 2026–2028. Native-C correction midpoint interpolation error is **0.000648 arcsec**, and native Sun/Moon sidereal offset agreement is effectively exact. The same JPL DE440s 36 Solar Rashi transitions initially deviated from the native Swiss C crossing times by mean absolute **288.470 sec**, max **425.186 sec**; replacing **only** the Lahiri anchors reduces those discrepancies to mean absolute **0.557 sec**, max **1.753 sec**. **All 36/36 improved.** Different source-frame anchoring, not an arbitrary clock subtraction, is the confirmed reason for that bulk of the original JPL/native-C Solar Rashi disparity. The candidate rebuild now has a strict **3-second maximum physical transition-clock gate**, but remains research-only.

The TS-versus-native **tropical** Sun/Moon longitude drift is separate and unresolved. This experiment **does not** justify publishing a new religious calendar or moving the working V5 to V6 before independent observance/ayanamsa method approval.

**Release remains blocked:** choosing native Swiss C's Lahiri implementation is a new source policy requiring independent calendar/regional validation, not an automatic substitute for all visible PANCHVANI dates.

## Exact hold points

The JPL DE440s physical Sun and Moon coordinate events are a separate referenced source. The Lahiri frame of the JPL sidereal catalog still uses Swiss-derived six-hour apparent correction anchors. Moon phase/Tithi is independent of ayanamsa, but Nakshatra, Yoga, Rashi, month naming and Samvat depend on accepted sidereal conventions. Calendar-visible V5, all Vrat/Festival/Muhurat decisions and SEO remain unchanged.

Next steps after inspecting the same-UT decomposition: resolve the source version/time-scale/coordinate-frame error at its implementation; independently verify a stated ayanamsa convention against a *third approved reference*; regenerate versioned source data and revalidate sunset/sunrise-sensitive and ritual calculations before release.
