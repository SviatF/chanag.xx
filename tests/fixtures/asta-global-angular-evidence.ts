/**
 * Wave 3R exact public source observations, reviewed 2026-10-13.
 * VedicMarga is published in Nepal Time (+05:45); Swarn Siddhi uses IST.
 * Different hostnames are NOT proof their calculation code is independent.
 *
 * These belong to a nonlocal angular-convention research ledger, NOT the
 * city-specific Asta observer ledger or ceremony eligibility engine.
 */
import type {AngularSource} from "../../lib/asta-global-angular-evidence";
const base={methodFamily:"fixed-angular-threshold" as const,reviewedOn:"2026-10-13"};
export const globalAngularEvidence:readonly AngularSource[]=[
  {
    ...base,planet:"Jupiter",year:2025,publisher:"VedicMarga",
    url:"https://vedicmarga.com/transit/jupiter/combust/",
    geographicScope:"nonlocal-angular",timezone:"Asia/Kathmandu",precision:"minute",
    startLocal:"2025-06-09T17:58",endLocal:"2025-07-10T00:34"
  },
  {
    ...base,planet:"Jupiter",year:2026,publisher:"VedicMarga",
    url:"https://vedicmarga.com/transit/jupiter/combust/",
    geographicScope:"nonlocal-angular",timezone:"Asia/Kathmandu",precision:"minute",
    startLocal:"2026-07-14T18:19",endLocal:"2026-08-13T16:09"
  },
  {
    ...base,planet:"Jupiter",year:2026,publisher:"Swarn Siddhi",
    url:"https://swarnsiddhi.com/griha-pravesh-muhurat/2026",
    geographicScope:"city-labeled-angular",printedCity:"New Delhi",
    timezone:"Asia/Kolkata",precision:"minute",
    startLocal:"2026-07-14T18:04",endLocal:"2026-08-13T15:53"
  },
  {
    ...base,planet:"Jupiter",year:2027,publisher:"VedicMarga",
    url:"https://vedicmarga.com/transit/jupiter/combust/",
    geographicScope:"nonlocal-angular",timezone:"Asia/Kathmandu",precision:"minute",
    startLocal:"2027-08-16T19:58",endLocal:"2027-09-15T03:28"
  },
  {
    ...base,planet:"Jupiter",year:2027,publisher:"Swarn Siddhi",
    url:"https://swarnsiddhi.com/griha-pravesh-muhurat/2027/august",
    geographicScope:"city-labeled-angular",printedCity:"New Delhi",
    timezone:"Asia/Kolkata",precision:"day",
    startLocal:"2027-08-16",endLocal:"2027-09-15"
  },
  {
    ...base,planet:"Venus",year:2027,publisher:"VedicMarga",
    url:"https://vedicmarga.com/transit/venus/combust/",
    geographicScope:"nonlocal-angular",timezone:"Asia/Kathmandu",precision:"minute",
    startLocal:"2027-07-06T20:58",endLocal:"2027-09-17T23:04"
  },
  {
    ...base,planet:"Venus",year:2027,publisher:"Swarn Siddhi",
    url:"https://swarnsiddhi.com/vivah-muhurat/2027",
    geographicScope:"city-labeled-angular",printedCity:"New Delhi",
    timezone:"Asia/Kolkata",precision:"day",
    startLocal:"2027-07-06",endLocal:"2027-09-17"
  }
] as const;
