# PANCHVANI — exact JPL DE440s Tithi adjudication vs original GCal 11 (2026-10-28)

**Research only. No ritual, Muhurat or SEO date promotion.** This report concerns legacy `SviatF/chanag.xx`, not new PANCHAVANI.

## Source provenance

- **Original GCal 11 Windows executable** Git blob SHA-1: `1d20f6e0caf29b6293157d258d02287e4edf0481`.
- **Independent JPL DE440s** Sun/Moon phase transition table: **4,512** precomputed 6° UTC roots for 2025–2030. Kernel SHA-256 `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2`; pinned root source SHA-256 `0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e`. Exactly every **second** 6° root is a real 12° Tithi boundary: 2,256 actual Tithi boundaries. This uses Skyfield + the physically computed DE440s roots **already checked into the repository**; no fabricated phase corrections.
- **Swiss/Moshier** independently computes Sun/Moon apparent geocentric ecliptic angles at identical UTC instants, and the original upper-limb sunrise separately (1013.25 hPa, 25 °C).
- Original GCal XML dawn-trace artifact: run `40684054890`; verified 16-shard independent 908-city-year artifact: run `40684909084`.

GCal indexing 1–15 Krishna + 16–30 Gaura is **normalized** to independent indices 15–29 Krishna + 0–14 Shukla before comparing. Original GCal sunrise **IST HH:MM:SS** converted to UTC at exact seconds; independently recomputed sunrise is never substituted for the original clock when evaluating its recorded Tithi.

## Full-source scientific results

| Result | Verified |
|---|---:|
| Affected city-years | 100 |
| Original disputed event-date keys | 172 |
| Distinct fasting-day mismatches | 128 |
| Bidirectional Mahadvadashi subtype mismatches | 104 |
| Raw original GCal day rows examined | **1,360 / 1,360** |
| Precise Swiss dawn observations from previous 16 research shards | 1,144 |
| Independently recomputed additional Swiss dawn observations | **216** |
| GCal + Swiss + JPL identical Tithi at exact original GCal sunrise | **1,276** |
| JPL + Swiss agree, original GCal Tithi differs | **54** |
| JPL + GCal agree, Swiss/Moshier Tithi differs | **30** |
| Other three-way disagreements | **0** |
| Distinct exact Swiss vs JPL 12° Tithi transition roots solved | **12** |
| Median absolute Swiss–JPL transition offset | **41.664 seconds** |
| Largest absolute Swiss–JPL transition offset | **45.674 seconds** |

The 12 solved Swiss transition roots are **35–46 seconds earlier** than their respective JPL DE440s roots (with the current computation conventions). This is a measured astronomy-model difference, *not* permission to shift a religious observance by an arbitrary 40-second constant. Previously, original GCal vs Swiss sunrise times differed by at most **13.2 seconds**; those differences alone cannot account for many Tithi flips.

## Where the 172 cases concentrate (source/swiss/jpl window evidence)

For **each disputed event**, inspect exact original-source sunrise Tithi and Swiss/JPL Tithi in the surrounding **minus 2 to plus 9** local days. This window is intentionally broad enough to encompass later Paksha-vardhini checks. **It is not a causal proof** that every difference in the window determines the event.

| Observed evidence category | Event keys (of 172) | Fasting-date mismatches (of 128) | Subtype mismatches (of 104) |
|---|---:|---:|---:|
| At least one nearby day where JPL agrees Swiss and differs from GCal | **86** | **64** | **54** |
| At least one nearby day where JPL agrees GCal and differs from Swiss | **53** | **46** | **30** |
| All three agree on the observed Tithi in the full window | **33** | **18** | **20** |

Counts by event type overlap: **60 event keys** have both a date and subtype discrepancy. Every one of the 172 case windows has 12 days of physical comparisons; no original source day is omitted from the 1,360-row casebook.

### Most actionable nonastronomical review cluster

Of the **33** event keys with no observed Tithi state conflict:
- **13** additional independent `UNMILANI` labels on **2027-03-04** (GCal did not label them as this subtype), requiring a tradition-specific eligibility audit.
- **3 pairs** on **2027-09-11/12**, related to the independent `VIJAYA` Nakshatra subtype; resolving these **requires independently verifying the Lahiri Nakshatra**, not just a geocentric tropical Tithi.
- The other cases include specific Vyanjuli/Paksha and near-Arunodaya rule transitions requiring explicit independent sunrise/tithi boundary tests.

## Interpretation and publication guard

1. **JPL + Swiss disagree with GCal on 54 original-source sunrise rows.** This provides stronger evidence of source-model sensitivity than a purely Swiss-vs-GCal comparison. It does NOT by itself prove that a religious tradition must adopt JPL's date, since its observer and classification conventions also need verification.
2. **JPL + GCal disagree with Swiss on 30 rows.** These are candidates for improving the independent **physical Tithi** by replacing Swiss/Moshier with a verified JPL-based source, but the change must be tested in a parallel end-to-end classifier across all 454 cities, without overwriting the existing production algorithm.
3. The 33 source disagreement event keys whose 12-day windows show no sunrise Tithi conflict are **candidates for rule/Nakshatra-focused investigation**, not automatically a confirmed rule error. The original GCal executable does **not** expose an exact floating-point Tithi transition timestamp, so agreement at sample sunrise alone cannot certify which method is right.

### Follow-up engineering gates

- Build **JPL-dependent candidate observance** in a **separate, non-publishing research classifier**, passing in Tithi at sunrise and Arunodaya (JPL tropical Moon–Sun phase) while keeping the same independent rules. Compare all 908 city-years and verify zero previously correct fast-date/Parana regressions.
- Independently compare JPL-based Lahiri Nakshatra transitions for 2027-09-11/12 and the 13 Unmilani source-label discrepancies without using original GCal subtype names as algorithm inputs.
- Never relabel remaining 128 fast dates or 104 Mahadvadashi subtypes just to agree with the original GCal. An original-source discrepancy is a *comparison* result, not proof that the source is authoritative for all independent astronomical methods.

**Final verdict:** Scientific model attribution improved, ***ritual parity not yet achieved***. Publication and certification flags remain false for all generated artifacts.
