# Native GCal 11 executable — independent process smoke test

Purpose: prove actual execution of original Windows `gcal.exe` with byte-identical Git blob `1d20f6e0caf29b6293157d258d02287e4edf0481` from `gopaladasa/GCAL-for-Windows/gcal_11c`. Run on a Windows GitHub Actions host; preserve stdout/stderr and generated XML.

The tested executable is distinct from `vaisnavacalendar.info` TXT exports. The source repository also supplies `gcal.chm`. The GCal command-line format is version-sensitive; failure is a blocker, **never** automatically treated as a pass.

This first workflow is deliberately **one-city smoke test** with exact provenance. A successful `delhi-2027.xml` is evidence of native binary execution only. It does not establish parity of city timezone, ayanamsa, JPL, Smarta fasts, Vedha, Hari Vasara, Mahadvadasi or Parana and must not be used to publish ritual recommendations.

After exact command/version validation, build a complete city registry and compare all event dates and Parana clock reasons; independently implement and test ritual rules against local astronomical roots. Retain existing `noindex`/non-certification gates.
