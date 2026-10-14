# PANCHVANI Wave 3AC — genuinely independent Sun/Moon model differential

**Research scope:** 2026-10-14. This is the independent model cross-check requested after 3AB; it does NOT certify a ritual fast, a Parana window, any Janmashtami date, or wedding eligibility.

## Independence and traceable methods

**Production Panchvani V5:** \`@typescriptify/sweph\`, Swiss Ephemeris-compatible Moshier flags, \`sweCalcUt\` (correct UT to TT handling), default apparent upper-limb rise/refraction, sea-level 1013.25 hPa/25 C.

**Independent Astronomy Engine 2.1.19, used only by CI:**
- independent \`SearchRiseSet(Sun, Observer(lat, lon, 0m), rising)\`: apparent upper-limb sunrise with its own refraction formula/atmosphere assumptions
- independent \`MoonPhase(Date)\` and \`SearchMoonPhase(288°, ...)\`: geocentric Sun–Moon ecliptic elongation and the Krishna Navami → Dashami crossing
- lunar model: Brown / Improved Lunar Ephemeris from the 1954 Nautical Almanac; not a Swiss Ephemeris wrapper
- independently handled time scale and Sun/Moon planetary models; no integration into production Panchang, Vrat, festival, SEO or muhurat selectors
- exact date, observer latitude/longitude and elevation are included in machine-readable CI evidence. Independent code source: [cosinekitty/astronomy](https://github.com/cosinekitty/astronomy); [API reference](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md).

### Why independent is not equal to definitive
This is **one additional independent approximation**, not a JPL high-precision DE440 oracle, not a second-precision match from DrikPanchang/Dev Panchang with their hidden settings, and not a licensed traditional calendar. The ephemeris and sunrise algorithms use different solar refraction, ΔT, lunar theory and ecliptic coordinates. Any remaining tens-of-seconds discrepancy demands *more* investigation, not source popularity voting.

## Exact Patna diagnostic

Target local date: **2027-01-31**. Swiss V5 reference from 3AB: **06:33:40 IST upper-limb sunrise**, **≈06:33:30 IST Navami→Dashami**, only a **10-second gap**. Hindu geometric-center sunrise ~06:37:25 IST. Published Dev Panchang / VedicSpace (Navami until 06:34) and other publisher minute-only clocks are not independently method-pinned to seconds.

This wave runs the **independent sunrise and independent 288° crossing**, then prints four independent/mixed Tithi comparisons:
1. Swiss lunar model at Swiss sunrise
2. independent Brown lunar model at Swiss sunrise
3. Swiss lunar model at independent sunrise
4. independent lunar model at independent sunrise

The result is a **model-sensitivity comparison**, not an automatic approval of any printed Navami/Dashami label. Difference fields are signed **independent minus Swiss** in seconds; raw ISO UTC and IST instants are recorded.

## Eight Arunodaya diagnostic cases

Run the independent lunar theory on **2026-05-26** and **2027-10-25** for Delhi, Kanpur, Mumbai and Chennai — eight geographic-date pairs identified in Wave 3AB, not eight different festival days. For each independent sunrise, compare:
- independent Dashami phase at Swiss-derived Arunodaya (96 minutes before apparent rise)
- independent Dashami phase at independent Arunodaya
- independent Ekadashi phase at independent sunrise

These tests show if a 3AB **mathematical screen** survives an independently implemented lunar model. **Neither positive nor negative results determine a Vaishnava/Smarta/ISKCON fasting date:** Kshaya Ekadashi and Mahadvadashi classification remain missing, along with a GCal or institution-published complete local observance selector.

## Acceptance criteria
- Package version pinned in **devDependencies only**; live runtime never imports independent model.
- Tests reject malformed ISO dates, prove the separate model actually computes Moon phase + sunrise, and compare root chronology.
- CI emits \`artifacts/wave3ac-independent-astronomy-evidence.json\` with raw instants, differences, model agreement/disagreement, and **unconditionally false** ritual certification.
- Fatal CI error if old model no longer matches published site, phase root cannot be bracketed, sunrise differs over 15 minutes, lunar boundary over an hour, or one of eight cases is missing. Ordinary moderate model discrepancies **must be retained as evidence**, not cosmetically made to pass by rewriting dates or changing solar rise convention.
- Exact PR head must pass full automated tests, production compilation, 3326-page SEO gate and Workers build before merge.

## Decision boundary
Even if the two models agree on Dashami, **the Patna source-method dispute is unresolved** until a reliable external observer/clock/ephemeris source gives reproducible UT-second results. If the two models differ near the 10-second boundary, **do not claim V5 is 100% correct**, and obtain high-precision JPL/other independent corroboration before touching any city/date/day assignment.

**No production calendar dates, ritual approvals, Muhurat selection, 2027 index gates or SEO routes changed by this wave.**
