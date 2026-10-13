# Wave 3I — Time-bound Yoga and Karana evidence (no ritual suitability claims)

**Goal:** Daily Panchang must not imply sunrise Yoga and Karana apply throughout the entire day. The previously implemented `getPanchang` calculated their **labels only at sunrise**, whereas end instants were stored only for Tithi and Nakshatra.

## Implementation
- `lib/panchang.ts` now calculates `yogaEnd`, `yogaEndDate`, `karanaEnd`, `karanaEndDate` by refining the first transition after the city's **actual local sunrise** using the existing Swiss Ephemeris/Moshier, Lahiri sidereal Yoga and tropical Sun–Moon elongation/6 Karana segmentation.
- Preserve explicit next-day local civil dates and fail on missing or invalid transitions; ensure first Karana transition cannot be later than the parent Tithi transition.
- Daily Panchang and expanded date lookup display `Yoga at sunrise · until [time and civil date]` and `Karana at sunrise · until ...` instead of misleading permanent values.
- No changes to Muhurat's event eligibility, scoring, precomputed shard schema or religious calendar dates. A transition instant is an astronomical observation, **not** proof that Yoga/Karana are suitable for a ceremony.

## Independent data fixtures
The regression uses **two independent publishers** for Mumbai 13 October 2026:
- [Drik Panchang Mumbai](https://www.drikpanchang.com/marathi/panchang/marathi-day-panchang.html?geoname-id=1275339): Priti Yoga until **20:24 IST**, Taitila Karana until **10:46 IST**.
- [AstroLeaf Mumbai](https://astroleaf.in/panchang/mumbai-maharashtra-india/2026-10-13/): Priti Yoga until **20:24 IST**, Taitila Karana until **10:47 IST**.
- [Drik Delhi](https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=989920): Priti until **20:24**, Taitila until **10:46**.

The test accepts ±2 minutes to account for small implementation/reference differences. It also covers four cities and three solar/lunar-season dates, including a post-midnight transition check through explicit civil dates. This is a sampled independent comparison, **not a claim of full 2025–2027 verification**.

## Deployment root-cause follow-up: user-provided failed Cloudflare log
The earlier log's compilation and export succeeded. The failure was exclusively the subsequent `npx wrangler deploy`: `Cannot use assets with a binding in an assets-only Worker.` This indicates the Cloudflare build/deploy settings produced an assets-only artifact without the expected vinext Worker entrypoint. `wrangler.jsonc` in the repo already has a `main: "worker/index.ts"` and `assets.binding: "ASSETS"`; preserve both for application runtime.

**For the connected Cloudflare Worker, use**:
- Build command: `npm run build` (includes `vinext build`, not a bare `next build`)
- Deploy command: `npm run deploy:vinext` (delegates to `vinext-cloudflare deploy`, not bare `npx wrangler deploy`).
- Verify Cloudflare project root is this repository and does not use an outdated imported Pages/assets-only pipeline. If the dashboard currently overrides the commands with `next build` and `npx wrangler deploy`, **the dashboard settings must be changed there**; a PR cannot edit those remote settings.
- CI passes on vinext build, but a GitHub CI success alone does not certify Cloudflare's particular UI build command. Inspect the actual user-facing Cloudflare deployment and request headers afterwards.

## Acceptance
1. Targeted tests pass, including external Yoga/Karana clock references, with correct signed date handling and bounds.
2. Complete Panchang Quality CI and rendered content audit pass (no sitemap, canonical, noindex expansion).
3. The live Delhi/Mumbai 2026-10-13 daily page should display Yoga/Karana ending clocks after the updated Worker is deployed.
4. Full ceremony-specific Asta, Amanta/Purnimanta edge month examples, and remaining external festival/vrat comparisons remain open in #82.
