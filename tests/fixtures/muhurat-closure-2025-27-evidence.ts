/**
 * AUDIT-ONLY published marriage-calendar coverage, NOT imported by runtime.
 * These sources validate the customary Marathi 0-date monthly results,
 * not every municipal astronomical clock or exact partial-month boundary.
 */
export const marathiMarriage2025to2027={
  years:[2025,2026,2027],
  months:[8,9,10],
  locale:"Maharashtra",
  convention:"Customary Marathi Vivah",
  expectedDates:0,
  reviewed:"2026-10-13",
  sourcesByYear:{
    2025:[
      {publisher:"Hindu Blog (Marathi 2025)",location:"Maharashtra",url:"https://www.hindu-blog.com/2024/09/marathi-vivah-muhurat-in-2025-marriage-wedding-dates-maharashtra.html",months:[8,9,10],verdict:"all zero, Chaturmas",notes:"Customary calendar; local community exceptions explicitly acknowledged"},
      {publisher:"Drik Panchang (2025)",location:"Selu, Maharashtra",url:"https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?time-format=24hour&year=2025",months:[8,9,10],verdict:"all zero",notes:"Municipal clock reference Selu, not every city"}
    ],
    2026:[
      {publisher:"Hindu Blog (Marathi 2026)",location:"Maharashtra",url:"https://www.hindu-blog.com/2025/05/marathi-vivah-muhurat-in-2026-marriage.html",months:[8,9,10],verdict:"all zero, Chaturmas",notes:"Explicit tradition and community caveat"},
      {publisher:"Drik Panchang (2026)",location:"Chanda, Maharashtra",url:"https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0",months:[8,9,10],verdict:"all zero",notes:"One Maharashtra city, reviewed Shukra/solar/Chaturmas reasons"},
      {publisher:"Kalnirnay Online (2026)",location:"Maharashtra",url:"https://kalnirnayonline.com/",months:[8,9,10],verdict:"all zero",notes:"Calendar says dates under independent verification; corroborative only"}
    ],
    2027:[
      {publisher:"Mahalakshmi Calendar (2027)",location:"Maharashtra, Marathi",url:"https://mahalakshmicalendar.com/mahalakshmi-calendar-2027/",months:[8,9,10],verdict:"all zero",notes:"Published list; exact month boundary not established"},
      {publisher:"Hindu Blog (2027)",location:"North Indian convention, supportive not Maharashtra-specific",url:"https://www.hindu-blog.com/2026/02/hindu-marriage-dates-in-2027-good-dates.html",months:[8,9,10],verdict:"all zero",notes:"Geographic convention differs; weak corroboration only"},
      {publisher:"Drik Panchang (2027)",location:"New Delhi, not Maharashtra",url:"https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?geoname-id=1261481&year=2027",months:[8,9,10],verdict:"all zero",notes:"Precise locality mismatch; do not use for Maharashtra daily clock details"},
      {publisher:"Marathi Calendar (2027)",location:"Maharashtra, Marathi",url:"https://marathicalendar.com/kalnirnay-2027/",months:[8,9,10],verdict:"all zero",notes:"Independence from other Marathi calendar sites not established"}
    ]
  }
} as const;
