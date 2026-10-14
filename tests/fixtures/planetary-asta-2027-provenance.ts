/**
 * Wave 3J: externally observed source snapshots, NOT production Asta intervals.
 * Readers must not mix locality, source methodology or date precision.
 * Dynamic date widgets can vary by cookies/geo — quoted values are 2026-10-13
 * observation snapshots, not a live API feed.
 */
export type PlanetaryAstaSource={
  planet:"Jupiter"|"Venus";
  year:2027;
  locality:string;
  publisher:string;
  url:string;
  methodology:"observer-sensitive"|"fixed-angular-threshold"|"not-disclosed";
  precision:"minute"|"day";
  startLocal:string;
  endLocal:string;
  reviewedOn:"2026-10-13";
};

export const planetaryAsta2027Evidence:readonly PlanetaryAstaSource[]=[
  {
    planet:"Jupiter",year:2027,locality:"Mumbai, Maharashtra",publisher:"Drik Panchang",
    url:"https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=3206",
    methodology:"observer-sensitive",precision:"minute",
    startLocal:"2027-08-19T19:34",endLocal:"2027-09-13T05:46",reviewedOn:"2026-10-13"
  },
  {
    planet:"Jupiter",year:2027,locality:"Kolkata, West Bengal",publisher:"Drik Panchang",
    url:"https://www.drikpanchang.com/planet/asta/guru-asta-date-time.html?year=2216",
    methodology:"observer-sensitive",precision:"minute",
    startLocal:"2027-08-18T18:39",endLocal:"2027-09-13T04:42",reviewedOn:"2026-10-13"
  },
  {
    planet:"Jupiter",year:2027,locality:"New Delhi",publisher:"Birthastro",
    url:"https://www.birthastro.com/planet/combustion/guru-asta-dates-2027",
    methodology:"not-disclosed",precision:"day",
    startLocal:"2027-08-16",endLocal:"2027-09-15",reviewedOn:"2026-10-13"
  },
  {
    planet:"Jupiter",year:2027,locality:"New Delhi",publisher:"Swarn Siddhi",
    url:"https://swarnsiddhi.com/griha-pravesh-muhurat/2027/august",
    methodology:"fixed-angular-threshold",precision:"day",
    startLocal:"2027-08-16",endLocal:"2027-09-15",reviewedOn:"2026-10-13"
  },
  {
    planet:"Venus",year:2027,locality:"Wardha, Maharashtra",publisher:"Drik Panchang",
    url:"https://www.drikpanchang.com/planet/asta/shukra-asta-date-time.html?lang=en&year=4898",
    methodology:"observer-sensitive",precision:"minute",
    startLocal:"2027-07-22T05:20",endLocal:"2027-09-05T18:52",reviewedOn:"2026-10-13"
  }
] as const;

/** Never upcast a date-only or differently-located source to minute-accurate approval. */
export function assessAstaEvidenceForFiltering(
  planet:"Jupiter"|"Venus",year:number,locality:string
){
  const matching=planetaryAsta2027Evidence.filter(x=>x.planet===planet&&x.year===year&&x.locality===locality);
  const minute=matching.filter(x=>x.precision==="minute");
  const publisherCount=new Set(minute.map(x=>new URL(x.url).hostname.replace(/^www\./,""))).size;
  const incompatibleMethods=new Set(matching.map(x=>x.methodology)).size>1;
  return {
    sourceCount:matching.length,
    independentMinuteSourceCount:publisherCount,
    conflictingMethods:incompatibleMethods,
    /** Raw publisher count can NEVER certify ceremony eligibility.
     * Missing pinned city URL replay + observer-method matching + ritual Shuddhi. */
    readyForCeremonyFiltering:false as const,
    safeForCeremonyFiltering:false as const,
    status:publisherCount>=2&&!incompatibleMethods?
      "publisher-count-only-not-ritual-certified":"insufficient-local-minute-evidence"
  } as const;
}
