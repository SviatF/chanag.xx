# PANCHVANI — JPL residual observance and independent Parana audit (2026-10-30)

**Scope:** Legacy `SviatF/chanag.xx`, 454 Indian cities × 2026–2027 = **908 city-years**. Research only; the website, indexable SEO content, Muhurat, festivals and published fast/Parana have NOT been changed.

## Scientific provenance

- Original GCal 11 Windows native source SHA-1 blob `1d20f6e0caf29b6293157d258d02287e4edf0481`, with original dawn/Arunodaya/fast XML from source-only run [40684054890](https://github.com/SviatF/chanag.xx/actions/runs/40684054890).
- Actual geocentric JPL DE440s Sun/Moon physical 6° phase roots, 4,512 transitions, kernel SHA-256 `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2`. Actual Tithi intervals are **two consecutive physical 6° roots**; never halve a Tithi duration or apply a fixed 40-second correction.
- Research candidate classification is the unchanged pure, independent `classifyMahadvadashiSequence` using **JPL Tithi at independent Swiss upper-limb sunrise and Arunodaya**, plus Swiss Lahiri Moon Nakshatra. This is the better of the two PR #157 scenarios, but still **not independently ritual-certified**.
- Recomputed Parana uses JPL DE440s to establish Dvadasi/Trayodasi start/end, Swiss independent upper-limb sunrise/set (1013.25 hPa, 25°C) and, when necessary, independent Swiss Lahiri Nakshatra-end calculations. The original GCal numerical clocks are comparison **only**, not input.

## Residual 84 fasting-date and 73 subtype differences

The **84 fasting-date discrepancies** correspond to **42 pairs of consecutive days**, clustered on six pairs: June 25–26 (34 records), August 23–24 (12), December 4–5 (20) in 2026; March 18–19 (4), August 12–13 (8), September 11–12 (6) in 2027.

The **73 subtype discrepancies** occur on nine dates only:
- 2026-06-26: 17 Paksha-vardhini;
- 2026-07-11: 7 Trisprśa;
- 2026-08-24: 6 Vyañjulī;
- 2026-11-21: 6 Trisprśa;
- 2026-12-05: 10 Paksha-vardhini;
- 2027-03-04: 11 independent extra Unmilani;
- 2027-07-30: 9 Trisprśa;
- 2027-08-13: 4 Vyañjulī;
- 2027-09-12: 3 independent extra Vijaya.

There are **117 unique city/date keys** in the union of these discrepancy types. Every key has an independent ten-day physical JPL sunrise/Arunodaya window, exact next JPL Tithi transition and nearest physical boundary distance. A correct sunrise Tithi label alone does **not** settle Mahadvadashi, which also depends on source tradition rule priority.

## Quantitative JPL physical Parana result (verified full 16-shard research pass)

| Measure | Result |
|---|---:|
| Source GCal Ekadashi/Parana events accounted | 22,246 |
| GCal source fasting dates independently matched as fast | 22,204 |
| Method-matched JPL research candidates | 22,171 |
| JPL Parana start numeric clock comparisons | **22,152** |
| JPL Parana end numeric clock comparisons | **22,152** |
| Genuine source `parana.after` lower-only numeric comparisons | **19** |
| JPL Dvadasi physical intervals unavailable | 0 |
| Old comparable numeric Parana with new JPL residual >5m | **0** |
| Start residual >5 minutes | **0** |
| End residual >5 minutes | **0** |
| `after` lower-bound residual >5 minutes | **0** |
| Max start absolute clock deviation | **2 minutes** |
| Max end absolute clock deviation | **2 minutes** |
| Median absolute start / end residual | **0 / 0 minutes** |

**75 original GCal fasting cases remain incomparable as numerical *method* proofs**: 42 original fast dates which the JPL independent classifier does not choose, plus 33 mismatched Mahadvadashi subtype decisions. This is **not** 75 missing GCal XML clocks. The original 19 `after` clocks have no upper source bound, and no upper bound was invented.

A numerical difference ≤5 minutes **is not** approval to publish that fast/Parana: the independent ritual classification and Gaudiya/ISKCON rules remain under review.

## 11 Unmilani: actual original GCal clock evidence, not an assumed rule error

Original native GCal XML on **2027-03-03** in all eleven residual cities has Ekadashi at sunrise but **Dashami at Arunodaya** and marks Ekadashi *not suitable for fasting*. On 2027-03-04 it marks the second Ekadashi *suitable for fasting* (ordinary), not Unmilani.

The physical JPL Dashami→Ekadashi root is **2027-03-02 23:14:49.419 UTC**. At the *exact original GCal Arunodaya UTC*:
- **10 of 11 cities** have already entered Ekadashi according to JPL, disagreeing with GCal's source Tithi state;
- **Bhimavaram** is still Dashami according to JPL at the original clock; at its slightly later independently calculated Arunodaya, the JPL Tithi has already changed.

The 11 JPL root-to-original-clock distances range from **0.419 seconds before** to **81.581 seconds after** the JPL transition. Thus these cases are physically near-boundary and cannot be certified simply by treating two JPL Ekadashi sunrises as a universal Unmilani rule. Some disagreements are physical source-model differences at the *same original clock*; the Bhimavaram example additionally illustrates independent sunrise-clock sensitivity.

## 3 extra Vijaya: original GCal and JPL Nakshatra agree at source clocks

Original GCal XML confirms that on **2027-09-12** the three cities Karnal, Panchkula and Amravati have Gaura Dvadashi with Śravaṇa at sunrise but GCal observes its normal fast on September 11; on **2027-09-13**, GCal records **Dhaniṣṭhā** rather than Śravaṇa at sunrise.

The pinned JPL Moon Nakshatra 21→22 ingress is **2027-09-13 00:34:40.836 UTC**, so at the original GCal September 13 sunrise (about **40.164–43.164 seconds after the ingress**) JPL agrees with original GCal on **Dhaniṣṭhā**. The separate Swiss/Lahiri independent source used by the existing classifier still labelled that September 13 sunrise **Śravaṇa**, causing the three additional Vijaya candidates.

This identifies a **near-sunrise sidereal Nakshatra threshold conflict**, not permission to globally switch to JPL Moon Nakshatra. Previous PR #157 demonstrated that globally switching the sidereal source introduces 24 new fasting-date disagreements and 12 new subtype disagreements around the same Vijaya phenomenon.

## Release gate remains CLOSED

- Original GCal is a comparison oracle, **not** an astronomical authority or a classifier input.
- We have not independently certified historical ISKCON tradition-specific Unmilani/Trisprśa/Vyañjulī/Paksha-vardhini/Vijaya decisions. Exact attribution to old GCal's astronomical model versus deliberate observance policy requires reproducing its full predicate logic.
- JPL sidereal Nakshatra still uses measured Swiss Lahiri 6-hour anchors, not a fully independent ayanamsa.
- No JPL-based public fasting day, Parana, Muhurat, festival or SEO page is authorized.

**Next independent checkpoint:** implement explicit, source-documented decision-table rule tests for the nine subtype-date clusters; for the 2027-09-13 Śravaṇa→Dhaniṣṭhā crossover, solve Swiss/Moshier Lahiri ingress directly to UT and compare against JPL and GCal source clocks for each of the three cities, then re-run the 908-city-year parity/regression gate before any public engine change.
