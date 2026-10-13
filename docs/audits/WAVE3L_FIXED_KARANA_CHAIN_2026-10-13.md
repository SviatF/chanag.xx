# Wave 3L — wedding Chatushpada → Naga continuity correction
**Date:** 2026-10-13. The fix is scoped to the traditional fixed Karana order and the currently reviewed wedding-only prohibition.

## Confirmed defect
Wave 3K stopped a sunrise-active **Chatushpada** prohibition at its own end, thereby potentially reopening a reference wedding window for the subsequent **Naga**, which is likewise prohibited **within the same Amavasya Tithi**. This could create incorrect clean-time recommendations.

The four terminal Karana positions occur as: **Shakuni (Krishna Chaturdashi second half) → Chatushpada (Amavasya first half) → Naga (Amavasya second half) → Kimstughna (Shukla Pratipada first half)**.

Importantly **Shakuni and Chatushpada are in different Tithis**; the ordinary Tithi clipping already prevents carrying Shakuni wedding windows across that boundary. Do not extend Shakuni's exclusion into Amavasya based on stale sunrise Tithi evidence.

## Safe scoped algorithm
- **Chatushpada at sunrise:** with verified Karana end and Tithi end, exclude until the **current Amavasya Tithi end**; Naga is still prohibited in the same Tithi.
- **Shakuni at sunrise:** exclude until actual Shakuni end, which is also the Tithi boundary; never infer an intra-Tithi second prohibited Karana.
- **Naga at sunrise:** exclude until Naga end; the next Kimstughna belongs to a new Tithi, whose eligibility must be independently evaluated.
- **Vishti** and **Vanija→Vishti** remain unchanged.
- If Amavasya ends next civil day, blocked current-day hours remain blocked through the last available minute.
- This rule filters *time windows*, not full wedding ceremony approval; additional planetary and tradition-specific checks remain open.

## Tests
Deterministic regression checks Chatushpada→Naga full-Tithi exclusion, distinct Shakuni/Tithi boundary, Naga terminal handling, after-midnight Tithi, old Vishti behavior and invalid evidence. Both Chatushpada and Naga must not reappear as certified windows.

No astronomical engine, generated V4 snapshots, event types beyond Wedding, index policy or city expansion is modified.
