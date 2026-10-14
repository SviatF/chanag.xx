# PANCHVANI Wave 3W — post-V5 production integrity and independent source caveats

**Date:** 2026-10-14. **Repository:** SviatF/chanag.xx. **Scope:** exact UT-correct computational cross-family integrity, actual published city-page evidence and editorial truthfulness. **NOT** a claim of 100% verified India-wide religion-specific ritual correctness.

## Live deployment verified after Wave 3V

Post-merge main commit `679fe2f15373830a95cb2e40c6355853e2e7e35d` has **four successful checks**, including Cloudflare Workers, main Panchang Quality, Muhurat Truth Audit and Content Truth Audit.

Live page [Delhi 2026-06-30](https://panchvani.com/panchang/delhi/2026-06-30) renders **Krishna Pratipada** and sunrise 05:27. [Delhi 2026 Purnima year](https://panchvani.com/vrat/purnima/2026/delhi) contains **June 29, not June 30**, consistent with the UT-correct Purnima ending approximately 40 seconds before June 30 sunrise. This confirms the user-visible mathematical regression was corrected after the full V5 shard migration.

Live [Kanpur 2026-11-21](https://panchvani.com/panchang/kanpur/2026-11-21) renders **Shukla Dwadashi**, sunrise 06:32 and Uttara Bhadrapada. These are *time-scale-model computations*, not a certified Ekadashi fasting prescription.

## Exact boundary-sensitive external observations

### Kanpur 2026-11-21 — observance vs sunrise classification

- [Vaya Kanpur](https://vaya.so/tools/panchang?d=2026-11-21&l=kanpur) shows Ekadashi until **06:31** and sunrise **06:31:49**; no seconds on the Tithi endpoint.
- [Astro Vedic Kundali Kanpur](https://astrovedickundali.in/panchang/kanpur/2026-11-21/) shows Ekadashi until **06:32**, sunrise only 06:31 (minute-rounded), and labels the day Ekadashi. Its solar event definition, Tithi calculation and rounding are not established to match our Swiss model.
- [Drik Panchang ISKCON Kanpur](https://www.drikpanchang.com/iskcon/iskcon-ekadashi-list.html?geoname-id=1267995) selects **Nov 21 Utthana Ekadashi fast** and separately reports the Tithi ends at 06:31. It demonstrates that a **fast date is not necessarily identical to the sunrise-Tithi index**. This is not evidence of a broken V5 calculator.

### Patna 2027-01-31 — genuinely unresolved external locality/method mismatch

- [Dev Panchang city-pinned Patna page](https://devpanchang.in/en/panchang/patna/2027-01-31) shows **Navami until 06:34** and sunrise **06:33**, thus claims Navami at sunrise at minute precision.
- V5 UT-correct PANCHVANI's same-city dawn math labels **Dashami**.
- [LivePanditji Patna monthly table](https://www.livepanditji.com/panchang-in/patna/january-2027/) prints Dashami for Jan 31 but its disclosure says the **Tithi/Nakshatra correspond to national/New Delhi data**, not independently Patna-pinned. Do **not** upgrade this to a second city-method validation.
- Status: **unresolved** until primary source's actual UT Sun/Moon times, sunrise definition, coordinates and observer method are pinned to the **second**; avoid claiming the Navami vs Dashami outcome is independently proven by another publisher.

### Lucknow 2027-09-17 — second-rounding ambiguity

- [Vaya Lucknow](https://vaya.so/tools/panchang?d=2027-09-17&l=lucknow) prints Pratipada ending **05:52** and sunrise **05:52:27** without endpoint seconds.
- [BDA Lucknow Krishna Dwitiya series](https://www.bda.ai/_functions/tithiPage?city=lucknow&slug=krishna-dwitiya&year=2027) prints Dwitiya beginning **05:52** (minute precision). This is consistent with the new label but does not independently settle the seconds.
- V5 dawn = Dwitiya mathematically; exact-second external method comparison remains **unverified**, and no fast or Parana recommendation may be inferred.

The three references are **not the whole population** of sunrise-sensitive days in India. They are specifically prioritized *published-source ambiguity cases* from the six post-migration Tithi-name changes.

## Release safeguard and implemented user trust improvements
- `lib/critical-boundary-notices.ts` contains three **explicit** city/date source-review notices, with named publisher URLs, their precision limitations, and `fastOrCeremonyDateCertified:false`.
- Only the matching three **daily Panchang** pages display a short source-review box. This transparently discloses external disagreement instead of silently promoting the raw sunrise Tithi to a fasting or Muhurat verdict. No algorithmic lunar calculation is overridden, no calendar event dates or noindex rules changed.
- `components/Header.tsx` replaces the misleading blanket **“Validated festival dates / Validated year directories”** with **“Published dates · observance varies / Maintained annual calendar”**. There are only **7/38** dates with a second published year-level comparison, **31/38** with one publisher only, and **zero independently ritual-certified** exact city-specific festival clocks. Maintaining a catalog and validating ISO date shape are not independent festival-date verification.
- New required CI audit `npm run audit:boundary-integrity`: 7 city/day historical V5 Tithi checks (6 changed labels + Delhi Purnima false-positive), compares live daily-engine output against committed Muhurat V5 snapshot where present and yearly Vrat sunrise-day classification for the supported three Tithis. Emits `artifacts/wave3w-boundary-evidence-consistency.json`. It reports closest UT-accurate transition distance **in seconds**, legacy ET-vs-UT sensitivity, source notice, exact city, verification gaps. **No source scraping in CI**; publisher evidence is from human-inspected frozen URLs and is not scored as independently methodology-certified.
- Audit failure triggers on mismatching mathematical calendar engines or stale snapshots, but it will **never** count publisher-day agreement as ritual eligibility, personal Shuddhi, Asta proof, or a scientific error bar.

## Unresolved full correctness program
- **Asta:** 0/300 independent same-city/same-phenomenon Guru/Shukra observations reached the release-method gate. A local Vrat time fix is NOT a Guru/Shukra Asta ritual convention validation.
- **Wedding/Griha:** existing Marathi custom month closures are scoped to named conventions; unresolved Lagna/Chaturmas/observer methodology outside reviewed region cannot be auto-promoted.
- **Festival:** 38 maintained 2026–27 dates; 7 national date second-publisher comparisons, none proving the exact city-local Puja window. 2027 indexed local festival expansion remains held. 2027 Janmashtami Smarta/Vaishnava selection cannot be reduced to Ashtami-at-Nishita.
- **Vrat:** Sunrise Ekadashi Tithi != correct Smarta/ISKCON fast day; independently sourced Dashami Vedha, exceptional Ekadashi rules and next sunrise Parana windows remain unresolved.
- **SEO:** CI 3326/3326 URLs with no duplicate/structural issues checks page structure/content similarity, **not** Google index/click recovery. Do not assert search visibility has improved absent connected Search Console export.

**Release rule:** never mark a religion-specific fast, ceremony or Puja window as “validated” until same-city independently reviewed *method and observer* plus applicable tradition rules are documented. The strong deterministic solar/lunar CI does not substitute for these primary external checks.
