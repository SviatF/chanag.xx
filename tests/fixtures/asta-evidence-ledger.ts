/**
 * Research reference ledger, not a production eligibility feed.
 * Sources have mismatched localities and methods: do NOT average them.
 * These are human-reviewed public snapshots as of 2026-10-13, not live data.
 */
import type {AstaReference} from "../../lib/asta-reference-audit";
import {planetaryAsta2027Evidence} from "./planetary-asta-2027-provenance";

export const astaEvidenceLedger:readonly AstaReference[]=[
  ...planetaryAsta2027Evidence.map(row=>({
    planet:row.planet,year:row.year,locality:row.locality,
    publisher:row.publisher,url:row.url,method:row.methodology,
    sourceLocationMode:row.publisher==="Swarn Siddhi"?"publisher-pinned" as const:"geolocated-snapshot" as const,
    precision:row.precision,startLocal:row.startLocal,endLocal:row.endLocal,
    reviewedOn:row.reviewedOn
  })),
  // July/August 2026 Drik's Alibag observer; publisher uses a 24+ clock.
  // Aug 10 29:39+ means Aug 11 05:39 local, not Aug 10 05:39.
  {
    planet:"Jupiter",year:2026,locality:"Alibag, Maharashtra",
    publisher:"Drik Panchang",url:"https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?time-format=24plushour",
    method:"observer-sensitive",precision:"minute",sourceLocationMode:"geolocated-snapshot",
    startLocal:"2026-07-17T19:52",endLocal:"2026-08-11T05:39",
    reviewedOn:"2026-10-13"
  },
  // Independently generated 11-degree fixed-angular cutoff for NEW DELHI,
  // NOT an independent local observability verification for Alibag/Mumbai.
  {
    planet:"Jupiter",year:2026,locality:"New Delhi",
    publisher:"Swarn Siddhi",url:"https://swarnsiddhi.com/griha-pravesh-muhurat/2026",
    method:"fixed-angular-threshold",precision:"minute",sourceLocationMode:"publisher-pinned",
    startLocal:"2026-07-14T18:04",endLocal:"2026-08-13T15:53",
    reviewedOn:"2026-10-13"
  },
  // Date-only Delhi reference cannot validate a Mumbai/Wardha minute boundary.
  {
    planet:"Venus",year:2027,locality:"New Delhi",
    publisher:"Swarn Siddhi",url:"https://swarnsiddhi.com/vivah-muhurat/2027",
    method:"fixed-angular-threshold",precision:"day",sourceLocationMode:"publisher-pinned",
    startLocal:"2027-07-06",endLocal:"2027-09-17",
    reviewedOn:"2026-10-13"
  },
  // Additional Drik source using a 24+ time on the START boundary.
  {
    planet:"Venus",year:2027,locality:"Latur, Maharashtra",
    publisher:"Drik Panchang",url:"https://www.drikpanchang.com/planet/asta/shukra-asta-date-time.html?year=5786",
    method:"observer-sensitive",precision:"minute",sourceLocationMode:"geolocated-snapshot",
    startLocal:"2027-07-22T05:33",endLocal:"2027-09-04T18:59",
    reviewedOn:"2026-10-13"
  },
] as readonly AstaReference[];
