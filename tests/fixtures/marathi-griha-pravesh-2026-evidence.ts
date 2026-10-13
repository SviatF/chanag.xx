/** Audit-only sources, no third-party branding shipped to runtime. */
export const reviewedGrihaPravesh2026={
  event:"griha-pravesh",year:2026,months:[8,9,10],state:"Maharashtra",
  expectedDates:0,convention:"Reviewed Marathi house-entry calendar",
  sources:[
    {publisher:"Hindu Blog Marathi 2026",locality:"Maharashtra customary calendar",url:"https://www.hindu-blog.com/2023/11/marathi-griha-pravesh-dates-2024.html",verdict:"no August, September or October Griha Pravesh dates",limitation:"No per-city clock precision; community differences acknowledged"},
    {publisher:"Drik Panchang Pune 2026",locality:"Pune, Maharashtra",url:"https://www.drikpanchang.com/shubh-dates/griha-pravesh-dates-with-muhurat.html?geoname-id=1259229",verdict:"No Shubh day in August, September, October",limitation:"Reasons include lunar months and planetary Asta; not validated for every exact municipality clock"},
    {publisher:"LivePanditJi 2026 October",locality:"Delhi baseline, secondary corroboration",url:"https://www.livepanditji.com/muhurat/griha-pravesh/october-2026/",verdict:"October zero",limitation:"Not Maharashtra-specific; not used for local clock"},
  ],
  // Published alternatives must be retained even when the reviewed convention
  // excludes the month. Otherwise the audit would conceal method disagreements.
  conflictingCalendars:[
    {publisher:"GaneshaSpeaks Griha Pravesh 2026",locality:"General Hindu calendar / location not matched to Pune",url:"https://www.ganeshaspeaks.com/muhurat/2026/griha-pravesh-muhurat/",verdict:"august-september-october-nonzero",exampleDates:["2026-08-15","2026-09-17","2026-10-23"],reason:"different source methodology not reconciled; no universal all-India zero-day claim"},
  ],
  observedOn:"2026-10-13"
} as const;
