# PANCHVANI Wave 3T — Wedding / Griha Pravesh, Festival and Vrat evidence boundaries

**Date:** 2026-10-13. **Scope:** research and quality audit only. **Release status:** never automatically approve a ritual calendar date.

## Key semantic distinction
1. **Published national festival date** — an event/date pair printed by a calendar. A second publisher checking the same date is useful *publication-level corroboration*, **not** independent observer-specific festival-day or Puja-time certification.
2. **City-local astronomical reference** — computed sunrise, lunar Tithi, Pradosh, Nishita or moonrise. It describes local sky conditions, **not necessarily the ritual selection** dictated by a school/tradition.
3. **Tradition-specific ritual selection** — independent, appropriately regional rule review, sometimes Smarta versus Vaishnava, Bhadra-free period, Amavasya-at-Pradosh with Sthir Lagna, Dashami-Vedha/Parana, etc. This stage is NOT automatically supplied by one local Tithi observation.
4. **Reviewed Marathi month exclusion** — expressly reviewed customary Marathi Wedding 2025–2027, August/September/October; Griha Pravesh only August/September/October **2026**. The closure is scoped to the supported Maharashtra community and month. It is *not* proof of prohibited dates in another region, nor an astrologer's exact approved wedding window.

## Supporting published method statements
- [Drik Panchang — 2026 Lakshmi Puja, Nagari observer](https://www.drikpanchang.com/festivals/lakshmipuja/festivals-lakshmipuja-timings.html?geoname-id=1262240) describes the common local **Pradosh + Sthir Lagna + Amavasya** timing and explicitly warns against treating general Choghadiya as a Lakshmi Puja Muhurat.
- [Drik Panchang — 2026 Lakshmi Puja, Lviv observer](https://www.drikpanchang.com/festivals/lakshmipuja/festivals-lakshmipuja-timings.html?geoname-id=702550) demonstrates *different city-specific puja clocks* and carries explicit local-city caution; not a source for India's puja clocks.
- [GaneshaSpeaks marriage calendars](https://www.ganeshaspeaks.com/muhurat/2027/marriage-muhurat/) and [Hindu Blog Marathi calendar](https://www.hindu-blog.com/2025/05/marathi-vivah-muhurat-in-2026-marriage.html) were reviewed in the existing month-level closure ledger. They remain **monthly tradition evidence**, not minute-level approved Lagna.

## Wave 3T implementation
- `lib/ritual-evidence-matrix.ts` pure source-grade classification. A date is `two-publisher-date-corroboration` **only** when a second distinct registered publisher domain agrees with the primary event/year/date. Unexpected dates remain `published-date-mismatch`; two mirror URLs from one publisher count once. None automatically validates local ritual date or exact Puja clock.
- The date ledger has **38 maintained festival-year records (19 per year)**; **7** second-publisher checks on **7 distinct festival-year keys** as currently authored; 31 only have the first publisher. These checks are date-only, primarily general Indian calendars; do not claim 6 verified regional festivals.
- Traditions such as **Rama Navami 2026 Smarta March 26 / ISKCON March 27** are explicitly retained as variants, not called a source discrepancy and not blindly published to every city.
- `auditVratSunriseRows` validates ordered local sunrise dates, Tithi/Paksha, repeated sunrise observations, actual post-sunrise transitions and sequence. It **never** concludes Ekadashi fasting day, Dashami Vedha rule, exact Parana, Purnima Shraddha, or Amavasya ritual eligibility.
- The CLI `scripts/wave3t-ritual-evidence-audit.ts` audits the entire 2026/27 festival catalog, **four reference cities** (Mumbai, Pune, Delhi, Chennai) × **two years** × **three Vrat sunrise types** (24 city-year-type checks), and limited Wedding/Griha source-reviewed month exclusions with control cities in other states. These counts are *engineering coverage*, not a percentage of ritually validated India-wide observations.
- Keeps the existing 2027 festival city-level SEO release gate **closed**; no additional pages added to sitemap or Google index.
- CI runs `npm run audit:ritual-evidence` and archives `wave3t-ritual-evidence-matrix`. Existing `npm run audit:muhurat`, `npm run audit:festivals` remain distinct, heavier domain checks and should not be confused with this audit's release gate.

## Known unresolved uncertainties
- Drik festival calendar snapshots can depend on the rendered observer; date sources labeled Delhi/Haryana cannot certify ritual date or 24+ clock for every Indian city.
- A "100/100" Muhurat score is **availability of daytime clean windows**, not suitability of wedding, Griha Pravesh, personalized Lagna or religious certification. Wave3S's Guru/Shukra Asta observer evidence remains **0/300** independent same-city, same-method benchmark-ready.
- **Diwali**: derived Pradosh alone is not an approved Lakshmi Puja time; exact Amavasya overlap + Sthir Lagna needed.
- **Janmashtami**: Nishita reference alone does not choose Smarta vs Vaishnava, Rohini, fasting or Parana.
- **Raksha Bandhan**: Purnima sunrise alone does not prove Bhadra exclusion throughout all eligible ritual hours.
- **Chhath**: next sunrise is a geographic sky event; ritual fasting / Arghya rule validation is separate.
- **Ekadashi**: sunrise tithi list cannot be marketed as a tradition-correct "fasting calendar" without Dashami Vedha, lunar boundary convention and next-day Parana.
- The Vrat Swiss Ephemeris computation currently relies on sunrise Tithi classification; this audit checks shape and chronology, NOT independent astronomical ephemeris accuracy, and therefore deliberately does not claim external scientific validation.

## Approval gate for later waves
Source localities must be genuinely pinned; two independently derived same-tradition data points and documented rules need to agree on the exact festival-specific event choice. Only then can a human reviewer consider a change to indexed, region-specific ritual pages with versioned source provenance. **If proof is missing: UNKNOWN, not APPROVED.**

No updates in Wave 3T to `lib/muhurat.ts`, `lib/vrat.ts`, `lib/festivals.ts`, `lib/festival-expansion.ts`, precomputed shards, robots, canonicals or sitemap. Hence this wave is safe for the recent SEO quality safeguards.
