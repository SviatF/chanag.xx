import type {City} from "./cities";

/**
 * A reviewed religious-observance rule is NOT a generic astronomical clock rule.
 * Keep exceptions explicitly scoped by event, locality, year and month until
 * alternative traditions and years are independently reconciled.
 */
export type VerifiedMuhuratClosure={
  code:"marathi-chaturmas-2026-october";
  event:"wedding";
  year:2026;
  month:10;
  convention:"Customary Marathi marriage calendar";
  observedPeriod:{from:string;through:string};
  reason:"Chaturmas";
  headline:string;
  explanation:string;
  alternativesNote:string;
  sourceUrls:readonly string[];
  reviewedOn:string;
};

const MUMBAI_OCTOBER_2026:VerifiedMuhuratClosure={
  code:"marathi-chaturmas-2026-october",
  event:"wedding",
  year:2026,
  month:10,
  convention:"Customary Marathi marriage calendar",
  observedPeriod:{from:"2026-07-25",through:"2026-11-20"},
  reason:"Chaturmas",
  headline:"No traditional Marathi wedding Muhurat dates in Mumbai in October 2026",
  explanation:"October 2026 falls wholly inside the Chaturmas period observed by the reviewed customary Marathi wedding calendar. Under that convention, the month has no recommended marriage dates. A favorable Tithi, Nakshatra, Choghadiya or Abhijit clock period does not override this month-level observance rule. The former five-date shortlist was a lunar/daytime screening result, not a verified Vivaha Muhurat.",
  alternativesNote:"Marriage observances differ by community and tradition. Some calendars publish October dates using different methods, and not every household follows this Chaturmas restriction. This result specifically describes the customary Marathi convention, not a prohibition for everyone in Mumbai or India.",
  sourceUrls:[
    "https://www.hindu-blog.com/2025/05/marathi-vivah-muhurat-in-2026-marriage.html",
    "https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html?lang=en&rd=0",
    "https://www.livepanditji.com/muhurat/marriage/october-2026/",
  ],
  reviewedOn:"2026-10-13"
};

export function getVerifiedMuhuratClosure(event:string,year:number,month:number,city:Pick<City,"slug">):VerifiedMuhuratClosure|null{
  if(event==="wedding"&&year===2026&&month===10&&city.slug==="mumbai")return MUMBAI_OCTOBER_2026;
  return null;
}
