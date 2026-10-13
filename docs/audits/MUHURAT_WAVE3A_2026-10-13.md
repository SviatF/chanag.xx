# Wave 3A — Muhurat ranking and truth audit

## Confirmed design limitation
The existing v2 compressed Muhurat monthly snapshots record only Tithi and Nakshatra **at local sunrise**. They do not contain the Tithi/Nakshatra end times. The clock windows currently come from local favorable daytime Choghadiya and Abhijit after Rahu Kalam, Yamaganda and Gulika exclusions. Therefore the current **0–100** grade is *availability and continuity of planning references*, not a certificate that a lunar combination persists at each minute of a recommended window.

## Improvements shipped
- City and baseline monthly pages display a four-factor numerical breakdown of the top-ranked row: 40 continuity + 25 total clean time + 20 timing source labels + 15 Abhijit.
- Clarify that Tithi/Nakshatra are sampled at sunrise. Link directly to the matching city/day full Panchang, where the actual Tithi/Nakshatra end times can be checked.
- Never present the availability score as religious validity; even 100/100 does **not** imply Lagna, planetary combustion, Tara Bala, Chandra Bala, or full Panchang Shuddhi.
- Add a deterministic CI audit for **all committed 48 month shards / 338 city-month datasets / six event profiles** to check actual dates, exclusions, source containment, rankings, grade calculation and evidence-score consistency.
- Report number of rows with no clean window or 100/100 score. Those are not treated as certified Muhurat.

## Wave 3B engineering task (separate PR)
To fully validate the **clock-time lunar match**, extend the v2 Muhurat snapshot schema with the Tithi/Nakshatra transition times and local dates, regenerate 48 shards using Swiss Ephemeris, and clip timing suggestions against the active lunar intervals. This is a real calculation change involving all 338 datasets, so do not falsely claim it was completed in Wave 3A.

All page-count, indexation, canonical, robots, city and month rollout controls stay unchanged.


## Ranking saturation finding
The first full precomputed-matrix pass counted 3,921 score-100 rows out of
11,657 sunrise-screened event-date rows (~33.6%). The existing score is
an availability index and should not be read as unique ritual suitability.
The score weights remain stable in Wave 3A for compatibility; tied scores
and tied longest window are additionally ordered by *total unique clean time*,
then timing-source diversity, Abhijit survival and finally local ISO date.
A later score distribution redesign must be explicitly justified and tested,
not silently reweight 100s as a claim of improved religious accuracy.
