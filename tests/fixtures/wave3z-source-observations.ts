/**
 * Wave 3Z - hand-reviewed published city/date observations, not web scraping.
 * Two pages on drikpanchang.com are ONE publisher, NOT independent sources.
 * Do not infer algorithm/observer parity or a certified fast/Parana window.
 */
export const wave3zSourceObservations = [
  {
    city:"delhi",date:"2027-01-18",tradition:"Smarta",
    observation:"Pausha Putrada Ekadashi fast is published for January 18, 2027",
    observedFastingDate:"2027-01-18",
    publisher:"Drik Panchang",
    url:"https://www.drikpanchang.com/vrats/ekadashidates.html?geoname-id=1261481&year=2027",
    publishedCityPinned:true,independentlyMethodCertified:false
  },
  {
    city:"delhi",date:"2027-01-19",tradition:"Vaishnava",
    observation:"The same Delhi Ekadashi listing marks Jan 19 as Gauna Vaishnava / Trisparsha Mahadwadashi",
    observedFastingDate:"2027-01-19",
    publisher:"Drik Panchang",
    url:"https://www.drikpanchang.com/vrats/ekadashidates.html?geoname-id=1261481&year=2027",
    publishedCityPinned:true,independentlyMethodCertified:false
  },
  {
    city:"kanpur",date:"2026-11-21",tradition:"ISKCON",
    observation:"ISKCON Utthana Ekadashi fasting date printed November 21 even though the exact sunrise Tithi is boundary-sensitive",
    observedFastingDate:"2026-11-21",
    publisher:"Drik Panchang",
    url:"https://www.drikpanchang.com/iskcon/iskcon-ekadashi-list.html?geoname-id=1267995",
    publishedCityPinned:true,independentlyMethodCertified:false
  }
] as const;

/** Tradition METHOD references, not additional corroborated city/date publications. */
export const wave3zMethodSources = [
  {
    publisher:"ISKCON Juhu Mumbai",
    url:"https://www.iskconmumbai.com/blog/hare-krishna-blogs-1/how-to-calculate-ekadasi-fasting-days-10",
    topic:"96-minute arunodaya / vedha illustrative convention",
    cityDateChecked:false
  },
  {
    publisher:"GBC Vaishnava Calendar Committee",
    url:"https://github.com/gopaladasa/GCAL-for-Windows",
    topic:"Separate GCal-based Mahadwadashi and Parana conventions; this audit does not execute or compare GCal",
    cityDateChecked:false
  },
  {
    publisher:"Drik Panchang",
    url:"https://www.drikpanchang.com/iskcon/ekadashi/putrada/putrada-ekadashi-date-parana-time.html?year=2027",
    topic:"ISKCON GCal Mahadwadashi subtypes and distinct Parana convention",
    cityDateChecked:false
  },
  {
    publisher:"Pure Bhakti",
    url:"https://www.purebhakti.com/component/content/article?id=994",
    topic:"Different sunrise definitions and location-specific Mahadwadashi rules",
    cityDateChecked:false
  }
] as const;
