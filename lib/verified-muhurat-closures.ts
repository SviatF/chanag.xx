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
  event:"wedding";
  year:ReviewedYear;
  month:ReviewedMonth;
  cityName:string;
  convention:"Customary Marathi marriage calendar";
  /** Only populate when actual bounds have independent review. */
  observedPeriod?:{from:string;through:string};
  reason:"Chaturmas";
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
  if(event!=="wedding"||city.state!=="Maharashtra"||!isReviewedYear(year)||!isReviewedMonth(month))return null;
  const monthName=MONTH_NAMES[month];
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
