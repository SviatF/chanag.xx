# PANCHVANI Wave 3AT — Sankranti date impact of native Lahiri correction

Date: 2026-10-15. **This research changes no public route, sitemap, Vrat, festival, Muhurat, or V5 shard.**

## Established in Wave 3AS
The physically computed JPL Solar Rashi ingress roots differ materially when the effective Lahiri frame is extracted from the transpiled JavaScript Swiss instead of native Swiss C. With a native Swiss C Lahiri 6-hour grid, all **36** JPL Solar Rashi transitions in 2026–2028 moved closer to direct native-C Solar Rashi roots, with the previous severe residual reduced below 3 seconds. This is source-frame reconciliation **relative to native Swiss C**, not independent IAU/ritual certification.

## What Wave 3AT actually tests

For every one of the 36 ingress events we take a ±1-day Indian civil window and evaluate each affected civil date for all **454 canonical unique Indian cities**. Exact physical Swiss sunrise comes from the same observer method as public V5: `sweRiseTrans` at 00:00 IST, with latitude, longitude, sea-level, pressure 1013.25 hPa, and 25°C.

At this same instant, independently query both immutable JPL-sidereal transition catalogs:

- prior **Wave 3AO** SHA-pinned JS-Lahiri global root catalog;
- Wave 3AS **native-C-Lahiri** alternate root catalog, with its anchor byte SHA and verified all-36 native-C root clock counterfactual.

For every city/day where source policy changes **Solar Rashi at sunrise**, persist city, local date, physical sunrise UTC, original sign, native-frame candidate sign, and signed seconds to the two separate JPL event clocks. Group and count affected cities by date/event, while never changing public Sankranti selection rules.

## Scientific limitations and release gate

A sign transition near sunrise can change the **sunrise reference** for Sankranti, but a festival or fasting date is **not** automatically sunrise-only. The ritual convention may use exact Sankranti moment, sunset, local observance, regional rules, or temple tradition. The API returns a research summary and refuses production promotion: `independentLahiriPolicyApproved=false`, `ritualSankrantiDatesApproved=false`, `productionV6ReleaseAllowed=false`.

The old JPL catalog remains untouched; native-C candidate is only present in CI research artifacts, not Cloudflare deployments. The next stage must independently approve the frame/ayanamsa method and evaluate regional festival-day rules before altering publication.

## CI acceptance

The exact-head Quality job regenerates original and alternate kernels/anchors, typechecks the Wave 3AT code, runs every city sunrise in the 36-event windows (about 49,000 observations), archives the result, and executes all prior Next.js/SEO/Cloudflare verification. Existing 3AQ and V6 staging jobs stay required. The new gate fails if any source hash/identity changes, any sunrise has the wrong IST date, or a source difference jumps more than one solar sign.
