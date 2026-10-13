/** Audit-only evidence: not imported into public runtime and not rendered. */
export const reviewedMarathiMarriageOctober2026={
  route:"/muhurat/wedding/2026/10/mumbai",
  convention:"Customary Marathi marriage calendar",
  year:2026,
  month:10,
  expectedWeddingDates:0,
  observedPriorDates:5,
  sources:[
    {publisher:"Hindu Blog",locality:"Maharashtra, Marathi calendar",url:"https://www.hindu-blog.com/2025/05/marathi-vivah-muhurat-in-2026-marriage.html",verdict:"zero"},
    {publisher:"Drik Panchang",locality:"Chanda, Maharashtra (not Mumbai)",url:"https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0",verdict:"zero"},
    {publisher:"LivePanditJi",locality:"Delhi baseline (not Mumbai)",url:"https://www.livepanditji.com/muhurat/marriage/october-2026/",verdict:"zero"},
    {publisher:"AstroSage",locality:"unspecified page convention",url:"https://t.astrosage.com/2026/marriage-muhurat-2026.asp",verdict:"lists-Oct-4-5-6-conflict"},
  ],
  observedOn:"2026-10-13"
} as const;

/**
 * 2026 August and September: cross-check independently by publisher and
 * explicitly preserve calculation locality. These are NOT Mumbai-clock sources.
 */
export const reviewedMarathiMarriageAugustSeptember2026={
  months:[8,9],
  city:"mumbai",
  year:2026,
  convention:"Customary Marathi marriage calendar",
  expectedMarriageDates:0,
  sources:[
    {publisher:"Hindu Blog",locality:"Maharashtra / Marathi 2026",url:"https://www.hindu-blog.com/2025/05/marathi-vivah-muhurat-in-2026-marriage.html",verdict:"August and September each zero due to Chaturmas"},
    {publisher:"Drik Panchang",locality:"Chanda, Maharashtra (NOT Mumbai)",url:"https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0",verdict:"no Shubh day in August or September"},
    {publisher:"LivePanditJi",locality:"Delhi, NOT Mumbai",url:"https://www.livepanditji.com/muhurat/marriage/august-2026/",verdict:"August zero due to Chaturmas (secondary check only)"},
  ],
  observedOn:"2026-10-13",
} as const;
