import type {City} from "./cities";

/**
 * Source-reviewed **community convention**, not a claim about every ceremony
 * or every religious household in Maharashtra.
 *
 * Source ledger (including alternative approaches) is kept outside runtime in:
 * tests/fixtures/muhurat-closure-2025-27-evidence.ts
 * Do not infer partial July/November restrictions or transit/combustion dates.
 */
const MONTH_NAMES={8:"August",9:"September",10:"October"} as const;
type ReviewedMonth=keyof typeof MONTH_NAMES;
type ReviewedYear=2025|2026|2027;

export type VerifiedMuhuratClosure={
  code:string;
  event:"wedding"|"griha-pravesh";
  year:ReviewedYear;
  month:ReviewedMonth;
  cityName:string;
  convention:"Customary Marathi marriage calendar"|"Reviewed Marathi house-entry calendar"|"Published New Delhi Vivaha Panchang Shuddhi";
  /** Only populate when actual bounds have independent review. */
  observedPeriod?:{from:string;through:string};
  reason:"Chaturmas"|"Restricted lunar months and planetary Asta"|"Published monthly Vivaha prohibitions";
  headline:string;
  explanation:string;
  alternativesNote:string;
  periodNote:string;
  reviewedOn:string;
};

function isReviewedYear(value:number):value is ReviewedYear{
  return value===2025||value===2026||value===2027;
}
function isReviewedMonth(value:number):value is ReviewedMonth{
  return value===8||value===9||value===10;
}

export function getVerifiedMuhuratClosure(
  event:string,year:number,month:number,city:Pick<City,"name"|"state"|"slug">
):VerifiedMuhuratClosure|null{
  // Three independently published Delhi-specific calendars all show no
  // traditional Vivaha dates in October 2026; this is a published eligibility
  // finding, NOT the sunrise lunar-only algorithm's result and not a blanket
  // veto for neighbouring cities or individual community ceremonies.
  // Full audit-only URLs: tests/fixtures/delhi-wedding-oct2026-source-ledger.ts.
  if(event==="wedding"&&year===2026&&month===10&&city.slug==="delhi"){
    return {
      code:"delhi-vivaha-2026-october-published-closure",
      event:"wedding",year:2026,month:10,cityName:city.name,
      convention:"Published New Delhi Vivaha Panchang Shuddhi",
      reason:"Published monthly Vivaha prohibitions",
      headline:"No source-reviewed traditional Vivaha Muhurat dates in Delhi in October 2026",
      explanation:"New Delhi-specific published marriage-calendar lists independently show zero Shubh Vivaha dates for October 2026. The sources apply ceremony-season, solar-month and planetary-combustion exclusions in addition to Tithi/Nakshatra. These are PUBLISHED monthly eligibility outcomes; Panchvani has not independently recalculated every local Shukra/Guru Asta, Lagna or community-specific selection rule. An otherwise high 0–100 daytime availability score does not override these published marriage-calendar results.",
      alternativesNote:"The zero-date verdict is scoped to the independently reviewed Delhi marriage-calendar selection profiles, not a universal religious prohibition for every family, sampradaya, municipality or ceremony. Other communities and personal charts can use different rules; consult the relevant local tradition before scheduling a wedding.",
      periodNote:"Multiple independently maintained, locality-specific New Delhi Vivaha calendars list zero auspicious wedding dates during this entire Gregorian month, although they attribute individual-date exclusions to different rule families. Panchvani does not attribute a single invented Venus/Jupiter Asta clock or blanket Chaturmas boundary to every date.",
      reviewedOn:"2026-10-18",
    };
  }
  if(city.state!=="Maharashtra"||!isReviewedMonth(month))return null;
  const monthName=MONTH_NAMES[month];
  // Only 2026 has independently matched Pune + statewide Marathi Griha
  // Pravesh month-level exclusions. Do not copy these into 2025 or 2027.
  if(event==="griha-pravesh"&&year===2026){
    return {
      code:`marathi-griha-pravesh-2026-${monthName.toLowerCase()}`,
      event:"griha-pravesh",year:2026,month,cityName:city.name,
      convention:"Reviewed Marathi house-entry calendar",
      reason:"Restricted lunar months and planetary Asta",
      headline:`No customary Marathi Griha Pravesh Muhurat dates in ${city.name} in ${monthName} 2026`,
      explanation:`The reviewed Marathi Griha Pravesh calendar lists no standard house-entry Muhurat dates in ${monthName} 2026. Independent Pune Panchang data likewise reports zero auspicious days for the month, screening restricted lunar months and relevant planetary Asta periods. A favorable sunrise Tithi, Nakshatra, Choghadiya or Abhijit period alone is not sufficient to approve a formal Griha Pravesh.`,
      alternativesNote:`This result concerns formal Griha Pravesh according to the reviewed Marathi-calendar tradition, not a blanket prohibition on moving house, performing household puja or following another community's custom in ${city.name}. Individual family practices can differ. Other published general-purpose house-entry calendars list dates in these months under different methods; PANCHVANI has not reconciled those methods and does not assert that every tradition has zero auspicious dates.`,
      periodNote:`The customary 2026 house-entry calendars exclude this full month. They apply multiple month/planetary rules, so we do not claim that every individual day was rejected by an independently computed Shukra or Guru Tara Asta interval.`,
      reviewedOn:"2026-10-13",
    };
  }
  if(event!=="wedding"||!isReviewedYear(year))return null;
  const observedPeriod=year===2026?{from:"2026-07-25",through:"2026-11-20"}:undefined;
  return {
    code:`marathi-chaturmas-${year}-${monthName.toLowerCase()}`,
    event:"wedding",
    year,
    month,
    cityName:city.name,
    convention:"Customary Marathi marriage calendar",
    ...(observedPeriod?{observedPeriod}:{}),
    reason:"Chaturmas",
    headline:`No traditional Marathi wedding Muhurat dates in ${city.name} in ${monthName} ${year}`,
    explanation:`The reviewed customary Marathi marriage calendars list no marriage Muhurat days in ${monthName} ${year} during Chaturmas. A favorable Tithi, Nakshatra, Choghadiya or Abhijit clock period cannot, by itself, override this calendar-level restriction for families following that convention. A lunar/daytime screening result must not be called a verified Vivaha Muhurat.`,
    alternativesNote:`This zero-date result describes the customary Marathi marriage calendar, not a blanket prohibition for every family in ${city.name} or all of India. Community, lineage and local astrologers can use different traditions; the calculation methodology and individual marriage suitability remain distinct questions.`,
    periodNote:year===2026
      ?"For the reviewed 2026 Marathi calendar the approximately late-July to late-November Chaturmas observance covers this entire month. Exact start and end instants may differ by calendar convention."
      :`The independent ${year} calendar references agree this entire month has no customary Marathi wedding Muhurat. Exact Chaturmas boundary instants are not independently established here, so we do not apply a guessed partial-month exclusion.`,
    reviewedOn:"2026-10-13",
  };
}
