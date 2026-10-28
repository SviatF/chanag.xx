# PANCHVANI — GCal original 454-city residual adjudication (2026-10-28)

## Purpose

This work addresses **remaining disagreements, not 128 newly approved ritual dates**. Original GCal 11 Windows executable Git-blob fingerprint: `1d20f6e0caf29b6293157d258d02287e4edf0481`. Baseline: 454 cities × 2026–2027 = **908** complete city-year records, independent Swiss/Moshier astronomical screen, genuine original GCal XML source comparison.

After PR #153 the comparison has:
- **128 candidate-date disagreements**, paired across 14 calendar days (64 independently extra, 64 missed source fasts);
- **104 bidirectional Mahadvadashi subtype disagreements**: 87 GCal subtype absent/mismatched, plus 17 subtype predicted independently but absent in GCal;
- **119 Parana without a full start-and-end numeric interval**: 100 cases with conflicting Mahadvadashi classification + **19 genuine one-sided GCal `after="HH:MM"` Parana**. The latter have a real lower time bound but no upper bound, and must be compared as open-ended conditions.

## Major city-specific groups

| Date pair / cluster | Count of date disagreements | Astronomical investigation |
|---|---:|---|
| 2026-06-25/26 | 48 | Later Purnima -> Pratipada sunrise falls near Tithi transition; Paksha-vardhini may flip |
| 2026-08-23/24 | 22 | Dvadasi -> Trayodasi at following sunrise, Vyanjuli may flip |
| 2026-12-04/05 | 26 | Later Amavasya -> Pratipada at sunrise, Paksha-vardhini |
| 2027-03-18/19 | 8 | Sunrise near Tithi change, Ekadashi / Kshaya/Viddha |
| 2027-08-12/13 | 16 | Dvadasi -> Trayodasi next sunrise, Vyanjuli |
| 2027-06-14/15 | 2 | Paksha-vardhini overtrigger candidate in Bongaigaon |
| 2027-09-11/12 | 6 | Nakshatra-based Vijaya predicted independently but not labeled in source |

The list is exhaustive for date disagreements: **48+22+26+8+16+2+6=128**. Separately, unmatched *subtype-only* cases include 2026-07-11, 2026-11-21, 2027-07-30 and 2027-03-04.

## Scientific method

We do **not** force independent Tithi or Nakshatra to the original GCal label. For each independently observed sunrise and Arunodaya, the new research calculation records actual Tithi at **minus five and plus five minutes** (and at the following sunrise). This is a **sensitivity analysis** for distinguishing minute-scale astronomical-convention drift from a pure ritual-rule bug, *not* authority to accept either date or to assume a five-minute error margin.

The downstream adjudication ledger refuses any unaccounted Parana gap and classifies these separately:
- original GCal XML has an **after-only** lower-bound clock (19; compare the lower bound only);
- source / independent Mahadvadashi method not comparable (100);
- unexplained numeric gap (CI failure).

All entries keep exact city, year, date, source/independent subtype, independent sunrise and Nakshatra diagnostics and uncertainty flags. **Complete reconciliation is NOT astronomical parity**. No public ritual certification, Muhurat publication, or SEO expansion.

## Independent documentary evidence

- GCAL GBC source: https://gopal.home.sk/gcal/docs/GCalVaisnavaCalculation.pdf
- GCAL astronomical calculations: https://www.gopal.home.sk/gcal/docs/GCalAstronomyDocumentation.pdf
- Independent description of Vyanjuli, Trisprsa, Paksha-vardhini: https://www.vaisnavacalendar.info/calendar-events/ekadasi-dwadasi-caturmasya/trisprsa-mahadvadasi

Next substantive prerequisite: reproduce the *exact GCal solar-horizon/refraction convention* and the Tithi / Nakshatra boundary in a second independent astronomy model, then contrast the original GCal 11 executable outputs. GCal original XML replays for the 19 after-only cases provide sunrise and Arunodaya sample nodes but do **not** include a full per-event transition trace needed to assert that the source or the independent model is physically correct for every borderline event.


## Corrected original GCal XML source proof (2026-10-28)

The initial 908-city-year `gcal-native-all-cities.ps1` parser extracted only XML attributes `parana.from` and `parana.to`, discarding `parana.after`. This created a false claim of 19 empty reference clocks.

The **original pinned executable** was replayed for the exact 19 affected city-years in GitHub Actions run **40680871432**, and the raw original XML was inspected. **All 19 contain `<parana after="HH:MM" />`**, not an empty Parana event:

- 14 city-years in Gujarat on **24 Aug 2026**: original GCal `after="10:50"`.
- 5 city-years in Northeast India on **3 Apr 2027**: original GCal `after="09:17"`.

Independent Swiss/Moshier research already computed an open-ended `from` bound for these examples (Rajkot 10:49, Dimapur 09:15 local). This is promising **lower-bound agreement**, not a valid reason to fabricate a source `to` time.

Corrections in this PR preserve the `after/before` attributes in future original GCal exports and feed the **pinned raw XML proof** to the full 454-city comparator. The aggregate is required to confirm **19 one-sided lower-bound comparisons and zero residuals >5 minutes**, separately from the 22,127 two-sided Parana pairs. The 100 subtype disagreements still block valid numerical comparison. Public ritual approval stays false.
