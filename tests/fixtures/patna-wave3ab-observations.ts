/**
 * Human-readable source observations for Patna 2027-01-31.
 * EVERY clock in these publisher pages is minute-rounded, or its rounding
 * policy is undisclosed. The sources do NOT give independent exact-second
 * Tithi and sunrise events under a shared observer + solar definition.
 * A domain is a publication, not an independently certified ephemeris.
 */
export const patnaJan2027PublishedClocks=[
  {
    publisher:"Dev Panchang",domain:"devpanchang.in",
    url:"https://devpanchang.in/en/panchang/patna/2027-01-31",
    locality:"Patna, Bihar",coordinatesStated:false,
    date:"2027-01-31",sunriseMinute:"06:33",navamiEndMinute:"06:34",
    sunriseTithiLabel:"Navami",reportedPrecision:"minute",
    exactSecondSunriseAvailable:false,exactSecondTithiEndAvailable:false,
    matchedSwissMethodProven:false
  },
  {
    publisher:"Astrology Divine",domain:"astrologydivine.com",
    url:"https://www.astrologydivine.com/31-january-2027-daily-panchang?country=India&date=2027-01-31&lang=en&lat=25.5941&lon=85.1376&place=Patna%2C+Bihar%2C+IN",
    locality:"Patna, Bihar",coordinatesStated:true,
    date:"2027-01-31",sunriseMinute:"06:33",navamiEndMinute:"06:33",
    sunriseTithiLabel:"Navami",reportedPrecision:"minute",
    exactSecondSunriseAvailable:false,exactSecondTithiEndAvailable:false,
    matchedSwissMethodProven:false
  },
  {
    publisher:"VedicSpace",domain:"vedicspace.com",
    url:"https://vedicspace.com/hi/panchang/patna/2027-01-31/",
    locality:"Patna, Bihar",coordinatesStated:true,
    date:"2027-01-31",sunriseMinute:"06:33",navamiEndMinute:"06:34",
    sunriseTithiLabel:"Navami",reportedPrecision:"minute",
    exactSecondSunriseAvailable:false,exactSecondTithiEndAvailable:false,
    matchedSwissMethodProven:false
  },
  {
    publisher:"Vedic Tithi",domain:"vedictithi.com",
    url:"https://vedictithi.com/calendar/hindu/city/patna/2027-01",
    locality:"Patna, Bihar",coordinatesStated:false,
    date:"2027-01-31",sunriseMinute:null,navamiEndMinute:"06:33",
    sunriseTithiLabel:"Navami",reportedPrecision:"minute",
    exactSecondSunriseAvailable:false,exactSecondTithiEndAvailable:false,
    matchedSwissMethodProven:false
  }
] as const;

export const sunriseMethodProvenance=[
  {
    publisher:"Swiss Ephemeris · Astrodienst",
    url:"https://www.astro.com/swisseph/swephprg.htm",
    statement:"Default rise = upper limb with refraction. Hindu rising requires center, no refraction, geocentric/no solar ecliptic latitude flags.",
    referenceType:"developer-method-documentation",
    exactPatna2027Observation:false
  }
] as const;
