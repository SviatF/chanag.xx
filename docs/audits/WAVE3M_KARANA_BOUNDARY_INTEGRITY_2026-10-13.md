# Wave 3M — fixed Karana boundary integrity and truthful exclusion labels
**Date:** 2026-10-13  
**Scope:** wedding timing only; does not certify full ceremony eligibility.

## Confirmed remaining defect
The Wave 3L helper still accepted impossible clock evidence such as sunrise **Vishti** ending at 10:30 but its parent Tithi ending at 19:00. Vishti is the *second half* of its parent Tithi. Likewise terminal **Shakuni** and **Naga** cannot end hours before that Tithi ends. Unclipped windows supplied to the helper could therefore appear after a terminal forbidden Karana while still being within a contradictory Tithi. In addition, the monthly `avoidWindows` label always said *Vishti Karana (Bhadra)* even when the interval was caused by Shakuni, Chatushpada or Naga.

## Scoped correction
- Require terminal **Vishti, Shakuni, Naga** end instants to match their respective Tithi ends within **one rounded display minute**; otherwise fail closed.
- Require first-half **Chatushpada** to precede its Amavasya Tithi end by more than one rounded minute.
- Check the fixed name-to-Tithi pairing if the snapshot includes Tithi: Shakuni→Chaturdashi, Chatushpada/Naga→Amavasya, Kimstughna→Pratipada.
- Independently clip every Wedding Karana screen output to the parent Tithi end, even if the calling code unexpectedly skips the lunar clipping stage.
- Label local exclusion windows correctly: **Shakuni**, **Chatushpada and Naga**, **Naga**, or **Vishti (Bhadra)** for sunrise Vishti / inferred Vanija→Vishti.
- Correct the earlier synthetic tests that implicitly approved post-Vishti/Naga periods based on physically inconsistent terminal boundaries. Add regression cases for invalid evidence, defensive Tithi clipping and reason labels.

## Strict non-goals
No automated national Asta exclusions, no new ritual dates or traditions, no new claims of Lagna Shuddhi, no precomputed astronomical data or generated shards changed, and no URL/indexation/schema changes.

The 0–100 score is still only a planning-window score. Guru/Shukra Asta, full Wedding/Griha Pravesh eligibility, regional ceremonial methods, Festival/Vrat residual audits and independent GSC evidence remain open in Issue #82.

## Acceptance
Run Wedding Karana tests and full Muhurat Truth / quality / SSR and Cloudflare checks before merge. A passing CI means internal consistency, **not** independent validation of all local wedding dates.