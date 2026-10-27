# Direct GCal binary execution research — 2026-10-27

The independent annual experiment in PR #145 read third-party GCal 11 Build 5
text exports. Those were **not evidence of direct execution** by PANCHVANI.

This stage verifies the actual original Windows GCal executable, downloaded
from the upstream `gopaladasa/GCAL-for-Windows` repository:
- Upstream ref: `9267f9fde9aefe2e60fb30c80a7ac9fc366fa585`
- Git blob SHA1 of original binary: `1d20f6e0caf29b6293157d258d02287e4edf0481`
- Path: `gcal_11c/gcal.exe` (Windows executable, not native Linux binary)
- Command syntax: GCal console specification for `-R calendar`,
  `-L lat;longitude`, `-N`, `-TZ`, `-SG`, `-EG`, `-O`.
- Run under clean Wine prefix with DISPLAY provided by xvfb.
- No reproduction or redistribution of original binary in repository.
- No changes to public fasting, Muhurat or site indexation.

**Important:** Archived binary `gcal_11c` is a different historical build
from GCal 11 Build 5 (released later). Differences may be caused by version
and astronomy models. The command is not "independent GCal source compilation";
that would require source code for the exact archived C++ Windows build.

The staged objective is strict:
1. Run binary, validate emitted output and provenance with output fingerprint.
2. Parameterize exact supported-city coordinates; run 2026 and 2027 in shards.
3. Reconcile every dated fast/Parana against the exported 11 Build 5 reference
   and a separate independent astronomical rule implementation.
4. Archive all disagreements; no public religious certification until resolved.

No claim of completion for all 454 cities until actual independent execution
artifacts and count checks are available.
