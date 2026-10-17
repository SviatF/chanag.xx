# PANCHVANI — CT3 Daily source-bound content (16 October 2026)

## Verified root problem
The earlier CT1 PR #130 attempted a wholesale deletion of the entire Daily Fingerprint and local geography / timing analysis. Its full rendered sitemap report found **2,505 high-risk pairs**, **2,418 severe pairs**, and **174 exact normalized duplicate groups**, despite 0 structural or visible fact-card errors. CT1 was **not merged**. The strict text comparison normalizes away numerals, dates, and URL tokens; it cannot tell source-backed numerical uniqueness from editorial padding. Zero duplicates alone also does not imply helpful content.

Current main (before CT3) includes `getDailyGuidance`, which maps Tithi/Nakshatra to loosely worded suggestions about leadership, career, buying, family, repairs and creativity. This is a dictionary heuristic, **not** a reviewed Hindu ceremony or general-purpose advice authority. It has been shown on public indexed Daily pages.

## Scoped code change
- Remove **only** the unsupported favorable-action and subjective timing-advice block from indexed Daily SSR.
- Add deterministic, **factual overlaps** between actual Abhijit / good-labelled daytime Choghadiya and Rahu / Yamaganda / Gulika. Exact clock intersection with overlap minutes is shown; for a genuine no-overlap day, explicitly say no intersections are calculated within this limited set. For example Mumbai 2026-10-16: Abhijit 12:01–12:47 shares 23 minutes with Rahu Kalam 10:56–12:24; Labh 08:01–09:29 overlaps Gulika by 88 minutes.
- Clearly distinguish a computed timing intersection from **ritual eligibility**; link to methodology and accuracy.
- Replace the invented 06:30–06:59 `mid-morning-edge sunrise` class with the observed `sunrise at HH:MM IST` without changing celestial data.
- **Preserve** the actual sunrise/Tithi/Nakshatra/Yoga/Karana/fact cards, day+night Choghadiya, dynamic dated transitions, geography and local analysis, all calendar cross-links, metadata and index eligibility. Long uniqueness narratives are not yet independently reviewed as useful and will be addressed with source-backed comparison rather than by blindly deleting them.
- Rendered Daily trust checker scans every indexed Daily sitemap HTML, preventing return of 'Traditional favorable signals', invented sunrise classes, missing methodology/accuracy links or missing evidence-status marker. Emit per-URL findings to the existing report and CI gate. No new claim of independent ephemeris proof.

## Search collapse hypotheses needing GSC access
Per `lib/seo-policy.ts`, indexed Daily window is [-14,+45] days for 20 baseline cities and [-3,+14] for Wave2 cities. Old Daily URLs **rotate to noindex** by design. Need compare indexing histories, Google-selected canonical, crawl/5xx, origin-vs-edge cache and top landing-page losses around 2026-09-13 through 2026-09-22. A live 2026-10-16 page cannot establish what Google crawled in mid-September. Do not attribute the 99% traffic loss solely to textual guidance without GSC data.
## Release gates
Panchang Quality CI must pass full 3,326-page rendered corpus: zero high/severe/exact text duplicates, canonical/hreflang and visible card regressions; new Daily SSR trust counter equal to indexed Daily pages, zero unsupported claims. No broad noindex. If CT3 introduces similarity issues, preserve indexed URLs unchanged and keep PR unmerged while improving actual local evidence.
