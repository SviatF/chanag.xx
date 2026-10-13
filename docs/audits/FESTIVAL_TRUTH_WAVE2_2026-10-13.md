# Wave 2 — Festival factual and semantic integrity

## Scope
- 19 published 2026 festivals, 17 maintained 2027 festival entries, 25 active cities.
- Independent source-ledger dates and all-city first-transition classification.
- No automatic indexing expansion; existing `festivalIndexYears()` gate must remain unchanged.
- No public disclaimer boilerplate or invented ritual clocks.

## Confirmed information problems
1. Sunrise Tithi is a momentary state, not the entire festival-day lunar state.
   Ganesh Chaturthi 2026-09-14 has sunrise Tritiya, followed by Shukla Chaturthi
   around 07:06–07:08; Vijayadashami in Hyderabad 2026-10-20 has Navami
   at sunrise and Dashami beginning approximately 12:51. Both should expose the
   target marker's actual start rather than imply the previous sunrise Tithi
   describes the complete observance day.
2. 2027 is missing Dhanteras (2027-10-27) and Chhath Puja
   (2027-11-04) in the maintained date inventory, confirmed by source ledger.
   `validateFestivalYear(2027).valid` remains false. Adding these entries would
   automatically expand indexable 2027 festival URLs. This Wave deliberately
   does not activate those routes; require an explicit future SEO rollout decision.
3. Rules requiring more than the first Tithi change (Bhadra, Nishita,
   Smarta/Vaishnava differences, Amavasya–Pradosh overlap) are not
   certified by a generic pujaRule field or Choghadiya score.

## Implemented corrections
- Explicit sunrise Tithi state, festival-specific target and first local
  Tithi transition. Note that the target *starts later* when this is
  ascertainable from the currently calculated sunrise state.
- Clear non-solar classification: Holi and Makar Sankranti do not receive
  fabricated festival Tithi transitions.
- Same semantics for parent festival pages using their Mumbai reference.
- Full maintained festival × active city audit, with unresolved lunar states,
  independent dated sources, structural year completeness, and machine-readable
  30-day report artifact.
- The audit does not treat a source-less claim as externally verified; the
  full 2026/2027 register still requires expanding the independent source ledger.

## Separate follow-up gates
- Resolve each unverified festival date in the maintained register against
  dated, location-specific observance sources; document variants.
- Implement festival-specific ritual-window eligibility (not approximated
  generic afternoon hours), with timed validation before any user-facing
  "Auspicious" claims.
- Approve 2027 activation separately only after completeness and GSC crawl
  backlog are reviewed.
- Run the full rendered sitemap audit for structural and text similarity after
  each patch.
