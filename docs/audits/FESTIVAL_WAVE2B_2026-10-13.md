# Wave 2B — controlled 2027 dates and actual next-sunrise value

## Confirmed source-backed corrections
- **2027-10-27 Dhanteras**, corroborated by the dated India Hindu
  festival listing: https://www.drikpanchang.com/festivals/month/festivals-october.html?year=2027
- **2027-11-04 Chhath Puja Sandhya Arghya**, local New Delhi 4-day sequence:
  https://www.drikpanchang.com/chhath/chhath-puja-calendar.html?geoname-id=1261481&year=2027
- The 2027 maintained registry becomes complete (19/19).
- **Indexation release remains explicitly limited to 2026** in
  `lib/festival-expansion.ts`. Completion is NOT publication authorization;
  future 2027 release needs a separate reviewed commit and GSC assessment.
- No new sitemap URLs or active cities are added.

## Meaningful Chhath information improvement
The main Chhath festival date has **Sandhya Arghya** at the evening sunset,
followed by **Usha Arghya at the next local sunrise**, not sunrise earlier on
the same date. The city content derives the next sunrise from the terminal
night Choghadiya window; the date is explicitly +1 local civil day. A missing
window produces an audit failure, never an invented time.

## Ritual validation state
Diwali Pradosh, Janmashtami Nishita, Raksha Bandhan Bhadra and Karwa Chauth
moonrise references are screened in each active city as **context calculations**.
No full Lagna, Bhadra, Smarta/Vaishnava or ceremony Shuddhi is claimed by
these screenings. A future patch must independently validate full eligibility
before marking any precise ritual Muhurat certified.

## Coverage gap still open
Independent date fixtures remain limited compared with the full 38-row ledger.
Structural completeness and 950 city×festival calculations alone do not
prove tradition-specific correctness for all observances.
