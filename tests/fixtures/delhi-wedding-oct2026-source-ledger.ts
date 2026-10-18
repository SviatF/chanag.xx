/**
 * DATA-05 — 2026 October source-reviewed New Delhi Vivaha calendar.
 * These external sources are retained ONLY in an audit fixture, not runtime
 * UI or lib source. Exact locality and selection profile matter.
 *
 * 3 different publishers independently say zero approved wedding Muhurat
 * dates in October 2026; none is a certificate of planetary transit clocks
 * or of a religious prohibition for EVERY community or adjacent city.
 */
export const delhiWeddingOctober2026Sources=[
  {
    publisher:"Drik Panchang",
    city:"New Delhi, NCT",
    year:2026,month:10,eligibleDates:0,
    url:"https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?geoname-id=1261481&year=2026",
    sourceLine:"No Shubh day available for marriage in October",
    profile:"Published Vivaha Panchang Shuddhi; prohibited solar months and Shukra Tara Asta among exclusions",
    reviewedOn:"2026-10-18"
  },
  {
    publisher:"PanchangTime",
    city:"New Delhi, NCT",
    year:2026,month:10,eligibleDates:0,
    url:"https://panchangtime.com/muhurat/vivah-marriage/2026/10",
    sourceLine:"0 auspicious dates for Vivah (Marriage)",
    profile:"New Delhi civil-date selection and local Lagna windows; traditional season and planetary checks",
    reviewedOn:"2026-10-18"
  },
  {
    publisher:"MuhuratGuru",
    city:"Delhi",
    year:2026,month:10,eligibleDates:0,
    url:"https://muhuratguru.com/marriage-muhurat/delhi/october-2026",
    sourceLine:"Found 0 auspicious dates and 31 dates to avoid in October 2026",
    profile:"Delhi tradition-specific wedding and Godhuli-to-sunrise timing screening",
    reviewedOn:"2026-10-18"
  }
] as const;
