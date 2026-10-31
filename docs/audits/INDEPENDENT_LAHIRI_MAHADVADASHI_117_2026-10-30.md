# PANCHVANI — independent Lahiri and documented Mahadvadashi decision-table audit (2026-10-30)

**Repository:** `SviatF/chanag.xx` (legacy PANCHVANI). **Research only; no published date, fast, Parana, Muhurat, festival or SEO change.**

## Pinned scientific sources

- Original GCal 11 Windows executable blob: `1d20f6e0caf29b6293157d258d02287e4edf0481`; complete original sunrise, Arunodaya and sunset XML for 1,360 relevant local days from [run 40684054890](https://github.com/SviatF/chanag.xx/actions/runs/40684054890).
- Independent JPL DE440s physical 4,512 six-degree Sun–Moon Tithi roots, kernel SHA-256 `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2` (source [run 40780053825](https://github.com/SviatF/chanag.xx/actions/runs/40780053825)).
- Independently computed Swiss/Moshier Lahiri Moon longitude at exact UT timestamps, numerical subsecond bisection of actual Moon Nakshatra ingress. Separately calculated JPL Moon ecliptic longitude with **Swiss Lahiri six-hour anchors**, catalog SHA-256 `b898fefb8b23fd689c6c841828a6a2ff915df2e8c5cdd13cf3dfd9312b83a554`. This is cross-ephemeris scientific evidence under the **same** ayanamsa frame, **not** an independent certification of that frame.
- Source-documented predicates extracted from [GCal Vaisnava Events Calculation](https://gopal.home.sk/gcal/docs/GCalVaisnavaCalculation.pdf), sections 1.3–1.4, and the [Swiss Ephemeris standard Lahiri methodology](https://www.astro.com/swisseph/swisseph.htm). The former describes implemented program algorithms, **not universal religious authority**.

## 117 independently examined city/date keys — complete inherited 454-city / 908-city-year baseline

Source: independently verified PR #158 JPL physical Parana/casebook (run **41063824469**). The original counts remain **84 date disagreements and 73 subtype disagreements** (117 unique keys). Each case has independent sunrise + Arunodaya + sunset Tithi and lunar Nakshatra, plus original-source exact GCal clock comparisons across its ten-day physical window.

| Source discrepancy group | Cases | Measured original clock discrepancy (JPL vs original GCal) |
|---|---:|---|
| Trisprśa | **22** | All **22** source current-day sunrise Tithi disagree with JPL, less than two minutes from a physical root |
| Paksha-vardhini | **27** | **25** disagree in the later full/new-Moon source sunrise window |
| Vyañjulī | **10** | **7** disagree on the immediately following sunrise |
| Unmīlanī | **11** | **10** disagree on the first Ekadashi morning's earlier Arunodaya; Bhimavaram is source-clock sensitive |
| Vijayā | **3** | Original GCal and pinned JPL agree on next-day Dhaniṣṭhā, while directly computed Swiss/Moshier Lahiri remains Śravaṇa |
| Date-only disagreements | **44** | Evaluated individually for current, previous and later source-clock differences |

Across all 117 event keys, **100** have at least one direct GCal/JPL Tithi mismatch within 120 seconds of an actual physical root in their own 10-day original source window; **17 do not**. Those 17 are **not thereby proven ritual-rule errors**: local sunrise observer convention, sunset states, repeated Nakshatra conditions and source version priority are still relevant. All cases retain their actual original GCal XML and independent physical inputs in the uploaded casebook.

## Direct quantitative Lahiri test — three September 2027 Vijaya risk cases

Independent Swiss/Moshier `SE_SIDM_LAHIRI` bisection yields an actual Śravaṇa→Dhaniṣṭhā ingress **54.796 seconds later** than independently computed JPL DE440s under Swiss Lahiri measured anchors.

Original GCal 2027-09-13 sunrise vs JPL ingress:
- **Karnal:** 40.164 s after JPL ingress, yet 14.632 s before the independently solved Swiss ingress.
- **Panchkula:** 43.164 s after JPL, 11.632 s before Swiss.
- **Amravati:** 42.164 s after JPL, 12.632 s before Swiss.

At these original GCal sunrise UT instants, **GCal+JPL = Dhaniṣṭhā**, while **Swiss = Śravaṇa**. Exact numerical root agreement is high-precision and reproducible; however a fully independent *Lahiri frame* requires another formulation of the ayanamsa tied to the official reference definition, not a second JPL calculation reusing Swiss anchors.

## Important independent GCal rule discrepancies

The documented GCal algorithm does **not** use the same sunrise repetition test for all four Nakshatra Mahadvadashi cases. In the source-documented Dvadashi decision table:
- **Vijaya:** Śravaṇa at sunrise with Gaura Dvadashi at **sunset**, without the other subtypes' following-sunrise Dvadashi requirement;
- **Jaya, Jayanti, Papanasini:** Punarvasu, Rohini, Puṣya at sunrise and Gaura Dvadashi at sunset **and next sunrise**;
- Structural candidates **Unmilani**, **Trisprśa**, **Vyanjuli**, **Paksha-vardhini** have separate predicates and rule order.

This is implemented in a **new, pure, nonpublishing decision table**, tested with synthetic positive and negative examples. The comparison oracle's source subtype name is never passed into the rule function.

In the present 117-case physical dataset, the independently documented rule table does **not** authorize a source-matching correction for the remaining 73 subtype mismatches. The **22** Trisprśa source events on 2026-07-11, 2026-11-21 and 2027-07-30 are particularly instructive: source GCal reports Ekadashi at sunrise with ~99.9–100% elapsed, but JPL phase is already Dvadashi at that very **same** sunrise. Treating Dvadashi-at-sunrise as a new, fake Trisprśa rule would be overfitting. The new decision table deliberately does not.

The local GCal sunrise/Arunodaya/solstice/observer configuration and full historical ritual priority still require further independent verification. The IAE-1985 Lahiri versus ICRC Lahiri definitions are **different technical conventions** in the Swiss documentation. Do not silently switch either.

## Release gate

- All original **908 city-years, 84 date and 73 subtype disagreement counts** preserved and verified against pinned source artifacts.
- All 117 residual case sunrise/Arunodaya/sunset observations computed independently; source labels only used after candidate generation.
- Exact UTC ingress root solved directly with Swiss and compared with JPL and original GCal source clocks.
- **No independent ayanamsa certification, no complete historical GCal rule-priority parity, no ritually approved Parana, no live site changes.**

**Next scientific task:** independent reference-frame/observer-convention adjudication of the remaining near-physical sunrise boundaries (especially 25 Paksha, 7 Vyanjuli and 22 Trisprśa), plus separate original-GCal-source and Gaudiya-tradition rule-priority validation of the remaining 17 cases without observed sunrise/Arunodaya Tithi disagreement. Only after these checks may a full 454-city alternate engine be proposed to a reviewer; no automatic publication.
