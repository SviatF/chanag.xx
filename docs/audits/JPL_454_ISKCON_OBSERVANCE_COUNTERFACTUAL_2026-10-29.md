# PANCHVANI — JPL-driven Ekadashi/Mahadvadashi experiment (2026-10-29)

**Repository:** `SviatF/chanag.xx` (legacy PANCHVANI). **Research-only, not a production ritual engine.**

## Experimental design

Compare **454 Indian cities × two whole years (2026 and 2027) = 908 city-years**, 16 shards, against the *same original GCal 11 reference records* and an unchanged Swiss/Moshier comparator. GCal is **not an input to either JPL classifier**.

A. **Control:** original independent Swiss/Moshier sunrise and Arunodaya Tithi, Swiss Lahiri Nakshatra, existing independent rules.

B. **Physical intervention:** JPL DE440s exact Sun–Moon 12° phase Tithi, observed at **the same Swiss/upper-limb sunrise and Arunodaya (96 minutes before sunrise)**; preserve Swiss Nakshatra. Identical independent Mahadvadashi classification rules.

C. **Separate Nakshatra intervention:** JPL DE440s Tithi plus precomputed JPL Moon Nakshatra, tied to **Swiss Lahiri 6h measured anchor interpolation**, not an independently certified ayanamsa. Same independent rules.

Source identities: original GCal 11 SHA-1 Git blob `1d20f6e0caf29b6293157d258d02287e4edf0481`; JPL DE440s `4512` physical 6° transitions rooted in pinned kernel SHA-256 `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2`; sidereal SHA-256 `b898fefb8b23fd689c6c841828a6a2ff915df2e8c5cdd13cf3dfd9312b83a554`; Lahiri anchor SHA-256 `f5a346251079734c66187f3b068ca97f12fae0dbb5bf9373e3fcf863ad6c9e54`.

All original GCal source fast-day records retained. Additional JPL 12° near-dawn Ekadashi/Dwadashi probes run only when the entire -1/+8-day independent sidereal window lies inside the pinned physical catalog.

## Complete 454-city / 908-city-year results

Source: successful 16-shard [GitHub Actions run #40867727941](https://github.com/SviatF/chanag.xx/actions/runs/40867727941), aggregate `jpl-observance-454-aggregate.json`.

| Measure | Swiss baseline | JPL Tithi + Swiss Nakshatra | JPL Tithi + JPL Nakshatra |
|---|---:|---:|---:|
| Date disagreements against original GCal | 128 | **84** | **102** |
| Old date disagreements resolved | — | **44** | 50 |
| New date disagreements created | — | **0** | **24** |
| Bidirectional Mahadvadashi subtype disagreements | 104 | **73** | **82** |
| Old subtype disagreements resolved | — | **31** | 34 |
| New subtype disagreements created | — | **0** | **12** |

Checked **22,310 source case rows**, all **22,310 preserved unchanged** in JPL counterfactual. The augmented results include 22,322 rows, with 12 additional retained model-only review cases; all 908 city-years and 454 cities verified. All 19 GCal `after` source clocks remain authentic; **JPL Parana numerical times were NOT recomputed**.

**Interpretation:** the Tithi-only intervention produces a 34.4% reduction in date mismatches (44/128), and 29.8% in subtype mismatches (31/104), with **zero newly incorrect source comparisons** in this dataset. This is strong evidence of physical ephemeris effect, **not** independent certification of a tradition-specific ritual observance.

The JPL Nakshatra intervention eliminates more old cases but creates nontrivial new mismatches. It is **not eligible for public promotion**.

## Targeted 2027-03-04 Unmilani

13 original independent Unmilani subtype labels without matching source labels:
- **2** cease to be independently classified as Unmilani under JPL Tithi (Singrauli, Jagdalpur);
- **11** persist after the JPL physical-phase replacement.

**Do not claim 13 Unmilani fully corrected.** Most likely the remaining 11 require an independent tradition-rule investigation, with the correct Arunodaya and other calendar constraints.

## Targeted 2027-09-11/12 Vijaya

256 original source `Vijaya Mahadvadasi` labels were correctly matched by the old independent Swiss Nakshatra classifier; 3 additional independent Vijaya predictions not present as source subtypes remain in **Karnal, Panchkula and Amravati**.

Changing to the pinned JPL Moon Nakshatra **introduces 24 new date disagreement records across 12 actual cities**, each appearing on the shifted **11 and 12 September** pair; **12 new subtype disagreements**. The 12 cities are Betul, Delhi, Hoshangabad, Itarsi, Karaikudi, Madanapalle, Nizamabad, Palwal, Pudukkottai, Sonipat, Tiruchirappalli, Vaniyambadi.

This disagreement is localized to **Nakshatra-source / Lahiri-reference boundary** and **does not justify a silent JPL-Nakshatra rollout**. Next scientifically necessary experiment: determine the actual JPL Nakshatra ingress UT root and the original GCal / Swiss Lahiri horizon conventions for those exact cities, plus independent tradition definition of Vijaya and its fasting shift.

## Release constraints

- Original Swiss-based public calendar unchanged.
- Not yet certified: exact ISKCON/GCal ritual eligibility, Unmilani/Vijaya tradition-specific exceptions, JPL Parana numerical boundaries or independent Lahiri ayanamsa.
- **No automatic SEO page, festival, Muhurat, Ekadashi fasting or Parana publication.**
- JPL Tithi-only is a **candidate for separate staged end-to-end validation**, NOT a production migration approval.
- Preserve both old and new evidence snapshots and the full 16-shard comparison to enable independent reproducibility.

**Next priority:** isolate the remaining 84 date gaps and 73 subtype gaps with an independent rule audit using the *JPL-Tithi + Swiss-Nakshatra* baseline, and separately reconcile the 12-city Vijaya Nakshatra ingress at exact times, before implementing any public switch.
