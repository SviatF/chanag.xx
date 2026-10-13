import type {City} from "./cities";

/**
 * A reviewed religious-observance rule is NOT a generic astronomical clock rule.
 * Keep each reviewed closure explicitly scoped by event, city, year, and month.
 * Other local or household traditions may use different ceremonial calendars.
 */
export type VerifiedMuhuratClosure={
  code:"marathi-chaturmas-2026-august"|"marathi-chaturmas-2026-september"|"marathi-chaturmas-2026-october";
  event:"wedding";
  year:2026;
  month:8|9|10;
  convention:"Customary Marathi marriage calendar";
  observedPeriod:{from:string;through:string};
  reason:"Chaturmas";
  headline:string;
  explanation:string;
  alternativesNote:string;
  reviewedOn:string;
};

const MONTHS={8:"August",9:"September",10:"October"} as const;
type ReviewedMonth=keyof typeof MONTHS;
function verifiedMumbaiWeddingClosure(month:ReviewedMonth):VerifiedMuhuratClosure{
  const name=MONTHS[month];
  return {
    code:`marathi-chaturmas-2026-${name.toLowerCase()}` as VerifiedMuhuratClosure["code"],
    event:"wedding",
    year:2026,
    month,
    convention:"Customary Marathi marriage calendar",
    observedPeriod:{from:"2026-07-25",through:"2026-11-20"},
    reason:"Chaturmas",
    headline:`No traditional Marathi wedding Muhurat dates in Mumbai in ${name} 2026`,
    explanation:`${name} 2026 falls wholly inside the Chaturmas period of the reviewed customary Marathi wedding calendar. Under that convention, the month has no recommended marriage dates. A favorable Tithi, Nakshatra, Choghadiya or Abhijit clock period does not override this month-level observance rule. The general lunar/daytime screening model does not constitute a verified Vivaha Muhurat calendar.`,
    alternativesNote:`Marriage observances differ by community and tradition. Some other calendars and communities allow ceremonies during the months that customary Marathi calendars exclude. This ${name} 2026 result describes one specifically reviewed Marathi convention, not a prohibition for everyone in Mumbai or India.`,
    reviewedOn:"2026-10-13"
  };
}
const REVIEWED_MUMBAI_2026_MONTHS={
  8:verifiedMumbaiWeddingClosure(8),
  9:verifiedMumbaiWeddingClosure(9),
  10:verifiedMumbaiWeddingClosure(10)
} as const;

export function getVerifiedMuhuratClosure(event:string,year:number,month:number,city:Pick<City,"slug">):VerifiedMuhuratClosure|null{
  if(event!=="wedding"||year!==2026||city.slug!=="mumbai")return null;
  return REVIEWED_MUMBAI_2026_MONTHS[month as ReviewedMonth]??null;
}
