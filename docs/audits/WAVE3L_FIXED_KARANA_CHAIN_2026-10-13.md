# Wave 3L — wedding fixed-Karana continuity correction
**Date:** 2026-10-13. Source: established 11-Karana cyclic order and the existing reviewed wedding exclusion policy in PANCHVANI.

## Confirmed algorithmic error
Wave 3K correctly removed a sunrise-active forbidden Karana until its own transition but reopened later clock windows **even if the next half-Tithi was another forbidden Karana**. This affects the fixed terminal sequence:
`Shakuni → Chatushpada → Naga → Kimstughna`.

The prior implementation treated **Shakuni** and **Chatushpada** as if each were followed by an eligible Karana. Within the **same sunrise-active Tithi**, the following Karana in these cases is **also excluded**, so reopening intervals between the first Karana boundary and the current Tithi end was a false wedding-candidate window.

## Scoped fix
- For sunrise **Shakuni**, block through the **Tithi end** (Shakuni + Chatushpada).
- For sunrise **Chatushpada**, block through the **Tithi end** (Chatushpada + Naga).
- For sunrise **Naga**, block only until the observed **Naga end** (next is Kimstughna, not prohibited by this narrow filter).
- Keep **Vanija → Vishti** and sunrise-active **Vishti** behavior unchanged.
- Respect midnight: if the reviewed Tithi runs into tomorrow, all current-day clocks remain blocked where both halves are prohibited.
- Zero retained intervals yield score 0; this is **only** the Karana constraint, not complete ceremony eligibility.

## Regression
Added cases checking each pair, the terminal Naga exception, after-midnight Tithi, and zero surviving intervals. No alterations to Swiss Ephemeris / V4 snapshot schema, city coverage, sitemap, or indexation. This should not be generalized to other ceremonies without event-specific verified sources.

## Remaining limitations
Guru/Shukra Asta, Yoga, Lagna, region-specific monthly exclusions, and complete Shuddhi are not certified by this change. The Shakuni/Chatushpada/Naga subset is one explicit Karana filtering rule, not a source-verified full Vivah Muhurat approval.
