# PANCHVANI Wave 3AG — authenticated compact JPL V6 asset, coherent Daily / Vrat / Muhurat canary

**Release mode:** read-only V6 **canary**, main V5 mathematics and 48 committed monthly Muhurat shards remain unchanged. Date: 2026-10-14.

## Why this is new functionality and not another astronomy comparison

Wave 3AF already established that 454 canonical supported Indian city slugs × 1,096 days in 2026–2028 represent **497,584** enumerated local city-days, with **164,655** conservative near-transition independent JPL model checks and **226** sunrise-Tithi discrepancies versus Swiss/Moshier (80 in 2026, 54 in 2027, 92 in 2028). Raw data was archived by GitHub CI; full JPL DE440s SPK checksum was pinned.

Wave 3AG moves JPL 6° roots into the **actual repository**, byte-identically to the authenticated Skyfield DE440s generation, so a runtime V6 canary can use the same data without downloading a 32.7 MB SPK or running Python. It simultaneously runs side-by-side Daily, Vrat, and Muhurat clients against the existing V5 public engine and precomputed snapshots.

## 6° is the correct shared primitive

For geocentric apparent Sun–Moon ecliptic longitude difference:

- each **6-degree** root starts the next lunar half-phase, corresponding to a Karana boundary;
- a full Tithi is **12 degrees**, exactly two successive half-phases;
- each next Tithi endpoint, Karana endpoint, and previous new moon is computed from the **same event stream**. No midpoint estimates or global +42-second offsets;
- display clocks are rounded with the SAME local-nearest-minute convention as V5; raw UTC transition milliseconds remain retained.

The authentic **JPL DE440s / Skyfield 1.55** generator yielded exactly **4,512 events** over 2024-12-15 through 2031-01-15; JSON size **85,589 bytes**, expected raw SHA-256 \`0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e\`. Binary kernel SHA-256 \`c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2\`. The committed generated TypeScript module MUST match newly regenerated JSON **byte for byte** in the GitHub quality workflow. A damaged/replaced/missing source stops CI before a deploy.

## Read-only cross-family implementation

\`lib/jpl-v6-crossfamily-canary.ts\` owns one sunrise classification routine, with exactly the current V5 solar rise \`sweRiseTrans\` convention (upper limb, 1013.25 hPa, 25°C, zero elevation), and one JPL phase state.

1. \`compareDailyPanchangV6Canary(date,city,table)\` compares V5 and V6 Tithi, end date/time, Karana, end date/time at the **identical actual sunrise**. Existing Nakshatra/Yoga, Rashi, calendar month and Samvat remain Swiss/V5 and are not falsely certified JPL.
2. \`compareYearlyVratV6Canary(year,city,table)\` calculates V6 sunrise Ekadashi/Purnima/Amavasya references for EVERY India-local day of that year, and compares added/lost calendar days against unchanged V5 annual Vrat. Sunrise-Tithi reference != tradition fasting, Mahadvadashi, Smarta/ISKCON or approved Parana.
3. \`compareMuhuratMonthV6Canary(year,month,city,table)\` compares the complete month's actual V5 Panchang against a consistent JPL Tithi/Karana+boundary and checks any committed V5 shard Tithi still equals production. **Never recomputes or promotes auspicious scores** based on this preliminary input.
4. \`scripts/wave3ag-v6-crossfamily-canary-audit.ts\` emits a full CI JSON report including important Patna 2027-01-31, Kanpur 2026-11-21, Delhi 2026-06-30 and representative other cities, monthly and yearly differences.
5. The canary library and source asset are *not imported* by production \`lib/panchang.ts\`, \`lib/vrat.ts\`, \`lib/muhurat.ts\`, SEO routes, and Festival or Muhurat rankers.

## What is not approved, and the actual V6 production migration gate

- V6 astronomy is deterministic for **Tithi, next Tithi, Karana, next Karana, previous new moon** only, over source-supported dates. Solar rise still uses V5 Swiss settings to eliminate atmospheric comparison noise.
- Other Swiss sidereal Sun/Moon calculations for **Nakshatra, Yoga, Rashi, Hindu Month and Samvat** may depend on adjacent phase events. A unilateral runtime Tithi change without full cross-family reconciliation is forbidden.
- A city-specific Tithi swap can change auspiciousness scoring and Ekadashi/Janmashtami observance. **No independent local traditional rule selection, Vaishnava/Smarta approved Parana, Guru/Shukra Asta or priest-reviewed auspiciousness** follows from JPL numerical accuracy.
- To actually promote production V6: choose and document precision/method parity, add explicit \`LUNAR_ENGINE_VERSION\` to source signatures and cache namespace, convert *all* daily/Vrat/month/festival calculation dependencies, rebuild and commit **all 48 V5 precomputed Muhurat shards** (or a properly versioned replacement), validate complete city/date SEO output, canary sample high-risk 226 model flips and related festivals, and only then activate a controlled version switch in Workers.
- Do not make current live pages display "JPL verified" until they actually load the committed and independently regenerated V6 source and all numerical/ritual dependencies are coherently reviewed.

**Evidence stops a release on failure** instead of silently falling back to an incorrect Tithi or hidden calendar date.

The open astronomical/ritual evidence issue #82 remains OPEN.
