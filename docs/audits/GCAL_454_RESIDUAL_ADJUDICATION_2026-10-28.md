# PANCHVANI — GCal original 454-city residual adjudication (2026-10-28)

## Purpose

This work addresses **remaining disagreements, not 128 newly approved ritual dates**. Original GCal 11 Windows executable Git-blob fingerprint: `1d20f6e0caf29b6293157d258d02287e4edf0481`. Baseline: 454 cities × 2026–2027 = **908** complete city-year records, independent Swiss/Moshier astronomical screen, genuine original GCal XML source comparison.

After PR #153 the comparison has:
- **128 candidate-date disagreements**, paired across 14 calendar days (64 independently extra, 64 missed source fasts);
- **104 bidirectional Mahadvadashi subtype disagreements**: 87 GCal subtype absent/mismatched, plus 17 subtype predicted independently but absent in GCal;
- **119 Parana without comparable numeric endpoints**: 100 cases with conflicting Mahadvadashi classification + 19 GCal records with blank reference clocks. The last 19 cannot be truthfully numerically compared.

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
- source GCal reference clock absent;
- source / independent Mahadvadashi method not comparable;
- unexplained numeric gap (CI failure).

All entries keep exact city, year, date, source/independent subtype, independent sunrise and Nakshatra diagnostics and uncertainty flags. **Complete reconciliation is NOT astronomical parity**. No public ritual certification, Muhurat publication, or SEO expansion.

## Independent documentary evidence

- GCAL GBC source: https://gopal.home.sk/gcal/docs/GCalVaisnavaCalculation.pdf
- GCAL astronomical calculations: https://www.gopal.home.sk/gcal/docs/GCalAstronomyDocumentation.pdf
- Independent description of Vyanjuli, Trisprsa, Paksha-vardhini: https://www.vaisnavacalendar.info/calendar-events/ekadasi-dwadasi-caturmasya/trisprsa-mahadvadasi

Next substantive prerequisite: reproduce the *exact GCal solar-horizon/refraction convention* and the Tithi / Nakshatra boundary in a second independent astronomy model, then contrast the original GCal 11 executable outputs. The source calendar text does **not** include the GCal sunrise/subtype calculation trace needed to assert that the source or the independent model is physically correct for every borderline event.
